# Quick Start: Outreach Logs Diagnostics

## Step 1: Check Database Schema (Run in Supabase SQL Editor)

```sql
-- 1. Check table columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'outreach_logs' 
ORDER BY ordinal_position;

-- 2. Check RLS policies
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- 3. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs';

-- 4. Count logs by organization
SELECT 
  ol.organization_id,
  o.name as org_name,
  o.slug as org_slug,
  COUNT(*) as log_count
FROM public.outreach_logs ol
LEFT JOIN public.organizations o ON ol.organization_id = o.id
GROUP BY ol.organization_id, o.name, o.slug
ORDER BY log_count DESC;

-- 5. Check organizations with outreach enabled
SELECT 
  id,
  name,
  slug,
  outreach_enabled,
  is_active
FROM public.organizations
WHERE outreach_enabled = true
ORDER BY name;

-- 6. Check user memberships
SELECT 
  uo.user_id,
  u.email,
  o.name as org_name,
  o.slug as org_slug,
  uo.role,
  uo.is_active
FROM public.user_organizations uo
JOIN public.organizations o ON uo.organization_id = o.id
LEFT JOIN auth.users u ON uo.user_id = u.id
WHERE uo.is_active = true
ORDER BY o.name, u.email;
```

## Step 2: Find Test Users (Run in Terminal)

```bash
node find-test-users.js
```

## Step 3: Get User Emails (Run in Supabase SQL Editor)

```sql
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
```

## Step 4: Update Test File

Edit `test-outreach-logs.ts` and update the credentials:

```typescript
const TEST_USERS = {
  raep: {
    email: 'YOUR_EMAIL_HERE@example.com',
    password: 'YOUR_PASSWORD_HERE',
    label: 'RAEP User',
    expectedOrg: 'recovery-alliance-el-paso'
  },
  haven: {
    email: 'ANOTHER_EMAIL@example.com',
    password: 'ANOTHER_PASSWORD',
    label: 'Haven AI User',
    expectedOrg: 'anonymous-haven-ai'
  }
};
```

## Step 5: Run Functional Tests (Run in Terminal)

```bash
npx tsx test-outreach-logs.ts
```

## Expected Output

### ✅ Success Looks Like:
```
🧪 Testing: RAEP User
✅ Sign In: Authenticated as user@example.com
✅ Get Organization Context: User belongs to 1 organization(s)
✅ SELECT outreach_logs: Read 5 logs
✅ INSERT outreach_logs: Created log ID: abc-123
✅ UPDATE outreach_logs: Updated log ID: abc-123
⚠️  DELETE outreach_logs: Delete denied (expected for non-admins)
✅ Cross-Org Access Test: Cross-org access properly blocked
```

### ❌ Failure Looks Like:
```
❌ Sign In: Authentication failed
   Error: Invalid login credentials
```

## Troubleshooting

### If No Organizations Exist:
```sql
INSERT INTO organizations (name, slug, outreach_enabled, is_active)
VALUES 
  ('Recovery Alliance El Paso', 'recovery-alliance-el-paso', true, true),
  ('Anonymous Haven AI', 'anonymous-haven-ai', true, true);
```

### If User Has No Organization:
```sql
-- Get user ID and org ID from previous queries, then:
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
VALUES 
  ('USER_UUID_HERE', 'ORG_UUID_HERE', 'peer', true);
```

### If RLS Policies Missing:
Re-run the harmonization migration:
```bash
# In Supabase dashboard, go to SQL Editor and run:
supabase/migrations/20251126_harmonize_rls_and_prep_zip_sharing.sql
```

## What Each Test Validates

1. **Sign In** - Authentication works
2. **Get Organization Context** - User has active org membership
3. **SELECT** - RLS allows reading org's logs
4. **INSERT** - RLS allows creating logs for org
5. **UPDATE** - RLS allows modifying own logs
6. **DELETE** - RLS restricts deletion to admins
7. **Cross-Org Access** - RLS blocks access to other orgs' data

## Success Criteria

All tests should pass except:
- ⚠️ DELETE may fail for non-admin users (this is expected and correct)
- ✅ Cross-org access should be blocked (this is a security feature)
