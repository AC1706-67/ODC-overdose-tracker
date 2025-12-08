# Self-Service Signup - Current Implementation

## Overview
The signup flow uses **direct database operations** instead of RPC functions or triggers.
This is the correct approach for Supabase managed projects where triggers on `auth.users` are not supported.

## Why Direct Operations?
- ✅ Supabase managed projects don't allow triggers on `auth.users`
- ✅ Direct operations are simpler and more reliable
- ✅ Better error messages for debugging
- ✅ No need for SECURITY DEFINER functions

## Solution
Updated `app/signup.tsx` to use **direct database operations** instead of RPC:

### New Flow
1. **Create auth user** with `supabase.auth.signUp()`
2. **Find default org** (`anonymous-haven-ai`)
3. **Create profile** directly in `profiles` table
4. **Assign to org** directly in `user_organizations` table
5. **Sign out** so user can log in fresh

### Key Changes
- ✅ No RPC functions needed
- ✅ Real error messages shown (not generic "Database error")
- ✅ Detailed console logs for debugging
- ✅ Self-service - no manual setup required
- ✅ Assigns to "Anonymous Haven AI" by default

## Setup Required

### 1. Ensure Default Org Exists
Run `ensure-default-org-exists.sql` in Supabase SQL Editor to create/verify the default organization.

### 2. Verify RLS Policies
The following policies must exist (already fixed earlier):

**profiles table:**
- Users can INSERT their own profile
- Users can SELECT their own profile

**user_organizations table:**
- Users can INSERT their own memberships
- Users can SELECT their own memberships

### 3. Test Signup
1. Open app in Expo Go
2. Go to Sign Up screen
3. Enter email + password
4. Check Metro logs for detailed output:
   ```
   [Signup] Starting signup for: test@example.com
   [Signup] ✅ Auth user created: <uuid>
   [Signup] ✅ Found default org: Anonymous Haven AI
   [Signup] ✅ Profile created
   [Signup] ✅ User assigned to org
   [Signup] ✅ Signup complete!
   ```

## Error Messages
Now shows **real errors** instead of generic messages:
- "Sign up failed: <auth error>"
- "Default organization not found: <error>"
- "Failed to create profile: <error>"
- "Failed to assign organization: <error>"

This makes debugging much easier!

## Testing

### Option 1: Test in Expo Go (Recommended)
1. Open app in Expo Go
2. Go to Sign Up screen
3. Enter email + password
4. Check Metro logs for detailed output

### Option 2: Run Automated Test
```bash
node manual-signup-test.js
```

This will:
- Create a test user
- Verify all database operations
- Test sign in
- Show detailed results

### Option 3: Check Database Health
Run in Supabase SQL Editor:
```sql
\i test-current-signup-flow.sql
```

This checks:
- Default org exists
- RLS policies are correct
- No orphaned users
- Recent signups are complete

## Troubleshooting

### "Default organization not found"
Run: `ensure-default-org-exists.sql` in Supabase SQL Editor

### "Failed to create profile"
Check RLS policies on `profiles` table - need INSERT and SELECT for own user

### "Failed to assign organization"
Check RLS policies on `user_organizations` table - need INSERT and SELECT for own user

### Tabs not appearing after login
1. Check Metro logs for `[OrgContext]` messages
2. Verify RLS policies are not recursive
3. Run: `FORCE-CLEAR-RLS-CACHE.sql` if needed
