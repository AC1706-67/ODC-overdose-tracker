/*
  # Safely Update Existing outreach_logs Table
  
  This migration safely updates the existing outreach_logs table
  instead of trying to recreate it.
*/

-- =============================================
-- ADD MISSING COLUMNS (IF NOT EXISTS)
-- =============================================

-- Add organization_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE outreach_logs ADD COLUMN organization_id uuid REFERENCES organizations(id);
    END IF;
END $$;

-- Add submitted_by if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'submitted_by') THEN
        ALTER TABLE outreach_logs ADD COLUMN submitted_by uuid REFERENCES profiles(id);
    END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE outreach_logs ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- =============================================
-- ADD CONSTRAINTS SAFELY
-- =============================================

-- Add zip_code check constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'outreach_logs_zip_code_check') THEN
        ALTER TABLE outreach_logs ADD CONSTRAINT outreach_logs_zip_code_check 
        CHECK (zip_code ~ '^[0-9]{5}$');
    END IF;
EXCEPTION
    WHEN others THEN
        -- If constraint fails due to existing data, skip it
        RAISE NOTICE 'Could not add zip_code constraint - existing data may not match pattern';
END $$;

-- Add num_kits check constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'outreach_logs_num_kits_check') THEN
        ALTER TABLE outreach_logs ADD CONSTRAINT outreach_logs_num_kits_check 
        CHECK (num_kits >= 0);
    END IF;
END $$;

-- Add people_reached check constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'outreach_logs_people_reached_check') THEN
        ALTER TABLE outreach_logs ADD CONSTRAINT outreach_logs_people_reached_check 
        CHECK (people_reached >= 0);
    END IF;
END $$;

-- =============================================
-- ENABLE RLS (SAFE - NO-OP IF ALREADY ENABLED)
-- =============================================
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DROP EXISTING POLICIES (TO AVOID CONFLICTS)
-- =============================================
DROP POLICY IF EXISTS "Users can submit outreach logs for their orgs" ON outreach_logs;
DROP POLICY IF EXISTS "Allow anonymous outreach log submission" ON outreach_logs;
DROP POLICY IF EXISTS "Users can view org outreach logs" ON outreach_logs;

-- =============================================
-- CREATE NEW POLICIES
-- =============================================

-- Allow authenticated users to insert outreach logs for their organizations
CREATE POLICY "Users can submit outreach logs for their orgs"
  ON outreach_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor', 'Responder')
        AND is_active = true
    )
    OR organization_id IS NULL -- Allow anonymous submissions
  );

-- Allow anonymous submissions (for public health emergency use)
CREATE POLICY "Allow anonymous outreach log submission"
  ON outreach_logs
  FOR INSERT
  TO anon
  WITH CHECK (organization_id IS NULL);

-- Users can view outreach logs from their organizations
CREATE POLICY "Users can view org outreach logs"
  ON outreach_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND is_active = true
    )
    OR organization_id IS NULL -- Allow viewing anonymous submissions
  );

-- =============================================
-- CREATE INDEXES (SAFE - NO-OP IF EXISTS)
-- =============================================
CREATE INDEX IF NOT EXISTS outreach_logs_zip_code_idx ON outreach_logs(zip_code);
CREATE INDEX IF NOT EXISTS outreach_logs_created_at_idx ON outreach_logs(created_at);
CREATE INDEX IF NOT EXISTS outreach_logs_organization_idx ON outreach_logs(organization_id);
CREATE INDEX IF NOT EXISTS outreach_logs_submitted_by_idx ON outreach_logs(submitted_by);
CREATE INDEX IF NOT EXISTS outreach_logs_kit_types_idx ON outreach_logs USING GIN(kit_types);

-- =============================================
-- ADD TRIGGER (SAFE - WILL REPLACE IF EXISTS)
-- =============================================
DROP TRIGGER IF EXISTS outreach_logs_updated_at ON outreach_logs;
CREATE TRIGGER outreach_logs_updated_at
  BEFORE UPDATE ON outreach_logs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();