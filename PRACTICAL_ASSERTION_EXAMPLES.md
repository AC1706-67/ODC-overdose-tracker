# Practical Assertion Examples - Where to Add Them

## ⚡ Quick Answer: Assertions Run IN Your Code

**You don't "run" assertions separately.** They execute automatically when your code runs during development.

Think of them like this:
- ✅ **Development**: Assertions throw errors if conditions fail → You catch bugs early
- ✅ **Production**: Assertions are silent (or logged) → No performance impact

---

## 🎯 Real Examples from YOUR Codebase

### Example 1: Incident Form Submission

**File**: `app/(tabs)/index.tsx` (or wherever you create incidents)

```typescript
import { createLogger } from '@/src/utils/logger';
import { requireAuthAndOrg } from '@/src/utils/auth';
import { isZipCode, isNonEmptyString } from '@/src/utils/validation';

const logger = createLogger('IncidentForm');

async function handleSubmitIncident() {
  const { activeOrg } = useOrg();
  const { user } = useAuth();
  
  // 1. Validate auth context FIRST
  const { userId, orgId } = requireAuthAndOrg({
    userId: user?.id,
    orgId: activeOrg?.id,
  });
  // ☝️ This throws if userId or orgId is missing!
  
  // 2. Validate form data
  logger.assert(
    isNonEmptyString(zipCode),
    'Zip code is required',
    { zipCode }
  );
  
  logger.assert(
    isZipCode(zipCode),
    'Zip code must be 5 digits',
    { zipCode }
  );
  
  logger.assert(
    outcome === 'survived' || outcome === 'deceased',
    'Invalid outcome value',
    { outcome }
  );
  
  // 3. Now safe to submit
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      organization_id: orgId,
      created_by: userId,
      zip_code: zipCode,
      outcome,
      incident_date: new Date().toISOString(),
    });
  
  // 4. Validate response
  logger.assert(!error, 'Failed to create incident', { error });
  logger.assert(data?.id, 'Incident ID not returned');
  
  logger.info('Incident created successfully', { id: data.id });
}
```

**When does this run?** → When the user clicks "Submit" button!

---

### Example 2: Outreach Log Submission

**File**: `app/(tabs)/distribution.tsx`

```typescript
import { createLogger } from '@/src/utils/logger';
import { requireAuthAndOrg } from '@/src/utils/auth';
import { isZipCode, isNonNegativeInteger } from '@/src/utils/validation';

const logger = createLogger('OutreachForm');

async function handleSubmitOutreach() {
  const { activeOrg } = useOrg();
  const { user } = useAuth();
  
  // 1. Auth check
  const { userId, orgId } = requireAuthAndOrg({
    userId: user?.id,
    orgId: activeOrg?.id,
  });
  
  // 2. Validate inputs
  logger.assert(
    isZipCode(zipCode.trim()),
    'Invalid zip code format',
    { zipCode }
  );
  
  logger.assert(
    isNonNegativeInteger(kitCount),
    'Kit count must be a non-negative number',
    { kitCount }
  );
  
  logger.assert(
    isNonNegativeInteger(peopleReached),
    'People reached must be a non-negative number',
    { peopleReached }
  );
  
  // 3. Submit
  const { data, error } = await supabase
    .from('outreach_logs')
    .insert({
      organization_id: orgId,
      created_by: userId,
      zip_code: zipCode.trim(),
      num_kits: kitCount,
      people_reached: peopleReached,
      outreach_date: new Date().toISOString(),
    });
  
  logger.assert(!error, 'Failed to create outreach log', { error });
  logger.info('Outreach log created', { id: data?.id });
}
```

**When does this run?** → When the user submits the outreach form!

---

### Example 3: Dashboard Data Loading

**File**: `hooks/useDashboardData.ts`

```typescript
import { createLogger } from '@/src/utils/logger';
import { requireOrg } from '@/src/utils/auth';

const logger = createLogger('useDashboardData');

export function useDashboardData() {
  const { activeOrg } = useOrg();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Validate org context before querying
        const orgId = requireOrg({ orgId: activeOrg?.id });
        
        logger.info('Fetching dashboard data', { orgId });
        
        const { data: incidents, error } = await supabase
          .from('incidents')
          .select('*')
          .eq('organization_id', orgId);
        
        logger.assert(!error, 'Failed to fetch incidents', { error });
        logger.assert(Array.isArray(incidents), 'Incidents is not an array');
        
        setData(incidents);
      } catch (error) {
        logger.error('Dashboard data fetch failed', error as Error);
      } finally {
        setLoading(false);
      }
    }
    
    if (activeOrg) {
      fetchData();
    }
  }, [activeOrg]);
  
  return { data, loading };
}
```

**When does this run?** → When the dashboard screen loads!

---

### Example 4: Settings Page (Already Has Logging!)

**File**: `app/(tabs)/settings.tsx`

**Add these assertions:**

```typescript
import { createLogger } from '@/src/utils/logger';
import { requireAuth } from '@/src/utils/auth';

const logger = createLogger('SettingsScreen');

const loadUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // ADD THIS: Validate user before proceeding
    const userId = requireAuth({ userId: user?.id });
    
    logger.info('Loading user profile', { userId });
    
    const { data: membership, error } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations (name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error || !membership) {
      logger.warn('No membership found, using defaults');
      setUserRole('Peer');
      setOrgName('Recovery Alliance of El Paso');
      return;
    }
    
    // ADD THIS: Validate membership structure
    logger.assert(
      membership.role !== undefined,
      'Membership missing role'
    );
    
    const formattedRole = membership.role 
      ? membership.role.charAt(0).toUpperCase() + membership.role.slice(1)
      : 'Peer';
    setUserRole(formattedRole);
    
    const orgData = membership.organizations as any;
    setOrgName(orgData?.name || 'Recovery Alliance of El Paso');
    
  } catch (error) {
    logger.error('Failed to load user profile', error as Error);
    setUserRole('Peer');
    setOrgName('Recovery Alliance of El Paso');
  }
};
```

**When does this run?** → When the Settings screen loads!

---

## 🔧 Step-by-Step: Adding Assertions to Existing Code

### Step 1: Import the utilities
```typescript
import { createLogger } from '@/src/utils/logger';
import { requireAuthAndOrg } from '@/src/utils/auth';
import { isZipCode, isNonEmptyString } from '@/src/utils/validation';
```

### Step 2: Create a logger
```typescript
const logger = createLogger('YourComponent');
```

### Step 3: Add assertions at function start
```typescript
async function yourFunction() {
  // Validate context
  const { userId, orgId } = requireAuthAndOrg({ userId, orgId });
  
  // Validate inputs
  logger.assert(data !== null, 'Data is required');
  
  // Do work...
}
```

### Step 4: Test it!
- Run your app in development
- Try to trigger the function with invalid data
- The assertion should throw an error with a clear message

---

## 📱 Where to Add Assertions in Your App

### Priority 1: Data Submission (HIGH IMPACT)
- [ ] `app/(tabs)/index.tsx` - Incident form submission
- [ ] `app/(tabs)/distribution.tsx` - Outreach form submission
- [ ] Any other forms that write to database

### Priority 2: Data Loading (MEDIUM IMPACT)
- [ ] `hooks/useDashboardData.ts` - Dashboard data fetching
- [ ] `hooks/useOrgDashboard.ts` - Org dashboard data
- [ ] `src/context/OrgContext.tsx` - Organization loading

### Priority 3: Authentication (HIGH IMPACT)
- [ ] `app/login.tsx` - Login validation
- [ ] `app/signup.tsx` - Signup validation
- [ ] `app/_layout.tsx` - Auth routing

---

## 🎬 Example: Adding to Incident Form (Step by Step)

### Before (No Assertions)
```typescript
async function submitIncident() {
  const { data } = await supabase
    .from('incidents')
    .insert({
      organization_id: activeOrg.id, // 💥 Might be undefined!
      created_by: user.id,            // 💥 Might be undefined!
      zip_code: zipCode,              // 💥 Might be invalid!
    });
}
```

### After (With Assertions)
```typescript
import { createLogger } from '@/src/utils/logger';
import { requireAuthAndOrg } from '@/src/utils/auth';
import { isZipCode } from '@/src/utils/validation';

const logger = createLogger('IncidentForm');

async function submitIncident() {
  // 1. Validate auth (throws if invalid)
  const { userId, orgId } = requireAuthAndOrg({
    userId: user?.id,
    orgId: activeOrg?.id,
  });
  
  // 2. Validate input (throws if invalid)
  logger.assert(isZipCode(zipCode), 'Invalid zip code', { zipCode });
  
  // 3. Now safe to submit
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      organization_id: orgId,  // ✅ Guaranteed valid
      created_by: userId,       // ✅ Guaranteed valid
      zip_code: zipCode,        // ✅ Guaranteed valid
    });
  
  // 4. Validate response
  logger.assert(!error, 'Failed to create incident', { error });
  logger.assert(data?.id, 'No incident ID returned');
  
  return data;
}
```

---

## 🚀 Quick Start Checklist

To add assertions to your app TODAY:

1. [ ] Copy `src/utils/validation.ts` (already created)
2. [ ] Copy `src/utils/auth.ts` (already created)
3. [ ] Pick ONE form (incident or outreach)
4. [ ] Add `requireAuthAndOrg` at the start
5. [ ] Add input validation assertions
6. [ ] Test by submitting with invalid data
7. [ ] See the assertion error in console
8. [ ] Fix the validation in your UI
9. [ ] Repeat for other forms!

---

## 💡 Remember

**Assertions run automatically in your code during development.**

They're like having a co-pilot that yells "STOP!" when something's wrong, before it causes a crash.

No separate "running" needed - just add them to your code and they work! 🎉
