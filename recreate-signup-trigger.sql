-- ============================================================================
-- RECREATE SIGNUP TRIGGER
-- ============================================================================
-- This script recreates the missing on_auth_user_created trigger
-- that calls handle_new_user_signup() when new users sign up
-- ============================================================================

-- STEP 1: Verify the function exists
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname = 'handle_new_user_signup';
  
  IF func_count = 0 THEN
    RAISE EXCEPTION 'Function handle_new_user_signup() does not exist! Run the migration first.';
  ELSE
    RAISE NOTICE '✅ Function handle_new_user_signup() exists';
  END IF;
END $$;

-- STEP 2: Drop any existing trigger (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- STEP 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- STEP 4: Verify the trigger was created
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'auth'
    AND event_object_table = 'users'
    AND trigger_name = 'on_auth_user_created';
  
  IF trigger_count = 0 THEN
    RAISE EXCEPTION '❌ Trigger was not created! Check permissions on auth.users table.';
  ELSE
    RAISE NOTICE '✅ Trigger on_auth_user_created successfully created';
  END IF;
END $$;

-- STEP 5: Show the trigger details
SELECT 
  '=== Trigger Created Successfully ===' as status,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- ============================================================================
-- NOTES
-- ============================================================================
-- If this script fails with a permissions error, you may need to:
-- 1. Run it as a superuser or postgres role
-- 2. Grant trigger permissions: GRANT TRIGGER ON auth.users TO postgres;
-- 3. Contact Supabase support if running on hosted Supabase
--
-- The trigger should now fire automatically when new users sign up via
-- supabase.auth.signUp() in your app.
-- ============================================================================
