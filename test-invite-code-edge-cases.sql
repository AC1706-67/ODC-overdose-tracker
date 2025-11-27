-- ============================================================================
-- INVITE CODE EDGE CASE TESTS
-- ============================================================================
-- This script tests all edge cases for invite code redemption
-- Run this in Supabase SQL Editor to verify the system handles all scenarios
-- ============================================================================

-- ============================================================================
-- SETUP: Create test organization and codes
-- ============================================================================

-- Create a test organization (if not exists)
INSERT INTO public.organizations (
  slug,
  name,
  type,
  is_active,
  is_certified,
  is_public
)
VALUES (
  'test-org-invite-codes',
  'Test Organization for Invite Codes',
  'Testing',
  true,
  true,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  is_active = true;

-- Get the test org ID
DO $$
DECLARE
  test_org_id uuid;
BEGIN
  SELECT id INTO test_org_id
  FROM public.organizations
  WHERE slug = 'test-org-invite-codes';

  -- Create test invite codes for different scenarios
  
  -- 1. Valid code (unlimited uses, no expiration)
  INSERT INTO public.organization_invite_codes (
    code,
    organization_id,
    role,
    is_active,
    max_uses,
    current_uses,
    expires_at,
    created_by
  )
  VALUES (
    'TEST-VALID-001',
    test_org_id,
    'Responder',
    true,
    NULL,
    0,
    NULL,
    (SELECT id FROM auth.users LIMIT 1)
  )
  ON CONFLICT (code) DO UPDATE SET
    is_active = true,
    current_uses = 0;

  -- 2. Expired code
  INSERT INTO public.organization_invite_codes (
    code,
    organization_id,
    role,
    is_active,
    max_uses,
    current_uses,
    expires_at,
    created_by
  )
  VALUES (
    'TEST-EXPIRED-002',
    test_org_id,
    'Responder',
    true,
    NULL,
    0,
    now() - interval '1 day',  -- Expired yesterday
    (SELECT id FROM auth.users LIMIT 1)
  )
  ON CONFLICT (code) DO UPDATE SET
    expires_at = now() - interval '1 day';

  -- 3. Max uses reached
  INSERT INTO public.organization_invite_codes (
    code,
    organization_id,
    role,
    is_active,
    max_uses,
    current_uses,
    expires_at,
    created_by
  )
  VALUES (
    'TEST-MAXED-003',
    test_org_id,
    'Responder',
    true,
    5,
    5,  -- Already at max
    NULL,
    (SELECT id FROM auth.users LIMIT 1)
  )
  ON CONFLICT (code) DO UPDATE SET
    max_uses = 5,
    current_uses = 5;

  -- 4. Inactive code
  INSERT INTO public.organization_invite_codes (
    code,
    organization_id,
    role,
    is_active,
    max_uses,
    current_uses,
    expires_at,
    created_by
  )
  VALUES (
    'TEST-INACTIVE-004',
    test_org_id,
    'Responder',
    false,  -- Inactive
    NULL,
    0,
    NULL,
    (SELECT id FROM auth.users LIMIT 1)
  )
  ON CONFLICT (code) DO UPDATE SET
    is_active = false;

  -- 5. Code with 1 use remaining
  INSERT INTO public.organization_invite_codes (
    code,
    organization_id,
    role,
    is_active,
    max_uses,
    current_uses,
    expires_at,
    created_by
  )
  VALUES (
    'TEST-ONEUSE-005',
    test_org_id,
    'Responder',
    true,
    5,
    4,  -- 1 use remaining
    NULL,
    (SELECT id FROM auth.users LIMIT 1)
  )
  ON CONFLICT (code) DO UPDATE SET
    max_uses = 5,
    current_uses = 4;

  -- 6. Code expiring soon (valid for 1 hour)
  INSERT INTO public.organization_invite_codes (
    code,
    organization_id,
    role,
    is_active,
    max_uses,
    current_uses,
    expires_at,
    created_by
  )
  VALUES (
    'TEST-EXPIRING-006',
    test_org_id,
    'Responder',
    true,
    NULL,
    0,
    now() + interval '1 hour',
    (SELECT id FROM auth.users LIMIT 1)
  )
  ON CONFLICT (code) DO UPDATE SET
    expires_at = now() + interval '1 hour';

  RAISE NOTICE '✅ Test invite codes created successfully';
END $$;

-- ============================================================================
-- TEST 1: Valid Code (Should Succeed)
-- ============================================================================

SELECT '=== TEST 1: Valid Code ===' as test;

SELECT 
  code,
  is_active,
  expires_at,
  max_uses,
  current_uses,
  CASE 
    WHEN is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR current_uses < max_uses)
    THEN '✅ PASS: Code is valid'
    ELSE '❌ FAIL: Code should be valid'
  END as result
FROM public.organization_invite_codes
WHERE code = 'TEST-VALID-001';

-- Test the RPC function
SELECT 
  '=== TEST 1: RPC Call ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('TEST-VALID-001') IS NOT NULL
    THEN '✅ PASS: RPC returned org ID'
    ELSE '❌ FAIL: RPC returned NULL'
  END as result;

-- ============================================================================
-- TEST 2: Expired Code (Should Fail)
-- ============================================================================

SELECT '=== TEST 2: Expired Code ===' as test;

SELECT 
  code,
  is_active,
  expires_at,
  expires_at < now() as is_expired,
  CASE 
    WHEN expires_at < now()
    THEN '✅ PASS: Code is expired'
    ELSE '❌ FAIL: Code should be expired'
  END as result
FROM public.organization_invite_codes
WHERE code = 'TEST-EXPIRED-002';

-- Test the RPC function (should return NULL)
SELECT 
  '=== TEST 2: RPC Call ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('TEST-EXPIRED-002') IS NULL
    THEN '✅ PASS: RPC correctly rejected expired code'
    ELSE '❌ FAIL: RPC should reject expired code'
  END as result;

-- ============================================================================
-- TEST 3: Max Uses Reached (Should Fail)
-- ============================================================================

SELECT '=== TEST 3: Max Uses Reached ===' as test;

SELECT 
  code,
  max_uses,
  current_uses,
  current_uses >= max_uses as at_max,
  CASE 
    WHEN current_uses >= max_uses
    THEN '✅ PASS: Code is at max uses'
    ELSE '❌ FAIL: Code should be at max uses'
  END as result
FROM public.organization_invite_codes
WHERE code = 'TEST-MAXED-003';

-- Test the RPC function (should return NULL)
SELECT 
  '=== TEST 3: RPC Call ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('TEST-MAXED-003') IS NULL
    THEN '✅ PASS: RPC correctly rejected maxed code'
    ELSE '❌ FAIL: RPC should reject maxed code'
  END as result;

-- ============================================================================
-- TEST 4: Inactive Code (Should Fail)
-- ============================================================================

SELECT '=== TEST 4: Inactive Code ===' as test;

SELECT 
  code,
  is_active,
  CASE 
    WHEN is_active = false
    THEN '✅ PASS: Code is inactive'
    ELSE '❌ FAIL: Code should be inactive'
  END as result
FROM public.organization_invite_codes
WHERE code = 'TEST-INACTIVE-004';

-- Test the RPC function (should return NULL)
SELECT 
  '=== TEST 4: RPC Call ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('TEST-INACTIVE-004') IS NULL
    THEN '✅ PASS: RPC correctly rejected inactive code'
    ELSE '❌ FAIL: RPC should reject inactive code'
  END as result;

-- ============================================================================
-- TEST 5: Code with 1 Use Remaining (Should Succeed Once)
-- ============================================================================

SELECT '=== TEST 5: One Use Remaining ===' as test;

-- Check initial state
SELECT 
  code,
  max_uses,
  current_uses,
  max_uses - current_uses as uses_remaining,
  CASE 
    WHEN max_uses - current_uses = 1
    THEN '✅ PASS: Code has 1 use remaining'
    ELSE '❌ FAIL: Code should have 1 use remaining'
  END as result
FROM public.organization_invite_codes
WHERE code = 'TEST-ONEUSE-005';

-- Test the RPC function (should succeed)
SELECT 
  '=== TEST 5: RPC Call (First Use) ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('TEST-ONEUSE-005') IS NOT NULL
    THEN '✅ PASS: RPC accepted code with 1 use remaining'
    ELSE '❌ FAIL: RPC should accept code with uses remaining'
  END as result;

-- Check that it's now maxed out
SELECT 
  code,
  max_uses,
  current_uses,
  CASE 
    WHEN current_uses >= max_uses
    THEN '✅ PASS: Code is now maxed out'
    ELSE '❌ FAIL: Code should be maxed out after use'
  END as result
FROM public.organization_invite_codes
WHERE code = 'TEST-ONEUSE-005';

-- Try again (should fail)
SELECT 
  '=== TEST 5: RPC Call (Second Use) ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('TEST-ONEUSE-005') IS NULL
    THEN '✅ PASS: RPC correctly rejected maxed code'
    ELSE '❌ FAIL: RPC should reject maxed code'
  END as result;

-- ============================================================================
-- TEST 6: Code Expiring Soon (Should Succeed)
-- ============================================================================

SELECT '=== TEST 6: Code Expiring Soon ===' as test;

SELECT 
  code,
  expires_at,
  expires_at > now() as is_valid,
  extract(epoch from (expires_at - now())) / 60 as minutes_remaining,
  CASE 
    WHEN expires_at > now()
    THEN '✅ PASS: Code is still valid'
    ELSE '❌ FAIL: Code should still be valid'
  END as result
FROM public.organization_invite_codes
WHERE code = 'TEST-EXPIRING-006';

-- Test the RPC function (should succeed)
SELECT 
  '=== TEST 6: RPC Call ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('TEST-EXPIRING-006') IS NOT NULL
    THEN '✅ PASS: RPC accepted code expiring soon'
    ELSE '❌ FAIL: RPC should accept valid code'
  END as result;

-- ============================================================================
-- TEST 7: Invalid Code (Doesn't Exist)
-- ============================================================================

SELECT '=== TEST 7: Invalid Code ===' as test;

-- Test the RPC function with non-existent code (should return NULL)
SELECT 
  '=== TEST 7: RPC Call ===' as test,
  CASE 
    WHEN public.increment_invite_code_usage('INVALID-CODE-999') IS NULL
    THEN '✅ PASS: RPC correctly rejected invalid code'
    ELSE '❌ FAIL: RPC should reject invalid code'
  END as result;

-- ============================================================================
-- SUMMARY: Show all test codes and their states
-- ============================================================================

SELECT '=== SUMMARY: All Test Codes ===' as section;

SELECT 
  code,
  is_active,
  CASE 
    WHEN expires_at IS NULL THEN 'Never'
    WHEN expires_at < now() THEN 'Expired'
    ELSE 'Valid until ' || expires_at::text
  END as expiration_status,
  CASE 
    WHEN max_uses IS NULL THEN 'Unlimited'
    ELSE current_uses || '/' || max_uses
  END as usage_status,
  CASE 
    WHEN is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR current_uses < max_uses)
    THEN '✅ Valid'
    ELSE '❌ Invalid'
  END as overall_status
FROM public.organization_invite_codes
WHERE code LIKE 'TEST-%'
ORDER BY code;

-- ============================================================================
-- CLEANUP (Optional - uncomment to remove test data)
-- ============================================================================

-- Uncomment these lines to clean up test data:
/*
DELETE FROM public.organization_invite_codes WHERE code LIKE 'TEST-%';
DELETE FROM public.organizations WHERE slug = 'test-org-invite-codes';
SELECT '✅ Test data cleaned up' as cleanup_status;
*/
