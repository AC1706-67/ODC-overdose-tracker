-- Simplified investigation of automatic profile creation
-- Avoids pg_get_functiondef() which can trigger array_agg errors

-- 1. Check for triggers on auth.users
SELECT 
  '1. Triggers on auth.users' as check_type,
  trigger_name,
  event_manipulation as event,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. List functions that might auto-create profiles (names only)
SELECT 
  '2. Functions related to profiles/signup' as check_type,
  p.proname as function_name,
  n.nspname as schema_name,
  CASE 
    WHEN p.proname LIKE '%profile%' THEN '📝 Profile-related'
    WHEN p.proname LIKE '%signup%' THEN '✍️ Signup-related'
    WHEN p.proname LIKE '%new_user%' THEN '👤 New user-related'
    ELSE '❓ Other'
  END as category
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%profile%'
    OR p.proname LIKE '%signup%'
    OR p.proname LIKE '%new_user%'
  )
ORDER BY p.proname;

-- 3. Check recent profile creations vs auth user creations
SELECT 
  '3. Recent signup timing' as check_type,
  au.email,
  au.created_at as auth_created,
  p.created_at as profile_created,
  ROUND(EXTRACT(EPOCH FROM (p.created_at - au.created_at))::numeric, 3) as seconds_difference,
  CASE 
    WHEN EXTRACT(EPOCH FROM (p.created_at - au.created_at)) < 1 THEN '⚡ Instant (likely trigger/webhook)'
    WHEN EXTRACT(EPOCH FROM (p.created_at - au.created_at)) < 5 THEN '🚀 Very fast (likely app)'
    ELSE '🐌 Slow (definitely app)'
  END as speed
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '1 hour'
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Check if profiles table has any triggers
SELECT 
  '4. Triggers on profiles table' as check_type,
  trigger_name,
  event_manipulation as event,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles'
ORDER BY trigger_name;

-- 5. Summary: Are profiles being created automatically?
SELECT 
  '5. Summary' as check_type,
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as orphaned_users,
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ All users have profiles'
    ELSE '⚠️ ' || (COUNT(*) - COUNT(p.id)) || ' users without profiles'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;

-- 6. Check for any handle_new_user functions (old approach)
SELECT 
  '6. Old signup functions' as check_type,
  p.proname as function_name,
  CASE 
    WHEN p.proname LIKE '%handle_new_user%' THEN '⚠️ Old RPC approach (should be removed)'
    ELSE '✅ OK'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%handle_new_user%';
