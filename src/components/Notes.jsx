import React, { useState, useEffect } from 'react';
import {
  saveSession,
  loadSession,
  exportSessionCSV,
  exportAllSessions,
  getStorageInfo
} from '../localStorage';

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

export default function Notes({ slateInfo, sessionStart, useGlobalTime, timecodeInfo }) {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);

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

  return (
    <div className="notes-container">
      <div className="notes-header">
        <div className="notes-title">Session Notes</div>
        <div className="notes-actions">
          {storageInfo && (
            <div className="storage-info">
              {Math.round(storageInfo.usagePercentage)}% used
              ({storageInfo.sessionCount} sessions)
            </div>
          )}
          <button className="export-btn" onClick={exportNotesCSV}>Export CSV</button>
          <button className="export-btn" onClick={handleExportAll}>Backup All</button>
        </div>
      </div>
      
      <div className="notes-list">
        {notes.map(note => (
          <div key={note.id} className="note-item">
            <div className="note-timestamp">
              [{note.timecodeIn} | +{note.relativeTime}]
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
    </div>
  );
} 