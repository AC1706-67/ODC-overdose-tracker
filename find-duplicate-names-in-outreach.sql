-- Find outreach logs with duplicate team member names in the array
-- Specifically looking for "Andres Chavez" appearing twice

SELECT 
  ol.id,
  ol.team_members,
  ol.created_at,
  o.name as org_name,
  o.slug as org_slug,
  array_length(ol.team_members, 1) as total_names,
  -- Count how many times each name appears
  (SELECT COUNT(*) FROM unnest(ol.team_members) AS name WHERE name ILIKE '%andres%chavez%') as andres_count
FROM outreach_logs ol
JOIN organizations o ON ol.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND ol.team_members IS NOT NULL
  AND array_length(ol.team_members, 1) > 0
  -- Check if "Andres Chavez" appears more than once
  AND (SELECT COUNT(*) FROM unnest(ol.team_members) AS name WHERE name ILIKE '%andres%chavez%') > 1
ORDER BY ol.created_at DESC;
