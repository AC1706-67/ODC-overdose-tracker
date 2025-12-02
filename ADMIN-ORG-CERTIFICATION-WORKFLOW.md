# Organization Certification & Invite Code Management

## Overview

This document explains how to manage organization certifications and invite codes as an admin.

## Current System

### 1. Organization Certification Requests

When someone clicks "Request Organization Certification" in the app, a record is created in:

- Table: `organization_certification_requests`
- Status: `pending` (default)

### 2. Admin Review Process (Manual - In Supabase Dashboard)

**Step 1: View Pending Requests**

```sql
-- See all pending certification requests
SELECT
  id,
  organization_name,
  organization_type,
  contact_name,
  contact_email,
  city,
  state,
  description,
  created_at
FROM organization_certification_requests
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**Step 2: Approve an Organization**

```sql
-- 1. Update the request status
UPDATE organization_certification_requests
SET
  status = 'approved',
  reviewed_at = NOW(),
  reviewed_by = 'YOUR_USER_ID_HERE'
WHERE id = 'REQUEST_ID_HERE';

-- 2. Create or update the organization
INSERT INTO organizations (
  name,
  slug,
  type,
  city,
  state,
  is_certified,
  is_public,
  is_active,
  outreach_enabled
)
VALUES (
  'Organization Name',
  'organization-slug',
  'Community Organization',
  'El Paso',
  'TX',
  true,  -- Certified!
  true,  -- Public (appears in join list)
  true,  -- Active
  true   -- Can use outreach
)
ON CONFLICT (slug) DO UPDATE SET
  is_certified = true,
  is_public = true,
  is_active = true,
  outreach_enabled = true;

-- 3. Generate an invite code for them
INSERT INTO organization_invite_codes (
  organization_id,
  code,
  role,
  created_by,
  expires_at,
  max_uses,
  is_active
)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'organization-slug'),
  'ORG2025',  -- Custom code
  'Responder',  -- Default role for new members
  'YOUR_USER_ID_HERE',
  NOW() + INTERVAL '1 year',  -- Expires in 1 year
  NULL,  -- Unlimited uses
  true
);
```

**Step 3: Reject a Request**

```sql
UPDATE organization_certification_requests
SET
  status = 'rejected',
  reviewed_at = NOW(),
  reviewed_by = 'YOUR_USER_ID_HERE',
  rejection_reason = 'Reason for rejection'
WHERE id = 'REQUEST_ID_HERE';
```

### 3. Generate Invite Codes for Existing Organizations

**Create a new invite code:**

```sql
INSERT INTO organization_invite_codes (
  organization_id,
  code,
  role,
  created_by,
  expires_at,
  max_uses,
  is_active
)
VALUES (
  'ORG_ID_HERE',
  'RAEP2025',  -- Make it memorable
  'Responder',
  'YOUR_USER_ID_HERE',
  NOW() + INTERVAL '1 year',
  100,  -- Max 100 uses (or NULL for unlimited)
  true
);
```

**View all codes for an organization:**

```sql
SELECT
  code,
  role,
  is_active,
  expires_at,
  max_uses,
  current_uses,
  created_at
FROM organization_invite_codes
WHERE organization_id = 'ORG_ID_HERE'
ORDER BY created_at DESC;
```

**Deactivate an old code:**

```sql
UPDATE organization_invite_codes
SET is_active = false
WHERE code = 'OLDCODE2024';
```

### 4. Quick Reference: Certify RAEP and Generate Code

```sql
-- Certify Recovery Alliance of El Paso
UPDATE organizations
SET
  is_certified = true,
  is_public = true,
  is_active = true,
  outreach_enabled = true
WHERE slug = 'recovery-alliance-el-paso';

-- Generate invite code for RAEP
INSERT INTO organization_invite_codes (
  organization_id,
  code,
  role,
  expires_at,
  is_active
)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'recovery-alliance-el-paso'),
  'RAEP2025',
  'Responder',
  NOW() + INTERVAL '1 year',
  true
);

-- View the code
SELECT
  o.name,
  ic.code,
  ic.role,
  ic.expires_at,
  ic.is_active
FROM organization_invite_codes ic
JOIN organizations o ON ic.organization_id = o.id
WHERE o.slug = 'recovery-alliance-el-paso';
```

## Future Enhancements (Not Built Yet)

### Admin Dashboard (Would Need to Build)

- Web interface to view/approve/reject requests
- Auto-generate invite codes on approval
- Email notifications to organizations
- Bulk code generation

### Email Notifications (Would Need to Build)

- Send email when request is approved
- Include invite code in email
- Send to contact_email from request

### Automated Approval (Would Need to Build)

- Auto-approve certain organization types
- Auto-generate codes on approval
- Trigger email automatically

## Current Workflow (Manual)

1. **User submits request** → Creates record in `organization_certification_requests`
2. **You check Supabase** → Run SQL to see pending requests
3. **You approve** → Run SQL to:
   - Update request status to 'approved'
   - Set organization as certified
   - Generate invite code
4. **You email them** → Manually send email with invite code
5. **They share code** → Staff use code to join in app

## Recommended Next Steps

1. **For now**: Use the SQL scripts above in Supabase SQL Editor
2. **Phase 2**: Build an admin web dashboard
3. **Phase 3**: Add email notifications via Supabase Edge Functions
4. **Phase 4**: Automate the entire flow

## Example: Complete RAEP Setup

Run this in Supabase SQL Editor:

```sql
-- 1. Certify RAEP
UPDATE organizations
SET
  is_certified = true,
  is_public = true,
  is_active = true,
  outreach_enabled = true
WHERE slug = 'recovery-alliance-el-paso';

-- 2. Create invite code
INSERT INTO organization_invite_codes (
  organization_id,
  code,
  role,
  expires_at,
  is_active
)
SELECT
  id,
  'RAEP2025',
  'Responder',
  NOW() + INTERVAL '1 year',
  true
FROM organizations
WHERE slug = 'recovery-alliance-el-paso'
ON CONFLICT (code) DO NOTHING;

-- 3. Verify
SELECT
  o.name,
  o.is_certified,
  o.is_public,
  o.outreach_enabled,
  ic.code,
  ic.role,
  ic.expires_at
FROM organizations o
LEFT JOIN organization_invite_codes ic ON o.id = ic.organization_id
WHERE o.slug = 'recovery-alliance-el-paso';
```

Share the code "RAEP2025" with your staff!
