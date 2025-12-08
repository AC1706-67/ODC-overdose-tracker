# RLS Requirements for Upsert Operations

## Issue

When using `.upsert()` in Supabase, you need **both INSERT and UPDATE** RLS policies, even if you only intend to insert new rows.

## Current State

### profiles table
✅ Has both INSERT and UPDATE policies (upsert works)

### user_organizations table
❌ Only has INSERT policy (upsert fails, falls back to INSERT)

## Why Upsert Needs UPDATE Policy

Supabase's `upsert()` operation:
1. Tries to INSERT the row
2. If conflict (duplicate key), tries to UPDATE instead
3. Requires UPDATE policy even if no actual update happens

## Current Workaround

The `manual-signup-test.js` script uses a fallback approach:

```javascript
// Try upsert first
const { error: membershipError } = await supabase
  .from('user_organizations')
  .upsert({ ... }, { onConflict: 'user_id,organization_id' });

if (membershipError) {
  // Fall back to regular INSERT
  const { error: insertError } = await supabase
    .from('user_organizations')
    .insert({ ... });
  
  if (insertError && insertError.message.includes('duplicate key')) {
    // Already exists, that's OK
  }
}
```

This works because:
- First signup: INSERT succeeds
- Subsequent runs: INSERT fails with "duplicate key" (expected)
- Test treats duplicate key as success

## Should We Add UPDATE Policy?

### Option 1: Keep Current Approach (Recommended)
- ✅ Simpler RLS policies
- ✅ Users can't modify their org memberships
- ✅ Only admins can change roles/status
- ✅ Test script works with fallback

### Option 2: Add UPDATE Policy
```sql
CREATE POLICY "Users can update their own org memberships"
ON user_organizations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Pros:**
- Upsert works without fallback
- Cleaner test code

**Cons:**
- Users could modify their own role/status
- Security risk if not carefully controlled
- Not needed for actual app functionality

## Recommendation

**Keep current approach** - the fallback in the test script is fine, and it's better to have stricter RLS policies that prevent users from modifying their own org memberships.

The app's signup flow (`app/signup.tsx`) uses regular INSERT, not upsert, so this only affects the test script.

## For Production App

The actual signup flow in `app/signup.tsx` uses:
```typescript
await supabase.from('user_organizations').insert({ ... });
```

This works perfectly with just the INSERT policy. No changes needed.

## Summary

- ✅ Current RLS policies are correct for production
- ✅ Test script has smart fallback for idempotency
- ✅ No security issues
- ❌ Don't add UPDATE policy just to make upsert work in tests
