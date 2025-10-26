# 開発ガイド

## 🏗️ アーキテクチャ

### データフロー

```
国税庁API → NTAClient → DataCollector
Wikidata → WikidataClient → DataCollector  
Wikimedia → WikimediaClient → DataCollector
                ↓
            Supabase (PostgreSQL)
            R2 (画像保存)
```

## 📚 モジュール構成

### lib/data-collector.js

メインの収集ロジック。以下のクラスを含む:

- `NTAClient`: 国税庁APIクライアント
- `WikidataClient`: Wikidata APIクライアント
- `WikimediaClient`: Wikimedia Commons APIクライアント
- `DataCollector`: データ収集のメインクラス

### scripts/

実行用スクリプト:

- `collect-github-action.js`: GitHub Actions用
- `update-stats.js`: 統計情報更新
- `test-collect.js`: ローカルテスト

### config/

設定ファイル:

- `prefectures.js`: 都道府県マスタ
- `famous-companies.js`: 有名企業リスト

## 🧪 テスト

### ローカルテスト

```bash
npm test
```

### 特定企業をテスト

```javascript
import { DataCollector } from './lib/data-collector.js';

const collector = new DataCollector();
const data = await collector.collectCompany('5180001008846'); // トヨタ
console.log(data);
```

## 🚀 デプロイ

### GitHub Actionsで自動デプロイ

1. GitHubにプッシュ
2. Secretsを設定
3. Actionsタブで実行

## 🐛 デバッグ

### ログの確認

```bash
# ローカル
tail -f logs/collection-*.json

# GitHub Actions
Actions → ワークフロー → ログを表示
```

### よくあるエラー

#### API Rate Limit

```javascript
// delay を増やす
await collector.collectByPrefecture('13', { delay: 3000 });
```

#### Supabase接続エラー

```bash
# 環境変数を確認
echo $SUPABASE_URL
echo $SUPABASE_KEY
```

## 🔧 カスタマイズ

### 新しいデータソースを追加

```javascript
// lib/data-collector.js に新しいクライアントを追加
class NewClient {
  async getData(companyName) {
    // 実装
  }
}
```

### 収集する情報を追加

```javascript
// parseCompany メソッドを編集
parseCompany(raw) {
  return {
    ...existing,
    newField: raw.newField  // 新しいフィールド
  };
}
```

## 📝 貢献ガイドライン

1. フォークする
2. ブランチを作成: `git checkout -b feature/amazing-feature`
3. コミット: `git commit -m 'Add amazing feature'`
4. プッシュ: `git push origin feature/amazing-feature`
5. プルリクエストを作成

## 📄 ライセンス

MIT License
