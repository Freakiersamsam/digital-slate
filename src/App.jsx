import React, { useState, useRef, useEffect } from 'react';
import SlateForm from './components/SlateForm';
import ColorChart from './components/ColorChart';
import Notes from './components/Notes';

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = 800;
  o.connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), 300);
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

  function syncTimecode() {
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
  }

  function toggleTimeFormat() {
    setUseGlobalTime(v => !v);
  }

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab${tab === 'timecode' ? ' active' : ''}`} onClick={() => setTab('timecode')}>Timecode Sync</button>
        <button className={`tab${tab === 'notes' ? ' active' : ''}`} onClick={() => setTab('notes')}>Notes</button>
      </div>
      <div id="timecode-tab" className={`tab-content${tab === 'timecode' ? ' active' : ''}`}> 
        <div className="timecode-display">
          <div className="timecode" id="timecode">{useGlobalTime ? formatTime(globalTime, true) : formatTime(elapsed, false)}</div>
          <div className={`sync-status${isPaused ? ' paused' : ''}`} id="sync-status">{syncStatus}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="sync-button" onClick={syncTimecode}>SYNC</button>
          <div className="slate-info">
            <h3>Film Slate Information</h3>
            <SlateForm slateInfo={slateInfo} setSlateInfo={setSlateInfo} />
          </div>
          <div className="controls">
            <button className="time-format-toggle" onClick={toggleTimeFormat}>
              Switch to: <span id="format-toggle-text">{useGlobalTime ? 'Time from Start' : 'Global Time'}</span>
            </button>
          </div>
        </div>
        <ColorChart visible={showColorChart} />
      </div>
      <div id="notes-tab" className={`tab-content${tab === 'notes' ? ' active' : ''}`}>
        <Notes slateInfo={slateInfo} sessionStart={startTime} useGlobalTime={useGlobalTime} />
      </div>
    </div>
  );
}
