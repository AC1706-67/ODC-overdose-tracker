import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web platform network detection
      const updateOnlineStatus = () => {
        setIsOnline(navigator.onLine);
      };

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      // Set initial status
      updateOnlineStatus();

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    } else {
      // For mobile platforms, you would use @react-native-netinfo/netinfo
      // For now, we'll assume online for mobile
      setIsOnline(true);
    }
  }, []);

  return { isOnline };
}