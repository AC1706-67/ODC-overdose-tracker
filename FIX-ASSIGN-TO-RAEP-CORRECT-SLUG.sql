-- ============================================================================
-- ASSIGN YOUR USER TO RAEP (CORRECT SLUG)
-- ============================================================================
-- The RAEP slug is 'raep' not 'recovery-alliance-el-paso'
-- ============================================================================

-- 1. Show all users (to find your exact email)
SELECT 
  '=== ALL USERS ===' as section,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Assign YOUR email to RAEP (REPLACE WITH YOUR ACTUAL EMAIL)
DO $$
DECLARE
  user_email TEXT := 'achavez@recoveryalliance.net';  -- CHANGE THIS TO YOUR EXACT EMAIL
  user_id_var UUID;
  raep_org_id UUID;
BEGIN
  -- Find user
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  -- Find RAEP org (using correct slug 'raep')
  SELECT id INTO raep_org_id
  FROM organizations
  WHERE slug = 'raep'
  LIMIT 1;

  RAISE NOTICE 'User ID: %', user_id_var;
  RAISE NOTICE 'RAEP Org ID: %', raep_org_id;

  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User with email "%" not found', user_email;
  END IF;

  IF raep_org_id IS NULL THEN
    RAISE EXCEPTION 'RAEP organization not found';
  END IF;

  -- Assign to RAEP (role must be capitalized: 'Admin' not 'admin')
  INSERT INTO user_organizations (
    user_id,
    organization_id,
    role,
    is_active
  )
  VALUES (
    user_id_var,
    raep_org_id,
    'Admin',
    true
  )
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    is_active = true,
    role = 'Admin';

  RAISE NOTICE '✅ Assigned % to RAEP as Admin', user_email;
END $$;

-- 3. Verify assignment
SELECT 
  '=== VERIFICATION ===' as section,
  u.email,
  o.name as organization,
  o.slug,
  o.outreach_enabled,
  uo.role,
  uo.is_active
FROM auth.users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email = 'achavez@recoveryalliance.net';  -- CHANGE THIS TO YOUR EXACT EMAIL
