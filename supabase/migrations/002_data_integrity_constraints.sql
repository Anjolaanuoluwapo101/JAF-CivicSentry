-- CivicSentry AI — Data Integrity Constraints
-- Run AFTER seed data is loaded
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================
-- 1. SOURCE CONSTRAINTS (prevents mixing typos)
-- ============================================

ALTER TABLE acled_incidents
  ADD CONSTRAINT chk_acled_source
  CHECK (source IN ('ACLED (HDX)', 'WarScope', 'War-Tracker'));

ALTER TABLE election_results
  ADD CONSTRAINT chk_election_data_quality
  CHECK (data_quality IN ('complete', 'partial', 'state_level_only'));

ALTER TABLE election_results
  ADD CONSTRAINT chk_election_year
  CHECK (election_year >= 1999 AND election_year <= 2023);

-- ============================================
-- 2. ON DELETE SET NULL for FK references
--    (If a PU is deleted, related records
--     retain their data but lose the link)
-- ============================================

ALTER TABLE acled_incidents
  DROP CONSTRAINT IF EXISTS acled_incidents_polling_unit_id_fkey,
  ADD CONSTRAINT acled_incidents_polling_unit_id_fkey
  FOREIGN KEY (polling_unit_id) REFERENCES polling_units(id) ON DELETE SET NULL;

ALTER TABLE election_results
  DROP CONSTRAINT IF EXISTS election_results_polling_unit_id_fkey,
  ADD CONSTRAINT election_results_polling_unit_id_fkey
  FOREIGN KEY (polling_unit_id) REFERENCES polling_units(id) ON DELETE SET NULL;

ALTER TABLE satellite_captures
  DROP CONSTRAINT IF EXISTS satellite_captures_polling_unit_id_fkey,
  ADD CONSTRAINT satellite_captures_polling_unit_id_fkey
  FOREIGN KEY (polling_unit_id) REFERENCES polling_units(id) ON DELETE SET NULL;

ALTER TABLE news_signals
  DROP CONSTRAINT IF EXISTS news_signals_polling_unit_id_fkey,
  ADD CONSTRAINT news_signals_polling_unit_id_fkey
  FOREIGN KEY (polling_unit_id) REFERENCES polling_units(id) ON DELETE SET NULL;

ALTER TABLE population_density
  DROP CONSTRAINT IF EXISTS population_density_polling_unit_id_fkey,
  ADD CONSTRAINT population_density_polling_unit_id_fkey
  FOREIGN KEY (polling_unit_id) REFERENCES polling_units(id) ON DELETE SET NULL;

-- ============================================
-- 3. COORDINATE VALIDITY CONSTRAINTS
--    (Nigeria bounding box)
-- ============================================

ALTER TABLE polling_units
  ADD CONSTRAINT chk_pu_lat
  CHECK (lat >= 4 AND lat <= 14);

ALTER TABLE polling_units
  ADD CONSTRAINT chk_pu_lng
  CHECK (lng >= 2.7 AND lng <= 15);

ALTER TABLE polling_units
  ADD CONSTRAINT chk_pu_not_zero_coords
  CHECK (NOT (lat = 0 AND lng = 0));

ALTER TABLE health_facilities
  ADD CONSTRAINT chk_hf_lat
  CHECK (lat >= 4 AND lat <= 14);

ALTER TABLE health_facilities
  ADD CONSTRAINT chk_hf_lng
  CHECK (lng >= 2.7 AND lng <= 15);

-- ============================================
-- 4. RISK SCORE CONSTRAINT
-- ============================================

ALTER TABLE polling_units
  ADD CONSTRAINT chk_risk_score
  CHECK (risk_score IN ('low', 'medium', 'high'));

-- ============================================
-- 5. ADD STATE COLUMN TO acled_incidents (for state-level matching)
-- ============================================

ALTER TABLE acled_incidents
  ADD COLUMN IF NOT EXISTS state TEXT;

CREATE INDEX IF NOT EXISTS idx_acled_state ON acled_incidents(state);

-- ============================================
-- 6. CLEANUP ORPHANED RECORDS FROM seed-nigerian-data.js
--    (population_density sample records with source='OpenStreetMap'
--     and polling_unit_id IS NULL)
-- ============================================

DELETE FROM population_density
WHERE source = 'OpenStreetMap';

-- ============================================
-- 7. DUPLICATE PREVENTION: Prevent same PU + same year
--    in election_results
-- ============================================

-- Remove existing duplicates (only for PU-level records — state_level_only records are per-state)
DELETE FROM election_results a USING election_results b
WHERE a.id < b.id
  AND a.polling_unit_id IS NOT NULL
  AND a.polling_unit_id = b.polling_unit_id
  AND a.election_year = b.election_year;

CREATE UNIQUE INDEX IF NOT EXISTS idx_election_pu_year
  ON election_results (polling_unit_id, election_year)
  WHERE polling_unit_id IS NOT NULL;

-- ============================================
-- 8. ADD MISSING INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_acled_source ON acled_incidents(source);
CREATE INDEX IF NOT EXISTS idx_news_source_domain ON news_signals(source_domain);
CREATE INDEX IF NOT EXISTS idx_election_data_quality ON election_results(data_quality);
CREATE INDEX IF NOT EXISTS idx_pop_density_source ON population_density(source);

-- ============================================
-- VERIFICATION QUERIES (run separately to check)
-- ============================================

-- Check constraint violations:
-- SELECT * FROM polling_units WHERE risk_score NOT IN ('low','medium','high');
-- SELECT * FROM acled_incidents WHERE source NOT IN ('ACLED (HDX)','WarScope','War-Tracker');
-- SELECT * FROM polling_units WHERE lat < 4 OR lat > 14 OR lng < 3 OR lng > 15;
