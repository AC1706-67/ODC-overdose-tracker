-- Setup User Profile for Recovery Alliance of El Paso
-- This script links your user to RAEP with the "peer" role

-- Step 1: Ensure Recovery Alliance of El Paso exists
INSERT INTO organizations (slug, name, is_active, created_at, updated_at)
VALUES ('recovery-alliance-el-paso', 'Recovery Alliance of El Paso', true, now(), now())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = true,
  updated_at = now();

-- Step 2: Get your user ID (replace with your actual user ID)
-- You can find your user ID by running: SELECT id, email FROM auth.users;
-- Or check in Supabase Dashboard > Authentication > Users

-- Step 3: Link your user to Recovery Alliance of El Paso with "peer" role
-- REPLACE 'YOUR_USER_ID_HERE' with your actual user UUID

INSERT INTO user_organizations (user_id, organization_id, role, is_active, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your user UUID
  (SELECT id FROM organizations WHERE slug = 'recovery-alliance-el-paso'),
  'peer',
  true,
  now(),
  now()
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = true,
  updated_at = now();

-- Step 4: Verify the setup
SELECT 
  u.email,
  uo.role,
  o.name as organization_name,
  o.slug as organization_slug,
  uo.is_active
FROM auth.users u
JOIN user_organizations uo ON uo.user_id = u.id
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.is_active = true;

-- If you need to find your user ID first, run this:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
