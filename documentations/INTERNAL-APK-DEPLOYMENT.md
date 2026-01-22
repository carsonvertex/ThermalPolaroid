# Internal APK Deployment Guide

Complete guide for setting up internal APK distribution without using USB transfers or Play Store.

---

## Overview

This solution allows you to deploy APK updates to Sunmi devices (or any Android devices) over the network through your existing Java backend server. Devices can check for updates and download/install them directly from the app.

---

## Architecture

```
┌─────────────────┐
│  Java Backend   │
│  (Port 8080)    │
│                 │
│  /api/app-update│
│  - /check       │
│  - /latest      │
│  - /download    │
└────────┬────────┘
         │
         │ HTTP
         │
┌────────▼────────┐
│  APK Directory  │
│  ./apk-distribution│
│                 │
│  app-release.apk│
└─────────────────┘
         │
         │ Download
         │
┌────────▼────────┐
│  Sunmi Device   │
│  (React Native) │
│                 │
│  Settings Screen│
│  Update Checker │
└─────────────────┘
```

---

## Backend Setup

### 1. Create APK Distribution Directory

Create a directory where you'll store APK files:

```bash
# On your server (where Java backend runs)
cd /path/to/RC-POS-Backends
mkdir -p apk-distribution
```

**Windows:**
```powershell
cd C:\xampp\htdocs\RC-POS-Backends
mkdir apk-distribution
```

### 2. Configure APK Directory

The APK directory is already configured in `application.properties`:

```properties
# App Update / APK Distribution Configuration
app.update.apk.directory=./apk-distribution
app.update.apk.filename.pattern=app-release\.apk
```

**To use a different directory:**
- **Relative path:** `./apk-distribution` (relative to where the JAR runs)
- **Absolute path:** `/var/www/apk-distribution` (Linux) or `C:\apk-distribution` (Windows)

### 3. Upload APK Files

After building your APK, copy it to the distribution directory:

```bash
# Build APK (from rc-pos directory)
cd C:\xampp\htdocs\rc-pos
npm run build:apk

# Copy to distribution directory
cp android/app/build/outputs/apk/release/app-release.apk \
   ../RC-POS-Backends/apk-distribution/app-release.apk
```

**Windows:**
```powershell
# Build APK
cd C:\xampp\htdocs\rc-pos
npm run build:apk

# Copy to distribution directory
Copy-Item android\app\build\outputs\apk\release\app-release.apk `
          ..\RC-POS-Backends\apk-distribution\app-release.apk
```

### 4. Restart Backend Server

After adding APK files, restart your Java backend server:

```bash
# Linux
sudo systemctl restart pos-backend

# Or if running manually
./mvnw spring-boot:run
```

---

## Backend API Endpoints

### Check for Updates

**GET** `/api/app-update/check?currentVersionCode=3&currentVersionName=1.0.0`

**Response:**
```json
{
  "success": true,
  "data": {
    "updateAvailable": true,
    "latestVersion": {
      "versionCode": 4,
      "versionName": "1.0.1",
      "filename": "app-release.apk",
      "fileSize": 136000000,
      "lastModified": 1704067200000
    },
    "currentVersion": {
      "versionCode": 3,
      "versionName": "1.0.0"
    },
    "downloadUrl": "/api/app-update/download",
    "filename": "app-release.apk",
    "fileSize": 136000000
  }
}
```

### Get Latest Version Info

**GET** `/api/app-update/latest`

**Response:**
```json
{
  "success": true,
  "data": {
    "versionCode": 4,
    "versionName": "1.0.1",
    "filename": "app-release.apk",
    "fileSize": 136000000,
    "lastModified": 1704067200000,
    "downloadUrl": "/api/app-update/download"
  }
}
```

### Download APK

**GET** `/api/app-update/download`

Returns the APK file as binary download.

---

## Frontend Usage

### Automatic Update Check

The app automatically checks for updates when you open the Settings screen.

### Manual Update Check

1. Open the app
2. Go to **Settings** tab
3. Scroll to **App Update** card
4. Tap **"Check for Updates"**

### Download and Install Update

1. If an update is available, you'll see:
   - Latest version number
   - File size
   - Download button

2. Tap **"Download & Install Update"**

3. The app will:
   - Download the APK file
   - Show download progress
   - Automatically open the Android installer
   - Prompt you to install

4. Follow the installation prompts on your device

---

## Version Management

### Update Version in app.json

Before building a new APK, update the version:

```json
{
  "expo": {
    "version": "1.0.1",  // User-visible version
    "android": {
      "versionCode": 4  // Must increment for each release
    }
  }
}
```

**Important:**
- `versionCode` must be **higher** than the previous version
- `versionName` can be any string (e.g., "1.0.1", "2.0.0-beta")

### Build and Deploy Workflow

1. **Update version** in `app.json`
2. **Build APK:**
   ```bash
   npm run build:apk
   ```
3. **Copy APK** to distribution directory:
   ```bash
   cp android/app/build/outputs/apk/release/app-release.apk \
      ../RC-POS-Backends/apk-distribution/app-release.apk
   ```
4. **Restart backend** (if needed)
5. **Devices will detect** the update on next check

---

## APK Naming Conventions

The backend automatically finds the latest APK file by modification time. You can use any naming convention:

**Recommended:**
- `app-release.apk` (simple, overwrite on each update)
- `app-release-v1.0.1-code4.apk` (includes version info)
- `rc-pos-1.0.1.apk` (descriptive)

**Version Extraction:**
The backend tries to extract version info from filenames:
- Pattern: `v1.0.1` → versionName: "1.0.1"
- Pattern: `code4` → versionCode: 4
- Pattern: `version123` → versionCode: 123

If no version info is found in filename, it uses file modification time.

---

## Security Considerations

### Network Security

- The backend serves APKs over HTTP (not HTTPS by default)
- For production, consider:
  - Using HTTPS with SSL certificate
  - Adding authentication to update endpoints
  - Restricting access by device ID

### APK Signing

- Always sign your APK with a release keystore
- Devices can only install updates signed with the same key
- See [RELEASE-APK-GUIDE.md](./RELEASE-APK-GUIDE.md) for signing setup

### File Access

- The backend validates that requested files are within the APK directory
- Path traversal attacks are prevented

---

## Troubleshooting

### "No APK files found"

**Problem:** Backend can't find APK files.

**Solutions:**
1. Check APK directory path in `application.properties`
2. Verify APK file exists in the directory
3. Check file permissions (readable by Java process)
4. Restart backend server

### "Download failed"

**Problem:** App can't download APK.

**Solutions:**
1. Check network connection
2. Verify backend URL is correct
3. Check backend logs for errors
4. Ensure backend is accessible from device network

### "Installation failed"

**Problem:** APK won't install after download.

**Solutions:**
1. Check if APK is signed correctly
2. Verify device allows "Install from Unknown Sources"
3. Check if APK is for the same package name
4. Try manual installation: download APK and install via file manager

### "Update not detected"

**Problem:** App shows "up to date" but new version exists.

**Solutions:**
1. Verify `versionCode` in new APK is higher than current
2. Check backend is serving the latest APK
3. Clear app cache and check again
4. Verify version info extraction from filename

### Backend 404 Error

**Problem:** `/api/app-update/*` endpoints return 404.

**Solutions:**
1. Verify `AppUpdateController.java` is compiled
2. Check package structure matches controller location
3. Restart backend server
4. Check Swagger UI: `http://your-server:8080/swagger-ui.html`

---

## Advanced Configuration

### Custom APK Directory

Edit `application.properties`:

```properties
# Absolute path (Linux)
app.update.apk.directory=/var/www/apk-distribution

# Absolute path (Windows)
app.update.apk.directory=C:\apk-distribution

# Relative to JAR location
app.update.apk.directory=./apk-distribution
```

### Multiple APK Versions

The backend serves the **most recently modified** APK file. To keep multiple versions:

1. Use versioned filenames: `app-v1.0.0.apk`, `app-v1.0.1.apk`
2. The latest file (by modification time) will be served
3. Or implement version selection in the controller

### Automatic Update Checks

To check for updates automatically on app start:

1. Add update check to `app/index.tsx` or `app/_layout.tsx`
2. Show notification if update available
3. Optionally auto-download in background

---

## Testing

### Test Update Check

```bash
# From device or computer
curl "http://your-server:8080/api/app-update/check?currentVersionCode=1&currentVersionName=1.0.0"
```

### Test Download

```bash
# Download APK
curl -O "http://your-server:8080/api/app-update/download"
```

### Test from App

1. Install app with version 1.0.0 (versionCode: 1)
2. Upload APK with version 1.0.1 (versionCode: 2) to backend
3. Open Settings in app
4. Should show update available

---

## Workflow Summary

### Initial Setup (One-time)

1. ✅ Backend already has `AppUpdateController` and `AppUpdateService`
2. ✅ Create `apk-distribution` directory
3. ✅ Configure directory path in `application.properties`
4. ✅ Restart backend

### Regular Deployment

1. **Update version** in `app.json`
2. **Build APK:** `npm run build:apk`
3. **Copy APK** to `apk-distribution/` directory
4. **Devices check** for updates automatically
5. **Users download** and install from Settings screen

---

## Benefits

✅ **No USB required** - Updates over network  
✅ **No Play Store needed** - Internal distribution  
✅ **Automatic detection** - Devices check for updates  
✅ **One-click install** - Download and install from app  
✅ **Version management** - Automatic version comparison  
✅ **Progress tracking** - See download progress  
✅ **Centralized** - All APKs in one place  

---

## Related Documentation

- [RELEASE-APK-GUIDE.md](./RELEASE-APK-GUIDE.md) - Building APKs
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General troubleshooting
- [sunmi.md](./sunmi.md) - Sunmi device setup

---

## Summary

You now have a complete internal APK distribution system:

1. **Backend** serves APKs via REST API
2. **Frontend** checks for updates automatically
3. **Users** download and install with one tap
4. **No USB or Play Store** required!

Just build your APK, copy it to the distribution directory, and devices will detect it automatically! 🚀

