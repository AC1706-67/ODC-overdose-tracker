# Organization Onboarding Flow Implementation

## Overview
Implemented a comprehensive onboarding flow for new users to join organizations through multiple pathways.

## Database Schema Updates

### New Migration: `20251119_add_org_certification_and_codes.sql`

#### Organizations Table - New Fields
- `is_certified` (boolean): Whether the organization is certified
- `status` (text): 'pending' | 'approved' | 'rejected' | 'suspended'
- `created_by` (uuid): User who requested the organization
- `approved_by` (uuid): Admin who approved it
- `approved_at` (timestamptz): When it was approved
- `contact_email` (text): Organization contact email
- `contact_name` (text): Organization contact name
- `certification_notes` (text): Admin notes about certification

#### New Table: `organization_invite_codes`
```sql
- id (uuid, PK)
- organization_id (uuid, FK to organizations)
- code (text, unique) - e.g., "RAEP2025"
- description (text) - e.g., "Recovery Alliance El Paso 2025 Code"
- role (text) - Default role for users joining with this code
- is_active (boolean)
- max_uses (integer) - NULL = unlimited
- current_uses (integer)
- expires_at (timestamptz) - NULL = never expires
- created_by (uuid)
- created_at, updated_at
```

#### New Function
- `increment_invite_code_usage(code_text)`: Atomically increments usage counter

## Frontend Implementation

### Onboarding Screens

#### 1. `/app/onboarding/index.tsx` - Main Onboarding Router
Three options presented to users:
- **Option A**: Enter organization code
- **Option B**: Join certified organization
- **Option C**: Request organization certification
- **Skip**: Continue without joining (defaults to Anonymous Haven AI)

#### 2. `/app/onboarding/enter-code.tsx` - Code Entry
- User enters organization invite code (e.g., "RAEP2025")
- Validates code:
  - Must be active
  - Not expired
  - Under max usage limit
- Checks if user is already a member
- Joins organization with role specified in code
- Increments code usage counter

#### 3. `/app/onboarding/select-org.tsx` - Browse Organizations
- Lists all certified, approved, active organizations
- Shows organization details:
  - Name
  - Location (city, state)
  - Description
  - Type
- User taps to join as "Responder"
- Checks for existing membership

#### 4. `/app/onboarding/request-org.tsx` - Request Certification
Form fields:
- Organization name *
- Organization type * (dropdown)
- City
- State
- Website
- Contact name *
- Contact email *
- Description

Creates organization with:
- `status = 'pending'`
- `is_certified = false`
- `is_active = false`
- `created_by = current user`

Adds requester as pending Owner (activated when approved)

### Updated Types (`types/organization.ts`)

Added:
- `OrganizationStatus` type
- `OrganizationInviteCode` interface
- `OrganizationRequest` interface
- Updated `Organization` interface with certification fields

## Usage Flow

### For New Users

1. **Sign up** → Redirected to `/onboarding`
2. **Choose path**:
   - **Have code**: Enter code → Join org → Dashboard
   - **Browse orgs**: Select org → Join → Dashboard
   - **Request new**: Fill form → Pending approval → Dashboard (with Anonymous Haven AI)
   - **Skip**: Dashboard (with Anonymous Haven AI)

### For Admins (Future)

Admin panel to:
1. View pending organization requests
2. Review details
3. Approve/reject with notes
4. When approved:
   - Set `status = 'approved'`
   - Set `is_certified = true`
   - Set `is_active = true`
   - Activate requester's user_organization membership
   - Optionally create invite code

### For Organization Admins

Can create invite codes:
```typescript
await supabase
  .from('organization_invite_codes')
  .insert({
    organization_id: 'org-uuid',
    code: 'MYORG2025',
    description: 'My Organization 2025 Code',
    role: 'Responder',
    max_uses: 100, // or null for unlimited
    expires_at: '2025-12-31', // or null for never
  });
```

## Migration Steps

### To Apply Schema Changes

1. **Run the migration SQL** in Supabase SQL Editor:
   - Open Supabase Dashboard → SQL Editor
   - Copy entire contents of `supabase/migrations/20251119_add_org_certification_and_codes.sql`
   - Paste and click "Run"
   - Migration is **idempotent** - safe to run multiple times

2. **Verify migration success**:
   ```sql
   -- Check new table exists
   SELECT COUNT(*) FROM organization_invite_codes;
   
   -- Check new columns added
   SELECT name, is_certified, status FROM organizations;
   
   -- Check sample codes created
   SELECT code, description, is_active FROM organization_invite_codes;
   ```

3. **Create additional invite codes** (optional):
   ```sql
   INSERT INTO organization_invite_codes (organization_id, code, description, role)
   VALUES 
     ('your-org-uuid', 'MYORG2025', 'My Organization 2025', 'Responder')
   ON CONFLICT (code) DO NOTHING;
   ```

### Migration Safety Features

The migration includes:
- ✅ Idempotent operations (safe to re-run)
- ✅ Proper step ordering (functions → tables → constraints → indexes → triggers → data)
- ✅ `IF NOT EXISTS` and `DROP IF EXISTS` clauses
- ✅ `ON CONFLICT DO NOTHING` for data inserts
- ✅ Transaction-safe (no CONCURRENT operations)
- ✅ Null-safe function returns
- ✅ Comprehensive comments

## Next Steps

### Immediate
1. Apply database migration
2. Test onboarding flow
3. Create invite codes for existing organizations

### Future Enhancements
1. **Admin Panel**: Build UI for reviewing pending organizations
2. **Email Notifications**: Notify users when org is approved
3. **Invite Code Management**: UI for org admins to create/manage codes
4. **Organization Profiles**: Public pages for certified organizations
5. **Bulk Invites**: CSV upload for adding multiple users
6. **Code Analytics**: Track which codes are most used

## Files Created

- `supabase/migrations/20251119_add_org_certification_and_codes.sql` - **Production-ready migration**
- `verify-onboarding-migration.sql` - Verification queries
- `app/onboarding/index.tsx` - Main onboarding router
- `app/onboarding/enter-code.tsx` - Code entry screen
- `app/onboarding/select-org.tsx` - Organization browser
- `app/onboarding/request-org.tsx` - Certification request form
- `users_orgs.csv` - Current user-org mapping export
- `ONBOARDING_FLOW_IMPLEMENTATION.md` - This file
- `MIGRATION_BEST_PRACTICES_APPLIED.md` - Migration best practices documentation

## Files Updated

- `types/organization.ts` - Added certification fields and invite code types
- `hooks/useIncidentStorage.ts` - Changed `user` to `currentUser` for clarity

## Migration Quality

The migration follows PostgreSQL and Supabase best practices:
- ✅ Fully idempotent (safe to re-run)
- ✅ Proper step ordering (functions → tables → constraints → indexes → triggers → data)
- ✅ Transaction-safe operations
- ✅ Comprehensive error handling
- ✅ Detailed documentation
- ✅ Verification script included

See `MIGRATION_BEST_PRACTICES_APPLIED.md` for detailed explanation.
