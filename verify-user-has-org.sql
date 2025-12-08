-- Verify your user has an org membership
-- Run this to confirm you're assigned to Recovery Alliance

SELECT 
  uo.user_id,
  uo.organization_id,
  uo.role,
  uo.is_active,
  o.name as org_name,
  o.slug as org_slug,
  o.outreach_enabled
FROM public.user_organizations uo
JOIN public.organizations o ON o.id = uo.organization_id
WHERE uo.user_id = 'f5d3d7f7-b3f3-44c3-9279-ec22fc3c8889'
  AND uo.is_active = true;

-- Expected result: 1 row showing Recovery Alliance with outreach_enabled = true
