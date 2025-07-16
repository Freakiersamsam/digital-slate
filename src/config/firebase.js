import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

// Initialize Firebase with error handling
let app = null;
let database = null;
let auth = null;
let analytics = null;
let isFirebaseInitialized = false;

try {
  // Validate config before initialization
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.warn('Firebase config missing fields:', missingFields);
    throw new Error(`Missing Firebase config: ${missingFields.join(', ')}`);
  }

  console.log('Initializing Firebase with config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL
  });

  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  analytics = import.meta.env.PROD ? getAnalytics(app) : null;
  isFirebaseInitialized = true;
  
  console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  console.log('App will run in localStorage-only mode');
}

// Connection test function
export async function testFirebaseConnection() {
  if (!isFirebaseInitialized || !database) {
    return { connected: false, error: 'Firebase not initialized' };
  }
  
  try {
    const { ref, set, get } = await import('firebase/database');
    const testRef = ref(database, 'connection_test');
    const testValue = { timestamp: Date.now(), test: true };
    
    // Try to write and read back a test value
    await set(testRef, testValue);
    const snapshot = await get(testRef);
    const connected = snapshot.exists() && snapshot.val().test === true;
    
    // Clean up test data
    await set(testRef, null);
    
    return { connected, error: null };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

// Anonymous authentication function
export async function authenticateAnonymously() {
  if (!isFirebaseInitialized || !auth) {
    return { success: false, error: 'Firebase not initialized' };
  }
  
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('Anonymous authentication successful:', userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Anonymous authentication failed:', error.message);
    return { success: false, error: error.message };
  }
}

export { database, auth, analytics, isFirebaseInitialized };
export default app;