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
  const [slateInfo, setSlateInfo] = useState({ prod: '', roll: '', scene: '', take: '1', director: '', camera: '', dop: '', notes: '' });
  const [showColorChart, setShowColorChart] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [useGlobalTime, setUseGlobalTime] = useState(true);
  const [globalTime, setGlobalTime] = useState(Date.now());
  const [startTime] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState('Ready');
  const globalTimerRef = useRef();

  // Local take timer state
  const [takeTimerRunning, setTakeTimerRunning] = useState(false);
  const [takeStartTime, setTakeStartTime] = useState(null);
  const [takeEndTime, setTakeEndTime] = useState(null);
  const [takeDuration, setTakeDuration] = useState(0);
  const [takeNumber, setTakeNumber] = useState('1');
  const [lastTakeGlow, setLastTakeGlow] = useState(false);
  const notesRef = useRef();

  // Global timer
  useEffect(() => {
    if (!isPaused) {
      globalTimerRef.current = setInterval(() => setGlobalTime(Date.now()), 10);
    } else {
      clearInterval(globalTimerRef.current);
    }
    return () => clearInterval(globalTimerRef.current);
  }, [isPaused]);

  const elapsed = globalTime - startTime;

  // Start take (SYNC)
  function handleSync() {
    playBeep();
    setShowColorChart(true);
    setSyncStatus('TAKE RUNNING');
    setIsPaused(true);
    setTimeout(() => {
      setShowColorChart(false);
      setTimeout(() => {
        setIsPaused(false);
        setSyncStatus('TAKE RUNNING');
        // Start take timer
        const now = Date.now();
        setTakeTimerRunning(true);
        setTakeStartTime(now);
        setTakeEndTime(null);
        setTakeDuration(0);
        // Add note for take start
        if (notesRef.current && notesRef.current.addNoteExternal) {
          const scene = slateInfo.scene ? `Scene ${slateInfo.scene}` : '';
          const take = slateInfo.take ? `Take ${slateInfo.take}` : '';
          const label = [scene, take].filter(Boolean).join(' ');
          notesRef.current.addNoteExternal(
            `🎬 Take started at ${formatTime(now, true)}${label ? ` (${label})` : ''}`,
            now,
            { ...slateInfo }
          );
        }
      }, 2000);
    }, 3000);
  }

  // Stop take
  function handleStopTake() {
    const now = Date.now();
    setTakeTimerRunning(false);
    setTakeEndTime(now);
    const duration = now - takeStartTime;
    setTakeDuration(duration);
    setSyncStatus('Ready');
    // Add note for take end
    if (notesRef.current && notesRef.current.addNoteExternal) {
      const scene = slateInfo.scene ? `Scene ${slateInfo.scene}` : '';
      const take = slateInfo.take ? `Take ${slateInfo.take}` : '';
      const label = [scene, take].filter(Boolean).join(' ');
      notesRef.current.addNoteExternal(
        `⏹️ Take ended at ${formatTime(now, true)} (duration: ${formatTime(duration, false)})${label ? ` (${label})` : ''}`,
        now,
        { ...slateInfo }
      );
    }
    // Increment take number with animation
    setTimeout(() => {
      setLastTakeGlow(true);
      setSlateInfo(prev => ({ ...prev, take: (parseInt(prev.take || '1', 10) + 1).toString() }));
      setTimeout(() => setLastTakeGlow(false), 1200);
    }, 300);
  }

  function toggleTimeFormat() {
    setUseGlobalTime(v => !v);
  }

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        tab === 'timecode' &&
        e.key === 'Enter' &&
        document.activeElement &&
        ['INPUT', 'TEXTAREA'].indexOf(document.activeElement.tagName) === -1
      ) {
        e.preventDefault();
        if (!takeTimerRunning) handleSync();
        else handleStopTake();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, takeTimerRunning, slateInfo, takeStartTime]);

  // Button label
  const buttonLabel = takeTimerRunning ? 'STOP TAKE' : 'SYNC';

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab${tab === 'timecode' ? ' active' : ''}`} onClick={() => setTab('timecode')}>Timecode Sync</button>
        <button className={`tab${tab === 'notes' ? ' active' : ''}`} onClick={() => setTab('notes')}>Notes</button>
      </div>
      <div id="timecode-tab" className={`tab-content${tab === 'timecode' ? ' active' : ''}`}> 
        <div className="timecode-display">
          <div className="timecode" id="timecode">{useGlobalTime ? formatTime(globalTime, true) : (takeTimerRunning && takeStartTime ? formatTime(globalTime - takeStartTime, false) : formatTime(elapsed, false))}</div>
          <div className={`sync-status${takeTimerRunning ? ' paused' : ''}`} id="sync-status">{syncStatus}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="sync-button" onClick={takeTimerRunning ? handleStopTake : handleSync}>{buttonLabel}</button>
          <div className="slate-info">
            <h3>Film Slate Information</h3>
            <SlateForm slateInfo={slateInfo} setSlateInfo={setSlateInfo} lastTakeGlow={lastTakeGlow} />
          </div>
          <div className="controls">
            <button className="time-format-toggle" onClick={toggleTimeFormat}>
              Switch to: <span id="format-toggle-text">{useGlobalTime ? 'Time from Start' : 'Global Time'}</span>
            </button>
          </div>
        </div>
        <ColorChart 
          visible={showColorChart} 
          pausedTimecode={useGlobalTime ? formatTime(globalTime, true) : (takeTimerRunning && takeStartTime ? formatTime(globalTime - takeStartTime, false) : formatTime(elapsed, false))}
          slateInfo={slateInfo}
        />
      </div>
      <div id="notes-tab" className={`tab-content${tab === 'notes' ? ' active' : ''}`}>
        <Notes 
          ref={notesRef}
          slateInfo={slateInfo}
          sessionStart={takeStartTime || startTime}
          useGlobalTime={useGlobalTime}
          takeTimerRunning={takeTimerRunning}
          onSync={handleSync}
          onStopTake={handleStopTake}
        />
      </div>
    </div>
  );
}
