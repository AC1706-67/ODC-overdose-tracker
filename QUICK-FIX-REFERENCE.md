# Quick Fix Reference Card

## 🚨 Issue: Sign-up fails with "Database error"

### Fix (Run in Supabase SQL Editor):
```sql
CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'haven-ai' LIMIT 1;
  IF default_org_id IS NOT NULL THEN
    INSERT INTO public.user_organizations (user_id, organization_id, role, is_active)
    VALUES (NEW.id, default_org_id, 'Peer', true)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🚨 Issue: Outreach/Dashboard tabs missing for RAEP members

### Fix 1 (Run in Supabase SQL Editor):
```sql
UPDATE organizations
SET outreach_enabled = true
WHERE slug = 'raep' OR id = '6e892800-0429-442f-bff8-417b4d4ec793';
```

### Fix 2 (Already done in code):
- Updated `app/onboarding/select-org.tsx`
- Existing members can now activate their org
- Build new APK to deploy

---

## ✅ Verify Fixes

### Check trigger:
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'auto_assign_default_organization';
-- Should contain 'Peer' not 'member'
```

### Check RAEP:
```sql
SELECT name, slug, outreach_enabled FROM organizations WHERE slug = 'raep';
-- outreach_enabled should be true
```

### Check user membership:
```sql
SELECT u.email, o.name, uo.role, o.outreach_enabled
FROM user_organizations uo
JOIN auth.users u ON uo.user_id = u.id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email = 'achavez@recoveryalliance.net';
```

---

## 📱 Test After Deployment

1. **New sign-up:** Should succeed without errors
2. **RAEP member login:** Should see Incidents, Outreach, Dashboard, Settings tabs
3. **Org selection:** Clicking org with "Member" badge should activate it

---

## 📄 Full Documentation

- `COMPLETE-FIX-SUMMARY.md` - Executive summary
- `FIX-SIGNUP-AND-TABS-INSTRUCTIONS.md` - Detailed steps
- `SIGNUP-AND-TAB-VISIBILITY-FIX.md` - Technical analysis
