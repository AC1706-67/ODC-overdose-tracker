#!/usr/bin/env ts-node

import { promises as fs } from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';
const QRTerminal = require('qrcode-terminal');
import { 
  EASBuild, 
  GraphQLResponse, 
  BuildsResponse, 
  AppConfig, 
  ShareUrlResult 
} from './lib/expo-types';

class BuildShareUtility {
  private readonly EXPO_TOKEN: string;
  private readonly PROJECT_ID: string;
  private readonly APP_NAME: string;
  private readonly APP_VERSION: string;
  private readonly APP_SLUG: string;

  constructor() {
    this.EXPO_TOKEN = process.env.EXPO_TOKEN || '';
    if (!this.EXPO_TOKEN) {
      throw new Error('EXPO_TOKEN environment variable is required. Please set it with your Expo access token.');
    }

    // Load app configuration
    const appConfig = this.loadAppConfig();
    this.PROJECT_ID = appConfig.expo.extra.eas.projectId;
    this.APP_NAME = appConfig.expo.name;
    this.APP_VERSION = appConfig.expo.version;
    this.APP_SLUG = appConfig.expo.slug;
  }

  private loadAppConfig(): AppConfig {
    try {
      const appJsonPath = join(process.cwd(), 'app.json');
      const appJsonContent = require(appJsonPath);
      return appJsonContent;
    } catch (error) {
      throw new Error(`Failed to load app.json: ${error}`);
    }
  }

  private async makeGraphQLRequest(query: string, variables: any = {}): Promise<any> {
    const response = await fetch('https://api.expo.dev/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.EXPO_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result;
  }

  private async fetchLatestAndroidBuild(): Promise<EASBuild | null> {
    const query = `
      query GetBuilds($appId: String!, $platform: AppPlatform!, $limit: Int!) {
        app {
          byId(appId: $appId) {
            builds(
              offset: 0
              limit: $limit
              filter: { platform: $platform }
            ) {
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
    `;

    const variables = {
      appId: this.PROJECT_ID,
      platform: 'ANDROID',
      limit: 20, // Get more builds to find the best one
    };

    try {
      const response: GraphQLResponse<BuildsResponse> = await this.makeGraphQLRequest(query, variables);
      const builds = response.data.app.byId.builds;

      if (!builds || builds.length === 0) {
        return null;
      }

      // Filter for successful builds only
      const successfulBuilds = builds.filter(build => build.status === 'FINISHED');
      
      if (successfulBuilds.length === 0) {
        console.log('No successful builds found. Recent builds:');
        builds.slice(0, 5).forEach(build => {
          console.log(`  - ${build.id}: ${build.status} (${build.distribution}) - ${new Date(build.createdAt).toLocaleString()}`);
        });
        return null;
      }

      // Prefer internal distribution builds, then any successful build
      const internalBuilds = successfulBuilds.filter(build => build.distribution === 'INTERNAL');
      const preferredBuild = internalBuilds.length > 0 ? internalBuilds[0] : successfulBuilds[0];

      return preferredBuild;

    } catch (error) {
      throw new Error(`Failed to fetch builds: ${error}`);
    }
  }

  private getBuildPageUrl(buildId: string): string {
    return `https://expo.dev/accounts/dr.ecovery/projects/${this.APP_SLUG}/builds/${buildId}`;
  }

  private getShareUrl(build: EASBuild): ShareUrlResult {
    // Check if we have a direct APK artifact URL
    if (build.artifacts?.buildUrl) {
      return {
        url: build.artifacts.buildUrl,
        type: 'direct'
      };
    }

    // Fall back to build page URL
    return {
      url: this.getBuildPageUrl(build.id),
      type: 'page'
    };
  }

  private generateShareMessage(shareUrl: string, urlType: 'direct' | 'page'): string {
    const installWarning = "You may see an 'unknown app' install warning—this is normal for test builds.";
    
    if (urlType === 'direct') {
      return `${this.APP_NAME} v${this.APP_VERSION} (Android APK)\n${installWarning}\nDirect download: ${shareUrl}`;
    } else {
      return `${this.APP_NAME} v${this.APP_VERSION} (Android)\n${installWarning}\nDownload from: ${shareUrl}`;
    }
  }

  private async ensureBuildShareDirectory(): Promise<void> {
    const buildShareDir = join(process.cwd(), 'build-share');
    try {
      await fs.access(buildShareDir);
    } catch {
      await fs.mkdir(buildShareDir, { recursive: true });
    }
  }

  private async generateQRCode(url: string): Promise<void> {
    await this.ensureBuildShareDirectory();
    
    // Generate PNG QR code
    const qrPath = join(process.cwd(), 'build-share', 'qr-latest-android.png');
    await QRCode.toFile(qrPath, url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log(`\n📱 QR Code saved to: ${qrPath}`);
  }

  private printASCIIQR(url: string): void {
    console.log('\n📱 Scan this QR code to download:');
    QRTerminal.generate(url, { small: true });
  }

  public async run(): Promise<void> {
    try {
      console.log(`🔍 Fetching latest Android build for ${this.APP_NAME}...`);
      
      const build = await this.fetchLatestAndroidBuild();
      
      if (!build) {
        console.error('❌ No successful Android builds found.');
        process.exit(1);
      }

      console.log(`\n✅ Found build: ${build.id}`);
      console.log(`   Status: ${build.status}`);
      console.log(`   Created: ${new Date(build.createdAt).toLocaleString()}`);
      console.log(`   Distribution: ${build.distribution}`);

      const { url, type } = this.getShareUrl(build);
      const shareMessage = this.generateShareMessage(url, type);

      console.log(`\n📋 Share Message:`);
      console.log('─'.repeat(50));
      console.log(shareMessage);
      console.log('─'.repeat(50));

      // Generate QR codes
      await this.generateQRCode(url);
      this.printASCIIQR(url);

      console.log(`\n🔗 Share URL: ${url}`);
      console.log(`📄 Build page: ${this.getBuildPageUrl(build.id)}`);
      
      if (type === 'direct') {
        console.log('✨ Direct APK download available!');
      } else {
        console.log('ℹ️  Using build page URL (no direct APK artifact found)');
      }

      // Sanity check for build date
      const buildDate = new Date(build.createdAt);
      const daysSinceCreated = Math.floor((Date.now() - buildDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreated > 7) {
        console.log(`⚠️  Build is ${daysSinceCreated} days old - confirm this is the latest build`);
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

// Run the utility
if (require.main === module) {
  const utility = new BuildShareUtility();
  utility.run().catch(console.error);
}

export default BuildShareUtility;