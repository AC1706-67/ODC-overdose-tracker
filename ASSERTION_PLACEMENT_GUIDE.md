# Where to Place logger.assert() - Practical Guide

## The Golden Rule

**Assert early, fail fast.** Place assertions at the **start** of functions, before any work is done.

---

## 1. Guard Function Preconditions

### ✅ DO: Assert at the top of functions

```typescript
async function createIncident(
  data: IncidentData,
  orgId: string,
  userId: string,
) {
  const logger = createLogger('IncidentService');

  // Assert preconditions FIRST
  logger.assert(orgId !== undefined, 'Organization ID is required');
  logger.assert(userId !== undefined, 'User ID is required');
  logger.assert(data.zip_code !== undefined, 'Zip code is required');
  logger.assert(data.zip_code.length === 5, 'Zip code must be 5 digits', {
    zip: data.zip_code,
  });

  // Now do the work
  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({ ...data, organization_id: orgId, created_by: userId });

  return incident;
}
```

### ❌ DON'T: Assert after work is done

```typescript
async function createIncident(
  data: IncidentData,
  orgId: string,
  userId: string,
) {
  // BAD: Work happens first
  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({ ...data, organization_id: orgId, created_by: userId });

  // TOO LATE: Bug already happened
  logger.assert(orgId !== undefined, 'Organization ID is required');

  return incident;
}
```

---

## 2. Validate Context Values Before Use

### ✅ DO: Assert org/user context before dependent calls

```typescript
async function loadDashboardData() {
  const logger = createLogger('Dashboard');
  const { activeOrg } = useOrg();
  const { user } = useAuth();

  // Assert context is valid BEFORE using it
  logger.assert(activeOrg !== null, 'Active organization required');
  logger.assert(activeOrg.id !== undefined, 'Organization ID required');
  logger.assert(user !== null, 'User must be authenticated');

  // Safe to use now
  const { data } = await supabase
    .from('incidents')
    .select('*')
    .eq('organization_id', activeOrg.id);

  return data;
}
```

### ❌ DON'T: Use context without checking

```typescript
async function loadDashboardData() {
  const { activeOrg } = useOrg();

  // BAD: activeOrg might be null!
  const { data } = await supabase
    .from('incidents')
    .select('*')
    .eq('organization_id', activeOrg.id); // 💥 Crash if activeOrg is null

  return data;
}
```

---

## 3. Real Examples from Your Codebase

### Example 1: OrgContext (Already Good!)

```typescript
// src/context/OrgContext.tsx
const loadOrgData = async (orgId: string) => {
  const logger = createLogger('OrgContext');

  // ADD THIS: Assert precondition
  logger.assert(orgId !== undefined, 'Organization ID is required');
  logger.assert(orgId.length > 0, 'Organization ID cannot be empty');

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, slug, name, is_active')
      .eq('id', orgId)
      .single();

    if (error) throw error;
    setActiveOrg(data);
  } catch (error) {
    logger.error('Failed to load org data', error);
    setActiveOrg(null);
  }
};
```

### Example 2: Login Screen

```typescript
// app/login.tsx
async function signIn() {
  const logger = createLogger('LoginScreen');

  // Assert input validation BEFORE API call
  logger.assert(email.length > 0, 'Email is required');
  logger.assert(email.includes('@'), 'Email must be valid', { email });
  logger.assert(password.length >= 6, 'Password must be at least 6 characters');

  logger.action('Sign in attempt', { email });

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logger.error('Sign in failed', error);
    return;
  }

  logger.info('Sign in successful');
}
```

### Example 3: Dashboard Data Hook

```typescript
// hooks/useDashboardData.ts
export function useDashboardData() {
  const logger = createLogger('useDashboardData');
  const { activeOrg } = useOrg();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      // Assert context BEFORE fetching
      logger.assert(
        activeOrg !== null,
        'Active organization required for dashboard',
      );
      logger.assert(activeOrg.id !== undefined, 'Organization ID required');

      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('organization_id', activeOrg.id);

      setData(incidents);
    }

    if (activeOrg) {
      fetchData();
    }
  }, [activeOrg]);

  return data;
}
```

### Example 4: API Service

```typescript
// src/api/incidents.ts
export async function createIncident(
  data: IncidentData,
  orgId: string,
  userId: string,
) {
  const logger = createLogger('IncidentAPI');

  // Assert all required parameters
  logger.assert(data !== null, 'Incident data is required');
  logger.assert(orgId !== undefined, 'Organization ID is required');
  logger.assert(userId !== undefined, 'User ID is required');

  // Assert data structure
  logger.assert(data.zip_code !== undefined, 'Zip code is required');
  logger.assert(data.incident_date !== undefined, 'Incident date is required');
  logger.assert(data.outcome !== undefined, 'Outcome is required');

  // Assert data validity
  logger.assert(data.zip_code.length === 5, 'Zip code must be 5 digits', {
    zip: data.zip_code,
  });

  logger.api('POST', '/incidents', { orgId, userId });

  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({
      ...data,
      organization_id: orgId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create incident', error);
    throw error;
  }

  logger.info('Incident created successfully', { id: incident.id });
  return incident;
}
```

---

## 4. Common Assertion Patterns

### Pattern 1: Required IDs

```typescript
logger.assert(userId !== undefined, 'User ID is required');
logger.assert(orgId !== undefined, 'Organization ID is required');
logger.assert(incidentId !== undefined, 'Incident ID is required');
```

### Pattern 2: Valid Formats

```typescript
logger.assert(email.includes('@'), 'Email must be valid', { email });
logger.assert(zipCode.length === 5, 'Zip code must be 5 digits', { zipCode });
logger.assert(phone.match(/^\d{10}$/), 'Phone must be 10 digits', { phone });
```

### Pattern 3: Non-null Objects

```typescript
logger.assert(user !== null, 'User must be authenticated');
logger.assert(activeOrg !== null, 'Active organization required');
logger.assert(data !== null, 'Data cannot be null');
```

### Pattern 4: Array/Collection Checks

```typescript
logger.assert(items.length > 0, 'Items array cannot be empty');
logger.assert(Array.isArray(items), 'Items must be an array');
```

### Pattern 5: Enum/Status Checks

```typescript
logger.assert(
  ['survived', 'deceased'].includes(outcome),
  'Invalid outcome value',
  { outcome },
);
```

---

## 5. Assertion Checklist

Before writing any function, ask:

- [ ] **What IDs do I need?** → Assert they exist
- [ ] **What context do I need?** → Assert it's loaded
- [ ] **What format must inputs be?** → Assert format is valid
- [ ] **What can't be null?** → Assert not null
- [ ] **What ranges are valid?** → Assert within range

---

## 6. Quick Reference: Where to Assert

| Location                | What to Assert      | Example                                             |
| ----------------------- | ------------------- | --------------------------------------------------- |
| **Function start**      | Required parameters | `logger.assert(id !== undefined, 'ID required')`    |
| **Before API calls**    | Context values      | `logger.assert(orgId !== null, 'Org required')`     |
| **After user input**    | Input format        | `logger.assert(email.includes('@'), 'Valid email')` |
| **Before database ops** | Data structure      | `logger.assert(data.zip_code, 'Zip required')`      |
| **In hooks**            | Dependencies loaded | `logger.assert(user !== null, 'User required')`     |

---

## 7. Benefits You'll See

1. **Bugs caught in development** - Assertions throw errors immediately
2. **Clear error messages** - Know exactly what's wrong
3. **Faster debugging** - No more "undefined is not an object"
4. **Better code quality** - Forces you to think about edge cases
5. **Self-documenting** - Assertions show what's required

---

## 8. Migration Strategy

### Week 1: Add to new code

- All new functions get assertions
- Use the patterns above

### Week 2: Add to critical paths

- Authentication flows
- Data creation/updates
- Payment/billing (if any)

### Week 3: Add to common bugs

- Places where you've seen crashes
- Functions with null/undefined errors
- Complex data transformations

### Week 4: Systematic refactor

- Go through each file
- Add assertions to all functions
- Test thoroughly

---

## Remember

**Assertions are free in production** (they're stripped out), but **invaluable in development**. When in doubt, add an assertion!

The best time to add assertions is **right now**, before the bug happens. 🐛🚫
