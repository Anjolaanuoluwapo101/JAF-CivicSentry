-- ============================================
-- EVIDENCE ARCHIVE (Phase 5: tamper-proof chain of custody)
-- ============================================
CREATE TABLE evidence_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('satellite', 'report')),
  evidence_id UUID NOT NULL,
  polling_unit_id TEXT REFERENCES polling_units(id),
  sha256_hash TEXT NOT NULL,
  flagged_by UUID REFERENCES auth.users(id),
  flag_reason TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'tampered')),
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_evidence_type ON evidence_archive(evidence_type);
CREATE INDEX idx_evidence_polling_unit ON evidence_archive(polling_unit_id);
CREATE INDEX idx_evidence_verification ON evidence_archive(verification_status);
CREATE INDEX idx_evidence_flagged_by ON evidence_archive(flagged_by);

-- Enable RLS
ALTER TABLE evidence_archive ENABLE ROW LEVEL SECURITY;

-- Public read for all users
CREATE POLICY "Public read evidence_archive" ON evidence_archive FOR SELECT USING (true);

-- Authenticated users can flag evidence
CREATE POLICY "Authenticated insert evidence_archive" ON evidence_archive
  FOR INSERT WITH CHECK (auth.uid() = flagged_by);

-- Only the flagger can update verification status
CREATE POLICY "Flagger update evidence_archive" ON evidence_archive
  FOR UPDATE USING (auth.uid() = flagged_by);
