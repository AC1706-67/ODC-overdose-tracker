-- ============================================================================
-- END-TO-END SIGNUP FLOW TEST
-- ============================================================================
-- This script tests the complete signup flow by simulating a user signup
-- WARNING: This creates test data - only run in dev/test environment
-- ============================================================================

-- STEP 1: Verify all components are in place
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
  org_count INTEGER;
BEGIN
  -- Check trigger
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created'
    AND event_object_table = 'users'
    AND event_object_schema = 'auth';
  
  -- Check function
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'handle_new_user_signup';
  
  -- Check default org
  SELECT COUNT(*) INTO org_count
  FROM organizations
  WHERE slug = 'anonymous-haven-ai';
  
  RAISE NOTICE '=== Pre-flight Check ===';
  RAISE NOTICE 'Trigger exists: %', CASE WHEN trigger_count > 0 THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Function exists: %', CASE WHEN function_count > 0 THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Default org exists: %', CASE WHEN org_count > 0 THEN '✅' ELSE '❌' END;
  
  IF trigger_count = 0 OR function_count = 0 OR org_count = 0 THEN
    RAISE EXCEPTION 'Pre-flight check failed - missing components';
  END IF;
END $$;

-- STEP 2: Create a test user (simulates signup)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'signup-test-' || floor(random() * 10000) || '@example.com';
BEGIN
  RAISE NOTICE '=== Creating Test User ===';
  RAISE NOTICE 'Email: %', test_email;
  RAISE NOTICE 'User ID: %', test_user_id;
  
  -- Insert into auth.users (this will trigger our function)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    test_email,
    crypt('testpass123', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'terms_accepted_at', now()::text,
      'privacy_accepted_at', now()::text,
      'accepted_version', '1.0'
    ),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );
  
  RAISE NOTICE '✅ Test user created in auth.users';
  
  -- Wait a moment for trigger to complete
  PERFORM pg_sleep(0.5);
  
  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
    RAISE NOTICE '✅ Profile created successfully';
  ELSE
    RAISE WARNING '❌ Profile was NOT created - trigger may have failed';
  END IF;
  
  -- Check if user_organizations entry was created
  IF EXISTS (SELECT 1 FROM user_organizations WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✅ Organization assignment created successfully';
  ELSE
    RAISE WARNING '❌ Organization assignment was NOT created';
  END IF;
  
  -- Show the results
  RAISE NOTICE '=== Test Results ===';
  
  -- Show profile
  PERFORM (
    SELECT RAISE NOTICE 'Profile: email=%, display_name=%, terms_accepted=%', 
      email, display_name, terms_accepted_at IS NOT NULL
    FROM profiles WHERE id = test_user_id
  );
  
  -- Show org assignment
  PERFORM (
    SELECT RAISE NOTICE 'Organization: name=%, role=%', o.name, uo.role
    FROM user_organizations uo
    JOIN organizations o ON uo.organization_id = o.id
    WHERE uo.user_id = test_user_id
  );
  
END $$;

-- STEP 3: Show test user details
SELECT 
  '=== Test User Profile ===' as section,
  p.id,
  p.email,
  p.display_name,
  p.terms_accepted_at IS NOT NULL as has_terms_timestamp,
  p.privacy_accepted_at IS NOT NULL as has_privacy_timestamp,
  p.accepted_version,
  p.is_active
FROM profiles p
WHERE p.email LIKE 'signup-test-%@example.com'
ORDER BY p.created_at DESC
LIMIT 1;

-- STEP 4: Show test user organization
SELECT 
  '=== Test User Organization ===' as section,
  u.email,
  o.name as organization,
  o.slug,
  uo.role,
  uo.is_active
FROM auth.users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email LIKE 'signup-test-%@example.com'
ORDER BY u.created_at DESC
LIMIT 1;

-- STEP 5: Cleanup (optional - comment out if you want to keep test data)
/*
DELETE FROM auth.users 
WHERE email LIKE 'signup-test-%@example.com';

RAISE NOTICE '✅ Test data cleaned up';
*/

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- Pre-flight Check:
--   ✅ Trigger exists
--   ✅ Function exists
--   ✅ Default org exists
--
-- Test User Creation:
--   ✅ Test user created in auth.users
--   ✅ Profile created successfully
--   ✅ Organization assignment created successfully
--
-- Test User Profile:
--   - email: signup-test-XXXX@example.com
--   - has_terms_timestamp: true
--   - has_privacy_timestamp: true
--   - accepted_version: 1.0
--   - is_active: true
--
-- Test User Organization:
--   - organization: Anonymous Haven AI
--   - slug: anonymous-haven-ai
--   - role: Responder
--   - is_active: true
--
-- If all checks pass, the signup flow is working correctly! ✅
-- ============================================================================
