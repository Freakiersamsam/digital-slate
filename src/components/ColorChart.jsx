import React from 'react';

export default function ColorChart({ visible }) {
  if (!visible) return null;
  // X-Rite ColorChecker Classic 24-patch chart colors
  const xriteColors = [
    '#735244', '#c29682', '#627a9d', '#576c43', '#8580b1', '#67bdaa',
    '#d67e2c', '#505ba6', '#c15a63', '#5e3c6c', '#9dbc40', '#e0a32e',
    '#383d96', '#469449', '#af363c', '#e7c71f', '#bb5695', '#0885a1',
    '#f3f3f2', '#cfcfcf', '#a0a0a0', '#7a7a7a', '#555555', '#222222'
  ];
  return (
    <div className="color-chart-overlay" style={{ display: 'block' }}>
      <div className="color-chart-info">
        <div>COLOR CALIBRATION CHART</div>
        <div style={{ fontSize: '0.9rem', marginTop: 10 }}>Displaying for 3 seconds...</div>
      </div>
    </div>
  );
} 