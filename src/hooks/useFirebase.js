import { useState, useEffect } from 'react';
import { testFirebaseConnection, isFirebaseInitialized } from '../config/firebase';

export function useFirebase() {
  const [connectionStatus, setConnectionStatus] = useState({
    initialized: isFirebaseInitialized,
    connected: false,
    error: null,
    testing: false
  });

  useEffect(() => {
    let mounted = true;

    async function checkConnection() {
      if (!mounted) return;
      
      setConnectionStatus(prev => ({ ...prev, testing: true }));
      
      const result = await testFirebaseConnection();
      
      if (mounted) {
        setConnectionStatus({
          initialized: isFirebaseInitialized,
          connected: result.connected,
          error: result.error,
          testing: false
        });
      }
    }

    // Initial check
    checkConnection();

    // Periodic connection check (every 30 seconds)
    const interval = setInterval(checkConnection, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return connectionStatus;
}