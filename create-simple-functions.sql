-- Create simplified location creation function
CREATE OR REPLACE FUNCTION public.create_location_simple_v2(
  p_org_slug text,
  p_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id uuid;
  v_location_id uuid;
  v_result json;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Location name is required';
  END IF;
  
  IF p_org_slug IS NULL OR trim(p_org_slug) = '' THEN
    RAISE EXCEPTION 'Organization slug is required';
  END IF;

  -- Look up organization by slug
  SELECT id INTO v_organization_id
  FROM public.organizations
  WHERE slug = trim(p_org_slug)
    AND is_active = true;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found with slug: %', p_org_slug;
  END IF;

  -- Create location
  INSERT INTO public.locations (
    name,
    organization_id,
    kind,
    is_active
  )
  VALUES (
    trim(p_name),
    v_organization_id,
    'intersection',
    true
  )
  RETURNING id INTO v_location_id;

  -- Return simplified result
  SELECT json_build_object(
    'id', v_location_id,
    'name', trim(p_name),
    'created_at', now()
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating location: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_location_simple_v2(text, text) TO authenticated;

COMMENT ON FUNCTION public.create_location_simple_v2(text, text) IS 
'Simplified location creation. Parameters: org_slug, name. Returns JSON with id, name, created_at.';


-- Create simplified team member creation function
CREATE OR REPLACE FUNCTION public.create_team_member_simple(
  p_org_slug text,
  p_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id uuid;
  v_member_id uuid;
  v_result json;
BEGIN
  -- Validate inputs
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  
  IF p_org_slug IS NULL OR trim(p_org_slug) = '' THEN
    RAISE EXCEPTION 'Organization slug is required';
  END IF;

  -- Look up organization by slug
  SELECT id INTO v_organization_id
  FROM public.organizations
  WHERE slug = trim(p_org_slug)
    AND is_active = true;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found with slug: %', p_org_slug;
  END IF;

  -- Create team member
  INSERT INTO public.team_members (
    full_name,
    organization_id,
    is_active
  )
  VALUES (
    trim(p_full_name),
    v_organization_id,
    true
  )
  RETURNING id INTO v_member_id;

  -- Return simplified result
  SELECT json_build_object(
    'id', v_member_id,
    'organization_id', v_organization_id,
    'full_name', trim(p_full_name),
    'created_at', now()
  ) INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating team member: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_team_member_simple(text, text) TO authenticated;

COMMENT ON FUNCTION public.create_team_member_simple(text, text) IS 
'Simplified team member creation. Parameters: org_slug, full_name. Returns JSON with id, organization_id, full_name, created_at.';
