# 🚨 ODC Overdose Tracker

A React Native mobile application for tracking overdose incidents and kit distributions, designed for healthcare professionals and community responders.

## 📱 Features

### 🔐 **Authentication System**
- Secure email/password login with Supabase
- Persistent session management
- Role-based access control
- Automatic session restoration

### 📊 **Incident Reporting**
- Quick overdose incident logging
- Anonymous data collection (ZIP code, demographics, outcomes)
- Offline-first with automatic sync
- Real-time validation and error handling

### 📦 **Kit Distribution Tracking**
- Log Narcan and harm reduction kit distributions
- Track distribution by type and location
- Monitor inventory and usage patterns

### 📈 **Community Dashboard**
- Real-time statistics and trends
- Survival rates and intervention effectiveness
- Geographic coverage analysis
- Demographic insights for public health planning

### 🔄 **Offline Capabilities**
- Works without internet connection
- Local data storage with automatic sync
- Pending submission indicators
- Network status monitoring

## 🛠️ **Tech Stack**

- **Framework**: React Native with Expo (Managed Workflow)
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth
- **Storage**: AsyncStorage for offline persistence
- **UI**: React Native with Lucide React Native icons
- **Build**: EAS Build for Android/iOS deployment

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AC1706-67/ODC-overdose-tracker.git
   cd ODC-overdose-tracker
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

4. **Start development server**
   ```bash
   npx expo start
   ```

### Environment Variables

Create a `.env` file with:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 **Building & Deployment**

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

## 🏗️ **Project Structure**

```
ODC-overdose-tracker/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Incident reporting
│   │   ├── dashboard.tsx  # Analytics dashboard
│   │   ├── distribution.tsx # Kit distribution
│   │   └── settings.tsx   # App settings
│   ├── login.tsx          # Authentication screen
│   └── _layout.tsx        # Root layout with auth gating
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   └── supabase.ts       # Supabase client setup
├── supabase/             # Database migrations
└── assets/               # Images and static files
```

## 🗄️ **Database Schema**

### Tables
- **incidents**: Overdose incident records
- **distributions**: Kit distribution logs
- **users**: Authentication and user management

### Key Features
- Row Level Security (RLS) enabled
- Owner-bound data access
- Real-time subscriptions
- Automatic timestamps

## 🔒 **Security & Privacy**

- **No PII Collection**: Only anonymous demographic data
- **HIPAA Compliant**: No personally identifiable health information
- **Secure Authentication**: Supabase Auth with JWT tokens
- **Data Encryption**: All data encrypted in transit and at rest
- **Role-Based Access**: Users can only access their own data

## 🧪 **Testing**

### Manual Testing
- Authentication flow testing
- Offline/online sync verification
- Cross-device compatibility testing
- Database connection validation

### Device Testing
```bash
# Install on connected Android device
adb install -r path/to/your.apk

# Launch app
adb shell am start -n org.odc.overdose/.MainActivity
```

## 📋 **Version History**

- **v1.1.0**: Authentication system, safe area fixes, universal builds
- **v1.0.1**: Production setup, environment variables, navigation fixes
- **v1.0.0**: Initial release with basic incident reporting

## 🤝 **Contributing**

This is a healthcare application for public health purposes. Contributions should focus on:
- Data accuracy and validation
- User experience improvements
- Security enhancements
- Accessibility compliance

## 📄 **License**

This project is developed for public health purposes. Please ensure compliance with local healthcare data regulations.

## 🆘 **Support**

For technical issues or feature requests, please create an issue in this repository.

## 🏥 **About ODC**

The ODC Overdose Tracker supports community health initiatives by providing healthcare professionals and first responders with tools to track and respond to overdose incidents effectively.

---

**Built with ❤️ for public health and community safety**