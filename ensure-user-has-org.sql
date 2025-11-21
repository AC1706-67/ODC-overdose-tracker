-- Ensure all users have an organization membership

-- Step 1: Check current user memberships
SELECT 
  'Current Memberships' as step,
  p.email,
  p.id as user_id,
  o.name as org_name,
  uo.is_active
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
LEFT JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;

-- Step 2: Find users WITHOUT any organization
SELECT 
  'Users Without Organization' as step,
  p.email,
  p.id as user_id
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
WHERE uo.id IS NULL;

-- Step 3: Assign Anonymous Haven AI to users without an org
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

-- Step 4: Activate any inactive memberships
UPDATE user_organizations
SET is_active = true
WHERE is_active = false;

-- Step 5: Verify all users now have an organization
SELECT 
  'After Fix - All Users' as step,
  p.email,
  o.name as org_name,
  uo.role,
  uo.is_active
FROM profiles p
JOIN user_organizations uo ON uo.user_id = p.id
JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;
