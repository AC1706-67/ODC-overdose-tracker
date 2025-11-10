-- Create a test organization to fix the team member creation issue
-- This bypasses RLS by using direct SQL

-- First, let's check if there are any organizations
SELECT 'Current organizations:' as info;
SELECT id, name, slug, is_active, created_at FROM organizations;

-- Create a test organization if none exist
INSERT INTO organizations (name, slug, is_active, created_at, updated_at)
VALUES ('Recovery Alliance', 'recovery-alliance', true, now(), now())
ON CONFLICT (slug) DO UPDATE SET 
  is_active = true,
  updated_at = now();

-- Verify the organization was created
SELECT 'After creation:' as info;
SELECT id, name, slug, is_active, created_at FROM organizations WHERE slug = 'recovery-alliance';

-- Test the create_team_member function with this organization
SELECT 'Testing create_team_member function:' as info;
SELECT create_team_member(
  'Test User',
  'test@example.com', 
  'volunteer',
  'recovery-alliance'
) as result;