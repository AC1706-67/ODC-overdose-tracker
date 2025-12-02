-- Verify Team Member Organization Assignment
-- Run this in Supabase SQL Editor to check if team members are correctly assigned

-- 1. Check all team members and their organizations
SELECT 
  tm.id,
  tm.name,
  tm.organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  tm.is_active,
  tm.created_at
FROM team_members tm
LEFT JOIN organizations o ON tm.organization_id = o.id
ORDER BY o.name, tm.name;

-- 2. Count team members per organization
SELECT 
  o.name as organization_name,
  o.slug,
  COUNT(tm.id) as team_member_count,
  COUNT(CASE WHEN tm.is_active THEN 1 END) as active_members
FROM organizations o
LEFT JOIN team_members tm ON o.id = tm.organization_id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- 3. Find any team members with NULL or invalid organization_id
SELECT 
  tm.id,
  tm.name,
  tm.organization_id,
  tm.is_active
FROM team_members tm
WHERE tm.organization_id IS NULL
   OR NOT EXISTS (
     SELECT 1 FROM organizations o WHERE o.id = tm.organization_id
   );

-- 4. Check for duplicate team members across organizations
-- (same name in multiple orgs - this is OK, just informational)
SELECT 
  tm.name,
  COUNT(DISTINCT tm.organization_id) as org_count,
  STRING_AGG(DISTINCT o.name, ', ') as organizations
FROM team_members tm
JOIN organizations o ON tm.organization_id = o.id
WHERE tm.is_active = true
GROUP BY tm.name
HAVING COUNT(DISTINCT tm.organization_id) > 1
ORDER BY tm.name;

-- 5. Verify RLS policies are active on team_members
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
WHERE tablename = 'team_members'
ORDER BY policyname;
