-- Check current organization slug and fix it if needed

-- Step 1: See what your organization slug currently is
SELECT 
  id,
  slug,
  name,
  is_active
FROM organizations
WHERE name LIKE '%Recovery Alliance%';

-- Step 2: Update the slug to match the feature access list
-- This will ensure the feature check works correctly
UPDATE organizations
SET slug = 'recovery-alliance-el-paso'
WHERE name = 'Recovery Alliance of El Paso'
  OR name = 'Recovery Alliance';

-- Step 3: Verify the update
SELECT 
  id,
  slug,
  name,
  is_active
FROM organizations
WHERE slug = 'recovery-alliance-el-paso';

-- Step 4: Verify your user is linked to this organization
SELECT 
  u.email,
  uo.role,
  o.name as organization_name,
  o.slug as organization_slug,
  uo.is_active
FROM auth.users u
JOIN user_organizations uo ON uo.user_id = u.id
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.is_active = true
ORDER BY u.email;
