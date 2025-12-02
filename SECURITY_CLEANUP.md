# 🔒 Security Cleanup Required

## ⚠️ Issue Found

Your Supabase anon key is hardcoded in **multiple files** and committed to GitHub.

## 📋 Files with Hardcoded Keys

### Debug/Test Scripts (Safe to delete or fix)

- `analyze-database-schema.js`
- `apply-schema-updates.js`
- `check-*.js` (multiple files)
- `create-*.js` (multiple files)
- `debug-*.js` (multiple files)
- `diagnose-*.js` (multiple files)
- `fix-*.js` (multiple files)
- `test-*.js` (multiple files)
- And many more...

### Critical Files (Must fix)

- **`eas.json`** - Contains keys in build profiles ⚠️ HIGH PRIORITY

## 🛠️ Fix Steps

### Step 1: Rotate Your Anon Key (DO THIS FIRST!)

1. Go to: https://supabase.com/dashboard/project/vitwypicporqpeefwsjs/settings/api
2. Click "Reset" on the **anon/public** key
3. Copy the new key
4. Update your `.env` file with the new key

### Step 2: Fix eas.json

The `eas.json` file should reference env vars, not hardcode them.

**Current (BAD):**

```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://vitwypicporqpeefwsjs.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGci..."
}
```

**Should be (GOOD):**

```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "${EXPO_PUBLIC_SUPABASE_URL}",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${EXPO_PUBLIC_SUPABASE_ANON_KEY}"
}
```

Or better yet, set these in EAS Secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://vitwypicporqpeefwsjs.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_new_key_here"
```

Then remove the `env` section from `eas.json` entirely.

### Step 3: Clean Up Debug Scripts

All the `.js` test/debug scripts should use env vars:

**Change from:**

```javascript
const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGci...';
```

**To:**

```javascript
require('dotenv').config();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

### Step 4: Remove .env from Git History

```bash
git rm --cached .env
git commit -m "Remove .env from version control"
git push
```

### Step 5: Add .env.example

Create a template file for other developers:

```bash
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_SHOW_DIAGNOSTICS=false
```

## 🎯 Priority Order

1. **URGENT**: Rotate anon key in Supabase dashboard
2. **HIGH**: Fix `eas.json` to use EAS Secrets
3. **MEDIUM**: Update debug scripts to use env vars
4. **LOW**: Remove .env from Git history

## ✅ Verification

After fixing, search your codebase for:

- `vitwypicporqpeefwsjs`
- `eyJhbGci`

These should ONLY appear in:

- `.env` (not committed)
- `.env.example` (with placeholder values)

## 📚 Resources

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [Supabase Key Rotation](https://supabase.com/docs/guides/api/api-keys)
