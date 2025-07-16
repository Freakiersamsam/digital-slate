import React, { useState, useRef, useEffect, useCallback } from 'react';
import SlateForm from './components/SlateForm';
import ColorChart from './components/ColorChart';
import Notes from './components/Notes';
import { ThemeToggle } from './components/ThemeToggle';
import { ConnectionStatus } from './components/ConnectionStatus';
import { LoginModal } from './components/LoginModal';
import { UserProfile } from './components/UserProfile';
import { useFirebaseStatus } from './hooks/useFirebaseStatus';
import { useAuth, authUtils } from './contexts/AuthContext';
import sessionManager from './services/sessionManager';

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = 800;
  o.connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), 300);
}

function formatTime(ms, isGlobal = true) {
  if (isGlobal) {
    const date = new Date(ms);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const msStr = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${msStr}`;
  } else {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const msStr = (ms % 1000).toString().padStart(3, '0');
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${msStr}`;
  }
}

export default function App() {
  const [tab, setTab] = useState('timecode');
  const [slateInfo, setSlateInfo] = useState({ prod: '', roll: '', scene: '', take: '1', director: '', camera: '', dop: '', notes: '' });
  const [showColorChart, setShowColorChart] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [useGlobalTime, setUseGlobalTime] = useState(true);
  const [globalTime, setGlobalTime] = useState(Date.now());
  const [startTime] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState('Ready');
  const globalTimerRef = useRef();

  // Authentication UI state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { user, isAnonymous, isAuthenticated } = useAuth();

  // Local take timer state
  const [takeTimerRunning, setTakeTimerRunning] = useState(false);
  const [takeStartTime, setTakeStartTime] = useState(null);
  const [takeEndTime, setTakeEndTime] = useState(null);
  const [_takeDuration, setTakeDuration] = useState(0);
  const [_takeNumber, _setTakeNumber] = useState('1');
  const [lastTakeGlow, setLastTakeGlow] = useState(false);
  const notesRef = useRef();
  
  // Firebase connection status
  const firebaseStatus = useFirebaseStatus();
  
  // Collaboration state
  const [sessionId, setSessionId] = useState(null);
  const [joinUrl, setJoinUrl] = useState(null);
  const userId = user?.uid || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Global timer
  useEffect(() => {
    if (!isPaused) {
      globalTimerRef.current = setInterval(() => setGlobalTime(Date.now()), 10);
    } else {
      clearInterval(globalTimerRef.current);
    }
    return () => clearInterval(globalTimerRef.current);
  }, [isPaused]);

  const elapsed = globalTime - startTime;
  
  // Cleanup session on unmount (temporarily disabled)
  // useEffect(() => {
  //   return () => {
  //     if (sessionId) {
  //       sessionService.unsubscribe();
  //       notesService.destroy();
  //     }
  //   };
  // }, [sessionId]);

  // Start take (SYNC)
  const handleSync = useCallback(async () => {
    try {
      // Record the exact time the sync button is clicked
      const syncClickTime = Date.now();
      
      // Log sync for debugging
      console.log('[App] Sync clicked at:', new Date(syncClickTime).toISOString());
      console.log('[App] Firebase status:', firebaseStatus);

      // Create collaboration session if Firebase is available
      if (firebaseStatus.connected && !sessionId) {
        try {
          const session = await sessionManager.createSession(slateInfo, userId);
          setSessionId(session.sessionId);
          setJoinUrl(session.joinUrl);
          
          console.log('[App] Created session:', session.sessionId);
          console.log('[App] Join URL:', session.joinUrl);
        } catch (error) {
          console.warn('[App] Failed to create session:', error.message);
        }
      }

      // Update sync time if session exists
      if (sessionId) {
        try {
          await sessionManager.updateSyncTime(sessionId, syncClickTime);
        } catch (error) {
          console.warn('[App] Failed to update sync time:', error.message);
        }
      }
      
      playBeep();
      setShowColorChart(true);
      setSyncStatus('TAKE RUNNING');
      setIsPaused(true);
      
      // Set timer and note immediately with the snapped time
      setTakeTimerRunning(true);
      setTakeStartTime(syncClickTime);
      setTakeEndTime(null);
      setTakeDuration(0);
      
      // Add note for take start using notes ref
      const scene = slateInfo.scene ? `Scene ${slateInfo.scene}` : '';
      const take = slateInfo.take ? `Take ${slateInfo.take}` : '';
      const label = [scene, take].filter(Boolean).join(' ');
      
      // Add note via localStorage only
      if (notesRef.current) {
        notesRef.current.addNoteExternal(
          `🎬 Take started at ${formatTime(syncClickTime, true)}${label ? ` (${label})` : ''}`,
          syncClickTime,
          { ...slateInfo, type: 'take_start' }
        );
      }
      
      // Show color chart for 3s, then hide and unpause
      setTimeout(() => {
        setShowColorChart(false);
        setTimeout(() => {
          setIsPaused(false);
          setSyncStatus('TAKE RUNNING');
        }, 2000);
      }, 3000);
    } catch (err) {
      console.error('Error in handleSync:', err);
      setSyncStatus('Error - Try Again');
    }
  }, [firebaseStatus, sessionId, slateInfo, notesRef, userId, setSessionId, setJoinUrl, setIsPaused, setSyncStatus, setTakeTimerRunning, setTakeStartTime, setTakeEndTime, setTakeDuration]);

  // Stop take
  const handleStopTake = useCallback(async () => {
    try {
      const now = Date.now();
      setTakeTimerRunning(false);
      setTakeEndTime(now);
      const duration = now - takeStartTime;
      setTakeDuration(duration);
      setSyncStatus('Ready');
      
      // Add note for take end using notes ref
      const scene = slateInfo.scene ? `Scene ${slateInfo.scene}` : '';
      const take = slateInfo.take ? `Take ${slateInfo.take}` : '';
      const label = [scene, take].filter(Boolean).join(' ');
      
      // Add end note via localStorage only
      if (notesRef.current) {
        notesRef.current.addNoteExternal(
          `⏹️ Take ended at ${formatTime(now, true)} (duration: ${formatTime(duration, false)})${label ? ` (${label})` : ''}`,
          now,
          { ...slateInfo, type: 'take_end', duration }
        );
      }
      
      // Increment take number with animation
      setTimeout(() => {
        setLastTakeGlow(true);
        setSlateInfo(prev => ({ ...prev, take: (parseInt(prev.take || '1', 10) + 1).toString() }));
        setTimeout(() => setLastTakeGlow(false), 1200);
      }, 300);
    } catch (err) {
      console.error('Error in handleStopTake:', err);
    }
  }, [takeStartTime, slateInfo, notesRef, setTakeTimerRunning, setTakeEndTime, setTakeDuration, setSyncStatus, setLastTakeGlow, setSlateInfo]);

  function toggleTimeFormat() {
    setUseGlobalTime(v => !v);
  }

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        tab === 'timecode' &&
        e.key === 'Enter' &&
        document.activeElement &&
        ['INPUT', 'TEXTAREA'].indexOf(document.activeElement.tagName) === -1
      ) {
        e.preventDefault();
        if (!takeTimerRunning) handleSync();
        else handleStopTake();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, takeTimerRunning, slateInfo, takeStartTime, handleSync, handleStopTake]);

  // Button label
  const buttonLabel = takeTimerRunning ? 'STOP TAKE' : 'SYNC';

  // Prevent unwanted zooming on mobile
  useEffect(() => {
    const preventZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventZoom, { passive: false });
    return () => document.removeEventListener('touchmove', preventZoom);
  }, []);

  // Add touch event handling for sync/stop
  const handleTouchStart = useRef(null);
  const handleTouchEnd = useRef(null);

  useEffect(() => {
    let touchStartTime = 0;
    const TOUCH_THRESHOLD = 200; // ms

    handleTouchStart.current = (e) => {
      touchStartTime = Date.now();
      // Prevent default only for the sync button to avoid interfering with scrolling
      if (e.target.classList.contains('sync-button')) {
        e.preventDefault();
      }
    };

    handleTouchEnd.current = (e) => {
      const touchDuration = Date.now() - touchStartTime;
      // Only trigger if it's a short touch (not a scroll)
      if (touchDuration < TOUCH_THRESHOLD && e.target.classList.contains('sync-button')) {
        e.preventDefault();
        if (!takeTimerRunning) handleSync();
        else handleStopTake();
      }
    };

    const syncButton = document.querySelector('.sync-button');
    if (syncButton) {
      syncButton.addEventListener('touchstart', handleTouchStart.current, { passive: false });
      syncButton.addEventListener('touchend', handleTouchEnd.current, { passive: false });
    }

    return () => {
      if (syncButton) {
        syncButton.removeEventListener('touchstart', handleTouchStart.current);
        syncButton.removeEventListener('touchend', handleTouchEnd.current);
      }
    };
  }, [takeTimerRunning, handleSync, handleStopTake]);

  return (
    <div className="container">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <div className="tabs">
        <button className={`tab${tab === 'timecode' ? ' active' : ''}`} onClick={() => setTab('timecode')}>Timecode Sync</button>
        <button className={`tab${tab === 'notes' ? ' active' : ''}`} onClick={() => setTab('notes')}>Notes</button>
        <div className="theme-toggle-container">
          <ConnectionStatus status={firebaseStatus} />
          
          {/* User Authentication UI */}
          {isAuthenticated ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setShowUserProfile(true)}
                style={{ backgroundColor: authUtils.getUserColor(user.uid) }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="user-avatar-small" />
                ) : (
                  <span className="user-initial">
                    {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                  </span>
                )}
                {isAnonymous && <span className="anonymous-indicator">👤</span>}
              </button>
            </div>
          ) : (
            <button 
              className="login-button"
              onClick={() => setShowLoginModal(true)}
            >
              Sign In
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
      <div id="timecode-tab" className={`tab-content${tab === 'timecode' ? ' active' : ''}`}> 
        <div className="timecode-display">
          <div className="notes-timecode-bar">
            <span className="notes-timecode">{useGlobalTime ? formatTime(globalTime, true) : (takeTimerRunning && takeStartTime ? formatTime(globalTime - takeStartTime, false) : formatTime(elapsed, false))}</span>
          </div>
          <div className={`sync-status${takeTimerRunning ? ' paused' : ''}`} id="sync-status">{syncStatus}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="sync-button" onClick={takeTimerRunning ? handleStopTake : handleSync}>{buttonLabel}</button>
          <div className="slate-info">
            <h3>Film Slate Information</h3>
            <SlateForm slateInfo={slateInfo} setSlateInfo={setSlateInfo} lastTakeGlow={lastTakeGlow} />
          </div>
          <div className="controls">
            <button className="time-format-toggle" onClick={toggleTimeFormat}>
              Switch to: <span id="format-toggle-text">{useGlobalTime ? 'Time from Start' : 'Global Time'}</span>
            </button>
          </div>
        </div>
        <ColorChart 
          visible={showColorChart} 
          pausedTimecode={useGlobalTime ? formatTime(globalTime, true) : (takeTimerRunning && takeStartTime ? formatTime(globalTime - takeStartTime, false) : formatTime(elapsed, false))}
          slateInfo={slateInfo}
          sessionId={sessionId}
          joinUrl={joinUrl}
        />
      </div>
      <div id="notes-tab" className={`tab-content${tab === 'notes' ? ' active' : ''}`}> 
        <Notes 
          ref={notesRef}
          slateInfo={slateInfo}
          sessionStart={takeStartTime || startTime}
          takeTimerRunning={takeTimerRunning}
          takeStartTime={takeStartTime}
          takeEndTime={takeEndTime}
          sessionId={sessionId}
        />
      </div>

      {/* Authentication Modals */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {showUserProfile && (
        <div className="modal-overlay" onClick={() => setShowUserProfile(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowUserProfile(false)}
              >
                &times;
              </button>
            </div>
            <UserProfile onClose={() => setShowUserProfile(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
