# ========================================
# 完全なプロジェクト構造
# ========================================

company-data-collector/
│
├── .github/
│   └── workflows/
│       ├── collect-data.yml          # メインの収集ワークフロー
│       ├── collect-weekly.yml        # 週次の全国収集
│       └── update-stats.yml          # 統計更新のみ
│
├── lib/
│   ├── data-collector.js             # メインのデータ収集ロジック
│   ├── nta-client.js                 # 国税庁APIクライアント
│   ├── wikidata-client.js            # Wikidata APIクライアント
│   ├── wikimedia-client.js           # Wikimedia Commons クライアント
│   └── database.js                   # Supabase操作
│
├── scripts/
│   ├── collect-github-action.js      # GitHub Actions実行用
│   ├── update-stats.js               # 統計情報更新
│   ├── test-collect.js               # ローカルテスト用
│   └── setup/
│       ├── init-database.js          # DB初期化
│       └── seed-famous-companies.js  # 有名企業の初期データ
│
├── config/
│   ├── prefectures.js                # 都道府県マスタ
│   ├── famous-companies.js           # 有名企業の法人番号リスト
│   └── categories.js                 # 業種カテゴリ
│
├── docs/
│   ├── README.md                     # メインドキュメント
│   ├── SETUP.md                      # セットアップガイド
│   ├── GITHUB-ACTIONS.md             # GitHub Actions詳細
│   ├── API.md                        # API仕様
│   └── DEVELOPMENT.md                # 開発ガイド
│
├── logs/                             # 収集ログ（gitignore）
│   └── .gitkeep
│
├── stats/                            # 統計情報（gitignore）
│   └── .gitkeep
│
├── tests/
│   ├── unit/
│   │   ├── nta-client.test.js
│   │   └── wikidata-client.test.js
│   └── integration/
│       └── collect.test.js
│
├── .env.example                      # 環境変数のテンプレート
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

========================================
