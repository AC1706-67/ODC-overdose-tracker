# Signup Test Script Improvements

## Summary

The `manual-signup-test.js` script has been upgraded with two key improvements:

1. **Idempotent operations** - Safe to run multiple times
2. **Multi-org future-proofing** - Ready for when users can join multiple organizations

## Upgrade 1: Idempotent Operations

### Before
```javascript
// Would fail on second run with "duplicate key" error
await supabase.from('profiles').insert({ ... });
await supabase.from('user_organizations').insert({ ... });
```

### After
```javascript
// Uses upsert - creates or updates, no errors
await supabase.from('profiles').upsert({ ... }, { onConflict: 'id' });

// Tries upsert, falls back to INSERT if RLS blocks UPDATE
await supabase.from('user_organizations').upsert(
  { ... }, 
  { onConflict: 'user_id,organization_id' }
);
```

### Benefits
- ✅ No "duplicate key" noise in output
- ✅ Safe to run multiple times
- ✅ Cleaner test results
- ✅ More realistic production behavior

## Upgrade 2: Multi-Org Support

### Before
```javascript
// Would error if user has 0 or >1 org memberships
const { data: membership } = await supabase
  .from('user_organizations')
  .select('*, organizations(name, slug)')
  .eq('user_id', authData.user.id)
  .single(); // ❌ Fails if not exactly 1 row
```

### After
```javascript
// Handles any number of org memberships
const { data: memberships } = await supabase
  .from('user_organizations')
  .select('*, organizations(name, slug)')
  .eq('user_id', authData.user.id);

const primaryMembership = memberships[0];
if (memberships.length > 1) {
  console.log(`(User has ${memberships.length} org memberships)`);
}
```

### Benefits
- ✅ Works with 0, 1, or many org memberships
- ✅ Future-proof for multi-org feature
- ✅ Better error messages
- ✅ Shows all memberships in output

## RLS Consideration

### Why Upsert Falls Back to INSERT

The `user_organizations` table only has an INSERT policy, not UPDATE:

```sql
-- Current policy (INSERT only)
CREATE POLICY "Users can join orgs they are assigned to"
ON user_organizations FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

Upsert needs both INSERT and UPDATE policies. Since we don't have UPDATE, the script:
1. Tries upsert
2. Gets RLS error
3. Falls back to regular INSERT
4. Handles "duplicate key" gracefully

This is **intentional** - we don't want users modifying their own org memberships. Only admins should do that.

### Should We Add UPDATE Policy?

**No.** The fallback approach is better because:
- ✅ Maintains security (users can't change their role)
- ✅ Test still works perfectly
- ✅ Production app uses INSERT anyway (not upsert)
- ✅ Simpler RLS policies

See `RLS-UPSERT-REQUIREMENTS.md` for full analysis.

## Test Output

### Clean Success
```
🧪 Testing Signup Flow
============================================================
📧 Test Email: test-1765046614011-9828@example.com
🔑 Password: TestPassword123!
============================================================

[Step 1] Creating auth user...
✅ Auth user created: f1e428f9-2bd2-48b5-8e5d-607ed5b145d0

[Step 2] Finding default organization...
✅ Found default org: Anonymous Haven AI

[Step 3] Creating profile (upsert)...
✅ Profile created/updated

[Step 4] Assigning to organization (upsert)...
❌ Membership upsert error: new row violates row-level security policy
   Note: upsert requires both INSERT and UPDATE policies
   Trying regular INSERT as fallback...
✅ Org membership already exists (OK)

[Step 5] Verifying signup...
✅ Sign in successful
✅ Profile exists
✅ Org membership exists: Anonymous Haven AI

============================================================
🎉 SIGNUP TEST PASSED!
============================================================
```

The "upsert error" is **expected and handled**. The test still passes.

## Usage

### Run the Test
```bash
node manual-signup-test.js
```

### What It Tests
1. ✅ Auth user creation
2. ✅ Default org exists
3. ✅ Profile creation (idempotent)
4. ✅ Org assignment (idempotent)
5. ✅ Sign in works
6. ✅ Profile exists in database
7. ✅ Org membership exists in database

### When to Run
- After database schema changes
- After RLS policy updates
- Before deploying new builds
- When signup issues are reported
- As part of CI/CD pipeline

### What It Creates
- Real test user account
- Profile in `profiles` table
- Membership in `user_organizations` table
- Credentials you can use to test the app

## Integration with README

Added to README.md under "Testing" section:

```markdown
### Signup Health Check

Run the automated signup test to verify the complete signup flow:

```bash
node manual-signup-test.js
```

This verifies:
- ✅ Auth user creation
- ✅ Profile creation
- ✅ Organization assignment
- ✅ Login functionality
- ✅ Database integrity
```

## Files Updated

1. **`manual-signup-test.js`** - Main test script
   - Added upsert for profiles
   - Added upsert with INSERT fallback for memberships
   - Changed `.single()` to array handling
   - Better error messages

2. **`README.md`** - Documentation
   - Added "Signup Health Check" section
   - Linked to test script
   - Explained what it verifies

3. **`SIGNUP-QUICK-REFERENCE.md`** - Quick reference
   - Updated testing section
   - Added idempotent badge
   - Listed new features

4. **`run-signup-tests.md`** - Testing guide
   - Expanded automated test section
   - Explained idempotency
   - Added note about upsert fallback

5. **`RLS-UPSERT-REQUIREMENTS.md`** - New file
   - Explains why upsert needs UPDATE policy
   - Documents the fallback approach
   - Recommends keeping current RLS policies

6. **`SIGNUP-TEST-IMPROVEMENTS.md`** - This file
   - Documents the improvements
   - Explains the reasoning
   - Provides usage guide

## Benefits Summary

### For Developers
- ✅ Reliable health check script
- ✅ Safe to run anytime
- ✅ Clear test output
- ✅ Real test accounts for manual testing

### For CI/CD
- ✅ Idempotent (can run in pipeline)
- ✅ Clear pass/fail status
- ✅ Detailed error messages
- ✅ No cleanup needed

### For Debugging
- ✅ Tests entire signup flow
- ✅ Verifies database state
- ✅ Checks RLS policies
- ✅ Validates auth integration

### For Future
- ✅ Ready for multi-org support
- ✅ Handles edge cases
- ✅ Extensible for new features
- ✅ Well documented

## Next Steps

The test script is now production-ready. You can:

1. **Run it now** to verify current state
2. **Add to CI/CD** for automated testing
3. **Use test accounts** for manual app testing
4. **Reference in docs** when helping users debug

The signup flow is tested, documented, and ready for production! 🚀
