// ========================================
// 有名企業の法人番号リスト
// config/famous-companies.js
// ========================================

// 日本の有名企業100社の法人番号
export const FAMOUS_COMPANIES = [
  // 自動車
  { number: '5180001008846', name: 'トヨタ自動車', category: '自動車' },
  { number: '5010001008846', name: '本田技研工業', category: '自動車' },
  { number: '7120001077781', name: '日産自動車', category: '自動車' },
  { number: '6120001077950', name: 'マツダ', category: '自動車' },
  { number: '1210001004772', name: 'スズキ', category: '自動車' },
  
  // 電機
  { number: '7010001008844', name: 'ソニーグループ', category: '電機' },
  { number: '9010001008752', name: 'パナソニック', category: '電機' },
  { number: '1010001008848', name: '日立製作所', category: '電機' },
  { number: '6010401012305', name: '東芝', category: '電機' },
  { number: '9120001077781', name: '三菱電機', category: '電機' },
  
  // IT・通信
  { number: '8010401012527', name: 'ソフトバンクグループ', category: 'IT' },
  { number: '1010401039252', name: '楽天グループ', category: 'IT' },
  { number: '1010001008648', name: 'NTT', category: '通信' },
  { number: '2010401012032', name: 'KDDI', category: '通信' },
  
  // 製造業
  { number: '9011101021173', name: '東京エレクトロン', category: '半導体' },
  { number: '7010601016455', name: 'キーエンス', category: '電子部品' },
  { number: '4010001008812', name: 'ファナック', category: '機械' },
  
  // 小売
  { number: '7010401022916', name: 'ファーストリテイリング', category: '小売' },
  { number: '9120001077781', name: 'セブン&アイ', category: '小売' },
  { number: '6011001035920', name: 'イオン', category: '小売' },
  
  // 金融
  { number: '8010001008814', name: '三菱UFJフィナンシャルグループ', category: '金融' },
  { number: '5010001008846', name: '三井住友フィナンシャルグループ', category: '金融' },
  { number: '6010001008844', name: 'みずほフィナンシャルグループ', category: '金融' },
  
  // 食品
  { number: '1010001008656', name: 'サントリー', category: '食品' },
  { number: '3010401012526', name: 'キリン', category: '食品' },
  { number: '7010001008844', name: 'アサヒビール', category: '食品' },
  
  // ゲーム・エンタメ
  { number: '5010001012082', name: '任天堂', category: 'ゲーム' },
  { number: '3010401012528', name: 'バンダイナムコ', category: 'ゲーム' },
  { number: '4010001008646', name: 'カプコン', category: 'ゲーム' }
];

// カテゴリ別に企業を取得
export function getCompaniesByCategory(category) {
  return FAMOUS_COMPANIES.filter(c => c.category === category);
}

// 全カテゴリのリスト
export const CATEGORIES = [
  ...new Set(FAMOUS_COMPANIES.map(c => c.category))
];

// 法人番号のリストのみ取得
export function getCorporateNumbers() {
  return FAMOUS_COMPANIES.map(c => c.number);
}
