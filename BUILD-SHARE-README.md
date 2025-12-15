# Build Share Utility

A Node.js utility for quickly sharing the latest Android EAS build of Compassionate LOG with team members and testers.

## Features

- 🔍 Fetches the most recent successful Android build from EAS
- 📱 Prefers internal distribution builds over store builds
- 🔗 Provides direct APK download URLs when available
- 📄 Falls back to Expo build page URLs when direct links aren't available
- 📱 Generates QR codes for easy mobile sharing (ASCII terminal + PNG file)
- 📋 Creates ready-to-send share messages with install warnings
- ✅ Includes build metadata (ID, status, creation date)

## Setup

### 1. Install Dependencies

The required dependencies should already be installed if you've run `npm install`. If not:

```bash
npm install --save-dev qrcode qrcode-terminal ts-node @types/qrcode @types/node
```

### 2. Set Up Expo Token

You need an Expo access token to use the EAS API:

1. **Get your token**: Visit [https://expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
2. **Create a new token** with appropriate permissions for your project
3. **Set the environment variable**:

   **Option A: Environment file (recommended)**
   ```bash
   # Create or edit .env.local (not committed to git)
   echo "EXPO_TOKEN=your_token_here" >> .env.local
   ```

   **Option B: Shell export**
   ```bash
   export EXPO_TOKEN=your_token_here
   ```

   **Option C: Inline with command**
   ```bash
   EXPO_TOKEN=your_token_here npm run build:share
   ```

4. **Add to .gitignore** (if using .env.local):
   ```bash
   # Add this line to your .gitignore
   .env.local
   ```

⚠️ **Security Note**: Never commit your Expo token to version control.

## Usage

### Run the Build Share Utility

```bash
npm run build:share
```

### Example Output

```
🔍 Fetching latest Android build for Compassionate Log...

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

📱 QR Code saved to: /path/to/project/build-share/qr-latest-android.png

📱 Scan this QR code to download:
█▀▀▀▀▀█ ▀▄█▀ █▀▀▀▀▀█
█ ███ █ ▄▀▄█ █ ███ █
█ ▀▀▀ █ █▄▀█ █ ▀▀▀ █
▀▀▀▀▀▀▀ ▀ ▀ ▀ ▀▀▀▀▀▀▀
... (ASCII QR code)

🔗 Share URL: https://expo.dev/artifacts/eas/abc123...
📄 Build page: https://expo.dev/accounts/dr.ecovery/projects/odc-overdose-tracker/builds/f8e2d4c6...
✨ Direct APK download available!
```

## Output Files

### QR Code PNG
- **Location**: `./build-share/qr-latest-android.png`
- **Size**: 300x300 pixels
- **Format**: PNG with white background, black QR code
- **Usage**: Share this image via messaging apps, email, or print it

### Directory Structure
```
project-root/
├── build-share/
│   └── qr-latest-android.png    # Generated QR code
├── scripts/
│   ├── build-share.ts           # Main utility script
│   └── lib/
│       └── expo-types.ts        # TypeScript type definitions
└── package.json                 # Contains "build:share" script
```

## Best Practices

### Recommended QR Target: Expo Build Page URL
- **Trust**: Testers see "expo.dev" + build details before downloading
- **Longevity**: Build page URLs are permanent, artifact URLs may rotate
- **Transparency**: Shows build metadata, distribution type, and project info

### Recommended Direct Link for Remote Testers
- **Speed**: Direct artifact URLs (when available) skip the build page
- **Convenience**: One-click download for technical users
- **Fallback**: Always provide build page URL as backup

### What to Send Testers

Copy-paste ready message template:

```
Compassionate LOG Android Test Build (v1.5.2)

Scan the QR or use this link to install:
[QR CODE IMAGE or BUILD PAGE URL]

Android may warn "unknown app" — normal for test builds.
If you get blocked, tell me what screen you're on and I'll walk you through it.
```

## How It Works

1. **Authentication**: Uses your `EXPO_TOKEN` to authenticate with the Expo GraphQL API
2. **Build Fetching**: Queries the latest 20 Android builds for your project
3. **Build Selection**: 
   - Filters for successful builds (`FINISHED` status)
   - Prefers `INTERNAL` distribution over `STORE` distribution
   - Selects the most recent qualifying build
4. **URL Generation**:
   - **Direct APK**: Uses `artifacts.buildUrl` if available (immediate download)
   - **Build Page**: Falls back to `expo.dev/accounts/.../builds/...` (may prompt sign-in for download/access depending on project permissions)
5. **QR Generation**: Creates both terminal ASCII and PNG file versions
6. **Share Message**: Formats a complete message with app info and install warnings

## Important Notes

### About exp:// Links
**Note**: `exp://` links require Expo Go and are for development previews, not standalone APK installs. This utility generates links for production APK builds.

### Build Date Sanity Check
If the "latest build" date looks wrong, the utility will show the 5 most recent builds for verification. Builds are sorted by creation date (newest first).

## Troubleshooting

### "EXPO_TOKEN environment variable is required"
- Make sure you've set the `EXPO_TOKEN` environment variable
- Verify the token is valid by checking [your Expo dashboard](https://expo.dev)

### "No successful Android builds found"
- Run `eas build --platform android` to create a new build
- Check that your builds are completing successfully in the [EAS dashboard](https://expo.dev)
- The utility shows the 5 most recent builds to help verify sorting

### "GraphQL request failed: 401"
- Your Expo token may be expired or invalid
- Generate a new token from [Expo settings](https://expo.dev/settings/access-tokens)

### "Failed to load app.json"
- Make sure you're running the script from the project root directory
- Verify that `app.json` exists and contains valid JSON

### Build Date Looks Wrong
- Check the 5 most recent builds shown in the output
- Verify builds are sorted by creation date (newest first)
- Confirm you're looking at the correct project/platform

## Integration Tips

### CI/CD Integration
```bash
# In your CI pipeline
EXPO_TOKEN=$EXPO_ACCESS_TOKEN npm run build:share
```

### Slack/Discord Bot Integration
The script outputs structured data that can be easily parsed for bot integrations:
- Build ID and metadata
- Direct share URLs
- QR code file path

### Team Workflow
1. Developer runs `npm run build:share` after a successful build
2. Shares the generated message + QR code in team chat
3. Testers scan QR code or click link to install
4. QR PNG can be printed for physical distribution

## API Reference

The utility uses the Expo GraphQL API with the following query:

```graphql
query GetBuilds($appId: String!, $platform: AppPlatform!, $limit: Int!) {
  app {
    byId(appId: $appId) {
      builds(offset: 0, limit: $limit, filter: { platform: $platform }) {
        id
        status
        createdAt
        artifacts {
          buildUrl
        }
        platform
        distribution
      }
    }
  }
}
```

## Security Considerations

- **Expo Token**: Keep your `EXPO_TOKEN` secure and never commit it to version control
- **Internal Builds**: The utility prefers internal distribution builds, which require Expo account access
- **APK Sharing**: Direct APK URLs are temporary and may expire
- **Build Page URLs**: Require Expo account login but are more permanent

---

**Need help?** Check the [EAS Build documentation](https://docs.expo.dev/build/introduction/) for build-related questions. For API details, start with the [Expo documentation](https://docs.expo.dev/) as GraphQL endpoints may change.