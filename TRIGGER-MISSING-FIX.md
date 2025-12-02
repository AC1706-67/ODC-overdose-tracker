# Signup Trigger Missing - Fix Guide

**Issue:** The `on_auth_user_created` trigger is not present on `auth.users` table  
**Impact:** New user signups won't automatically create profiles or assign organizations  
**Status:** ⚠️ **NEEDS FIX**

---

## Problem

The migration created the function `handle_new_user_signup()` successfully, but the trigger that calls it is missing.

**Verification Results:**
- ✅ Function exists: `public.handle_new_user_signup()`
- ✅ Default org exists: `anonymous-haven-ai`
- ✅ RLS policies created: profiles (5), user_organizations (4)
- ❌ **Trigger missing:** `on_auth_user_created` on `auth.users`

---

## Why This Happened

Possible causes:

1. **Permissions Issue**
   - Creating triggers on `auth.users` requires elevated permissions
   - Supabase may restrict trigger creation on auth schema tables
   - The migration may have silently failed on the trigger creation step

2. **Schema Restrictions**
   - The `auth` schema is managed by Supabase
   - Some operations on `auth.users` may be restricted
   - Triggers might need to be created with specific roles

3. **Migration Execution**
   - The trigger creation statement may have been skipped
   - An error during migration may have rolled back only the trigger
   - The migration may have been run with insufficient privileges

---

## Solution

### Step 1: Search for Existing Triggers

First, check if there are any existing triggers or naming conflicts:

```sql
-- Run in Supabase SQL Editor:
-- File: search-all-auth-triggers.sql
```

This will show:
- All triggers on `auth.users`
- Any triggers with similar names
- Function details and permissions
- Auth schema permissions

### Step 2: Recreate the Trigger

If no conflicts found, recreate the trigger:

```sql
-- Run in Supabase SQL Editor:
-- File: recreate-signup-trigger.sql
```

This script will:
1. ✅ Verify the function exists
2. ✅ Drop any existing trigger (safety)
3. ✅ Create the trigger
4. ✅ Verify it was created successfully
5. ✅ Show trigger details

### Step 3: Verify Success

After running the recreation script, verify:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
```

**Expected:** 1 row showing the trigger

---

## Alternative: Manual Trigger Creation

If the script fails, try creating the trigger manually:

```sql
-- Drop existing (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();
```

---

## If Trigger Creation Fails

### Error: "permission denied for table users"

**Cause:** Insufficient permissions to create triggers on `auth.users`

**Solutions:**

1. **Run as superuser** (if self-hosted):
   ```sql
   -- Connect as postgres superuser
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION public.handle_new_user_signup();
   ```

2. **Grant trigger permission** (if self-hosted):
   ```sql
   GRANT TRIGGER ON auth.users TO postgres;
   GRANT TRIGGER ON auth.users TO authenticated;
   ```

3. **Contact Supabase Support** (if hosted):
   - Explain you need a trigger on `auth.users`
   - Provide the trigger creation SQL
   - Ask them to create it with elevated permissions

### Error: "function handle_new_user_signup() does not exist"

**Cause:** The function wasn't created by the migration

**Solution:** Re-run the migration:
```sql
-- File: supabase/migrations/20251201_fix_signup_flow.sql
```

### Error: "trigger already exists"

**Cause:** A trigger with that name already exists

**Solution:** Drop it first:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

---

## Workaround: Use Supabase Webhooks

If you cannot create triggers on `auth.users`, use Supabase Auth Webhooks:

### 1. Create a Webhook Endpoint

In your backend or Edge Function:

```typescript
// Edge Function: functions/auth-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { type, record } = await req.json()

  if (type === 'INSERT' && record.id) {
    // Create profile
    await supabase.from('profiles').insert({
      id: record.id,
      email: record.email,
      display_name: record.email.split('@')[0],
      terms_accepted_at: record.raw_user_meta_data?.terms_accepted_at,
      privacy_accepted_at: record.raw_user_meta_data?.privacy_accepted_at,
      accepted_version: record.raw_user_meta_data?.accepted_version || '1.0'
    })

    // Assign to default org
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'anonymous-haven-ai')
      .single()

    if (org) {
      await supabase.from('user_organizations').insert({
        user_id: record.id,
        organization_id: org.id,
        role: 'member',
        is_active: true
      })
    }
  }

  return new Response('OK', { status: 200 })
})
```

### 2. Configure Webhook in Supabase

1. Go to **Authentication** → **Hooks**
2. Add a new hook for **User Created** event
3. Point to your Edge Function URL
4. Set secret for verification

---

## Testing After Fix

### 1. Test Trigger Manually

```sql
-- This simulates a user signup (DO NOT RUN IN PRODUCTION!)
-- Only run this in a test/dev environment

-- Insert a test user (this will trigger the function)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'trigger-test@example.com',
  crypt('testpass123', gen_salt('bf')),
  now(),
  '{"terms_accepted_at": "2025-12-01T10:00:00Z", "privacy_accepted_at": "2025-12-01T10:00:00Z", "accepted_version": "1.0"}'::jsonb,
  now(),
  now()
);

-- Check if profile was created
SELECT * FROM profiles WHERE email = 'trigger-test@example.com';

-- Check if org assignment was created
SELECT 
  p.email,
  o.name as organization,
  uo.role
FROM profiles p
JOIN user_organizations uo ON p.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE p.email = 'trigger-test@example.com';

-- Clean up test data
DELETE FROM auth.users WHERE email = 'trigger-test@example.com';
```

### 2. Test in App

1. Open your app
2. Navigate to signup screen
3. Create a test account:
   - Email: `app-test@example.com`
   - Password: `testpass123`
4. Check Terms checkbox
5. Click "Sign Up"

**Expected:**
- ✅ "Success! Account created!" message
- ✅ No database errors
- ✅ Can sign in immediately

**Verify in database:**
```sql
SELECT 
  p.email,
  p.terms_accepted_at,
  o.name as organization,
  uo.role
FROM profiles p
JOIN user_organizations uo ON p.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE p.email = 'app-test@example.com';
```

---

## Files to Run

1. **`search-all-auth-triggers.sql`** - Check for existing triggers
2. **`recreate-signup-trigger.sql`** - Recreate the missing trigger
3. **`verify-signup-migration-complete.sql`** - Verify everything works

---

## Summary

**Current State:**
- ✅ Function created
- ✅ RLS policies created
- ✅ Default org exists
- ❌ **Trigger missing** ← This is the issue

**Fix:**
1. Run `search-all-auth-triggers.sql` to check for conflicts
2. Run `recreate-signup-trigger.sql` to create the trigger
3. Test signup flow in app
4. Verify profile and org assignment are created

**After Fix:**
- ✅ Trigger fires on new user signup
- ✅ Profile created automatically
- ✅ User assigned to "Anonymous Haven AI"
- ✅ Legal timestamps saved
- ✅ Signup flow works end-to-end

---

**Status:** Ready to fix - run the recreation script!
