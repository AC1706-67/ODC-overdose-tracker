# Signup Flow - Quick Reference

## Current Implementation ✅

**File:** `app/signup.tsx`

**Method:** Direct database operations (no triggers, no RPC)

**Flow:**
```
1. supabase.auth.signUp() → Create auth user
2. Query organizations → Find default org
3. INSERT profiles → Create profile
4. INSERT user_organizations → Assign to org
5. supabase.auth.signOut() → Clear session
```

## Testing

### Quick Test (Idempotent ✨)
```bash
node manual-signup-test.js
```

**Features:**
- ✅ Creates unique test user each run
- ✅ Idempotent (safe to run multiple times)
- ✅ Uses upsert with INSERT fallback
- ✅ Tests complete signup flow
- ✅ Verifies login works
- ✅ Future-proof for multi-org support

### Database Check
```sql
\i test-current-signup-flow.sql
```

### Manual Test
1. Open Expo Go
2. Sign Up screen
3. Enter email/password
4. Watch Metro logs
5. Sign in
6. Verify 4 tabs appear

## Common Issues

| Issue | Solution |
|-------|----------|
| "Default organization not found" | Run `ensure-default-org-exists.sql` |
| "Failed to create profile" | Check RLS policies on `profiles` |
| "Failed to assign organization" | Check RLS policies on `user_organizations` |
| Only 2 tabs appear | Run `FORCE-CLEAR-RLS-CACHE.sql` |
| Tabs disappear after logout | Already fixed - auth listener added |

## Key Files

### Active
- `app/signup.tsx` - Signup implementation
- `src/context/OrgContext.tsx` - Org loading
- `app/(tabs)/_layout.tsx` - Tab visibility
- `ensure-default-org-exists.sql` - Setup default org
- `FORCE-CLEAR-RLS-CACHE.sql` - Fix RLS issues

### Documentation
- `CURRENT-SIGNUP-ARCHITECTURE.md` - Full architecture
- `run-signup-tests.md` - Testing guide
- `SIGNUP-TESTING-COMPLETE.md` - Test results
- `SELF-SERVICE-SIGNUP-FIXED.md` - Implementation details

### Tests
- `manual-signup-test.js` - Automated test
- `test-current-signup-flow.sql` - Database health check

## Success Indicators

### Signup Success
- ✅ No error alerts
- ✅ "Account created!" message
- ✅ Redirected to login

### Login Success
- ✅ All 4 tabs visible
- ✅ Dashboard shows org name
- ✅ Outreach tab accessible
- ✅ Metro logs show org loaded

## Metro Log Messages

### Good Signs ✅
```
[Signup] ✅ Auth user created
[Signup] ✅ Found default org
[Signup] ✅ Profile created
[Signup] ✅ User assigned to org
[OrgContext] ✅ Successfully loaded org
```

### Bad Signs ❌
```
[Signup] ❌ Default org not found
[Signup] ❌ Profile creation error
[Signup] ❌ Membership creation error
[OrgContext] ❌ No membership found
```

## Database Requirements

### Default Org
```sql
slug: 'anonymous-haven-ai'
name: 'Anonymous Haven AI'
outreach_enabled: true
```

### RLS Policies
**profiles:** INSERT + SELECT for own user
**user_organizations:** INSERT + SELECT for own user
**CRITICAL:** No recursive policies!

## Why This Approach?

| Approach | Status | Reason |
|----------|--------|--------|
| Triggers on auth.users | ❌ | Not supported in managed Supabase |
| RPC functions | ❌ | Adds complexity, harder to debug |
| Direct operations | ✅ | Simple, reliable, clear errors |

## Quick Commands

```bash
# Test signup
node manual-signup-test.js

# Start app
npx expo start --clear

# Check database
# (Run in Supabase SQL Editor)
\i test-current-signup-flow.sql

# Fix RLS issues
# (Run in Supabase SQL Editor)
\i FORCE-CLEAR-RLS-CACHE.sql
```

## Status: ✅ READY FOR TESTING

The signup flow is tested, documented, and ready for production use.
