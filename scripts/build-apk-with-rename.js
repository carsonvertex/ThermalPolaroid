const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Format date and time as YYYYMMDD-HHMMSS
function getDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

// Find the built APK file
function findBuiltApk(releaseDir) {
  const defaultApk = path.join(releaseDir, 'app-release.apk');
  
  if (fs.existsSync(defaultApk)) {
    return defaultApk;
  }
  
  // If default name doesn't exist, find the latest APK
  if (!fs.existsSync(releaseDir)) {
    return null;
  }
  
  const files = fs.readdirSync(releaseDir);
  const apkFiles = files
    .filter(file => file.endsWith('.apk'))
    .map(file => ({
      name: file,
      path: path.join(releaseDir, file),
      mtime: fs.statSync(path.join(releaseDir, file)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  return apkFiles.length > 0 ? apkFiles[0].path : null;
}

// Find Android SDK location
function findAndroidSdk() {
  // Check environment variable first
  if (process.env.ANDROID_HOME) {
    return process.env.ANDROID_HOME;
  }
  if (process.env.ANDROID_SDK_ROOT) {
    return process.env.ANDROID_SDK_ROOT;
  }

  // Common Windows locations
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const commonPaths = [
    path.join(homeDir, 'AppData', 'Local', 'Android', 'Sdk'),
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
    'C:\\Android\\Sdk',
    'C:\\Program Files\\Android\\Sdk',
  ];

  for (const sdkPath of commonPaths) {
    if (sdkPath && fs.existsSync(sdkPath)) {
      return sdkPath;
    }
  }

  return null;
}

// Ensure local.properties exists with SDK location
function ensureLocalProperties(androidDir) {
  const localPropertiesPath = path.join(androidDir, 'local.properties');
  const sdkPath = findAndroidSdk();

  if (!sdkPath) {
    throw new Error(
      'Android SDK not found. Please set ANDROID_HOME environment variable or install Android Studio.\n' +
      'Common location: C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk'
    );
  }

  // Convert Windows path to escaped format for local.properties
  const escapedSdkPath = sdkPath.replace(/\\/g, '\\\\');
  const content = `sdk.dir=${escapedSdkPath}\n`;

  // Only write if file doesn't exist or SDK path is different
  if (fs.existsSync(localPropertiesPath)) {
    const existingContent = fs.readFileSync(localPropertiesPath, 'utf8');
    if (existingContent.includes(`sdk.dir=${escapedSdkPath}`) || existingContent.includes(`sdk.dir=${sdkPath}`)) {
      return; // Already configured correctly
    }
  }

  fs.writeFileSync(localPropertiesPath, content);
  console.log(`✓ Configured Android SDK location: ${sdkPath}`);
}

// Increment versionCode in app.json
function incrementVersionCode() {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  const currentVersionCode = appJson.expo?.android?.versionCode || appJson.expo?.versionCode || 0;
  const newVersionCode = currentVersionCode + 1;

  if (appJson.expo && appJson.expo.android) {
    appJson.expo.android.versionCode = newVersionCode;
  } else if (appJson.expo) {
    if (!appJson.expo.android) {
      appJson.expo.android = {};
    }
    appJson.expo.android.versionCode = newVersionCode;
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log(`📝 Incremented versionCode from ${currentVersionCode} to ${newVersionCode}`);
  return newVersionCode;
}

function main() {
  const projectRoot = path.join(__dirname, '..');
  const androidDir = path.join(projectRoot, 'android');
  const releaseDir = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'apk',
    'release'
  );

  console.log('🔨 Building APK...\n');

  // Increment versionCode before building
  const newVersionCode = incrementVersionCode();
  console.log(`🔢 Building with versionCode: ${newVersionCode}\n`);

  try {
    // Check if android directory exists, if not run prebuild
    if (!fs.existsSync(androidDir)) {
      console.log('📦 Android project not found. Running expo prebuild...\n');
      execSync('npx expo prebuild --platform android', {
        stdio: 'inherit',
        cwd: projectRoot
      });
      console.log('\n✅ Android project generated\n');
    }

    // Ensure local.properties exists with SDK location
    console.log('🔧 Configuring Android SDK location...');
    ensureLocalProperties(androidDir);
    console.log('');

    // Build APK using Gradle
    // For release builds, use all architectures for maximum device compatibility
    console.log('🚀 Building APK with Gradle (all architectures)...\n');
    const architectures = 'armeabi-v7a,arm64-v8a,x86,x86_64';
    const buildCommand = process.platform === 'win32' 
      ? `gradlew.bat assembleRelease -PreactNativeArchitectures=${architectures}`
      : `./gradlew assembleRelease -PreactNativeArchitectures=${architectures}`;
    
    execSync(buildCommand, { 
      stdio: 'inherit', 
      cwd: androidDir 
    });
    
    console.log('\n✅ APK built successfully\n');
  } catch (error) {
    console.error('\n❌ Failed to build APK');
    process.exit(1);
  }

  try {
    // Find the built APK
    console.log('📦 Finding built APK...');
    const apkPath = findBuiltApk(releaseDir);
    
    if (!apkPath) {
      throw new Error(`APK file not found in ${releaseDir}`);
    }
    
    const originalName = path.basename(apkPath);
    console.log(`✓ Found APK: ${originalName}\n`);
    
    // Create new name with date and time
    const dateTimeString = getDateTimeString();
    const newName = `app-release-${dateTimeString}.apk`;
    const newPath = path.join(releaseDir, newName);
    
    // Rename the APK
    console.log(`📝 Renaming APK to: ${newName}...`);
    fs.renameSync(apkPath, newPath);
    
    console.log(`✅ APK renamed successfully: ${newName}`);
    console.log(`📁 Location: ${newPath}\n`);
  } catch (error) {
    console.error(`\n❌ Error renaming APK: ${error.message}`);
    process.exit(1);
  }
}

main();
