import React from 'react';

export default function SlateDisplay({ slateInfo }) {
  return (
    <div className="slate-display">
      <h2>Scene: {slateInfo.scene}</h2>
      <h2>Take: {slateInfo.take}</h2>
      <h2>Director: {slateInfo.director}</h2>
    </div>
  );
} 