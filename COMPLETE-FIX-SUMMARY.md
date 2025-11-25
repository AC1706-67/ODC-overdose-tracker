# Complete Fix Summary: Sign-Up & Tab Visibility

## 🔴 PROBLEM 1: Sign-Up Database Error

### Symptom
```
"Sign up failed – Database error saving new user"
```

### Root Cause
```sql
-- In trigger function:
role = 'member'  -- ❌ Invalid! Constraint expects 'Admin', 'Responder', 'Peer'
```

### ✅ Solution
```sql
-- Change to:
role = 'Peer'  -- ✅ Valid role value
```

**File to run:** `fix-signup-trigger-role.sql`

---

## 🔴 PROBLEM 2: Missing Outreach & Dashboard Tabs

### Symptom
- User sees only Incidents and Settings tabs
- Even though they're a member of RAEP
- RAEP shows "Member" badge but clicking does nothing

### Root Causes

#### Cause 2A: Existing members can't activate their org
```typescript
// Old behavior:
// User clicks RAEP (already a member)
// → tries to join again
// → Error: "You are already a member"
// → Org never set as active
// → No tabs appear
```

#### Cause 2B: RAEP doesn't have outreach enabled
```sql
-- If outreach_enabled is false or NULL:
SELECT outreach_enabled FROM organizations WHERE slug = 'raep';
-- Result: false or NULL
-- → canUseOutreach() returns false
-- → Outreach tab hidden
```

### ✅ Solutions

#### Solution 2A: Frontend - Handle Existing Memberships
```typescript
// New behavior in select-org.tsx:
if (isMember) {
  // Just activate the org (don't try to join)
  await setActiveOrgId(orgId);
} else {
  // Join first, then activate
  await joinOrganization(orgId, 'Responder');
  await setActiveOrgId(orgId);
}
```

**File updated:** `app/onboarding/select-org.tsx` ✅

#### Solution 2B: Backend - Enable RAEP Outreach
```sql
UPDATE organizations
SET outreach_enabled = true
WHERE slug = 'raep';
```

**File to run:** `verify-raep-outreach-enabled.sql`

---

## 📊 Tab Visibility Logic

### How tabs are shown:
```typescript
// In app/(tabs)/_layout.tsx:

const hasOrg = !loading && activeOrg && activeOrg.id;
const outreachEnabled = hasOrg && canUseOutreach(activeOrg);

// Incidents tab: Always visible ✅
// Settings tab: Always visible ✅
// Dashboard tab: Visible when hasOrg = true
// Outreach tab: Visible when outreachEnabled = true
```

### For tabs to appear, user needs:
1. ✅ Be logged in
2. ✅ Have an active organization set (`activeOrg.id` exists)
3. ✅ For Outreach: org must have `outreach_enabled = true`

---

## 🎯 Complete User Flow (After Fixes)

### New User Sign-Up
```
1. User creates account
   ↓
2. Trigger auto-assigns to Haven AI with role 'Peer' ✅
   ↓
3. User sees onboarding screen
   ↓
4. User can:
   - Join RAEP (if certified)
   - Enter invite code
   - Request org certification
   - Skip for now
```

### Existing RAEP Member Login
```
1. User logs in
   ↓
2. OrgContext loads user's memberships
   ↓
3. Finds RAEP membership
   ↓
4. Loads RAEP org data (with outreach_enabled = true) ✅
   ↓
5. Sets RAEP as activeOrg
   ↓
6. Tabs appear:
   - Incidents ✅
   - Outreach ✅ (because outreach_enabled = true)
   - Dashboard ✅ (because hasOrg = true)
   - Settings ✅
```

### User Selecting RAEP from Org List
```
1. User goes to org selection screen
   ↓
2. Sees RAEP with "Member" badge
   ↓
3. Button says "Select" (not "Join") ✅
   ↓
4. Clicks "Select"
   ↓
5. App checks: isMember = true ✅
   ↓
6. Just sets as active (doesn't try to join) ✅
   ↓
7. Redirects to tabs
   ↓
8. All tabs appear ✅
```

---

## 📝 Checklist for Deployment

### Backend (Supabase SQL)
- [ ] Run `fix-signup-trigger-role.sql`
- [ ] Run `verify-raep-outreach-enabled.sql`
- [ ] Run `test-signup-and-tabs.sql` to verify

### Frontend (Already Done)
- [x] Updated `app/onboarding/select-org.tsx`
- [ ] Build new APK/IPA
- [ ] Deploy to users

### Testing
- [ ] Test new user sign-up (should succeed)
- [ ] Test RAEP member login (should see all tabs)
- [ ] Test org selection with existing membership (should work)
- [ ] Test org selection with new membership (should work)

---

## 🐛 Debugging Tips

### If sign-up still fails:
```sql
-- Check trigger function:
SELECT prosrc FROM pg_proc WHERE proname = 'auto_assign_default_organization';
-- Should contain 'Peer' not 'member'

-- Check role constraint:
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_organizations'::regclass AND conname LIKE '%role%';
```

### If tabs still don't appear:
```typescript
// Add debug logging in app/(tabs)/_layout.tsx:
console.log('[TabLayout] activeOrg:', JSON.stringify(activeOrg));
console.log('[TabLayout] hasOrg:', hasOrg);
console.log('[TabLayout] outreachEnabled:', outreachEnabled);
console.log('[TabLayout] activeOrg.outreach_enabled:', activeOrg?.outreach_enabled);
```

```sql
-- Check RAEP outreach status:
SELECT id, name, slug, outreach_enabled, is_active
FROM organizations
WHERE slug = 'raep';

-- Check user's membership:
SELECT uo.*, o.name, o.outreach_enabled
FROM user_organizations uo
JOIN organizations o ON uo.organization_id = o.id
WHERE uo.user_id = 'USER_ID_HERE';
```

---

## 📚 Related Files

### Analysis & Documentation
- `SIGNUP-AND-TAB-VISIBILITY-FIX.md` - Detailed technical analysis
- `FIX-SIGNUP-AND-TABS-INSTRUCTIONS.md` - Step-by-step instructions
- `COMPLETE-FIX-SUMMARY.md` - This file (executive summary)

### SQL Scripts
- `fix-signup-trigger-role.sql` - Fix the trigger role value
- `verify-raep-outreach-enabled.sql` - Enable RAEP outreach
- `test-signup-and-tabs.sql` - Comprehensive tests

### Code Files Modified
- `app/onboarding/select-org.tsx` - Handle existing memberships ✅

### Reference Files (No changes needed)
- `src/context/OrgContext.tsx` - Org loading logic
- `app/(tabs)/_layout.tsx` - Tab visibility logic
- `src/lib/featureAccess.ts` - Feature access checks
- `src/api/orgMembership.ts` - Org membership API
