import React, { useState } from 'react';
import {
  saveSession,
  loadSession,
  exportSessionCSV
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

export default function Notes({ slateInfo, sessionStart, useGlobalTime, timecodeInfo }) {
  const [noteText, setNoteText] = useState("");

  // Generate a sessionId for this session (could be improved for multi-session)
  const sessionId = `${slateInfo.prod || 'default'}-${sessionStart}`;

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = loadSession(sessionId);
    if (saved && Array.isArray(saved.notes)) {
      setNotes(saved.notes);
    }
  }, [sessionId]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    saveSession(sessionId, { notes });
  }, [notes, sessionId]);

  function exportNotes() {
    if (!noteText.trim()) {
      alert('No notes to export!');
      return;
    }
    const sessionDate = new Date();
    let exportContent = '';
    exportContent += '==============================================\n';
    exportContent += '           VIDEO SHOOT NOTES\n';
    exportContent += '==============================================\n\n';
    exportContent += 'SESSION INFORMATION:\n';
    exportContent += `Date: ${sessionDate.toLocaleDateString()}\n`;
    exportContent += `Time: ${sessionDate.toLocaleTimeString()}\n`;
    exportContent += `Session Start: ${formatTime(sessionStart, true)} (Global) / ${formatTime(0, false)} (Relative)\n\n`;
    exportContent += 'SLATE INFORMATION:\n';
    exportContent += `Production: ${slateInfo.prod || ''}\n`;
    exportContent += `Director: ${slateInfo.director || ''}\n`;
    exportContent += `Scene: ${slateInfo.scene || ''}\n`;
    exportContent += `Take: ${slateInfo.take || ''}\n`;
    exportContent += `Roll: ${slateInfo.roll || ''}\n`;
    exportContent += `Camera: ${slateInfo.camera || ''}\n`;
    exportContent += `Slate Notes: ${slateInfo.notes || ''}\n\n`;
    exportContent += '==============================================\n';
    exportContent += '                 NOTES\n';
    exportContent += '==============================================\n\n';
    // Add timestamps to each note line
    const lines = noteText.split('\n');
    const now = Date.now();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() && (i === 0 || lines[i-1].trim() === '')) {
        const globalTime = formatTime(now, true);
        const relativeTime = formatTime(now - sessionStart, false);
        exportContent += `[${globalTime} | +${relativeTime}] `;
      }
      exportContent += line + '\n';
    }
    exportContent += '\n\n==============================================\n';
    exportContent += 'Legend: [Global Time | +Time from Start]\n';
    exportContent += '==============================================\n';
    try {
      const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-shoot-notes-${sessionDate.toISOString().slice(0,10)}.txt`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Notes exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }

  return (
    <div className="notes-container">
      <div className="notes-header">
        <div className="notes-title">Session Notes</div>
        <button className="export-btn" onClick={exportNotes}>Export Notes</button>
      </div>
      <textarea
        className="note-editor"
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder={`Start typing your notes here...\n\nEach time you press Enter, a new timestamped entry will be created automatically.\n\nYou can write paragraphs, add bullet points, or structure your notes however you like.`}
      />
    </div>
  );
} 