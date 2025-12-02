-- ============================================================================
-- SEARCH FOR ALL TRIGGERS ON auth.users
-- ============================================================================
-- This will help us identify if there are any existing triggers before
-- we recreate the signup trigger

-- 1. Check all triggers on auth.users table
SELECT 
  '=== All Triggers on auth.users ===' as section,
  trigger_schema,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Check for any trigger with similar names (case-insensitive)
SELECT 
  '=== Triggers with Similar Names ===' as section,
  trigger_schema,
  trigger_name,
  event_object_schema,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE LOWER(trigger_name) LIKE '%auth%user%'
   OR LOWER(trigger_name) LIKE '%signup%'
   OR LOWER(trigger_name) LIKE '%new%user%'
ORDER BY trigger_name;

-- 3. Check if our function exists and is callable
SELECT 
  '=== Signup Function Details ===' as section,
  proname as function_name,
  pronamespace::regnamespace as schema,
  prosecdef as is_security_definer,
  provolatile as volatility,
  proacl as permissions
FROM pg_proc
WHERE proname = 'handle_new_user_signup';

-- 4. Check permissions on auth schema
SELECT 
  '=== Auth Schema Permissions ===' as section,
  nspname as schema_name,
  nspowner::regrole as owner,
  nspacl as permissions
FROM pg_namespace
WHERE nspname = 'auth';

-- 5. Check if we can create triggers on auth.users
-- (This is informational - we'll see if there are any restrictions)
SELECT 
  '=== auth.users Table Info ===' as section,
  schemaname,
  tablename,
  tableowner,
  tablespace
FROM pg_tables
WHERE schemaname = 'auth'
  AND tablename = 'users';
