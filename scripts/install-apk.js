const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find adb executable
function findAdb() {
  const possiblePaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(process.env.ANDROID_HOME || '', 'platform-tools', 'adb.exe'),
    'adb', // Try if adb is in PATH
  ];

  for (const adbPath of possiblePaths) {
    if (fs.existsSync(adbPath)) {
      return adbPath;
    }
    // Try if it's in PATH
    try {
      execSync(`"${adbPath}" version`, { stdio: 'ignore' });
      return adbPath;
    } catch (e) {
      // Continue searching
    }
  }

  return null;
}

// Find latest APK in release directory
function findLatestApk() {
  const releaseDir = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release');
  
  if (!fs.existsSync(releaseDir)) {
    throw new Error(`Release directory not found: ${releaseDir}`);
  }

  const files = fs.readdirSync(releaseDir);
  const apkFiles = files.filter(file => file.endsWith('.apk'));

  if (apkFiles.length === 0) {
    throw new Error('No APK files found in release directory. Please build the APK first using: npm run build:apk');
  }

  // Sort by modification time (newest first)
  const apkFilesWithStats = apkFiles.map(file => ({
    name: file,
    path: path.join(releaseDir, file),
    mtime: fs.statSync(path.join(releaseDir, file)).mtime,
  }));

  apkFilesWithStats.sort((a, b) => b.mtime - a.mtime);
  
  return apkFilesWithStats[0].path;
}

// Check if device is connected
function checkDevice(adbPath) {
  try {
    const output = execSync(`"${adbPath}" devices`, { encoding: 'utf-8' });
    const lines = output.split('\n').filter(line => line.trim() && !line.startsWith('List'));
    const devices = lines.filter(line => line.includes('\tdevice'));
    
    if (devices.length === 0) {
      throw new Error('No devices found. Please connect a device via USB and enable USB debugging.');
    }
    
    console.log(`✓ Found ${devices.length} device(s) connected`);
    return true;
  } catch (error) {
    throw new Error(`Failed to check devices: ${error.message}`);
  }
}

// Main function
function main() {
  try {
    // Find adb
    console.log('🔍 Looking for ADB...');
    const adbPath = findAdb();
    if (!adbPath) {
      throw new Error(
        'ADB not found. Please install Android SDK Platform Tools or add adb to your PATH.\n' +
        'Expected locations:\n' +
        `  - ${path.join(process.env.LOCALAPPDATA || '%LOCALAPPDATA%', 'Android', 'Sdk', 'platform-tools', 'adb.exe')}\n` +
        `  - ${path.join(process.env.ANDROID_HOME || '%ANDROID_HOME%', 'platform-tools', 'adb.exe')}`
      );
    }
    console.log(`✓ Found ADB at: ${adbPath}\n`);

    // Check device
    console.log('📱 Checking for connected devices...');
    checkDevice(adbPath);

    // Find latest APK
    console.log('📦 Finding latest APK...');
    const apkPath = findLatestApk();
    console.log(`✓ Found APK: ${path.basename(apkPath)}\n`);

    // Install APK
    console.log('📲 Installing APK on device...');
    execSync(`"${adbPath}" install -r -d "${apkPath}"`, { stdio: 'inherit' });
    console.log('\n✅ APK installed successfully!');
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    process.exit(1);
  }
}

main();

