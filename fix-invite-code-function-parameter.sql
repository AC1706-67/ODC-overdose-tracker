-- ============================================================================
-- FIX: Update increment_invite_code_usage parameter name
-- ============================================================================
-- Change parameter from code_text to code for consistency
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_invite_code_usage(code text)
RETURNS uuid AS $$
DECLARE
  org_id uuid;
BEGIN
  UPDATE organization_invite_codes
  SET current_uses = current_uses + 1
  WHERE code = code  -- Now matches the parameter name
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  RETURNING organization_id INTO org_id;
  
  -- Returns NULL if no matching code found or limits exceeded
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verify the function was updated
SELECT 
  '=== FUNCTION UPDATED ===' as status,
  proname as function_name,
  pg_get_function_arguments(oid) as parameters
FROM pg_proc
WHERE proname = 'increment_invite_code_usage';
