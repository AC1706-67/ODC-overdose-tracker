# Navigation Architecture - Single Source of Truth

## Core Principle

**NavigationController is the ONLY place that calls `router.replace()`**

```
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AuthContext          OrgContext         NavigationController│
│  (auth state)    →    (org state)    →   (routing logic)   │
│                                                             │
│  - session           - status             - router.replace()│
│  - loading           - activeOrg          - ONLY HERE!      │
│                      - loading                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. OrgContext - State Only, No Navigation

```typescript
// ✅ CORRECT - Just manages state
export type OrgStatus = 'loading' | 'no-org' | 'ready' | 'error';

export function OrgProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<OrgStatus>('loading');
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  
  useEffect(() => {
    // Load org from database
    if (noMembership) {
      setStatus('no-org');  // ✅ Just set status
      return;               // ✅ No router.replace()
    }
    
    if (error) {
      setStatus('error');   // ✅ Just set status
      return;               // ✅ No router.replace()
    }
    
    setStatus('ready');     // ✅ Just set status
    setActiveOrg(org);
  }, []);
  
  return (
    <OrgContext.Provider value={{ status, activeOrg, loading }}>
      {children}
    </OrgContext.Provider>
  );
}
```

**Key Points:**
- ❌ NO `import { router } from 'expo-router'`
- ❌ NO `router.replace()` calls
- ✅ ONLY sets `status` state
- ✅ Exposes state for NavigationController to read

### 2. NavigationController - Single Source of Truth

```typescript
function NavigationController() {
  const session = useSession();
  const { status: orgStatus, loading: orgLoading } = useOrg();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (session === undefined || orgLoading) return;
    
    const inAuth = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboarding = segments[0] === 'onboarding';
    
    // ✅ ONLY place that calls router.replace()
    
    // Not logged in → login
    if (!session && !inAuth) {
      router.replace('/login');
      return;
    }
    
    // Logged in but no org → onboarding
    if (session && (orgStatus === 'no-org' || orgStatus === 'error') && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }
    
    // Logged in with org, in onboarding → tabs
    if (session && orgStatus === 'ready' && inOnboarding) {
      router.replace('/(tabs)');
      return;
    }
    
    // Logged in with org, on auth screen → tabs
    if (session && orgStatus === 'ready' && inAuth) {
      router.replace('/(tabs)');
      return;
    }
  }, [session, orgStatus, orgLoading, segments]);

  return null;
}
```

**Key Points:**
- ✅ ONLY place that imports and uses `router`
- ✅ Reads state from both AuthContext and OrgContext
- ✅ Makes ALL routing decisions
- ✅ Comprehensive logging for debugging

### 3. Root Layout - Wraps Everything

```typescript
export default function RootLayout() {
  return (
    <OrgProvider>
      <SafeAreaProvider>
        <NavigationController />  {/* ← Single source of truth */}
        <Stack>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="onboarding" />
          {/* ... */}
        </Stack>
      </SafeAreaProvider>
    </OrgProvider>
  );
}
```

## Decision Table

| Session | Org Status | Current Route | Action |
|---------|-----------|---------------|--------|
| ❌ No   | any       | not /login    | → `/login` |
| ✅ Yes  | `no-org`  | not /onboarding | → `/onboarding` |
| ✅ Yes  | `error`   | not /onboarding | → `/onboarding` |
| ✅ Yes  | `ready`   | /login        | → `/(tabs)` |
| ✅ Yes  | `ready`   | /onboarding   | → `/(tabs)` |
| ✅ Yes  | `ready`   | /(tabs)       | ✅ Stay |

## Why This Fixes the Logout Loop

### Before (Broken)
```
1. User logs in → session = true
2. OrgContext: no org found → router.replace('/onboarding')
3. _layout: sees user on /onboarding, no activeOrg → router.replace('/login')
4. User logs in again → LOOP
```

### After (Fixed)
```
1. User logs in → session = true
2. OrgContext: no org found → status = 'no-org' (no navigation)
3. NavigationController: session + no-org → router.replace('/onboarding')
4. User stays on onboarding ✅
```

## Benefits

### 1. Predictable
- Only ONE place to look for routing logic
- Easy to debug with console logs
- Clear decision tree

### 2. Maintainable
- Add new routes? Update NavigationController only
- Change routing logic? One file to edit
- No scattered `router.replace()` calls

### 3. Testable
- Mock auth and org state
- Test NavigationController in isolation
- Verify routing decisions

### 4. Separation of Concerns
- **AuthContext**: Manages authentication
- **OrgContext**: Manages organization data
- **NavigationController**: Manages routing
- Each does ONE thing well

## Common Mistakes to Avoid

### ❌ DON'T: Navigate from Context
```typescript
// ❌ BAD - in OrgContext
if (!membership) {
  router.replace('/onboarding');  // ❌ NO!
}
```

### ✅ DO: Set Status in Context
```typescript
// ✅ GOOD - in OrgContext
if (!membership) {
  setStatus('no-org');  // ✅ YES!
}
```

### ❌ DON'T: Multiple Navigation Points
```typescript
// ❌ BAD - scattered navigation
// In OrgContext:
router.replace('/onboarding');

// In _layout:
router.replace('/login');

// In some screen:
router.replace('/(tabs)');
```

### ✅ DO: Single Navigation Point
```typescript
// ✅ GOOD - only in NavigationController
function NavigationController() {
  // ALL routing logic here
  router.replace(destination);
}
```

## Debugging

Check console logs to see routing decisions:
```
[Navigation] session: true, orgStatus: no-org, segments: login
[Navigation] User needs org, redirecting to onboarding
```

If you see unexpected navigation:
1. Check the console logs
2. Verify auth and org state
3. Look at NavigationController logic
4. **Never** look in contexts for navigation

## Summary

✅ **OrgContext**: State only, no navigation
✅ **NavigationController**: Single source of truth for routing
✅ **Auth + Org state**: Together decide where user goes
✅ **No logout loop**: Proper separation of concerns

This architecture is clean, maintainable, and prevents the logout loop by design.
