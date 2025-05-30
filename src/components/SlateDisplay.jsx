import React from 'react';

export default function SlateDisplay({ slateInfo }) {
  return (
    <div className="slate-display">
      <h2>Prod: {slateInfo.prod || ''}</h2>
      <h2>Roll: {slateInfo.roll || ''}</h2>
      <h2>Scene: {slateInfo.scene || ''}</h2>
      <h2>Take: {slateInfo.take || ''}</h2>
      <h2>Director: {slateInfo.director || ''}</h2>
      <h2>Camera: {slateInfo.camera || ''}</h2>
    </div>
  );
} 