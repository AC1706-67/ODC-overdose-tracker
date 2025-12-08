-- Check if there are any triggers on auth.users
SELECT 
  'Auth Triggers' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Check if there are any functions that might be called on signup
SELECT 
  'Signup Functions' as check_type,
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname LIKE '%signup%'
  OR proname LIKE '%new_user%'
  OR proname LIKE '%handle_new%';

-- Check recent auth users and their profiles
SELECT 
  'Recent Signups' as check_type,
  au.email,
  au.created_at as auth_created,
  p.created_at as profile_created,
  CASE 
    WHEN p.created_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (p.created_at - au.created_at)) || ' seconds'
    ELSE 'No profile'
  END as time_diff
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 5;
