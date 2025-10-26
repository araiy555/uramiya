# ========================================
# GitHub Actions セットアップガイド
# ========================================

## 🎯 概要

GitHub Actionsで企業データを自動収集します。
- **完全無料**（月2,000分の無料枠）
- **毎日自動実行**
- **手動実行も可能**
- **並列処理で高速**

---

## 📦 ステップ1: リポジトリ準備（5分）

### 1-1. GitHubリポジトリを作成

```bash
# ローカルで
mkdir company-data-collector
cd company-data-collector
git init
```

### 1-2. ファイルを配置

```
company-data-collector/
├── .github/
│   └── workflows/
│       └── collect-data.yml       # ← ワークフロー
├── lib/
│   └── data-collector.js          # ← メインロジック
├── scripts/
│   ├── collect-github-action.js   # ← 実行スクリプト
│   └── update-stats.js            # ← 統計更新
├── package.json
├── .gitignore
└── README.md
```

### 1-3. .gitignore

```
node_modules/
.env
logs/
stats/
*.log
```

### 1-4. GitHubにプッシュ

```bash
git add .
git commit -m "初期セットアップ"
git branch -M main
git remote add origin https://github.com/あなた/company-data-collector.git
git push -u origin main
```

---

## 🔐 ステップ2: Secretsを設定（5分）

### 2-1. GitHubリポジトリの設定

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左メニュー **Secrets and variables** → **Actions**
4. **New repository secret** をクリック

### 2-2. 以下のSecretsを追加

| Name | Value | 取得方法 |
|------|-------|---------|
| `NTA_APP_ID` | 国税庁アプリID | https://www.houjin-bangou.nta.go.jp/webapi/ |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabaseプロジェクト設定 |
| `SUPABASE_KEY` | `eyJxxx...` | Supabase API Keys（anon key） |
| `R2_ENDPOINT` | `https://xxx.r2.cloudflarestorage.com` | Cloudflare R2設定 |
| `R2_ACCESS_KEY` | `xxx` | Cloudflare R2 API Token |
| `R2_SECRET_KEY` | `xxx` | Cloudflare R2 Secret Key |
| `R2_BUCKET` | `company-images` | R2バケット名 |
| `R2_PUBLIC_URL` | `https://pub-xxx.r2.dev` | R2公開URL |

**オプション:**
| Name | Value | 用途 |
|------|-------|------|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack通知 |

---

## ▶️ ステップ3: 実行（1分）

### 3-1. 手動実行

1. GitHubリポジトリページ
2. **Actions** タブ
3. 左側 **企業データ自動収集** をクリック
4. **Run workflow** をクリック
5. パラメータを入力:
   ```
   都道府県コード: 13 (東京都)
   ページ数: 1 (100社)
   間隔: 2000 (2秒)
   ```
6. **Run workflow** をクリック

### 3-2. 実行状況を確認

- 黄色の点: 実行中
- 緑のチェック: 成功
- 赤いバツ: 失敗

クリックすると詳細ログが見られます。

---

## 📊 ステップ4: 結果確認

### 4-1. GitHub Actionsのログ

- **Summary**タブ: 収集結果のサマリー
- **Artifacts**: ダウンロード可能な詳細ログ

### 4-2. Supabaseで確認

```sql
-- 収集された企業数
SELECT COUNT(*) FROM companies;

-- 最新の企業
SELECT name, prefecture, logo_url, created_at 
FROM companies 
ORDER BY created_at DESC 
LIMIT 10;

-- 都道府県別集計
SELECT prefecture, COUNT(*) 
FROM companies 
GROUP BY prefecture 
ORDER BY COUNT(*) DESC;
```

---

## ⚙️ スケジュール設定

### 毎日自動実行

`.github/workflows/collect-data.yml` の `schedule` セクション:

```yaml
schedule:
  # 毎日0時（UTC）= 日本時間9時
  - cron: '0 0 * * *'
```

### スケジュール例

```yaml
# 毎時実行
- cron: '0 * * * *'

# 毎日12時（UTC）= 日本時間21時
- cron: '0 12 * * *'

# 月曜日の朝9時（UTC 0時）
- cron: '0 0 * * 1'

# 毎週土曜日
- cron: '0 0 * * 6'
```

---

## 🚀 高速化: 並列実行

### 全国47都道府県を並列収集

手動実行時に `prefecture_code` を `all` に設定:

```
都道府県コード: all
```

→ 47都道府県が同時に実行される（約10分で完了）

### 仕組み

```yaml
strategy:
  max-parallel: 10  # 10並列
  matrix:
    prefecture: ['01', '02', ..., '47']
```

**注意:** GitHub Actionsの並列実行制限
- 無料: 20並列
- Pro: 40並列

---

## 💰 料金計算

### GitHub Actions無料枠

- **月2,000分無料**（Linux runner）
- 1回の実行: 約5-10分
- 月の実行回数: 200-400回

### 計算例

```
毎日1回実行（東京都100社）:
- 1回あたり: 5分
- 月30日: 5分 × 30日 = 150分

→ 無料枠内！
```

```
毎日全国47都道府県（47,000社）:
- 1回あたり: 10分
- 月30日: 10分 × 30日 = 300分

→ 無料枠内！
```

### 超過料金

月2,000分を超えた場合:
- $0.008/分 (約1.2円/分)

**結論: ほぼ無料で運用可能**

---

## 📈 運用例

### パターン1: 少量収集

```yaml
# 毎日東京都の企業100社
schedule:
  - cron: '0 0 * * *'

# 手動実行設定
prefecture_code: '13'
max_pages: 1
```

**月間収集数: 3,000社**

---

### パターン2: 中規模収集

```yaml
# 毎日東京都1,000社
schedule:
  - cron: '0 0 * * *'

prefecture_code: '13'
max_pages: 10
```

**月間収集数: 30,000社**

---

### パターン3: 大規模収集

```yaml
# 週1回全国47都道府県
schedule:
  - cron: '0 0 * * 0'  # 日曜日

# 手動実行で all 指定
```

**月間収集数: 200,000社以上**

---

## 🔍 モニタリング

### Slack通知設定

1. Slack Webhook URLを取得
2. GitHub Secrets に `SLACK_WEBHOOK_URL` を追加
3. ワークフローで自動通知

通知内容:
- 収集開始
- 収集完了
- エラー発生

---

## 🐛 トラブルシューティング

### エラー1: Secrets not found

```
Error: NTA_APP_ID is not defined
```

**解決:** GitHub Secretsを確認、正しく設定されているか

---

### エラー2: API rate limit

```
Error: Too many requests
```

**解決:** `delay` を増やす（3000ms以上）

---

### エラー3: Supabase connection failed

```
Error: fetch failed
```

**解決:** 
- SUPABASE_URL が正しいか確認
- Supabaseプロジェクトが起動しているか確認

---

### エラー4: Workflow失敗

```
Process completed with exit code 1
```

**解決:**
1. Actionsのログを確認
2. エラーメッセージを読む
3. 該当部分を修正
4. 再実行

---

## 📝 ログの見方

### GitHub Actionsログ

```
🚀 GitHub Actions データ収集開始
📍 都道府県: 東京都 (13)
📄 ページ数: 1
⏱️ 待機時間: 2000ms

収集開始: 5180001008846
✓ 国税庁: トヨタ自動車株式会社
✓ Wikidata: Q53268
✓ ロゴ発見: Toyota.svg
✓ ロゴアップロード完了: https://pub-xxx.r2.dev/logos/5180001008846.png
✓ DB保存完了: 01234567-89ab-cdef-0123-456789abcdef

進捗: 1/100
...

✅ 収集完了！
```

---

## 🎯 次のステップ

1. **まず手動実行でテスト**
   - 東京都1ページ（100社）
   - ログを確認
   - Supabaseでデータ確認

2. **スケジュール実行に切り替え**
   - 毎日自動実行
   - 1週間様子を見る

3. **規模を拡大**
   - ページ数を増やす
   - 複数都道府県に拡大

4. **モニタリング整備**
   - Slack通知
   - エラーアラート

---

## ✅ チェックリスト

セットアップ完了の確認:

- [ ] GitHubリポジトリ作成
- [ ] ファイルをpush
- [ ] Secretsを全て設定
- [ ] Supabaseテーブル作成
- [ ] R2バケット作成
- [ ] 手動実行でテスト
- [ ] ログ確認
- [ ] データがSupabaseに保存された
- [ ] スケジュール設定

---

## 🚀 今すぐ始める

```bash
# 1. リポジトリ作成
git init
git add .
git commit -m "初期セットアップ"
git push

# 2. Secrets設定（GitHubで）

# 3. 手動実行（GitHubで）
Actions → Run workflow

# 完了！
```

---

質問があれば聞いてください！
