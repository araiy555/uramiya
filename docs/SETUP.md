# ========================================
# 完全セットアップガイド
# ========================================

## 📁 ステップ1: プロジェクト構造を作成

### 方法A: 自動セットアップ（推奨）

```bash
# setup-project.sh を実行
chmod +x setup-project.sh
./setup-project.sh
```

→ ディレクトリ構造が自動で作成されます

---

### 方法B: 手動セットアップ

```bash
# プロジェクトディレクトリを作成
mkdir company-data-collector
cd company-data-collector

# ディレクトリ構造を作成
mkdir -p .github/workflows
mkdir -p lib
mkdir -p scripts/setup
mkdir -p config
mkdir -p docs
mkdir -p logs
mkdir -p stats
mkdir -p tests/unit
mkdir -p tests/integration

# 空ディレクトリ用
touch logs/.gitkeep
touch stats/.gitkeep
```

---

## 📥 ステップ2: ファイルを配置

ダウンロードしたファイルを以下のように配置:

### .github/workflows/

```bash
# ワークフローファイル
cp .github-workflows-collect-data.yml .github/workflows/collect-data.yml
```

### lib/

```bash
# メインのデータ収集ロジック
cp data-collector.js lib/data-collector.js

# 将来的に分割する場合:
# - lib/nta-client.js
# - lib/wikidata-client.js
# - lib/wikimedia-client.js
# - lib/database.js
```

### scripts/

```bash
# 実行スクリプト
cp scripts-collect-github-action.js scripts/collect-github-action.js
cp scripts-update-stats.js scripts/update-stats.js
cp test-collect.js scripts/test-collect.js
```

### config/

```bash
# 設定ファイル
cp config-prefectures.js config/prefectures.js
cp config-famous-companies.js config/famous-companies.js
```

### docs/

```bash
# ドキュメント
cp README-setup.md docs/SETUP.md
cp GITHUB-ACTIONS-SETUP.md docs/GITHUB-ACTIONS.md
cp PROJECT-STRUCTURE.md docs/PROJECT-STRUCTURE.md
```

### ルートディレクトリ

```bash
# 設定ファイル
cp .env.example .env.example
cp package.json package.json
cp .gitignore .gitignore
cp README.md README.md
```

---

## 📦 ステップ3: 依存関係をインストール

```bash
npm install
```

---

## 🔐 ステップ4: 環境変数を設定

```bash
# .envファイルを作成
cp .env.example .env

# エディタで編集
nano .env
# または
code .env
```

必要な値を入力:
- NTA_APP_ID
- SUPABASE_URL
- SUPABASE_KEY
- R2_ENDPOINT
- R2_ACCESS_KEY
- R2_SECRET_KEY
- R2_BUCKET
- R2_PUBLIC_URL

---

## 🗄️ ステップ5: データベースをセットアップ

### 5-1. Supabaseでテーブル作成

1. Supabaseダッシュボードを開く
2. SQL Editor をクリック
3. `supabase-schema.sql` の内容をコピペ
4. Run をクリック

---

## 🧪 ステップ6: テスト実行

```bash
# ローカルでテスト
npm test

# または
node scripts/test-collect.js
```

成功すれば:
```
✅ 収集成功！
企業名: トヨタ自動車株式会社
所在地: 愛知県 豊田市
...
```

---

## 🚀 ステップ7: GitHubにプッシュ

```bash
# Git初期化（まだの場合）
git init

# 全ファイルを追加
git add .

# コミット
git commit -m "Initial commit: プロジェクトセットアップ"

# リモートリポジトリを追加
git remote add origin https://github.com/あなた/company-data-collector.git

# プッシュ
git branch -M main
git push -u origin main
```

---

## 🔐 ステップ8: GitHub Secretsを設定

1. GitHubリポジトリページを開く
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** をクリック
4. 以下を追加:

| Name | Value |
|------|-------|
| `NTA_APP_ID` | （国税庁のアプリID） |
| `SUPABASE_URL` | （SupabaseのURL） |
| `SUPABASE_KEY` | （Supabaseの anon key） |
| `R2_ENDPOINT` | （R2のエンドポイント） |
| `R2_ACCESS_KEY` | （R2のアクセスキー） |
| `R2_SECRET_KEY` | （R2のシークレットキー） |
| `R2_BUCKET` | `company-images` |
| `R2_PUBLIC_URL` | （R2の公開URL） |

---

## ▶️ ステップ9: GitHub Actionsを実行

### 手動実行

1. GitHubリポジトリページ
2. **Actions** タブ
3. **企業データ自動収集** をクリック
4. **Run workflow** をクリック
5. パラメータを入力:
   - 都道府県コード: `13` (東京都)
   - ページ数: `1` (100社)
   - 間隔: `2000` (2秒)
6. **Run workflow** をクリック

### 自動実行

毎日0時（UTC）= 日本時間9時に自動実行されます。

---

## ✅ 完了チェックリスト

- [ ] ディレクトリ構造を作成
- [ ] 全ファイルを配置
- [ ] npm install 実行
- [ ] .env ファイル作成・編集
- [ ] Supabaseテーブル作成
- [ ] ローカルテスト成功
- [ ] GitHubにプッシュ
- [ ] GitHub Secrets設定
- [ ] GitHub Actions手動実行
- [ ] データがSupabaseに保存された

---

## 🎯 完成したプロジェクト構造

```
company-data-collector/
├── .github/
│   └── workflows/
│       └── collect-data.yml          ✅
├── lib/
│   └── data-collector.js             ✅
├── scripts/
│   ├── collect-github-action.js      ✅
│   ├── update-stats.js               ✅
│   └── test-collect.js               ✅
├── config/
│   ├── prefectures.js                ✅
│   └── famous-companies.js           ✅
├── docs/
│   ├── SETUP.md                      ✅
│   ├── GITHUB-ACTIONS.md             ✅
│   └── PROJECT-STRUCTURE.md          ✅
├── logs/
│   └── .gitkeep                      ✅
├── stats/
│   └── .gitkeep                      ✅
├── .env.example                      ✅
├── .gitignore                        ✅
├── package.json                      ✅
└── README.md                         ✅
```

---

## 🚀 次のステップ

### 1. まず有名企業100社を収集

```javascript
// scripts/seed-famous-companies.js を作成して実行
import { DataCollector } from '../lib/data-collector.js';
import { getCorporateNumbers } from '../config/famous-companies.js';

const collector = new DataCollector();
const numbers = getCorporateNumbers();

await collector.collectBatch(numbers);
```

### 2. 東京都の企業1,000社を収集

GitHub Actionsで手動実行:
- 都道府県コード: `13`
- ページ数: `10`

### 3. 全国47都道府県を収集

GitHub Actionsで手動実行:
- 都道府県コード: `all`

→ 並列で高速収集！

---

## 💡 トラブルシューティング

### エラー: Cannot find module

```bash
# package.json に "type": "module" があるか確認
# ない場合は追加
```

### エラー: NTA_APP_ID is not defined

```bash
# .env ファイルが正しく作成されているか確認
# GitHub Secrets が設定されているか確認
```

### エラー: Supabase connection failed

```bash
# SUPABASE_URL と SUPABASE_KEY を確認
# Supabaseプロジェクトが起動しているか確認
```

---

## 📞 サポート

質問があれば教えてください！

次のステップ:
1. ファイル配置
2. テスト実行
3. GitHub Actions実行
