-- Step 1: Create the default "Haven AI" organization
INSERT INTO public.organizations (
  slug,
  name,
  is_active,
  outreach_enabled,
  is_certified
)
VALUES (
  'haven-ai',
  'Haven AI',
  true,
  false,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Create a function to auto-assign new users to Haven AI
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
      'member',
      true
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-assigned user % to Haven AI organization', NEW.id;
  ELSE
    RAISE WARNING 'Haven AI organization not found - user % not auto-assigned', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_assign_org ON auth.users;

CREATE TRIGGER on_auth_user_created_assign_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_default_organization();

-- Step 4: Verify the setup
SELECT 
  'Haven AI Org ID:' as info,
  id,
  name,
  slug,
  is_certified
FROM public.organizations
WHERE slug = 'haven-ai';

-- Step 5: Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_assign_org';
