-- Verification SQL: Check current state of audit columns and triggers
-- Run this first to see what's missing

-- 1. Check columns for incidents, outreach_logs, distributions
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('incidents', 'outreach_logs', 'distributions')
  AND column_name IN ('created_at', 'created_by', 'updated_at', 'organization_id')
ORDER BY table_name, column_name;

-- 2. Check for existing triggers
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('incidents', 'outreach_logs', 'distributions')
ORDER BY event_object_table, trigger_name;

-- 3. Check if update_updated_at_column function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_updated_at_column';

-- 4. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('incidents', 'outreach_logs', 'distributions');

-- 5. List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('incidents', 'outreach_logs', 'distributions')
ORDER BY tablename, policyname;
