# Compassionate Log

A React Native mobile application that helps communities record acts of care and compassion that save lives, designed for healthcare professionals, peer support specialists, and community responders.

## Features

### Multi-Organization Support

- Join multiple organizations with invite codes
- Switch between organizations seamlessly
- Organization-specific data isolation
- Certified organization directory
- Request new organization certification

### Authentication & Onboarding

- Secure email/password authentication with Supabase
- Terms of Service and Privacy Policy acceptance tracking
- Guided onboarding flow for new users
- Persistent session management with automatic restoration
- Role-based access control (Admin, Coordinator, Responder)

### Incident Reporting

- Compassionate health incident logging
- Anonymous data collection (ZIP code, demographics, outcomes)
- Offline-first with automatic sync
- Real-time validation and error handling
- Organization-scoped data access

### Outreach & Distribution Tracking

- Enhanced outreach logging with team member tracking
- Location-based analytics and coverage mapping
- Kit distribution tracking (Narcan, harm reduction supplies)
- Team member performance metrics
- ZIP code-based geographic analysis

### Analytics Dashboards

- **Health Dashboard**: Real-time incident statistics and trends
- **Outreach Dashboard**: Distribution patterns and effectiveness
- **Team Analytics**: Member performance and activity timelines
- **Location Analytics**: Geographic coverage and hotspot identification
- Survival rates and intervention effectiveness metrics
- Demographic insights for public health planning

### Offline Capabilities

- Works without internet connection
- Local data storage with automatic sync
- Pending submission indicators
- Network status monitoring

## Tech Stack

- **Framework**: React Native with Expo (Managed Workflow)
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: AsyncStorage for offline persistence
- **UI**: React Native with Lucide React Native icons
- **Charts**: Victory Native for data visualization
- **Build**: EAS Build for Android/iOS deployment
- **Code Quality**: ESLint with TypeScript support

## Quick Start

### For Testers

**Android**: Download the latest APK from releases or scan the QR code provided by your organization.

**iOS**: Join TestFlight using the invite link sent to your email.

### For Developers

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AC1706-67/Compassionate-LOG.git
   cd Compassionate-LOG
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run database migrations**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run migrations from `supabase/migrations/` in order

5. **Start development server**

   ```bash
   npx expo start
   ```

6. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS (macOS only)
   - Scan QR code with Expo Go app

### Environment Variables

Create a `.env` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project settings → API.

## Building & Deployment

### Android APK

```bash
# Preview build (APK for testing)
npx eas build --platform android --profile preview

# Universal APK (better compatibility)
npx eas build --platform android --profile android-universal

# Store build (AAB for Google Play)
npx eas build --platform android --profile store
```

### iOS TestFlight

```bash
# Development build (simulator)
npx eas build --platform ios --profile development

# TestFlight build
npx eas build --platform ios --profile preview
npx eas submit --platform ios --profile preview
```

See [TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md) for detailed iOS deployment instructions.

## Project Structure

```
Compassionate-LOG/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Incident reporting
│   │   ├── dashboard.tsx  # Health analytics dashboard
│   │   ├── distribution.tsx # Outreach & distribution
│   │   └── settings.tsx   # App settings & org switcher
│   ├── onboarding/        # Onboarding flow
│   │   ├── index.tsx      # Onboarding entry
│   │   ├── select-org.tsx # Certified org selection
│   │   ├── enter-code.tsx # Invite code redemption
│   │   └── request-org.tsx # New org certification
│   ├── legal/             # Legal documents
│   │   ├── terms.tsx      # Terms of Service
│   │   └── privacy.tsx    # Privacy Policy
│   ├── login.tsx          # Authentication screen
│   ├── signup.tsx         # Registration with terms acceptance
│   ├── consent.tsx        # Terms acceptance screen
│   └── _layout.tsx        # Root layout with auth & org gating
├── components/            # Reusable UI components
│   ├── TeamDashboard.tsx  # Team analytics
│   ├── LocationAnalytics.tsx # Geographic analytics
│   ├── DashboardCharts.tsx # Health metrics charts
│   └── OrganizationSelector.tsx # Org switcher
├── hooks/                 # Custom React hooks
│   ├── useIncidentStorage.ts # Incident data management
│   ├── useDistributionStorage.ts # Distribution tracking
│   ├── useDashboardData.ts # Dashboard data fetching
│   └── useOrganizations.ts # Org membership management
├── src/
│   ├── api/              # API layer
│   │   ├── organizationOnboarding.ts # Onboarding logic
│   │   ├── orgMembership.ts # Org management
│   │   ├── teamDashboard.ts # Team analytics
│   │   └── enhancedOutreach.ts # Outreach analytics
│   ├── context/          # React Context providers
│   │   └── OrgContext.tsx # Organization state management
│   └── utils/            # Utility functions
│       ├── auth.ts       # Authentication helpers
│       └── logger.ts     # Logging utilities
├── supabase/             # Database migrations & functions
│   └── migrations/       # SQL migration files
├── types/                # TypeScript type definitions
└── assets/               # Images and static files
```

## Database Schema

### Core Tables

- **profiles**: User profiles with terms acceptance tracking
- **organizations**: Organization registry with certification status
- **user_organizations**: Multi-org membership with roles
- **organization_invite_codes**: Secure invite code system
- **organization_certification_requests**: New org certification workflow

### Data Tables

- **incidents**: Health incident records (org-scoped)
- **outreach_logs**: Enhanced outreach tracking with team members and locations
- **distributions**: Kit distribution logs (legacy, migrated to outreach_logs)

### Analytics Views

- **health_dashboard_view**: Aggregated health metrics by organization
- **team_member_analytics**: Team performance metrics
- **location_analytics**: Geographic coverage analysis

### Key Features

- **Row Level Security (RLS)**: Organization-scoped data isolation
- **Multi-tenancy**: Complete data separation between organizations
- **Audit Trails**: Created/updated timestamps on all tables
- **Real-time Subscriptions**: Live data updates
- **Performance Indexes**: Optimized queries for analytics

## Security & Privacy

- **No PII Collection**: Only anonymous demographic data (ZIP codes, age ranges)
- **HIPAA Compliant**: No personally identifiable health information
- **Secure Authentication**: Supabase Auth with JWT tokens and session management
- **Data Encryption**: All data encrypted in transit (TLS) and at rest
- **Multi-Tenant Isolation**: Complete data separation between organizations via RLS
- **Role-Based Access Control**: Admin, Coordinator, and Responder roles
- **Terms Acceptance Tracking**: Legal compliance with audit trail
- **Organization-Scoped Data**: Users only access data from their organizations
- **Invite-Only Access**: Secure invite code system for organization membership

## Testing

### Code Quality

```bash
# Run ESLint
npx eslint src app components hooks types

# Type checking
npx tsc --noEmit
```

### Manual Testing Checklist

- [ ] Authentication flow (signup, login, logout)
- [ ] Terms acceptance at signup
- [ ] Onboarding flow (select org, enter code, request certification)
- [ ] Organization switching
- [ ] Incident reporting with offline sync
- [ ] Outreach logging with team members and locations
- [ ] Dashboard data loading and visualization
- [ ] Cross-device compatibility
- [ ] Database connection validation

### Device Testing

```bash
# Install on connected Android device
adb install -r path/to/your.apk

# Launch app
adb shell am start -n org.compassionatelog.app/.MainActivity

# View logs
adb logcat | grep -i "compassionate"
```

### Database Verification

```bash
# Run verification scripts in Supabase SQL Editor
# See: verify-legal-acceptance.sql
# See: verify-org-isolation.sql
# See: verify-rls-harmonization.sql
```

### Signup Health Check

Run the automated signup test to verify the complete signup flow:

```bash
node manual-signup-test.js
```

This verifies:
- ✅ Auth user creation
- ✅ Profile creation
- ✅ Organization assignment
- ✅ Login functionality
- ✅ Database integrity

The test creates a real user account that you can use to test the app. Check the output for login credentials.

**Database health check:**
```sql
-- Run in Supabase SQL Editor
\i test-current-signup-flow.sql
```

This checks:
- Default organization exists
- RLS policies are correct
- No orphaned users
- Recent signups are complete

## Version History

- **v1.5.2** (Current): Legal compliance, terms acceptance, code quality improvements
- **v1.5.1**: Multi-organization support, enhanced analytics, team tracking
- **v1.5.0**: Organization onboarding, invite codes, certification workflow
- **v1.4.0**: Enhanced outreach logging, location analytics, team dashboards
- **v1.3.0**: Dashboard improvements, RLS harmonization, performance optimization
- **v1.2.0**: Multi-tenant architecture, organization isolation
- **v1.1.0**: Authentication system, safe area fixes, universal builds
- **v1.0.1**: Production setup, environment variables, navigation fixes
- **v1.0.0**: Initial release with basic incident reporting

## Recent Updates

### Legal & Compliance

- Terms of Service and Privacy Policy acceptance at signup
- Consent screen for existing users
- Version tracking for policy updates
- Audit trail for legal compliance

### Multi-Organization Features

- Join multiple organizations with invite codes
- Switch between organizations seamlessly
- Organization-specific data isolation with RLS
- Certified organization directory
- New organization certification request workflow

### Enhanced Analytics

- Team member performance tracking
- Location-based coverage analysis
- Geographic hotspot identification
- Real-time dashboard updates
- Improved data visualization with charts

### Code Quality

- ESLint configuration with zero warnings
- TypeScript strict mode compliance
- Removed all unused variables and imports
- Improved error handling and logging

## Documentation

- [TestFlight Setup Guide](./TESTFLIGHT_SETUP.md) - iOS deployment instructions
- [Multi-Org Architecture](./MULTI_ORG_ARCHITECTURE.md) - System design overview
- [Onboarding Implementation](./ONBOARDING_IMPLEMENTATION_SUMMARY.md) - Onboarding flow details
- [Legal Acceptance](./LEGAL-ACCEPTANCE-IMPLEMENTATION.md) - Terms tracking implementation
- [RLS Quick Reference](./RLS-QUICK-REFERENCE.md) - Database security policies
- [Backend Functions](./BACKEND-FUNCTIONS-INVENTORY.md) - API documentation

## Contributing

This is a healthcare application for public health purposes. Contributions should focus on:

- Data accuracy and validation
- User experience improvements
- Security enhancements
- Accessibility compliance
- Performance optimization
- Code quality and maintainability

### Development Guidelines

- Follow TypeScript strict mode
- Maintain ESLint compliance (zero warnings)
- Write descriptive commit messages
- Test on both iOS and Android
- Document new features and APIs
- Ensure HIPAA compliance for health data

## License

This project is developed for public health purposes. Please ensure compliance with local healthcare data regulations.

## Support

For technical issues or feature requests, please create an issue in this repository.

## About Compassionate Log

Compassionate Log supports community health initiatives by providing healthcare professionals, peer support specialists, and first responders with tools to record acts of care and compassion that save lives.

---

**Built with care for public health and community safety**

## Build Sharing Utility

The project includes a convenient build sharing utility for distributing test builds to team members and stakeholders.

### Quick Start

```bash
# Set your Expo token (get from https://expo.dev/settings/access-tokens)
export EXPO_TOKEN=your_token_here

# Generate share link and QR code for latest Android build
npm run build:share
```

### What It Does

- 🔍 Fetches the most recent successful Android EAS build
- 📱 Prefers internal distribution builds for team testing
- 🔗 Provides direct APK download URLs when available
- 📱 Generates QR codes (terminal ASCII + PNG file)
- 📋 Creates ready-to-send share messages with install warnings

### Output

The utility generates:
- **Terminal QR Code**: Scan directly from your terminal
- **PNG QR Code**: Saved to `./build-share/qr-latest-android.png`
- **Share Message**: Copy-paste ready text with app info and install warnings
- **Build Metadata**: ID, status, creation date, and URLs

### Example Output

```
✅ Found build: f8e2d4c6-1234-5678-9abc-def012345678
   Status: FINISHED
   Created: 12/14/2025, 2:30:15 PM
   Distribution: INTERNAL

📋 Share Message:
──────────────────────────────────────────────────
Compassionate Log v1.5.2 (Android APK)
You may see an 'unknown app' install warning—this is normal for test builds.
Direct download: https://expo.dev/artifacts/eas/abc123...
──────────────────────────────────────────────────

📱 QR Code saved to: ./build-share/qr-latest-android.png
🔗 Share URL: https://expo.dev/artifacts/eas/abc123...
📄 Build page: https://expo.dev/accounts/dr.ecovery/projects/odc-overdose-tracker/builds/f8e2d4c6...
✨ Direct APK download available!
```

### Tester Message Template

```
Compassionate LOG Android Test Build (v1.5.2)

Scan the QR or use this link to install:
[QR CODE IMAGE or BUILD PAGE URL]

Android may warn "unknown app" — normal for test builds.
If you get blocked, tell me what screen you're on and I'll walk you through it.
```

**Note**: This generates links for production APK builds. `exp://` links require Expo Go and are for development previews only.

For detailed setup instructions, see [BUILD-SHARE-README.md](BUILD-SHARE-README.md).