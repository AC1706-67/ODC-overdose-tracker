-- Remove duplicate "Andres Chavez" entries from outreach_logs team_members arrays
-- This keeps only ONE occurrence of each name in the array

-- First, preview what will be changed
SELECT 
  ol.id,
  ol.team_members as old_array,
  -- Remove duplicates by converting to a set
  ARRAY(SELECT DISTINCT unnest(ol.team_members)) as new_array,
  ol.created_at
FROM outreach_logs ol
JOIN organizations o ON ol.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND ol.team_members IS NOT NULL
  AND array_length(ol.team_members, 1) > 0
  -- Only show rows that have duplicates
  AND array_length(ol.team_members, 1) > (SELECT COUNT(DISTINCT name) FROM unnest(ol.team_members) AS name)
ORDER BY ol.created_at DESC;

-- Uncomment below to actually update the records
/*
UPDATE outreach_logs
SET team_members = ARRAY(SELECT DISTINCT unnest(team_members))
WHERE id IN (
  SELECT ol.id
  FROM outreach_logs ol
  JOIN organizations o ON ol.organization_id = o.id
  WHERE o.slug = 'recovery-alliance'
    AND ol.team_members IS NOT NULL
    AND array_length(ol.team_members, 1) > 0
    -- Only update rows that have duplicates
    AND array_length(ol.team_members, 1) > (SELECT COUNT(DISTINCT name) FROM unnest(ol.team_members) AS name)
);
*/

-- Verify the fix
SELECT 
  ol.id,
  ol.team_members,
  array_length(ol.team_members, 1) as array_length,
  ol.created_at
FROM outreach_logs ol
JOIN organizations o ON ol.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND ol.team_members IS NOT NULL
  AND EXISTS (SELECT 1 FROM unnest(ol.team_members) AS name WHERE name ILIKE '%andres%chavez%')
ORDER BY ol.created_at DESC
LIMIT 10;
