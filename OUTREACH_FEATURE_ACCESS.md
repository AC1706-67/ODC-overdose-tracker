# Outreach Feature Access Control

This document explains how the Outreach feature access is controlled.

## Overview

The Outreach Log feature is available to **all active organization members**. Access control is enforced at the database level using Row Level Security (RLS), which automatically isolates data by organization membership.

## Frontend Implementation

### 1. Feature Visibility (`src/lib/featureAccess.ts`)

Simple check - show Outreach tab if user has an active organization:

```typescript
import { canUseOutreach } from '@/src/lib/featureAccess';

const { activeOrg } = useOrg();
const showOutreach = canUseOutreach(activeOrg);

// Returns true if user belongs to any organization
// RLS handles data isolation automatically
```

### 2. Organization Context (`src/context/OrgContext.tsx`)

Provides current organization data:

```typescript
const { activeOrg, loading } = useOrg();
// activeOrg contains: { id, slug, name, is_active }
```

### 3. Tab Visibility (`app/(tabs)/_layout.tsx` and `app/(tabs)/dashboard.tsx`)

Outreach tab is shown/hidden based on organization membership:

```typescript
const outreachEnabled = !loading && canUseOutreach(activeOrg);

// Tab only appears if user has an active organization
```

## Backend Implementation

### RLS Policies (Supabase)

Database-level Row Level Security ensures proper data isolation:

**SELECT Policy**: Users can only see outreach logs from their own organization
```sql
-- Users can read logs from their organization
CREATE POLICY "Users can view org outreach logs"
  ON outreach_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

**INSERT Policy**: Users can create logs for their organization
```sql
-- Users can create logs for their organization
CREATE POLICY "Users can create org outreach logs"
  ON outreach_logs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

**UPDATE/DELETE Policies**: Only creators or admin-level roles can modify logs

### Security Benefits

- **Automatic isolation**: Users only see data from their organization
- **No frontend filtering needed**: Database enforces access control
- **API-safe**: Even with direct API access, users cannot access other orgs' data
- **Multi-tenant ready**: Each organization's data is completely isolated

## How It Works

### User Flow

1. **User signs up** → Joins an organization (via onboarding)
2. **User logs in** → OrgContext loads their organization membership
3. **Outreach tab appears** → If user has active organization
4. **User creates outreach log** → Automatically tagged with their organization_id
5. **User views logs** → Only sees logs from their organization

### Data Isolation Example

```typescript
// User A (Recovery Alliance) creates a log
await supabase.from('outreach_logs').insert({
  organization_id: activeOrgId, // Recovery Alliance ID
  location: 'Downtown',
  // ... other fields
});

// User A queries logs
const { data } = await supabase.from('outreach_logs').select('*');
// Returns only Recovery Alliance logs (RLS filters automatically)

// User B (Anonymous Haven) queries logs
const { data } = await supabase.from('outreach_logs').select('*');
// Returns only Anonymous Haven logs (different organization)
```

### No Cross-Organization Access

Even if User A tries to query User B's organization:
```typescript
const { data } = await supabase
  .from('outreach_logs')
  .select('*')
  .eq('organization_id', 'other-org-id'); // Trying to access another org

// Result: Empty array (RLS blocks access)
```

## Testing Access Control

### Test 1: Verify Tab Visibility
```typescript
// User with organization → Should see Outreach tab
// User without organization → Should NOT see Outreach tab
```

### Test 2: Verify Data Isolation
```sql
-- As User A (Org 1)
SELECT COUNT(*) FROM outreach_logs; -- Returns Org 1 count

-- As User B (Org 2)  
SELECT COUNT(*) FROM outreach_logs; -- Returns Org 2 count (different)
```

### Test 3: Verify Write Protection
```typescript
// Try to create log for different organization
await supabase.from('outreach_logs').insert({
  organization_id: 'other-org-id', // Not user's org
  location: 'Test'
});
// Result: Error - RLS policy violation
```

## Migration Notes

The RLS policies have been cleaned up to:
- Remove legacy organization-specific checks
- Use pure organization membership for access control
- Support any number of organizations automatically
- Provide consistent access patterns across all tables

## Security Summary

✅ **Frontend**: Shows/hides Outreach tab based on organization membership
✅ **Backend**: RLS enforces data isolation at database level  
✅ **Multi-tenant**: Each organization's data is completely isolated
✅ **Scalable**: Works for any number of organizations without code changes
✅ **Secure**: No way to access other organizations' data, even via API
