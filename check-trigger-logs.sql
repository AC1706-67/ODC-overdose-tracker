-- ============================================================================
-- CHECK TRIGGER AND DEBUG SIGNUP
-- ============================================================================

-- 1. Verify trigger exists
SELECT 
  'Trigger Status' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name LIKE '%signup%';

-- 2. Check if Anonymous Haven AI exists
SELECT 
  'Org Check' as check_type,
  id,
  name,
  slug
FROM public.organizations
WHERE slug = 'anonymous-haven-ai';

-- 3. Check profiles table columns (what the trigger tries to insert)
SELECT 
  'Profiles Columns' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check user_organizations columns
SELECT 
  'User Orgs Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_organizations'
ORDER BY ordinal_position;

-- 5. Check recent auth.users (to see if signup is creating users)
SELECT 
  'Recent Users' as check_type,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if those users have profiles
SELECT 
  'Users Without Profiles' as check_type,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;
