class AuthService {
  constructor() {
    this.googleProvider = null;
    this._authPromise = null;
    this._isOfflineMode = false;
  }

  // Get auth instance safely
  async getAuth() {
    if (!this._authPromise) {
      this._authPromise = this._initializeAuth();
    }
    return this._authPromise;
  }

  async _initializeAuth() {
    try {
      const { getFirebaseServices } = await import('../config/firebase');
      const services = await getFirebaseServices();
      
      if (!services.success || services.offline) {
        this._isOfflineMode = true;
        throw new Error('Firebase auth not available - offline mode');
      }
      
      // Initialize Google provider
      const { GoogleAuthProvider } = await import('firebase/auth');
      this.googleProvider = new GoogleAuthProvider();
      this.googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      this._isOfflineMode = false;
      return services.auth;
    } catch (error) {
      this._isOfflineMode = true;
      throw error;
    }
  }

  // Check if in offline mode
  isOfflineMode() {
    return this._isOfflineMode;
  }

  // Anonymous authentication
  async signInAnonymously() {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Authentication not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { signInAnonymously } = await import('firebase/auth');
      const result = await signInAnonymously(auth);
      console.log('[AuthService] Anonymous sign-in successful:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[AuthService] Anonymous sign-in failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Email/Password authentication
  async signInWithEmail(email, password) {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Authentication not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthService] Email sign-in successful:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[AuthService] Email sign-in failed:', error.message);
      return { success: false, error: this.getReadableErrorMessage(error.code) };
    }
  }

  // Email/Password registration
  async signUpWithEmail(email, password, displayName) {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Authentication not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      console.log('[AuthService] Email sign-up successful:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[AuthService] Email sign-up failed:', error.message);
      return { success: false, error: this.getReadableErrorMessage(error.code) };
    }
  }

  // Google Sign-In
  async signInWithGoogle() {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Authentication not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, this.googleProvider);
      console.log('[AuthService] Google sign-in successful:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[AuthService] Google sign-in failed:', error.message);
      return { success: false, error: this.getReadableErrorMessage(error.code) };
    }
  }

  // Link anonymous account with email/password
  async linkAnonymousWithEmail(email, password, displayName) {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Authentication not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { linkWithCredential, EmailAuthProvider, updateProfile } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(auth.currentUser, credential);
      
      // Update display name
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      console.log('[AuthService] Anonymous account linked with email:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[AuthService] Anonymous account linking failed:', error.message);
      return { success: false, error: this.getReadableErrorMessage(error.code) };
    }
  }

  // Link anonymous account with Google
  async linkAnonymousWithGoogle() {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Authentication not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { linkWithCredential } = await import('firebase/auth');
      const result = await linkWithCredential(auth.currentUser, this.googleProvider);
      console.log('[AuthService] Anonymous account linked with Google:', result.user.uid);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('[AuthService] Anonymous Google linking failed:', error.message);
      return { success: false, error: this.getReadableErrorMessage(error.code) };
    }
  }

  // Sign out (works in both online and offline modes)
  async signOut() {
    if (this.isOfflineMode()) {
      console.log('[AuthService] Offline sign-out successful');
      return { success: true };
    }

    try {
      const auth = await this.getAuth();
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      console.log('[AuthService] Sign-out successful');
      return { success: true };
    } catch (error) {
      console.error('[AuthService] Sign-out failed:', error.message);
      // Even if Firebase sign-out fails, we can consider it successful locally
      return { success: true };
    }
  }

  // Password reset
  async sendPasswordReset(email) {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Password reset not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      console.log('[AuthService] Password reset email sent to:', email);
      return { success: true };
    } catch (error) {
      console.error('[AuthService] Password reset failed:', error.message);
      return { success: false, error: this.getReadableErrorMessage(error.code) };
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    if (this.isOfflineMode()) {
      return { success: false, error: 'Profile updates not available in offline mode' };
    }

    try {
      const auth = await this.getAuth();
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(auth.currentUser, updates);
      console.log('[AuthService] Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[AuthService] Profile update failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const auth = await this.getAuth();
      return auth.currentUser;
    } catch (error) {
      console.error('[AuthService] Failed to get current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const auth = await this.getAuth();
      return !!auth.currentUser;
    } catch (error) {
      console.error('[AuthService] Failed to check authentication:', error);
      return false;
    }
  }

  // Check if user is anonymous
  async isAnonymous() {
    try {
      const auth = await this.getAuth();
      return auth.currentUser?.isAnonymous || false;
    } catch (error) {
      console.error('[AuthService] Failed to check anonymous status:', error);
      return false;
    }
  }

  // Convert Firebase error codes to readable messages
  getReadableErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email address is already registered. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
      'auth/cancelled-popup-request': 'Multiple popup requests detected.',
      'auth/popup-blocked': 'Popup was blocked by browser. Please allow popups and try again.',
      'auth/credential-already-in-use': 'This account is already linked to another user.',
      'auth/email-already-exists': 'An account with this email already exists.',
      'auth/provider-already-linked': 'This account is already linked with this provider.'
    };

    return errorMessages[errorCode] || `Authentication error: ${errorCode}`;
  }

  // Get user's preferred name for display
  getUserDisplayName(user) {
    if (!user) return 'Anonymous User';
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'Anonymous User';
  }

  // Generate unique session ID for user
  generateUserSessionId(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${userId}-${timestamp}-${random}`;
  }
}

export default new AuthService();