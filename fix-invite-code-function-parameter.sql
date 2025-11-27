-- ============================================================================
-- FIX: Update increment_invite_code_usage parameter name
-- ============================================================================
-- Use p_code parameter name (p_ prefix is PostgreSQL convention)
-- Fully qualify table/column names to avoid ambiguity
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_invite_code_usage(p_code text)
RETURNS uuid AS $$
DECLARE
  org_id uuid;
BEGIN
  UPDATE public.organization_invite_codes
  SET current_uses = current_uses + 1
  WHERE organization_invite_codes.code = p_code
    AND organization_invite_codes.is_active = true
    AND (organization_invite_codes.expires_at IS NULL OR organization_invite_codes.expires_at > now())
    AND (organization_invite_codes.max_uses IS NULL OR organization_invite_codes.current_uses < organization_invite_codes.max_uses)
  RETURNING organization_id INTO org_id;
  
  -- Returns NULL if no matching code found or limits exceeded
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- Verify the function was updated
SELECT 
  '=== FUNCTION UPDATED ===' as status,
  proname as function_name,
  pg_get_function_arguments(oid) as parameters
FROM pg_proc
WHERE proname = 'increment_invite_code_usage';
