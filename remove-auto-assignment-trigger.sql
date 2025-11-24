-- ============================================================================
-- REMOVE AUTO-ASSIGNMENT TO HAVEN AI
-- ============================================================================
-- This removes the trigger that automatically assigns new users to Haven AI
-- Users can now skip onboarding and use the app without an organization
-- Haven AI will remain for manual tester assignments
-- ============================================================================

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_assign_org ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.auto_assign_default_organization();

-- Verify trigger is removed
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_assign_org';
-- Should return no rows

-- Haven AI organization still exists for manual tester assignments
SELECT 
  id,
  name,
  slug,
  is_certified,
  is_active
FROM organizations
WHERE slug = 'haven-ai';

-- ============================================================================
-- RESULT: New users will NOT be auto-assigned to any organization
-- They can skip onboarding and use the Incidents tab
-- Manually assign testers to Haven AI using the code below
-- ============================================================================

-- To manually assign a tester to Haven AI:
/*
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT 
  'USER_ID_HERE',
  id,
  'Responder',
  true
FROM organizations
WHERE slug = 'haven-ai';
*/
