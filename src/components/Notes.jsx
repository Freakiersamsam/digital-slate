import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  saveSession,
  loadSession,
  exportSessionCSV,
  exportAllSessions,
  getStorageInfo,
  removeSession
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

const Notes = forwardRef(function Notes({ slateInfo, sessionStart, useGlobalTime, takeTimerRunning, onSync, onStopTake }, ref) {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Live update for time from start
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10);
    return () => clearInterval(interval);
  }, []);

  // Generate a sessionId for this session
  const sessionId = `${slateInfo.prod || 'default'}-${sessionStart}`;

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = loadSession(sessionId);
    if (saved) {
      setNotes(saved.notes || []);
      setNoteText(saved.noteText || "");
    }
    // Update storage info
    setStorageInfo(getStorageInfo());
  }, [sessionId]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0 || noteText.trim()) {
      saveSession(sessionId, {
        notes,
        noteText,
        slateInfo,
        sessionStart,
        lastModified: new Date().toISOString()
      });
      // Update storage info after save
      setStorageInfo(getStorageInfo());
    }
  }, [notes, noteText, sessionId, slateInfo, sessionStart]);

  // Add a new note with timestamp
  function addNote(text) {
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
  }

  // Add note externally (from App)
  function addNoteExternal(text, timestamp, customSlateInfo) {
    const newNote = {
      id: timestamp,
      timecodeIn: formatTime(timestamp, true),
      relativeTime: formatTime(timestamp - sessionStart, false),
      timestamp,
      content: text,
      slateInfo: { ...customSlateInfo }
    };
    setNotes(prev => [...prev, newNote]);
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

  // Clear session notes
  function clearSession() {
    if (window.confirm('Are you sure you want to clear all notes for this session?')) {
      setNotes([]);
      setNoteText("");
      removeSession(`${slateInfo.prod || 'default'}-${sessionStart}`);
    }
  }

  return (
    <div className="notes-container">
      <div className="notes-timecode-bar">
        <span className="notes-timecode">{formatTime(now - sessionStart, false)}</span>
      </div>
      <div className="notes-header">
        <div className="notes-title">Session Notes</div>
        <div className="notes-actions">
          <button className="sync-button" onClick={takeTimerRunning ? onStopTake : onSync}>
            {takeTimerRunning ? 'STOP TAKE' : 'SYNC'}
          </button>
          <button className="export-btn" onClick={handleExportAll}>Backup All</button>
          <button className="export-btn" onClick={clearSession}>Clear Session</button>
        </div>
      </div>
      <div className="note-input-container">
        <textarea
          className="note-editor"
          value={noteText}
          onChange={handleNoteInput}
          onKeyPress={handleKeyPress}
          placeholder="Type your note and press Enter to add it..."
        />
        <div className="note-input-help">
          Press Enter to add a note, Shift+Enter for new line
        </div>
      </div>
      <div className="notes-list">
        {[...notes].reverse().map(note => (
          <div key={note.id} className="note-item">
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
            <button 
              className="delete-note"
              onClick={() => deleteNote(note.id)}
              title="Delete note"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Notes; 