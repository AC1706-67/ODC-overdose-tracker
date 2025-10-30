-- Step 1: Check if organizations exist, create one if needed
-- First, let's see what we have
SELECT id, name, created_at FROM organizations ORDER BY created_at DESC;

-- If no organizations exist, create a test org (uncomment the line below)
-- INSERT INTO organizations (name) VALUES ('Casa Vida Outreach');

-- Get the organization ID we'll use
-- SELECT id, name FROM organizations ORDER BY created_at DESC LIMIT 1;

-- Step 2: Find your user ID and link to organization
-- Find your user ID
SELECT id, email FROM profiles ORDER BY created_at DESC;

-- Link user to organization (replace the UUIDs with actual values)
-- INSERT INTO user_organizations (user_id, organization_id, role) 
-- VALUES ('<YOUR_USER_UUID>', '<YOUR_ORG_UUID>', 'owner');

-- Step 3: (Optional) Seed test outreach data
-- INSERT INTO outreach_logs (user_id, organization_id, zip_code, location, kit_types, num_kits, people_reached, notes, created_at) 
-- VALUES ('<YOUR_USER_UUID>', '<YOUR_ORG_UUID>', '79915', 'Test location', ARRAY['Narcan','Hygiene'], 5, 3, 'Seed record', now());

-- Step 4: Set up proper RLS policies
-- First, clean up any existing policies
DROP POLICY IF EXISTS "Allow anonymous outreach submissions" ON outreach_logs;
DROP POLICY IF EXISTS "Allow authenticated outreach submissions" ON outreach_logs;
DROP POLICY IF EXISTS "Allow anonymous to view outreach logs" ON outreach_logs;
DROP POLICY IF EXISTS "Allow authenticated to view outreach logs" ON outreach_logs;

-- Create proper org-scoped policies
-- Members of an org can read that org's outreach
CREATE POLICY "org members can select outreach" ON outreach_logs 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1
    FROM user_organizations u
    WHERE u.user_id = auth.uid()
      AND u.organization_id = outreach_logs.organization_id
  )
);

-- Members of an org can insert outreach for that org
CREATE POLICY "org members can insert outreach" ON outreach_logs 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_organizations u
    WHERE u.user_id = auth.uid()
      AND u.organization_id = outreach_logs.organization_id
  )
);

-- Allow anonymous inserts with no org_id (for Anonymous mode)
CREATE POLICY "anonymous can insert outreach without org" ON outreach_logs 
FOR INSERT TO anon 
WITH CHECK (organization_id IS NULL);

-- Allow anonymous to read their own data (org_id IS NULL)
CREATE POLICY "anonymous can select outreach without org" ON outreach_logs 
FOR SELECT TO anon 
USING (organization_id IS NULL);

-- Make sure RLS is enabled
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;