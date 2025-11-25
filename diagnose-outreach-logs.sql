-- ============================================================================
-- DIAGNOSE OUTREACH LOGS ISSUE
-- ============================================================================
-- Run these queries in Supabase SQL Editor to find the problem
-- ============================================================================

-- 1️⃣ CHECK: Do outreach logs exist at all?
SELECT 
  '=== ALL OUTREACH LOGS ===' as section,
  id,
  organization_id,
  created_at,
  outreach_date,
  zip_code,
  kit_types,
  num_kits,
  people_reached
FROM public.outreach_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- 2️⃣ CHECK: Are logs tied to Recovery Alliance of El Paso?
SELECT 
  '=== RAEP OUTREACH LOGS ===' as section,
  ol.id,
  ol.organization_id,
  o.name as org_name,
  o.slug as org_slug,
  ol.outreach_date,
  ol.created_at,
  ol.zip_code,
  ol.kit_types,
  ol.num_kits,
  ol.people_reached,
  ol.males_reached,
  ol.females_reached
FROM public.outreach_logs ol
JOIN public.organizations o ON o.id = ol.organization_id
WHERE o.slug = 'raep'  -- Using slug since we know it's 'raep'
ORDER BY ol.created_at DESC 
LIMIT 20;

-- 3️⃣ CHECK: What's the RAEP org ID?
SELECT 
  '=== RAEP ORG INFO ===' as section,
  id,
  name,
  slug,
  outreach_enabled,
  is_active,
  is_certified
FROM public.organizations
WHERE slug = 'raep';

-- 4️⃣ CHECK: Is the user a member of RAEP?
SELECT 
  '=== USER MEMBERSHIP ===' as section,
  uo.user_id,
  u.email,
  uo.organization_id,
  o.name as org_name,
  o.slug as org_slug,
  uo.role,
  uo.is_active
FROM public.user_organizations uo
JOIN auth.users u ON u.id = uo.user_id
JOIN public.organizations o ON o.id = uo.organization_id
WHERE u.email = 'achavez@recoveryalliance.net'  -- CHANGE TO YOUR EMAIL
  AND o.slug = 'raep';

-- 5️⃣ CHECK: What RLS policies exist on outreach_logs?
SELECT 
  '=== RLS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'outreach_logs';

-- 6️⃣ CHECK: Is RLS enabled on outreach_logs?
SELECT 
  '=== RLS STATUS ===' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'outreach_logs';
