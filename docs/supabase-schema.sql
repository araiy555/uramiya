-- ========================================
-- 企業テーブル
-- ========================================

CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 法人番号
  corporate_number TEXT UNIQUE NOT NULL,
  
  -- 基本情報
  name TEXT NOT NULL,
  name_kana TEXT,
  
  -- 所在地
  prefecture TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  
  -- 企業情報
  founded DATE,
  employees INTEGER,
  revenue BIGINT,
  
  website TEXT,
  description TEXT,
  
  -- 画像
  logo_url TEXT,
  images TEXT[],
  
  -- ステータス
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- 外部ID
  wikidata_id TEXT,
  
  -- メタデータ
  data_sources TEXT,
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_prefecture ON companies(prefecture);
CREATE INDEX idx_companies_corporate_number ON companies(corporate_number);

-- 全文検索
CREATE INDEX idx_companies_search ON companies 
USING GIN (to_tsvector('japanese', name || ' ' || COALESCE(description, '')));

-- ========================================
-- 人物テーブル
-- ========================================

CREATE TABLE people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 基本情報
  name TEXT NOT NULL,
  name_kana TEXT,
  
  -- 関連企業
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT,
  
  -- 詳細
  bio TEXT,
  photo_url TEXT,
  
  -- SNS
  linkedin TEXT,
  twitter TEXT,
  
  -- 外部ID
  wikidata_id TEXT,
  
  -- メタデータ
  data_sources TEXT,
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_people_company ON people(company_id);
CREATE INDEX idx_people_name ON people(name);

-- ========================================
-- 収集ログテーブル（任意）
-- ========================================

CREATE TABLE collection_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  corporate_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed', 'skipped')),
  error_message TEXT,
  
  collected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_corporate_number ON collection_logs(corporate_number);
CREATE INDEX idx_logs_collected_at ON collection_logs(collected_at DESC);

-- ========================================
-- 統計情報を取得する関数
-- ========================================

CREATE OR REPLACE FUNCTION get_company_stats()
RETURNS TABLE (
  total_companies BIGINT,
  companies_with_logo BIGINT,
  companies_with_wikidata BIGINT,
  by_prefecture JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_companies,
    COUNT(logo_url)::BIGINT as companies_with_logo,
    COUNT(wikidata_id)::BIGINT as companies_with_wikidata,
    jsonb_object_agg(
      prefecture,
      count
    ) as by_prefecture
  FROM (
    SELECT 
      prefecture,
      COUNT(*)::INTEGER as count
    FROM companies
    GROUP BY prefecture
  ) prefecture_counts;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 検索関数
-- ========================================

CREATE OR REPLACE FUNCTION search_companies(
  search_term TEXT,
  filter_prefecture TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  prefecture TEXT,
  logo_url TEXT,
  description TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.prefecture,
    c.logo_url,
    c.description,
    ts_rank(
      to_tsvector('japanese', c.name || ' ' || COALESCE(c.description, '')),
      plainto_tsquery('japanese', search_term)
    ) AS rank
  FROM companies c
  WHERE 
    to_tsvector('japanese', c.name || ' ' || COALESCE(c.description, ''))
    @@ plainto_tsquery('japanese', search_term)
    AND (filter_prefecture IS NULL OR c.prefecture = filter_prefecture)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
