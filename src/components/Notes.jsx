import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import {
  saveSession,
  loadSession,
  exportSessionCSV,
  exportAllSessions,
  getStorageInfo,
  removeSession,
  clearAllData
} from '../sessionStorage';

function formatTime(milliseconds, isGlobal = true) {
  if (isGlobal) {
    const date = new Date(milliseconds);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  } else {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}

const PAUSE_THRESHOLD = 2000; // 2 seconds

const Notes = forwardRef(function Notes({ slateInfo, sessionStart, useGlobalTime, takeTimerRunning, takeStartTime, takeEndTime }, ref) {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const saveTimeout = useRef(null);
  const lastSavedData = useRef({ notes: null, noteText: null });

  // Live update for time from start
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10);
    return () => clearInterval(interval);
  }, []);

  // Generate a sessionId for this session
  const sessionId = `${slateInfo.prod || 'default'}-${sessionStart}`;

  // Load notes from localStorage on mount
  useEffect(() => {
    try {
      const saved = loadSession(sessionId);
      if (saved) {
        setNotes(saved.notes || []);
        setNoteText(saved.noteText || "");
      }
      setStorageInfo(getStorageInfo());
    } catch (err) {
      console.error('Error loading session notes:', err);
    }
  }, [sessionId]);

  // Debounced save notes to localStorage whenever they change
  useEffect(() => {
    if (
      notes === lastSavedData.current.notes &&
      noteText === lastSavedData.current.noteText
    ) {
      return;
    }
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        if (notes.length > 0 || noteText.trim()) {
          saveSession(sessionId, {
            notes,
            noteText,
            slateInfo,
            sessionStart,
            lastModified: new Date().toISOString()
          });
          lastSavedData.current = { notes, noteText };
          setStorageInfo(getStorageInfo());
        }
      } catch (err) {
        console.error('Error saving session notes:', err);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(saveTimeout.current);
  }, [notes, noteText, sessionId, slateInfo, sessionStart]);

  // Show storage warning if usage exceeds 80%
  useEffect(() => {
    if (storageInfo && storageInfo.usagePercentage > 80) {
      setShowStorageWarning(true);
    } else {
      setShowStorageWarning(false);
    }
  }, [storageInfo]);

  // Add a new note with timestamp
  function addNote(text) {
    try {
      if (!text.trim()) return;
      const now = Date.now();
      const newNote = {
        id: Date.now(),
        timecodeIn: formatTime(now, true),
        relativeTime: formatTime(now - sessionStart, false),
        timestamp: now,
        content: text.trim(),
        slateInfo: { ...slateInfo }
      };
      setNotes(prev => [...prev, newNote]);
      setNoteText(""); // Clear the input
    } catch (err) {
      console.error('Error adding note:', err);
    }
  }

  // Add note externally (from App)
  function addNoteExternal(text, timestamp, customSlateInfo) {
    try {
      const newNote = {
        id: timestamp,
        timecodeIn: formatTime(timestamp, true),
        relativeTime: formatTime(timestamp - sessionStart, false),
        timestamp,
        content: text,
        slateInfo: { ...customSlateInfo }
      };
      setNotes(prev => [...prev, newNote]);
    } catch (err) {
      console.error('Error in addNoteExternal:', err);
    }
  }

  useImperativeHandle(ref, () => ({
    addNoteExternal
  }));

  // Handle note input
  function handleNoteInput(e) {
    const text = e.target.value;
    setNoteText(text);
    
    // Auto-save the current note text
    if (text.trim()) {
      saveSession(sessionId, {
        notes,
        noteText: text,
        slateInfo,
        sessionStart,
        lastModified: new Date().toISOString()
      });
    }
  }

  // Handle key press for adding notes
  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote(noteText);
    }
  }

  // Delete a note
  function deleteNote(noteId) {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  }

  // Export notes as CSV
  function exportNotesCSV() {
    if (notes.length === 0) {
      alert('No notes to export!');
      return;
    }
    const sessionDate = new Date().toISOString().slice(0, 10);
    exportSessionCSV({ notes }, `video-shoot-notes-${sessionDate}.csv`);
  }

  // Export all sessions
  function handleExportAll() {
    exportAllSessions(`digital-slate-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

  // Clear session notes (now clears all sessions)
  function clearSession() {
    if (window.confirm("Are you sure you want to clear all sessions (all timer data ever)?")) {
      clearAllData();
      setNotes([]);
      setNoteText("");
    }
  }

  // Export notes as PDF (dynamic import for code splitting)
  async function exportNotesPDF() {
    if (notes.length === 0) {
      alert('No notes to export!');
      return;
    }
    // Use the new modern PDF export utility
    const { exportSessionPDF } = await import('../pdfExport.js');
    const sessionDate = new Date().toISOString().slice(0, 10);
    await exportSessionPDF({
      notes,
      slateInfo,
      sessionStart,
      filename: `video-shoot-notes-${sessionDate}.pdf`
    });
  }

  // Add touch handling for note deletion
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleNoteTouchStart = (e, noteId) => {
    setTouchStartTime(Date.now());
    setTouchStartX(e.touches[0].clientX);
    setActiveNoteId(noteId);
  };

  const handleNoteTouchMove = (e) => {
    if (!touchStartTime || !activeNoteId) return;
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX;
    // If swiped left more than 50px, show delete confirmation
    const noteElement = document.querySelector(`[data-note-id="${activeNoteId}"]`);
    if (deltaX < -50) {
      if (noteElement) noteElement.classList.add('swipe-to-delete');
      setConfirmDeleteId(activeNoteId);
    } else {
      if (noteElement) noteElement.classList.remove('swipe-to-delete');
      setConfirmDeleteId(null);
    }
  };

  const handleNoteTouchEnd = (e) => {
    // Reset touch state
    setTouchStartTime(null);
    setTouchStartX(null);
    setActiveNoteId(null);
  };

  // Add mobile keyboard and orientation handling
  useEffect(() => {
    const handleMobileKeyboard = () => {
      // Scroll to input when keyboard appears
      const input = document.querySelector('.note-editor');
      if (input && document.activeElement === input) {
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    // Listen for resize and orientation changes
    window.addEventListener('resize', handleMobileKeyboard);
    window.addEventListener('orientationchange', handleMobileKeyboard);

    // On landscape, add a class to body for special styling
    const handleOrientation = () => {
      if (window.matchMedia('(orientation: landscape)').matches) {
        document.body.classList.add('landscape-mode');
      } else {
        document.body.classList.remove('landscape-mode');
      }
    };
    window.addEventListener('orientationchange', handleOrientation);
    handleOrientation();

    return () => {
      window.removeEventListener('resize', handleMobileKeyboard);
      window.removeEventListener('orientationchange', handleMobileKeyboard);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Timer logic for the notes tab
  useEffect(() => {
    let interval;
    if (takeTimerRunning) {
      interval = setInterval(() => setNow(Date.now()), 10);
    } else if (takeEndTime) {
      setNow(takeEndTime);
    } else {
      setNow(sessionStart); // show zero before take starts
    }
    return () => clearInterval(interval);
  }, [takeTimerRunning, takeEndTime, sessionStart]);

  return (
    <div className="notes-container">
      {showStorageWarning && (
        <div style={{color: 'var(--color-warning)', background: '#fffbe6', padding: '10px', borderRadius: '8px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center'}}>
          Warning: Storage almost full! Please backup and clear old sessions.
        </div>
      )}
      <div className="notes-timecode-bar">
        <span className="notes-timecode">{
          takeStartTime
            ? (takeTimerRunning
                ? formatTime(now - takeStartTime, false)
                : formatTime((takeEndTime || now) - takeStartTime, false))
            : '00:00:00.000'
        }</span>
      </div>
      <div className="notes-header">
        <div className="notes-title">Session Notes</div>
        <div className="notes-actions">
          <button className="export-btn" onClick={handleExportAll}>Backup All</button>
          <button className="export-btn" onClick={clearSession}>Clear Session</button>
          <button className="export-btn" onClick={exportNotesPDF}>Export PDF</button>
        </div>
      </div>
      <div className="note-input-container">
        <textarea
          className="note-editor"
          value={noteText}
          onChange={handleNoteInput}
          onKeyPress={handleKeyPress}
          placeholder="Type your note and press Enter to add it..."
          enterKeyHint="send"
        />
        <div className="note-input-help">
          Press Enter to add a note, Shift+Enter for new line
          <span className="mobile-help">(Swipe left on a note to delete, then confirm)</span>
        </div>
      </div>
      <div className="notes-list">
        {[...notes].reverse().map(note => (
          <div 
            key={note.id} 
            className={`note-item${confirmDeleteId === note.id ? ' swipe-to-delete' : ''}`}
            data-note-id={note.id}
            onTouchStart={(e) => handleNoteTouchStart(e, note.id)}
            onTouchMove={handleNoteTouchMove}
            onTouchEnd={handleNoteTouchEnd}
          >
            <div className="note-meta-row">
              <span className="note-timestamp">
                [{note.timecodeIn} | +{note.relativeTime}]
              </span>
              {note.slateInfo && (note.slateInfo.scene || note.slateInfo.take) && (
                <span className="note-scene-take">
                  {note.slateInfo.scene && <span>Scene {note.slateInfo.scene}</span>}
                  {note.slateInfo.scene && note.slateInfo.take && <span> · </span>}
                  {note.slateInfo.take && <span>Take {note.slateInfo.take}</span>}
                </span>
              )}
            </div>
            <div className="note-content">{note.content}</div>
            {confirmDeleteId === note.id ? (
              <button 
                className="delete-note confirm"
                onClick={() => { deleteNote(note.id); setConfirmDeleteId(null); }}
                aria-label="Confirm delete note"
              >
                Confirm Delete
              </button>
            ) : (
              <button 
                className="delete-note"
                onClick={() => setConfirmDeleteId(note.id)}
                aria-label="Delete note"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Notes;