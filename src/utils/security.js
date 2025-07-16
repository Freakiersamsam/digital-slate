// Security utilities for CollabSync

export class SecurityUtils {
  // Validate session ID format
  static validateSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }
    
    // Session ID should match pattern: session-timestamp-randomstring
    const sessionPattern = /^session-\d{13}-[a-zA-Z0-9]{9}$/;
    return sessionPattern.test(sessionId);
  }

  // Validate user ID format
  static validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      return false;
    }
    
    // User ID should be a valid UUID v4 with prefix
    const userPattern = /^user-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return userPattern.test(userId);
  }

  // Sanitize user input for database storage
  static sanitizeUserInput(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  // Validate note content
  static validateNoteContent(note) {
    if (!note || typeof note !== 'object') {
      return false;
    }

    // Required fields
    if (!note.text || typeof note.text !== 'string') {
      return false;
    }

    if (!note.timestamp || typeof note.timestamp !== 'number') {
      return false;
    }

    if (!note.userId || !this.validateUserId(note.userId)) {
      return false;
    }

    // Text length limits
    if (note.text.length > 5000) {
      return false;
    }

    // Validate category if present
    if (note.category) {
      const validCategories = ['director', 'script', 'camera', 'sound', 'continuity', 'vfx', 'general'];
      if (!validCategories.includes(note.category)) {
        return false;
      }
    }

    return true;
  }

  // Rate limiting helper
  static createRateLimiter(maxRequests = 10, windowMs = 60000) {
    const requests = new Map();
    
    return (key) => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      for (const [reqKey, timestamps] of requests.entries()) {
        const validTimestamps = timestamps.filter(t => t > windowStart);
        if (validTimestamps.length === 0) {
          requests.delete(reqKey);
        } else {
          requests.set(reqKey, validTimestamps);
        }
      }
      
      // Check current key
      const currentRequests = requests.get(key) || [];
      const validRequests = currentRequests.filter(t => t > windowStart);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(key, validRequests);
      return true;
    };
  }

  // Sanitize filename for downloads
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'download';
    }
    
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars with underscore
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 100); // Limit length
  }

  // Validate Firebase configuration
  static validateFirebaseConfig(config) {
    const requiredFields = [
      'apiKey', 'authDomain', 'projectId', 'storageBucket', 
      'messagingSenderId', 'appId'
    ];
    
    return requiredFields.every(field => 
      config[field] && typeof config[field] === 'string'
    );
  }

  // Check if running in secure context
  static isSecureContext() {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  // Validate export options
  static validateExportOptions(options) {
    if (!options || typeof options !== 'object') {
      return false;
    }

    // Validate frame rate
    if (options.frameRate) {
      const validFrameRates = ['23.976', '24', '25', '29.97', '30', '50', '59.94', '60'];
      if (!validFrameRates.includes(options.frameRate)) {
        return false;
      }
    }

    // Validate title/project name
    if (options.title && typeof options.title !== 'string') {
      return false;
    }

    return true;
  }

  // Log security events (for monitoring)
  static logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: details.sessionId || 'unknown'
    };

    // In production, send to security monitoring service
    if (import.meta.env.PROD) {
      console.warn('Security event:', logEntry);
      // TODO: Send to monitoring service
    } else {
      console.log('Security event:', logEntry);
    }
  }
}

// Rate limiter instances
export const sessionRateLimiter = SecurityUtils.createRateLimiter(5, 60000); // 5 sessions per minute
export const aiRateLimiter = SecurityUtils.createRateLimiter(10, 60000); // 10 AI calls per minute
export const exportRateLimiter = SecurityUtils.createRateLimiter(20, 60000); // 20 exports per minute