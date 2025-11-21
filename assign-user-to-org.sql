-- Run this in Supabase SQL Editor to assign users to organizations

-- OPTION 1: Assign ALL users without an org to Anonymous Haven AI
-- (Run this if you want everyone to have a default org)
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT 
  p.id as user_id,
  'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f' as organization_id, -- Anonymous Haven AI
  'Responder' as role,
  true as is_active
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
WHERE uo.id IS NULL
ON CONFLICT DO NOTHING;

-- OPTION 2: Assign a SPECIFIC user by email
-- (Uncomment and modify the email to assign a specific user)
/*
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT 
  p.id as user_id,
  'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f' as organization_id, -- Anonymous Haven AI
  'Admin' as role,  -- Change role as needed: 'Admin', 'Responder', 'Viewer'
  true as is_active
FROM profiles p
WHERE p.email = 'your-email@example.com'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT DO NOTHING;
*/

-- Step 3: Verify the assignment worked
SELECT 
  '✅ VERIFICATION - All Users Now Have Orgs' as status,
  p.email,
  o.name as org_name,
  uo.role,
  uo.is_active
FROM profiles p
JOIN user_organizations uo ON uo.user_id = p.id
JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;
