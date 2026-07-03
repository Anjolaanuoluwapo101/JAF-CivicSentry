-- Migration 002: Add state column to acled_incidents
-- The app queries (queries.ts) select and filter by state on acled_incidents,
-- but the column was never added to the schema.

ALTER TABLE acled_incidents ADD COLUMN IF NOT EXISTS state TEXT;
CREATE INDEX IF NOT EXISTS idx_acled_state ON acled_incidents(state);

-- Backfill from polling_units foreign key
UPDATE acled_incidents ai
SET state = pu.state
FROM polling_units pu
WHERE ai.polling_unit_id = pu.id
  AND ai.state IS NULL;
