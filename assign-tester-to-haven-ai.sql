-- ============================================================================
-- ASSIGN TESTER TO HAVEN AI
-- ============================================================================
-- Use this to manually assign testers to Haven AI organization
-- Replace the email address with your tester's email
-- ============================================================================

-- CONFIGURATION
DO $$
DECLARE
  tester_email TEXT := 'tester@example.com';  -- CHANGE THIS
  tester_user_id UUID;
  haven_org_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO tester_user_id
  FROM auth.users
  WHERE email = tester_email
  LIMIT 1;

  -- Find Haven AI org
  SELECT id INTO haven_org_id
  FROM organizations
  WHERE slug = 'haven-ai'
  LIMIT 1;

  IF tester_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" not found', tester_email;
  END IF;

  IF haven_org_id IS NULL THEN
    RAISE EXCEPTION 'Haven AI organization not found';
  END IF;

  -- Assign tester to Haven AI
  INSERT INTO user_organizations (
    user_id,
    organization_id,
    role,
    is_active
  )
  VALUES (
    tester_user_id,
    haven_org_id,
    'Responder',
    true
  )
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    is_active = true;

  RAISE NOTICE '✅ Assigned % to Haven AI as Responder', tester_email;
END $$;

-- Verify assignment
SELECT 
  u.email,
  o.name as organization,
  uo.role,
  uo.is_active
FROM auth.users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email = 'tester@example.com';  -- CHANGE THIS to match above
