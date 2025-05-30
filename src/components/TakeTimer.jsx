import React, { useState, useEffect } from 'react';

export default function TakeTimer({ running, onEnd, notes, setNotes }) {
  const [seconds, setSeconds] = useState(0);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const handleNote = () => {
    setNotes([...notes, { time: seconds, text: noteText }]);
    setNoteText('');
  };

  return (
    <div>
      <h3>Take Timer: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</h3>
      <input
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder="Note"
      />
      <button onClick={handleNote} disabled={!noteText}>Add Note</button>
      <button onClick={() => onEnd(seconds)}>End Take</button>
      <ul>
        {notes.map((n, i) => (
          <li key={i}>
            [{Math.floor(n.time / 60)}:{String(n.time % 60).padStart(2, '0')}] {n.text}
          </li>
        ))}
      </ul>
    </div>
  );
} 