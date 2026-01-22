# Expo Build Guide - RC POS App

Complete guide to building APK files for Android devices using Expo.

---

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Expo CLI** installed globally
- **EAS CLI** installed globally

### Install Required Tools

```bash
# Install Expo CLI (if not already installed)
npm install -g expo-cli

# Install EAS CLI (Expo Application Services)
npm install -g eas-cli
```

### Expo Account
- Create a free account at [https://expo.dev](https://expo.dev)
- Login via CLI: `eas login`

---

## 🚀 Method 1: EAS Build (Recommended)

EAS Build is the modern, cloud-based build service from Expo.

### Step 1: Install Dependencies

```bash
cd C:\xampp\htdocs\rc-pos
npm install
```

### Step 2: Login to EAS

```bash
eas login
```

Enter your Expo credentials when prompted.

### Step 3: Configure EAS Build

```bash
eas build:configure
```

This will create an `eas.json` file in your project root.

### Step 4: Update eas.json (Optional)

Edit `eas.json` for custom build settings:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 5: Build APK

#### For Development/Testing (Internal Distribution)

```bash
# Build APK for internal testing
eas build --platform android --profile preview
```

#### For Production

```bash
# Build production APK
eas build --platform android --profile production
```

### Step 6: Download APK

After the build completes (usually 10-20 minutes):

1. Visit the build URL shown in the terminal
2. Download the `.apk` file from your Expo dashboard
3. Or use: `eas build:list` to see all builds

---

## 🏗️ Method 2: Local Build (Alternative)

Build locally without cloud services.

### Prerequisites for Local Build

#### Install Android Studio
1. Download from [https://developer.android.com/studio](https://developer.android.com/studio)
2. Install Android SDK
3. Set up environment variables:

```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

# Add to System Environment Variables permanently
```

#### Install Java Development Kit (JDK)
```bash
# Windows - using Chocolatey
choco install openjdk17

# Or download from Oracle/OpenJDK
```

### Build Locally

```bash
# Generate Android project
npx expo prebuild --platform android

# Build development APK
npx expo run:android --variant release

# Or use Gradle directly
cd android
./gradlew assembleRelease

# APK will be in: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Installing APK on Device

### Method 1: Direct Transfer

1. **Transfer APK** to your Android device:
   - Via USB cable
   - Via email
   - Via cloud storage (Google Drive, Dropbox)

2. **Enable Unknown Sources**:
   - Go to Settings → Security
   - Enable "Install from Unknown Sources"
   - Or enable per-app (Android 8+)

3. **Install**:
   - Open the APK file on your device
   - Tap "Install"
   - Tap "Open" when installation completes

### Method 2: ADB Install

```bash
# Connect device via USB and enable USB Debugging

# Install via ADB
adb install path/to/your-app.apk

# Or if using expo
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Method 3: QR Code (Development)

For development builds with Expo Go:

```bash
# Start development server
npm start

# Scan QR code with Expo Go app
```

---

## 🔧 Build Profiles Explained

### Development Profile
```json
"development": {
  "developmentClient": true,
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
- **Use for:** Testing with dev tools
- **Includes:** Debug information, hot reload
- **File size:** Larger

### Preview Profile
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
- **Use for:** Internal testing, stakeholders
- **Includes:** Production-like build
- **File size:** Smaller than development

### Production Profile
```json
"production": {
  "android": {
    "buildType": "apk"
  }
}
```
- **Use for:** Public release
- **Includes:** Optimized, minified code
- **File size:** Smallest

---

## 🎯 Quick Commands Reference

```bash
# Login to EAS
eas login

# Check EAS configuration
eas build:configure

# Build for different profiles
eas build --platform android --profile development
eas build --platform android --profile preview
eas build --platform android --profile production

# List all builds
eas build:list

# Check build status
eas build:view [BUILD_ID]

# Local development
npm start
npm run android

# Clean and rebuild
npm run clear
npx expo prebuild --clean
```

---

## 📦 App Configuration

### Update app.json

Important settings for your build:

```json
{
  "expo": {
    "name": "RC POS",
    "slug": "rc-pos",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "rcpos",
    "userInterfaceStyle": "automatic",
    "android": {
      "package": "com.ThermalPolaroid.pos",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

**Key fields:**
- `package`: Your unique app identifier (reverse domain)
- `versionCode`: Increment for each release (1, 2, 3...)
- `version`: Semantic version (1.0.0, 1.0.1, etc.)

---

## 🐛 Troubleshooting

### Build Fails on EAS

**Error: "Build failed with error code 1"**

```bash
# Check logs in Expo dashboard
# Or run locally to see detailed errors
npx expo prebuild
npm run android
```

**Error: "No matching distribution found"**

```bash
# Update dependencies
npm update
npm install
```

### Local Build Issues

**Error: "ANDROID_HOME not set"**

```bash
# Set environment variable (PowerShell)
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"

# Or set permanently in System Properties → Environment Variables
```

**Error: "Gradle build failed"**

```bash
# Clean Gradle cache
cd android
./gradlew clean

# Rebuild
./gradlew assembleRelease
```

### APK Won't Install

**Issue: "App not installed"**

1. Check if old version exists → Uninstall it first
2. Ensure "Install from Unknown Sources" is enabled
3. Check if APK is corrupted → Re-download
4. Check device storage space

**Issue: "Parse error"**

- APK file is corrupted or incomplete
- Download again or rebuild

---

## 📊 Build Size Optimization

### Reduce APK Size

```json
// app.json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
}
```

### Remove Unused Assets

```bash
# Only include necessary images and fonts
# Remove unused dependencies
npm uninstall [unused-package]
```

---

## 🚢 Production Checklist

Before releasing to users:

- [ ] Update version in `app.json`
- [ ] Increment `versionCode`
- [ ] Test all features thoroughly
- [ ] Check database initialization works
- [ ] Verify offline functionality
- [ ] Test on different Android versions
- [ ] Update app icon and splash screen
- [ ] Remove debug logs
- [ ] Enable ProGuard/R8
- [ ] Test APK installation on clean device
- [ ] Document known issues

---

## 📝 Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH
1.0.0 → 1.0.1 → 1.1.0 → 2.0.0
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Update Version

```json
// app.json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

**Important:** Always increment `versionCode` for each build!

---

## 🔐 Signing Your App (Production)

For Play Store releases, you need a signed AAB (Android App Bundle).

### Generate Keystore

```bash
# EAS handles this automatically
eas build --platform android --profile production

# Or generate manually
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Build AAB (for Play Store)

```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

```bash
eas build --platform android --profile production
```

---

## 📱 Distribution Options

### 1. Direct APK
- Send APK file directly to users
- Users install manually
- Good for: Internal testing, beta users

### 2. Google Play Store
- Build AAB file
- Upload to Play Console
- Good for: Public release, automatic updates

### 3. Firebase App Distribution
- Upload APK to Firebase
- Distribute via links or email
- Good for: Beta testing, staged rollout

---

## 🆘 Support & Resources

- **Expo Docs:** [https://docs.expo.dev](https://docs.expo.dev)
- **EAS Build:** [https://docs.expo.dev/build/introduction/](https://docs.expo.dev/build/introduction/)
- **React Native Docs:** [https://reactnative.dev](https://reactnative.dev)
- **Expo Forums:** [https://forums.expo.dev](https://forums.expo.dev)

---

## 🎓 Best Practices

1. **Test on Real Devices** - Don't rely only on emulators
2. **Version Control** - Tag releases in Git
3. **Changelog** - Maintain a CHANGELOG.md
4. **Beta Testing** - Test with real users before production
5. **Monitoring** - Set up crash reporting (Sentry, Bugsnag)
6. **Backups** - Keep keystore files safe
7. **Documentation** - Document build process for team

---

**Happy Building! 🚀**

