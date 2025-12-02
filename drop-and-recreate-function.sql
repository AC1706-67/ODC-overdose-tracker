-- ============================================================================
-- DROP AND RECREATE SIGNUP FUNCTION
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user_signup_manual(UUID, TEXT, JSONB);

-- Recreate with correct implementation
CREATE OR REPLACE FUNCTION public.handle_new_user_signup_manual(
  user_id UUID,
  user_email TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb
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
    user_metadata->>'display_name',
    split_part(user_email, '@', 1)
  );

  v_terms_ts := (user_metadata->>'terms_accepted_at')::timestamptz;
  v_privacy_ts := (user_metadata->>'privacy_accepted_at')::timestamptz;
  v_version := COALESCE(user_metadata->>'accepted_version', '1.0');

  -- Create profile
  INSERT INTO public.profiles (
    id, email, display_name, 
    terms_accepted_at, privacy_accepted_at, 
    accepted_version, is_active
  )
  VALUES (
    user_id, user_email, v_display_name,
    v_terms_ts, v_privacy_ts,
    v_version, true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    terms_accepted_at = COALESCE(profiles.terms_accepted_at, EXCLUDED.terms_accepted_at),
    privacy_accepted_at = COALESCE(profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at);

  -- Assign to org
  INSERT INTO public.user_organizations (
    user_id, organization_id, role, is_active
  )
  VALUES (
    user_id, v_org_id, 'Responder', true
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup_manual(UUID, TEXT, JSONB) TO authenticated, anon;

-- Verify it worked
SELECT 
  '✅ Function recreated successfully!' as status,
  proname as function_name,
  pg_get_function_identity_arguments(oid) as signature
FROM pg_proc 
WHERE proname = 'handle_new_user_signup_manual'
  AND pronamespace = 'public'::regnamespace;
