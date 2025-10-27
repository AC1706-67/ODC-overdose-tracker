-- Fix Row Level Security permissions for outreach_logs and incidents tables

-- Disable RLS temporarily to allow anonymous submissions
ALTER TABLE outreach_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create permissive policies for anonymous users
-- (Uncomment these if you prefer to keep RLS enabled)

-- DROP POLICY IF EXISTS "Allow anonymous outreach submissions" ON outreach_logs;
-- CREATE POLICY "Allow anonymous outreach submissions" ON outreach_logs
--   FOR ALL TO anon
--   USING (true)
--   WITH CHECK (true);

-- DROP POLICY IF EXISTS "Allow anonymous incident submissions" ON incidents;
-- CREATE POLICY "Allow anonymous incident submissions" ON incidents
--   FOR ALL TO anon
--   USING (true)
--   WITH CHECK (true);

-- DROP POLICY IF EXISTS "Allow authenticated outreach access" ON outreach_logs;
-- CREATE POLICY "Allow authenticated outreach access" ON outreach_logs
--   FOR ALL TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- DROP POLICY IF EXISTS "Allow authenticated incident access" ON incidents;
-- CREATE POLICY "Allow authenticated incident access" ON incidents
--   FOR ALL TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON outreach_logs TO anon, authenticated;
GRANT ALL ON incidents TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;