# Sign-Up and Tab Visibility Issues - Analysis & Fixes

## ISSUE 1: "Database error saving new user" during sign-up

### Root Cause

The database trigger `auto_assign_default_organization()` is trying to insert into `user_organizations` with `role = 'member'`, but the `role` column has a constraint that only allows specific capitalized values like 'Admin', 'Responder', 'Peer', etc.

**Location:** `COMPLETE-DEFAULT-ORG-SETUP.sql` line 50

```sql
INSERT INTO public.user_organizations (
  user_id,
  organization_id,
  role,  -- ❌ Using 'member' (lowercase)
  is_active
)
VALUES (
  NEW.id,
  default_org_id,
  'member',  -- ❌ Should be 'Peer' or another valid role
  true
)
```

### Fix

Update the trigger function to use a valid role value. Based on the schema, valid roles appear to be: 'Admin', 'Responder', 'Peer'.

**File:** Need to run SQL to update the trigger function
**Change:** `'member'` → `'Peer'`

---

## ISSUE 2: Outreach Logs and Dashboard tabs not appearing

### Root Cause Analysis

The tab visibility logic in `app/(tabs)/_layout.tsx` has two conditions:

1. **Dashboard tab:** Shows when `hasOrg` is true
2. **Outreach tab:** Shows when `outreachEnabled` is true

```typescript
const hasOrg = !loading && activeOrg && activeOrg.id;
const outreachEnabled = hasOrg && canUseOutreach(activeOrg);
```

The `canUseOutreach()` function checks:

```typescript
export function canUseOutreach(org?: Org | null) {
  return !!org && !!org.id && org.outreach_enabled === true;
}
```

### Why tabs are missing for RAEP members:

**Scenario 1: User selects RAEP from org selection screen**

- `select-org.tsx` calls `joinOrganization()` which inserts into `user_organizations`
- Then calls `setActiveOrgId(orgId)`
- `OrgContext` loads the org data with this query:
  ```typescript
  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug, name, is_active, outreach_enabled')
    .eq('id', membership.organization_id)
    .single();
  ```
- ✅ This SHOULD work if `outreach_enabled = true` in the database

**Scenario 2: User already has RAEP membership (shows "Member" badge)**

- When user clicks on RAEP org with "Member" badge, `handleJoinOrg()` is called
- But `joinOrganization()` throws error: "You are already a member of this organization"
- ❌ The org is never set as active!
- User stays on selection screen or gets error

**Scenario 3: User skips onboarding**

- `skipOnboarding()` sets status to 'skipped'
- `hasOrg` becomes false because `activeOrg` is null
- ❌ No Dashboard or Outreach tabs

### The Real Problem

When a user is already a member of an organization (like RAEP), clicking on it in the selection screen tries to join again, which fails. The code needs to:

1. Detect existing membership
2. Just set it as active (not try to join again)

---

## FIXES

### Fix 1: Update database trigger to use valid role

**SQL to run:**

```sql
CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the Haven AI organization ID
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'haven-ai'
  LIMIT 1;

  -- If Haven AI exists, assign the new user to it
  IF default_org_id IS NOT NULL THEN
    INSERT INTO public.user_organizations (
      user_id,
      organization_id,
      role,
      is_active
    )
    VALUES (
      NEW.id,
      default_org_id,
      'Peer',  -- ✅ Changed from 'member' to 'Peer'
      true
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    RAISE NOTICE 'Auto-assigned user % to Haven AI organization', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Fix 2: Update select-org.tsx to handle existing memberships

The `handleJoinOrg` function should:

- If user is already a member → just set as active org
- If user is not a member → join then set as active

**File:** `app/onboarding/select-org.tsx`

### Fix 3: Verify RAEP has outreach_enabled = true

**SQL to check:**

```sql
SELECT id, name, slug, outreach_enabled, is_active
FROM organizations
WHERE slug = 'raep' OR name ILIKE '%recovery%alliance%el%paso%';
```

If `outreach_enabled` is false or null, run:

```sql
UPDATE organizations
SET outreach_enabled = true
WHERE slug = 'raep' OR id = '6e892800-0429-442f-bff8-417b4d4ec793';
```

---

## Summary

**Problem 1 (Sign-up error):** Trigger uses invalid role 'member' → Fix: Change to 'Peer'

**Problem 2 (Missing tabs):**

- Existing members can't set org as active → Fix: Update select-org.tsx logic
- RAEP might not have outreach_enabled = true → Fix: Update database

**Problem 3 (Member badge but no action):** Clicking org with "Member" badge tries to join again → Fix: Detect membership and just activate
