-- Check Recovery Alliance users and their organization memberships

-- 1. Find all Recovery Alliance users
SELECT 
  'Recovery Alliance Users' as section,
  p.email,
  p.id as user_id,
  p.display_name
FROM profiles p
WHERE p.email LIKE '%recoveryalliance%'
ORDER BY p.email;

-- 2. Check their organization memberships
SELECT 
  'User Organization Memberships' as section,
  p.email,
  o.name as organization_name,
  o.slug as organization_slug,
  uo.role,
  uo.is_active,
  uo.joined_at
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
LEFT JOIN organizations o ON o.id = uo.organization_id
WHERE p.email LIKE '%recoveryalliance%'
ORDER BY p.email, o.name;

-- 3. Check Recovery Alliance organization details
SELECT 
  'Recovery Alliance Organization' as section,
  id,
  name,
  slug,
  is_active,
  created_at
FROM organizations
WHERE slug LIKE '%recovery%alliance%'
   OR name LIKE '%Recovery Alliance%';

-- 4. Count memberships per organization
SELECT 
  'Membership Counts' as section,
  o.name,
  o.slug,
  COUNT(uo.id) as member_count,
  COUNT(CASE WHEN uo.is_active THEN 1 END) as active_members
FROM organizations o
LEFT JOIN user_organizations uo ON uo.organization_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY member_count DESC;

-- 5. Find users WITHOUT any organization
SELECT 
  'Users Without Organization' as section,
  p.email,
  p.id as user_id,
  p.created_at
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
WHERE uo.id IS NULL
ORDER BY p.created_at DESC
LIMIT 10;
