-- Cleanup Test Organizations
-- Run this in your Supabase SQL Editor to safely remove test organizations

-- First, let's see what data is associated with the test organizations
SELECT 'community-health-network dependencies:' as info;

-- Check team members
SELECT 'team_members' as table_name, COUNT(*) as count
FROM team_members tm
JOIN organizations o ON o.id = tm.organization_id
WHERE o.slug = 'community-health-network';

-- Check outreach logs
SELECT 'outreach_logs' as table_name, COUNT(*) as count
FROM outreach_logs ol
JOIN organizations o ON o.id = ol.organization_id
WHERE o.slug = 'community-health-network';

-- Check user memberships
SELECT 'user_organizations' as table_name, COUNT(*) as count
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
WHERE o.slug = 'community-health-network';

-- If all counts are 0, it's safe to delete. Otherwise, we need to migrate data first.

-- ONLY RUN THE DELETE BELOW IF ALL COUNTS ABOVE ARE 0:
-- DELETE FROM organizations WHERE slug = 'community-health-network';

-- Let's also check what other test organizations exist:
SELECT id, name, slug, created_at, is_active
FROM organizations
WHERE slug NOT IN ('recovery-alliance-el-paso', 'communities-for-recovery')
ORDER BY created_at;