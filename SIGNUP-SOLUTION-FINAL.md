# Signup Solution - Final Approach

## The Problem
Supabase doesn't allow creating triggers on `auth.users` table in managed projects.

## The Solution
Call a database function from the app after signup completes.

## Steps to Apply

### 1. Run SQL in Supabase
Run this file in Supabase SQL Editor:
```
create-manual-signup-function.sql
```

This creates:
- The `handle_new_user_signup_manual()` function
- Grants permission to authenticated users

### 2. App Code Already Updated
The signup code in `app/signup.tsx` has been updated to:
1. Create the auth user
2. Call the database function to create profile + org assignment
3. Handle errors gracefully

### 3. Test It
1. Run the SQL script
2. Try signing up in your app
3. New users will automatically:
   - Get a profile created
   - Be assigned to "Anonymous Haven AI" as "Responder"
   - Have legal acceptance timestamps stored

## Why This Works Better Than Triggers
- ✅ No permission issues with auth schema
- ✅ More control and error handling
- ✅ Easier to debug and test
- ✅ Can be called manually if needed
- ✅ Works immediately without webhook setup

## Verification
After signup, check:
```sql
-- Check profile was created
SELECT * FROM public.profiles WHERE email = 'test@example.com';

-- Check org assignment
SELECT * FROM public.user_organizations 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'test@example.com');
```

## If You Need to Backfill Existing Users
```sql
-- Find users without profiles
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Call function for each user
SELECT handle_new_user_signup_manual(
  id,
  email,
  raw_user_meta_data
)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```
