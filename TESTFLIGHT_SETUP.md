# 🍎 ODC Overdose Tracker - Apple TestFlight Setup Guide

## Prerequisites

### 1. Apple Developer Account
- **Required**: Apple Developer Program membership ($99/year)
- **Sign up**: https://developer.apple.com/programs/
- **Account type**: Individual or Organization

### 2. App Store Connect Setup
- **Access**: https://appstoreconnect.apple.com/
- **Create App**: New app with bundle ID `org.odc.overdose`

## Step-by-Step TestFlight Implementation

### Phase 1: Apple Developer Setup

1. **Create App Identifier**
   ```
   - Login to Apple Developer Portal
   - Certificates, Identifiers & Profiles → Identifiers
   - Register new App ID: org.odc.overdose
   - Description: ODC Overdose Tracker
   - Capabilities: None required for basic functionality
   ```

2. **Create App in App Store Connect**
   ```
   - Login to App Store Connect
   - My Apps → + (New App)
   - Platform: iOS
   - Name: ODC Overdose Tracker
   - Bundle ID: org.odc.overdose
   - SKU: odc-overdose-tracker-2024
   - User Access: Full Access
   ```

### Phase 2: EAS Build Configuration

3. **Configure iOS Credentials**
   ```bash
   # Login to EAS (if not already)
   npx eas login
   
   # Configure iOS credentials
   npx eas credentials:configure -p ios
   
   # Choose: "Set up new ASC API Key"
   # Follow prompts to connect Apple Developer account
   ```

4. **Build for TestFlight**
   ```bash
   # Build for internal testing (TestFlight)
   npx eas build --platform ios --profile preview
   
   # Or build for App Store submission
   npx eas build --platform ios --profile store
   ```

### Phase 3: TestFlight Submission

5. **Submit to TestFlight**
   ```bash
   # Automatic submission to TestFlight
   npx eas submit --platform ios --profile store
   
   # Or manual upload via Xcode/Transporter
   ```

6. **TestFlight Configuration**
   ```
   - App Store Connect → TestFlight
   - Select your build
   - Add Test Information:
     - What to Test: "Authentication system, incident reporting, offline sync"
     - App Review Information: Contact details
   - Add Internal Testers (up to 100)
   - Add External Testers (up to 10,000 - requires App Review)
   ```

## Build Commands

### Development Build (Simulator)
```bash
npx eas build --platform ios --profile development
```

### TestFlight Build (Internal Testing)
```bash
npx eas build --platform ios --profile preview
npx eas submit --platform ios --profile preview
```

### App Store Build (External Testing + Store)
```bash
npx eas build --platform ios --profile store
npx eas submit --platform ios --profile store
```

## TestFlight Testing Process

### Internal Testing (Immediate)
- **Testers**: Apple Developer team members
- **Limit**: 100 testers
- **Review**: No App Review required
- **Distribution**: Immediate after build processing

### External Testing (App Review Required)
- **Testers**: Anyone with email/public link
- **Limit**: 10,000 testers
- **Review**: Apple App Review required (1-7 days)
- **Distribution**: After Apple approval

## App Store Connect Metadata

### Required Information
```
App Information:
- Name: ODC Overdose Tracker
- Subtitle: Public Health Incident Tracking
- Category: Medical
- Content Rights: Your organization owns rights

App Review Information:
- Contact Information: Your details
- Demo Account: Test credentials for reviewers
- Notes: "Healthcare app for overdose incident tracking"

App Privacy:
- Data Collection: Health data, location (if used)
- Usage: Public health research and response
- Sharing: No third-party sharing
```

### Screenshots Required
- **iPhone**: 6.7", 6.5", 5.5" displays
- **iPad**: 12.9", 11" displays (if supporting iPad)
- **Minimum**: 3 screenshots per device type

## Compliance & Legal

### Health Data Compliance
- **HIPAA**: Ensure no PHI is collected
- **Privacy Policy**: Required for health apps
- **Terms of Service**: Recommended
- **Data Retention**: Clear policies needed

### App Review Guidelines
- **Medical Apps**: Follow Apple's medical app guidelines
- **Data Collection**: Clearly explain data usage
- **Functionality**: App must work as described

## Troubleshooting

### Common Issues
1. **Bundle ID Conflicts**: Ensure unique bundle identifier
2. **Provisioning Profiles**: EAS handles automatically
3. **App Review Rejection**: Address feedback and resubmit
4. **TestFlight Expiry**: Builds expire after 90 days

### Support Resources
- **EAS Documentation**: https://docs.expo.dev/eas/
- **Apple Developer**: https://developer.apple.com/support/
- **App Store Connect**: https://help.apple.com/app-store-connect/

## Timeline Expectations

- **Initial Setup**: 1-2 days
- **First Build**: 30-60 minutes
- **Internal TestFlight**: Immediate
- **External TestFlight**: 1-7 days (App Review)
- **App Store Release**: 1-7 days (App Review)

## Next Steps

1. ✅ iOS configuration added to project
2. 🔄 Get Apple Developer account
3. 🔄 Create App Store Connect app
4. 🔄 Run first iOS build
5. 🔄 Submit to TestFlight
6. 🔄 Add testers and distribute

The ODC Overdose Tracker is now ready for iOS TestFlight distribution! 🚀