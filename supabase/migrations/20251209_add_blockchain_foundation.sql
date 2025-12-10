-- ============================================================================
-- BLOCKCHAIN FOUNDATION SETUP
-- ============================================================================
-- This migration adds blockchain-ready fields to existing tables
-- without implementing actual blockchain functionality yet.
-- This allows data collection to begin while blockchain features are developed.
-- ============================================================================

-- ============================================================================
-- PART 1: ADD BLOCKCHAIN FIELDS TO INCIDENTS TABLE
-- ============================================================================

ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS blockchain_hash text,
  ADD COLUMN IF NOT EXISTS blockchain_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS blockchain_network text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS blockchain_verified boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.incidents.blockchain_hash IS 'Hash of incident data stored on blockchain for immutability verification';
COMMENT ON COLUMN public.incidents.blockchain_timestamp IS 'Timestamp when incident was recorded on blockchain';
COMMENT ON COLUMN public.incidents.blockchain_network IS 'Blockchain network used (e.g., ethereum, polygon, pending)';
COMMENT ON COLUMN public.incidents.blockchain_verified IS 'Whether blockchain hash has been verified as valid';

-- Create index for blockchain queries
CREATE INDEX IF NOT EXISTS idx_incidents_blockchain_hash 
  ON public.incidents(blockchain_hash) 
  WHERE blockchain_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_blockchain_verified 
  ON public.incidents(blockchain_verified) 
  WHERE blockchain_verified = true;

-- ============================================================================
-- PART 2: ADD BLOCKCHAIN FIELDS TO OUTREACH_LOGS TABLE
-- ============================================================================

ALTER TABLE public.outreach_logs
  ADD COLUMN IF NOT EXISTS blockchain_hash text,
  ADD COLUMN IF NOT EXISTS blockchain_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS blockchain_network text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS blockchain_verified boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.outreach_logs.blockchain_hash IS 'Hash of outreach log data stored on blockchain for immutability verification';
COMMENT ON COLUMN public.outreach_logs.blockchain_timestamp IS 'Timestamp when outreach log was recorded on blockchain';
COMMENT ON COLUMN public.outreach_logs.blockchain_network IS 'Blockchain network used (e.g., ethereum, polygon, pending)';
COMMENT ON COLUMN public.outreach_logs.blockchain_verified IS 'Whether blockchain hash has been verified as valid';

-- Create index for blockchain queries
CREATE INDEX IF NOT EXISTS idx_outreach_logs_blockchain_hash 
  ON public.outreach_logs(blockchain_hash) 
  WHERE blockchain_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outreach_logs_blockchain_verified 
  ON public.outreach_logs(blockchain_verified) 
  WHERE blockchain_verified = true;

-- ============================================================================
-- PART 3: CREATE BLOCKCHAIN_RECORDS TABLE FOR AUDIT TRAIL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL CHECK (record_type IN ('incident', 'outreach_log', 'organization_cert')),
  record_id uuid NOT NULL,
  blockchain_hash text NOT NULL,
  blockchain_network text NOT NULL,
  transaction_hash text,
  block_number bigint,
  gas_used bigint,
  gas_price bigint,
  network_fee_usd decimal(10,2),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'confirmed', 'failed', 'expired')),
  verification_attempts integer DEFAULT 0,
  last_verification_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on blockchain_records
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view blockchain records for their org's data
CREATE POLICY "org_members_select_blockchain_records"
  ON public.blockchain_records
  FOR SELECT
  TO authenticated
  USING (
    -- For incidents
    (record_type = 'incident' AND EXISTS (
      SELECT 1 FROM public.incidents i
      JOIN public.user_organizations uo ON uo.organization_id = i.organization_id
      WHERE i.incident_id = blockchain_records.record_id
        AND uo.user_id = auth.uid()
        AND COALESCE(uo.is_active, true) = true
    ))
    OR
    -- For outreach logs
    (record_type = 'outreach_log' AND EXISTS (
      SELECT 1 FROM public.outreach_logs ol
      JOIN public.user_organizations uo ON uo.organization_id = ol.organization_id
      WHERE ol.id = blockchain_records.record_id
        AND uo.user_id = auth.uid()
        AND COALESCE(uo.is_active, true) = true
    ))
    OR
    -- For organization certifications
    (record_type = 'organization_cert' AND EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = blockchain_records.record_id
        AND uo.user_id = auth.uid()
        AND COALESCE(uo.is_active, true) = true
    ))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blockchain_records_record_type_id 
  ON public.blockchain_records(record_type, record_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_records_hash 
  ON public.blockchain_records(blockchain_hash);

CREATE INDEX IF NOT EXISTS idx_blockchain_records_verification_status 
  ON public.blockchain_records(verification_status);

CREATE INDEX IF NOT EXISTS idx_blockchain_records_network 
  ON public.blockchain_records(blockchain_network);

-- Add updated_at trigger
CREATE TRIGGER blockchain_records_updated_at
  BEFORE UPDATE ON public.blockchain_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PART 4: CREATE BLOCKCHAIN CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  blockchain_enabled boolean DEFAULT false,
  preferred_network text DEFAULT 'polygon' CHECK (preferred_network IN ('ethereum', 'polygon', 'arbitrum', 'optimism')),
  auto_submit boolean DEFAULT false,
  verification_required boolean DEFAULT true,
  max_gas_price_gwei bigint DEFAULT 50,
  retry_attempts integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.blockchain_config ENABLE ROW LEVEL SECURITY;

-- Only org admins can manage blockchain config
CREATE POLICY "org_admins_manage_blockchain_config"
  ON public.blockchain_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = blockchain_config.organization_id
        AND uo.role IN ('Admin', 'Owner')
        AND COALESCE(uo.is_active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = blockchain_config.organization_id
        AND uo.role IN ('Admin', 'Owner')
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- Add updated_at trigger
CREATE TRIGGER blockchain_config_updated_at
  BEFORE UPDATE ON public.blockchain_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PART 5: CREATE BLOCKCHAIN ANALYTICS VIEW
-- ============================================================================

CREATE VIEW public.blockchain_analytics AS
SELECT
  o.name as organization_name,
  o.slug as organization_slug,
  bc.blockchain_enabled,
  bc.preferred_network,
  COUNT(CASE WHEN br.record_type = 'incident' THEN 1 END) as incidents_on_blockchain,
  COUNT(CASE WHEN br.record_type = 'outreach_log' THEN 1 END) as outreach_logs_on_blockchain,
  COUNT(CASE WHEN br.verification_status = 'confirmed' THEN 1 END) as verified_records,
  COUNT(CASE WHEN br.verification_status = 'pending' THEN 1 END) as pending_records,
  COUNT(CASE WHEN br.verification_status = 'failed' THEN 1 END) as failed_records,
  SUM(br.network_fee_usd) as total_network_fees_usd,
  AVG(br.gas_used) as avg_gas_used,
  MAX(br.created_at) as last_blockchain_activity
FROM public.organizations o
LEFT JOIN public.blockchain_config bc ON bc.organization_id = o.id
LEFT JOIN public.blockchain_records br ON (
  (br.record_type = 'incident' AND EXISTS (
    SELECT 1 FROM public.incidents i 
    WHERE i.incident_id = br.record_id AND i.organization_id = o.id
  ))
  OR
  (br.record_type = 'outreach_log' AND EXISTS (
    SELECT 1 FROM public.outreach_logs ol 
    WHERE ol.id = br.record_id AND ol.organization_id = o.id
  ))
  OR
  (br.record_type = 'organization_cert' AND br.record_id = o.id)
)
GROUP BY o.id, o.name, o.slug, bc.blockchain_enabled, bc.preferred_network;

-- Grant access to authenticated users (filtered by RLS)
GRANT SELECT ON public.blockchain_analytics TO authenticated;

-- ============================================================================
-- PART 6: VERIFICATION QUERIES
-- ============================================================================

-- Show new blockchain columns on incidents
SELECT 
  '=== INCIDENTS BLOCKCHAIN COLUMNS ===' as section,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'incidents'
  AND column_name LIKE 'blockchain_%'
ORDER BY column_name;

-- Show new blockchain columns on outreach_logs
SELECT 
  '=== OUTREACH_LOGS BLOCKCHAIN COLUMNS ===' as section,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'outreach_logs'
  AND column_name LIKE 'blockchain_%'
ORDER BY column_name;

-- Show blockchain_records table structure
SELECT 
  '=== BLOCKCHAIN_RECORDS TABLE ===' as section,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'blockchain_records'
ORDER BY ordinal_position;

-- Show blockchain_config table structure
SELECT 
  '=== BLOCKCHAIN_CONFIG TABLE ===' as section,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'blockchain_config'
ORDER BY ordinal_position;

-- Summary
SELECT 
  '=== BLOCKCHAIN FOUNDATION SUMMARY ===' as section,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name LIKE 'blockchain_%') as incidents_blockchain_columns,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'outreach_logs' AND column_name LIKE 'blockchain_%') as outreach_blockchain_columns,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('blockchain_records', 'blockchain_config')) as new_blockchain_tables,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'blockchain_analytics') as blockchain_views;