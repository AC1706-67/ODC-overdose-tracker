-- =============================================
-- VERIFICATION SCRIPT FOR ONBOARDING MIGRATION
-- Run this after applying the migration to verify success
-- =============================================

-- Check 1: Verify new columns exist on organizations table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('is_certified', 'status', 'created_by', 'approved_by', 'approved_at', 'contact_email', 'contact_name', 'certification_notes')
ORDER BY column_name;

-- Check 2: Verify organization_invite_codes table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'organization_invite_codes';

-- Check 3: Verify invite codes table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organization_invite_codes'
ORDER BY ordinal_position;

-- Check 4: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'organization_invite_codes';

-- Check 5: Verify policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'organization_invite_codes'
ORDER BY policyname;

-- Check 6: Verify indexes created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('organization_invite_codes', 'organizations')
  AND indexname LIKE '%invite%' OR indexname LIKE '%certified%' OR indexname LIKE '%status%'
ORDER BY indexname;

-- Check 7: Verify function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'increment_invite_code_usage'
  AND routine_schema = 'public';

-- Check 8: Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'org_invite_codes_updated_at';

-- Check 9: View certified organizations
SELECT 
  name,
  slug,
  is_certified,
  status,
  approved_at
FROM organizations
WHERE is_certified = true
ORDER BY name;

-- Check 10: View invite codes
SELECT 
  code,
  description,
  role,
  is_active,
  max_uses,
  current_uses,
  expires_at,
  o.name as organization_name
FROM organization_invite_codes oic
JOIN organizations o ON o.id = oic.organization_id
ORDER BY code;

-- Check 11: Verify constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'organization_invite_codes'::regclass
   OR conrelid = 'organizations'::regclass
ORDER BY conrelid::text, conname;

-- =============================================
-- SUMMARY
-- =============================================
SELECT 
  'Migration Verification Complete' as status,
  (SELECT COUNT(*) FROM organization_invite_codes) as total_invite_codes,
  (SELECT COUNT(*) FROM organizations WHERE is_certified = true) as certified_orgs,
  (SELECT COUNT(*) FROM organizations WHERE status = 'pending') as pending_orgs;
