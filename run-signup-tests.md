# Signup Flow Testing Guide

## Current Implementation Status

✅ **Signup flow uses direct database operations** (no RPC functions)
✅ **RLS policies fixed** (no recursive queries)
✅ **Auth state listener added** (tabs appear after login)
✅ **Default org verified** (Anonymous Haven AI exists)

## Files Cleaned Up

The following outdated files have been removed:
- All documentation referencing `handle_new_user_signup_manual` RPC function
- Old SQL migration files for trigger-based signup
- Backfill scripts for the old approach
- Test files for the abandoned RPC method

## Testing Options

### 1. Quick Database Check (Run First)

Open Supabase SQL Editor and run:
```sql
\i test-current-signup-flow.sql
```

**Expected Results:**
- ✅ Anonymous Haven AI exists
- ✅ Profiles table has INSERT and SELECT policies
- ✅ User_organizations has exactly 2 non-recursive policies
- ✅ No orphaned users
- ✅ All users have org assignments

### 2. Automated Signup Test (Idempotent ✨)

Test the entire signup flow without using the app:

```bash
node manual-signup-test.js
```

**What it does:**
1. Creates a test user with unique email
2. Finds default organization
3. Creates profile (upsert for idempotency)
4. Assigns to organization (upsert with INSERT fallback)
5. Tests sign in
6. Verifies all data exists

**Features:**
- ✅ Safe to run multiple times (idempotent)
- ✅ Uses upsert where possible
- ✅ Smart fallback for RLS constraints
- ✅ Future-proof for multi-org support
- ✅ Creates real test account you can use

**Expected Output:**
```
🎉 SIGNUP TEST PASSED!
✅ All 4 steps completed successfully
✅ User can sign in
✅ Profile exists
✅ Org membership exists
```

**Note:** You may see "upsert error" followed by successful INSERT fallback. This is expected and handled gracefully. See `RLS-UPSERT-REQUIREMENTS.md` for details.

### 3. Test in Expo Go

1. Make sure Metro dev server is running:
   ```bash
   npx expo start --clear
   ```

2. Open app in Expo Go

3. Navigate to Sign Up screen

4. Enter test credentials:
   - Email: `test-[timestamp]@example.com`
   - Password: `TestPassword123!`
   - Check "I agree to Terms..."

5. Watch Metro logs for:
   ```
   [Signup] Starting signup for: test@example.com
   [Signup] ✅ Auth user created: <uuid>
   [Signup] ✅ Found default org: Anonymous Haven AI
   [Signup] ✅ Profile created
   [Signup] ✅ User assigned to org
   [Signup] ✅ Signup complete!
   ```

6. Sign in with the new account

7. Verify all 4 tabs appear:
   - 📊 Dashboard
   - 📋 Incidents
   - 🤝 Outreach
   - ⚙️ Settings

8. Watch Metro logs for:
   ```
   [OrgContext] Loading org for user: <uuid>
   [OrgContext] ✅ Successfully loaded org: {"id":"...","name":"Anonymous Haven AI",...}
   ```

## What to Check

### ✅ Signup Success Indicators
- No error alerts shown
- "Account created! You can now sign in." message appears
- Redirected back to login screen

### ✅ Login Success Indicators
- All 4 tabs visible in bottom navigation
- Dashboard tab shows org name: "Anonymous Haven AI"
- Outreach tab is accessible (outreach_enabled: true)
- No "activeOrg: null" in Metro logs

### ❌ Common Issues

**Issue: "Default organization not found"**
- Solution: Run `ensure-default-org-exists.sql` in Supabase SQL Editor

**Issue: "Failed to create profile"**
- Solution: Check RLS policies on `profiles` table
- Need: INSERT policy for `auth.uid() = id`

**Issue: "Failed to assign organization"**
- Solution: Check RLS policies on `user_organizations` table
- Need: INSERT policy for `auth.uid() = user_id`

**Issue: Only 2 tabs appear (missing Dashboard + Outreach)**
- Solution: RLS recursion issue
- Run: `FORCE-CLEAR-RLS-CACHE.sql` in Supabase SQL Editor
- Restart Metro: `npx expo start --clear`

**Issue: Tabs appear on first login, disappear on second login**
- Solution: Auth state listener issue (should be fixed)
- Check: `src/context/OrgContext.tsx` has `onAuthStateChange` listener
- Verify: Metro logs show org loading on each login

## Architecture Notes

### Current Flow (Direct Operations)
```
User fills signup form
    ↓
supabase.auth.signUp() - creates auth user
    ↓
Query organizations table - find default org
    ↓
INSERT into profiles - create user profile
    ↓
INSERT into user_organizations - assign to org
    ↓
Sign out (so user can sign in fresh)
    ↓
Success! User can now sign in
```

### Why Not Triggers?
- Supabase managed projects don't support triggers on `auth.users`
- Triggers exist but never fire
- Direct operations are more reliable

### Why Not RPC Functions?
- Adds unnecessary complexity
- Harder to debug
- Direct operations give better error messages
- No need for SECURITY DEFINER permissions

## Next Steps

After testing signup:
1. ✅ Verify signup works in Expo Go
2. ✅ Verify all 4 tabs appear after login
3. ✅ Test logout/login cycle (tabs should persist)
4. ✅ Test organization request form (`/request-organization`)
5. 🚀 Ready for production testing!
