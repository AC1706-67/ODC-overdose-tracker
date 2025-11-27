# RLS Harmonization & ZIP Sharing Prep - Complete Summary

## Overview

This migration harmonizes all RLS policies to a consistent per-organization access pattern and prepares the system for future opt-in ZIP-level incident sharing.

## Changes Made

### 1. Database Schema Changes

#### New Columns on `organizations` Table

```sql
-- Opt-in ZIP sharing (default: false, not active yet)
share_incidents_zip_only boolean NOT NULL DEFAULT false

-- Demo organization flag
is_demo_organization boolean NOT NULL DEFAULT false
```

### 2. RLS Policy Harmonization

All multi-tenant tables now follow this consistent pattern:

#### Pattern for SELECT
```sql
EXISTS (
  SELECT 1
  FROM public.user_organizations uo
  WHERE uo.user_id = auth.uid()
    AND uo.organization_id = <table>.organization_id
    AND COALESCE(uo.is_active, true) = true
)
```

#### Pattern for INSERT
```sql
EXISTS (
  SELECT 1
  FROM public.user_organizations uo
  WHERE uo.user_id = auth.uid()
    AND uo.organization_id = <table>.organization_id
    AND COALESCE(uo.is_active, true) = true
)
```

#### Pattern for UPDATE
```sql
<table>.created_by = auth.uid()  -- Creator can always update
OR EXISTS (
  SELECT 1
  FROM public.user_organizations uo
  WHERE uo.user_id = auth.uid()
    AND uo.organization_id = <table>.organization_id
    AND COALESCE(uo.is_active, true) = true
)
```

#### Pattern for DELETE
```sql
EXISTS (
  SELECT 1
  FROM public.user_organizations uo
  WHERE uo.user_id = auth.uid()
    AND uo.organization_id = <table>.organization_id
    AND uo.role IN ('Admin', 'Owner')
    AND COALESCE(uo.is_active, true) = true
)
```

### 3. Tables Updated

#### ✅ incidents
- **Old policies:** Mixed anonymous/authenticated, role-based filtering
- **New policies:** Pure per-org access via user_organizations
- **Policies created:**
  - `org_members_select_incidents`
  - `org_members_insert_incidents`
  - `org_members_update_incidents`
  - `org_admins_delete_incidents`

#### ✅ outreach_logs
- **Old policies:** Mixed anonymous/authenticated, role-based filtering
- **New policies:** Pure per-org access via user_organizations
- **Policies created:**
  - `org_members_select_outreach_logs`
  - `org_members_insert_outreach_logs`
  - `org_members_update_outreach_logs`
  - `org_admins_delete_outreach_logs`

#### ✅ distributions (if exists)
- **Old policies:** Mixed anonymous/authenticated, role-based filtering
- **New policies:** Pure per-org access via user_organizations
- **Policies created:**
  - `org_members_select_distributions`
  - `org_members_insert_distributions`
  - `org_members_update_distributions`
  - `org_admins_delete_distributions`

### 4. New View: incident_zip_aggregate

```sql
CREATE VIEW public.incident_zip_aggregate AS
SELECT
  i.zip_code,
  date_trunc('day', COALESCE(i.occurred_at, i.created_at)) AS day,
  count(*) AS total_incidents
FROM public.incidents i
JOIN public.organizations o ON o.id = i.organization_id
WHERE o.share_incidents_zip_only = true
  AND i.zip_code IS NOT NULL
GROUP BY i.zip_code, date_trunc('day', COALESCE(i.occurred_at, i.created_at));
```

**Purpose:** Anonymous ZIP-level incident counts for cross-org analytics
**Access:** service_role only (not exposed to frontend yet)
**Data included:** ZIP code, day, count only
**Data excluded:** org IDs, user IDs, names, addresses, demographics

### 5. Demo Organization

Created "Anonymous Haven – Tester Organization":
- `slug`: anonymous-haven-tester
- `is_demo_organization`: true
- `is_certified`: true
- `is_public`: true
- `outreach_enabled`: true
- `share_incidents_zip_only`: false

**Auto-assignment:** New users are automatically assigned to this demo org with role 'Tester'

### 6. Frontend Changes

#### Updated Files

**app/onboarding/select-org.tsx**
- Added `is_demo_organization` to type definition
- Shows purple "Demo" badge for demo organizations
- Displays explanation text: "Use this organization to test the app before going live."
- Demo orgs appear first in the list

**src/api/orgMembership.ts**
- Updated `getJoinableCertifiedOrganizations()` to fetch `is_demo_organization`
- Sorts demo orgs first, then alphabetically

**hooks/useDashboardData.ts**
- Added `organizationId` parameter to filter dashboard data by org
- Ensures all queries include `organization_id` filter when provided

**hooks/useIncidentStorage.ts**
- Already correctly uses `activeOrgId` when syncing incidents ✅
- Includes `organization_id` in all inserts ✅

**src/api/enhancedOutreach.ts**
- Already requires `organization_id` in submissions ✅
- `getTeamMembers()` filters by `organization_id` ✅

**src/api/teamDashboard.ts**
- Already filters by `activeOrgId` ✅

## Current Behavior (After Migration)

### ✅ Per-Organization Isolation
- Users can only see/modify data for organizations they belong to
- No cross-org visibility in the app
- RLS enforced at database level

### ✅ Demo Organization
- New users auto-assigned to demo org
- Demo org clearly labeled in UI
- Follows same RLS rules as all other orgs

### ❌ ZIP Sharing (Not Active Yet)
- `share_incidents_zip_only` defaults to false for all orgs
- `incident_zip_aggregate` view exists but not exposed to frontend
- Ready for future backend/service-role API

## Testing Checklist

### Database
- [ ] Run migration: `20251126_harmonize_rls_and_prep_zip_sharing.sql`
- [ ] Verify demo org created
- [ ] Verify new columns exist on organizations table
- [ ] Verify RLS policies updated for incidents, outreach_logs, distributions

### Frontend
- [ ] New user sign-up → auto-assigned to demo org
- [ ] Demo org shows "Demo" badge in org selection
- [ ] Users can only see their own org's data
- [ ] Incidents sync with correct organization_id
- [ ] Outreach logs save with correct organization_id
- [ ] Dashboard filters by organization_id

### Security
- [ ] User A cannot see User B's data (different orgs)
- [ ] User cannot insert data for org they don't belong to
- [ ] Only admins can delete org data
- [ ] incident_zip_aggregate not accessible to authenticated users

## Future: Enabling ZIP Sharing

When ready to enable ZIP-level sharing:

1. **Enable for specific orgs:**
   ```sql
   UPDATE organizations
   SET share_incidents_zip_only = true
   WHERE id = '<org_id>';
   ```

2. **Create backend API endpoint** (service_role):
   ```typescript
   const { data } = await supabase
     .from('incident_zip_aggregate')
     .select('*')
     .eq('zip_code', zipCode)
     .gte('day', startDate)
     .lte('day', endDate);
   ```

3. **Frontend display:**
   - Show aggregated ZIP-level stats
   - No org-specific information
   - Clear labeling: "Community-wide data from participating organizations"

## Rollback Plan

If issues occur:

```sql
-- Revert to old policies (not recommended, but possible)
-- See previous migration files for old policy definitions

-- Remove new columns
ALTER TABLE organizations DROP COLUMN IF EXISTS share_incidents_zip_only;
ALTER TABLE organizations DROP COLUMN IF EXISTS is_demo_organization;

-- Drop new view
DROP VIEW IF EXISTS incident_zip_aggregate;

-- Remove demo org
DELETE FROM organizations WHERE slug = 'anonymous-haven-tester';
```

## Files Modified

### Database
- `supabase/migrations/20251126_harmonize_rls_and_prep_zip_sharing.sql` (NEW)

### Frontend
- `app/onboarding/select-org.tsx` (UPDATED)
- `src/api/orgMembership.ts` (UPDATED)
- `hooks/useDashboardData.ts` (UPDATED)

### Documentation
- `RLS-HARMONIZATION-SUMMARY.md` (NEW - this file)
- `inspect-current-rls.sql` (NEW - inspection script)

## Key Principles

1. **Per-org isolation:** Everything is scoped to organization_id
2. **Consistent RLS:** Same pattern across all tables
3. **No special cases:** Demo org follows same rules as real orgs
4. **Future-ready:** ZIP sharing prepared but not active
5. **Security first:** RLS enforced at database level, not just frontend
