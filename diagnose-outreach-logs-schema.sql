-- ============================================================================
-- OUTREACH LOGS DIAGNOSTICS - READ-ONLY QUERIES
-- ============================================================================

-- 1. Table schema: columns and defaults
SELECT 
  '=== OUTREACH_LOGS SCHEMA ===' as section;

SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'outreach_logs' 
ORDER BY ordinal_position;

-- 2. RLS policies
SELECT 
  '=== RLS POLICIES ===' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- 3. RLS enabled status
SELECT 
  '=== RLS STATUS ===' as section;

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs';

-- 4. Count of logs by organization
SELECT 
  '=== LOGS BY ORGANIZATION ===' as section;

SELECT 
  ol.organization_id,
  o.name as org_name,
  o.slug as org_slug,
  COUNT(*) as log_count,
  MIN(ol.created_at) as first_log,
  MAX(ol.created_at) as last_log
FROM public.outreach_logs ol
LEFT JOIN public.organizations o ON ol.organization_id = o.id
GROUP BY ol.organization_id, o.name, o.slug
ORDER BY log_count DESC;

-- 5. Organizations with outreach enabled
SELECT 
  '=== ORGANIZATIONS WITH OUTREACH ENABLED ===' as section;

SELECT 
  id,
  name,
  slug,
  outreach_enabled,
  is_active
FROM public.organizations
WHERE outreach_enabled = true
ORDER BY name;
