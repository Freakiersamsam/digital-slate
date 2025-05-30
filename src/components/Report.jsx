import React from 'react';

export default function Report({ slateInfo, duration, notes }) {
  return (
    <div className="report-container">
      <div className="report-card">
        <h2 className="report-title">Take Report</h2>
        <div className="report-info">
          <div><strong>Scene:</strong> {slateInfo.scene}</div>
          <div><strong>Take:</strong> {slateInfo.take}</div>
          <div><strong>Director:</strong> {slateInfo.director}</div>
          <div><strong>Duration:</strong> {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</div>
        </div>
        <h3 className="report-notes-title">Notes</h3>
        <ul className="report-notes-list">
          {notes.map((n, i) => (
            <li key={i} className="report-note-entry">
              <span className="report-note-time">
                [{Math.floor(n.time / 60)}:{String(n.time % 60).padStart(2, '0')}]&nbsp;
              </span>
              {n.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 