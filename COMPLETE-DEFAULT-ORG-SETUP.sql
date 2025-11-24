-- ============================================================================
-- COMPLETE DEFAULT ORGANIZATION SETUP
-- ============================================================================
-- This script:
-- 1. Creates "Haven AI" as the default organization
-- 2. Sets up auto-assignment trigger for new users
-- 3. Assigns existing Chavez user to Recovery Alliance of El Paso
-- 4. Assigns all other existing users without orgs to Haven AI
-- ============================================================================

-- STEP 1: Create Haven AI organization
-- ============================================================================
INSERT INTO public.organizations (
  slug,
  name,
  is_active,
  outreach_enabled,
  is_certified
)
VALUES (
  'haven-ai',
  'Haven AI',
  true,
  false,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  is_certified = EXCLUDED.is_certified;

-- STEP 2: Create auto-assignment function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the Haven AI organization ID
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'haven-ai'
  LIMIT 1;

  -- If Haven AI exists, assign the new user to it
  IF default_org_id IS NOT NULL THEN
    INSERT INTO public.user_organizations (
      user_id,
      organization_id,
      role,
      is_active
    )
    VALUES (
      NEW.id,
      default_org_id,
      'member',
      true
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-assigned user % to Haven AI organization', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Create trigger
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created_assign_org ON auth.users;

CREATE TRIGGER on_auth_user_created_assign_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_default_organization();

-- STEP 4: Assign Chavez user to RAEP
-- ============================================================================
DO $$
DECLARE
  chavez_user_id UUID;
  raep_org_id UUID;
  haven_org_id UUID;
BEGIN
  -- Find Chavez user
  SELECT id INTO chavez_user_id
  FROM auth.users
  WHERE email ILIKE '%chavez%'
  LIMIT 1;

  -- Find RAEP organization
  SELECT id INTO raep_org_id
  FROM public.organizations
  WHERE slug = 'recovery-alliance-el-paso' 
     OR name ILIKE '%recovery%alliance%el%paso%'
  LIMIT 1;

  -- Find Haven AI org
  SELECT id INTO haven_org_id
  FROM public.organizations
  WHERE slug = 'haven-ai'
  LIMIT 1;

  RAISE NOTICE 'Chavez User ID: %', chavez_user_id;
  RAISE NOTICE 'RAEP Org ID: %', raep_org_id;
  RAISE NOTICE 'Haven AI Org ID: %', haven_org_id;

  -- If Chavez user and RAEP exist, assign them
  IF chavez_user_id IS NOT NULL AND raep_org_id IS NOT NULL THEN
    -- Remove from Haven AI if exists
    DELETE FROM public.user_organizations
    WHERE user_id = chavez_user_id
      AND organization_id = haven_org_id;

    -- Assign to RAEP as admin
    INSERT INTO public.user_organizations (
      user_id,
      organization_id,
      role,
      is_active
    )
    VALUES (
      chavez_user_id,
      raep_org_id,
      'admin',
      true
    )
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET 
      is_active = true,
      role = 'admin';

    RAISE NOTICE '✅ Successfully assigned Chavez to RAEP as admin';
  ELSE
    RAISE WARNING '❌ Could not find Chavez user or RAEP organization';
  END IF;
END $$;

-- STEP 5: Assign all other users without orgs to Haven AI
-- ============================================================================
DO $$
DECLARE
  haven_org_id UUID;
  user_record RECORD;
  assigned_count INT := 0;
BEGIN
  -- Get Haven AI org ID
  SELECT id INTO haven_org_id
  FROM public.organizations
  WHERE slug = 'haven-ai'
  LIMIT 1;

  IF haven_org_id IS NULL THEN
    RAISE WARNING '❌ Haven AI organization not found';
    RETURN;
  END IF;

  -- Find all users without any organization
  FOR user_record IN
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN public.user_organizations uo ON u.id = uo.user_id
    WHERE uo.user_id IS NULL
  LOOP
    -- Assign to Haven AI
    INSERT INTO public.user_organizations (
      user_id,
      organization_id,
      role,
      is_active
    )
    VALUES (
      user_record.id,
      haven_org_id,
      'member',
      true
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    assigned_count := assigned_count + 1;
    RAISE NOTICE 'Assigned user % to Haven AI', user_record.email;
  END LOOP;

  RAISE NOTICE '✅ Assigned % users to Haven AI', assigned_count;
END $$;

-- STEP 6: Verification queries
-- ============================================================================

-- Show Haven AI organization
SELECT 
  '=== Haven AI Organization ===' as section,
  id,
  name,
  slug,
  is_certified,
  is_active
FROM public.organizations
WHERE slug = 'haven-ai';

-- Show trigger status
SELECT 
  '=== Trigger Status ===' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_assign_org';

-- Show all users and their organizations
SELECT 
  '=== User Organization Assignments ===' as section,
  u.email,
  o.name as organization,
  uo.role,
  uo.is_active
FROM auth.users u
LEFT JOIN public.user_organizations uo ON u.id = uo.user_id
LEFT JOIN public.organizations o ON uo.organization_id = o.id
ORDER BY u.email;

-- Show users without organizations (should be empty)
SELECT 
  '=== Users Without Organizations ===' as section,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_organizations uo ON u.id = uo.user_id
WHERE uo.user_id IS NULL;

-- Summary
SELECT 
  '=== Summary ===' as section,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(DISTINCT user_id) FROM public.user_organizations) as users_with_orgs,
  (SELECT COUNT(*) FROM public.organizations) as total_orgs;
