import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Starting auth initialization...');
        
        // Import Firebase services
        const { getFirebaseServices } = await import('../config/firebase');
        const firebaseServices = await getFirebaseServices();
        
        console.log('[AuthContext] Firebase services result:', firebaseServices);
        
        // Check if Firebase is available
        if (!firebaseServices.success || firebaseServices.offline) {
          console.log('[AuthContext] Firebase not available, enabling offline mode');
          
          if (mounted) {
            setOfflineMode(true);
            setIsOnline(false);
            setAuthError(null);
            setLoading(false);
            
            // Create offline user
            const offlineUser = {
              uid: `offline-${Date.now()}`,
              email: null,
              displayName: 'Offline User',
              photoURL: null,
              isAnonymous: true,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              isOffline: true
            };
            
            setUser(offlineUser);
            setIsAnonymous(true);
          }
          return;
        }

        // Firebase is available, set up online mode
        console.log('[AuthContext] Firebase available, setting up online mode');
        setIsOnline(true);
        setOfflineMode(false);

        // Import Firebase auth functions
        const { onAuthStateChanged } = await import('firebase/auth');
        
        // Set up auth state listener
        unsubscribe = onAuthStateChanged(
          firebaseServices.auth,
          (firebaseUser) => {
            if (!mounted) return;
            
            try {
              console.log('[AuthContext] Auth state changed:', firebaseUser ? 'authenticated' : 'not authenticated');
              
              if (firebaseUser) {
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || 'Anonymous User',
                  photoURL: firebaseUser.photoURL,
                  isAnonymous: firebaseUser.isAnonymous,
                  createdAt: firebaseUser.metadata.creationTime,
                  lastLoginAt: firebaseUser.metadata.lastSignInTime,
                  isOffline: false
                });
                setIsAnonymous(firebaseUser.isAnonymous);
              } else {
                setUser(null);
                setIsAnonymous(false);
              }
              setLoading(false);
              setAuthError(null);
            } catch (error) {
              console.error('[AuthContext] Error processing auth state change:', error);
              if (mounted) {
                enableOfflineMode();
              }
            }
          },
          (error) => {
            console.error('[AuthContext] Auth state listener error:', error);
            if (mounted) {
              enableOfflineMode();
            }
          }
        );
        
        console.log('[AuthContext] Auth listener set up successfully');
        
      } catch (error) {
        console.error('[AuthContext] Failed to initialize auth:', error);
        if (mounted) {
          enableOfflineMode();
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('[AuthContext] Error during cleanup:', error);
        }
      }
    };
  }, []);

  // Function to enable offline mode
  const enableOfflineMode = () => {
    console.log('[AuthContext] Enabling offline mode');
    setOfflineMode(true);
    setIsOnline(false);
    setAuthError(null);
    setLoading(false);
    
    // Create offline user
    const offlineUser = {
      uid: `offline-${Date.now()}`,
      email: null,
      displayName: 'Offline User',
      photoURL: null,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isOffline: true
    };
    
    setUser(offlineUser);
    setIsAnonymous(true);
  };

  // Function to sign out (works in both online and offline modes)
  const signOut = async () => {
    try {
      if (isOnline && !offlineMode) {
        // Online sign out
        const authService = (await import('../services/authService')).default;
        await authService.signOut();
      } else {
        // Offline sign out - just clear local state
        setUser(null);
        setIsAnonymous(false);
      }
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      // Fallback to local sign out
      setUser(null);
      setIsAnonymous(false);
    }
  };

  // Function to retry Firebase connection
  const retryConnection = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const { getFirebaseServices } = await import('../config/firebase');
      const firebaseServices = await getFirebaseServices();
      
      if (firebaseServices.success && !firebaseServices.offline) {
        // Connection successful, restart auth initialization
        window.location.reload();
      } else {
        setAuthError('Still unable to connect to Firebase');
        setLoading(false);
      }
    } catch (error) {
      setAuthError('Failed to reconnect to Firebase');
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAnonymous,
    authError,
    offlineMode,
    isOnline,
    enableOfflineMode,
    signOut,
    retryConnection,
    isAuthenticated: !!user,
    isFullyAuthenticated: !!user && !user.isAnonymous && !user.isOffline
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Additional auth utilities
export const authUtils = {
  // Generate display name from email
  getDisplayNameFromEmail: (email) => {
    if (!email) return 'Anonymous User';
    return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  },

  // Generate user color based on ID
  getUserColor: (uid) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#FF8A65', '#64B5F6', '#81C784', '#FFB74D',
      '#F06292', '#BA68C8', '#4FC3F7', '#AED581'
    ];
    
    // Create a simple hash from the UID
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  },

  // Check if user has specific role in session
  hasRole: (sessionData, userId, role) => {
    return sessionData?.users?.[userId]?.role === role;
  },

  // Check if user is session owner
  isSessionOwner: (sessionData, userId) => {
    return authUtils.hasRole(sessionData, userId, 'owner');
  },

  // Get user's role in session
  getUserRole: (sessionData, userId) => {
    return sessionData?.users?.[userId]?.role || 'viewer';
  }
};