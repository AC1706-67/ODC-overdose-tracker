# Quick Fix: Assign Your User to an Organization

## 🚀 Immediate Fix (Do This Now)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Run This Query

Copy and paste this into the SQL Editor and click "Run":

```sql
-- Check current status
SELECT
  p.email,
  p.id as user_id,
  o.name as org_name
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
LEFT JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;
```

**Look for your email** - if the `org_name` column is empty/null, you need the fix.

### Step 3: Assign All Users to Default Org

Run this query to fix ALL users without an organization:

```sql
-- Assign all users without an org to Anonymous Haven AI
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT
  p.id as user_id,
  'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f' as organization_id,
  'Responder' as role,
  true as is_active
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
WHERE uo.id IS NULL
ON CONFLICT DO NOTHING;
```

### Step 4: Verify It Worked

Run this to confirm:

```sql
-- Verify all users now have an org
SELECT
  p.email,
  o.name as org_name,
  uo.role
FROM profiles p
JOIN user_organizations uo ON uo.user_id = p.id
JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;
```

You should see your email with "Anonymous Haven AI" as the org.

### Step 5: Test in App

1. **Close the app completely** (swipe away from recent apps)
2. **Reopen the app**
3. **Log in** with your test account
4. The Outreach tab should now appear!

## 🔧 Alternative: Assign Just Your User

If you only want to fix YOUR specific account:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT
  p.id as user_id,
  'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f' as organization_id,
  'Admin' as role,  -- Use 'Admin', 'Responder', or 'Viewer'
  true as is_active
FROM profiles p
WHERE p.email = 'your-email@example.com'
ON CONFLICT DO NOTHING;
```

## 📱 New Build Required?

**No!** The code changes are in the app logic, so you'll need a new build to get:

- Auto-redirect to onboarding for users without orgs
- Proper org setting after joining via onboarding

But the SQL fix will work immediately with your current build.

## 🎯 To Get the Latest Code

Run a new EAS build:

```bash
eas build --platform android --profile preview
```

Or wait for the build to complete and download from:
https://expo.dev/accounts/dr.ecovery/projects/odc-overdose-tracker/builds

## ✅ What This Fixes

1. ✅ Your test user will have an organization assigned
2. ✅ `activeOrg` will no longer be null
3. ✅ Outreach tab will show (if org has outreach enabled)
4. ✅ All data will be properly scoped to your organization
5. ✅ New users will be redirected to onboarding if they have no org

## 🆘 Still Not Working?

Check these:

1. **Is the org active?**

   ```sql
   SELECT id, name, is_active, outreach_enabled
   FROM organizations
   WHERE id = 'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f';
   ```

2. **Is outreach enabled for your org?**

   ```sql
   UPDATE organizations
   SET outreach_enabled = true
   WHERE id = 'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f';
   ```

3. **Check the app logs** - Look for `[OrgContext]` messages in your console
