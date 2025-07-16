/**
 * Safe Firebase Wrapper - Provides Firebase functionality with comprehensive error handling
 * Falls back to localStorage if Firebase is unavailable
 */

class FirebaseWrapper {
  constructor() {
    this.isAvailable = false;
    this.database = null;
    this.auth = null;
    this.connectionStatus = {
      initialized: false,
      connected: false,
      error: null,
      lastChecked: null
    };
    this.initializationPromise = null;
    this.statusListeners = new Set();
    
    // Start initialization but don't block constructor
    this.initializationPromise = this.initializeFirebase();
  }

  async initializeFirebase() {
    try {
      console.log('[FirebaseWrapper] Starting Firebase initialization...');
      this.notifyStatusChange();
      
      // Dynamic import to prevent module-level errors
      const firebaseModule = await import('../config/firebase');
      
      if (firebaseModule.isFirebaseInitialized && firebaseModule.database) {
        this.database = firebaseModule.database;
        this.auth = firebaseModule.auth;
        this.isAvailable = true;
        
        console.log('[FirebaseWrapper] Firebase initialized successfully');
        this.connectionStatus.initialized = true;
        this.notifyStatusChange();
        
        // Authenticate anonymously for access to database
        console.log('[FirebaseWrapper] Starting anonymous authentication...');
        const authResult = await firebaseModule.authenticateAnonymously();
        if (authResult.success) {
          console.log('[FirebaseWrapper] Anonymous authentication successful');
          // Test connection after authentication
          console.log('[FirebaseWrapper] Testing database connection...');
          await this.testConnection();
        } else {
          console.warn('[FirebaseWrapper] Authentication failed:', authResult.error);
          this.connectionStatus.error = authResult.error;
          this.notifyStatusChange();
        }
      } else {
        throw new Error('Firebase not properly initialized');
      }
    } catch (error) {
      console.error('[FirebaseWrapper] Firebase initialization failed:', error.message);
      this.connectionStatus.error = error.message;
      this.isAvailable = false;
      this.notifyStatusChange();
    }
  }

  async testConnection() {
    if (!this.isAvailable || !this.database) {
      console.log('[FirebaseWrapper] Connection test skipped - Firebase not available');
      return { connected: false, error: 'Firebase not available' };
    }

    try {
      // Test connection by attempting to write to a test path
      const { ref, set, get } = await import('firebase/database');
      const testRef = ref(this.database, 'connection_test');
      const testValue = { timestamp: Date.now(), test: true };
      
      console.log('[FirebaseWrapper] Writing test data...');
      // Try to write and read back a test value
      await set(testRef, testValue);
      
      console.log('[FirebaseWrapper] Reading back test data...');
      const snapshot = await get(testRef);
      const connected = snapshot.exists() && snapshot.val().test === true;
      
      // Clean up test data
      await set(testRef, null);
      
      this.connectionStatus.connected = connected;
      this.connectionStatus.lastChecked = new Date().toISOString();
      this.connectionStatus.error = connected ? null : 'Connection test failed';
      
      console.log('[FirebaseWrapper] Connection test:', connected ? 'SUCCESS ✅' : 'FAILED ❌');
      console.log('[FirebaseWrapper] Status updated:', this.connectionStatus);
      
      // Notify listeners of status change
      this.notifyStatusChange();
      
      return { connected, error: null };
    } catch (error) {
      console.error('[FirebaseWrapper] Connection test failed:', error.message);
      this.connectionStatus.connected = false;
      this.connectionStatus.error = error.message;
      this.connectionStatus.lastChecked = new Date().toISOString();
      
      // Notify listeners of status change
      this.notifyStatusChange();
      
      return { connected: false, error: error.message };
    }
  }

  // Safe database operations with fallback
  async safeSet(path, data) {
    if (!this.isAvailable || !this.connectionStatus.connected) {
      throw new Error('Firebase not available - use localStorage fallback');
    }

    try {
      const { ref, set } = await import('firebase/database');
      const dbRef = ref(this.database, path);
      await set(dbRef, data);
      return { success: true };
    } catch (error) {
      console.warn('[FirebaseWrapper] Set operation failed:', error.message);
      throw error;
    }
  }

  async safeGet(path) {
    if (!this.isAvailable || !this.connectionStatus.connected) {
      throw new Error('Firebase not available - use localStorage fallback');
    }

    try {
      const { ref, get } = await import('firebase/database');
      const dbRef = ref(this.database, path);
      const snapshot = await get(dbRef);
      return { success: true, data: snapshot.val() };
    } catch (error) {
      console.warn('[FirebaseWrapper] Get operation failed:', error.message);
      throw error;
    }
  }

  async safePush(path, data) {
    if (!this.isAvailable || !this.connectionStatus.connected) {
      throw new Error('Firebase not available - use localStorage fallback');
    }

    try {
      const { ref, push } = await import('firebase/database');
      const dbRef = ref(this.database, path);
      const newRef = await push(dbRef, data);
      return { success: true, key: newRef.key };
    } catch (error) {
      console.warn('[FirebaseWrapper] Push operation failed:', error.message);
      throw error;
    }
  }

  async safeSubscribe(path, callback) {
    if (!this.isAvailable || !this.connectionStatus.connected) {
      throw new Error('Firebase not available - use localStorage fallback');
    }

    try {
      const { ref, onValue } = await import('firebase/database');
      const dbRef = ref(this.database, path);
      
      const unsubscribe = onValue(dbRef, callback, (error) => {
        console.warn('[FirebaseWrapper] Subscription error:', error.message);
      });
      
      return { success: true, unsubscribe };
    } catch (error) {
      console.warn('[FirebaseWrapper] Subscribe operation failed:', error.message);
      throw error;
    }
  }

  // Generate secure IDs
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session-${timestamp}-${random}`;
  }

  generateUserId() {
    // Simple UUID-like generation
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substr(2, 5);
    const random2 = Math.random().toString(36).substr(2, 5);
    return `user-${timestamp}-${random1}-${random2}`;
  }

  // Notify status listeners
  notifyStatusChange() {
    const status = this.getStatus();
    console.log('[FirebaseWrapper] Notifying status change:', status);
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.warn('[FirebaseWrapper] Status listener error:', error);
      }
    });
  }

  // Add status listener
  addStatusListener(callback) {
    this.statusListeners.add(callback);
    // Immediately call with current status
    callback(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  // Get current status
  getStatus() {
    return {
      ...this.connectionStatus,
      isAvailable: this.isAvailable
    };
  }

  // Wait for initialization to complete
  async waitForInitialization() {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    return this.getStatus();
  }

  // Periodic connection check
  startPeriodicCheck(interval = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      if (this.isAvailable) {
        await this.testConnection();
      }
    }, interval);
  }

  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Export singleton instance
export default new FirebaseWrapper();