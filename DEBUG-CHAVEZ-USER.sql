-- ============================================================================
-- DEBUG: Check Chavez User Status
-- ============================================================================

-- 1. Find your user
SELECT 
  '=== YOUR USER ===' as section,
  id,
  email,
  created_at
FROM auth.users
WHERE email ILIKE '%chavez%' OR email ILIKE '%recovery%';

-- 2. Check your organization memberships
SELECT 
  '=== YOUR ORG MEMBERSHIPS ===' as section,
  u.email,
  o.id as org_id,
  o.name as organization,
  o.slug,
  o.is_active as org_active,
  o.outreach_enabled,
  uo.role,
  uo.is_active as membership_active
FROM auth.users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email ILIKE '%chavez%' OR u.email ILIKE '%recovery%';

-- 3. Check RAEP organization details
SELECT 
  '=== RAEP ORG DETAILS ===' as section,
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

-- 4. Check if you have NO organization (the problem)
SELECT 
  '=== USERS WITHOUT ORGS ===' as section,
  u.email,
  u.id
FROM auth.users u
LEFT JOIN user_organizations uo ON u.id = uo.user_id
WHERE uo.user_id IS NULL
  AND (u.email ILIKE '%chavez%' OR u.email ILIKE '%recovery%');
