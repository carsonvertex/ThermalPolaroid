import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // On web, NetInfo may not be available, assume online
    if (Platform.OS === 'web') {
      setIsOnline(true);
      return;
    }

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Return false if null (not yet checked) to be safe
  return isOnline ?? false;
}

