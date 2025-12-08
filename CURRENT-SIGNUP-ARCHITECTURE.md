# Current Signup Architecture

## Overview

The signup system uses **direct database operations** instead of triggers or RPC functions. This is the recommended approach for Supabase managed projects.

## Implementation

### File: `app/signup.tsx`

The signup flow performs these operations in sequence:

```typescript
1. supabase.auth.signUp({ email, password })
   → Creates user in auth.users table
   → Returns user.id

2. supabase.from('organizations').select()
   → Finds default org (anonymous-haven-ai)
   → Returns org.id

3. supabase.from('profiles').insert()
   → Creates profile with user.id
   → Stores email, terms acceptance

4. supabase.from('user_organizations').insert()
   → Links user to organization
   → Sets role: 'Responder'

5. supabase.auth.signOut()
   → Clears session
   → User can now sign in fresh
```

## Why This Approach?

### ❌ Triggers Don't Work
- Supabase managed projects don't allow triggers on `auth.users`
- Triggers can be created but never fire
- This is a platform limitation

### ❌ RPC Functions Add Complexity
- Requires SECURITY DEFINER permissions
- Harder to debug errors
- Generic error messages
- Extra maintenance burden

### ✅ Direct Operations Are Better
- Simple and straightforward
- Clear error messages
- Easy to debug
- No special permissions needed
- Works reliably

## Database Requirements

### 1. Default Organization

Must exist in `organizations` table:
```sql
slug: 'anonymous-haven-ai'
name: 'Anonymous Haven AI'
is_active: true
outreach_enabled: true
```

Run `ensure-default-org-exists.sql` to create/verify.

### 2. RLS Policies

**profiles table:**
```sql
-- Allow users to create their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

**user_organizations table:**
```sql
-- Allow users to view their memberships
CREATE POLICY "Users can view their org memberships"
ON user_organizations FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to join organizations
CREATE POLICY "Users can join orgs they are assigned to"
ON user_organizations FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**CRITICAL:** No recursive policies! Policies must NOT reference the same table in WHERE clauses.

## Error Handling

The signup flow shows specific error messages:

- **"Sign up failed: [error]"** → Auth error (email taken, weak password, etc.)
- **"Default organization not found"** → Run `ensure-default-org-exists.sql`
- **"Failed to create profile: [error]"** → Check RLS policies on profiles
- **"Failed to assign organization: [error]"** → Check RLS policies on user_organizations

All errors are logged to console with `[Signup]` prefix for easy debugging.

## Post-Signup Flow

After successful signup:

1. User is signed out automatically
2. User navigates back to login screen
3. User signs in with new credentials
4. `OrgContext` loads organization data
5. All 4 tabs appear (Dashboard, Incidents, Outreach, Settings)

### Organization Loading

File: `src/context/OrgContext.tsx`

```typescript
1. onAuthStateChange listener fires on login
2. Query user_organizations for user's memberships
3. Query organizations for full org data
4. Set activeOrg state
5. Tabs become visible based on org features
```

## Tab Visibility Logic

File: `app/(tabs)/_layout.tsx`

```typescript
- Incidents tab: Always visible
- Settings tab: Always visible
- Dashboard tab: Visible when hasOrg === true
- Outreach tab: Visible when hasOrg === true AND outreachEnabled === true
```

## Testing

### Automated Test
```bash
node manual-signup-test.js
```

### Database Health Check
```sql
\i test-current-signup-flow.sql
```

### Manual Test in Expo Go
1. Open app
2. Go to Sign Up
3. Enter email/password
4. Check Metro logs for `[Signup]` messages
5. Sign in with new account
6. Verify all 4 tabs appear

## Files

### Active Files (In Use)
- `app/signup.tsx` - Signup form and logic
- `src/context/OrgContext.tsx` - Org loading with auth listener
- `app/(tabs)/_layout.tsx` - Tab visibility logic
- `ensure-default-org-exists.sql` - Creates default org
- `FORCE-CLEAR-RLS-CACHE.sql` - Fixes RLS recursion issues

### Test Files
- `manual-signup-test.js` - Automated signup test
- `test-current-signup-flow.sql` - Database health check
- `run-signup-tests.md` - Testing guide

### Documentation
- `SELF-SERVICE-SIGNUP-FIXED.md` - Implementation details
- `CURRENT-SIGNUP-ARCHITECTURE.md` - This file
- `ORGANIZATION-ONBOARDING-FLOW.md` - Org request system

### Removed Files (Outdated)
- All files referencing `handle_new_user_signup_manual`
- Trigger-based signup files
- RPC function migration files
- Old documentation about failed approaches

## Common Issues

### Issue: Tabs Missing After Login

**Symptoms:**
- Only Incidents and Settings tabs visible
- Dashboard and Outreach tabs missing
- Metro logs show `activeOrg: null`

**Cause:** RLS recursion on `user_organizations` table

**Solution:**
```sql
\i FORCE-CLEAR-RLS-CACHE.sql
```

Then restart Metro:
```bash
npx expo start --clear
```

### Issue: Signup Fails Silently

**Symptoms:**
- No error message shown
- User not created
- Metro logs show nothing

**Cause:** Old code still trying to use RPC function

**Solution:** Verify `app/signup.tsx` matches current implementation (direct operations, not RPC)

### Issue: "Default organization not found"

**Symptoms:**
- Signup fails after auth user created
- Error message shows org not found

**Cause:** Default org doesn't exist or has wrong slug

**Solution:**
```sql
\i ensure-default-org-exists.sql
```

## Architecture Decisions

### Why "Anonymous Haven AI" as Default?

- Provides immediate access for new users
- No approval process needed
- Users can request dedicated org later
- Simplifies onboarding flow

### Why Sign Out After Signup?

- Ensures clean session state
- Forces org data to load on first login
- Prevents stale auth tokens
- Matches user expectations (signup → login)

### Why Direct Operations Instead of Edge Functions?

- Simpler to maintain
- Faster execution
- No cold start delays
- Easier to debug
- No additional infrastructure

## Future Considerations

### Multi-Org Support

Current implementation supports multiple orgs per user:
- `user_organizations` table allows multiple rows per user
- `OrgContext` loads first active membership
- Future: Add org switcher UI

### Organization Requests

Users can request dedicated organizations:
- Form at `/request-organization`
- Stores in `certification_requests` table
- Admin reviews in Supabase dashboard
- Manual approval process

### Invite Codes (Removed)

Previous implementation had invite codes system:
- Removed in favor of simpler certification requests
- Less complexity
- Easier for admins to manage
- Better user experience

## Maintenance

### When Adding New Tables

If adding tables that need org isolation:

1. Add `organization_id` column
2. Create RLS policies:
   ```sql
   -- Read own org's data
   CREATE POLICY "Users can view own org data"
   ON new_table FOR SELECT
   USING (
     organization_id IN (
       SELECT organization_id 
       FROM user_organizations 
       WHERE user_id = auth.uid()
     )
   );
   ```
3. Test with multiple orgs
4. Verify no recursive queries

### When Updating RLS Policies

1. Check for recursion (table referencing itself)
2. Test with real user accounts
3. Clear cache: `DISCARD PLANS;`
4. Restart app to clear client cache

### When Debugging Signup Issues

1. Check Metro logs for `[Signup]` messages
2. Run `test-current-signup-flow.sql`
3. Verify default org exists
4. Check RLS policies
5. Test with `manual-signup-test.js`

## Success Metrics

A successful signup should:
- ✅ Create auth user
- ✅ Create profile
- ✅ Assign to default org
- ✅ Allow immediate sign in
- ✅ Show all 4 tabs
- ✅ Load org data correctly
- ✅ Persist across logout/login

## Support

For issues:
1. Check Metro logs
2. Run database health check
3. Verify RLS policies
4. Test with automated script
5. Check Supabase dashboard for errors
