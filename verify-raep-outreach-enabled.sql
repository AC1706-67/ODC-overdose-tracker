-- ============================================================================
-- VERIFY AND FIX: RAEP outreach_enabled status
-- ============================================================================

-- Step 1: Check current status
SELECT 
  '=== Current RAEP Status ===' as section,
  id,
  name,
  slug,
  outreach_enabled,
  is_active,
  is_certified,
  is_public
FROM organizations
WHERE slug = 'raep' 
   OR name ILIKE '%recovery%alliance%el%paso%'
   OR id = '6e892800-0429-442f-bff8-417b4d4ec793';

-- Step 2: Enable outreach for RAEP if not already enabled
UPDATE organizations
SET outreach_enabled = true
WHERE (slug = 'raep' OR id = '6e892800-0429-442f-bff8-417b4d4ec793')
  AND (outreach_enabled IS NULL OR outreach_enabled = false);

-- Step 3: Verify the update
SELECT 
  '=== Updated RAEP Status ===' as section,
  id,
  name,
  slug,
  outreach_enabled,
  is_active,
  is_certified,
  is_public
FROM organizations
WHERE slug = 'raep' 
   OR name ILIKE '%recovery%alliance%el%paso%'
   OR id = '6e892800-0429-442f-bff8-417b4d4ec793';

-- Step 4: Check RAEP members
SELECT 
  '=== RAEP Members ===' as section,
  u.email,
  uo.role,
  uo.is_active,
  o.name as organization
FROM user_organizations uo
JOIN auth.users u ON uo.user_id = u.id
JOIN organizations o ON uo.organization_id = o.id
WHERE o.slug = 'raep' OR o.id = '6e892800-0429-442f-bff8-417b4d4ec793'
ORDER BY u.email;
