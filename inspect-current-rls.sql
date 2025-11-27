-- ============================================================================
-- INSPECT CURRENT RLS STATE
-- ============================================================================
-- This script inspects all RLS policies and schema for the multi-tenant tables
-- ============================================================================

-- Check RLS enabled status for key tables
SELECT 
  '=== RLS ENABLED STATUS ===' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('outreach_logs', 'incidents', 'overdose_incidents', 'dashboards', 'user_organizations', 'organizations')
ORDER BY tablename;

-- List all policies for outreach_logs
SELECT 
  '=== OUTREACH_LOGS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'outreach_logs'
ORDER BY policyname;

-- List all policies for incidents
SELECT 
  '=== INCIDENTS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'incidents'
ORDER BY policyname;

-- List all policies for overdose_incidents
SELECT 
  '=== OVERDOSE_INCIDENTS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'overdose_incidents'
ORDER BY policyname;

-- List all policies for dashboards (if exists)
SELECT 
  '=== DASHBOARDS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'dashboards'
ORDER BY policyname;

-- List all policies for user_organizations
SELECT 
  '=== USER_ORGANIZATIONS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_organizations'
ORDER BY policyname;

-- List all policies for organizations
SELECT 
  '=== ORGANIZATIONS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'organizations'
ORDER BY policyname;

-- Check for helper functions
SELECT 
  '=== HELPER FUNCTIONS ===' as section,
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname IN ('is_org_admin', 'is_org_member', 'user_has_org_access')
  AND pronamespace = 'public'::regnamespace;

-- Check organizations table structure
SELECT 
  '=== ORGANIZATIONS COLUMNS ===' as section,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
ORDER BY ordinal_position;

-- Check incidents table structure (for zip_code column)
SELECT 
  '=== INCIDENTS COLUMNS ===' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'incidents'
  AND column_name IN ('zip_code', 'occurred_at', 'organization_id', 'created_at', 'incident_date')
ORDER BY ordinal_position;

-- Check outreach_logs table structure
SELECT 
  '=== OUTREACH_LOGS COLUMNS ===' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'outreach_logs'
  AND column_name IN ('organization_id', 'created_by', 'zip_code')
ORDER BY ordinal_position;
