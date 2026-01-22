# Expo Config Plugins

This directory contains custom Expo config plugins that modify the native Android/iOS projects during the prebuild process.

## with-network-security-config.js

This plugin automatically configures Android network security to allow HTTP (cleartext) traffic, which is required for connecting to local development servers and private IP addresses.

### What it does:

1. **Creates `network_security_config.xml`** in `android/app/src/main/res/xml/`
   - Allows cleartext HTTP traffic
   - Specifically allows connections to private IP ranges (172.x.x.x, 192.168.x.x, 10.x.x.x)
   - Includes your production server IP (172.31.235.136)

2. **Updates `AndroidManifest.xml`**
   - Adds `android:usesCleartextTraffic="true"`
   - Adds `android:networkSecurityConfig="@xml/network_security_config"`

### Why this is needed:

Android 9 (API level 28) and higher blocks cleartext (HTTP) traffic by default for security. This plugin ensures your app can connect to HTTP endpoints during development and to servers on private networks.

### Usage:

The plugin is automatically applied when you run:
- `npx expo prebuild`
- `npm run android`
- `expo run:android`

No manual configuration needed - it's already added to `app.json` plugins array.

### Files modified:

- `android/app/src/main/res/xml/network_security_config.xml` (created)
- `android/app/src/main/AndroidManifest.xml` (modified)
