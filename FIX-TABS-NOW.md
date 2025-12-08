# Fix Missing Tabs - RLS Recursion Issue

## The Problem
Your app shows only 2 tabs (Incidents + Settings) instead of 4 because:
- The `user_organizations` table has a **recursive RLS policy**
- When the app tries to load your org membership, it triggers infinite recursion
- This causes `activeOrg` to be `null`, hiding Dashboard and Outreach tabs

## The Fix (3 Steps)

### Step 1: Check Current Policies (Optional)
Go to Supabase SQL Editor and run `show-current-policies.sql` to see which policy is recursive.

### Step 2: Apply Nuclear Fix
1. Open your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Copy the entire contents of `NUCLEAR-FIX-USER-ORGS-RLS.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This will:
- Delete ALL policies on `user_organizations`
- Create only 2 simple policies with ZERO recursion:
  - `Users can view their org memberships` (SELECT)
  - `Users can join orgs they are assigned to` (INSERT)

### Step 3: Reload Expo Go
1. In Expo Go, shake your device
2. Tap **Reload**
3. Watch the Metro logs

## Expected Result

**Before:**
```
❌ [OrgContext] Error loading memberships: infinite recursion detected
❌ [TabLayout] activeOrg: null
❌ [TabLayout] hasOrg: null
❌ Only 2 tabs visible
```

**After:**
```
✅ [OrgContext] Successfully loaded org: {"id":"...","name":"Recovery Alliance"}
✅ [TabLayout] activeOrg: {...}
✅ [TabLayout] hasOrg: true
✅ [TabLayout] outreachEnabled: true
✅ All 4 tabs visible: Incidents, Outreach, Dashboard, Settings
```

## Why This Works
The nuclear fix removes ALL policies and creates only the absolute minimum needed:
- No subqueries
- No EXISTS clauses
- No references to `user_organizations` within the policies
- Just simple `auth.uid() = user_id` checks

This is the same approach your suggested query uses - it's perfect.
