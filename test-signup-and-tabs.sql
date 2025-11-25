-- ============================================================================
-- TEST: Sign-up and Tab Visibility Fixes
-- ============================================================================
-- This script tests all the fixes for:
-- 1. Sign-up database error
-- 2. Tab visibility for org members
-- 3. RAEP outreach access
-- ============================================================================

-- TEST 1: Verify trigger function uses correct role
-- ============================================================================
SELECT 
  '=== TEST 1: Trigger Function Role ===' as test,
  CASE 
    WHEN prosrc LIKE '%''Peer''%' THEN '✅ PASS: Uses Peer role'
    WHEN prosrc LIKE '%''member''%' THEN '❌ FAIL: Still uses member role'
    ELSE '⚠️  UNKNOWN: Cannot determine role'
  END as result
FROM pg_proc
WHERE proname = 'auto_assign_default_organization';

-- TEST 2: Verify RAEP has outreach enabled
-- ============================================================================
SELECT 
  '=== TEST 2: RAEP Outreach Enabled ===' as test,
  name,
  slug,
  CASE 
    WHEN outreach_enabled = true THEN '✅ PASS: Outreach enabled'
    WHEN outreach_enabled = false THEN '❌ FAIL: Outreach disabled'
    ELSE '❌ FAIL: Outreach is NULL'
  END as result
FROM organizations
WHERE slug = 'raep' OR id = '6e892800-0429-442f-bff8-417b4d4ec793';

-- TEST 3: Check RAEP members and their roles
-- ============================================================================
SELECT 
  '=== TEST 3: RAEP Members ===' as test,
  u.email,
  uo.role,
  uo.is_active,
  CASE 
    WHEN uo.role IN ('Admin', 'Responder', 'Peer') THEN '✅ Valid role'
    ELSE '❌ Invalid role'
  END as role_status
FROM user_organizations uo
JOIN auth.users u ON uo.user_id = u.id
JOIN organizations o ON uo.organization_id = o.id
WHERE o.slug = 'raep' OR o.id = '6e892800-0429-442f-bff8-417b4d4ec793'
ORDER BY u.email;

-- TEST 4: Verify Haven AI default org setup
-- ============================================================================
SELECT 
  '=== TEST 4: Haven AI Setup ===' as test,
  name,
  slug,
  is_active,
  is_certified,
  CASE 
    WHEN is_active = true AND is_certified = true THEN '✅ PASS: Properly configured'
    ELSE '❌ FAIL: Not properly configured'
  END as result
FROM organizations
WHERE slug = 'haven-ai';

-- TEST 5: Check for users without organizations (should be none after trigger)
-- ============================================================================
SELECT 
  '=== TEST 5: Users Without Orgs ===' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All users have orgs'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' users without orgs'
  END as result
FROM auth.users u
LEFT JOIN user_organizations uo ON u.id = uo.user_id
WHERE uo.user_id IS NULL;

-- TEST 6: Verify role constraint allows Peer, Admin, Responder
-- ============================================================================
SELECT 
  '=== TEST 6: Role Constraint ===' as test,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_organizations'::regclass
  AND conname LIKE '%role%';

-- TEST 7: Check all organizations with outreach enabled
-- ============================================================================
SELECT 
  '=== TEST 7: Orgs with Outreach ===' as test,
  name,
  slug,
  outreach_enabled,
  is_active,
  is_certified
FROM organizations
WHERE outreach_enabled = true
ORDER BY name;

-- SUMMARY
-- ============================================================================
SELECT 
  '=== SUMMARY ===' as section,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(DISTINCT user_id) FROM user_organizations) as users_with_orgs,
  (SELECT COUNT(*) FROM organizations WHERE outreach_enabled = true) as orgs_with_outreach,
  (SELECT COUNT(*) FROM user_organizations uo 
   JOIN organizations o ON uo.organization_id = o.id 
   WHERE o.outreach_enabled = true) as memberships_with_outreach_access;
