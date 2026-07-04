-- Seed evidence archive with dummy data

-- Satellite evidence (use existing satellite_captures data)
INSERT INTO evidence_archive (evidence_type, evidence_id, polling_unit_id, sha256_hash, flag_reason, verification_status)
SELECT 'satellite', sc.id, sc.polling_unit_id, sc.sha256_hash, 
       CASE (random() * 3)::int
         WHEN 0 THEN 'Suspicious structural changes detected near polling unit'
         WHEN 1 THEN 'Unusual gathering observed in satellite imagery'
         WHEN 2 THEN 'Potential damage to polling infrastructure visible'
         ELSE 'Pre-election baseline capture flagged for monitoring'
       END,
       CASE WHEN random() > 0.4 THEN 'verified' ELSE 'pending' END
FROM satellite_captures sc
WHERE sc.sha256_hash IS NOT NULL
LIMIT 15;

-- Report evidence (use existing incident_reports data)
INSERT INTO evidence_archive (evidence_type, evidence_id, polling_unit_id, sha256_hash, flag_reason, verification_status)
SELECT 'report', ir.id, ir.polling_unit_id, 
       encode(sha256((ir.description || ir.id)::bytea), 'hex'),
       CASE (random() * 3)::int
         WHEN 0 THEN 'Voter intimidation reported near polling unit entrance'
         WHEN 1 THEN 'Ballot box tampering observed by multiple witnesses'
         WHEN 2 THEN 'Unauthorized persons accessing polling materials'
         ELSE 'Disruption of voting process documented'
       END,
       CASE WHEN random() > 0.5 THEN 'verified' ELSE 'pending' END
FROM incident_reports ir
LIMIT 15;
