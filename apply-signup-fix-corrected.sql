-- ============================================================================
-- SIGNUP FIX - CORRECTED VERSION
-- ============================================================================
-- Run this in Supabase SQL Editor to set up signup flow
-- ============================================================================

-- STEP 1: Create Anonymous Haven AI organization
INSERT INTO public.organizations (
  slug,
  name,
  type,
  description,
  is_active,
  is_certified,
  outreach_enabled
)
VALUES (
  'anonymous-haven-ai',
  'Anonymous Haven AI',
  'Community Organization',
  'Default organization for new users',
  true,
  true,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- STEP 2: Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_org ON auth.users;

-- STEP 3: Create signup handler function
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_org_id UUID;
  user_display_name TEXT;
  terms_timestamp TIMESTAMPTZ;
  privacy_timestamp TIMESTAMPTZ;
  version_accepted TEXT;
BEGIN
  -- Get org ID
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'anonymous-haven-ai'
  LIMIT 1;

  -- Extract metadata
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  terms_timestamp := CASE 
    WHEN NEW.raw_user_meta_data->>'terms_accepted_at' IS NOT NULL 
    THEN (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz
    ELSE NULL
  END;

  privacy_timestamp := CASE 
    WHEN NEW.raw_user_meta_data->>'privacy_accepted_at' IS NOT NULL 
    THEN (NEW.raw_user_meta_data->>'privacy_accepted_at')::timestamptz
    ELSE NULL
  END;

  version_accepted := COALESCE(
    NEW.raw_user_meta_data->>'accepted_version',
    '1.0'
  );

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    terms_accepted_at,
    privacy_accepted_at,
    accepted_version,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_display_name,
    terms_timestamp,
    privacy_timestamp,
    version_accepted,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    terms_accepted_at = COALESCE(profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
    privacy_accepted_at = COALESCE(profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at);

  -- Assign to organization
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
      'Responder',
      true
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      is_active = true,
      role = 'Responder';

    RAISE LOG 'User % assigned to Anonymous Haven AI', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in signup for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- STEP 4: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- STEP 5: RLS policies for profiles
DROP POLICY IF EXISTS "Enable insert for authentication" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view org member profiles" ON public.profiles;

CREATE POLICY "Enable insert for authentication"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Managers can view org member profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT uo1.user_id
      FROM user_organizations uo1
      WHERE uo1.organization_id IN (
        SELECT uo2.organization_id
        FROM user_organizations uo2
        WHERE uo2.user_id = auth.uid()
          AND uo2.role IN ('Owner', 'Admin', 'Manager', 'Supervisor')
          AND uo2.is_active = true
      )
      AND uo1.is_active = true
    )
  );

-- STEP 6: RLS policies for user_organizations
DROP POLICY IF EXISTS "Enable insert for new users" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Managers can view org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.user_organizations;

CREATE POLICY "Enable insert for new users"
  ON public.user_organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own memberships"
  ON public.user_organizations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view org memberships"
  ON public.user_organizations FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor')
        AND is_active = true
    )
  );

CREATE POLICY "Admins can manage memberships"
  ON public.user_organizations FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
        AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
        AND is_active = true
    )
  );

-- STEP 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;

-- VERIFICATION
SELECT '✅ Setup complete!' as status;

SELECT 
  'Trigger: ' || trigger_name as component
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users';

SELECT 
  'Organization: ' || name as component,
  id::text as org_id
FROM public.organizations
WHERE slug = 'anonymous-haven-ai';
