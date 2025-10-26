// ========================================
// 完全自動データ収集システム
// 国税庁 + Wikidata + Wikimedia Commons
// ========================================

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ========================================
// 設定
// ========================================

const NTA_APP_ID = process.env.NTA_APP_ID;  // 国税庁アプリケーションID
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;  // https://pub-xxx.r2.dev

// クライアント初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

// ========================================
// 国税庁APIから企業情報を取得
// ========================================

class NTAClient {
  constructor(appId) {
    this.appId = appId;
    this.baseUrl = 'https://api.houjin-bangou.nta.go.jp/4';
  }
  
  // 法人番号で企業を取得
  async getByNumber(corporateNumber) {
    const url = `${this.baseUrl}/num?id=${this.appId}&number=${corporateNumber}&type=12`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.corporations && data.corporations.length > 0) {
      return this.parseCompany(data.corporations[0]);
    }
    
    return null;
  }
  
  // 企業名で検索
  async searchByName(name, prefecture = null) {
    let url = `${this.baseUrl}/name?id=${this.appId}&name=${encodeURIComponent(name)}&type=01`;
    
    if (prefecture) {
      url += `&prefecture=${prefecture}`;  // 都道府県コード（01-47）
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.corporations) {
      return data.corporations.map(c => this.parseCompany(c));
    }
    
    return [];
  }
  
  // 都道府県の企業を取得（ページング対応）
  async getByPrefecture(prefectureCode, options = {}) {
    const {
      page = 1,
      limit = 100  // 最大100件
    } = options;
    
    const url = `${this.baseUrl}/name?id=${this.appId}&prefecture=${prefectureCode}&type=01&from=${(page - 1) * limit + 1}&to=${page * limit}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      companies: data.corporations ? data.corporations.map(c => this.parseCompany(c)) : [],
      hasMore: data.corporations && data.corporations.length === limit
    };
  }
  
  parseCompany(raw) {
    return {
      corporateNumber: raw.corporateNumber,
      name: raw.name,
      nameKana: raw.furigana || '',
      prefecture: raw.prefectureName,
      city: raw.cityName,
      address: raw.streetNumber,
      postalCode: raw.postCode,
      foundedDate: raw.dateOfAssignmentOfCorporateNumber,  // 法人番号指定日
      status: raw.process === '01' ? 'active' : 'inactive',
      dataSource: '国税庁法人番号公表サイト'
    };
  }
  
  // 1秒待つ（API制限対策）
  async sleep(ms = 1000) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ========================================
// Wikidata APIクライアント
// ========================================

class WikidataClient {
  constructor() {
    this.baseUrl = 'https://www.wikidata.org/w/api.php';
  }
  
  // 企業を検索
  async searchCompany(name) {
    const url = `${this.baseUrl}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=ja&format=json&origin=*`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.search || [];
  }
  
  // エンティティの詳細を取得
  async getEntity(qId) {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${qId}.json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.entities || !data.entities[qId]) {
      return null;
    }
    
    const entity = data.entities[qId];
    const claims = entity.claims || {};
    
    return {
      qId,
      name: this.getLabel(entity, 'ja') || this.getLabel(entity, 'en'),
      description: this.getDescription(entity, 'ja'),
      
      // P31: instance of（企業かどうか）
      type: this.getClaim(claims, 'P31'),
      
      // P571: 設立日
      founded: this.getClaimValue(claims, 'P571', 'time'),
      
      // P159: 本社所在地
      headquarters: this.getClaim(claims, 'P159'),
      
      // P112: 創業者
      founders: this.getClaimArray(claims, 'P112'),
      
      // P1128: 従業員数
      employees: this.getClaimValue(claims, 'P1128', 'quantity'),
      
      // P2139: 総収入
      revenue: this.getClaimValue(claims, 'P2139', 'quantity'),
      
      // P18: 画像
      image: this.getClaimValue(claims, 'P18', 'string'),
      
      // P154: ロゴ
      logo: this.getClaimValue(claims, 'P154', 'string'),
      
      // P856: 公式サイト
      website: this.getClaimValue(claims, 'P856', 'string'),
      
      // P452: 業種
      industry: this.getClaim(claims, 'P452')
    };
  }
  
  getLabel(entity, lang) {
    return entity.labels?.[lang]?.value;
  }
  
  getDescription(entity, lang) {
    return entity.descriptions?.[lang]?.value;
  }
  
  getClaim(claims, property) {
    return claims[property]?.[0]?.mainsnak?.datavalue?.value?.id;
  }
  
  getClaimValue(claims, property, type) {
    const claim = claims[property]?.[0]?.mainsnak?.datavalue?.value;
    if (!claim) return null;
    
    if (type === 'time') return claim.time;
    if (type === 'quantity') return claim.amount;
    if (type === 'string') return claim;
    
    return claim;
  }
  
  getClaimArray(claims, property) {
    if (!claims[property]) return [];
    return claims[property].map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
  }
}

// ========================================
// Wikimedia Commons 画像クライアント
// ========================================

class WikimediaClient {
  async getImageUrl(filename) {
    if (!filename) return null;
    
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const pages = data.query?.pages;
      if (!pages) return null;
      
      const page = Object.values(pages)[0];
      return page.imageinfo?.[0]?.url || null;
    } catch (e) {
      console.error('Wikimedia画像取得エラー:', e);
      return null;
    }
  }
  
  // 画像をダウンロードしてR2にアップロード
  async downloadAndUpload(filename, targetKey) {
    const imageUrl = await this.getImageUrl(filename);
    if (!imageUrl) return null;
    
    try {
      // 画像をダウンロード
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // R2にアップロード
      await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: targetKey,
        Body: buffer,
        ContentType: response.headers.get('content-type'),
        CacheControl: 'max-age=31536000'
      }));
      
      return `${R2_PUBLIC_URL}/${targetKey}`;
    } catch (e) {
      console.error('画像アップロードエラー:', e);
      return null;
    }
  }
}

// ========================================
// データ収集メインクラス
// ========================================

class DataCollector {
  constructor() {
    this.ntaClient = new NTAClient(NTA_APP_ID);
    this.wikidataClient = new WikidataClient();
    this.wikimediaClient = new WikimediaClient();
  }
  
  // 企業の完全なデータを収集
  async collectCompany(corporateNumber) {
    console.log(`\n収集開始: ${corporateNumber}`);
    
    // 1. 国税庁から基本情報
    const ntaData = await this.ntaClient.getByNumber(corporateNumber);
    if (!ntaData) {
      console.log('企業が見つかりませんでした');
      return null;
    }
    
    console.log(`✓ 国税庁: ${ntaData.name}`);
    
    // 2. Wikidataで検索
    await this.ntaClient.sleep(500);
    const wikidataSearch = await this.wikidataClient.searchCompany(ntaData.name);
    
    let wikidataData = null;
    let logoUrl = null;
    
    if (wikidataSearch.length > 0) {
      const qId = wikidataSearch[0].id;
      console.log(`✓ Wikidata: ${qId}`);
      
      await this.ntaClient.sleep(500);
      wikidataData = await this.wikidataClient.getEntity(qId);
      
      // 3. ロゴ画像をダウンロード
      if (wikidataData?.logo) {
        console.log(`✓ ロゴ発見: ${wikidataData.logo}`);
        await this.ntaClient.sleep(500);
        
        const logoKey = `logos/${corporateNumber}.png`;
        logoUrl = await this.wikimediaClient.downloadAndUpload(
          wikidataData.logo,
          logoKey
        );
        
        if (logoUrl) {
          console.log(`✓ ロゴアップロード完了: ${logoUrl}`);
        }
      }
    }
    
    // 4. データを統合
    const merged = {
      corporate_number: ntaData.corporateNumber,
      name: ntaData.name,
      name_kana: ntaData.nameKana,
      
      prefecture: ntaData.prefecture,
      city: ntaData.city,
      address: ntaData.address,
      postal_code: ntaData.postalCode,
      
      founded: wikidataData?.founded || ntaData.foundedDate,
      employees: wikidataData?.employees ? parseInt(wikidataData.employees) : null,
      revenue: wikidataData?.revenue ? parseInt(wikidataData.revenue) : null,
      
      website: wikidataData?.website,
      logo_url: logoUrl,
      
      description: wikidataData?.description,
      
      status: ntaData.status,
      
      wikidata_id: wikidataData?.qId,
      
      data_sources: ['国税庁', wikidataData ? 'Wikidata' : null, logoUrl ? 'Wikimedia Commons' : null]
        .filter(Boolean)
        .join(', '),
      
      created_at: new Date(),
      updated_at: new Date()
    };
    
    return merged;
  }
  
  // Supabaseに保存
  async saveToDatabase(companyData) {
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();
    
    if (error) {
      console.error('保存エラー:', error);
      return null;
    }
    
    console.log(`✓ DB保存完了: ${data.id}`);
    return data;
  }
  
  // 既に存在するかチェック
  async exists(corporateNumber) {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('corporate_number', corporateNumber)
      .limit(1);
    
    return data && data.length > 0;
  }
  
  // 複数企業を一括収集
  async collectBatch(corporateNumbers, options = {}) {
    const { delay = 2000 } = options;  // デフォルト2秒待つ
    
    const results = {
      success: [],
      failed: [],
      skipped: []
    };
    
    for (let i = 0; i < corporateNumbers.length; i++) {
      const number = corporateNumbers[i];
      
      console.log(`\n進捗: ${i + 1}/${corporateNumbers.length}`);
      
      try {
        // 既に存在するかチェック
        const alreadyExists = await this.exists(number);
        if (alreadyExists) {
          console.log(`スキップ: ${number} (既存)`);
          results.skipped.push(number);
          continue;
        }
        
        // データ収集
        const companyData = await this.collectCompany(number);
        
        if (companyData) {
          // DB保存
          const saved = await this.saveToDatabase(companyData);
          if (saved) {
            results.success.push(number);
          } else {
            results.failed.push(number);
          }
        } else {
          results.failed.push(number);
        }
        
        // 次のリクエストまで待つ
        if (i < corporateNumbers.length - 1) {
          await this.ntaClient.sleep(delay);
        }
        
      } catch (e) {
        console.error(`エラー: ${number}`, e);
        results.failed.push(number);
      }
    }
    
    return results;
  }
  
  // 都道府県の企業を全件収集
  async collectByPrefecture(prefectureCode, options = {}) {
    const { maxPages = 10, delay = 2000 } = options;
    
    console.log(`\n都道府県コード ${prefectureCode} の企業を収集開始`);
    
    const allCompanies = [];
    
    for (let page = 1; page <= maxPages; page++) {
      console.log(`\nページ ${page}/${maxPages}`);
      
      const { companies, hasMore } = await this.ntaClient.getByPrefecture(
        prefectureCode,
        { page, limit: 100 }
      );
      
      if (companies.length === 0) {
        console.log('これ以上企業がありません');
        break;
      }
      
      console.log(`${companies.length}社取得`);
      
      // 法人番号のリスト
      const numbers = companies.map(c => c.corporateNumber);
      
      // 一括収集
      const results = await this.collectBatch(numbers, { delay });
      
      allCompanies.push(...results.success);
      
      console.log(`成功: ${results.success.length}, 失敗: ${results.failed.length}, スキップ: ${results.skipped.length}`);
      
      if (!hasMore) {
        console.log('最終ページに到達');
        break;
      }
      
      // 次のページまで待つ
      await this.ntaClient.sleep(delay);
    }
    
    console.log(`\n完了: 合計 ${allCompanies.length}社を収集`);
    
    return allCompanies;
  }
}

// ========================================
// 使用例
// ========================================

const collector = new DataCollector();

// 例1: 特定企業を収集
async function example1() {
  const toyotaNumber = '5180001008846';  // トヨタ自動車
  const companyData = await collector.collectCompany(toyotaNumber);
  
  if (companyData) {
    await collector.saveToDatabase(companyData);
  }
}

// 例2: 複数企業を収集
async function example2() {
  const numbers = [
    '5180001008846',  // トヨタ自動車
    '7010001008844',  // ソニーグループ
    '9010001008752',  // パナソニック
    '1010401039252',  // 楽天グループ
    '9011101021173'   // 東京エレクトロン
  ];
  
  const results = await collector.collectBatch(numbers);
  console.log('結果:', results);
}

// 例3: 東京都の企業を1000社収集
async function example3() {
  const companies = await collector.collectByPrefecture(
    '13',  // 東京都
    { maxPages: 10, delay: 2000 }
  );
  
  console.log(`収集完了: ${companies.length}社`);
}

// ========================================
// Vercel Cron Jobsで自動実行
// ========================================

// /api/cron/collect-data.js
export default async function handler(req, res) {
  // 認証チェック
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const collector = new DataCollector();
  
  // 毎日100社ずつ収集
  const results = await collector.collectByPrefecture('13', {
    maxPages: 1,  // 100社
    delay: 1000
  });
  
  return res.status(200).json({
    success: true,
    collected: results.length
  });
}

export {
  DataCollector,
  NTAClient,
  WikidataClient,
  WikimediaClient
};
