# How to Apply the Signup Fix Migration

## Fixed Issues

✅ **Function delimiter:** Changed from `$` to `$$` (PostgreSQL standard)  
✅ **Policy creation:** Added `DROP POLICY IF EXISTS` before all `CREATE POLICY` statements

PostgreSQL doesn't support `CREATE POLICY IF NOT EXISTS`, so we must drop first.

---

## Apply the Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20251201_fix_signup_flow.sql`
4. Paste into the SQL Editor
5. Click **Run**

### Option 2: Supabase CLI

```bash
# Make sure you're in the project root
cd /path/to/ODC-overdose-tracker

# Push the migration
supabase db push
```

---

## Verify the Migration

After running, execute these queries to verify:

```sql
-- 1. Check the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users'
  AND event_object_schema = 'auth';

-- Expected: 1 row showing the trigger

-- 2. Check Anonymous Haven AI organization exists
SELECT 
  id,
  name,
  slug,
  is_active
FROM public.organizations
WHERE slug = 'anonymous-haven-ai';

-- Expected: 1 row with the organization

-- 3. Check profiles RLS policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected: 4 policies
-- - Enable insert for authentication (INSERT)
-- - Managers can view org member profiles (SELECT)
-- - Users can update own profile (UPDATE)
-- - Users can view own profile (SELECT)

-- 4. Check user_organizations RLS policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY policyname;

-- Expected: 4 policies
-- - Admins can manage memberships (ALL)
-- - Enable insert for new users (INSERT)
-- - Managers can view org memberships (SELECT)
-- - Users can view own memberships (SELECT)
```

---

## Test Signup

1. **Open your app**
2. **Navigate to signup screen**
3. **Enter test credentials:**
   - Email: `test-signup@example.com`
   - Password: `testpass123`
   - Confirm Password: `testpass123`
4. **Check Terms of Service checkbox**
5. **Click "Sign Up"**

### Expected Result:
✅ "Success! Account created!" message  
✅ No database errors

### Verify in Database:
```sql
-- Check the new user
SELECT 
  p.id,
  p.email,
  p.display_name,
  p.terms_accepted_at,
  p.privacy_accepted_at,
  o.name as organization,
  uo.role
FROM profiles p
JOIN user_organizations uo ON p.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE p.email = 'test-signup@example.com';
```

Expected:
- ✅ Profile exists
- ✅ `terms_accepted_at` and `privacy_accepted_at` have timestamps
- ✅ User is assigned to "Anonymous Haven AI"
- ✅ Role is "member"

---

## Troubleshooting

### If migration fails:

1. **Check for existing conflicting triggers:**
   ```sql
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE event_object_table = 'users'
     AND event_object_schema = 'auth';
   ```

2. **Manually drop old triggers if needed:**
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP TRIGGER IF EXISTS on_auth_user_created_assign_org ON auth.users;
   ```

3. **Re-run the migration**

### If signup still fails:

1. **Check Supabase logs** in the dashboard
2. **Look for trigger errors** in PostgreSQL logs
3. **Verify RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
     AND tablename IN ('profiles', 'user_organizations');
   ```

4. **Check function exists:**
   ```sql
   SELECT proname, prosrc
   FROM pg_proc
   WHERE proname = 'handle_new_user_signup';
   ```

---

## Rollback (If Needed)

If you need to rollback:

```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Restore old trigger (if you had one)
-- (You'll need to find your previous trigger definition)
```

---

## Success Indicators

After applying the fix, you should see:

✅ No "Database error saving new user" messages  
✅ New users can sign up successfully  
✅ Profiles are created automatically  
✅ Users are assigned to "Anonymous Haven AI"  
✅ Legal acceptance timestamps are saved  
✅ Users can sign in immediately after signup  

---

**Migration File:** `supabase/migrations/20251201_fix_signup_flow.sql`  
**Status:** ✅ Ready to apply  
**PostgreSQL Version:** Compatible with PostgreSQL 12+
