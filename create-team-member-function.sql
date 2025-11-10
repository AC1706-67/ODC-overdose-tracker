-- Create Team Member RPC Function
-- This function creates a new team member and handles organization slug lookup

CREATE OR REPLACE FUNCTION public.create_team_member(
  p_full_name text,
  p_email text,
  p_role text,
  p_org_slug text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id uuid;
  v_team_member_id uuid;
  v_result json;
  v_existing_member record;
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

  -- Check if team member already exists (by email if provided, or by name)
  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    SELECT * INTO v_existing_member
    FROM public.team_members
    WHERE organization_id = v_organization_id
      AND email = trim(p_email)
      AND is_active = true;
  ELSE
    SELECT * INTO v_existing_member
    FROM public.team_members
    WHERE organization_id = v_organization_id
      AND full_name = trim(p_full_name)
      AND is_active = true;
  END IF;

  -- If member exists, update and return existing record
  IF v_existing_member.id IS NOT NULL THEN
    UPDATE public.team_members
    SET 
      full_name = trim(p_full_name),
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
    WHERE id = v_existing_member.id
    RETURNING * INTO v_existing_member;

    -- Return the updated member
    SELECT json_build_object(
      'id', v_existing_member.id,
      'name', v_existing_member.full_name,
      'email', v_existing_member.email,
      'role', v_existing_member.role,
      'organization_id', v_existing_member.organization_id,
      'is_active', v_existing_member.is_active,
      'created_at', v_existing_member.created_at,
      'updated_at', v_existing_member.updated_at,
      'action', 'updated'
    ) INTO v_result;

    RETURN v_result;
  END IF;

  -- Create new team member
  INSERT INTO public.team_members (
    full_name,
    organization_id,
    email,
    role,
    is_active
  )
  VALUES (
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
    true
  )
  RETURNING id INTO v_team_member_id;

  -- Get the created member and return as JSON
  SELECT json_build_object(
    'id', tm.id,
    'name', tm.full_name,
    'email', tm.email,
    'role', tm.role,
    'organization_id', tm.organization_id,
    'is_active', tm.is_active,
    'created_at', tm.created_at,
    'updated_at', tm.updated_at,
    'action', 'created'
  ) INTO v_result
  FROM public.team_members tm
  WHERE tm.id = v_team_member_id;

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
'Creates a new team member or updates existing one. Parameters: full_name, email, role, org_slug. Returns JSON with member data and action (created/updated).';