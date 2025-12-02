# Outreach Logs Diagnostics Guide

## Overview

This guide provides a complete diagnostics workflow for the `outreach_logs` table, including schema verification, RLS policy testing, and functional CRUD operations.

## Files Created

### 1. `diagnose-outreach-logs-schema.sql`

**Purpose:** Read-only SQL queries to inspect database structure  
**Run in:** Supabase SQL Editor  
**What it checks:**

- Table schema (columns, types, defaults)
- RLS policies (SELECT/INSERT/UPDATE/DELETE)
- RLS enabled status
- Data distribution by organization
- Organizations with outreach enabled

### 2. `test-outreach-logs.ts`

**Purpose:** Functional testing with real authentication  
**Run with:** `npx tsx test-outreach-logs.ts`  
**What it tests:**

- User authentication
- Organization context loading
- SELECT operations (read logs)
- INSERT operations (create logs)
- UPDATE operations (modify logs)
- DELETE operations (remove logs)
- Cross-org access restrictions (security)

### 3. `find-test-users.js`

**Purpose:** Discover existing test users and their org memberships  
**Run with:** `node find-test-users.js`  
**What it shows:**

- All organizations in the database
- User-organization memberships
- Which users have outreach access

## Current Schema (as of 20251126 migration)

### outreach_logs Table Columns

```sql
id                  uuid PRIMARY KEY
zip_code            text NOT NULL
location            text
kit_types           text[] NOT NULL DEFAULT '{}'
num_kits            integer NOT NULL DEFAULT 0
people_reached      integer NOT NULL DEFAULT 0
notes               text
organization_id     uuid REFERENCES organizations(id)
user_id             uuid REFERENCES auth.users(id)
outreach_date       date NOT NULL DEFAULT CURRENT_DATE
team_members        text
team_organization   text
trip_count          integer NOT NULL DEFAULT 1
males_reached       integer NOT NULL DEFAULT 0
females_reached     integer NOT NULL DEFAULT 0
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

### RLS Policies (Harmonized)

#### SELECT Policy: `org_members_select_outreach_logs`

- **Who:** Authenticated users
- **Can read:** Logs from organizations they belong to
- **Logic:** Checks `user_organizations` for active membership

#### INSERT Policy: `org_members_insert_outreach_logs`

- **Who:** Authenticated users
- **Can create:** Logs for organizations they belong to
- **Logic:** Checks `user_organizations` for active membership

#### UPDATE Policy: `org_members_update_outreach_logs`

- **Who:** Authenticated users
- **Can update:** Logs they created OR logs from their org
- **Logic:** Checks `user_id` match OR org membership

#### DELETE Policy: `org_admins_delete_outreach_logs`

- **Who:** Org Admins/Owners only
- **Can delete:** Logs from their organization
- **Logic:** Checks `user_organizations` for Admin/Owner role

## How to Run Diagnostics

### Step 1: Database-Level Diagnostics

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents of diagnose-outreach-logs-schema.sql
```

**Expected Results:**

- ✅ Table has all required columns
- ✅ RLS is enabled
- ✅ 4 harmonized policies exist (select, insert, update, delete)
- ✅ Organizations with `outreach_enabled = true` exist
- ✅ Logs are distributed across organizations

### Step 2: Find Test Users

```bash
node find-test-users.js
```

**Expected Results:**

- List of organizations
- User IDs with their org memberships
- SQL query to get email addresses

### Step 3: Get User Emails

```sql
-- Run in Supabase SQL Editor
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
```

### Step 4: Update Test Credentials

Edit `test-outreach-logs.ts`:

```typescript
const TEST_USERS = {
  raep: {
    email: 'actual-email@example.com', // UPDATE THIS
    password: 'actual-password', // UPDATE THIS
    label: 'RAEP User',
    expectedOrg: 'recovery-alliance-el-paso',
  },
  haven: {
    email: 'another-email@example.com', // UPDATE THIS
    password: 'another-password', // UPDATE THIS
    label: 'Haven AI User',
    expectedOrg: 'anonymous-haven-ai',
  },
};
```

### Step 5: Run Functional Tests

```bash
npx tsx test-outreach-logs.ts
```

**Expected Results:**

- ✅ Sign In: Authentication successful
- ✅ Get Organization Context: User has active memberships
- ✅ SELECT outreach_logs: Can read org's logs
- ✅ INSERT outreach_logs: Can create new logs
- ✅ UPDATE outreach_logs: Can modify own logs
- ⚠️ DELETE outreach_logs: Denied for non-admins (expected)
- ✅ Cross-Org Access Test: Access properly blocked

## Troubleshooting

### No Organizations Found

**Problem:** `find-test-users.js` shows no organizations  
**Solution:** Run organization setup migrations:

```sql
-- Check if organizations table exists
SELECT * FROM organizations LIMIT 1;

-- If empty, create test organizations
INSERT INTO organizations (name, slug, outreach_enabled, is_active)
VALUES
  ('Recovery Alliance El Paso', 'recovery-alliance-el-paso', true, true),
  ('Anonymous Haven AI', 'anonymous-haven-ai', true, true);
```

### No User Memberships

**Problem:** Users exist but have no org memberships  
**Solution:** Create user-organization links:

```sql
-- Replace USER_ID and ORG_ID with actual UUIDs
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
VALUES
  ('USER_ID', 'ORG_ID', 'peer', true);
```

### Authentication Failed

**Problem:** Test users can't sign in  
**Solution:**

1. Verify email/password in Supabase Auth dashboard
2. Create new test users if needed
3. Update `test-outreach-logs.ts` with correct credentials

### RLS Denies All Access

**Problem:** Even org members can't read/write  
**Solution:** Check RLS policies:

```sql
-- Verify policies exist
SELECT * FROM pg_policies
WHERE tablename = 'outreach_logs';

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'outreach_logs';

-- If policies missing, re-run harmonization migration
```

### Cross-Org Access Not Blocked

**Problem:** Users can see other orgs' data  
**Solution:** This is a CRITICAL SECURITY ISSUE

1. Verify RLS is enabled
2. Check policy logic in migration
3. Test with `organization_id` filter explicitly

## Success Criteria

### Database Level ✅

- [ ] `outreach_logs` table exists with all columns
- [ ] RLS is enabled
- [ ] 4 harmonized policies exist
- [ ] At least 2 organizations with `outreach_enabled = true`
- [ ] At least 2 users with active org memberships

### Functional Level ✅

- [ ] Users can authenticate
- [ ] Users can see their organization context
- [ ] Users can SELECT logs from their org
- [ ] Users can INSERT logs for their org
- [ ] Users can UPDATE their own logs
- [ ] Admins can DELETE logs (non-admins cannot)
- [ ] Cross-org access is properly blocked

## Next Steps

After diagnostics pass:

1. Test in production with real users
2. Monitor RLS policy performance
3. Add analytics queries for outreach data
4. Implement ZIP-level sharing (if needed)
5. Create admin dashboard for cross-org insights

## Related Files

- `supabase/migrations/20251126_harmonize_rls_and_prep_zip_sharing.sql` - Current RLS policies
- `supabase/migrations/20251012_create_outreach_logs.sql` - Original table creation
- `RLS-HARMONIZATION-SUMMARY.md` - RLS policy documentation
- `MULTI_ORG_ARCHITECTURE.md` - Multi-tenant architecture overview
