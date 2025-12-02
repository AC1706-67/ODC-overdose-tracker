-- ============================================================================
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- ============================================================================

-- Step 1: Ensure Anonymous Haven AI organization exists
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

-- Step 2: Create the signup function
CREATE OR REPLACE FUNCTION public.handle_new_user_signup_manual(
  user_id UUID,
  user_email TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
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
  -- SECURITY: Only allow users to set up their own profile
  IF user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission denied: can only set up own profile'
    );
  END IF;

  -- Get Anonymous Haven AI organization ID
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'anonymous-haven-ai'
  LIMIT 1;

  IF default_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Default organization not found'
    );
  END IF;

  -- Extract metadata
  user_display_name := COALESCE(
    user_metadata->>'display_name',
    split_part(user_email, '@', 1)
  );

  terms_timestamp := CASE 
    WHEN user_metadata->>'terms_accepted_at' IS NOT NULL 
    THEN (user_metadata->>'terms_accepted_at')::timestamptz
    ELSE NULL
  END;

  privacy_timestamp := CASE 
    WHEN user_metadata->>'privacy_accepted_at' IS NOT NULL 
    THEN (user_metadata->>'privacy_accepted_at')::timestamptz
    ELSE NULL
  END;

  version_accepted := COALESCE(
    user_metadata->>'accepted_version',
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
    user_id,
    user_email,
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

  -- Assign to default organization
  INSERT INTO public.user_organizations (
    user_id,
    organization_id,
    role,
    is_active
  )
  VALUES (
    user_id,
    default_org_id,
    'Responder',
    true
  )
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    is_active = true,
    role = 'Responder';

  RETURN jsonb_build_object(
    'success', true,
    'profile_created', true,
    'organization_assigned', true,
    'organization_id', default_org_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup_manual(UUID, TEXT, JSONB) TO authenticated;

-- Step 4: Verify it worked
SELECT 
  '✅ Function created!' as status,
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'handle_new_user_signup_manual';

SELECT 
  '✅ Organization exists!' as status,
  id,
  name,
  slug
FROM public.organizations 
WHERE slug = 'anonymous-haven-ai';
