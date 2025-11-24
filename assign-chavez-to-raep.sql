-- Find the user by email (replace with actual email)
-- Find Recovery Alliance of El Paso org
-- Assign user to RAEP

DO $$
DECLARE
  user_id_var UUID;
  raep_org_id UUID;
  user_email TEXT := 'achavez@example.com'; -- REPLACE WITH ACTUAL EMAIL
BEGIN
  -- Find user by email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email ILIKE '%chavez%'
  LIMIT 1;

  -- Find RAEP organization
  SELECT id INTO raep_org_id
  FROM public.organizations
  WHERE slug = 'recovery-alliance-el-paso' OR name ILIKE '%recovery%alliance%'
  LIMIT 1;

  -- Show what we found
  RAISE NOTICE 'User ID: %', user_id_var;
  RAISE NOTICE 'RAEP Org ID: %', raep_org_id;

  -- If both exist, create the assignment
  IF user_id_var IS NOT NULL AND raep_org_id IS NOT NULL THEN
    -- Remove from Haven AI if exists
    DELETE FROM public.user_organizations
    WHERE user_id = user_id_var
      AND organization_id IN (
        SELECT id FROM public.organizations WHERE slug = 'haven-ai'
      );

    -- Assign to RAEP
    INSERT INTO public.user_organizations (
      user_id,
      organization_id,
      role,
      is_active
    )
    VALUES (
      user_id_var,
      raep_org_id,
      'admin', -- Make them admin
      true
    )
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET 
      is_active = true,
      role = 'admin';

    RAISE NOTICE '✅ Successfully assigned user to RAEP as admin';
  ELSE
    RAISE WARNING '❌ Could not find user or RAEP organization';
  END IF;
END $$;

-- Verify the assignment
SELECT 
  u.email,
  o.name as organization,
  uo.role,
  uo.is_active
FROM auth.users u
JOIN public.user_organizations uo ON u.id = uo.user_id
JOIN public.organizations o ON uo.organization_id = o.id
WHERE u.email ILIKE '%chavez%';
