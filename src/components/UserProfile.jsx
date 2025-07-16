import React, { useState } from 'react';
import { useAuth, authUtils } from '../contexts/AuthContext';
import authService from '../services/authService';

export function UserProfile({ onClose }) {
  const { user, isAnonymous } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.updateUserProfile({
        displayName: displayName.trim()
      });

      if (result.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      setLoading(true);
      try {
        await authService.signOut();
        onClose();
      } catch (err) {
        setError('Failed to sign out. Please try again.');
        setLoading(false);
      }
    }
  };

  const userColor = authUtils.getUserColor(user.uid);
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
  const lastSignIn = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Unknown';

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <div 
          className="user-avatar" 
          style={{ backgroundColor: userColor }}
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" />
          ) : (
            <span className="avatar-text">
              {authService.getUserDisplayName(user).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="user-info">
          <h3>{authService.getUserDisplayName(user)}</h3>
          {user.email && (
            <p className="user-email">{user.email}</p>
          )}
          <p className="user-status">
            {isAnonymous ? (
              <span className="status-anonymous">Anonymous User</span>
            ) : (
              <span className="status-authenticated">Authenticated</span>
            )}
          </p>
        </div>
      </div>

      {isAnonymous && (
        <div className="anonymous-notice">
          <h4>Save Your Data</h4>
          <p>You're using anonymous mode. Create an account to keep your data safe and access it from any device.</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-section">
        <h4>Profile Information</h4>
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others will see you"
                disabled={loading}
              />
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(user?.displayName || '');
                  setError('');
                }}
                disabled={loading}
                className="button secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="button primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-row">
              <span className="label">Display Name:</span>
              <span className="value">{user.displayName || 'Not set'}</span>
            </div>
            {user.email && (
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
            )}
            <div className="info-row">
              <span className="label">User ID:</span>
              <span className="value user-id">{user.uid}</span>
            </div>
            <div className="info-row">
              <span className="label">Joined:</span>
              <span className="value">{joinDate}</span>
            </div>
            <div className="info-row">
              <span className="label">Last Sign In:</span>
              <span className="value">{lastSignIn}</span>
            </div>
            
            {!isAnonymous && (
              <button 
                onClick={() => setIsEditing(true)}
                className="button secondary"
                style={{ marginTop: '16px' }}
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      <div className="profile-actions">
        <button 
          onClick={handleSignOut}
          disabled={loading}
          className="button danger"
        >
          {loading ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>

      <style jsx>{`
        .user-profile-container {
          background: var(--color-background);
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-text {
          color: white;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .user-info h3 {
          margin: 0 0 4px 0;
          color: var(--color-text);
          font-size: 18px;
          font-weight: 600;
        }

        .user-email {
          margin: 0 0 8px 0;
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .user-status {
          margin: 0;
          font-size: 12px;
        }

        .status-anonymous {
          color: var(--color-warning);
          background: var(--color-warning-bg);
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .status-authenticated {
          color: var(--color-success);
          background: var(--color-success-bg);
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .anonymous-notice {
          background: var(--color-warning-bg);
          border: 1px solid var(--color-warning);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .anonymous-notice h4 {
          margin: 0 0 8px 0;
          color: var(--color-warning-text);
          font-size: 16px;
        }

        .anonymous-notice p {
          margin: 0;
          color: var(--color-warning-text);
          font-size: 14px;
          line-height: 1.4;
        }

        .error-message {
          background: var(--color-error-bg);
          border: 1px solid var(--color-error);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          color: var(--color-error-text);
          font-size: 14px;
        }

        .success-message {
          background: var(--color-success-bg);
          border: 1px solid var(--color-success);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          color: var(--color-success-text);
          font-size: 14px;
        }

        .profile-section {
          margin-bottom: 24px;
        }

        .profile-section h4 {
          margin: 0 0 16px 0;
          color: var(--color-text);
          font-size: 16px;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: var(--color-text);
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 14px;
          background: var(--color-background);
          color: var(--color-text);
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-alpha);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .profile-info {
          
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-border-light);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row .label {
          color: var(--color-text-secondary);
          font-size: 14px;
          font-weight: 500;
        }

        .info-row .value {
          color: var(--color-text);
          font-size: 14px;
        }

        .user-id {
          font-family: monospace;
          font-size: 12px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-actions {
          padding-top: 20px;
          border-top: 1px solid var(--color-border);
        }

        .button {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button.primary {
          background: var(--color-primary);
          color: white;
        }

        .button.primary:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        .button.secondary {
          background: var(--color-secondary);
          color: var(--color-text);
          border: 1px solid var(--color-border);
        }

        .button.secondary:hover:not(:disabled) {
          background: var(--color-secondary-dark);
        }

        .button.danger {
          background: var(--color-error);
          color: white;
          width: 100%;
        }

        .button.danger:hover:not(:disabled) {
          background: var(--color-error-dark);
        }
      `}</style>
    </div>
  );
}