# Troubleshooting Guide - RC POS

Complete troubleshooting guide for network connectivity, backend connections, and Android device issues.

---

## Table of Contents

1. [Network Connectivity Issues](#network-connectivity-issues)
2. [Backend Connection Problems](#backend-connection-problems)
3. [Sunmi Device Specific Issues](#sunmi-device-specific-issues)
4. [Android HTTP Configuration](#android-http-configuration)
5. [Quick Diagnostic Steps](#quick-diagnostic-steps)

---

## Network Connectivity Issues

### Problem: "Network Request Failed" on Production APK

**Root Cause:** Using EC2's **private IP** (`172.31.235.136`) which is only accessible within AWS network. External devices need the **public IP** instead.

**Solution:**

1. **Get EC2 Public IP:**
   ```bash
   ssh -i your-key.pem ec2-user@YOUR_EC2_IP
   curl http://checkip.amazonaws.com
   # Example output: 54.255.118.185
   ```

2. **Update Configuration:**
   Edit `lib/config/environment.ts`:
   ```typescript
   if (isProduction) {
     return 'http://YOUR_PUBLIC_IP:8080/api'; // Use PUBLIC IP
   }
   ```

3. **Verify Security Group:**
   - AWS Console → EC2 → Security Groups
   - Inbound Rules → Add: TCP 8080 from 0.0.0.0/0

4. **Test Backend Accessibility:**
   ```bash
   curl http://YOUR_PUBLIC_IP:8080/swagger-ui.html
   ```

### IP Address Types

```
172.31.x.x  → Private IP ❌ (Only works within AWS)
10.0.x.x    → Private IP ❌ (Local network)
192.168.x.x → Private IP ❌ (Local network)

54.x.x.x    → Public IP ✅
13.x.x.x    → Public IP ✅
18.x.x.x    → Public IP ✅
52.x.x.x    → Public IP ✅
```

---

## Backend Connection Problems

### Android Emulator Connection Issues

**Problem:** Android emulator can't reach backend running on host machine.

**Solution:**

1. **Backend Configuration:**
   Ensure `application.properties` has:
   ```properties
   server.port=8080
   server.address=0.0.0.0  # Allows connections from all interfaces
   ```

2. **App Configuration:**
   The app automatically uses:
   - **Android Emulator:** `http://10.0.2.2:8080/api`
   - **iOS Simulator:** `http://localhost:8080/api`
   - **Physical Devices:** Set `EXPO_PUBLIC_API_URL` environment variable

3. **Windows Firewall:**
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "Spring Boot Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   ```

4. **Test Backend:**
   ```powershell
   # Check if backend is running
   Get-Process java
   netstat -ano | findstr ":8080"
   
   # Test from browser
   http://localhost:8080/swagger-ui.html
   ```

### Physical Device Connection

For physical Android devices:

1. **Find your computer's IP:**
   ```powershell
   ipconfig | findstr IPv4
   # Example: 192.168.1.100
   ```

2. **Create `.env.local` file:**
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api
   ```

3. **Ensure same Wi-Fi network:**
   - Device and computer must be on same network
   - Backend must be bound to `0.0.0.0`

---

## Sunmi Device Specific Issues

### Common Issues & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **AP Isolation** | Router prevents device communication | Disable "AP Isolation" in router settings |
| **Android 9+ HTTP Block** | Cleartext traffic blocked | Already configured ✅ (see Android HTTP Configuration) |
| **Local Network Permission** | Android 10+ restriction | Add `LOCAL_NETWORK` permission to manifest |
| **MDM/Proxy** | Corporate policy blocking | Disable VPN/proxy in device settings |
| **Port Blocked** | Router firewall | Open port 8080 in router firewall |
| **Firmware Restriction** | Sunmi kiosk mode | Use standard ports (80/443) or root device |

### AP Isolation / Client Isolation

**Symptoms:**
- Other devices can ping the Sunmi device
- Sunmi device cannot ping other devices or server
- Connection works from other devices but not from Sunmi

**Solution:**
1. Access router admin panel (usually `192.168.1.1`)
2. Look for: "AP Isolation", "Client Isolation", "Wireless Isolation"
3. **Disable** this feature
4. Save and restart router
5. Reconnect Sunmi device to Wi-Fi

**Router Locations:**
- **TP-Link:** Wireless → Advanced → AP Isolation
- **Netgear:** Advanced → Wireless Settings → AP Isolation
- **Linksys:** Wireless → Advanced Wireless Settings → AP Isolation
- **ASUS:** Wireless → Professional → AP Isolation

### Android 10+ Local Network Permission

**For Android 10 (API 29):**
```xml
<manifest>
    <uses-permission android:name="android.permission.LOCAL_NETWORK" />
</manifest>
```

**For Android 11-12 (API 30-31):**
```xml
<manifest>
    <uses-permission 
        android:name="android.permission.LOCAL_NETWORK"
        android:usesPermissionFlags="neverForLocation" />
</manifest>
```

**For Android 13+ (API 33+):**
```xml
<manifest>
    <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />
</manifest>
```

---

## Android HTTP Configuration

### Problem

Android 9 (API 28) and above blocks cleartext (HTTP) traffic by default for security reasons.

### Solution

The app is already configured! ✅

**Configuration Files:**

1. **AndroidManifest.xml** (`android/app/src/main/AndroidManifest.xml`):
   ```xml
   <application
       android:usesCleartextTraffic="true"
       android:networkSecurityConfig="@xml/network_security_config"
       ...>
   ```

2. **Network Security Config** (`android/app/src/main/res/xml/network_security_config.xml`):
   ```xml
   <network-security-config>
       <base-config cleartextTrafficPermitted="true">
           <trust-anchors>
               <certificates src="system" />
               <certificates src="user" />
           </trust-anchors>
       </base-config>
   </network-security-config>
   ```

### Verification

```bash
# Check AndroidManifest.xml
cat android/app/src/main/AndroidManifest.xml | grep usesCleartextTraffic
# Should show: android:usesCleartextTraffic="true"

# Check network security config
cat android/app/src/main/res/xml/network_security_config.xml
# Should show cleartextTrafficPermitted="true"
```

### Rebuilding

After making changes:
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Testing

```bash
# Check device logs for cleartext errors
adb logcat | grep -i cleartext
# Should NOT show "Cleartext HTTP traffic not permitted" errors
```

---

## Quick Diagnostic Steps

### Step 1: Check Network Connectivity

```bash
# From device (using ADB or terminal app)
ping 8.8.8.8
# Should get responses if internet works

ping YOUR_SERVER_IP
# Should get responses if server is reachable
```

### Step 2: Check Port Accessibility

```bash
# From device
curl http://YOUR_SERVER_IP:8080/api/health
# Should return data, not timeout
```

### Step 3: Check Backend Status

```bash
# SSH into EC2
ssh ec2-user@YOUR_EC2_IP

# Check if backend is running
sudo systemctl status pos-backend

# Or check port
sudo lsof -i :8080

# Check logs
tail -f app.log
```

### Step 4: Check Router Settings

1. Access router admin panel
2. Check AP Isolation status
3. Check firewall rules
4. Check port forwarding rules

### Step 5: Check Android Permissions

1. Settings → Apps → [Your App] → Permissions
2. Ensure network permissions are granted
3. Check if any restrictions are applied

---

## Common Error Messages

### "Network request failed"
- **Cause:** Usually AP Isolation or firewall blocking
- **Fix:** Check router settings (disable AP Isolation, open firewall)

### "Connection timeout"
- **Cause:** Port blocked or server unreachable
- **Fix:** Check port forwarding and firewall

### "Failed to fetch"
- **Cause:** Android network permission missing
- **Fix:** Add LOCAL_NETWORK permission

### "Connection refused"
- **Cause:** Port blocked by firmware or firewall
- **Fix:** Use standard ports (80/443) or configure firewall

### "Cleartext HTTP traffic not permitted"
- **Cause:** Android 9+ blocking HTTP
- **Fix:** Already configured ✅ (verify network_security_config.xml exists)

---

## Prevention Tips

1. **Use Standard Ports:** Configure backend to use 80/443 when possible
2. **Check Router Settings:** Disable AP Isolation before deployment
3. **Request Permissions:** Always request LOCAL_NETWORK permission in manifest
4. **Test Early:** Test network connectivity during development, not production
5. **Document Network:** Keep record of router settings and IP configurations
6. **Use Public IP:** For external devices, always use public IP, not private IP

---

## Still Having Issues?

1. **Check device logs:**
   ```bash
   adb logcat | grep -i network
   adb logcat | grep -i connection
   ```

2. **Test with different network:**
   - Try mobile hotspot
   - Try different Wi-Fi network
   - Try different router

3. **Contact Support:**
   - Provide device model and Android version
   - Provide router brand and model
   - Provide error logs and network configuration

---

## Related Documentation

- [SUNMI-FIX-SUMMARY.md](./SUNMI-FIX-SUMMARY.md) - Summary of fixes applied for Sunmi devices
- [RELEASE-APK-GUIDE.md](./RELEASE-APK-GUIDE.md) - Guide for building release APKs
- [expo-build.md](./expo-build.md) - EAS build documentation

