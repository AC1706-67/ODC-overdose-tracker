-- Check if there's a trigger or function automatically creating profiles

-- 1. Check for triggers on auth.users
SELECT 
  'Triggers on auth.users' as check_type,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Check for functions that might auto-create profiles
SELECT 
  'Functions that might auto-create profiles' as check_type,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%profile%'
    OR p.proname LIKE '%signup%'
    OR p.proname LIKE '%new_user%'
    OR pg_get_functiondef(p.oid) LIKE '%INSERT INTO%profiles%'
  )
ORDER BY p.proname;

-- 3. Check recent profile creations vs auth user creations
SELECT 
  'Recent signup timing analysis' as check_type,
  au.email,
  au.created_at as auth_created,
  p.created_at as profile_created,
  EXTRACT(EPOCH FROM (p.created_at - au.created_at)) as seconds_difference,
  CASE 
    WHEN EXTRACT(EPOCH FROM (p.created_at - au.created_at)) < 1 THEN '⚡ Instant (likely trigger)'
    WHEN EXTRACT(EPOCH FROM (p.created_at - au.created_at)) < 5 THEN '🚀 Very fast (likely app)'
    ELSE '🐌 Slow (definitely app)'
  END as speed
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '1 hour'
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Check for database webhooks (if accessible)
-- Note: This might not work depending on permissions
SELECT 
  'Database webhooks' as check_type,
  *
FROM supabase_functions.hooks
WHERE true
LIMIT 10;
