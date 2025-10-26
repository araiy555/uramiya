// ========================================
// 統計情報更新スクリプト
// scripts/update-stats.js
// ========================================

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 統計情報を取得
async function getStats() {
  console.log('📊 統計情報を取得中...\n');
  
  // 企業総数
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });
  
  // ロゴ付き企業数
  const { count: withLogo } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .not('logo_url', 'is', null);
  
  // Wikidata連携済み企業数
  const { count: withWikidata } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .not('wikidata_id', 'is', null);
  
  // 都道府県別集計
  const { data: byPrefecture } = await supabase
    .from('companies')
    .select('prefecture')
    .then(({ data }) => {
      const counts = {};
      data?.forEach(c => {
        if (c.prefecture) {
          counts[c.prefecture] = (counts[c.prefecture] || 0) + 1;
        }
      });
      return { data: counts };
    });
  
  // ステータス別集計
  const { data: byStatus } = await supabase
    .from('companies')
    .select('status')
    .then(({ data }) => {
      const counts = {};
      data?.forEach(c => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
      return { data: counts };
    });
  
  return {
    totalCompanies,
    withLogo,
    withWikidata,
    logoRate: totalCompanies ? (withLogo / totalCompanies * 100).toFixed(1) : 0,
    wikidataRate: totalCompanies ? (withWikidata / totalCompanies * 100).toFixed(1) : 0,
    byPrefecture,
    byStatus,
    updatedAt: new Date().toISOString()
  };
}

// 統計情報を表示
function displayStats(stats) {
  console.log('📈 統計情報\n');
  console.log(`総企業数: ${stats.totalCompanies.toLocaleString()}社`);
  console.log(`ロゴ付き: ${stats.withLogo.toLocaleString()}社 (${stats.logoRate}%)`);
  console.log(`Wikidata連携: ${stats.withWikidata.toLocaleString()}社 (${stats.wikidataRate}%)`);
  
  console.log('\n都道府県別 TOP 10:');
  const sorted = Object.entries(stats.byPrefecture)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sorted.forEach(([prefecture, count], i) => {
    console.log(`${i + 1}. ${prefecture}: ${count.toLocaleString()}社`);
  });
  
  console.log('\nステータス別:');
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    console.log(`${status}: ${count.toLocaleString()}社`);
  });
}

// GitHub Actionsサマリーに出力
function outputSummary(stats) {
  const summary = `
## 📊 データベース統計情報

### 全体
- **総企業数**: ${stats.totalCompanies.toLocaleString()}社
- **ロゴ付き**: ${stats.withLogo.toLocaleString()}社 (${stats.logoRate}%)
- **Wikidata連携**: ${stats.withWikidata.toLocaleString()}社 (${stats.wikidataRate}%)

### 都道府県別 TOP 10
${Object.entries(stats.byPrefecture)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([pref, count], i) => `${i + 1}. ${pref}: ${count.toLocaleString()}社`)
  .join('\n')}

### ステータス
${Object.entries(stats.byStatus)
  .map(([status, count]) => `- ${status}: ${count.toLocaleString()}社`)
  .join('\n')}

---
更新時刻: ${new Date().toLocaleString('ja-JP')}
`;
  
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  
  console.log(summary);
}

// 統計情報をファイルに保存
function saveStats(stats) {
  const statsDir = path.join(process.cwd(), 'stats');
  if (!fs.existsSync(statsDir)) {
    fs.mkdirSync(statsDir, { recursive: true });
  }
  
  const filename = 'latest-stats.json';
  const filepath = path.join(statsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(stats, null, 2));
  
  console.log(`\n📄 統計情報を保存: ${filepath}`);
}

// メイン処理
async function main() {
  try {
    const stats = await getStats();
    
    displayStats(stats);
    outputSummary(stats);
    saveStats(stats);
    
    console.log('\n✅ 統計情報更新完了！');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

main();
