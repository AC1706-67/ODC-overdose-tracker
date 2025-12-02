# TestFlight Readiness Checklist

## 🎯 Overview

This document outlines the steps to prepare your Expo + Supabase app for TestFlight deployment.

## ✅ Pre-Flight Checklist

### 1. Run End-to-End Test

The comprehensive test script validates all critical functionality:

```bash
# Set test credentials
export TEST_EMAIL="your-test-user@example.com"
export TEST_PASSWORD="your-test-password"

# Run the test
npx tsx scripts/end-to-end-checklist-test.ts
```

**What it tests:**

- ✅ Authentication (login/logout)
- ✅ Organization membership loading
- ✅ Outreach logs CRUD operations
- ✅ Incidents CRUD operations
- ✅ RLS policy enforcement
- ✅ Cross-org isolation

**Expected output:**

```
🚀 TESTFLIGHT READINESS CHECK
============================================================

1️⃣ Testing Authentication...
✅ LOGIN: OK
   Authenticated as test@example.com

2️⃣ Testing Organization Membership...
✅ ORG_MEMBERSHIP: OK
   User belongs to 1 organization(s)

3️⃣ Testing Outreach Log Insert...
✅ OUTREACH_INSERT: OK
   Outreach log created successfully

4️⃣ Testing Outreach Log Select...
✅ OUTREACH_SELECT: OK
   Outreach log retrieved successfully

5️⃣ Testing Incident Insert...
✅ INCIDENT_INSERT: OK
   Incident created successfully

6️⃣ Testing Incident Select...
✅ INCIDENT_SELECT: OK
   Incident retrieved successfully

7️⃣ Testing RLS Isolation...
✅ RLS_ISOLATION: OK
   Cross-org access properly blocked

8️⃣ Cleaning up test data...
   Deleted test outreach log
   Deleted test incident

============================================================
📊 TEST SUMMARY
============================================================

✅ Passed: 7
❌ Failed: 0
📝 Total: 7

🎉 ALL TESTS PASSED - READY FOR TESTFLIGHT BUILD!
```

### 2. Fix TypeScript Errors

```bash
npx tsc --noEmit
```

**Status:** ✅ No TypeScript errors

### 3. Check Expo Dependencies

```bash
npx expo-doctor
```

**Issues Found:**

#### Issue 1: Native Config Properties

- **Problem:** Project has native folders (android/ios) but also has config in app.json
- **Impact:** Some properties won't sync in EAS Build
- **Fix:** This is expected for projects with custom native code. Properties like `scheme`, `orientation`, `icon` are managed in native folders.
- **Action:** ✅ No action needed (expected configuration)

#### Issue 2: Package Versions

- **Problem:** Some packages need updates for best compatibility
- **Packages to update:**
  - `expo@54.0.23` → `~54.0.25`
  - `expo-dev-client@6.0.17` → `~6.0.18`
  - `expo-linking@8.0.8` → `~8.0.9`
  - `expo-router@6.0.14` → `~6.0.15`
- **Fix:**
  ```bash
  npx expo install --fix
  ```
- **Action:** ⚠️ **Recommended before TestFlight build**

### 4. Update Dependencies (Recommended)

```bash
# Auto-fix dependency versions
npx expo install --fix

# Verify no issues remain
npx expo-doctor
```

## 🚀 TestFlight Build Steps

### Option 1: EAS Build (Recommended)

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (if not done)
eas build:configure

# Build for iOS TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

### Option 2: Local Build

```bash
# Build locally
npx expo run:ios --configuration Release

# Archive and upload via Xcode
```

## 📋 Pre-Build Checklist

Before running the build:

- [ ] ✅ End-to-end test passes
- [ ] ✅ No TypeScript errors
- [ ] ⚠️ Update Expo dependencies (recommended)
- [ ] Check app.json version number
- [ ] Check bundle identifier matches App Store Connect
- [ ] Verify environment variables are set
- [ ] Test on physical iOS device
- [ ] Review privacy policy and terms of service links

## 🔧 Environment Variables

Make sure these are set in your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For EAS Build, add them to `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-supabase-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Test Script Fails

**LOGIN_FAILED:**

- Check TEST_EMAIL and TEST_PASSWORD are correct
- Verify user exists in Supabase Auth
- Check Supabase URL and anon key in `.env`

**ORG_MEMBERSHIP_FAILED:**

- User needs to be assigned to an organization
- Run: `SELECT * FROM user_organizations WHERE user_id = 'USER_ID';`
- If empty, assign user to org in Supabase dashboard

**OUTREACH_INSERT_FAILED / INCIDENT_INSERT_FAILED:**

- Check RLS policies are in place
- Verify organization has `outreach_enabled = true`
- Check user has active membership

**RLS_ISOLATION_FAILED:**

- This is a security issue - user can see other org's data
- Re-run RLS policy creation scripts
- Verify policies in Supabase dashboard

### Build Fails

**Dependency Issues:**

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo install --fix
```

**Native Build Issues:**

```bash
# Clean iOS build
cd ios
pod install
cd ..
```

## 📱 Testing on TestFlight

After upload:

1. Add internal testers in App Store Connect
2. Wait for processing (usually 10-30 minutes)
3. Install via TestFlight app
4. Test critical flows:
   - Sign up / Login
   - Organization selection
   - Create outreach log
   - Create incident
   - View dashboard
   - Logout

## 🎉 Success Criteria

Your app is ready for TestFlight when:

- ✅ End-to-end test passes
- ✅ No TypeScript errors
- ✅ Expo dependencies updated
- ✅ Build completes successfully
- ✅ App installs and runs on TestFlight
- ✅ All critical features work in TestFlight build

## 📚 Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Supabase Documentation](https://supabase.com/docs)
