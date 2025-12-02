-- ============================================================================
-- SIMPLIFIED SIGNUP FUNCTION - Copy and paste this into Supabase SQL Editor
-- ============================================================================

-- Create the function (simplified version)
CREATE OR REPLACE FUNCTION public.handle_new_user_signup_manual(
  p_user_id UUID,
  p_user_email TEXT,
  p_user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_display_name TEXT;
  v_terms_ts TIMESTAMPTZ;
  v_privacy_ts TIMESTAMPTZ;
  v_version TEXT;
BEGIN
  -- Get org ID
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = 'anonymous-haven-ai'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- Extract metadata
  v_display_name := COALESCE(
    p_user_metadata->>'display_name',
    split_part(p_user_email, '@', 1)
  );

  v_terms_ts := (p_user_metadata->>'terms_accepted_at')::timestamptz;
  v_privacy_ts := (p_user_metadata->>'privacy_accepted_at')::timestamptz;
  v_version := COALESCE(p_user_metadata->>'accepted_version', '1.0');

  -- Create profile
  INSERT INTO public.profiles (
    id, email, display_name, 
    terms_accepted_at, privacy_accepted_at, 
    accepted_version, is_active
  )
  VALUES (
    p_user_id, p_user_email, v_display_name,
    v_terms_ts, v_privacy_ts,
    v_version, true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name);

  -- Assign to org
  INSERT INTO public.user_organizations (
    user_id, organization_id, role, is_active
  )
  VALUES (
    p_user_id, v_org_id, 'Responder', true
  )
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    is_active = true,
    role = 'Responder';

  RETURN jsonb_build_object(
    'success', true,
    'profile_created', true,
    'organization_assigned', true,
    'organization_id', v_org_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup_manual(UUID, TEXT, JSONB) TO authenticated, anon;

-- Verify
SELECT 
  'Function created: ' || proname as status,
  pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname = 'handle_new_user_signup_manual'
  AND pronamespace = 'public'::regnamespace;
