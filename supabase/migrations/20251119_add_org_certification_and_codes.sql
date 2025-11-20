/*
  # Organization Certification and Invite Codes Migration
  
  This migration adds organization certification workflow and invite code system.
  
  ## Changes
  1. Add certification fields to organizations table (is_certified, status, etc.)
  2. Create organization_invite_codes table for shareable join codes
  3. Add RLS policies for secure access
  4. Create helper function for code usage tracking
  5. Mark existing organizations as certified
  6. Create sample invite codes
  
  ## Safety
  - All operations are idempotent (can be run multiple times safely)
  - Uses IF NOT EXISTS, DROP IF EXISTS, and ON CONFLICT
  - Proper ordering: functions → tables → constraints → indexes → triggers → data
  - Transaction-safe (no CONCURRENT operations)
  
  ## Notes
  - Requires public.handle_updated_at() function (created in Step 1 if missing)
  - Sample codes created for existing organizations with known slugs
  - New organizations default to pending/uncertified status
*/

-- =============================================
-- STEP 1: ENSURE HELPER FUNCTION EXISTS
-- =============================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 2: ADD CERTIFICATION FIELDS TO ORGANIZATIONS
-- =============================================

-- Add certification and status fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_certified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS certification_notes text;

-- Add constraint for status values (drop first if exists to make idempotent)
DO $$ 
BEGIN
  ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_status_check;
  ALTER TABLE organizations ADD CONSTRAINT organizations_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- STEP 3: CREATE ORGANIZATION INVITE CODES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS organization_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL, -- e.g., "RAEP2025"
  description text, -- e.g., "Recovery Alliance El Paso 2025 Code"
  role text NOT NULL DEFAULT 'Responder',
  is_active boolean DEFAULT true,
  max_uses integer, -- NULL = unlimited
  current_uses integer DEFAULT 0,
  expires_at timestamptz, -- NULL = never expires
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint for role values (drop first if exists to make idempotent)
DO $$ 
BEGIN
  ALTER TABLE organization_invite_codes DROP CONSTRAINT IF EXISTS organization_invite_codes_role_check;
  ALTER TABLE organization_invite_codes ADD CONSTRAINT organization_invite_codes_role_check 
    CHECK (role IN ('Admin', 'Manager', 'Supervisor', 'Responder', 'Viewer'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

-- =============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE organization_invite_codes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: RLS POLICIES - ORGANIZATION_INVITE_CODES
-- =============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can read active invite codes" ON organization_invite_codes;
DROP POLICY IF EXISTS "Admins can manage org invite codes" ON organization_invite_codes;

-- Anyone can read active codes (to validate during signup)
CREATE POLICY "Anyone can read active invite codes"
  ON organization_invite_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Admins+ can manage codes for their organizations
CREATE POLICY "Admins can manage org invite codes"
  ON organization_invite_codes
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
        AND is_active = true
    )
  );

-- =============================================
-- STEP 6: INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS org_invite_codes_code_idx ON organization_invite_codes(code);
CREATE INDEX IF NOT EXISTS org_invite_codes_org_idx ON organization_invite_codes(organization_id);
CREATE INDEX IF NOT EXISTS org_invite_codes_active_idx ON organization_invite_codes(is_active);
CREATE INDEX IF NOT EXISTS organizations_certified_idx ON organizations(is_certified);
CREATE INDEX IF NOT EXISTS organizations_status_idx ON organizations(status);

-- =============================================
-- STEP 7: TRIGGER FOR UPDATED_AT
-- =============================================

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS org_invite_codes_updated_at ON organization_invite_codes;

-- Create trigger (function already exists from Step 1)
CREATE TRIGGER org_invite_codes_updated_at
  BEFORE UPDATE ON organization_invite_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- STEP 8: FUNCTION TO INCREMENT CODE USAGE
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_invite_code_usage(code_text text)
RETURNS uuid AS $$
DECLARE
  org_id uuid;
BEGIN
  UPDATE organization_invite_codes
  SET current_uses = current_uses + 1
  WHERE code = code_text
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  RETURNING organization_id INTO org_id;
  
  -- Returns NULL if no matching code found or limits exceeded
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================
-- STEP 9: MARK EXISTING ORGS AS CERTIFIED
-- =============================================

-- Mark existing orgs as certified and approved
UPDATE organizations
SET 
  is_certified = true,
  status = 'approved',
  approved_at = now()
WHERE slug IN ('recovery-alliance-of-el-paso', 'anonymous-haven-ai')
  AND is_certified IS NOT TRUE; -- Only update if not already certified

-- =============================================
-- STEP 10: SAMPLE INVITE CODES
-- =============================================

-- Add codes for Recovery Alliance of El Paso
INSERT INTO organization_invite_codes (organization_id, code, description, role)
SELECT 
  id,
  'RAEP2025',
  'Recovery Alliance of El Paso 2025',
  'Responder'
FROM organizations
WHERE slug = 'recovery-alliance-of-el-paso'
  AND EXISTS (SELECT 1 FROM organizations WHERE slug = 'recovery-alliance-of-el-paso')
ON CONFLICT (code) DO NOTHING;

-- Add codes for Anonymous Haven AI
INSERT INTO organization_invite_codes (organization_id, code, description, role)
SELECT 
  id,
  'HAVEN2025',
  'Anonymous Haven AI 2025',
  'Responder'
FROM organizations
WHERE slug = 'anonymous-haven-ai'
  AND EXISTS (SELECT 1 FROM organizations WHERE slug = 'anonymous-haven-ai')
ON CONFLICT (code) DO NOTHING;
