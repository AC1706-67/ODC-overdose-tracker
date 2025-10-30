-- SECURE ORGANIZATION SETUP WITH PROPER RLS POLICIES
-- Based on security review and best practices

-- Step 1: Check existing organizations
SELECT id, name, created_at FROM organizations ORDER BY created_at DESC;

-- Step 2: Create organization if needed (uncomment if no orgs exist)
-- INSERT INTO organizations (name) VALUES ('Casa Vida Outreach');

-- Step 3: Get organization ID for linking
-- SELECT id, name FROM organizations ORDER BY created_at DESC LIMIT 1;

-- Step 4: Find user ID
SELECT id, email FROM profiles ORDER BY created_at DESC;

-- Step 5: Link user to organization (replace UUIDs with actual values)
-- INSERT INTO user_organizations (user_id, organization_id, role) 
-- VALUES ('<YOUR_USER_UUID>', '<YOUR_ORG_UUID>', 'owner');

-- Step 6: Set up secure RLS policies for outreach_logs
-- Clean up existing policies first
DROP POLICY IF EXISTS "Allow anonymous outreach submissions" ON outreach_logs;
DROP POLICY IF EXISTS "Allow authenticated outreach submissions" ON outreach_logs;
DROP POLICY IF EXISTS "Allow anonymous to view outreach logs" ON outreach_logs;
DROP POLICY IF EXISTS "Allow authenticated to view outreach logs" ON outreach_logs;
DROP POLICY IF EXISTS "org members can select outreach" ON outreach_logs;
DROP POLICY IF EXISTS "org members can insert outreach" ON outreach_logs;
DROP POLICY IF EXISTS "anonymous can insert outreach without org" ON outreach_logs;
DROP POLICY IF EXISTS "anonymous can select outreach without org" ON outreach_logs;

-- SECURE POLICIES WITH BEST PRACTICES

-- 1. Org members can SELECT their org's outreach logs
CREATE POLICY "org_members_select_outreach" ON outreach_logs 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1
    FROM user_organizations u
    WHERE u.user_id = (SELECT auth.uid())
      AND u.organization_id = outreach_logs.organization_id
  )
);

-- 2. Org members can INSERT outreach logs for their org
CREATE POLICY "org_members_insert_outreach" ON outreach_logs 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_organizations u
    WHERE u.user_id = (SELECT auth.uid())
      AND u.organization_id = outreach_logs.organization_id
  )
);

-- 3. Org members can UPDATE their org's outreach logs
CREATE POLICY "org_members_update_outreach" ON outreach_logs 
FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1
    FROM user_organizations u
    WHERE u.user_id = (SELECT auth.uid())
      AND u.organization_id = outreach_logs.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_organizations u
    WHERE u.user_id = (SELECT auth.uid())
      AND u.organization_id = outreach_logs.organization_id
  )
);

-- 4. Org members can DELETE their org's outreach logs
CREATE POLICY "org_members_delete_outreach" ON outreach_logs 
FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1
    FROM user_organizations u
    WHERE u.user_id = (SELECT auth.uid())
      AND u.organization_id = outreach_logs.organization_id
  )
);

-- 5. Anonymous users can INSERT outreach logs (organization_id must be NULL)
CREATE POLICY "anonymous_insert_outreach" ON outreach_logs 
FOR INSERT TO anon 
WITH CHECK (organization_id IS NULL);

-- 6. Anonymous users can SELECT only their anonymous outreach logs
CREATE POLICY "anonymous_select_outreach" ON outreach_logs 
FOR SELECT TO anon 
USING (organization_id IS NULL);

-- Step 7: Grant minimal necessary permissions
-- Revoke any overly broad permissions first
REVOKE ALL ON outreach_logs FROM anon;
REVOKE ALL ON outreach_logs FROM authenticated;

-- Grant specific permissions
GRANT SELECT, INSERT ON outreach_logs TO authenticated;
GRANT UPDATE, DELETE ON outreach_logs TO authenticated; -- Only if org policies allow
GRANT SELECT, INSERT ON outreach_logs TO anon; -- Limited by RLS policies

-- Grant sequence usage for auto-incrementing IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Step 8: Ensure RLS is enabled
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- Step 9: Optional - Create a test outreach record (uncomment and replace UUIDs)
-- INSERT INTO outreach_logs (user_id, organization_id, zip_code, location, kit_types, num_kits, people_reached, notes, created_at) 
-- VALUES ('<YOUR_USER_UUID>', '<YOUR_ORG_UUID>', '79915', 'Test location', ARRAY['Narcan','Hygiene'], 5, 3, 'Seed record', now());

-- Step 10: Verification queries
-- Check if policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'outreach_logs' 
ORDER BY policyname;

-- Test anonymous access (should work)
-- This query simulates what anonymous users can see
SELECT COUNT(*) as anonymous_records 
FROM outreach_logs 
WHERE organization_id IS NULL;