import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

export function LoginModal({ isOpen, onClose, mode = 'signin' }) {
  const [currentMode, setCurrentMode] = useState(mode); // 'signin', 'signup', 'reset'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isAnonymous } = useAuth();

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;

      if (currentMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        if (isAnonymous) {
          // Link anonymous account
          result = await authService.linkAnonymousWithEmail(
            formData.email, 
            formData.password, 
            formData.displayName
          );
        } else {
          // Create new account
          result = await authService.signUpWithEmail(
            formData.email, 
            formData.password, 
            formData.displayName
          );
        }
      } else if (currentMode === 'signin') {
        result = await authService.signInWithEmail(formData.email, formData.password);
      } else if (currentMode === 'reset') {
        result = await authService.sendPasswordReset(formData.email);
        if (result.success) {
          setError(''); // Clear any previous errors
          alert('Password reset email sent! Check your inbox.');
          setCurrentMode('signin');
          return;
        }
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isAnonymous) {
        result = await authService.linkAnonymousWithGoogle();
      } else {
        result = await authService.signInWithGoogle();
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await authService.signInAnonymously();
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Anonymous sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isAnonymous && (currentMode === 'signin' || currentMode === 'signup')) {
      return 'Create Account & Save Your Data';
    }
    switch (currentMode) {
      case 'signup': return 'Create Account';
      case 'reset': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  const getSubmitText = () => {
    if (isAnonymous && (currentMode === 'signin' || currentMode === 'signup')) {
      return loading ? 'Linking Account...' : 'Link Account';
    }
    switch (currentMode) {
      case 'signup': return loading ? 'Creating Account...' : 'Create Account';
      case 'reset': return loading ? 'Sending Email...' : 'Send Reset Email';
      default: return loading ? 'Signing In...' : 'Sign In';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {isAnonymous && (
            <div className="anonymous-notice">
              <p>You're currently using anonymous mode. Link an account to save your data permanently.</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleEmailAuth}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            {currentMode !== 'reset' && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  minLength="6"
                />
              </div>
            )}

            {currentMode === 'signup' && (
              <>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Display Name (Optional)</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="How others will see you"
                  />
                </div>
              </>
            )}

            <button type="submit" className="auth-button primary" disabled={loading}>
              {getSubmitText()}
            </button>
          </form>

          {currentMode !== 'reset' && (
            <>
              <div className="divider">or</div>

              <button 
                className="auth-button google" 
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {!isAnonymous && !user && (
                <button 
                  className="auth-button anonymous" 
                  onClick={handleAnonymousSignIn}
                  disabled={loading}
                >
                  Continue as Guest
                </button>
              )}
            </>
          )}

          <div className="auth-links">
            {currentMode === 'signin' && (
              <>
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => setCurrentMode('signup')}
                >
                  Don't have an account? Sign up
                </button>
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => setCurrentMode('reset')}
                >
                  Forgot password?
                </button>
              </>
            )}
            {currentMode === 'signup' && (
              <button 
                type="button" 
                className="link-button"
                onClick={() => setCurrentMode('signin')}
              >
                Already have an account? Sign in
              </button>
            )}
            {currentMode === 'reset' && (
              <button 
                type="button" 
                className="link-button"
                onClick={() => setCurrentMode('signin')}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: var(--color-background);
            border-radius: 12px;
            width: 90%;
            max-width: 420px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 24px 0 24px;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 24px;
          }

          .modal-header h2 {
            margin: 0;
            color: var(--color-text);
            font-size: 20px;
            font-weight: 600;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--color-text-secondary);
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-close:hover {
            color: var(--color-text);
          }

          .modal-body {
            padding: 0 24px 24px;
          }

          .anonymous-notice {
            background: var(--color-warning-bg);
            border: 1px solid var(--color-warning);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
          }

          .anonymous-notice p {
            margin: 0;
            color: var(--color-warning-text);
            font-size: 14px;
          }

          .error-message {
            background: var(--color-error-bg);
            border: 1px solid var(--color-error);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
            color: var(--color-error-text);
            font-size: 14px;
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
            padding: 12px;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            font-size: 16px;
            background: var(--color-background);
            color: var(--color-text);
            box-sizing: border-box;
          }

          .form-group input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-alpha);
          }

          .form-group input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .auth-button {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 12px;
            border: none;
          }

          .auth-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .auth-button.primary {
            background: var(--color-primary);
            color: white;
          }

          .auth-button.primary:hover:not(:disabled) {
            background: var(--color-primary-dark);
          }

          .auth-button.google {
            background: white;
            color: #333;
            border: 1px solid #ddd;
          }

          .auth-button.google:hover:not(:disabled) {
            background: #f8f9fa;
          }

          .auth-button.anonymous {
            background: var(--color-secondary);
            color: var(--color-text);
            border: 1px solid var(--color-border);
          }

          .auth-button.anonymous:hover:not(:disabled) {
            background: var(--color-secondary-dark);
          }

          .divider {
            text-align: center;
            margin: 20px 0;
            position: relative;
            color: var(--color-text-secondary);
            font-size: 14px;
          }

          .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--color-border);
            z-index: 1;
          }

          .divider::after {
            content: 'or';
            background: var(--color-background);
            padding: 0 16px;
            position: relative;
            z-index: 2;
          }

          .auth-links {
            text-align: center;
            margin-top: 20px;
          }

          .link-button {
            background: none;
            border: none;
            color: var(--color-primary);
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
            margin: 4px 0;
            display: block;
            width: 100%;
          }

          .link-button:hover {
            color: var(--color-primary-dark);
          }

          @media (prefers-color-scheme: dark) {
            .auth-button.google {
              background: #2d2d2d;
              color: #fff;
              border-color: #555;
            }
            
            .auth-button.google:hover:not(:disabled) {
              background: #3d3d3d;
            }
          }
        `}</style>
      </div>
    </div>
  );
}