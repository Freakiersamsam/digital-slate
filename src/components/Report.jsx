import React from 'react';

export default function Report({ slateInfo, duration, notes }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%',
      padding: '32px 0',
      background: 'transparent',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px #0002',
        padding: '32px 24px',
        maxWidth: '480px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h2 style={{ color: '#2a3d66', fontWeight: 700, marginBottom: 16 }}>Take Report</h2>
        <p><strong>Scene:</strong> {slateInfo.scene}</p>
        <p><strong>Take:</strong> {slateInfo.take}</p>
        <p><strong>Director:</strong> {slateInfo.director}</p>
        <p><strong>Duration:</strong> {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</p>
        <h3 style={{ color: '#2a3d66', marginTop: 24, marginBottom: 12 }}>Notes</h3>
        <ul style={{ width: '100%', paddingLeft: 0 }}>
          {notes.map((n, i) => (
            <li key={i} style={{
              background: '#f9f9f9',
              borderRadius: 8,
              marginBottom: 10,
              padding: '10px 14px',
              listStyle: 'none',
              fontSize: '1.05rem',
            }}>
              <span style={{ color: '#555', fontWeight: 600 }}>
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