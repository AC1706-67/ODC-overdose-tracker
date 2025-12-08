-- ============================================================================
-- REMOVE OLD SIGNUP FUNCTIONS
-- ============================================================================
-- These functions were part of the old RPC-based signup approach.
-- They are no longer used (app uses direct database operations now).
-- Safe to remove since app/signup.tsx doesn't call them anymore.
-- ============================================================================

-- First, check what we're about to remove
SELECT 
  'Functions to be removed' as action,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proname = 'handle_new_user_signup_manual' THEN '⚠️ Main old signup function'
    WHEN p.proname = 'handle_new_user_signup' THEN '⚠️ Old signup function'
    WHEN p.proname = 'handle_new_user' THEN '⚠️ Old user handler'
    ELSE '❓ Unknown'
  END as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('handle_new_user', 'handle_new_user_signup', 'handle_new_user_signup_manual');

-- Drop the functions (safe because app doesn't use them)
DROP FUNCTION IF EXISTS public.handle_new_user_signup_manual(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.handle_new_user_signup_manual(UUID, TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user_signup(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.handle_new_user_signup(UUID, TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.handle_new_user(UUID, TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user(UUID);

-- Verify they're gone
SELECT 
  'Verification' as action,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All old signup functions removed'
    ELSE '⚠️ ' || COUNT(*) || ' functions still exist'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('handle_new_user', 'handle_new_user_signup', 'handle_new_user_signup_manual');

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. These functions are NOT being called by your app anymore
--    (app/signup.tsx uses direct INSERT operations)
--
-- 2. These functions are NOT creating profiles automatically
--    (no triggers found on auth.users)
--
-- 3. The "duplicate key" error you saw is likely from:
--    - A Supabase webhook (not visible in SQL)
--    - Or your app code running twice somehow
--
-- 4. After removing these functions:
--    - Signup will still work (app doesn't use them)
--    - Test with: node manual-signup-test.js
--    - No impact on existing users
--
-- 5. If you want to keep them as backup:
--    - Don't run this script
--    - They won't hurt anything (just unused)
-- ============================================================================
