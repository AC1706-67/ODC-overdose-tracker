-- Find duplicate Andres Chavez entries in Recovery Alliance
SELECT 
  tm.id,
  tm.full_name,
  tm.organization_id,
  o.name as org_name,
  o.slug as org_slug,
  tm.created_at
FROM team_members tm
JOIN organizations o ON tm.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND tm.full_name ILIKE '%andres%chavez%'
ORDER BY tm.created_at;
