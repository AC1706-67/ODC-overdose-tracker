-- Verify achavez@recoveryalliance.net membership and org settings

-- 1. Find the user
SELECT 
  '=== USER INFO ===' as section,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'achavez@recoveryalliance.net';

-- 2. Check user's organization memberships
SELECT 
  '=== USER MEMBERSHIPS ===' as section,
  uo.user_id,
  uo.organization_id,
  o.name as org_name,
  o.slug as org_slug,
  uo.role,
  uo.is_active,
  o.outreach_enabled,
  o.is_active as org_is_active
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
JOIN auth.users u ON u.id = uo.user_id
WHERE u.email = 'achavez@recoveryalliance.net';

-- 3. Check RAEP org details
SELECT 
  '=== RAEP ORG DETAILS ===' as section,
  id,
  name,
  slug,
  outreach_enabled,
  is_active,
  is_certified,
  is_public
FROM organizations
WHERE slug = 'raep';

-- 4. If no membership found, show what we need to fix
SELECT 
  '=== DIAGNOSIS ===' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'achavez@recoveryalliance.net'
    ) THEN 'User exists ✓'
    ELSE 'User NOT found ✗'
  END as user_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM organizations WHERE slug = 'raep'
    ) THEN 'RAEP org exists ✓'
    ELSE 'RAEP org NOT found ✗'
  END as org_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM user_organizations uo
      JOIN auth.users u ON u.id = uo.user_id
      JOIN organizations o ON o.id = uo.organization_id
      WHERE u.email = 'achavez@recoveryalliance.net'
        AND o.slug = 'raep'
    ) THEN 'Membership exists ✓'
    ELSE 'Membership MISSING ✗'
  END as membership_status;
