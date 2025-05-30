import React, { useState, useRef, useEffect } from 'react';

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

export default function Notes({ slateInfo, sessionStart, useGlobalTime }) {
  const [currentText, setCurrentText] = useState('');
  const [notes, setNotes] = useState([]); // { text, timestamp }
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef(null);
  const noteStartTimestamp = useRef(null);

  // When user types, start a new note if not already typing
  const handleInput = (e) => {
    const value = e.target.value;
    setCurrentText(value);
    if (!typing) {
      // Start of new note
      noteStartTimestamp.current = Date.now();
      setTyping(true);
    }
    // Reset the pause timer
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (value.trim()) {
        setNotes((prev) => [
          ...prev,
          {
            text: value.trim(),
            timestamp: noteStartTimestamp.current,
          },
        ]);
        setCurrentText('');
      }
      setTyping(false);
    }, PAUSE_THRESHOLD);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  // Optionally, allow manual save of note (e.g., on button click)
  const handleManualSave = () => {
    if (currentText.trim()) {
      setNotes((prev) => [
        ...prev,
        {
          text: currentText.trim(),
          timestamp: noteStartTimestamp.current || Date.now(),
        },
      ]);
      setCurrentText('');
      setTyping(false);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }
  };

  // Export notes as a dynamic HTML report
  const handleExport = () => {
    const sessionDate = new Date();
    const html = `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>Video Shoot Notes Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2em; background: #f9f9f9; color: #222; }
    h1, h2, h3 { color: #2a3d66; }
    .section { margin-bottom: 2em; }
    .slate-table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
    .slate-table th, .slate-table td { border: 1px solid #ccc; padding: 8px; }
    .notes-list { margin-top: 1em; }
    .note-entry { background: #fff; border-radius: 6px; box-shadow: 0 1px 3px #0001; margin-bottom: 1em; padding: 1em; }
    .note-timestamp { font-size: 0.95em; color: #555; margin-bottom: 0.5em; }
    .note-text { font-size: 1.1em; }
    .search-bar { margin-bottom: 1em; }
    .summary { background: #e3eefd; padding: 1em; border-radius: 6px; margin-bottom: 2em; }
  </style>
</head>
<body>
  <h1>Video Shoot Notes Report</h1>
  <div class='section summary'>
    <strong>Date:</strong> ${sessionDate.toLocaleDateString()}<br/>
    <strong>Time:</strong> ${sessionDate.toLocaleTimeString()}<br/>
    <strong>Total Notes:</strong> ${notes.length}
  </div>
  <div class='section'>
    <h2>Slate Information</h2>
    <table class='slate-table'>
      <tr><th>Production</th><td>${slateInfo.prod || ''}</td></tr>
      <tr><th>Director</th><td>${slateInfo.director || ''}</td></tr>
      <tr><th>Scene</th><td>${slateInfo.scene || ''}</td></tr>
      <tr><th>Take</th><td>${slateInfo.take || ''}</td></tr>
      <tr><th>Roll</th><td>${slateInfo.roll || ''}</td></tr>
      <tr><th>Camera</th><td>${slateInfo.camera || ''}</td></tr>
      <tr><th>Slate Notes</th><td>${slateInfo.notes || ''}</td></tr>
    </table>
  </div>
  <div class='section'>
    <h2>Notes</h2>
    <input class='search-bar' type='text' id='search' placeholder='Search notes...' oninput='filterNotes()' />
    <div class='notes-list' id='notes-list'>
      ${notes.map((note, idx) => `
        <div class='note-entry' data-text='${note.text.replace(/'/g, "&#39;").replace(/"/g, '&quot;')}'>
          <div class='note-timestamp'><strong>Timestamp:</strong> ${formatTime(note.timestamp, true)}</div>
          <div class='note-text'>${note.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `).join('')}
    </div>
  </div>
  <script>
    function filterNotes() {
      const query = document.getElementById('search').value.toLowerCase();
      document.querySelectorAll('.note-entry').forEach(entry => {
        const text = entry.getAttribute('data-text').toLowerCase();
        entry.style.display = text.includes(query) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="notes-container">
      <div className="notes-header">
        <div className="notes-title">Session Notes</div>
        <button className="export-btn" onClick={handleManualSave}>Save Note</button>
        <button className="export-btn" onClick={handleExport}>Export Report</button>
      </div>
      <textarea
        className="note-editor"
        value={currentText}
        onChange={handleInput}
        placeholder={`Start typing your notes here...\n\nA new note entry is created when you pause typing for 2 seconds or press 'Save Note'.`}
        rows={8}
      />
    </div>
  );
} 