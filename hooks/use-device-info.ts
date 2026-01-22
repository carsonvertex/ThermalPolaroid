import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface DeviceInfo {
  deviceId: string | null;
  deviceIdSource: 'native' | 'generated' | 'stored' | null; // Track source of device ID
  ipAddress: string | null;
  brand: string | null;
  modelName: string | null;
  osName: string | null;
  osVersion: string | null;
  isConnected: boolean | null;
}

// Storage key for persistent device ID
const DEVICE_ID_STORAGE_KEY = '@pos_device_id';

// Lazy load modules to handle missing native modules gracefully
let Device: any = null;
let Application: any = null;
let NetInfo: any = null;

try {
  Device = require('expo-device');
} catch (e) {
  console.log('expo-device not available (dev mode)');
}

try {
  Application = require('expo-application');
} catch (e) {
  console.log('expo-application not available (dev mode)');
}

try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  console.log('@react-native-community/netinfo not available');
}

export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceId: null,
    deviceIdSource: null,
    ipAddress: null,
    brand: null,
    modelName: null,
    osName: null,
    osVersion: null,
    isConnected: null,
  });

  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        // Get network info
        let netInfo = null;
        if (NetInfo) {
          netInfo = await NetInfo.fetch();
        }
        
        // Get device ID - try to get from storage first, then from native, then generate and store
        let deviceId = null;
        let deviceIdSource: 'native' | 'generated' | 'stored' | null = null;
        
        // First, try to get from persistent storage
        try {
          const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
          // const storedDeviceId = 'c2ba6990c8ed4661';
          if (storedDeviceId) {
            deviceId = storedDeviceId;
            deviceIdSource = 'stored';
            console.log('📱 Using stored device ID:', deviceId);
            console.log('📱 Device ID Source: Stored (may be from native or generated previously)');
          }
        } catch (error) {
          console.warn('Failed to read device ID from storage:', error);
        }
        
        // If not in storage, try to get from native module
        if (!deviceId && Application) {
          try {
            if (Platform.OS === 'android') {
              deviceId = Application.getAndroidId();
              if (deviceId) {
                deviceIdSource = 'native';
                console.log('📱 Got Android ID (native, unique per device):', deviceId);
              }
            } else if (Platform.OS === 'ios') {
              deviceId = await Application.getIosIdForVendorAsync();
              if (deviceId) {
                deviceIdSource = 'native';
                console.log('📱 Got iOS ID for Vendor (native, unique per app vendor):', deviceId);
              }
            }
            
            // Store the native device ID for future use
            if (deviceId) {
              try {
                await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
                console.log('📱 Stored native device ID for future use');
              } catch (error) {
                console.warn('Failed to store device ID:', error);
              }
            }
          } catch (error) {
            console.warn('Failed to get native device ID:', error);
          }
        }
        
        // If still no device ID, generate one and store it persistently
        // NOTE: This only happens in dev/emulator when native modules are unavailable
        if (!deviceId) {
          // Generate a persistent device ID (fallback for dev/emulator only)
          deviceId = 'dev-device-' + Math.random().toString(36).substr(2, 9);
          deviceIdSource = 'generated';
          
          // Store it for future use
          try {
            await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
            console.warn('⚠️ Generated fallback device ID (dev/emulator mode):', deviceId);
            console.warn('⚠️ On real devices, this uses native Android ID or iOS ID for Vendor');
          } catch (error) {
            console.warn('Failed to store generated device ID:', error);
          }
        }

        setDeviceInfo({
          deviceId,
          deviceIdSource,
          ipAddress: netInfo?.details?.ipAddress || '10.0.2.2',
          brand: Device?.brand || 'Emulator',
          modelName: Device?.modelName || 'Development Device',
          osName: Device?.osName || Platform.OS,
          osVersion: Device?.osVersion || 'Unknown',
          isConnected: netInfo?.isConnected ?? true,
        });
        
        // Log IP address info (for reference only - NOT used for device identification)
        if (netInfo?.details?.ipAddress) {
          console.log('🌐 Device IP Address:', netInfo.details.ipAddress);
          console.log('⚠️ NOTE: IP address changes with network and is NOT unique per device');
          console.log('⚠️ Using native device ID (Android ID / iOS ID for Vendor) for whitelisting');
        }
      } catch (error) {
        console.error('Error fetching device info:', error);
        
        // Try to get device ID from storage as fallback
        let fallbackDeviceId = 'dev-device-fallback';
        try {
          const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
          if (storedDeviceId) {
            fallbackDeviceId = storedDeviceId;
          } else {
            // Generate and store a new one
            fallbackDeviceId = 'dev-device-' + Math.random().toString(36).substr(2, 9);
            await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, fallbackDeviceId);
          }
        } catch (storageError) {
          console.warn('Failed to get device ID from storage:', storageError);
        }
        
        // Set fallback values
        setDeviceInfo({
          deviceId: fallbackDeviceId,
          deviceIdSource: fallbackDeviceId.startsWith('dev-device-') ? 'generated' : 'stored',
          ipAddress: '10.0.2.2',
          brand: 'Emulator',
          modelName: 'Development Device',
          osName: Platform.OS,
          osVersion: 'Unknown',
          isConnected: true,
        });
      }
    };

    getDeviceInfo();

    // Subscribe to network changes if NetInfo is available
    let unsubscribe: (() => void) | undefined;
    if (NetInfo) {
      unsubscribe = NetInfo.addEventListener((state: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          ipAddress: state.details?.ipAddress || prev.ipAddress,
          isConnected: state.isConnected,
        }));
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return deviceInfo;
};


