# RLS Harmonization - Quick Reference

## 🚀 Deploy Steps

### 1. Run Migration

```sql
-- In Supabase SQL Editor, run:
supabase/migrations/20251126_harmonize_rls_and_prep_zip_sharing.sql
```

### 2. Verify

```sql
-- Run verification script:
verify-rls-harmonization.sql

-- Should see all ✅ PASS checks
```

### 3. Test

- Create new user → auto-joins demo org
- Demo org shows purple "Demo" badge
- Users only see their org's data

---

## 📊 What Changed

### Database

- ✅ All RLS policies harmonized to per-org pattern
- ✅ Added `share_incidents_zip_only` column (default: false)
- ✅ Added `is_demo_organization` column
- ✅ Created demo org: "Anonymous Haven – Tester Organization"
- ✅ Created `incident_zip_aggregate` view (not active)

### Frontend

- ✅ Demo orgs show badge and explanation
- ✅ Dashboard filters by organization_id
- ✅ All queries respect org boundaries

---

## 🔒 RLS Pattern (All Tables)

### SELECT

```sql
EXISTS (
  SELECT 1 FROM user_organizations
  WHERE user_id = auth.uid()
    AND organization_id = <table>.organization_id
    AND is_active = true
)
```

### INSERT

```sql
EXISTS (
  SELECT 1 FROM user_organizations
  WHERE user_id = auth.uid()
    AND organization_id = <table>.organization_id
    AND is_active = true
)
```

### UPDATE

```sql
created_by = auth.uid()  -- OR --
EXISTS (SELECT 1 FROM user_organizations WHERE ...)
```

### DELETE

```sql
EXISTS (
  SELECT 1 FROM user_organizations
  WHERE user_id = auth.uid()
    AND organization_id = <table>.organization_id
    AND role IN ('Admin', 'Owner')
    AND is_active = true
)
```

---

## 🎯 Current Behavior

| Feature             | Status        | Notes                                  |
| ------------------- | ------------- | -------------------------------------- |
| Per-org isolation   | ✅ Active     | Users only see their org's data        |
| Demo organization   | ✅ Active     | Auto-assigned to new users             |
| ZIP sharing         | ❌ Not active | Prepared but disabled (default: false) |
| Cross-org analytics | ❌ Not active | View exists but not exposed            |

---

## 🔮 Future: Enable ZIP Sharing

When ready to enable anonymous ZIP-level sharing:

### 1. Enable for specific org

```sql
UPDATE organizations
SET share_incidents_zip_only = true
WHERE id = '<org_id>';
```

### 2. Query aggregated data (backend only)

```typescript
// Service role client only
const { data } = await supabase
  .from('incident_zip_aggregate')
  .select('*')
  .eq('zip_code', '79901')
  .gte('day', '2024-01-01');

// Returns: { zip_code, day, total_incidents }
// No org IDs, user IDs, or identifying info
```

---

## 🐛 Troubleshooting

### Users can't see their data

```sql
-- Check user's org membership
SELECT * FROM user_organizations
WHERE user_id = '<user_id>';

-- Should have is_active = true
```

### Demo org not appearing

```sql
-- Check demo org exists
SELECT * FROM organizations
WHERE is_demo_organization = true;

-- Should be active and certified
```

### RLS policies not working

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('incidents', 'outreach_logs');

-- rowsecurity should be true
```

---

## 📁 Key Files

| File                                                                  | Purpose                  |
| --------------------------------------------------------------------- | ------------------------ |
| `supabase/migrations/20251126_harmonize_rls_and_prep_zip_sharing.sql` | Main migration           |
| `RLS-EXECUTIVE-SUMMARY.md`                                            | Executive overview       |
| `RLS-HARMONIZATION-SUMMARY.md`                                        | Technical details        |
| `verify-rls-harmonization.sql`                                        | Verification script      |
| `inspect-current-rls.sql`                                             | Pre-migration inspection |

---

## ✅ Success Checklist

After deployment:

- [ ] Migration ran successfully
- [ ] Verification script shows all ✅ PASS
- [ ] Demo org exists and is active
- [ ] New users auto-join demo org
- [ ] Demo org shows "Demo" badge in UI
- [ ] Users can only see their org's data
- [ ] Incidents save with correct organization_id
- [ ] Outreach logs save with correct organization_id
- [ ] Dashboard filters by organization_id
- [ ] No cross-org data leakage

---

## 🆘 Need Help?

1. Check `RLS-HARMONIZATION-SUMMARY.md` for detailed docs
2. Run `inspect-current-rls.sql` to see current state
3. Run `verify-rls-harmonization.sql` to check migration
4. Review policy definitions in migration file
