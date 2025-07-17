import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function ConnectionStatus() {
  const { offlineMode, isOnline, retryConnection } = useAuth();

  // Determine status type and display
  let statusType = 'offline';
  let statusText = 'Offline Mode';
  let statusColor = '#6c757d';

  if (isOnline) {
    statusType = 'online';
    statusText = 'Live Sync';
    statusColor = '#28a745';
  } else if (offlineMode) {
    statusType = 'offline';
    statusText = 'Offline Mode';
    statusColor = '#6c757d';
  } else {
    statusType = 'connecting';
    statusText = 'Connecting...';
    statusColor = '#ffc107';
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
    border: `1px solid ${statusColor}40`,
    cursor: offlineMode ? 'pointer' : 'default'
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: statusColor,
    animation: statusType === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'
  };

  const handleClick = () => {
    if (offlineMode) {
      retryConnection();
    }
  };

  return (
    <div 
      style={containerStyle} 
      title={offlineMode ? 'Click to retry connection' : 'Connection status'}
      onClick={handleClick}
    >
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