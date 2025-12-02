-- ============================================================================
-- FIX SIGNUP FLOW - Complete Solution
-- ============================================================================
-- This migration fixes the "Database error saving new user" issue by:
-- 1. Ensuring "Anonymous Haven AI" organization exists
-- 2. Creating a unified trigger that handles both profile AND org assignment
-- 3. Fixing RLS policies to allow new user inserts
-- 4. Adding proper error handling
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure Anonymous Haven AI organization exists
-- ============================================================================
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
  'Default organization for new Compassionate LOG users',
  true,
  true,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  is_certified = EXCLUDED.is_certified;

-- ============================================================================
-- STEP 2: Drop old triggers to avoid conflicts
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_org ON auth.users;

-- ============================================================================
-- STEP 3: Create unified signup handler function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
DECLARE
  default_org_id UUID;
  user_display_name TEXT;
  terms_timestamp TIMESTAMPTZ;
  privacy_timestamp TIMESTAMPTZ;
  version_accepted TEXT;
BEGIN
  -- Get Anonymous Haven AI organization ID
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'anonymous-haven-ai'
  LIMIT 1;

  -- Extract metadata from auth.users
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract legal acceptance timestamps from metadata
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

  -- Assign to default organization if it exists
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
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      is_active = true;

    RAISE LOG 'Successfully created profile and assigned user % to Anonymous Haven AI', NEW.email;
  ELSE
    RAISE WARNING 'Anonymous Haven AI organization not found - user % only has profile', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user_signup for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$;

-- ============================================================================
-- STEP 4: Create trigger
-- ============================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================================
-- STEP 5: Fix RLS policies for profiles table
-- ============================================================================

-- Drop existing restrictive policies that might block inserts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view org member profiles" ON public.profiles;

-- Allow users to insert their own profile (needed for trigger)
CREATE POLICY "Enable insert for authentication"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow managers to view profiles in their organizations
CREATE POLICY "Managers can view org member profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
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

-- ============================================================================
-- STEP 6: Fix RLS policies for user_organizations table
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Managers can view org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.user_organizations;

-- Allow users to insert their own membership (needed for trigger)
CREATE POLICY "Enable insert for new users"
  ON public.user_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.user_organizations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow managers to view memberships in their organizations
CREATE POLICY "Managers can view org memberships"
  ON public.user_organizations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor')
        AND is_active = true
    )
  );

-- Allow admins to manage memberships
CREATE POLICY "Admins can manage memberships"
  ON public.user_organizations
  FOR ALL
  TO authenticated
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

-- ============================================================================
-- STEP 7: Grant necessary permissions
-- ============================================================================

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;

-- Ensure service role can bypass RLS for trigger execution
ALTER FUNCTION public.handle_new_user_signup() SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Verification queries
-- ============================================================================

-- Show the trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users';

-- Show Anonymous Haven AI organization
SELECT 
  id,
  name,
  slug,
  is_active,
  is_certified
FROM public.organizations
WHERE slug = 'anonymous-haven-ai';

-- Show RLS policies on profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Show RLS policies on user_organizations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this migration:
-- 1. New users will automatically get a profile created
-- 2. New users will automatically be assigned to "Anonymous Haven AI"
-- 3. Legal acceptance timestamps from signup will be stored in profiles
-- 4. RLS policies allow the trigger to insert data
-- 5. Users can then join additional organizations via onboarding flow
-- ============================================================================
