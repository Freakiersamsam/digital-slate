import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Anonymous User',
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          createdAt: firebaseUser.metadata.creationTime,
          lastLoginAt: firebaseUser.metadata.lastSignInTime
        });
        setIsAnonymous(firebaseUser.isAnonymous);
      } else {
        setUser(null);
        setIsAnonymous(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    isAnonymous,
    isAuthenticated: !!user,
    isFullyAuthenticated: !!user && !user.isAnonymous
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