# Frontend Wiring Status - Multi-Tenant Setup

## ✅ What's Already Working

### 1. OrgContext (`src/context/OrgContext.tsx`)
- ✅ **COMPLETE** - Loads user's organization on login
- ✅ Auto-selects if user has only one org
- ✅ Exposes `activeOrgId`, `activeOrg`, `loading`
- ✅ Persists to AsyncStorage
- ✅ Already wrapped in `app/_layout.tsx`

### 2. Outreach/Distribution Screen (`app/(tabs)/distribution.tsx`)
- ✅ **PROPERLY WIRED** - Uses `useOrg()` hook
- ✅ Gets `activeOrgId` from context
- ✅ Passes `organization_id: activeOrgId` to Supabase inserts
- ✅ Has team member and location pickers
- ✅ Properly scoped to current organization

### 3. Dashboard Screens
- ✅ **PROPERLY WIRED** - Uses organization context
- ✅ Filters data by `organization_id`

---

## ❌ What Needs Fixing

### 1. Incidents Screen (`app/(tabs)/index.tsx`)
**Problem**: Uses `useIncidentStorage` hook which hardcodes `organization_id: null`

**Current Code** (hooks/useIncidentStorage.ts, line 95):
```typescript
const { data, error } = await supabase
  .from('incidents')
  .insert({
    zip_code: incident.zip_code,
    gender: incident.gender,
    approx_age: incident.approx_age,
    narcan_used: incident.narcan_used,
    survival: incident.survival,
    organization_id: null, // ❌ WRONG! Bypasses RLS
    client_id: clientId,
  });
```

**What It Should Be**:
```typescript
import { useOrg } from '@/src/context/OrgContext';

// In the hook:
const { activeOrgId } = useOrg();
const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase
  .from('incidents')
  .insert({
    zip_code: incident.zip_code,
    gender: incident.gender,
    approx_age: incident.approx_age,
    narcan_used: incident.narcan_used,
    survival: incident.survival,
    organization_id: activeOrgId, // ✅ Use current org
    created_by: user?.id,          // ✅ Track who created it
    client_id: clientId,
  });
```

---

## 🔧 Required Changes

### Change 1: Fix `useIncidentStorage` Hook

**File**: `hooks/useIncidentStorage.ts`

**Add at top**:
```typescript
import { useOrg } from '@/src/context/OrgContext';
```

**Modify the hook**:
```typescript
export function useIncidentStorage() {
  const { activeOrgId } = useOrg(); // ADD THIS
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  
  // ... rest of code
  
  const syncIncident = async (incident: Incident) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Don't sync if no org or user
      if (!activeOrgId || !user) {
        console.warn('Cannot sync: missing org or user');
        return;
      }
      
      const { data, error } = await supabase
        .from('incidents')
        .insert({
          zip_code: incident.zip_code,
          gender: incident.gender,
          approx_age: incident.approx_age,
          narcan_used: incident.narcan_used,
          survival: incident.survival,
          organization_id: activeOrgId,  // ✅ FIX
          created_by: user.id,            // ✅ ADD
          client_id: clientId,
        });
      
      // ... rest of sync logic
    }
  };
}
```

### Change 2: Add "No Organization" Guard

**File**: `app/(tabs)/index.tsx`

**Add at top of component**:
```typescript
import { useOrg } from '@/src/context/OrgContext';

export default function IncidentScreen() {
  const { activeOrg, loading } = useOrg();
  
  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  // Show "no org" message
  if (!activeOrg) {
    return (
      <View style={styles.container}>
        <View style={styles.noOrgContainer}>
          <AlertCircle size={48} color="#dc2626" />
          <Text style={styles.noOrgTitle}>No Organization</Text>
          <Text style={styles.noOrgText}>
            You are not assigned to any organization yet.
            Please contact your administrator.
          </Text>
        </View>
      </View>
    );
  }
  
  // ... rest of component
}
```

---

## 📋 Summary

### Already Done ✅
1. OrgContext exists and works
2. Outreach screen properly wired
3. Dashboard screens properly wired
4. RLS policies configured in database
5. User authentication working

### Needs Fixing ❌
1. **Incidents hook** - Change `organization_id: null` to `organization_id: activeOrgId`
2. **Incidents hook** - Add `created_by: user.id`
3. **Incidents screen** - Add guard for missing organization

### Estimated Time
- **5 minutes** to fix the hook
- **2 minutes** to add the guard
- **Total: 7 minutes**

---

## 🎯 Testing Checklist

After fixes:
- [ ] Log in as a user with an organization
- [ ] Create an incident - should save with `organization_id`
- [ ] Check Supabase - incident should have correct `organization_id` and `created_by`
- [ ] Log in as different org user - should NOT see other org's incidents
- [ ] Create outreach log - should work (already does)
- [ ] Switch organizations (if user has multiple) - data should filter correctly

---

## 🚀 You're 95% There!

Your backend is solid. Your OrgContext is perfect. Your outreach screen is properly wired.

Just need to fix that one `organization_id: null` line in the incidents hook and you're done!
