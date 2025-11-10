-- List all users in your Supabase project
-- Run this in Supabase SQL Editor to find your user ID

SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NOT NULL THEN '✅ Active'
    ELSE '⚠️ Never logged in'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- After you identify your user ID, run this to set up your profile:
-- (Replace YOUR_USER_ID with the actual UUID from above)

/*
INSERT INTO user_organizations (user_id, organization_id, role, is_active, created_at, updated_at)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user UUID from the query above
  (SELECT id FROM organizations WHERE slug = 'recovery-alliance-el-paso'),
  'peer',
  true,
  now(),
  now()
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  role = 'peer',
  is_active = true,
  updated_at = now();

-- Verify it worked:
SELECT 
  u.email,
  uo.role,
  o.name as organization_name,
  o.slug as organization_slug,
  uo.is_active
FROM auth.users u
JOIN user_organizations uo ON uo.user_id = u.id
JOIN organizations o ON o.id = uo.organization_id
WHERE u.id = 'YOUR_USER_ID';  -- Replace with your user UUID
*/
