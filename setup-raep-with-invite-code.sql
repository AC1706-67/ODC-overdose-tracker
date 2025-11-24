-- ============================================================================
-- SETUP RAEP WITH INVITE CODE
-- ============================================================================
-- This script:
-- 1. Certifies Recovery Alliance of El Paso
-- 2. Enables all features
-- 3. Creates an invite code "RAEP2025"
-- 4. Shows verification results
-- ============================================================================

-- STEP 1: Certify and enable RAEP
-- ============================================================================
UPDATE organizations
SET 
  is_certified = true,
  is_public = true,
  is_active = true,
  outreach_enabled = true
WHERE slug = 'recovery-alliance-el-paso' 
   OR name ILIKE '%recovery%alliance%el%paso%';

-- STEP 2: Create invite code for RAEP
-- ============================================================================
INSERT INTO organization_invite_codes (
  organization_id,
  code,
  role,
  expires_at,
  max_uses,
  current_uses,
  is_active
)
SELECT 
  id as organization_id,
  'RAEP2025' as code,
  'Responder' as role,
  NOW() + INTERVAL '1 year' as expires_at,
  NULL as max_uses,  -- Unlimited uses
  0 as current_uses,
  true as is_active
FROM organizations
WHERE slug = 'recovery-alliance-el-paso' 
   OR name ILIKE '%recovery%alliance%el%paso%'
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  expires_at = NOW() + INTERVAL '1 year';

-- STEP 3: Verification
-- ============================================================================

-- Show RAEP organization details
SELECT 
  '=== RAEP Organization ===' as section,
  id,
  name,
  slug,
  is_certified,
  is_public,
  is_active,
  outreach_enabled
FROM organizations
WHERE slug = 'recovery-alliance-el-paso' 
   OR name ILIKE '%recovery%alliance%';

-- Show RAEP invite codes
SELECT 
  '=== RAEP Invite Codes ===' as section,
  ic.code,
  ic.role,
  ic.is_active,
  ic.expires_at,
  ic.max_uses,
  ic.current_uses,
  ic.created_at,
  o.name as organization
FROM organization_invite_codes ic
JOIN organizations o ON ic.organization_id = o.id
WHERE o.slug = 'recovery-alliance-el-paso' 
   OR o.name ILIKE '%recovery%alliance%';

-- Show all pending certification requests
SELECT 
  '=== Pending Certification Requests ===' as section,
  id,
  organization_name,
  contact_name,
  contact_email,
  city,
  state,
  status,
  created_at
FROM organization_certification_requests
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Summary
SELECT 
  '=== Summary ===' as section,
  (SELECT COUNT(*) FROM organizations WHERE is_certified = true) as certified_orgs,
  (SELECT COUNT(*) FROM organization_invite_codes WHERE is_active = true) as active_codes,
  (SELECT COUNT(*) FROM organization_certification_requests WHERE status = 'pending') as pending_requests;

-- ============================================================================
-- RESULT: Share code "RAEP2025" with your staff!
-- ============================================================================
