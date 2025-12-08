## Organization Onboarding Flow

## Two Paths for Users

### Path 1: Individual Users (Self-Service)
1. User opens app → Sign Up
2. Enters email + password
3. Gets assigned to **"Anonymous Haven AI"** (default org)
4. Can immediately use the app
5. All 4 tabs visible (Incidents, Outreach, Dashboard, Settings)

**Use case**: Individual harm reduction workers, volunteers, or people wanting to try the app

### Path 2: Organizations (Request Access)
1. Organization representative opens app → Sign Up screen
2. Clicks **"🏢 Request Organization Access"**
3. Fills out form:
   - Organization name
   - Organization type (harm reduction center, recovery support, etc.)
   - City/State
   - Description
   - Contact info (name, email, phone)
4. Request submitted to `certification_requests` table
5. **You review the request** (see below)
6. **You approve** → Create their org + invite code
7. They sign up and join their dedicated org

**Use case**: Recovery Alliance, harm reduction centers, syringe exchanges, etc.

## For You: Reviewing Requests

### View Pending Requests
```sql
SELECT 
  id,
  organization_name,
  contact_name,
  contact_email,
  contact_phone,
  organization_type,
  city,
  state,
  description,
  status,
  created_at
FROM public.certification_requests
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### Approve a Request
1. **Create the organization**:
```sql
INSERT INTO public.organizations (name, slug, type, city, state, is_certified, is_public, is_active, outreach_enabled)
VALUES (
  'Recovery Alliance',
  'recovery-alliance',
  'Harm Reduction Center',
  'San Francisco',
  'CA',
  true,
  true,
  true,
  true
)
RETURNING id;
```

2. **Generate an invite code** (optional - for private orgs):
```sql
INSERT INTO public.invite_codes (code, organization_id, created_by, max_uses)
VALUES (
  'RECOVERY2024',
  '<org_id_from_above>',
  '<your_user_id>',
  100
)
RETURNING code;
```

3. **Update the request status**:
```sql
UPDATE public.certification_requests
SET 
  status = 'approved',
  approved_at = now(),
  notes = 'Organization created. Invite code: RECOVERY2024'
WHERE id = '<request_id>';
```

4. **Email the contact person**:
   - "Your organization has been approved!"
   - "Sign up at: [app link]"
   - "Use invite code: RECOVERY2024" (if private)
   - Or "Select 'Recovery Alliance' from the org list" (if public)

### Reject a Request
```sql
UPDATE public.certification_requests
SET 
  status = 'rejected',
  notes = 'Reason for rejection...'
WHERE id = '<request_id>';
```

## Benefits of This Approach

✅ **Individual users** can try the app immediately (no friction)
✅ **Organizations** get dedicated spaces with their branding
✅ **You control** which orgs get added (quality + safety)
✅ **Scalable** - you can approve orgs as you have capacity
✅ **Professional** - orgs feel valued with custom setup

## Next Steps

1. ✅ Form created (`app/request-organization.tsx`)
2. ✅ Link added to signup screen
3. ✅ Requests go to `certification_requests` table
4. 📋 **TODO**: Create admin panel to review requests (optional)
5. 📋 **TODO**: Email notifications when requests come in (optional)

For now, you can review requests directly in Supabase SQL Editor!
