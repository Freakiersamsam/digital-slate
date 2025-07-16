import React from 'react';

export function ConnectionStatus({ status }) {
  // Don't render if status is not available
  if (!status) {
    return null;
  }

  // Determine status type and display
  let statusType = 'offline';
  let statusText = 'Offline Mode';
  let statusColor = '#6c757d';

  if (status.isAvailable && status.initialized) {
    if (status.connected) {
      statusType = 'online';
      statusText = 'Live Sync';
      statusColor = '#28a745';
    } else if (status.error) {
      statusType = 'error';
      statusText = 'Connection Error';
      statusColor = '#dc3545';
    } else {
      statusType = 'connecting';
      statusText = 'Connecting...';
      statusColor = '#ffc107';
    }
  }

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
    marginRight: '8px',
    background: `${statusColor}20`,
    color: statusColor,
    border: `1px solid ${statusColor}40`
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: statusColor,
    animation: statusType === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'
  };

  return (
    <div style={containerStyle} title={status.error || `Last checked: ${status.lastChecked || 'Never'}`}>
      <span style={dotStyle}></span>
      <span>{statusText}</span>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}