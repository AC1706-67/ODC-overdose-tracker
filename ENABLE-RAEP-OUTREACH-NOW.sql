-- ============================================================================
-- ENABLE OUTREACH FOR RAEP - RUN THIS NOW
-- ============================================================================

-- Enable outreach for Recovery Alliance of El Paso
UPDATE organizations
SET outreach_enabled = true
WHERE slug = 'recovery-alliance-el-paso' 
   OR name ILIKE '%recovery%alliance%';

-- Verify it worked
SELECT 
  id,
  name,
  slug,
  is_certified,
  is_active,
  outreach_enabled
FROM organizations
WHERE slug = 'recovery-alliance-el-paso' 
   OR name ILIKE '%recovery%alliance%';

-- Check your user's org assignment
SELECT 
  u.email,
  o.name as organization,
  o.outreach_enabled,
  uo.role,
  uo.is_active
FROM auth.users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email ILIKE '%chavez%';
