// ========================================
// 有名企業の初期データ投入スクリプト
// scripts/setup/seed-famous-companies.js
// ========================================

import { DataCollector } from '../../lib/data-collector.js';
import { FAMOUS_COMPANIES } from '../../config/famous-companies.js';

async function seedFamousCompanies() {
  console.log('🚀 有名企業のデータ収集を開始します\n');
  console.log(`対象: ${FAMOUS_COMPANIES.length}社\n`);
  
  const collector = new DataCollector();
  
  const numbers = FAMOUS_COMPANIES.map(c => c.number);
  
  try {
    const results = await collector.collectBatch(numbers, {
      delay: 2000  // 2秒待つ
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 収集結果');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功: ${results.success.length}社`);
    console.log(`❌ 失敗: ${results.failed.length}社`);
    console.log(`⏭️  スキップ: ${results.skipped.length}社`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (results.failed.length > 0) {
      console.log('失敗した企業:');
      results.failed.forEach(num => {
        const company = FAMOUS_COMPANIES.find(c => c.number === num);
        console.log(`  - ${company?.name || num}`);
      });
    }
    
    console.log('\n✅ 初期データの投入が完了しました！');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

seedFamousCompanies();
