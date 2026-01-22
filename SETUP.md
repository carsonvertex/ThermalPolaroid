# 🚀 Quick Setup Guide

Follow these steps after cloning the project to get up and running.

## Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Android Studio** (for Android development)
- **Java 17+** (for Android builds)
- **Android SDK** installed via Android Studio

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Android Project

The project uses Expo Config Plugins to automatically configure Android settings. Generate the Android project:

```bash
# Option 1: Using npm script (requires device/emulator)
npm run android

# Option 2: Using Expo CLI directly (no device needed)
npx expo prebuild --platform android

# Option 3: Build APK only (no device needed)
npm run build:apk:debug
```

**Important Notes:**
- **Option 1** (`npm run android`): Requires an Android device or emulator connected. It will build AND install/run the app on your device.
- **Option 2** (`npx expo prebuild`): Just generates the Android project structure without building. No device needed.
- **Option 3** (`npm run build:apk:debug`): Builds the APK file without installing/running. Perfect for first build verification. No device needed.

**For your first build**, we recommend using **Option 2** or **Option 3** to verify everything is set up correctly, then use **Option 1** when you're ready to test on a device.

**What happens automatically:**
- ✅ Android project is generated
- ✅ `local.properties` file is created with Android SDK path (auto-detected)
- ✅ `gradle.properties` is optimized for faster builds
- ✅ Network security config is created (allows HTTP connections)
- ✅ AndroidManifest.xml is configured
- ✅ All necessary permissions are set

**When the plugin runs:**
The `withNetworkSecurityConfig` plugin (defined in `app.json` plugins array) automatically executes during:
- `npx expo prebuild` - When generating native projects
- `npm run android` - Which internally calls `expo prebuild` then builds
- `expo run:android` - Same as above

**Android SDK Auto-Detection:**
The plugin automatically detects your Android SDK location by checking:
1. `ANDROID_HOME` environment variable
2. `ANDROID_SDK_ROOT` environment variable  
3. Common default installation paths:
   - **Windows:** `%LOCALAPPDATA%\Android\Sdk`
   - **macOS:** `~/Library/Android/sdk` or `~/Android/Sdk`
   - **Linux:** `~/Android/Sdk` or `/opt/android-sdk`

The plugin runs **before** the Android project is fully generated, ensuring all configurations (including SDK path) are in place from the start. It modifies native files during the prebuild phase, not at runtime.

**Note:** The `local.properties` file is automatically created if it doesn't exist, but won't overwrite an existing one. This file is machine-specific and should not be committed to git.

### 3. Start Development Server

```bash
# Start Expo dev server
npm start

# Or start with dev client
npm run dev
```

### 4. Run on Device/Emulator

**Android:**
```bash
# Requires a connected device or running emulator
npm run android
```

**Note:** Make sure you have:
- An Android device connected via USB with USB debugging enabled, OR
- An Android emulator running (start from Android Studio → Device Manager)

If you don't have a device ready, you can still build the APK:
```bash
npm run build:apk:debug  # Builds APK without installing
```

**iOS (Mac only):**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

## Building APK

You can build APK files without needing a device connected. This is useful for:
- Verifying your build setup works
- Creating installable APK files
- Testing the build process

To build a release APK:

```bash
npm run build:apk
```

The APK will be created at:
```
android/app/build/outputs/apk/release/app-release-YYYYMMDD-HHMMSS.apk
```

## Configuration

### Backend API URL

The app is configured to use production server by default. To change the API URL, edit:

**File:** `lib/config/environment.ts`

```typescript
export const isProduction = true; // Set to false for development
```

Or set environment variable:
```bash
EXPO_PUBLIC_API_URL=http://your-server:8080/api
```

## Build Performance

### Faster Debug Builds

The project is configured for faster development builds:

- **Single Architecture**: Debug builds only compile for `arm64-v8a` (most common architecture), reducing build time by ~75%
- **Build Cache**: Gradle build cache enabled for faster rebuilds
- **Parallel Execution**: Gradle runs tasks in parallel
- **Increased Memory**: JVM allocated 4GB for faster compilation

**For Release Builds**: The build script automatically uses all architectures (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`) for maximum device compatibility.

**To change architectures manually:**
1. Edit `android/gradle.properties` and modify `reactNativeArchitectures`
2. Or pass `-PreactNativeArchitectures=arm64-v8a` when running Gradle commands

### Build Time Tips

- **First Build**: Usually takes 5-10 minutes (compiles everything)
- **Subsequent Builds**: Should be 1-3 minutes with cache enabled
- **Clean Build**: Run `cd android && gradlew.bat clean` if you encounter issues

## Troubleshooting

### SDK Location Not Found Error?

If you get this error:
```
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file.
```

**Solution:** The plugin should auto-detect your SDK, but if it fails:

**Option 1: Set ANDROID_HOME Environment Variable (Recommended)**

**Windows (PowerShell as Administrator):**
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
```
Then restart your terminal/PowerShell and run `npm run android` again.

**Option 2: Manually Create `local.properties` File**

Create `android/local.properties` manually:

**Windows:**
```powershell
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
"sdk.dir=$($sdkPath.Replace('\', '\\'))" | Out-File -FilePath "android\local.properties" -Encoding UTF8
```

**macOS/Linux:**
```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
# or
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
```

**Finding Your Android SDK Location:**
- Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
- Check the "Android SDK Location" path

### Configuration Cache / "external process started" Build Error?

If you get:
```
Configuration cache problems found in this build.
Starting an external process 'node ...' during configuration time is unsupported.
```

**Solution:** React Native/Expo run Node during Gradle config, which conflicts with configuration cache. Ensure `android/gradle.properties` has:
```properties
org.gradle.configuration-cache=false
```
Then clear the config cache and rebuild:
```bash
cd android
./gradlew.bat --stop          # Windows
# or ./gradlew --stop         # Mac/Linux
cd ..
npm run android
```

### Android Project Not Generated?

If you get errors generating the Android project:

```bash
# Clean and regenerate
rm -rf android  # Linux/Mac
# or
rmdir /s android  # Windows

npx expo prebuild --platform android --clean
```

### Network Connection Issues?

The Expo Config Plugin automatically configures network security. If you still have issues:

1. Verify `network_security_config.xml` exists in `android/app/src/main/res/xml/`
2. Check `AndroidManifest.xml` has `android:usesCleartextTraffic="true"`
3. Rebuild: `npm run build:apk`

See [ANDROID-NETWORK-SECURITY.md](./documentations/ANDROID-NETWORK-SECURITY.md) for details.

### Port Already in Use?

```bash
# Clear cache and restart
npm run dev:clear
```

## Next Steps

- 📖 Read [README.md](./documentations/README.md) for full documentation
- 🔧 Check [TROUBLESHOOTING.md](./documentations/TROUBLESHOOTING.md) for common issues
- 📱 See [RELEASE-APK-GUIDE.md](./documentations/RELEASE-APK-GUIDE.md) for APK build details

## Quick Commands Reference

```bash
npm install              # Install dependencies
npm run android          # Generate Android project & run
npm start                # Start Expo dev server
npm run dev              # Start with dev client
npm run build:apk         # Build release APK
npm run build:apk:debug  # Build debug APK
```

---

**Note:** The `android/` folder and `android/local.properties` file are auto-generated and should NOT be committed to git. The Expo Config Plugin ensures all necessary configurations (including SDK path detection) are applied automatically when you run `npm run android` or `npx expo prebuild`.
