-- Clear All Test Data for Production Launch
-- This keeps the database structure but removes all test records
-- Run this in Supabase SQL Editor when you're ready to launch

-- IMPORTANT: This will delete ALL data except:
-- - Your organization (Recovery Alliance of El Paso)
-- - Your user accounts and their organization memberships
-- - The structure/schema stays intact

BEGIN;

-- 1) Show what will be deleted (run this first to review)
SELECT 'Outreach Logs' as table_name, COUNT(*) as records FROM outreach_logs
UNION ALL
SELECT 'Incidents', COUNT(*) FROM incidents
UNION ALL
SELECT 'Team Members', COUNT(*) FROM team_members
UNION ALL
SELECT 'Locations', COUNT(*) FROM locations
UNION ALL
SELECT 'Outreach Team Members (junction)', COUNT(*) FROM outreach_team_members;

-- 2) Delete ONLY test data for MVP launch (uncomment when ready)
/*
-- Delete outreach team member associations (links between logs and team members)
DELETE FROM outreach_team_members;

-- Delete all outreach logs (test outreach activities)
DELETE FROM outreach_logs;

-- Delete all incidents (test overdose/health incident reports)
DELETE FROM incidents;

-- KEEP team members - they're real Recovery Alliance staff ✅
-- KEEP locations - they're real El Paso locations ✅
-- KEEP organizations - Recovery Alliance of El Paso & Communities for Recovery ✅
-- KEEP user accounts and memberships ✅

-- This leaves you with:
-- ✅ Clean slate for incident tracking (MVP feature for all orgs)
-- ✅ Clean slate for outreach logging (special feature for RAEP only)
-- ✅ Real team members ready to use
-- ✅ Real locations ready to use
*/

-- 3) Verify everything is clean
SELECT 'After cleanup:' as status;
SELECT 'Outreach Logs' as table_name, COUNT(*) as records FROM outreach_logs
UNION ALL
SELECT 'Incidents', COUNT(*) FROM incidents
UNION ALL
SELECT 'Team Members', COUNT(*) FROM team_members
UNION ALL
SELECT 'Locations', COUNT(*) FROM locations
UNION ALL
SELECT 'Outreach Team Members', COUNT(*) FROM outreach_team_members;

-- 4) Verify your organization and users are still there
SELECT 'Organizations remaining:' as info;
SELECT id, slug, name, is_active FROM organizations;

SELECT 'Users remaining:' as info;
SELECT u.id, u.email, uo.role, o.name as organization
FROM auth.users u
LEFT JOIN user_organizations uo ON uo.user_id = u.id
LEFT JOIN organizations o ON o.id = uo.organization_id
ORDER BY u.email;

COMMIT;

-- After running this, your database will be clean and ready for production!
-- All test data will be gone, but your structure, users, and organizations remain.
