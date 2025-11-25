-- ============================================================================
-- FIX: Update auto-assignment trigger to use valid role
-- ============================================================================
-- Problem: Trigger uses 'member' but role constraint expects 'Peer', 'Admin', etc.
-- Solution: Change 'member' to 'Peer' in the trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the Haven AI organization ID
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'haven-ai'
  LIMIT 1;

  -- If Haven AI exists, assign the new user to it
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
      'Peer',  -- ✅ Changed from 'member' to 'Peer' (valid role value)
      true
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-assigned user % to Haven AI organization', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
SELECT 
  '=== Trigger Function Updated ===' as status,
  proname as function_name,
  prosrc as source
FROM pg_proc
WHERE proname = 'auto_assign_default_organization';
