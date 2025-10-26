// ========================================
// データベース初期化スクリプト
// scripts/setup/init-database.js
// ========================================

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 環境変数が設定されていません');
  console.error('SUPABASE_URL と SUPABASE_KEY を .env に設定してください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initDatabase() {
  console.log('🚀 データベースを初期化します\n');
  
  try {
    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, '../../docs/supabase-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📄 SQLファイルを読み込みました');
    console.log('⚠️  注意: このスクリプトはSupabase CLIまたはダッシュボードでSQLを実行する必要があります\n');
    
    // テーブルの存在確認
    const { data: tables, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ companiesテーブルが存在しません');
      console.log('\n次の手順でテーブルを作成してください:');
      console.log('1. Supabaseダッシュボードを開く');
      console.log('2. SQL Editor をクリック');
      console.log(`3. ${sqlPath} の内容をコピー&ペースト`);
      console.log('4. Run をクリック');
      console.log('');
      process.exit(1);
    }
    
    console.log('✅ companiesテーブルが存在します');
    
    // 統計を表示
    const { count } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 現在のデータ:`);
    console.log(`企業数: ${count || 0}社`);
    
    console.log('\n✅ データベースの確認が完了しました！');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

initDatabase();
