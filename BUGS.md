# 🐛 Known Issues & Bug Tracking

## Active Bugs

### 🔥 High Priority

None currently.

### ⚠️ Medium Priority

#### Firebase Connection Status Display Issue
- **Status**: ACTIVE
- **Reported**: 2025-01-16
- **Description**: Firebase backend works correctly (test passes), but UI still shows "Offline Mode" instead of "Live Sync"
- **Impact**: Users don't see that collaboration features are available
- **Root Cause**: Event propagation timing issue between Firebase wrapper and React status updates
- **Attempted Fixes**:
  - ✅ Added event-driven status updates
  - ✅ Fixed async initialization timing
  - ✅ Enhanced status propagation
  - ❌ Still not displaying correctly
- **Next Steps**: 
  - Investigate React component re-render cycles
  - Add status debugging panel
  - Check if status listeners are properly attached
- **Workaround**: Firebase features work despite incorrect display
- **Files Involved**: 
  - `src/services/firebaseWrapper.js`
  - `src/hooks/useFirebaseStatus.js`
  - `src/components/ConnectionStatus.jsx`

### 📝 Low Priority

None currently.

## Fixed Bugs

### ✅ Firebase Authentication Required
- **Status**: FIXED
- **Date Fixed**: 2025-01-16
- **Description**: Firebase rules required authentication but app wasn't authenticating
- **Solution**: Implemented anonymous authentication in Firebase wrapper
- **Files Changed**: 
  - `src/config/firebase.js`
  - `src/services/firebaseWrapper.js`
  - `firebase.rules`

### ✅ Build and Lint Errors
- **Status**: FIXED  
- **Date Fixed**: 2025-01-16
- **Description**: ESLint errors and React hooks dependency warnings
- **Solution**: Added useCallback, fixed dependency arrays, removed unused variables
- **Files Changed**:
  - `src/App.jsx`
  - `src/components/Notes.jsx`

## Feature Requests

### 🚀 Planned Features

#### User Authentication & Management
- **Status**: IN DEVELOPMENT
- **Priority**: High
- **Description**: Replace anonymous auth with proper user login system
- **Requirements**:
  - Email/password authentication
  - Google Sign-In integration
  - User profile management
  - Session user management
  - Real-time user presence

#### Enhanced Collaboration
- **Status**: PLANNED
- **Priority**: Medium
- **Description**: Advanced collaboration features
- **Requirements**:
  - User permissions (view/edit/admin)
  - User activity indicators
  - Personal note history
  - Custom user avatars

### 📋 Backlog

- Voice notes integration
- Video recording sync
- Advanced export formats
- Offline mode improvements
- Mobile app version

## Testing Notes

### Test Environment
- **Firebase Project**: `collabsync-5d1fb`
- **Test Command**: `npm run test:firebase`
- **Debug Tool**: `debug-firebase-status.html`

### Known Working Features
- ✅ Firebase backend connection
- ✅ Anonymous authentication
- ✅ Database read/write operations
- ✅ Session creation and management
- ✅ Note synchronization
- ✅ QR code generation
- ✅ CSV/PDF export functionality

### Known Issues
- ❌ Connection status display
- ⚠️ Real-time user presence (not implemented)
- ⚠️ User authentication UI (not implemented)

## Contributing

When reporting new bugs:
1. Add to appropriate priority section
2. Include reproduction steps
3. Note affected files
4. Provide error messages/logs
5. Suggest potential fixes if known

When fixing bugs:
1. Move to "Fixed Bugs" section
2. Document solution approach
3. List all changed files
4. Update test status if needed