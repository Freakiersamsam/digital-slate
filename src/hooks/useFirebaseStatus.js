import { useState, useEffect } from 'react';
import firebaseWrapper from '../services/firebaseWrapper';

export function useFirebaseStatus() {
  const [status, setStatus] = useState({
    initialized: false,
    connected: false,
    error: null,
    isAvailable: false,
    lastChecked: null
  });

  useEffect(() => {
    let mounted = true;
    
    console.log('[useFirebaseStatus] Setting up Firebase status listener...');

    // Set up real-time status listener
    const unsubscribe = firebaseWrapper.addStatusListener((newStatus) => {
      if (mounted) {
        console.log('[useFirebaseStatus] Status update received:', newStatus);
        setStatus(newStatus);
      }
    });

    // Wait for initialization and get status
    firebaseWrapper.waitForInitialization().then((initialStatus) => {
      if (mounted) {
        console.log('[useFirebaseStatus] Initial status after initialization:', initialStatus);
        setStatus(initialStatus);
      }
    });

    // Still start periodic checks as fallback (but less frequent)
    firebaseWrapper.startPeriodicCheck(30000);

    return () => {
      console.log('[useFirebaseStatus] Cleaning up status listener...');
      mounted = false;
      unsubscribe();
      firebaseWrapper.stopPeriodicCheck();
    };
  }, []);

  return status;
}