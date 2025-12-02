# Apply Signup Fix - Simple Instructions

## What's Missing
Your verification showed:
- ❌ Anonymous Haven AI organization doesn't exist
- ❌ Trigger `on_auth_user_created` doesn't exist  
- ❌ Function `handle_new_user_signup` doesn't exist
- ✅ User Organizations RLS policies exist

## What To Do

**Run this ONE script in Supabase SQL Editor:**

```
reapply-signup-fix-safe.sql
```

That's it. This will create everything needed for signup to work.

## What It Does
1. Creates "Anonymous Haven AI" organization
2. Creates the signup handler function
3. Creates the trigger on auth.users
4. Sets up all RLS policies correctly
5. Uses 'Responder' role (not 'member')

## After Running
Signup will work immediately. New users will:
- Get a profile created automatically
- Be assigned to "Anonymous Haven AI" as "Responder"
- Have legal acceptance timestamps stored
- Be able to use the app right away

## Test It
After running the script, try signing up with a test account in your app.
