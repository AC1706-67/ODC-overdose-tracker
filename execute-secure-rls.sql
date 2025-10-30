-- EXECUTION PLAN: Secure RLS Setup for Outreach Logs
-- This will be executed step by step with verification

-- Step 1: Inspect existing data (verification only)
SELECT id, name, created_at FROM organizations ORDER BY created_at DESC;
SELECT id, email FROM profiles ORDER BY created_at DESC;

-- Step 2: Clean up any existing conflicting policies
DROP POLICY IF EXISTS "Allow anonymous outreach submissions" ON outreach_logs;
DROP POLICY IF EXISTS "Allow authenticated outreach submissions" ON outreach_logs;
DROP POLICY IF EXISTS "Allow anonymous to view outreach logs" ON outreach_logs;
DROP POLICY IF EXISTS "Allow authenticated to view outreach logs" ON outreach_logs;
DROP POLICY IF EXISTS "org members can select outreach" ON outreach_logs;
DROP POLICY IF EXISTS "org members can insert outreach" ON outreach_logs;
DROP POLICY IF EXISTS "anonymous can insert outreach without org" ON outreach_logs;
DROP POLICY IF EXISTS "anonymous can select outreach without org" ON outreach_logs;
DROP POLICY IF EXISTS "org_members_select_outreach" ON outreach_logs;
DROP POLICY IF EXISTS "org_members_insert_outreach" ON outreach_logs;
DROP POLICY IF EXISTS "org_members_update_outreach" ON outreach_logs;
DROP POLICY IF EXISTS "org_members_delete_outreach" ON outreach_logs;
DROP POLICY IF EXISTS "anonymous_insert_outreach" ON outreach_logs;
DROP POLICY IF EXISTS "anonymous_select_outreach" ON outreach_logs;

-- Step 3: Create secure policies with best practices
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

-- 6. Anonymous users can SELECT only anonymous outreach logs
CREATE POLICY "anonymous_select_outreach" ON outreach_logs 
FOR SELECT TO anon 
USING (organization_id IS NULL);

-- Step 4: Set minimal permissions
REVOKE ALL ON outreach_logs FROM anon;
REVOKE ALL ON outreach_logs FROM authenticated;

-- Grant specific rights
GRANT SELECT, INSERT, UPDATE, DELETE ON outreach_logs TO authenticated;
-- Grant SELECT to anon so they can read their anonymous submissions for dashboard
GRANT SELECT, INSERT ON outreach_logs TO anon;

-- Step 5: Ensure RLS is enabled
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Verification queries
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'outreach_logs' 
ORDER BY policyname;

-- Check anonymous record count
SELECT COUNT(*) AS anonymous_records 
FROM outreach_logs 
WHERE organization_id IS NUL