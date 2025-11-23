-- This script shows you how to create a test user
-- You CANNOT run this in SQL Editor - you must use Supabase Dashboard

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard
-- 2. Click "Authentication" in left sidebar
-- 3. Click "Users" tab
-- 4. Click "Add user" button
-- 5. Choose "Create new user"
-- 6. Fill in:
--    Email: testuser@example.com
--    Password: Test123!
--    Auto Confirm User: YES (check this box)
-- 7. Click "Create user"
-- 8. Then run this SQL to assign them to an organization:

-- After creating the user in the dashboard, run this:
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT 
  p.id as user_id,
  'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f' as organization_id, -- Anonymous Haven AI
  'Admin' as role,
  true as is_active
FROM profiles p
WHERE p.email = 'testuser@example.com'  -- CHANGE THIS to match the email you created
ON CONFLICT DO NOTHING;

-- Verify it worked:
SELECT 
  p.email,
  o.name as org_name,
  uo.role
FROM profiles p
JOIN user_organizations uo ON uo.user_id = p.id
JOIN organizations o ON o.id = uo.organization_id
WHERE p.email = 'testuser@example.com';
