-- Updated create_team_member function that returns team_members table type
-- This will work with CREATE OR REPLACE since it matches the existing return type

CREATE OR REPLACE FUNCTION public.create_team_member(
  p_full_name text,
  p_email text,
  p_role text,
  p_org_slug text
)
RETURNS team_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_organization_id uuid;
  v_result team_members;
BEGIN
  -- Validate inputs
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  
  IF p_org_slug IS NULL OR trim(p_org_slug) = '' THEN
    RAISE EXCEPTION 'Organization slug is required';
  END IF;

  -- Look up organization by slug (case insensitive)
  SELECT id INTO v_organization_id
  FROM public.organizations
  WHERE lower(slug) = lower(trim(p_org_slug))
    AND is_active = true;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found with slug: %', p_org_slug;
  END IF;

  -- Check if team member already exists (by name, case insensitive)
  SELECT * INTO v_result
  FROM public.team_members
  WHERE organization_id = v_organization_id
    AND lower(name) = lower(trim(p_full_name))
    AND is_active = true;

  -- If member exists, update and return existing record
  IF v_result.id IS NOT NULL THEN
    UPDATE public.team_members
    SET 
      name = trim(p_full_name),
      email = CASE 
        WHEN p_email IS NOT NULL AND trim(p_email) != '' 
        THEN trim(p_email) 
        ELSE email 
      END,
      role = CASE 
        WHEN p_role IS NOT NULL AND trim(p_role) != '' 
        THEN trim(p_role) 
        ELSE role 
      END,
      updated_at = now()
    WHERE id = v_result.id
    RETURNING * INTO v_result;

    RETURN v_result;
  END IF;

  -- Create new team member
  INSERT INTO public.team_members (
    id,
    name,
    organization_id,
    email,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    trim(p_full_name),
    v_organization_id,
    CASE 
      WHEN p_email IS NOT NULL AND trim(p_email) != '' 
      THEN trim(p_email) 
      ELSE NULL 
    END,
    CASE 
      WHEN p_role IS NOT NULL AND trim(p_role) != '' 
      THEN trim(p_role) 
      ELSE NULL 
    END,
    true,
    now(),
    now()
  )
  RETURNING * INTO v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating team member: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team_member(text, text, text, text) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.create_team_member(text, text, text, text) IS 
'Creates a new team member or updates existing one. Parameters: full_name, email, role, org_slug. Returns team_members table row.';