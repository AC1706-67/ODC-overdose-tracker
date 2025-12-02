-- Check all triggers on auth.users table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Check if handle_new_user function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname IN ('handle_new_user', 'auto_assign_default_organization');

-- Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check user_organizations table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_organizations'
ORDER BY ordinal_position;

-- Check if "Anonymous Haven AI" organization exists
SELECT 
  id,
  name,
  slug,
  is_active
FROM public.organizations
WHERE slug IN ('haven-ai', 'anonymous-haven-ai', 'anonymous-haven')
   OR name ILIKE '%anonymous%haven%';
