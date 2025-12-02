# Why Dashboard and Outreach Tabs Were Missing

## Problem Summary

You could log in successfully and see your Admin role + organization, but only the **Incidents** and **Settings** tabs appeared. The **Dashboard** and **Outreach** tabs were missing.

## Root Causes

### 1. Tab Visibility Logic Was Too Strict

**File:** `app/(tabs)/_layout.tsx`

**The Problem:**

```typescript
const hasOrg = !loading && (status === 'ready' || (activeOrg && activeOrg.id));
```

This logic required BOTH conditions:

- `status === 'ready'` OR
- `activeOrg && activeOrg.id`

But the `status` check was failing even when `activeOrg` existed, causing `hasOrg` to be `false`.

**The Fix:**

```typescript
const hasOrg = !loading && activeOrg && activeOrg.id;
```

Simplified to just check: "Do we have an activeOrg with an ID?" This is more reliable.

### 2. RLS Policies Didn't Distinguish Admin vs Regular Users

**File:** Supabase `outreach_logs` table policies

**The Problem:**
The original RLS policies only checked if a user belonged to an organization. They didn't give admins permission to see ALL logs for their organization - everyone could only see their own logs (`created_by = auth.uid()`).

**The Fix:**
Created role-aware policies:

- **Admins/Managers/Owners** → See ALL outreach logs for their organization
- **Responders/Viewers** → See only their own logs

This matches the expected behavior where admins have full visibility into their org's data.

## Changes Made

### Frontend Change

**File:** `app/(tabs)/_layout.tsx`

**Before:**

```typescript
const hasOrg = !loading && (status === 'ready' || (activeOrg && activeOrg.id));
```

**After:**

```typescript
const hasOrg = !loading && activeOrg && activeOrg.id;
```

**Impact:** Dashboard and Outreach tabs now appear when user has an organization.

### Backend Changes

**File:** `fix-rls-admin-access.sql` (run in Supabase)

**New Policies:**

1. **admin_view_all_org_outreach** - Admins/Managers/Supervisors/Owners see ALL logs for their org
2. **user_view_own_outreach** - Regular users see only their own logs
3. **org_member_insert_outreach** - Any org member can create logs
4. **admin_update_org_outreach** - Admins update any, users update own
5. **admin_delete_outreach** - Only admins can delete logs

**Impact:** As an Admin, you now see ALL outreach logs for Recovery Alliance of El Paso, not just ones you personally created.

## How to Apply the Fix

### Step 1: Frontend (Already Done)

The tab layout fix is already applied in the code. You'll need to rebuild the APK.

### Step 2: Backend (Run in Supabase)

1. Go to Supabase SQL Editor
2. Run `fix-rls-admin-access.sql`
3. Verify policies with the verification query at the bottom

### Step 3: Test

1. Install new APK
2. Login as achavez@recoveryalliance.net (Admin)
3. You should now see:
   - ✅ Incidents tab (report form)
   - ✅ Outreach tab (submit outreach logs)
   - ✅ Dashboard tab (view analytics and data)
   - ✅ Settings tab

## Why This Happened

The app was designed with conditional tab visibility to support:

- Users without organizations (only see Incidents + Settings)
- Users with organizations (see all tabs)
- Organizations with/without outreach enabled

The logic was overly complex and the `status` check was unreliable. The simplified version just checks "does activeOrg exist?" which is more straightforward and reliable.

The RLS policies were initially set up for basic multi-tenancy (org isolation) but didn't account for role-based permissions within an organization.
