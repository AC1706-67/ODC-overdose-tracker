-- Find all "Andres Chavez" variants in Recovery Alliance
SELECT 
  tm.id,
  tm.full_name,
  tm.email,
  tm.role,
  o.name as org_name,
  tm.created_at,
  -- Count activities for this team member
  (SELECT COUNT(*) FROM outreach_logs ol 
   WHERE tm.full_name = ANY(ol.team_members::text[])
   AND ol.organization_id = tm.organization_id) as activity_count
FROM team_members tm
JOIN organizations o ON tm.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND (
    tm.full_name ILIKE 'andres chavez' 
    OR tm.full_name ILIKE 'andrés chavez'
    OR tm.full_name ILIKE 'andres%chavez%'
  )
ORDER BY tm.created_at;
