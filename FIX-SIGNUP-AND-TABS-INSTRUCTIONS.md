# Fix Sign-Up and Tab Visibility Issues

## Problems Identified

### Problem 1: Sign-up fails with "Database error saving new user"
**Root Cause:** The database trigger `auto_assign_default_organization()` uses `role = 'member'`, but the `user_organizations.role` column has a constraint that only allows specific values like 'Admin', 'Responder', 'Peer'.

### Problem 2: Outreach and Dashboard tabs don't appear for RAEP members
**Root Causes:**
1. When users are already members of an org, clicking it tries to join again (fails)
2. RAEP organization might not have `outreach_enabled = true`
3. Users who skip onboarding have no active org set

## Solutions Implemented

### ✅ Fix 1: Update Database Trigger (BACKEND)
**File:** `fix-signup-trigger-role.sql`

Run this SQL in your Supabase SQL editor:
```sql
CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id
  FROM public.organizations
  WHERE slug = 'haven-ai'
  LIMIT 1;

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
      'Peer',  -- ✅ Changed from 'member'
      true
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-assigned user % to Haven AI organization', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### ✅ Fix 2: Enable Outreach for RAEP (BACKEND)
**File:** `verify-raep-outreach-enabled.sql`

Run this SQL to ensure RAEP has outreach enabled:
```sql
UPDATE organizations
SET outreach_enabled = true
WHERE slug = 'raep' OR id = '6e892800-0429-442f-bff8-417b4d4ec793';
```

### ✅ Fix 3: Handle Existing Memberships (FRONTEND)
**File:** `app/onboarding/select-org.tsx` ✅ ALREADY UPDATED

Changes made:
- When user clicks an org they're already a member of, it now just sets it as active (doesn't try to join again)
- Button text changes from "Join" to "Select" for existing memberships
- Button color changes to blue for existing memberships (green for new joins)

## Testing Steps

### 1. Test Sign-Up Flow
1. Create a new account with a fresh email
2. Should succeed without "Database error"
3. User should be auto-assigned to Haven AI with role 'Peer'

### 2. Test RAEP Member Tab Visibility
1. Log in as a RAEP member (e.g., achavez@recoveryalliance.net)
2. Should see:
   - ✅ Incidents tab
   - ✅ Outreach tab (if outreach_enabled = true)
   - ✅ Dashboard tab
   - ✅ Settings tab

### 3. Test Org Selection for Existing Members
1. Log in as a RAEP member
2. Go to Settings → Switch Organization (or onboarding screen)
3. RAEP should show "Member" badge
4. Button should say "Select" (not "Join")
5. Clicking "Select" should activate RAEP and show all tabs

### 4. Run Verification SQL
Run `test-signup-and-tabs.sql` to verify all fixes are in place.

## Expected Results After Fixes

### Sign-Up
- ✅ New users can create accounts successfully
- ✅ Auto-assigned to Haven AI with role 'Peer'
- ✅ No database errors

### Tab Visibility
- ✅ Users with active org see Dashboard tab
- ✅ Users in orgs with outreach_enabled see Outreach tab
- ✅ All users see Incidents and Settings tabs

### Org Selection
- ✅ Existing members can select their org to activate it
- ✅ New users can join public certified orgs
- ✅ No errors when clicking orgs user is already member of

## Files Modified

### Frontend (React Native)
- ✅ `app/onboarding/select-org.tsx` - Handle existing memberships

### Backend (SQL Scripts)
- 📄 `fix-signup-trigger-role.sql` - Fix trigger role value
- 📄 `verify-raep-outreach-enabled.sql` - Enable RAEP outreach
- 📄 `test-signup-and-tabs.sql` - Verification tests

### Documentation
- 📄 `SIGNUP-AND-TAB-VISIBILITY-FIX.md` - Detailed analysis
- 📄 `FIX-SIGNUP-AND-TABS-INSTRUCTIONS.md` - This file

## Next Steps

1. **Run SQL fixes** in Supabase:
   - Execute `fix-signup-trigger-role.sql`
   - Execute `verify-raep-outreach-enabled.sql`

2. **Deploy frontend changes**:
   - Frontend code already updated
   - Build and deploy new version

3. **Test thoroughly**:
   - Test new sign-ups
   - Test existing RAEP members
   - Test org selection flow

4. **Verify with SQL**:
   - Run `test-signup-and-tabs.sql`
   - Check all tests pass

## Rollback Plan

If issues occur:

1. **Revert trigger:**
   ```sql
   -- Change back to 'member' if needed (though this will cause sign-up errors)
   -- Better: use 'Responder' or 'Admin' instead
   ```

2. **Disable RAEP outreach:**
   ```sql
   UPDATE organizations
   SET outreach_enabled = false
   WHERE slug = 'raep';
   ```

3. **Revert frontend:**
   - Git revert the changes to `select-org.tsx`
