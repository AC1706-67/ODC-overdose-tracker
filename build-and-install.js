#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function runCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.allowFailure) {
      fail(`Command failed: ${command}\n${error.message}`);
    }
    return null;
  }
}

console.log('Building and installing APK...');

// Check if android directory exists, if not create it
if (!fs.existsSync('android')) {
  console.log('Android directory not found. Running expo prebuild...');
  runCommand('npx expo prebuild --platform android');
}

// Check if AndroidManifest.xml exists
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(manifestPath)) {
  fail('AndroidManifest.xml missing. Please run: npx expo prebuild --platform android');
}

// Read package name from manifest
let manifest;
try {
  manifest = fs.readFileSync(manifestPath, 'utf8');
} catch (error) {
  fail(`Could not read AndroidManifest.xml: ${error.message}`);
}

const packageMatch = manifest.match(/package="([^"]+)"/);
if (!packageMatch) {
  fail('Could not read package name from AndroidManifest.xml');
}
const packageName = packageMatch[1];

// Ensure MAIN/LAUNCHER activity exists
if (!manifest.includes('android.intent.category.LAUNCHER')) {
  console.log('Adding LAUNCHER activity to AndroidManifest.xml...');
  const activityBlock = `    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>`;
  
  const updatedManifest = manifest.replace('</application>', `${activityBlock}\n  </application>`);
  fs.writeFileSync(manifestPath, updatedManifest);
}

// Build the APK
const apkPath = 'android/app/build/outputs/apk/debug/app-debug.apk';
if (!fs.existsSync(apkPath)) {
  console.log('Building debug APK...');
  process.chdir('android');
  
  // Clean and build
  if (process.platform === 'win32') {
    runCommand('.\\gradlew.bat clean');
    runCommand('.\\gradlew.bat assembleDebug');
  } else {
    runCommand('./gradlew clean');
    runCommand('./gradlew assembleDebug');
  }
  
  process.chdir('..');
}

if (!fs.existsSync(apkPath)) {
  fail(`Build completed but APK not found at ${apkPath}`);
}

const absoluteApkPath = path.resolve(apkPath);
console.log(`APK built successfully at: ${absoluteApkPath}`);
console.log(`Package name: ${packageName}`);
console.log('\nTo install on your device:');
console.log('1. Connect your phone via USB');
console.log('2. Enable USB debugging in Developer Options');
console.log('3. Run: adb install -r android/app/build/outputs/apk/debug/app-debug.apk');
console.log('\nOr copy the APK to your phone and install manually.');