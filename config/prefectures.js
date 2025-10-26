// ========================================
// 都道府県マスタデータ
// config/prefectures.js
// ========================================

export const PREFECTURES = {
  '01': { code: '01', name: '北海道', region: '北海道' },
  '02': { code: '02', name: '青森県', region: '東北' },
  '03': { code: '03', name: '岩手県', region: '東北' },
  '04': { code: '04', name: '宮城県', region: '東北' },
  '05': { code: '05', name: '秋田県', region: '東北' },
  '06': { code: '06', name: '山形県', region: '東北' },
  '07': { code: '07', name: '福島県', region: '東北' },
  '08': { code: '08', name: '茨城県', region: '関東' },
  '09': { code: '09', name: '栃木県', region: '関東' },
  '10': { code: '10', name: '群馬県', region: '関東' },
  '11': { code: '11', name: '埼玉県', region: '関東' },
  '12': { code: '12', name: '千葉県', region: '関東' },
  '13': { code: '13', name: '東京都', region: '関東' },
  '14': { code: '14', name: '神奈川県', region: '関東' },
  '15': { code: '15', name: '新潟県', region: '中部' },
  '16': { code: '16', name: '富山県', region: '中部' },
  '17': { code: '17', name: '石川県', region: '中部' },
  '18': { code: '18', name: '福井県', region: '中部' },
  '19': { code: '19', name: '山梨県', region: '中部' },
  '20': { code: '20', name: '長野県', region: '中部' },
  '21': { code: '21', name: '岐阜県', region: '中部' },
  '22': { code: '22', name: '静岡県', region: '中部' },
  '23': { code: '23', name: '愛知県', region: '中部' },
  '24': { code: '24', name: '三重県', region: '近畿' },
  '25': { code: '25', name: '滋賀県', region: '近畿' },
  '26': { code: '26', name: '京都府', region: '近畿' },
  '27': { code: '27', name: '大阪府', region: '近畿' },
  '28': { code: '28', name: '兵庫県', region: '近畿' },
  '29': { code: '29', name: '奈良県', region: '近畿' },
  '30': { code: '30', name: '和歌山県', region: '近畿' },
  '31': { code: '31', name: '鳥取県', region: '中国' },
  '32': { code: '32', name: '島根県', region: '中国' },
  '33': { code: '33', name: '岡山県', region: '中国' },
  '34': { code: '34', name: '広島県', region: '中国' },
  '35': { code: '35', name: '山口県', region: '中国' },
  '36': { code: '36', name: '徳島県', region: '四国' },
  '37': { code: '37', name: '香川県', region: '四国' },
  '38': { code: '38', name: '愛媛県', region: '四国' },
  '39': { code: '39', name: '高知県', region: '四国' },
  '40': { code: '40', name: '福岡県', region: '九州' },
  '41': { code: '41', name: '佐賀県', region: '九州' },
  '42': { code: '42', name: '長崎県', region: '九州' },
  '43': { code: '43', name: '熊本県', region: '九州' },
  '44': { code: '44', name: '大分県', region: '九州' },
  '45': { code: '45', name: '宮崎県', region: '九州' },
  '46': { code: '46', name: '鹿児島県', region: '九州' },
  '47': { code: '47', name: '沖縄県', region: '沖縄' }
};

// 都道府県コードの配列
export const PREFECTURE_CODES = Object.keys(PREFECTURES);

// 都道府県名から情報を取得
export function getPrefectureByName(name) {
  return Object.values(PREFECTURES).find(p => p.name === name);
}

// 地方別に都道府県を取得
export function getPrefecturesByRegion(region) {
  return Object.values(PREFECTURES).filter(p => p.region === region);
}

// 全地方のリスト
export const REGIONS = [
  '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州', '沖縄'
];
