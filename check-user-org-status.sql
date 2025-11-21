-- Run this in Supabase SQL Editor to check user organization status

-- Step 1: Show all users and their organization memberships
SELECT 
  p.email,
  p.id as user_id,
  o.name as org_name,
  o.slug as org_slug,
  o.id as org_id,
  uo.role,
  uo.is_active as membership_active,
  o.is_active as org_active
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
LEFT JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;

-- Step 2: Find users WITHOUT any organization
SELECT 
  '⚠️ USERS WITHOUT ORGANIZATION' as alert,
  p.email,
  p.id as user_id
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
WHERE uo.id IS NULL;

-- Step 3: Show all available organizations
SELECT 
  '📋 AVAILABLE ORGANIZATIONS' as info,
  id,
  name,
  slug,
  is_active
FROM organizations
ORDER BY name;
