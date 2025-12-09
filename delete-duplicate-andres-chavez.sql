-- Delete the duplicate Andres Chavez entry
-- Run find-andres-variants.sql first to see which IDs exist
-- Then replace 'PASTE_ID_HERE' with the ID you want to DELETE

-- Preview what will be deleted (replace with actual ID)
SELECT 
  id,
  full_name,
  email,
  role,
  created_at,
  'This will be DELETED' as action
FROM team_members
WHERE id = 'PASTE_ID_HERE';  -- Replace with the ID to delete

-- Uncomment below after verifying the ID above
/*
DELETE FROM team_members
WHERE id = 'PASTE_ID_HERE';  -- Replace with the ID to delete
*/

-- Verify only one remains
SELECT 
  tm.id,
  tm.full_name,
  tm.email,
  tm.role,
  tm.created_at
FROM team_members tm
JOIN organizations o ON tm.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND (
    tm.full_name ILIKE 'andres chavez' 
    OR tm.full_name ILIKE 'andrés chavez'
  );
