# Fix User Organization Assignment

## Problem
Your test user doesn't have an organization assigned in the `user_organizations` table, causing `activeOrg` to be null and the Outreach tab to not show.

## Solution Steps

### Step 1: Check Current Status
Run this in Supabase SQL Editor to see which users have organizations:

```sql
-- File: check-user-org-status.sql
SELECT 
  p.email,
  p.id as user_id,
  o.name as org_name,
  o.slug as org_slug,
  uo.role,
  uo.is_active
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
LEFT JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;
```

### Step 2: Assign User to Organization

**Option A: Assign ALL users without an org (Recommended)**
```sql
-- File: assign-user-to-org.sql (OPTION 1)
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT 
  p.id as user_id,
  'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f' as organization_id, -- Anonymous Haven AI
  'Responder' as role,
  true as is_active
FROM profiles p
LEFT JOIN user_organizations uo ON uo.user_id = p.id
WHERE uo.id IS NULL
ON CONFLICT DO NOTHING;
```

**Option B: Assign a specific user by email**
```sql
-- File: assign-user-to-org.sql (OPTION 2)
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
SELECT 
  p.id as user_id,
  'a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f' as organization_id,
  'Admin' as role,  -- Change to 'Responder' or 'Viewer' as needed
  true as is_active
FROM profiles p
WHERE p.email = 'your-email@example.com'  -- CHANGE THIS
ON CONFLICT DO NOTHING;
```

### Step 3: Verify Assignment
```sql
SELECT 
  p.email,
  o.name as org_name,
  uo.role,
  uo.is_active
FROM profiles p
JOIN user_organizations uo ON uo.user_id = p.id
JOIN organizations o ON o.id = uo.organization_id
ORDER BY p.email;
```

## Code Changes Made

### 1. OrgContext Auto-Redirect to Onboarding
Updated `src/context/OrgContext.tsx` to automatically redirect users without an organization to the onboarding flow:

```typescript
// If no membership found, redirect to onboarding
if (!membership?.organization_id) {
  console.log('[OrgContext] Redirecting to onboarding...');
  setLoading(false);
  router.replace('/onboarding');
  return;
}
```

### 2. Onboarding Screens Set Active Org
Updated both onboarding screens to set the active org after joining:

**app/onboarding/select-org.tsx:**
```typescript
// After joining, set active org
await setActiveOrgId(orgId);
```

**app/onboarding/enter-code.tsx:**
```typescript
// After joining with code, set active org
await setActiveOrgId(inviteCode.organization_id);
```

## Testing the Fix

### After Running SQL Assignment:
1. **Log out** of the app completely
2. **Log back in** with your test account
3. The app should now:
   - Load your organization from `user_organizations`
   - Set `activeOrg` properly
   - Show the Outreach tab (if your org has `outreach_enabled = true`)

### If User Still Has No Org:
1. The app will automatically redirect to `/onboarding`
2. User can:
   - Enter an organization code
   - Select from certified organizations
   - Request organization certification
   - Skip for now (but won't see Outreach tab)

## Available Organizations

Check which organizations exist:
```sql
SELECT id, name, slug, is_active 
FROM organizations 
ORDER BY name;
```

The default org used in the scripts:
- **Name:** Anonymous Haven AI
- **ID:** `a5cc0f8b-ee15-48ba-a0b5-0ad7f2b4485f`
- **Slug:** `anonymous-haven-ai`

## Next Steps

1. **Run the SQL** in Supabase to assign your user to an org
2. **Restart the app** (or log out/in)
3. **Verify** the Outreach tab appears
4. **Test onboarding** by creating a new test user without an org

## Files Created/Modified

- ✅ `check-user-org-status.sql` - Diagnostic query
- ✅ `assign-user-to-org.sql` - Fix script
- ✅ `src/context/OrgContext.tsx` - Auto-redirect to onboarding
- ✅ `app/onboarding/select-org.tsx` - Set active org after join
- ✅ `app/onboarding/enter-code.tsx` - Set active org after code entry
