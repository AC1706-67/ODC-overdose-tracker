# Logout Loop Fix - Complete

## Problem

Users without an organization were being logged out in an infinite loop:

1. User logs in successfully
2. OrgContext loads and finds no organization
3. OrgContext calls `router.replace('/onboarding')`
4. Root layout sees user on non-auth page and redirects to `/login`
5. User logs in again → repeat

## Root Cause

**Mixing auth state with org state in navigation logic**

The OrgContext was trying to handle navigation directly, and the root layout was treating "no org" as "not authenticated".

## Solution

### 1. Added Status to OrgContext

```typescript
export type OrgStatus = 'loading' | 'no-org' | 'ready' | 'error';
```

**Status meanings:**

- `loading` - Still checking if user has an org
- `no-org` - User is authenticated but has no organization
- `ready` - User has an active organization
- `error` - Error loading organization data (network issue, etc.)

### 2. OrgContext No Longer Navigates

**Before:**

```typescript
if (!membership) {
  router.replace('/onboarding'); // ❌ Causes loop
}
```

**After:**

```typescript
if (!membership) {
  setStatus('no-org'); // ✅ Just set status
  setLoading(false);
  return;
}
```

### 3. Centralized Navigation Logic

Created `NavigationController` component in `app/_layout.tsx` that handles ALL routing:

```typescript
// Not logged in → login
if (!session && !inAuth) {
  router.replace('/login');
}

// Logged in but no org → onboarding
if (
  session &&
  (orgStatus === 'no-org' || orgStatus === 'error') &&
  !inOnboarding
) {
  router.replace('/onboarding');
}

// Logged in with org → main app
if (session && orgStatus === 'ready' && inOnboarding) {
  router.replace('/(tabs)');
}
```

## Key Principles

### ✅ Separation of Concerns

- **Auth Context** - Handles login/logout state
- **Org Context** - Handles organization loading state
- **Navigation Controller** - Handles routing based on both states

### ✅ Status Over Actions

- Contexts expose **status** (what state we're in)
- Navigation controller takes **actions** (where to go)

### ✅ Single Source of Truth

- Only `NavigationController` calls `router.replace()`
- No navigation logic scattered across contexts

## Flow Diagrams

### New User Flow

```
1. User signs up
   ↓
2. session = true, orgStatus = 'no-org'
   ↓
3. NavigationController → /onboarding
   ↓
4. User joins/creates org
   ↓
5. orgStatus = 'ready'
   ↓
6. NavigationController → /(tabs)
```

### Existing User Flow

```
1. User logs in
   ↓
2. session = true, orgStatus = 'loading'
   ↓
3. OrgContext loads org from database
   ↓
4. orgStatus = 'ready'
   ↓
5. NavigationController → /(tabs)
```

### Error Handling Flow

```
1. User logs in
   ↓
2. OrgContext fails to load org (network error)
   ↓
3. orgStatus = 'error'
   ↓
4. NavigationController → /onboarding
   ↓
5. User can retry or create new org
```

## Testing

### Test 1: New User Without Org

1. Create new account
2. Should go to onboarding screen
3. Should NOT be logged out
4. Join an org
5. Should go to main app

### Test 2: Existing User With Org

1. Log in with existing account
2. Should load org
3. Should go directly to main app

### Test 3: Network Error

1. Log in
2. Disconnect network during org load
3. Should go to onboarding (not logout)
4. Reconnect network
5. Can retry joining org

## Files Changed

### `src/context/OrgContext.tsx`

- Added `OrgStatus` type
- Added `status` to context
- Removed all `router.replace()` calls
- Set status instead of navigating

### `app/_layout.tsx`

- Created `NavigationController` component
- Centralized all navigation logic
- Uses both `session` and `orgStatus` to decide routing
- Added logging for debugging

## Debug Logging

The NavigationController logs every routing decision:

```
[Navigation] session: true, orgStatus: no-org, segments: login
[Navigation] User needs org, redirecting to onboarding
```

Check console logs to see why navigation is happening.

## Common Issues

### Issue: Still getting logged out

**Check:** Is the onboarding screen registered in the Stack?

```typescript
<Stack.Screen name="onboarding" options={{ headerShown: false }} />
```

### Issue: Stuck on loading screen

**Check:** Is OrgContext setting `loading: false` in all code paths?

### Issue: Goes to onboarding even with org

**Check:** Is the org query returning data? Check console logs.

## Next Steps

1. **Build new APK** with these fixes
2. **Test all three flows** (new user, existing user, error)
3. **Monitor console logs** for any unexpected navigation
4. **Optional:** Add loading spinner while `orgStatus === 'loading'`
