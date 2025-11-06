# Frontend-Backend Field Mismatch Analysis

## 🔍 **Issues Found:**

### **1. Date Field Mismatch**
**Files affected:**
- `src/api/teamDashboard.ts` - uses `outreach_date`
- `src/api/enhancedOutreach.ts` - uses `outreach_date`

**Database has:** Both `outreach_date` AND `occurred_at`
**Analytics views use:** `occurred_at` (causing the error)
**Frontend expects:** `outreach_date`

### **2. Team Role Field Missing**
**Files affected:**
- `src/api/enhancedOutreach.ts` - uses `role_in_activity`

**Database missing:** `role_in_activity` column in `outreach_team_members` table
**Frontend expects:** `role_in_activity` field

### **3. Location Type Field Mismatch**
**Files affected:**
- `src/api/enhancedOutreach.ts` - uses `location_type`

**Database has:** `kind` column
**Frontend expects:** `location_type`

## 🛠️ **Required Fixes:**

### **Option A: Fix Database (Recommended)**
Update database to match frontend expectations:

1. **Add missing column:**
   ```sql
   ALTER TABLE outreach_team_members ADD COLUMN role_in_activity text DEFAULT 'volunteer';
   ```

2. **Update analytics views to use `outreach_date`:**
   ```sql
   -- Update all views to use outreach_date instead of occurred_at
   ```

3. **Add location_type alias or update frontend:**
   ```sql
   -- Either add location_type column or update frontend to use 'kind'
   ```

### **Option B: Fix Frontend**
Update frontend to match database schema:

1. **Update `src/api/enhancedOutreach.ts`:**
   - Change `location_type` to `kind`
   - Change `role_in_activity` to match database column name

2. **Update analytics view queries:**
   - Use `occurred_at` instead of `outreach_date`

## 🎯 **Recommendation:**
**Fix the database** (Option A) because:
- Frontend code is more extensive and consistent
- Database changes are simpler
- Less risk of breaking existing functionality