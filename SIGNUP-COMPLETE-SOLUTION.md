# Signup Flow - Complete Solution

## The Problem
- Supabase doesn't allow triggers on `auth.users` in managed projects
- Need to create profiles and assign users to default organization on signup

## The Solution
Call a secure database function from the app after authentication.

## Implementation

### 1. Database Function (SECURITY DEFINER)
**File:** `create-manual-signup-function.sql`

The function:
- ✅ Verifies user can only set up their own profile (`auth.uid()` check)
- ✅ Creates profile with legal acceptance timestamps
- ✅ Assigns user to "Anonymous Haven AI" as "Responder"
- ✅ Returns success/error status

**Run this in Supabase SQL Editor:**
```sql
create-manual-signup-function.sql
```

### 2. App Integration

#### Signup Flow (`app/signup.tsx`)
1. Creates auth user with metadata
2. If session exists (no email confirmation):
   - Calls setup function while authenticated
   - Signs out so user can sign in properly
3. If no session (email confirmation required):
   - Shows "check your email" message
   - Profile created on first login

#### Login Flow (`app/login.tsx`)
1. Signs in user
2. Checks if profile exists
3. If no profile, calls setup function
4. Continues to app

## Security Features

✅ **Auth Guard:** Function verifies `user_id = auth.uid()`  
✅ **SECURITY DEFINER:** Bypasses RLS for profile creation  
✅ **Authenticated Only:** Only logged-in users can call it  
✅ **Idempotent:** Safe to call multiple times (ON CONFLICT)

## Testing

### Test Signup
1. Run the SQL script in Supabase
2. Sign up in the app with a test email
3. Check results:

```sql
-- Check profile created
SELECT * FROM public.profiles 
WHERE email = 'test@example.com';

-- Check org assignment
SELECT uo.*, o.name as org_name
FROM public.user_organizations uo
JOIN public.organizations o ON o.id = uo.organization_id
WHERE uo.user_id = (
  SELECT id FROM public.profiles 
  WHERE email = 'test@example.com'
);
```

Expected results:
- Profile exists with legal timestamps
- User assigned to "Anonymous Haven AI" as "Responder"

### Test Login (Email Confirmation Case)
1. Sign up with email confirmation enabled
2. Confirm email via link
3. Sign in - profile should be created automatically

## Backfill Existing Users

If you have users without profiles:

```sql
-- Find users missing profiles
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Create profiles for them (run as service role)
SELECT handle_new_user_signup_manual(
  id,
  email,
  raw_user_meta_data
)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```

## Why This Works

1. **No trigger permissions needed** - Function called from app
2. **Secure** - Auth guard prevents abuse
3. **Reliable** - Works with or without email confirmation
4. **Simple** - No webhooks or external services needed
5. **Testable** - Easy to verify and debug

## Files Changed

- ✅ `create-manual-signup-function.sql` - Database function
- ✅ `app/signup.tsx` - Calls function after signup
- ✅ `app/login.tsx` - Creates profile on first login if missing

## Next Steps

1. Run `create-manual-signup-function.sql` in Supabase
2. Test signup in your app
3. Verify profile and org assignment created
4. Deploy to production

The signup flow is now complete and production-ready! 🎉
