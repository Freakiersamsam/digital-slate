import React from 'react';

export default function Report({ slateInfo, duration, notes }) {
  return (
    <div>
      <h2>Take Report</h2>
      <p>Scene: {slateInfo.scene}</p>
      <p>Take: {slateInfo.take}</p>
      <p>Director: {slateInfo.director}</p>
      <p>Duration: {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</p>
      <h3>Notes</h3>
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