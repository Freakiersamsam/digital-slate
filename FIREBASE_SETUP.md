# Firebase Setup Instructions

## Current Status
✅ Firebase configuration is properly set up in `.env`  
✅ Anonymous authentication is implemented  
✅ Connection test functionality is ready  
⚠️ **Firebase Database Rules need to be updated manually**

## Required Actions

### 1. Update Firebase Database Rules

**IMPORTANT**: You need to manually update the Firebase Realtime Database rules in the Firebase Console.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `collabsync-5d1fb`
3. Go to **Realtime Database** → **Rules**
4. Replace the current rules with:

```json
{
  "rules": {
    "connection_test": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "sessions": {
      "$sessionId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "metadata": {
          ".validate": "newData.hasChildren(['created', 'production', 'isActive'])"
        },
        "users": {
          "$userId": {
            ".write": "auth != null",
            ".validate": "newData.hasChildren(['name', 'role', 'joinedAt'])"
          }
        },
        "notes": {
          "$noteId": {
            ".write": "auth != null",
            ".validate": "newData.hasChildren(['text', 'userId', 'timestamp']) && newData.child('text').val().length <= 5000"
          }
        },
        "activities": {
          "$activityId": {
            ".write": "auth != null",
            ".validate": "newData.hasChildren(['type', 'userId', 'timestamp'])"
          }
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```

5. Click **Publish** to save the rules

### 2. Enable Anonymous Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Anonymous** provider
3. **Enable** anonymous authentication
4. Click **Save**

### 3. Test Firebase Connection

After updating the rules and enabling anonymous auth, run:

```bash
npm run test:firebase
```

This will test:
- ✅ Firebase initialization
- ✅ Anonymous authentication
- ✅ Database read/write operations
- ✅ Connection status

### 4. Expected Results

Once setup is complete, you should see:
- Connection Status shows **"Live Sync"** instead of "Offline Mode"
- Console logs show successful Firebase connection
- Collaboration features will work
- Real-time synchronization between devices

## Troubleshooting

### If connection still fails:

1. **Check Environment Variables**: Ensure all Firebase config values in `.env` are correct
2. **Verify Project ID**: Make sure `collabsync-5d1fb` is the correct project ID
3. **Database URL**: Confirm the database URL format is correct
4. **Rules**: Double-check that the rules were saved correctly in Firebase Console
5. **Anonymous Auth**: Verify anonymous authentication is enabled

### Common Issues:

- **Permission Denied**: Rules not updated or anonymous auth not enabled
- **Network Error**: Check internet connection and Firebase service status
- **Invalid Config**: Verify all environment variables are set correctly

## What's Implemented

The app now includes:
- ✅ **Anonymous Authentication**: Automatically signs in users anonymously
- ✅ **Connection Testing**: Tests read/write operations to verify connectivity
- ✅ **Graceful Fallback**: Falls back to localStorage if Firebase is unavailable
- ✅ **Connection Status Display**: Shows real-time connection status
- ✅ **Session Management**: Creates collaborative sessions when Firebase is available
- ✅ **Real-time Sync**: Syncs notes and activities across devices

## Next Steps

After Firebase is connected:
1. Test collaboration features by opening the app in multiple browser tabs
2. Create a session and share the QR code with other devices
3. Verify real-time synchronization of notes and activities
4. Test the export features with collaborative data