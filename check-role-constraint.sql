-- Check the role constraint on user_organizations table
SELECT 
  '=== user_organizations role constraint ===' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_organizations'::regclass
  AND conname LIKE '%role%';

-- Show the table definition
SELECT 
  '=== user_organizations table columns ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_organizations'
ORDER BY ordinal_position;
