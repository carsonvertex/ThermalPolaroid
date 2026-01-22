# Release APK Build Guide

Complete guide for building standalone release APKs for RC POS app.

---

## Quick Start

### Using package.json Scripts (Recommended)

```bash
# Build release APK
npm run build:apk

# Build debug APK
npm run build:apk:debug
```

**APK Location:**
- Release: `android/app/build/outputs/apk/release/app-release.apk`
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Prerequisites

1. **Android Studio** installed
2. **Java 17** installed
3. **Android SDK** configured
4. **Gradle** (included with Android Studio)

---

## Build Methods

### Method 1: Using package.json Scripts

**Available Scripts:**

```json
{
  "scripts": {
    "build:apk": "cd android && gradlew.bat assembleRelease",
    "build:apk:debug": "cd android && gradlew.bat assembleDebug"
  }
}
```

**Usage:**

```bash
# Windows
npm run build:apk          # Release APK
npm run build:apk:debug    # Debug APK

# Linux/Mac (if gradlew exists)
npm run build:apk          # Uses gradlew instead of gradlew.bat
```

**Advantages:**
- ✅ Simple one-command build
- ✅ No need to remember Gradle commands
- ✅ Consistent across team members
- ✅ Works on Windows, Linux, and Mac

---

### Method 2: Direct Gradle Commands

**Windows:**
```bash
cd android
.\gradlew.bat assembleRelease    # Release APK
.\gradlew.bat assembleDebug      # Debug APK
```

**Linux/Mac:**
```bash
cd android
./gradlew assembleRelease        # Release APK
./gradlew assembleDebug          # Debug APK
```

**Advantages:**
- ✅ More control over build process
- ✅ Can add additional Gradle flags
- ✅ Direct access to all Gradle tasks

---

### Method 3: Using Expo CLI

```bash
# Build release APK
npx expo run:android --variant release

# Build debug APK
npx expo run:android --variant debug
```

**Advantages:**
- ✅ Integrates with Expo toolchain
- ✅ Handles native dependencies automatically
- ✅ Good for development workflow

---

## Build Process

### Step-by-Step

1. **Navigate to project root:**
   ```bash
   cd C:\xampp\htdocs\rc-pos
   ```

2. **Clean previous builds (optional but recommended):**
   ```bash
   cd android
   .\gradlew.bat clean
   cd ..
   ```

3. **Build the APK:**
   ```bash
   npm run build:apk
   ```

4. **Wait for build to complete:**
   - First build: ~10-15 minutes
   - Subsequent builds: ~5-10 minutes
   - Build progress shown in terminal

5. **Locate the APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

## Build Output

### Release APK
- **Location:** `android/app/build/outputs/apk/release/app-release.apk`
- **Size:** ~130 MB
- **App Name:** "Thermal Polaroid"
- **Features:**
  - Optimized for production
  - No debug tools
  - Standalone (no Metro bundler needed)
  - Uses production backend URL

### Debug APK
- **Location:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Size:** ~140 MB
- **App Name:** "Thermal Polaroid (dev)"
- **Features:**
  - Includes debug tools
  - Requires Metro bundler (development build)
  - Uses development backend URL

---

## Installing the APK

### On Device

1. **Transfer APK to device:**
   - USB cable
   - Email
   - Cloud storage (Google Drive, Dropbox)
   - ADB install

2. **Enable Unknown Sources:**
   - Settings → Security → Unknown Sources (enable)
   - Or Settings → Apps → Special Access → Install Unknown Apps

3. **Install APK:**
   - Tap the APK file
   - Follow installation prompts
   - Open the app

### Using ADB

```bash
# Install via ADB
adb install android/app/build/outputs/apk/release/app-release.apk

# Install and replace existing
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## Configuration

### Backend URL

The app automatically uses the correct backend URL based on build type:

**Release Build:**
- Uses production backend: `http://172.31.235.136:8080/api` (or public IP)
- Configured in: `lib/config/environment.ts`

**Debug Build:**
- Uses development backend: `http://10.0.2.2:8080/api` (emulator)
- Or: `http://localhost:8080/api` (iOS/Web)

**Override with Environment Variable:**
```bash
# Set environment variable before building
export EXPO_PUBLIC_API_URL=http://YOUR_IP:8080/api
npm run build:apk
```

---

## Troubleshooting

### Build Fails with "CMake Error"

**Problem:** Missing codegen directories for native modules.

**Solution:**
```bash
# Clean build directories
cd android
.\gradlew.bat clean

# Rebuild
.\gradlew.bat assembleRelease
```

### Build Fails with "Gradle Sync Failed"

**Problem:** Gradle dependencies not resolved.

**Solution:**
```bash
# Clean and rebuild
cd android
.\gradlew.bat clean
.\gradlew.bat --refresh-dependencies assembleRelease
```

### APK Won't Install

**Problem:** "App not installed" error.

**Solutions:**
1. Uninstall old version first
2. Enable "Unknown Sources" in device settings
3. Check device has enough storage
4. Try installing via ADB for better error messages

### App Shows "Network Request Failed"

**Problem:** App can't connect to backend.

**Solutions:**
1. Verify backend URL is correct (check `lib/config/environment.ts`)
2. For external devices, use public IP, not private IP
3. Check network security config is included in APK
4. Verify backend is running and accessible

---

## Build Optimization

### Reduce APK Size

1. **Enable ProGuard/R8:**
   Already enabled in release builds

2. **Remove unused resources:**
   ```gradle
   // In android/app/build.gradle
   android {
       buildTypes {
           release {
               shrinkResources true
               minifyEnabled true
           }
       }
   }
   ```

3. **Split APKs by ABI:**
   ```bash
   # Build separate APKs for each architecture
   .\gradlew.bat assembleRelease
   # APKs in: android/app/build/outputs/apk/release/
   ```

---

## Version Management

### Update Version

**File:** `android/app/build.gradle`

```gradle
defaultConfig {
    versionCode 3        // Increment for each release
    versionName "1.0.5"  // User-visible version
}
```

**Version Code:** Must increment for each release (used by Play Store)
**Version Name:** User-visible version (can be any string)

---

## Signing (For Production)

### Generate Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing

**File:** `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

**⚠️ Important:** Never commit keystore files or passwords to version control!

---

## Quick Reference

### Build Commands

```bash
# Quick build (using npm script)
npm run build:apk

# Clean build
cd android && .\gradlew.bat clean && cd .. && npm run build:apk

# Debug build
npm run build:apk:debug

# Install via ADB
adb install android/app/build/outputs/apk/release/app-release.apk
```

### File Locations

```
Release APK:  android/app/build/outputs/apk/release/app-release.apk
Debug APK:    android/app/build/outputs/apk/debug/app-debug.apk
Keystore:     android/app/my-release-key.keystore (if configured)
```

### Build Time

- **First build:** 10-15 minutes
- **Subsequent builds:** 5-10 minutes
- **Clean build:** 10-15 minutes

---

## Related Documentation

- [SUNMI-FIX-SUMMARY.md](./SUNMI-FIX-SUMMARY.md) - Network configuration fixes
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Troubleshooting guide
- [expo-build.md](./expo-build.md) - EAS cloud build documentation

---

## Summary

The easiest way to build a release APK is:

```bash
npm run build:apk
```

The APK will be ready at:
```
android/app/build/outputs/apk/release/app-release.apk
```

Just drag and drop it to your device to install! 🚀

