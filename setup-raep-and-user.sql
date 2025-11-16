-- Complete setup for Recovery Alliance organization and your user
-- Run this in Supabase SQL Editor

-- 1. Create Recovery Alliance organization
INSERT INTO organizations (id, slug, name, is_active)
VALUES (
  '6e892800-0429-442f-bff8-417b4d4ec793',
  'raep',
  'Recovery Alliance of El Paso',
  true
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- 2. Link your user to the organization
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
VALUES (
  'f5d3d7f7-b3f3-44c3-9279-ec22fc3c8889',
  '6e892800-0429-442f-bff8-417b4d4ec793',
  'admin',
  true
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- 3. Verify the setup
SELECT 'Organizations:' as info;
SELECT * FROM organizations;

SELECT 'User Organizations:' as info;
SELECT uo.*, o.name as org_name 
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.user_id = 'f5d3d7f7-b3f3-44c3-9279-ec22fc3c8889';
