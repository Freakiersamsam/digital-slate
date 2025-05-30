import React from 'react';

export default function ColorChart({ visible }) {
  if (!visible) return null;
  // Simple color chart (customize as needed)
  return (
    <div className="color-chart" style={{ display: 'flex', gap: 4 }}>
      {['#000', '#fff', '#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'].map(color => (
        <div key={color} style={{ width: 40, height: 40, background: color }} />
      ))}
    </div>
  );
} 