# Configuration Guide

## API URLs

The app automatically uses different API URLs based on the build environment:

### 🛠️ Development Mode (Expo Go / Development Build)
- **Android Emulator:** `http://10.0.2.2:8080/api`
- **iOS Simulator:** `http://localhost:8080/api`
- **Web:** `http://localhost:8080/api`

### 🚀 Production Mode (Standalone APK/IPA)
- **All Platforms:** `http://172.31.235.136:8080/api` (EC2 Server)

## Overriding API URL

You can override the API URL by setting an environment variable:

```bash
# Create a .env file in the project root
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api
```

## For Physical Device Testing

If testing on a physical device during development:

1. Find your computer's local IP:
   - **Windows:** `ipconfig` → Look for IPv4 Address
   - **Mac/Linux:** `ifconfig` or `ip addr` → Look for inet

2. Create `.env` file:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8080/api
   ```

3. Restart the development server

## Environment Detection

The app detects the environment using:
- `Constants.appOwnership === 'standalone'` → Production (APK/IPA build)
- `Constants.appOwnership === 'expo'` → Development (Expo Go)

## How It Works

See `lib/config/environment.ts` for the implementation.

The configuration is automatically loaded when the app starts and logs the active environment to the console.

