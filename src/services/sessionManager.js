import firebaseWrapper from './firebaseWrapper';

class SessionManager {
  constructor() {
    this.currentSession = null;
    this.listeners = [];
  }

  // Create a new collaboration session
  async createSession(slateInfo, userId) {
    try {
      const sessionId = firebaseWrapper.generateSessionId();
      const now = Date.now();
      
      // Session data structure
      const sessionData = {
        id: sessionId,
        created: now,
        syncTime: null, // Will be set when sync happens
        metadata: {
          production: slateInfo.prod || 'Untitled Production',
          scene: slateInfo.scene || '',
          take: slateInfo.take || '1',
          director: slateInfo.director || '',
          camera: slateInfo.camera || '',
          dop: slateInfo.dop || '',
          isActive: true,
          lastActivity: now
        },
        users: {
          [userId]: {
            role: 'owner',
            name: 'Camera Operator',
            joinedAt: now,
            lastSeen: now,
            color: this.generateUserColor()
          }
        },
        notes: {},
        activities: {},
        settings: {
          allowAnonymous: true,
          requireApproval: false,
          maxUsers: 10
        }
      };

      // Try to save to Firebase
      try {
        await firebaseWrapper.safeSet(`sessions/${sessionId}`, sessionData);
        console.log('[SessionManager] Session created in Firebase:', sessionId);
      } catch (error) {
        console.warn('[SessionManager] Failed to create Firebase session, using local only:', error.message);
      }

      // Generate join URL
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const joinUrl = `${baseUrl}/join/${sessionId}`;

      this.currentSession = {
        sessionId,
        joinUrl,
        data: sessionData
      };

      return this.currentSession;
    } catch (error) {
      console.error('[SessionManager] Failed to create session:', error);
      throw error;
    }
  }

  // Update sync time when camera sync happens
  async updateSyncTime(sessionId, syncTime) {
    if (!sessionId) return;

    try {
      // Update locally
      if (this.currentSession && this.currentSession.sessionId === sessionId) {
        this.currentSession.data.syncTime = syncTime;
        this.currentSession.data.metadata.lastActivity = Date.now();
      }

      // Update in Firebase
      try {
        await firebaseWrapper.safeSet(`sessions/${sessionId}/syncTime`, syncTime);
        await firebaseWrapper.safeSet(`sessions/${sessionId}/metadata/lastActivity`, Date.now());
        
        // Add activity log
        await this.addActivity(sessionId, {
          type: 'sync_triggered',
          timestamp: syncTime,
          userId: this.getCurrentUserId()
        });
        
        console.log('[SessionManager] Sync time updated:', new Date(syncTime).toISOString());
      } catch (error) {
        console.warn('[SessionManager] Failed to update sync time in Firebase:', error.message);
      }
    } catch (error) {
      console.error('[SessionManager] Failed to update sync time:', error);
    }
  }

  // Join an existing session
  async joinSession(sessionId, userId, userName = 'Anonymous') {
    try {
      // Get session data from Firebase
      const result = await firebaseWrapper.safeGet(`sessions/${sessionId}`);
      
      if (!result.success || !result.data) {
        throw new Error('Session not found');
      }

      const sessionData = result.data;
      
      if (!sessionData.metadata.isActive) {
        throw new Error('Session is no longer active');
      }

      // Add user to session
      const userData = {
        name: userName,
        role: 'participant',
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        color: this.generateUserColor()
      };

      await firebaseWrapper.safeSet(`sessions/${sessionId}/users/${userId}`, userData);
      
      // Add join activity
      await this.addActivity(sessionId, {
        type: 'user_joined',
        userId,
        userName,
        timestamp: Date.now()
      });

      // Generate join URL
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const joinUrl = `${baseUrl}/join/${sessionId}`;

      this.currentSession = {
        sessionId,
        joinUrl,
        data: sessionData
      };

      console.log('[SessionManager] Joined session:', sessionId);
      return this.currentSession;
    } catch (error) {
      console.error('[SessionManager] Failed to join session:', error);
      throw error;
    }
  }

  // Add activity to session log
  async addActivity(sessionId, activity) {
    try {
      const activityData = {
        ...activity,
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        serverTimestamp: Date.now()
      };

      await firebaseWrapper.safePush(`sessions/${sessionId}/activities`, activityData);
    } catch (error) {
      console.warn('[SessionManager] Failed to add activity:', error.message);
    }
  }

  // Subscribe to session updates
  async subscribeToSession(sessionId, callbacks = {}) {
    try {
      const { onUpdate, onUsersChange, onNotesChange } = callbacks;
      
      // Subscribe to entire session
      if (onUpdate) {
        const result = await firebaseWrapper.safeSubscribe(`sessions/${sessionId}`, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            onUpdate(data);
          }
        });
        
        if (result.success) {
          this.listeners.push({ path: `sessions/${sessionId}`, unsubscribe: result.unsubscribe });
        }
      }

      // Subscribe to users
      if (onUsersChange) {
        const result = await firebaseWrapper.safeSubscribe(`sessions/${sessionId}/users`, (snapshot) => {
          const users = snapshot.val() || {};
          onUsersChange(users);
        });
        
        if (result.success) {
          this.listeners.push({ path: `sessions/${sessionId}/users`, unsubscribe: result.unsubscribe });
        }
      }

      // Subscribe to notes
      if (onNotesChange) {
        const result = await firebaseWrapper.safeSubscribe(`sessions/${sessionId}/notes`, (snapshot) => {
          const notes = snapshot.val() || {};
          onNotesChange(notes);
        });
        
        if (result.success) {
          this.listeners.push({ path: `sessions/${sessionId}/notes`, unsubscribe: result.unsubscribe });
        }
      }

      console.log('[SessionManager] Subscribed to session updates');
    } catch (error) {
      console.warn('[SessionManager] Failed to subscribe to session:', error.message);
    }
  }

  // End session
  async endSession(sessionId) {
    try {
      await firebaseWrapper.safeSet(`sessions/${sessionId}/metadata/isActive`, false);
      await firebaseWrapper.safeSet(`sessions/${sessionId}/metadata/endedAt`, Date.now());
      
      await this.addActivity(sessionId, {
        type: 'session_ended',
        timestamp: Date.now(),
        userId: this.getCurrentUserId()
      });

      console.log('[SessionManager] Session ended:', sessionId);
    } catch (error) {
      console.warn('[SessionManager] Failed to end session in Firebase:', error.message);
    }
  }

  // Cleanup subscriptions
  unsubscribeAll() {
    this.listeners.forEach(listener => {
      try {
        listener.unsubscribe();
      } catch (error) {
        console.warn('[SessionManager] Failed to unsubscribe:', error.message);
      }
    });
    this.listeners = [];
    this.currentSession = null;
  }

  // Get current session info
  getCurrentSession() {
    return this.currentSession;
  }

  // Helper methods
  generateUserColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#FF8A65', '#64B5F6', '#81C784', '#FFB74D'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getCurrentUserId() {
    // This should be passed in or stored when session is created
    return this.currentSession?.userId || 'anonymous';
  }

  // Generate QR code data
  generateQRData(sessionId, joinUrl) {
    return JSON.stringify({
      type: 'collabsync_session',
      sessionId,
      joinUrl,
      timestamp: Date.now(),
      version: '1.0'
    });
  }
}

export default new SessionManager();