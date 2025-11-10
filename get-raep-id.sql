-- Get the Recovery Alliance of El Paso organization ID
SELECT 
  id,
  slug,
  name
FROM organizations
WHERE name LIKE '%Recovery Alliance%'
   OR slug LIKE '%recovery%';
