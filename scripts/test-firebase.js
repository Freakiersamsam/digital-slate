// Firebase connection test script
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    console.log('Config:', {
      projectId: firebaseConfig.projectId,
      databaseURL: firebaseConfig.databaseURL
    });

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase initialized successfully');

    // Authenticate anonymously
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous authentication successful:', userCredential.user.uid);

    // Test database connection
    const testRef = ref(database, 'connection_test');
    const testValue = { timestamp: Date.now(), test: true, user: userCredential.user.uid };
    
    await set(testRef, testValue);
    console.log('✅ Write test successful');
    
    const snapshot = await get(testRef);
    if (snapshot.exists() && snapshot.val().test === true) {
      console.log('✅ Read test successful');
      console.log('🎉 Firebase connection fully working!');
      
      // Clean up
      await set(testRef, null);
      console.log('✅ Cleanup completed');
      
      return true;
    } else {
      console.error('❌ Read test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error.message);
    return false;
  }
}

// Run the test
testFirebaseConnection().then(success => {
  process.exit(success ? 0 : 1);
});