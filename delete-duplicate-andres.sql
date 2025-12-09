-- Delete duplicate Andres Chavez entry from Recovery Alliance
-- This will delete the NEWER duplicate, keeping the original

-- First, let's see what we're about to delete
SELECT 
  tm.id,
  tm.full_name,
  tm.created_at,
  'Will be deleted' as action
FROM team_members tm
JOIN organizations o ON tm.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND tm.full_name ILIKE '%andres%chavez%'
  AND tm.id NOT IN (
    -- Keep the oldest one
    SELECT id 
    FROM team_members tm2
    JOIN organizations o2 ON tm2.organization_id = o2.id
    WHERE o2.slug = 'recovery-alliance'
      AND tm2.full_name ILIKE '%andres%chavez%'
    ORDER BY tm2.created_at ASC
    LIMIT 1
  );

-- Uncomment the DELETE below after verifying the SELECT above shows the right record

/*
DELETE FROM team_members
WHERE id IN (
  SELECT tm.id
  FROM team_members tm
  JOIN organizations o ON tm.organization_id = o.id
  WHERE o.slug = 'recovery-alliance'
    AND tm.full_name ILIKE '%andres%chavez%'
    AND tm.id NOT IN (
      -- Keep the oldest one
      SELECT id 
      FROM team_members tm2
      JOIN organizations o2 ON tm2.organization_id = o2.id
      WHERE o2.slug = 'recovery-alliance'
        AND tm2.full_name ILIKE '%andres%chavez%'
      ORDER BY tm2.created_at ASC
      LIMIT 1
    )
);
*/

-- Verify deletion
SELECT 
  tm.id,
  tm.full_name,
  tm.created_at
FROM team_members tm
JOIN organizations o ON tm.organization_id = o.id
WHERE o.slug = 'recovery-alliance'
  AND tm.full_name ILIKE '%andres%chavez%';
