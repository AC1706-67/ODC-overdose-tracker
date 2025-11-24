-- Enable outreach for Recovery Alliance of El Paso
UPDATE public.organizations
SET outreach_enabled = true
WHERE slug = 'recovery-alliance-el-paso' 
   OR name ILIKE '%recovery%alliance%el%paso%';

-- Verify RAEP settings
SELECT 
  id,
  name,
  slug,
  outreach_enabled,
  is_active,
  is_certified
FROM public.organizations
WHERE slug = 'recovery-alliance-el-paso' 
   OR name ILIKE '%recovery%alliance%';

-- Check achavez user assignment
SELECT 
  u.email,
  u.id as user_id,
  o.name as organization,
  o.slug,
  o.outreach_enabled,
  uo.role,
  uo.is_active
FROM auth.users u
JOIN public.user_organizations uo ON u.id = uo.user_id
JOIN public.organizations o ON uo.organization_id = o.id
WHERE u.email ILIKE '%chavez%';

-- If no results above, check if user exists but has no org
SELECT 
  email,
  id,
  created_at
FROM auth.users
WHERE email ILIKE '%chavez%';
