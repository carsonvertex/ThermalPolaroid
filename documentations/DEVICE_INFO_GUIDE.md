# Getting Device Information in React Native/Expo

Guide for getting unique device ID, IP address, and other device information in your React Native app.

---

## Method 1: Using expo-device (Recommended)

### Installation

```bash
npx expo install expo-device
```

### Get Device Information

```typescript
import * as Device from 'expo-device';

// Get various device info
const deviceInfo = {
  brand: Device.brand,              // e.g., "Honeywell"
  manufacturer: Device.manufacturer, // e.g., "Honeywell"
  modelName: Device.modelName,      // e.g., "CT40"
  modelId: Device.modelId,
  deviceName: Device.deviceName,    // User-defined device name
  osName: Device.osName,            // "Android"
  osVersion: Device.osVersion,      // "11"
  platformApiLevel: Device.platformApiLevel, // Android API level
};

console.log('Device Info:', deviceInfo);
```

---

## Method 2: Get IP Address

### Installation

```bash
npx expo install @react-native-community/netinfo
```

### Get IP Address

```typescript
import NetInfo from '@react-native-community/netinfo';

// Get network information including IP
const getIPAddress = async () => {
  const state = await NetInfo.fetch();
  
  console.log('Connection type:', state.type);
  console.log('Is connected?:', state.isConnected);
  console.log('IP Address:', state.details?.ipAddress);
  
  return state.details?.ipAddress;
};

// Use it
const ip = await getIPAddress();
console.log('Device IP:', ip);
```

---

## Method 3: Get Unique Device ID

### Using expo-application

```bash
npx expo install expo-application
```

```typescript
import * as Application from 'expo-application';

// Android Installation ID (unique per app install)
const androidId = Application.getAndroidId();
console.log('Android ID:', androidId);

// iOS Identifier for Vendor (IDFV)
const iosId = Application.getIosIdForVendorAsync();
console.log('iOS ID:', iosId);
```

---

## Complete Example: Device Info Hook

Create a custom hook to get all device information:

```typescript
// hooks/useDeviceInfo.ts
import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

interface DeviceInfo {
  deviceId: string | null;
  ipAddress: string | null;
  brand: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  isConnected: boolean | null;
}

export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceId: null,
    ipAddress: null,
    brand: null,
    modelName: null,
    osName: null,
    osVersion: null,
    isConnected: null,
  });

  useEffect(() => {
    const getDeviceInfo = async () => {
      // Get network info
      const netInfo = await NetInfo.fetch();
      
      // Get device ID
      let deviceId = null;
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId();
      } else {
        deviceId = await Application.getIosIdForVendorAsync();
      }

      setDeviceInfo({
        deviceId,
        ipAddress: netInfo.details?.ipAddress || null,
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        isConnected: netInfo.isConnected,
      });
    };

    getDeviceInfo();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setDeviceInfo(prev => ({
        ...prev,
        ipAddress: state.details?.ipAddress || null,
        isConnected: state.isConnected,
      }));
    });

    return () => unsubscribe();
  }, []);

  return deviceInfo;
};
```

### Using the Hook in a Component

```tsx
// app/(tabs)/dashboard.tsx
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { View, Text } from 'react-native';

export default function DashboardScreen() {
  const deviceInfo = useDeviceInfo();

  return (
    <View>
      <Text>Device ID: {deviceInfo.deviceId}</Text>
      <Text>IP Address: {deviceInfo.ipAddress}</Text>
      <Text>Brand: {deviceInfo.brand}</Text>
      <Text>Model: {deviceInfo.modelName}</Text>
      <Text>OS: {deviceInfo.osName} {deviceInfo.osVersion}</Text>
      <Text>Connected: {deviceInfo.isConnected ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

---

## Method 4: Send Device Info to Backend

```typescript
// utils/registerDevice.ts
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export const registerDevice = async () => {
  try {
    // Gather device info
    const netInfo = await NetInfo.fetch();
    
    const deviceData = {
      deviceId: Platform.OS === 'android' 
        ? Application.getAndroidId() 
        : await Application.getIosIdForVendorAsync(),
      ipAddress: netInfo.details?.ipAddress,
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      appVersion: Application.nativeApplicationVersion,
      buildVersion: Application.nativeBuildVersion,
      timestamp: new Date().toISOString(),
    };

    // Send to your backend
    const response = await fetch('https://your-api.com/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });

    const result = await response.json();
    console.log('Device registered:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to register device:', error);
    throw error;
  }
};
```

---

## Method 5: Store Device ID in Secure Storage

```typescript
// utils/deviceStorage.ts
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'device_id';

export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId();
      } else {
        deviceId = await Application.getIosIdForVendorAsync();
      }
      
      // Store it securely
      if (deviceId) {
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      }
    }
    
    return deviceId || 'unknown';
  } catch (error) {
    console.error('Error getting device ID:', error);
    return 'unknown';
  }
};

// Get device ID with fallback
export const getDeviceIdentifier = async (): Promise<string> => {
  const deviceId = await getOrCreateDeviceId();
  
  // Create a composite identifier
  const identifier = `${Device.brand}-${Device.modelName}-${deviceId}`;
  
  return identifier;
};
```

---

## Method 6: Complete Device Info Component

```tsx
// components/DeviceInfoDisplay.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export const DeviceInfoDisplay = () => {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const fetchInfo = async () => {
      const netInfo = await NetInfo.fetch();
      
      const deviceInfo = {
        // Unique Identifiers
        androidId: Platform.OS === 'android' ? Application.getAndroidId() : 'N/A',
        
        // Network Info
        ipAddress: netInfo.details?.ipAddress || 'Unknown',
        subnet: netInfo.details?.subnet || 'Unknown',
        isConnected: netInfo.isConnected ? 'Yes' : 'No',
        connectionType: netInfo.type,
        
        // Device Info
        brand: Device.brand || 'Unknown',
        manufacturer: Device.manufacturer || 'Unknown',
        modelName: Device.modelName || 'Unknown',
        modelId: Device.modelId || 'Unknown',
        deviceName: Device.deviceName || 'Unknown',
        
        // OS Info
        osName: Device.osName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        platformApiLevel: Device.platformApiLevel || 'Unknown',
        
        // App Info
        appVersion: Application.nativeApplicationVersion || 'Unknown',
        buildVersion: Application.nativeBuildVersion || 'Unknown',
        bundleId: Application.applicationId || 'Unknown',
      };
      
      setInfo(deviceInfo);
    };

    fetchInfo();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Device Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unique Identifiers</Text>
        <Text style={styles.item}>Android ID: {info.androidId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <Text style={styles.item}>IP Address: {info.ipAddress}</Text>
        <Text style={styles.item}>Subnet: {info.subnet}</Text>
        <Text style={styles.item}>Connected: {info.isConnected}</Text>
        <Text style={styles.item}>Type: {info.connectionType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device</Text>
        <Text style={styles.item}>Brand: {info.brand}</Text>
        <Text style={styles.item}>Manufacturer: {info.manufacturer}</Text>
        <Text style={styles.item}>Model: {info.modelName}</Text>
        <Text style={styles.item}>Device Name: {info.deviceName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operating System</Text>
        <Text style={styles.item}>OS: {info.osName}</Text>
        <Text style={styles.item}>Version: {info.osVersion}</Text>
        <Text style={styles.item}>API Level: {info.platformApiLevel}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        <Text style={styles.item}>Version: {info.appVersion}</Text>
        <Text style={styles.item}>Build: {info.buildVersion}</Text>
        <Text style={styles.item}>Bundle ID: {info.bundleId}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  item: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});
```

---

## Quick Implementation Steps

### 1. Install dependencies

```bash
npx expo install expo-device expo-application @react-native-community/netinfo
```

### 2. Create the hook

Create `hooks/useDeviceInfo.ts` with the code from above.

### 3. Use in your component

```tsx
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

const deviceInfo = useDeviceInfo();
console.log('Device ID:', deviceInfo.deviceId);
console.log('IP Address:', deviceInfo.ipAddress);
```

---

## Package Comparison

| Package | What it provides | Best for |
|---------|-----------------|----------|
| `expo-device` | Brand, model, OS info | Device hardware info |
| `expo-application` | Android ID, app version | Unique device ID |
| `@react-native-community/netinfo` | IP, connection type | Network information |
| `expo-secure-store` | Secure storage | Storing device ID |

---

## Important Notes

### Android ID
- Unique per app installation
- Changes if app is uninstalled and reinstalled
- Different for each app on same device

### IP Address
- Changes when device connects to different networks
- May be unavailable if not connected
- Can be IPv4 or IPv6

### Privacy Considerations
- Always inform users about data collection
- Store device IDs securely
- Comply with privacy regulations (GDPR, etc.)

---

**Created:** November 4, 2025  
**Project:** RC-POS  
**Device:** Honeywell Handheld (Android)


