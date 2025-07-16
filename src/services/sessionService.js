import { database } from '../config/firebase';
import { ref, push, set, onValue, off, serverTimestamp, get, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { SecurityUtils, sessionRateLimiter } from '../utils/security';

class SessionService {
  constructor() {
    this.currentSession = null;
    this.listeners = [];
  }

  // Create a new session
  async createSession(slateInfo, userId = null) {
    try {
      // Security: Rate limiting
      if (!sessionRateLimiter('global')) {
        throw new Error('Too many session creation attempts. Please try again later.');
      }

      // Security: Validate and sanitize inputs
      if (slateInfo && typeof slateInfo === 'object') {
        Object.keys(slateInfo).forEach(key => {
          if (slateInfo[key]) {
            slateInfo[key] = SecurityUtils.sanitizeUserInput(slateInfo[key]);
          }
        });
      }

      if (userId && !SecurityUtils.validateUserId(userId)) {
        throw new Error('Invalid user ID format');
      }
      
      const sessionId = this.generateSessionId();
      const sessionRef = ref(database, `sessions/${sessionId}`);
      
      const sessionData = {
        id: sessionId,
        metadata: {
          created: serverTimestamp(),
          syncTime: null,
          production: slateInfo.prod || 'Untitled Production',
          scene: slateInfo.scene || '',
          take: slateInfo.take || '1',
          director: slateInfo.director || '',
          camera: slateInfo.camera || '',
          dop: slateInfo.dop || '',
          isActive: true,
        },
        users: {},
        notes: {},
        activities: {},
        settings: {
          allowAnonymous: true,
          requireApproval: false,
        }
      };

      // Add creator as first user
      if (userId) {
        sessionData.users[userId] = {
          role: 'owner',
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        };
      }

      await set(sessionRef, sessionData);
      this.currentSession = sessionId;
      
      return { sessionId, joinUrl: this.getJoinUrl(sessionId) };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Join an existing session
  async joinSession(sessionId, userId, userName = 'Anonymous') {
    try {
      // Security: Validate inputs
      if (!SecurityUtils.validateSessionId(sessionId)) {
        throw new Error('Invalid session ID format');
      }
      
      if (!SecurityUtils.validateUserId(userId)) {
        throw new Error('Invalid user ID format');
      }
      
      // Security: Sanitize username
      userName = SecurityUtils.sanitizeUserInput(userName) || 'Anonymous';
      
      const sessionRef = ref(database, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }

      const session = snapshot.val();
      
      if (!session.metadata.isActive) {
        throw new Error('Session is no longer active');
      }

      // Add user to session
      const userRef = ref(database, `sessions/${sessionId}/users/${userId}`);
      await set(userRef, {
        name: userName,
        role: 'participant',
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        color: this.generateUserColor(),
      });

      // Add join activity
      const activityRef = push(ref(database, `sessions/${sessionId}/activities`));
      await set(activityRef, {
        type: 'user_joined',
        userId,
        userName,
        timestamp: serverTimestamp(),
      });

      this.currentSession = sessionId;
      return session;
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  // Update sync time when sync happens
  async updateSyncTime(sessionId, syncTime) {
    try {
      const syncRef = ref(database, `sessions/${sessionId}/metadata/syncTime`);
      await set(syncRef, syncTime);
      
      // Add sync activity
      const activityRef = push(ref(database, `sessions/${sessionId}/activities`));
      await set(activityRef, {
        type: 'sync_triggered',
        timestamp: syncTime,
        serverTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating sync time:', error);
      throw error;
    }
  }

  // Subscribe to session updates
  subscribeToSession(sessionId, callbacks = {}) {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    
    const listener = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Call appropriate callbacks
        if (callbacks.onUpdate) callbacks.onUpdate(data);
        if (callbacks.onUsersChange) callbacks.onUsersChange(data.users || {});
        if (callbacks.onNotesChange) callbacks.onNotesChange(data.notes || {});
        if (callbacks.onActivitiesChange) callbacks.onActivitiesChange(data.activities || {});
      }
    });

    this.listeners.push({ ref: sessionRef, listener });
    return () => this.unsubscribe(sessionRef);
  }

  // Unsubscribe from session updates
  unsubscribe(sessionRef = null) {
    if (sessionRef) {
      const index = this.listeners.findIndex(l => l.ref === sessionRef);
      if (index !== -1) {
        off(this.listeners[index].ref, 'value', this.listeners[index].listener);
        this.listeners.splice(index, 1);
      }
    } else {
      // Unsubscribe from all
      this.listeners.forEach(l => off(l.ref, 'value', l.listener));
      this.listeners = [];
    }
  }

  // Update user presence
  async updateUserPresence(sessionId, userId) {
    try {
      const userRef = ref(database, `sessions/${sessionId}/users/${userId}/lastSeen`);
      await set(userRef, serverTimestamp());
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  // End session
  async endSession(sessionId) {
    try {
      const updates = {};
      updates[`sessions/${sessionId}/metadata/isActive`] = false;
      updates[`sessions/${sessionId}/metadata/endedAt`] = serverTimestamp();
      
      await update(ref(database), updates);
      
      // Add end activity
      const activityRef = push(ref(database, `sessions/${sessionId}/activities`));
      await set(activityRef, {
        type: 'session_ended',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  // Helper methods
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateUserId() {
    return `user-${uuidv4()}`;
  }

  generateUserColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getJoinUrl(sessionId) {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/join/${sessionId}`;
  }

  // Get session summary for export
  async getSessionSummary(sessionId) {
    try {
      const sessionRef = ref(database, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }

      return snapshot.val();
    } catch (error) {
      console.error('Error getting session summary:', error);
      throw error;
    }
  }
}

export default new SessionService();