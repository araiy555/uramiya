# 分散型2ch (Nostr版)

完全分散型の匿名掲示板です。Nostrプロトコルを使用しているため、中央サーバーがなく、検閲されません。

## 🌟 特徴

- ✅ **完全分散型** - 中央サーバーなし
- ✅ **検閲なし** - 誰も投稿を削除できない
- ✅ **匿名性** - メールアドレス不要
- ✅ **画像投稿対応** - Imgurを使用
- ✅ **6つの板** - ニュース、VIP、プログラミング、生活、アニメ、ゲーム
- ✅ **2ch風デザイン** - 懐かしいUI

## 🚀 インストール

### 必要なもの

- Node.js 18以上
- npm または yarn

### 手順

```bash
# リポジトリをクローン
git clone https://github.com/あなたのユーザー名/my-2ch.git
cd my-2ch

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:5173` を開く

## 📦 ビルド

```bash
npm run build
```

`dist/` フォルダに本番用ファイルが生成されます。

## 🛠️ 技術スタック

- **React** - UIフレームワーク
- **Vite** - ビルドツール
- **nostr-tools** - Nostrプロトコル実装
- **Imgur API** - 画像アップロード

## 🔧 カスタマイズ

### 板を追加

`src/App.jsx` の `BOARDS` 配列を編集:

```javascript
const BOARDS = [
  // ... 既存の板
  { id: 'your-board', name: 'あなたの板', tag: 'board:your-board' },
];
```

### リレーサーバーを変更

`src/App.jsx` の `RELAYS` 配列を編集:

```javascript
const RELAYS = [
  'wss://your-relay.com',
  // ...
];
```

## 📡 使用しているリレーサーバー

- relay.damus.io
- nostr-pub.wellorder.net
- relay.nostr.band

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエスト歓迎！

## ⚠️ 注意事項

- 投稿は複数のリレーサーバーに分散保存されます
- 一度投稿した内容は完全には削除できません
- 画像はImgurに保存されます（Imgurの利用規約に従ってください）
- 匿名性が高いため、違法な投稿には十分注意してください

## 📞 サポート

問題があれば Issue を立ててください。
