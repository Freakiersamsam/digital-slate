import React from 'react';

// Helper to get non-empty slate info fields in a specific order
function getSlateInfoPairs(slateInfo) {
  const labels = [
    ['prod', 'Production'],
    ['scene', 'Scene'],
    ['take', 'Take'],
    ['roll', 'Roll'],
    ['camera', 'Camera'],
    ['director', 'Director'],
    ['dop', 'DOP'],
    ['notes', 'Notes'],
  ];
  return labels
    .map(([k, label]) => slateInfo[k] && slateInfo[k].trim() ? [label, slateInfo[k]] : null)
    .filter(Boolean);
}

export default function ColorChart({ visible, pausedTimecode, slateInfo }) {
  if (!visible) return null;
  // X-Rite ColorChecker Classic 24-patch chart colors (6x4)
  const xriteColors = [
    '#735244', '#c29682', '#627a9d', '#576c43', '#8580b1', '#67bdaa',
    '#d67e2c', '#505ba6', '#c15a63', '#5e3c6c', '#9dbc40', '#e0a32e',
    '#383d96', '#469449', '#af363c', '#e7c71f', '#bb5695', '#0885a1',
    '#f3f3f2', '#cfcfcf', '#a0a0a0', '#7a7a7a', '#555555', '#222222'
  ];
  const infoPairs = getSlateInfoPairs(slateInfo);
  return (
    <div className="color-chart-xrite-overlay">
      <div className="color-chart-xrite-info-horizontal">
        <div className="paused-timecode-large">{pausedTimecode}</div>
        <div className="slate-info-horizontal">
          {infoPairs.map(([label, value], i) => (
            <div key={i} className="slate-info-horizontal-item">
              <span className="slate-info-label">{label}:</span> <span className="slate-info-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="xrite-chart">
        {xriteColors.map((color, i) => (
          <div
            key={i}
            className="xrite-patch"
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  );
} 