# 企業データ自動収集システム

国税庁 + Wikidata + Wikimedia Commons から企業データを自動収集し、Supabase + Cloudflare R2 に保存します。

## 🚀 特徴

- ✅ **完全無料**: 公開APIのみ使用
- ✅ **自動収集**: GitHub Actionsで毎日自動実行
- ✅ **並列処理**: 47都道府県を同時収集
- ✅ **画像対応**: ロゴを自動ダウンロード

## 📊 データソース

1. **国税庁法人番号公表サイト** - 日本の全法人情報
2. **Wikidata** - 企業の詳細情報（設立日、従業員数など）
3. **Wikimedia Commons** - ロゴ画像（CCライセンス）

## 🏗️ 技術スタック

- **データベース**: Supabase (PostgreSQL)
- **画像保存**: Cloudflare R2
- **自動実行**: GitHub Actions
- **言語**: Node.js (ES Modules)

## 📁 ディレクトリ構造

```
company-data-collector/
├── .github/workflows/    # GitHub Actionsワークフロー
├── lib/                  # コアロジック
├── scripts/              # 実行スクリプト
├── config/               # 設定ファイル
├── docs/                 # ドキュメント
└── tests/                # テスト
```

## 🚀 クイックスタート

### 1. 依存関係をインストール

```bash
npm install
```

### 2. 環境変数を設定

```bash
cp .env.example .env
# .env を編集
```

### 3. データベースを初期化

Supabaseで `docs/supabase-schema.sql` を実行

### 4. テスト実行

```bash
npm test
```

## 📖 詳細ドキュメント

- [セットアップガイド](docs/SETUP.md)
- [GitHub Actions設定](docs/GITHUB-ACTIONS.md)
- [開発ガイド](docs/DEVELOPMENT.md)

## 📊 収集実績

GitHub Actionsを実行すると自動で更新されます。

## 🤝 貢献

プルリクエスト歓迎！

## 📄 ライセンス

MIT License

## 🙏 データ提供

- 国税庁法人番号公表サイト
- Wikidata (CC0 1.0)
- Wikimedia Commons (各画像のライセンスに従う)
