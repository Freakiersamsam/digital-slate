
// Simple Firebase configuration
let app = null;
let database = null;
let auth = null;
let analytics = null;
let isFirebaseInitialized = false;
let isOfflineMode = false;

// Check if Firebase should be enabled
const shouldEnableFirebase = () => {
  // Enable Firebase in production or when explicitly enabled in development
  return import.meta.env.PROD || import.meta.env.VITE_ENABLE_FIREBASE === 'true';
};

// Get Firebase configuration
const getFirebaseConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
  };
};

// Validate Firebase configuration
const validateFirebaseConfig = (config) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
  const missingFields = requiredFields.filter(field => !config[field]);
  return missingFields.length === 0 ? null : missingFields;
};

// Initialize Firebase
let initializationPromise = null;

const initializeFirebase = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('[Firebase] Starting initialization...');

      // Check if Firebase should be enabled
      if (!shouldEnableFirebase()) {
        console.log('[Firebase] Firebase disabled in development mode');
        isOfflineMode = true;
        return {
          success: false,
          error: 'Firebase disabled in development mode',
          offline: true
        };
      }

      // Get and validate configuration
      const config = getFirebaseConfig();
      const missingFields = validateFirebaseConfig(config);
      
      if (missingFields) {
        console.warn('[Firebase] Missing configuration fields:', missingFields);
        isOfflineMode = true;
        return {
          success: false,
          error: `Missing Firebase config: ${missingFields.join(', ')}`,
          offline: true
        };
      }

      // Dynamic import of Firebase modules
      const { initializeApp } = await import('firebase/app');
      const { getDatabase } = await import('firebase/database');
      const { getAuth } = await import('firebase/auth');
      const { getAnalytics } = await import('firebase/analytics');

      // Initialize Firebase
      app = initializeApp(config);
      database = getDatabase(app);
      auth = getAuth(app);
      analytics = import.meta.env.PROD ? getAnalytics(app) : null;
      
      isFirebaseInitialized = true;
      console.log('[Firebase] Initialized successfully');
      
      return {
        success: true,
        app,
        database,
        auth,
        analytics,
        offline: false
      };
    } catch (error) {
      console.error('[Firebase] Initialization failed:', error);
      isOfflineMode = true;
      
      // Provide user-friendly error messages
      let userMessage = 'Firebase initialization failed';
      if (error.message.includes('fetch')) {
        userMessage = 'Network error - unable to connect to Firebase';
      } else if (error.message.includes('script')) {
        userMessage = 'Firebase modules failed to load';
      }
      
      return {
        success: false,
        error: userMessage,
        originalError: error.message,
        offline: true
      };
    }
  })();

  return initializationPromise;
};

// Get Firebase services
export const getFirebaseServices = async () => {
  const result = await initializeFirebase();
  return result;
};

// Check if Firebase is available
export const isFirebaseAvailable = () => {
  return isFirebaseInitialized && !isOfflineMode;
};

// Check if in offline mode
export const isInOfflineMode = () => {
  return isOfflineMode;
};

// Test Firebase connection
export const testFirebaseConnection = async () => {
  if (!isFirebaseAvailable()) {
    return { connected: false, error: 'Firebase not available' };
  }

  try {
    const { ref, set, get } = await import('firebase/database');
    const testRef = ref(database, 'connection_test');
    const testValue = { timestamp: Date.now(), test: true };
    
    await set(testRef, testValue);
    const snapshot = await get(testRef);
    const connected = snapshot.exists() && snapshot.val().test === true;
    
    // Clean up test data
    await set(testRef, null);
    
    return { connected, error: null };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

// Initialize Firebase on module load
initializeFirebase();

export { database, auth, analytics, isFirebaseInitialized };
export default app;