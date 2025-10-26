// ========================================
// GitHub Actions用データ収集スクリプト
// scripts/collect-github-action.js
// ========================================

import { DataCollector } from '../lib/data-collector.js';
import * as fs from 'fs';
import * as path from 'path';

// コマンドライン引数をパース
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    prefecture: '13',  // デフォルト: 東京都
    pages: 1,
    delay: 2000
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--prefecture=')) {
      options.prefecture = arg.split('=')[1];
    }
    if (arg.startsWith('--pages=')) {
      options.pages = parseInt(arg.split('=')[1]);
    }
    if (arg.startsWith('--delay=')) {
      options.delay = parseInt(arg.split('=')[1]);
    }
  });
  
  return options;
}

// 都道府県名マップ
const PREFECTURE_NAMES = {
  '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県',
  '06': '山形県', '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県',
  '11': '埼玉県', '12': '千葉県', '13': '東京都', '14': '神奈川県', '15': '新潟県',
  '16': '富山県', '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
  '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県', '25': '滋賀県',
  '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
  '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県',
  '36': '徳島県', '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
  '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県', '45': '宮崎県',
  '46': '鹿児島県', '47': '沖縄県'
};

// ログディレクトリを作成
function ensureLogDir() {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}

// 結果をJSONファイルに保存
function saveResults(results, options) {
  const logDir = ensureLogDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `collection-${options.prefecture}-${timestamp}.json`;
  const filepath = path.join(logDir, filename);
  
  const data = {
    timestamp: new Date().toISOString(),
    prefecture_code: options.prefecture,
    prefecture_name: PREFECTURE_NAMES[options.prefecture],
    options,
    results
  };
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  
  console.log(`\n📄 結果を保存: ${filepath}`);
}

// GitHub Actions用のサマリーを出力
function outputSummary(results, options) {
  const summary = `
## 📊 データ収集結果

### 対象
- **都道府県**: ${PREFECTURE_NAMES[options.prefecture]} (${options.prefecture})
- **ページ数**: ${options.pages}

### 結果
- ✅ **成功**: ${results.success.length}社
- ❌ **失敗**: ${results.failed.length}社
- ⏭️ **スキップ**: ${results.skipped.length}社

### 詳細
${results.success.length > 0 ? `
成功した企業:
${results.success.slice(0, 10).join(', ')}${results.success.length > 10 ? '...' : ''}
` : ''}

${results.failed.length > 0 ? `
失敗した企業:
${results.failed.slice(0, 10).join(', ')}${results.failed.length > 10 ? '...' : ''}
` : ''}

---
実行時刻: ${new Date().toLocaleString('ja-JP')}
`;
  
  // GitHub ActionsのSummaryに出力
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  
  console.log(summary);
}

// エラー時の通知
function handleError(error, options) {
  const errorMessage = `
## ❌ データ収集エラー

### 対象
- **都道府県**: ${PREFECTURE_NAMES[options.prefecture]} (${options.prefecture})

### エラー内容
\`\`\`
${error.message}
${error.stack}
\`\`\`

---
実行時刻: ${new Date().toLocaleString('ja-JP')}
`;
  
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, errorMessage);
  }
  
  console.error(errorMessage);
  process.exit(1);
}

// メイン処理
async function main() {
  const options = parseArgs();
  
  console.log('🚀 GitHub Actions データ収集開始');
  console.log(`📍 都道府県: ${PREFECTURE_NAMES[options.prefecture]} (${options.prefecture})`);
  console.log(`📄 ページ数: ${options.pages}`);
  console.log(`⏱️ 待機時間: ${options.delay}ms\n`);
  
  try {
    const collector = new DataCollector();
    
    // データ収集実行
    const companies = await collector.collectByPrefecture(options.prefecture, {
      maxPages: options.pages,
      delay: options.delay
    });
    
    // 結果を集計
    const results = {
      success: companies,
      failed: [],
      skipped: []
    };
    
    // 結果を保存
    saveResults(results, options);
    
    // サマリー出力
    outputSummary(results, options);
    
    console.log('\n✅ 収集完了！');
    
  } catch (error) {
    handleError(error, options);
  }
}

// 実行
main();
