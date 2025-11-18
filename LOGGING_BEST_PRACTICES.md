# Logging & Debugging Best Practices

## Why Logging Matters

Good logging helps you:
- **Debug faster** - See exactly what's happening
- **Catch bugs early** - Assertions fail in development
- **Monitor production** - Track errors in real apps
- **Understand user flow** - See what users actually do

## Your New Logger Utility

Located at `src/utils/logger.ts` - a centralized logging system.

### Basic Usage

```typescript
import { createLogger } from '@/src/utils/logger';

const logger = createLogger('MyComponent');

// Different log levels
logger.debug('Detailed info for debugging');
logger.info('General information');
logger.warn('Something might be wrong');
logger.error('Something is definitely wrong', error);
```

### Advanced Features

#### 1. Assertions (Catch Bugs Early!)
```typescript
const logger = createLogger('UserService');

function updateUser(user: User) {
  // Assert preconditions
  logger.assert(user.id !== undefined, 'User must have an ID', { user });
  logger.assert(user.email.includes('@'), 'Invalid email format', { email: user.email });
  
  // If assertions pass, continue...
  logger.info('Updating user', { userId: user.id });
}
```

#### 2. Performance Timing
```typescript
const logger = createLogger('DatabaseService');

async function fetchData() {
  return await logger.time('Fetch user data', async () => {
    const { data } = await supabase.from('users').select('*');
    return data;
  });
  // Automatically logs: "⏱️ Starting: Fetch user data"
  // Then: "✅ Completed: Fetch user data (duration: 234ms)"
}
```

#### 3. API Call Logging
```typescript
const logger = createLogger('API');

async function createIncident(data: IncidentData) {
  logger.api('POST', '/incidents', { data });
  
  const { data: result, error } = await supabase
    .from('incidents')
    .insert(data);
  
  if (error) {
    logger.error('Failed to create incident', error);
  } else {
    logger.info('Incident created successfully', { id: result.id });
  }
}
```

#### 4. User Action Tracking
```typescript
const logger = createLogger('LoginScreen');

function handleLogin() {
  logger.action('Login button clicked', { email: user.email });
  
  // ... login logic
  
  logger.action('Login successful', { userId: user.id });
}
```

#### 5. Navigation Logging
```typescript
const logger = createLogger('Navigation');

function navigateToProfile(userId: string) {
  logger.navigation('ProfileScreen', { userId });
  router.push(`/profile/${userId}`);
}
```

## Where to Add Logging

### ✅ DO Log:

1. **Critical Operations**
   ```typescript
   logger.info('Creating organization', { orgName });
   logger.info('User authenticated', { userId });
   ```

2. **Error Conditions**
   ```typescript
   logger.error('Failed to load data', error, { userId, orgId });
   ```

3. **State Changes**
   ```typescript
   logger.debug('Organization changed', { from: oldOrg, to: newOrg });
   ```

4. **API Calls**
   ```typescript
   logger.api('GET', '/incidents', { filters });
   ```

5. **Assertions**
   ```typescript
   logger.assert(orgId !== null, 'Organization ID required');
   ```

### ❌ DON'T Log:

1. **Sensitive Data**
   ```typescript
   // BAD
   logger.info('User logged in', { password: user.password });
   
   // GOOD
   logger.info('User logged in', { userId: user.id });
   ```

2. **Inside Tight Loops**
   ```typescript
   // BAD
   items.forEach(item => {
     logger.debug('Processing item', item); // Too verbose!
   });
   
   // GOOD
   logger.debug('Processing items', { count: items.length });
   ```

3. **Redundant Information**
   ```typescript
   // BAD
   logger.info('Starting function');
   logger.info('Function started');
   
   // GOOD
   logger.debug('Processing user data', { userId });
   ```

## Example: Refactoring OrgContext with Better Logging

**Before:**
```typescript
console.log('[OrgContext] Loading org for user:', user.id);
```

**After:**
```typescript
import { createLogger } from '@/src/utils/logger';

const logger = createLogger('OrgContext');

// In your code:
logger.info('Loading organization for user', { userId: user.id });

// With assertions:
logger.assert(user.id !== undefined, 'User ID is required');

// With timing:
const org = await logger.time('Load organization', async () => {
  return await loadOrgData(user.id);
});
```

## Production vs Development

- **Development**: All logs enabled (debug, info, warn, error)
- **Production**: Only errors logged (to avoid performance impact)
- **Override**: Set `EXPO_PUBLIC_SHOW_DIAGNOSTICS=true` to enable logs in production

## Quick Migration Guide

### Step 1: Import the logger
```typescript
import { createLogger } from '@/src/utils/logger';
const logger = createLogger('YourComponent');
```

### Step 2: Replace console.log
```typescript
// Before
console.log('[MyComponent] User logged in:', user);

// After
logger.info('User logged in', { userId: user.id, email: user.email });
```

### Step 3: Add assertions
```typescript
// Add at the start of functions
logger.assert(data !== null, 'Data cannot be null');
logger.assert(orgId !== undefined, 'Organization ID required');
```

### Step 4: Time critical operations
```typescript
// Wrap slow operations
const result = await logger.time('Fetch dashboard data', async () => {
  return await fetchDashboardData();
});
```

## Benefits You'll See

1. **Faster Debugging** - Structured logs are easier to search
2. **Catch Bugs Early** - Assertions fail in development
3. **Better Monitoring** - Track errors in production
4. **Performance Insights** - See which operations are slow
5. **Clean Console** - Prefixed logs are easy to filter

## Next Steps

1. Start using the logger in new code
2. Gradually refactor existing `console.log` statements
3. Add assertions to critical functions
4. Use timing for slow operations
5. Review logs regularly to catch patterns

## Example Files to Update

- `src/context/OrgContext.tsx` - Already has good logging, can enhance with assertions
- `app/login.tsx` - Add user action logging
- `app/signup.tsx` - Add validation assertions
- `hooks/useDashboardData.ts` - Add performance timing
- API calls in `src/api/*` - Add API logging

Happy debugging! 🐛🔍
