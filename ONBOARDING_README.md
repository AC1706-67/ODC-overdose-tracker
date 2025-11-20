# Organization Onboarding System

A complete onboarding flow for users to join organizations through multiple pathways.

## Quick Start

### 1. Apply Database Migration

```bash
# Copy the migration SQL
cat supabase/migrations/20251119_add_org_certification_and_codes.sql

# Paste into Supabase Dashboard → SQL Editor → Run
```

### 2. Verify Migration

```bash
# Run verification script in Supabase SQL Editor
cat verify-onboarding-migration.sql

# Or test programmatically
node test-onboarding-flow.js
```

### 3. Update App Routing

After user signs up, redirect to onboarding:

```typescript
// In your signup handler
router.replace('/onboarding');
```

## User Flows

### Flow A: Join with Organization Code
1. User selects "I have an organization code"
2. Enters code (e.g., "RAEP2025")
3. System validates code and joins organization
4. Redirects to dashboard

### Flow B: Browse Certified Organizations
1. User selects "Join a certified organization"
2. Views list of approved, certified organizations
3. Taps organization to join as Responder
4. Redirects to dashboard

### Flow C: Request New Organization
1. User selects "Request organization certification"
2. Fills out organization details form
3. Submits request (status: pending)
4. Admin reviews and approves/rejects
5. User notified when approved

### Flow D: Skip
1. User selects "Skip for now"
2. Joins default organization (Anonymous Haven AI)
3. Redirects to dashboard

## Admin Tasks

### Create Invite Codes

```sql
INSERT INTO organization_invite_codes (organization_id, code, description, role, max_uses, expires_at)
VALUES (
  'your-org-uuid',
  'MYORG2025',
  'My Organization 2025 Code',
  'Responder',
  100,  -- or NULL for unlimited
  '2025-12-31'  -- or NULL for never expires
);
```

### Review Pending Organizations

```sql
SELECT 
  name,
  contact_name,
  contact_email,
  city,
  state,
  website,
  created_at
FROM organizations
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### Approve Organization

```sql
-- Approve the organization
UPDATE organizations
SET 
  status = 'approved',
  is_certified = true,
  is_active = true,
  approved_by = 'admin-user-uuid',
  approved_at = now(),
  certification_notes = 'Verified via phone call and website'
WHERE id = 'pending-org-uuid';

-- Activate the requester's membership
UPDATE user_organizations
SET is_active = true
WHERE organization_id = 'pending-org-uuid'
  AND role = 'Owner';

-- Optionally create an invite code
INSERT INTO organization_invite_codes (organization_id, code, description, role)
VALUES ('pending-org-uuid', 'NEWORG2025', 'New Organization 2025', 'Responder');
```

### Reject Organization

```sql
UPDATE organizations
SET 
  status = 'rejected',
  approved_by = 'admin-user-uuid',
  approved_at = now(),
  certification_notes = 'Unable to verify organization credentials'
WHERE id = 'pending-org-uuid';
```

## API Usage

### Validate Invite Code

```typescript
const { data: inviteCode } = await supabase
  .from('organization_invite_codes')
  .select('organization_id, role, is_active, max_uses, current_uses, expires_at')
  .eq('code', code.toUpperCase())
  .single();

const isValid = inviteCode?.is_active &&
  (!inviteCode.expires_at || new Date(inviteCode.expires_at) > new Date()) &&
  (!inviteCode.max_uses || inviteCode.current_uses < inviteCode.max_uses);
```

### Join Organization

```typescript
const { error } = await supabase
  .from('user_organizations')
  .insert({
    user_id: user.id,
    organization_id: orgId,
    role: 'Responder',
  });

// Increment code usage if using a code
await supabase.rpc('increment_invite_code_usage', { 
  code_text: code.toUpperCase() 
});
```

### List Certified Organizations

```typescript
const { data: orgs } = await supabase
  .from('organizations')
  .select('*')
  .eq('is_certified', true)
  .eq('status', 'approved')
  .eq('is_active', true)
  .order('name');
```

### Request Organization Certification

```typescript
const { data: org } = await supabase
  .from('organizations')
  .insert({
    name: formData.name,
    slug: generateSlug(formData.name),
    type: formData.type,
    city: formData.city,
    state: formData.state,
    website: formData.website,
    contact_email: formData.contactEmail,
    contact_name: formData.contactName,
    description: formData.description,
    status: 'pending',
    is_certified: false,
    is_active: false,
    created_by: user.id,
  })
  .select()
  .single();

// Add requester as pending owner
await supabase
  .from('user_organizations')
  .insert({
    user_id: user.id,
    organization_id: org.id,
    role: 'Owner',
    is_active: false,
  });
```

## Security

### RLS Policies

- **Read codes**: Any authenticated user can read active, non-expired codes
- **Manage codes**: Only Owners and Admins can create/update codes for their organizations
- **Organizations**: Users can only see organizations they belong to
- **User organizations**: Users can see their own memberships

### Code Usage Tracking

The `increment_invite_code_usage()` function:
- Atomically increments usage counter
- Validates code is active
- Checks expiration date
- Enforces max usage limits
- Returns NULL if validation fails

## Testing

```bash
# Test database migration
node test-onboarding-flow.js

# Test in app
# 1. Sign up new user
# 2. Should redirect to /onboarding
# 3. Try each flow path
# 4. Verify user joins correct organization
```

## Files

### Database
- `supabase/migrations/20251119_add_org_certification_and_codes.sql` - Migration
- `verify-onboarding-migration.sql` - Verification queries

### Frontend
- `app/onboarding/index.tsx` - Main router
- `app/onboarding/enter-code.tsx` - Code entry
- `app/onboarding/select-org.tsx` - Org browser
- `app/onboarding/request-org.tsx` - Request form

### Types
- `types/organization.ts` - TypeScript definitions

### Documentation
- `ONBOARDING_FLOW_IMPLEMENTATION.md` - Detailed implementation
- `MIGRATION_BEST_PRACTICES_APPLIED.md` - Migration quality notes
- `ONBOARDING_README.md` - This file

### Testing
- `test-onboarding-flow.js` - Automated tests
- `users_orgs.csv` - Current user mapping

## Future Enhancements

- [ ] Admin panel for reviewing pending organizations
- [ ] Email notifications when org is approved
- [ ] Invite code management UI for org admins
- [ ] Organization profile pages
- [ ] Bulk user invites via CSV
- [ ] Code usage analytics
- [ ] Organization search and filtering
- [ ] Multi-organization support (switch between orgs)
