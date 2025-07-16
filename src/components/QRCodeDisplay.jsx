import React, { useEffect, useRef } from 'react';

export function QRCodeDisplay({ sessionId, joinUrl, visible = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!visible || !sessionId || !joinUrl || !canvasRef.current) return;

    generateQRCode(joinUrl, canvasRef.current);
  }, [visible, sessionId, joinUrl]);

  if (!visible || !sessionId) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '300px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '18px' }}>
            Join Live Session
          </h3>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
            Scan QR code to collaborate
          </p>
        </div>
        
        <div style={{ margin: '0 auto 20px auto' }}>
          <canvas 
            ref={canvasRef}
            width={200}
            height={200}
            style={{ 
              background: 'white',
              border: '2px solid #ddd',
              borderRadius: '8px'
            }}
          />
        </div>
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div style={{ marginBottom: '8px', fontFamily: 'monospace' }}>
            <strong>Session:</strong> {sessionId.split('-').pop()}
          </div>
          <div style={{ wordBreak: 'break-all', opacity: 0.7 }}>
            <small>{joinUrl}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateQRCode(text, canvas) {
  const ctx = canvas.getContext('2d');
  const size = 200;
  const modules = 25;
  const moduleSize = Math.floor(size / modules);
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);
  
  const hash = simpleHash(text);
  ctx.fillStyle = 'black';
  
  drawFinderPattern(ctx, 0, 0, moduleSize);
  drawFinderPattern(ctx, (modules - 7) * moduleSize, 0, moduleSize);
  drawFinderPattern(ctx, 0, (modules - 7) * moduleSize, moduleSize);
  
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (isFinderPattern(row, col, modules)) continue;
      
      const index = row * modules + col;
      if ((hash >> (index % 32)) & 1) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

function drawFinderPattern(ctx, x, y, moduleSize) {
  ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
  ctx.fillStyle = 'white';
  ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
  ctx.fillStyle = 'black';
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
}

function isFinderPattern(row, col, modules) {
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= modules - 8) return true;
  if (row >= modules - 8 && col < 9) return true;
  return false;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}