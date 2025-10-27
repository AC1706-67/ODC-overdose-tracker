-- Fix infinite recursion in user_organizations table policies

-- First, disable RLS temporarily to break the recursion
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can manage their own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization members can view memberships" ON user_organizations;

-- Create simple, non-recursive policies
CREATE POLICY "Allow users to view their own memberships" ON user_organizations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own memberships" ON user_organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own memberships" ON user_organizations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own memberships" ON user_organizations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Re-enable RLS with the fixed policies
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Also fix the organizations table if it has similar issues
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization members can view organization" ON organizations;

CREATE POLICY "Allow authenticated users to view organizations" ON organizations
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_organizations TO authenticated;
GRANT SELECT ON organizations TO authenticated;