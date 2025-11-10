-- Check your organization details
-- This will show you the exact slug and name in the database

SELECT 
  o.id,
  o.slug,
  o.name,
  o.is_active,
  uo.role as your_role
FROM organizations o
JOIN user_organizations uo ON uo.organization_id = o.id
JOIN auth.users u ON u.id = uo.user_id
WHERE uo.is_active = true
  AND u.email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- If you want to update the organization name to "Recovery Alliance of El Paso":
/*
UPDATE organizations 
SET name = 'Recovery Alliance of El Paso',
    slug = 'recovery-alliance-el-paso'
WHERE slug = 'recovery-alliance';
*/
