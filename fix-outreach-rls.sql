-- Fix Row Level Security for outreach_logs table to allow anonymous submissions

-- Temporarily disable RLS to make changes
ALTER TABLE outreach_logs DISABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own outreach logs" ON outreach_logs;
DROP POLICY IF EXISTS "Users can only insert their own outreach logs" ON outreach_logs;
DROP POLICY IF EXISTS "Organization members can view outreach logs" ON outreach_logs;

-- Create permissive policies that allow anonymous submissions
CREATE POLICY "Allow anonymous outreach submissions" ON outreach_logs
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated outreach submissions" ON outreach_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to view outreach logs" ON outreach_logs
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow authenticated to view outreach logs" ON outreach_logs
  FOR SELECT TO authenticated
  USING (true);

-- Re-enable RLS with the new permissive policies
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- Also fix incidents table while we're at it
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see their own incidents" ON incidents;
DROP POLICY IF EXISTS "Users can only insert their own incidents" ON incidents;

CREATE POLICY "Allow anonymous incident submissions" ON incidents
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated incident submissions" ON incidents
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to view incidents" ON incidents
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow authenticated to view incidents" ON incidents
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON outreach_logs TO anon, authenticated;
GRANT ALL ON incidents TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;