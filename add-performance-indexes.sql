-- ============================================================================
-- PERFORMANCE INDEXES FOR RLS POLICIES
-- ============================================================================
-- These indexes speed up the EXISTS checks in RLS policies
-- Improves performance for SELECT/INSERT/UPDATE operations
-- ============================================================================

-- Index for user_organizations lookups (used by all RLS policies)
CREATE INDEX IF NOT EXISTS idx_user_organizations_lookup 
ON public.user_organizations (user_id, organization_id, is_active);

-- Index for organization_id lookups on incidents
CREATE INDEX IF NOT EXISTS idx_incidents_organization_id 
ON public.incidents (organization_id);

-- Index for organization_id lookups on outreach_logs
CREATE INDEX IF NOT EXISTS idx_outreach_logs_organization_id 
ON public.outreach_logs (organization_id);

-- Index for user_id lookups on outreach_logs (for UPDATE policy)
CREATE INDEX IF NOT EXISTS idx_outreach_logs_user_id 
ON public.outreach_logs (user_id);

-- Index for created_by lookups on incidents (for UPDATE policy)
CREATE INDEX IF NOT EXISTS idx_incidents_created_by 
ON public.incidents (created_by);

-- Verify indexes were created
SELECT 
  '=== PERFORMANCE INDEXES CREATED ===' as section;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_organizations', 'incidents', 'outreach_logs')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Summary
SELECT 
  '=== SUMMARY ===' as section;

SELECT 
  'Indexes on user_organizations' as metric,
  COUNT(*)::text as count
FROM pg_indexes
WHERE tablename = 'user_organizations' 
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT 
  'Indexes on incidents' as metric,
  COUNT(*)::text as count
FROM pg_indexes
WHERE tablename = 'incidents' 
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT 
  'Indexes on outreach_logs' as metric,
  COUNT(*)::text as count
FROM pg_indexes
WHERE tablename = 'outreach_logs' 
  AND indexname LIKE 'idx_%';
