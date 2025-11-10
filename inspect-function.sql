-- Inspect existing create_team_member function
-- Run this in your Supabase SQL Editor to see the current function details

-- Method 1: Get function signature and return type
SELECT 
  p.proname as function_name,
  pg_catalog.pg_get_function_result(p.oid) as return_type,
  pg_catalog.pg_get_function_arguments(p.oid) as arguments,
  p.prosrc as source_code
FROM pg_proc p
LEFT JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'create_team_member'
  AND n.nspname = 'public';

-- Method 2: Get full function definition
SELECT pg_catalog.pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'create_team_member'
  AND n.nspname = 'public';

-- Method 3: Alternative using information_schema
SELECT 
  routine_name,
  data_type as return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_team_member'
  AND routine_schema = 'public';