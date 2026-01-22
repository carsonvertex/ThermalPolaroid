const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Detect Android SDK location from environment variables or common paths
 */
function detectAndroidSdkPath() {
  // Check ANDROID_HOME environment variable first
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }

  // Check ANDROID_SDK_ROOT (alternative env var)
  if (process.env.ANDROID_SDK_ROOT && fs.existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }

  // Check common default locations based on OS
  const platform = os.platform();
  const homeDir = os.homedir();
  
  const commonPaths = [];
  
  if (platform === 'win32') {
    // Windows paths
    const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
    commonPaths.push(
      path.join(localAppData, 'Android', 'Sdk'),
      path.join(homeDir, 'AppData', 'Local', 'Android', 'Sdk'),
      'C:\\Android\\Sdk',
      'C:\\Program Files\\Android\\Sdk'
    );
  } else if (platform === 'darwin') {
    // macOS paths
    const libraryDir = path.join(homeDir, 'Library');
    commonPaths.push(
      path.join(libraryDir, 'Android', 'sdk'),
      path.join(homeDir, 'Android', 'Sdk')
    );
  } else {
    // Linux paths
    commonPaths.push(
      path.join(homeDir, 'Android', 'Sdk'),
      path.join(homeDir, '.android', 'sdk'),
      '/opt/android-sdk',
      '/usr/lib/android-sdk'
    );
  }

  // Check each path until we find one that exists
  for (const sdkPath of commonPaths) {
    if (fs.existsSync(sdkPath)) {
      return sdkPath;
    }
  }

  return null;
}

/**
 * Format SDK path for local.properties file (Windows needs double backslashes)
 */
function formatSdkPathForProperties(sdkPath) {
  if (os.platform() === 'win32') {
    // Replace single backslashes with double backslashes for Windows
    return sdkPath.replace(/\\/g, '\\\\');
  }
  return sdkPath;
}

/**
 * Optimize gradle.properties for faster builds
 */
function optimizeGradleProperties(gradlePropertiesPath) {
  if (!fs.existsSync(gradlePropertiesPath)) {
    // If gradle.properties doesn't exist, create it with optimizations
    const optimizedContent = `# Project-wide Gradle settings optimized for faster builds

# JVM arguments for better performance
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Enable parallel execution
org.gradle.parallel=true

# Enable Gradle build cache for faster rebuilds
org.gradle.caching=true

# Configuration cache disabled: React Native/Expo run Node during config (incompatible)
org.gradle.configuration-cache=false

# Limit parallel workers to prevent overload
org.gradle.parallel.workers.max=4

# Use single architecture for debug builds (much faster)
# For release builds, use: armeabi-v7a,arm64-v8a,x86,x86_64
reactNativeArchitectures=arm64-v8a
`;
    fs.writeFileSync(gradlePropertiesPath, optimizedContent, 'utf8');
    console.log('✅ Created gradle.properties with build optimizations');
    return;
  }

  // Read existing file
  let content = fs.readFileSync(gradlePropertiesPath, 'utf8');
  let modified = false;

  // Check and optimize JVM args if not already optimized
  if (!content.includes('org.gradle.jvmargs=-Xmx4096m')) {
    // Update or add JVM args
    if (content.includes('org.gradle.jvmargs=')) {
      content = content.replace(
        /org\.gradle\.jvmargs=.*/g,
        'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8'
      );
    } else {
      content = `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8\n${content}`;
    }
    modified = true;
  }

  // Enable build cache if not present
  if (!content.includes('org.gradle.caching=')) {
    content += '\n# Enable Gradle build cache for faster rebuilds\norg.gradle.caching=true\n';
    modified = true;
  } else if (!content.includes('org.gradle.caching=true')) {
    content = content.replace(/org\.gradle\.caching=.*/g, 'org.gradle.caching=true');
    modified = true;
  }

  // Disable configuration cache (React Native/Expo run Node during config - incompatible)
  if (content.includes('org.gradle.configuration-cache=true')) {
    content = content.replace(/org\.gradle\.configuration-cache=.*/g, 'org.gradle.configuration-cache=false');
    modified = true;
  } else if (!content.includes('org.gradle.configuration-cache=')) {
    content += '\n# Configuration cache disabled: React Native/Expo run Node during config\norg.gradle.configuration-cache=false\n';
    modified = true;
  }

  // Set parallel workers if not present
  if (!content.includes('org.gradle.parallel.workers.max=')) {
    content += '\n# Limit parallel workers to prevent overload\norg.gradle.parallel.workers.max=4\n';
    modified = true;
  }

  // Optimize architecture for debug builds if not already customized
  // Only change if it includes all 4 architectures (indicating default/unoptimized)
  if (content.includes('reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64')) {
    content = content.replace(
      /reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64/g,
      '# For debug builds, only build for arm64-v8a (most common) to speed up compilation\n# For release builds, use all architectures: armeabi-v7a,arm64-v8a,x86,x86_64\nreactNativeArchitectures=arm64-v8a'
    );
    modified = true;
    console.log('✅ Optimized reactNativeArchitectures for faster debug builds');
  }

  if (modified) {
    fs.writeFileSync(gradlePropertiesPath, content, 'utf8');
    console.log('✅ Updated gradle.properties with build optimizations');
  }
}

/**
 * Expo Config Plugin to configure Android network security for HTTP (cleartext) traffic
 * This allows the app to connect to HTTP endpoints (not just HTTPS)
 * Also automatically creates local.properties file with Android SDK path
 * And optimizes gradle.properties for faster builds
 */
const withNetworkSecurityConfig = (config) => {
  // Step 0: Create local.properties file with Android SDK path
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      
      // Ensure the android directory exists
      if (!fs.existsSync(projectRoot)) {
        fs.mkdirSync(projectRoot, { recursive: true });
      }
      
      const localPropertiesPath = path.join(projectRoot, 'local.properties');

      // Always check and update SDK path to ensure it's correct
      const sdkPath = detectAndroidSdkPath();
      
      if (!sdkPath) {
        console.warn('⚠️  Could not detect Android SDK location. Please create android/local.properties manually or set ANDROID_HOME environment variable.');
      } else {
        const formattedPath = formatSdkPathForProperties(sdkPath);
        const localPropertiesContent = `sdk.dir=${formattedPath}\n`;
        
        // Check if file exists and content is correct
        let needsUpdate = true;
        if (fs.existsSync(localPropertiesPath)) {
          const existingContent = fs.readFileSync(localPropertiesPath, 'utf8');
          // Check if SDK path matches
          if (existingContent.includes(`sdk.dir=${formattedPath}`) || existingContent.includes(`sdk.dir=${sdkPath}`)) {
            needsUpdate = false;
          }
        }
        
        if (needsUpdate) {
          fs.writeFileSync(localPropertiesPath, localPropertiesContent, 'utf8');
          console.log(`✅ Created/Updated local.properties with SDK path: ${sdkPath}`);
        } else {
          console.log('ℹ️  local.properties already has correct SDK path');
        }
      }

      // Optimize gradle.properties for faster builds
      const gradlePropertiesPath = path.join(projectRoot, 'gradle.properties');
      optimizeGradleProperties(gradlePropertiesPath);

      return config;
    },
  ]);

  // Step 1: Create network_security_config.xml file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const resDir = path.join(projectRoot, 'app', 'src', 'main', 'res', 'xml');
      const networkSecurityConfigPath = path.join(resDir, 'network_security_config.xml');

      // Ensure the directory exists
      if (!fs.existsSync(resDir)) {
        fs.mkdirSync(resDir, { recursive: true });
      }

      // Create network_security_config.xml
      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext (HTTP) traffic for local development and private IP ranges -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    
    <!-- Specifically allow cleartext traffic to private IP ranges (172.16.0.0/12, 192.168.0.0/16, 10.0.0.0/8) -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">172.31.235.136</domain>
        <domain includeSubdomains="true">172.16.0.0</domain>
        <domain includeSubdomains="true">192.168.0.0</domain>
        <domain includeSubdomains="true">10.0.0.0</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
</network-security-config>`;

      fs.writeFileSync(networkSecurityConfigPath, networkSecurityConfig, 'utf8');
      console.log('✅ Created network_security_config.xml');

      return config;
    },
  ]);

  // Step 2: Modify AndroidManifest.xml to use the network security config
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      throw new Error('AndroidManifest.xml is missing <application> tag');
    }

    const application = manifest.application[0];
    
    // Add usesCleartextTraffic attribute
    if (!application.$) {
      application.$ = {};
    }
    application.$['android:usesCleartextTraffic'] = 'true';
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    console.log('✅ Updated AndroidManifest.xml with network security config');

    return config;
  });

  return config;
};

module.exports = withNetworkSecurityConfig;
