import React, { useState, useRef, useEffect } from 'react';
import SlateForm from './components/SlateForm';
import SlateDisplay from './components/SlateDisplay';
import ColorChart from './components/ColorChart';
import Notes from './components/Notes';

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = 1000;
  o.connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), 200);
}

function formatTime(ms, isGlobal = true) {
  if (isGlobal) {
    const date = new Date(ms);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const msStr = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${msStr}`;
  } else {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const msStr = (ms % 1000).toString().padStart(3, '0');
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${msStr}`;
  }
}

export default function App() {
  const [tab, setTab] = useState('timecode');
  const [slateInfo, setSlateInfo] = useState({ prod: '', roll: '', scene: '', take: '', director: '', camera: '', notes: '' });
  const [showColorChart, setShowColorChart] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [useGlobalTime, setUseGlobalTime] = useState(true);
  const [globalTime, setGlobalTime] = useState(Date.now());
  const [startTime] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState('Running');
  const globalTimerRef = useRef();

  useEffect(() => {
    if (!isPaused) {
      globalTimerRef.current = setInterval(() => setGlobalTime(Date.now()), 10);
    } else {
      clearInterval(globalTimerRef.current);
    }
    return () => clearInterval(globalTimerRef.current);
  }, [isPaused]);

  const elapsed = globalTime - startTime;

  const handleSync = () => {
    playBeep();
    setShowColorChart(true);
    setSyncStatus('PAUSED - SYNCING');
    setIsPaused(true);
    setTimeout(() => {
      setShowColorChart(false);
      setTimeout(() => {
        setIsPaused(false);
        setSyncStatus('Running');
      }, 2000);
    }, 3000);
  };

  return (
    <div className="container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#f9f9f9',
      padding: '32px 0',
    }}>
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab${tab === 'timecode' ? ' active' : ''}`} onClick={() => setTab('timecode')}>Timecode Sync</button>
        <button className={`tab${tab === 'notes' ? ' active' : ''}`} onClick={() => setTab('notes')}>Notes</button>
      </div>
      <div className={`tab-content${tab === 'timecode' ? ' active' : ''}`} style={{ width: '100%', display: tab === 'timecode' ? 'block' : 'none' }}>
        <div className="timecode-card" style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 24px #0002',
          padding: '32px 24px',
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div className="timecode-display" style={{ marginBottom: 16 }}>
            <div className="timecode" style={{ fontSize: '2rem', fontWeight: 700, color: '#2a3d66' }}>{useGlobalTime ? formatTime(globalTime, true) : formatTime(elapsed, false)}</div>
            <div className={`sync-status${isPaused ? ' paused' : ''}`} style={{ color: isPaused ? '#e67e22' : '#27ae60', fontWeight: 600 }}>{syncStatus}</div>
          </div>
          <button className="sync-button" style={{ marginBottom: 18, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#2a3d66', color: '#fff', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }} onClick={handleSync}>SYNC</button>
          <div className="slate-info" style={{ width: '100%' }}>
            <h3 style={{ color: '#2a3d66', marginBottom: 8 }}>Film Slate Information</h3>
            <SlateForm slateInfo={slateInfo} setSlateInfo={setSlateInfo} />
          </div>
          <div className="controls" style={{ width: '100%', marginTop: 12 }}>
            <button className="time-format-toggle" style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#e3eefd', color: '#2a3d66', fontWeight: 600, cursor: 'pointer' }} onClick={() => setUseGlobalTime(v => !v)}>
              Switch to: <span id="format-toggle-text">{useGlobalTime ? 'Time from Start' : 'Global Time'}</span>
            </button>
          </div>
          <ColorChart visible={showColorChart} />
        </div>
      </div>
      <div className={`tab-content${tab === 'notes' ? ' active' : ''}`} style={{ width: '100%', display: tab === 'notes' ? 'block' : 'none' }}>
        <Notes slateInfo={slateInfo} sessionStart={startTime} useGlobalTime={useGlobalTime} />
      </div>
    </div>
  );
}
