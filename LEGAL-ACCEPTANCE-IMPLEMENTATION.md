# Legal Acceptance Implementation

## Overview
Implemented Terms of Service and Privacy Policy acceptance tracking to meet app store requirements and provide legal compliance.

## What Was Implemented

### 1. Database Migration
**File:** `supabase/migrations/20251127_add_legal_acceptance_tracking.sql`

Added three columns to `profiles` table:
- `terms_accepted_at` (timestamptz) - When user accepted ToS
- `privacy_accepted_at` (timestamptz) - When user accepted Privacy Policy
- `accepted_version` (text, default '1.0') - Version of policies accepted

### 2. Signup Flow Enhancement
**File:** `app/signup.tsx`

- Added checkbox for "I agree to Terms and Privacy Policy"
- Links to `/legal/terms` and `/legal/privacy` pages
- Button disabled until checkbox is checked
- Timestamps saved to profile on signup via `auth.signUp()` options

### 3. Consent Screen
**File:** `app/consent.tsx`

New screen for users who need to accept terms after signup:
- Shows links to read Terms and Privacy Policy
- Checkbox to confirm acceptance
- Updates profile with acceptance timestamps
- Redirects to onboarding after acceptance

### 4. Backend Guards
**Files:** 
- `src/api/organizationOnboarding.ts` - `joinOrganizationWithCode()`
- `src/api/orgMembership.ts` - `joinOrganization()`

Both functions now check if user has accepted terms before allowing org join:
- Queries profile for `terms_accepted_at` and `privacy_accepted_at`
- Throws `TERMS_NOT_ACCEPTED` error if either is null
- Frontend catches this and redirects to consent screen

### 5. Frontend Error Handling
**Files:**
- `app/onboarding/enter-code.tsx`
- `app/onboarding/select-org.tsx`

Both screens catch `TERMS_NOT_ACCEPTED` error and show alert:
- "You must accept our Terms of Service and Privacy Policy"
- Offers "Accept Terms" button that navigates to `/consent`

## User Flow

### New User Signup
1. User enters email/password
2. User checks "I agree to Terms and Privacy Policy"
3. User can click links to read full documents
4. Signup button enabled only when checkbox is checked
5. On signup, timestamps are saved to profile

### Existing User (No Terms Accepted)
1. User tries to join organization (via code or selection)
2. Backend checks profile for acceptance timestamps
3. If missing, throws `TERMS_NOT_ACCEPTED` error
4. Frontend shows alert with "Accept Terms" button
5. User navigates to `/consent` screen
6. User reads and accepts terms
7. Profile updated with timestamps
8. User can now join organization

## Version Tracking

The `accepted_version` field allows you to:
- Track which version of policies user agreed to
- Require re-acceptance when policies change
- Query users who need to accept new version

Example future use:
```typescript
// When you update to version 2.0
if (profile.accepted_version !== '2.0') {
  // Require re-acceptance
}
```

## Testing

### Verify Migration
Run: `verify-legal-acceptance.sql`

This checks:
- Columns exist in profiles table
- Count of users with/without acceptance
- Sample of recent users

### Test Flows
1. **New signup** - Verify checkbox works and timestamps are saved
2. **Invite code** - Try joining without acceptance (should redirect to consent)
3. **Certified org** - Try joining without acceptance (should redirect to consent)
4. **Consent screen** - Accept terms and verify profile is updated

## Files Changed/Created

### Created
- `supabase/migrations/20251127_add_legal_acceptance_tracking.sql`
- `app/consent.tsx`
- `verify-legal-acceptance.sql`
- `LEGAL-ACCEPTANCE-IMPLEMENTATION.md`

### Modified
- `app/signup.tsx` - Added checkbox and terms acceptance
- `src/api/organizationOnboarding.ts` - Added terms guard to invite code redemption
- `src/api/orgMembership.ts` - Added terms guard to org joining
- `app/onboarding/enter-code.tsx` - Added error handling for terms
- `app/onboarding/select-org.tsx` - Added error handling for terms

## App Store Compliance

This implementation satisfies:
- ✅ Users must explicitly agree to terms before using the app
- ✅ Audit trail of when each user accepted
- ✅ Version tracking for policy updates
- ✅ Links to full legal documents
- ✅ Cannot access core features without acceptance

## Next Steps

1. **Run the migration** in Supabase dashboard
2. **Test the flows** with a new account
3. **Update existing users** (optional):
   ```sql
   -- Backfill existing users with current timestamp
   UPDATE profiles 
   SET 
     terms_accepted_at = created_at,
     privacy_accepted_at = created_at,
     accepted_version = '1.0'
   WHERE terms_accepted_at IS NULL;
   ```
4. **Deploy to production** before TestFlight submission
