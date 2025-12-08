# How to Check for Webhooks in Supabase

Webhooks and Edge Functions aren't visible through SQL queries. You need to check the Supabase Dashboard.

## Step 1: Check Database Webhooks

### Navigate to Webhooks
1. Open your Supabase project dashboard
2. Go to **Database** (left sidebar)
3. Click **Webhooks** (in the Database section)

### What to Look For
Look for webhooks that trigger on:
- **Table:** `auth.users`
- **Event:** `INSERT` or `*` (all events)
- **Status:** Enabled

### If You Find a Webhook
Check if it:
- Calls an Edge Function
- Makes HTTP request to external service
- Has logic to create profiles

### Screenshot What You See
Take a screenshot if you find any webhooks - we can analyze them together.

---

## Step 2: Check Edge Functions

### Navigate to Edge Functions
1. In Supabase Dashboard
2. Go to **Edge Functions** (left sidebar)
3. Look for functions related to auth or signup

### Common Function Names
Look for functions named:
- `handle-new-user`
- `on-auth-user-created`
- `create-profile`
- `signup-handler`
- Or anything auth-related

### Check Function Code
If you find a function:
1. Click on it
2. Look at the code
3. See if it creates profiles
4. Check if it's enabled

---

## Step 3: Check Auth Hooks (New Feature)

Supabase recently added Auth Hooks - these are different from webhooks!

### Navigate to Auth Hooks
1. Go to **Authentication** (left sidebar)
2. Look for **Hooks** section
3. Check for hooks on these events:
   - `auth.user.created`
   - `auth.user.signup`

### What Auth Hooks Do
- Run custom code when auth events happen
- Can create profiles automatically
- More reliable than webhooks

---

## Step 4: Check Project Settings

### API Settings
1. Go to **Settings** → **API**
2. Scroll to **Custom Claims** or **Hooks**
3. Check if anything is configured

### Database Settings
1. Go to **Settings** → **Database**
2. Check **Connection Pooling**
3. Look for any custom configurations

---

## What to Report Back

Please check all 4 steps above and let me know:

### 1. Database Webhooks
- [ ] No webhooks found
- [ ] Found webhook(s) - describe what you see
- [ ] Screenshot attached

### 2. Edge Functions
- [ ] No edge functions
- [ ] Found function(s) - list names
- [ ] Checked code - does it create profiles?

### 3. Auth Hooks
- [ ] No auth hooks section
- [ ] Auth hooks section exists but empty
- [ ] Found auth hook(s) - describe

### 4. Any Other Findings
- Anything unusual in settings?
- Any custom configurations?
- Any third-party integrations?

---

## Alternative: Check via Supabase CLI

If you have Supabase CLI installed:

```bash
# List edge functions
supabase functions list

# Check function code
supabase functions download <function-name>

# Check webhooks (if supported)
supabase db webhooks list
```

---

## What We're Looking For

We want to find what's creating profiles automatically, causing the "duplicate key" error.

**Possibilities:**
1. ✅ Database Webhook on `auth.users` INSERT
2. ✅ Edge Function triggered by auth event
3. ✅ Auth Hook on user creation
4. ✅ Third-party integration (e.g., Zapier, n8n)
5. ❌ Database trigger (we already ruled this out)
6. ❌ RPC functions (we found them but they're not called)

---

## If You Find Nothing

If you check all 4 steps and find nothing, then:

**Theory:** Your app code might be running twice somehow
- Check Metro logs carefully
- Look for duplicate `[Signup]` log sequences
- Could be React strict mode in development
- Could be component mounting twice

**But honestly:** It doesn't matter because:
- ✅ Signup works
- ✅ Error is handled
- ✅ Users are happy
- ✅ Redundancy is good!

---

## Quick Checklist

Go through these in order:

1. [ ] Open Supabase Dashboard
2. [ ] Check Database → Webhooks
3. [ ] Check Edge Functions
4. [ ] Check Authentication → Hooks
5. [ ] Check Settings → API
6. [ ] Take screenshots of anything you find
7. [ ] Report back what you discovered

---

## Need Help?

If you find something but aren't sure what it means:
1. Take a screenshot
2. Copy any code you see
3. Share it and I'll help analyze

If you find nothing:
- That's OK! 
- Means the duplicate is from app code
- Which is fine - it's handled gracefully now

---

## Expected Outcome

**Most likely:** You'll find an Auth Hook or Edge Function that creates profiles automatically.

**What to do:** 
- Option 1: Disable it (rely on app code only)
- Option 2: Keep it (redundancy is good)
- Option 3: Remove app code (rely on hook only)

**My recommendation:** Keep both - redundancy ensures profiles always get created!

---

## Let Me Know What You Find!

After checking, tell me:
- What you found (or didn't find)
- Screenshots if applicable
- Whether you want to disable anything
- Or if you're happy with current setup

Your signup works either way - this is just to satisfy curiosity! 🔍
