-- Fix Recovery Alliance user memberships

-- Step 1: Check current state
SELECT 
  'Current State' as step,
  p.email,
  p.id as user_id,
  o.name as org_name,
  uo.role,
  uo.is_active
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
LEFT JOIN organizations o ON o.id = uo.organization_id
WHERE p.email LIKE '%recoveryalliance%'
ORDER BY p.email;

-- Step 2: Get Recovery Alliance org ID
SELECT 
  'Recovery Alliance Org' as step,
  id,
  name,
  slug
FROM organizations
WHERE slug LIKE '%recovery%'
   OR name LIKE '%Recovery Alliance%';

-- Step 3: Add missing memberships for Recovery Alliance users
-- (This will only insert if they don't already have a membership)
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT 
  p.id as user_id,
  o.id as organization_id,
  'Responder' as role,
  true as is_active
FROM profiles p
CROSS JOIN organizations o
WHERE p.email LIKE '%recoveryalliance%'
  AND (o.slug = 'recovery-alliance-of-el-paso' OR o.name LIKE '%Recovery Alliance%')
  AND NOT EXISTS (
    SELECT 1 
    FROM user_organizations uo 
    WHERE uo.user_id = p.id 
      AND uo.organization_id = o.id
  )
ON CONFLICT DO NOTHING;

-- Step 4: Activate any inactive memberships
UPDATE user_organizations
SET is_active = true
WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%recoveryalliance%'
)
AND is_active = false;

-- Step 5: Verify the fix
SELECT 
  'After Fix' as step,
  p.email,
  o.name as org_name,
  uo.role,
  uo.is_active,
  uo.joined_at
FROM profiles p
JOIN user_organizations uo ON uo.user_id = p.id
JOIN organizations o ON o.id = uo.organization_id
WHERE p.email LIKE '%recoveryalliance%'
ORDER BY p.email;
