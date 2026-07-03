-- CivicSentry AI Database Schema
-- Run this as a SQL migration in Supabase Dashboard > SQL Editor

-- ============================================
-- POLLING UNITS (seeded from INEC public data)
-- ============================================
CREATE TABLE polling_units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  lga TEXT,
  ward TEXT,
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  risk_score TEXT DEFAULT 'low', -- 'low' | 'medium' | 'high'
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_polling_units_state ON polling_units(state);
CREATE INDEX idx_polling_units_risk ON polling_units(risk_score);
CREATE INDEX idx_polling_units_coords ON polling_units(lat, lng);

-- ============================================
-- ACLED INCIDENTS (seeded from ACLED API)
-- ============================================
CREATE TABLE acled_incidents (
  id TEXT PRIMARY KEY,
  polling_unit_id TEXT REFERENCES polling_units(id),
  event_date DATE,
  event_type TEXT,
  sub_event_type TEXT,
  description TEXT,
  fatalities INT DEFAULT 0,
  source TEXT DEFAULT 'ACLED',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_acled_polling_unit ON acled_incidents(polling_unit_id);
CREATE INDEX idx_acled_date ON acled_incidents(event_date);

-- ============================================
-- ELECTION RESULTS (1999-2023 from multiple sources)
-- ============================================
CREATE TABLE election_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polling_unit_id TEXT REFERENCES polling_units(id),
  election_year INT NOT NULL,
  election_type TEXT NOT NULL, -- 'presidential' | 'gubernatorial'
  state TEXT,
  lga TEXT,
  ward TEXT,
  registered_voters INT,
  accredited_voters INT,
  total_votes_cast INT,
  valid_votes INT,
  rejected_votes INT,
  party_results JSONB, -- {"APC": 150, "PDP": 200, "LP": 80}
  winner TEXT,
  winner_votes INT,
  margin_of_victory INT,
  turnout_percentage FLOAT8,
  source TEXT,
  data_quality TEXT DEFAULT 'complete', -- 'complete' | 'partial' | 'state_level_only'
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_election_polling_unit ON election_results(polling_unit_id);
CREATE INDEX idx_election_year ON election_results(election_year);
CREATE INDEX idx_election_state ON election_results(state);

-- ============================================
-- SATELLITE CAPTURES (fetched from Sentinel Hub)
-- ============================================
CREATE TABLE satellite_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polling_unit_id TEXT REFERENCES polling_units(id),
  captured_at TIMESTAMP,
  image_url TEXT,
  sha256_hash TEXT,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  ai_summary TEXT,
  fetched_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_satellite_polling_unit ON satellite_captures(polling_unit_id);
CREATE INDEX idx_satellite_flagged ON satellite_captures(is_flagged);

-- ============================================
-- NEWS SIGNALS (fetched from GDELT + NewsMCP)
-- ============================================
CREATE TABLE news_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polling_unit_id TEXT REFERENCES polling_units(id),
  state TEXT,
  headline TEXT,
  url TEXT,
  source_domain TEXT,
  sentiment_score FLOAT8,
  tone FLOAT8,
  published_at TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_news_polling_unit ON news_signals(polling_unit_id);
CREATE INDEX idx_news_fetched ON news_signals(fetched_at);

-- ============================================
-- INCIDENT REPORTS (citizen-submitted)
-- ============================================
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polling_unit_id TEXT REFERENCES polling_units(id),
  reporter_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'verified' | 'dismissed'
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_reports_polling_unit ON incident_reports(polling_unit_id);
CREATE INDEX idx_reports_reporter ON incident_reports(reporter_id);

-- ============================================
-- SUBSCRIPTIONS (user tiers)
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  tier TEXT DEFAULT 'free', -- 'free' | 'live_monitoring'
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- HEALTH FACILITIES (from GRID3 Nigeria)
-- ============================================
CREATE TABLE health_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  alt_name TEXT,
  type TEXT,
  category TEXT,
  ownership TEXT,
  functional_status TEXT,
  state TEXT,
  lga TEXT,
  ward TEXT,
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_health_state ON health_facilities(state);
CREATE INDEX idx_health_coords ON health_facilities(lat, lng);

-- ============================================
-- POWER OUTAGES (from HuggingFace dataset)
-- ============================================
CREATE TABLE power_outages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disco TEXT,
  feeder_id TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_min INT,
  cause TEXT,
  customers_affected INT,
  status TEXT,
  lat FLOAT8,
  lng FLOAT8,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_outages_coords ON power_outages(lat, lng);
CREATE INDEX idx_outages_disco ON power_outages(disco);

-- ============================================
-- POPULATION DENSITY (from WorldPop)
-- ============================================
CREATE TABLE population_density (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  polling_unit_id TEXT REFERENCES polling_units(id),
  population_count INT,
  density_per_sq_km FLOAT8,
  source TEXT DEFAULT 'WorldPop',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pop_polling_unit ON population_density(polling_unit_id);

-- ============================================
-- ECONOMIC INDICATORS (from OpenNG + NG DATA)
-- ============================================
CREATE TABLE economic_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_type TEXT NOT NULL, -- 'fuel_price', 'food_price', 'inflation', 'gdp_growth'
  value FLOAT8,
  unit TEXT,
  state TEXT,
  lga TEXT,
  recorded_at TIMESTAMP,
  source TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_econ_type ON economic_indicators(indicator_type);
CREATE INDEX idx_econ_state ON economic_indicators(state);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Public read for data tables
ALTER TABLE polling_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE acled_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE satellite_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_outages ENABLE ROW LEVEL SECURITY;
ALTER TABLE population_density ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies
CREATE POLICY "Public read polling_units" ON polling_units FOR SELECT USING (true);
CREATE POLICY "Public read acled_incidents" ON acled_incidents FOR SELECT USING (true);
CREATE POLICY "Public read election_results" ON election_results FOR SELECT USING (true);
CREATE POLICY "Public read satellite_captures" ON satellite_captures FOR SELECT USING (true);
CREATE POLICY "Public read news_signals" ON news_signals FOR SELECT USING (true);
CREATE POLICY "Public read health_facilities" ON health_facilities FOR SELECT USING (true);
CREATE POLICY "Public read power_outages" ON power_outages FOR SELECT USING (true);
CREATE POLICY "Public read population_density" ON population_density FOR SELECT USING (true);
CREATE POLICY "Public read economic_indicators" ON economic_indicators FOR SELECT USING (true);

-- Incident reports: public read, authenticated insert
CREATE POLICY "Public read incident_reports" ON incident_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated insert incident_reports" ON incident_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Subscriptions: user can only see/modify own row
CREATE POLICY "User read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
