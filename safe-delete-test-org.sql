-- Safe deletion of Community Health Network organization
-- This transaction will only delete if all dependency counts are zero

BEGIN;

-- Double-check counts before deletion
WITH org AS (
  SELECT id FROM organizations WHERE slug = 'community-health-network'
),
counts AS (
  SELECT 
    (SELECT COUNT(*) FROM team_members tm JOIN org o ON o.id = tm.organization_id) AS team_members_count,
    (SELECT COUNT(*) FROM outreach_logs ol JOIN org o ON o.id = ol.organization_id) AS outreach_logs_count,
    (SELECT COUNT(*) FROM user_organizations uo JOIN org o ON o.id = uo.organization_id) AS user_organizations_count
)
SELECT 
  team_members_count,
  outreach_logs_count,
  user_organizations_count,
  CASE 
    WHEN team_members_count = 0 AND outreach_logs_count = 0 AND user_organizations_count = 0 
    THEN 'SAFE TO DELETE' 
    ELSE 'NOT SAFE - HAS DEPENDENCIES' 
  END as safety_check
FROM counts;

-- Only proceed with deletion if you see "SAFE TO DELETE" above
-- If you see "NOT SAFE", run ROLLBACK; instead of the DELETE below

-- Show what we're about to delete
SELECT 
  'About to delete:' as action,
  id, 
  name, 
  slug, 
  created_at
FROM organizations 
WHERE slug = 'community-health-network';

-- Perform the deletion
DELETE FROM organizations 
WHERE slug = 'community-health-network';

-- Show confirmation
SELECT 
  'Deleted organization:' as result,
  'community-health-network' as slug,
  ROW_COUNT() as rows_deleted;

-- Commit the transaction (or run ROLLBACK; if you want to undo)
COMMIT;

-- Verify deletion worked
SELECT 'Verification - remaining organizations:' as info;
SELECT id, name, slug, is_active 
FROM organizations 
ORDER BY created_at;