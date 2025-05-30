import React from 'react';

export default function SlateDisplay({ slateInfo }) {
  return (
    <div className="slate-display-card">
      <h2 className="slate-display-title">Production: {slateInfo.prod || ''}</h2>
      <div className="slate-display-info">
        <div><strong>Roll:</strong> {slateInfo.roll || ''}</div>
        <div><strong>Scene:</strong> {slateInfo.scene || ''}</div>
        <div><strong>Take:</strong> {slateInfo.take || ''}</div>
        <div><strong>Director:</strong> {slateInfo.director || ''}</div>
        <div><strong>Camera:</strong> {slateInfo.camera || ''}</div>
      </div>
    </div>
  );
} 