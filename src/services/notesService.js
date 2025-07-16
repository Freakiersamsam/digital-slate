import { database } from '../config/firebase';
import { ref, push, set, onValue, off, serverTimestamp, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

class NotesService {
  constructor() {
    this.sessionId = null;
    this.userId = null;
    this.syncTime = null;
    this.listeners = [];
    this.currentChunk = null;
    this.chunkTimeout = null;
    this.PAUSE_THRESHOLD = 2000; // 2 seconds pause creates new chunk
    this.lastKeystrokeTime = 0;
  }

  // Initialize notes service for a session
  init(sessionId, userId, syncTime) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.syncTime = syncTime;
    this.startKeystrokeTracking();
  }

  // Add a note (manual or from chunks)
  async addNote(noteData) {
    try {
      const noteId = uuidv4();
      const noteRef = ref(database, `sessions/${this.sessionId}/notes/${noteId}`);
      
      const relativeTime = this.syncTime ? noteData.timestamp - this.syncTime : 0;
      
      const note = {
        id: noteId,
        text: noteData.text,
        userId: this.userId,
        userName: noteData.userName || 'Anonymous',
        timestamp: noteData.timestamp,
        relativeTime: relativeTime,
        timecodeIn: this.formatTimecode(noteData.timestamp),
        relativeTimecode: this.formatTimecode(relativeTime, false),
        keystrokes: noteData.keystrokes || [],
        category: noteData.category || 'general',
        tags: noteData.tags || [],
        metadata: noteData.metadata || {},
        createdAt: serverTimestamp(),
      };

      await set(noteRef, note);
      return noteId;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  // Start tracking keystrokes for automatic chunking
  startKeystrokeTracking() {
    if (typeof document === 'undefined') return;
    
    // Track all input events
    document.addEventListener('input', this.handleInput);
    document.addEventListener('keydown', this.handleKeydown);
    
    // Track focus/blur for context
    document.addEventListener('focus', this.handleFocus, true);
    document.addEventListener('blur', this.handleBlur, true);
  }

  // Stop tracking keystrokes
  stopKeystrokeTracking() {
    if (typeof document === 'undefined') return;
    
    document.removeEventListener('input', this.handleInput);
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('focus', this.handleFocus, true);
    document.removeEventListener('blur', this.handleBlur, true);
    
    // Save any pending chunk
    if (this.currentChunk) {
      this.saveChunk();
    }
  }

  // Handle input events
  handleInput = (event) => {
    const now = Date.now();
    const target = event.target;
    
    // Only track relevant inputs (textareas, inputs)
    if (!this.isRelevantInput(target)) return;
    
    // Check if we need to start a new chunk
    if (!this.currentChunk || now - this.lastKeystrokeTime > this.PAUSE_THRESHOLD) {
      if (this.currentChunk) {
        this.saveChunk();
      }
      
      this.currentChunk = {
        id: uuidv4(),
        startTime: now,
        keystrokes: [],
        text: '',
        element: {
          type: target.tagName.toLowerCase(),
          id: target.id,
          className: target.className,
          placeholder: target.placeholder,
        },
        context: this.getContext(),
      };
    }
    
    // Add keystroke to current chunk
    this.currentChunk.keystrokes.push({
      time: now - this.currentChunk.startTime,
      type: event.inputType,
      data: event.data,
      value: target.value,
    });
    
    this.currentChunk.text = target.value;
    this.lastKeystrokeTime = now;
    
    // Reset chunk timeout
    if (this.chunkTimeout) clearTimeout(this.chunkTimeout);
    this.chunkTimeout = setTimeout(() => this.saveChunk(), this.PAUSE_THRESHOLD);
  };

  // Handle keydown for special keys
  handleKeydown = (event) => {
    const target = event.target;
    if (!this.isRelevantInput(target)) return;
    
    // Track special keys
    if (['Enter', 'Tab', 'Escape'].includes(event.key)) {
      if (this.currentChunk) {
        this.currentChunk.keystrokes.push({
          time: Date.now() - this.currentChunk.startTime,
          type: 'special',
          key: event.key,
        });
        
        // Save chunk on Enter
        if (event.key === 'Enter' && !event.shiftKey) {
          this.saveChunk();
        }
      }
    }
  };

  // Handle focus events
  handleFocus = (event) => {
    const target = event.target;
    if (!this.isRelevantInput(target)) return;
    
    // Add focus activity
    this.addActivity('focus', {
      element: target.tagName.toLowerCase(),
      id: target.id,
    });
  };

  // Handle blur events
  handleBlur = (event) => {
    const target = event.target;
    if (!this.isRelevantInput(target)) return;
    
    // Save any pending chunk when losing focus
    if (this.currentChunk && target.value) {
      this.saveChunk();
    }
    
    // Add blur activity
    this.addActivity('blur', {
      element: target.tagName.toLowerCase(),
      id: target.id,
    });
  };

  // Save current chunk as a note
  async saveChunk() {
    if (!this.currentChunk || !this.currentChunk.text.trim()) return;
    
    try {
      await this.addNote({
        text: this.currentChunk.text,
        timestamp: this.currentChunk.startTime,
        keystrokes: this.currentChunk.keystrokes,
        metadata: {
          chunkId: this.currentChunk.id,
          duration: Date.now() - this.currentChunk.startTime,
          element: this.currentChunk.element,
          context: this.currentChunk.context,
          autoGenerated: true,
        },
      });
      
      this.currentChunk = null;
      if (this.chunkTimeout) {
        clearTimeout(this.chunkTimeout);
        this.chunkTimeout = null;
      }
    } catch (error) {
      console.error('Error saving chunk:', error);
    }
  }

  // Add activity log entry
  async addActivity(type, data = {}) {
    try {
      const activityRef = push(ref(database, `sessions/${this.sessionId}/activities`));
      await set(activityRef, {
        type,
        userId: this.userId,
        timestamp: Date.now(),
        relativeTime: this.syncTime ? Date.now() - this.syncTime : 0,
        data,
        serverTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }

  // Update existing note
  async updateNote(noteId, updates) {
    try {
      const noteRef = ref(database, `sessions/${this.sessionId}/notes/${noteId}`);
      await update(noteRef, {
        ...updates,
        lastModified: serverTimestamp(),
        lastModifiedBy: this.userId,
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Subscribe to notes updates
  subscribeToNotes(callback) {
    const notesRef = ref(database, `sessions/${this.sessionId}/notes`);
    
    const listener = onValue(notesRef, (snapshot) => {
      const notes = [];
      snapshot.forEach((child) => {
        notes.push({ id: child.key, ...child.val() });
      });
      
      // Sort by timestamp
      notes.sort((a, b) => a.timestamp - b.timestamp);
      callback(notes);
    });

    this.listeners.push({ ref: notesRef, listener });
    return () => this.unsubscribeFromNotes(notesRef);
  }

  // Unsubscribe from notes
  unsubscribeFromNotes(notesRef) {
    const index = this.listeners.findIndex(l => l.ref === notesRef);
    if (index !== -1) {
      off(this.listeners[index].ref, 'value', this.listeners[index].listener);
      this.listeners.splice(index, 1);
    }
  }

  // Helper methods
  isRelevantInput(element) {
    return element && (
      element.tagName === 'TEXTAREA' ||
      (element.tagName === 'INPUT' && ['text', 'search', 'url', 'tel', 'email'].includes(element.type))
    );
  }

  getContext() {
    // Get current page context
    return {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
    };
  }

  formatTimecode(milliseconds, isGlobal = true) {
    if (isGlobal) {
      const date = new Date(milliseconds);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const frames = Math.floor(date.getMilliseconds() / 40).toString().padStart(2, '0'); // 25fps
      return `${hours}:${minutes}:${seconds}:${frames}`;
    } else {
      const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const frames = Math.floor((Math.abs(milliseconds) % 1000) / 40); // 25fps
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
  }

  // Clean up
  destroy() {
    this.stopKeystrokeTracking();
    this.listeners.forEach(l => off(l.ref, 'value', l.listener));
    this.listeners = [];
    this.currentChunk = null;
    this.sessionId = null;
    this.userId = null;
    this.syncTime = null;
  }
}

export default new NotesService();