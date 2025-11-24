-- ============================================================================
-- GENERATE INVITE CODE FOR ANY ORGANIZATION
-- ============================================================================
-- Instructions:
-- 1. Replace 'YOUR-ORG-SLUG' with the organization slug
-- 2. Replace 'YOURCODE2025' with your desired code (uppercase, no spaces)
-- 3. Adjust role if needed (Responder, Admin, etc.)
-- 4. Adjust expiration if needed (default: 1 year)
-- 5. Run in Supabase SQL Editor
-- ============================================================================

-- CONFIGURATION (EDIT THESE VALUES)
-- ============================================================================
DO $$
DECLARE
  org_slug TEXT := 'recovery-alliance-el-paso';  -- CHANGE THIS
  invite_code TEXT := 'RAEP2025';                -- CHANGE THIS
  member_role TEXT := 'Responder';               -- CHANGE THIS if needed
  expires_in INTERVAL := '1 year';               -- CHANGE THIS if needed
  max_uses_limit INT := NULL;                    -- NULL = unlimited, or set a number
  
  org_id UUID;
BEGIN
  -- Find organization
  SELECT id INTO org_id
  FROM organizations
  WHERE slug = org_slug
  LIMIT 1;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization with slug "%" not found', org_slug;
  END IF;

  -- Create invite code
  INSERT INTO organization_invite_codes (
    organization_id,
    code,
    role,
    expires_at,
    max_uses,
    current_uses,
    is_active
  )
  VALUES (
    org_id,
    invite_code,
    member_role,
    NOW() + expires_in,
    max_uses_limit,
    0,
    true
  )
  ON CONFLICT (code) DO UPDATE SET
    is_active = true,
    expires_at = NOW() + expires_in,
    role = member_role;

  RAISE NOTICE '✅ Invite code "%" created for organization "%"', invite_code, org_slug;
  RAISE NOTICE 'Role: %, Expires: %, Max Uses: %', 
    member_role, 
    (NOW() + expires_in)::date,
    COALESCE(max_uses_limit::text, 'Unlimited');
END $$;

-- Verify the code was created
SELECT 
  o.name as organization,
  o.slug,
  ic.code,
  ic.role,
  ic.is_active,
  ic.expires_at,
  ic.max_uses,
  ic.current_uses
FROM organization_invite_codes ic
JOIN organizations o ON ic.organization_id = o.id
WHERE ic.code = 'RAEP2025'  -- CHANGE THIS to match your code above
ORDER BY ic.created_at DESC;
