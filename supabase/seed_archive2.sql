-- Insert standalone dummy evidence records with fake polling unit references
DO $$
DECLARE
  pu_ids TEXT[];
  pu_id TEXT;
  i INT;
  evidence_type TEXT;
  sha TEXT;
  reasons TEXT[] := ARRAY[
    'Suspicious structural changes detected near polling unit',
    'Unusual gathering observed in satellite imagery',
    'Voter intimidation reported near polling unit entrance',
    'Ballot box tampering observed by multiple witnesses',
    'Unauthorized persons accessing polling materials',
    'Pre-election baseline capture flagged for monitoring',
    'Potential damage to polling infrastructure visible',
    'Disruption of voting process documented',
    'Armed groups spotted within 500m radius of polling unit',
    'Polling materials diverted from official route'
  ];
  statuses TEXT[] := ARRAY['pending', 'pending', 'verified', 'verified', 'verified'];
BEGIN
  -- Get some real polling unit IDs
  SELECT array_agg(id ORDER BY random()) INTO pu_ids FROM polling_units LIMIT 20;

  FOR i IN 1..20 LOOP
    pu_id := pu_ids[((i - 1) % array_length(pu_ids, 1)) + 1];
    evidence_type := CASE WHEN i % 2 = 0 THEN 'satellite' ELSE 'report' END;
    sha := encode(sha256((i::text || now()::text || pu_id)::bytea), 'hex');

    INSERT INTO evidence_archive (evidence_type, evidence_id, polling_unit_id, sha256_hash, flag_reason, verification_status)
    VALUES (
      evidence_type,
      gen_random_uuid(),
      pu_id,
      sha,
      reasons[((i - 1) % array_length(reasons, 1)) + 1],
      statuses[((i - 1) % array_length(statuses, 1)) + 1]
    );
  END LOOP;
END $$;
