// test-collect.js
// テスト実行用スクリプト

import { DataCollector } from './data-collector.js';

async function test() {
  console.log('🚀 データ収集テスト開始\n');
  
  const collector = new DataCollector();
  
  // トヨタ自動車を収集
  console.log('📊 トヨタ自動車を収集中...');
  const toyota = await collector.collectCompany('5180001008846');
  
  if (toyota) {
    console.log('\n✅ 収集成功！');
    console.log('企業名:', toyota.name);
    console.log('所在地:', toyota.prefecture, toyota.city);
    console.log('設立:', toyota.founded);
    console.log('従業員数:', toyota.employees);
    console.log('サイト:', toyota.website);
    console.log('ロゴ:', toyota.logo_url);
    console.log('データソース:', toyota.data_sources);
    
    // DB保存
    console.log('\n💾 データベースに保存中...');
    const saved = await collector.saveToDatabase(toyota);
    
    if (saved) {
      console.log('✅ 保存完了！');
      console.log('ID:', saved.id);
    }
  }
  
  console.log('\n🎉 テスト完了！');
}

test().catch(console.error);
