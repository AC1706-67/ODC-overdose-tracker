# Outreach Feature Access Control

This document explains how the Outreach feature is restricted to specific organizations.

## Overview

The Outreach Log feature is only available to **Recovery Alliance of El Paso** (RAEP). This is enforced at both the frontend (UI) and backend (database) levels.

## Frontend Implementation

### 1. Feature Flag Helper (`src/lib/featureAccess.ts`)

Determines which organizations can access the Outreach feature:

```typescript
import { canUseOutreach } from '@/src/lib/featureAccess';

if (canUseOutreach(activeOrg)) {
  // Show outreach features
}
```

### 2. Enhanced Org Context (`src/context/OrgContext.tsx`)

Now includes full organization data (id, slug, name) instead of just the ID.

```typescript
const { activeOrg, loading } = useOrg();
// activeOrg contains: { id, slug, name, is_active }
```

### 3. Route Guard (`components/RequireOutreach.tsx`)

Wrap any outreach screen/component to restrict access:

```typescript
import { RequireOutreach } from '@/components/RequireOutreach';

export default function OutreachScreen() {
  return (
    <RequireOutreach>
      {/* Your outreach UI here */}
    </RequireOutreach>
  );
}
```

Non-RAEP users will see a message and be redirected to the dashboard.

## Backend Implementation

### RLS Policies (`supabase/migrations/20251108_outreach_feature_access.sql`)

Database-level security ensures only RAEP users can:
- Read outreach_logs
- Write to outreach_logs
- Access related locations and team_members

Even if someone reverse-engineers the API, they cannot access outreach data unless they're in RAEP.

## Setup Instructions

### 1. Run the SQL Migration

In your Supabase SQL Editor, run:
```sql
-- Contents of supabase/migrations/20251108_outreach_feature_access.sql
```

This will:
- Create/update the RAEP organization
- Enable RLS on outreach tables
- Create policies that restrict access to RAEP users only

### 2. Ensure User-Organization Mapping

Make sure users are properly linked to organizations in the `user_organizations` table:

```sql
INSERT INTO user_organizations (user_id, organization_id, is_active)
VALUES (
  'user-uuid-here',
  (SELECT id FROM organizations WHERE slug = 'recovery-alliance-el-paso'),
  true
);
```

### 3. Test Access Control

1. **As RAEP user**: Should see and access outreach features
2. **As non-RAEP user**: Should NOT see outreach tab/features
3. **Direct API access**: Non-RAEP users get zero rows from outreach queries

## Adding More Organizations

To enable outreach for another organization:

1. **Update `src/lib/featureAccess.ts`**:
```typescript
const OUTREACH_ENABLED_ORGS = new Set([
  'recovery-alliance-el-paso',
  'new-org-slug-here', // Add new org
]);
```

2. **Update RLS policies** in the SQL migration to include the new org slug

## Security Notes

- Frontend checks provide UX (hide features)
- Backend RLS provides security (enforce access)
- Both layers work together for defense in depth
- Even with API keys, non-RAEP users cannot access outreach data
