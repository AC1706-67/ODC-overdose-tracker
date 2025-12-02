-- ============================================================================
-- FIX SIGNUP FUNCTION - Correct Role Value
-- ============================================================================
-- The function is trying to use 'Peer' but the constraint only allows:
-- 'Owner', 'Admin', 'Manager', 'Supervisor', 'Responder', 'Viewer'
--
-- We'll change it to use 'Responder' which is the appropriate role for
-- new users who can submit incidents and distributions.
-- ============================================================================

-- First, let's see what the function is currently doing
SELECT 
  '=== Current function source ===' as section,
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'handle_new_user_signup';

-- Now let's recreate the function with the correct role
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
  -- FIXED: Changed role from 'Peer' to 'Responder'
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
      'Responder',  -- ✅ FIXED: Was 'Peer', now 'Responder'
      true
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      is_active = true;

    RAISE LOG 'Successfully created profile and assigned user % to Anonymous Haven AI as Responder', NEW.email;
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
$$;

-- Verify the function was updated
SELECT 
  '=== Function updated successfully ===' as status,
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user_signup';

-- Show the allowed roles for reference
SELECT 
  '=== Allowed roles in user_organizations ===' as info,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_organizations'::regclass
  AND conname LIKE '%role%';

-- ============================================================================
-- NOTES
-- ============================================================================
-- Allowed roles in user_organizations:
-- - Owner: Full admin access, can delete org
-- - Admin: Full management access
-- - Manager: Can manage users and view all data
-- - Supervisor: Can view all data, limited user management
-- - Responder: Can submit incidents/distributions, view own data ✅ (NEW DEFAULT)
-- - Viewer: Read-only access to aggregated data
--
-- We use 'Responder' for new users because they should be able to:
-- - Submit incident reports
-- - Submit outreach/distribution logs
-- - View their own data
-- ============================================================================
