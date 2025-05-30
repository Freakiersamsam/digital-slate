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
  const [isTakeRunning, setIsTakeRunning] = useState(false);
  const [takeIn, setTakeIn] = useState(null); // timecode in (ms)
  const [takeOut, setTakeOut] = useState(null); // timecode out (ms)
  const [takeSnapshots, setTakeSnapshots] = useState([]); // {in, out, take, scene, roll}

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

  // Handle take start/end
  const handleTakeToggle = () => {
    if (!isTakeRunning) {
      // Start take
      playBeep();
      setShowColorChart(true);
      setTimeout(() => setShowColorChart(false), 3000); // Show for 3 seconds
      setTakeIn(Date.now());
      setTakeOut(null);
      setIsTakeRunning(true);
    } else {
      // End take
      playBeep();
      setTakeOut(Date.now());
      setIsTakeRunning(false);
      // Save snapshot for this take
      setTakeSnapshots(snaps => [
        ...snaps,
        {
          in: takeIn,
          out: Date.now(),
          take: slateInfo.take,
          scene: slateInfo.scene,
          roll: slateInfo.roll
        }
      ]);
    }
  };

  // Pass timecode info to Notes for snapshotting
  const timecodeInfo = {
    takeIn,
    takeOut,
    takeSnapshots,
    globalTime,
    startTime,
    useGlobalTime
  };

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab${tab === 'timecode' ? ' active' : ''}`} onClick={() => setTab('timecode')}>Timecode Sync</button>
        <button className={`tab${tab === 'notes' ? ' active' : ''}`} onClick={() => setTab('notes')}>Notes</button>
      </div>
      <div className={`tab-content${tab === 'timecode' ? ' active' : ''}`}> 
        <div className="timecode-card">
          <div className="timecode-display">
            <div className="timecode">{useGlobalTime ? formatTime(globalTime, true) : formatTime(elapsed, false)}</div>
            {isTakeRunning && takeIn && (
              <div style={{ color: '#27ae60', fontWeight: 600, marginTop: 8 }}>
                Take In: {formatTime(takeIn, useGlobalTime)}
              </div>
            )}
            {!isTakeRunning && takeIn && takeOut && (
              <div style={{ color: '#e67e22', fontWeight: 600, marginTop: 8 }}>
                Take Out: {formatTime(takeOut, useGlobalTime)} | Duration: {formatTime(takeOut - takeIn, false)}
              </div>
            )}
          </div>
          <button className="sync-button" onClick={handleSync}>SYNC</button>
          <div className="slate-info">
            <h3>Film Slate Information</h3>
            <SlateForm slateInfo={slateInfo} setSlateInfo={setSlateInfo} />
            <button
              className="take-toggle-btn"
              style={{ marginTop: 18, padding: '10px 24px', borderRadius: 999, border: 'none', background: isTakeRunning ? '#e57373' : '#27ae60', color: '#fff', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }}
              onClick={handleTakeToggle}
            >
              {isTakeRunning ? 'End Take' : 'Start Take'}
            </button>
          </div>
          <div className="controls">
            <button className="time-format-toggle" onClick={() => setUseGlobalTime(v => !v)}>
              Switch to: <span id="format-toggle-text">{useGlobalTime ? 'Time from Start' : 'Global Time'}</span>
            </button>
          </div>
          <ColorChart visible={showColorChart} />
        </div>
      </div>
      <div className={`tab-content${tab === 'notes' ? ' active' : ''}`}>
        <Notes slateInfo={slateInfo} sessionStart={startTime} useGlobalTime={useGlobalTime} timecodeInfo={timecodeInfo} />
      </div>
    </div>
  );
}
