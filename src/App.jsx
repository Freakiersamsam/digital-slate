import React, { useState } from 'react';
import SlateForm from './components/SlateForm';
import SlateDisplay from './components/SlateDisplay';
import ColorChart from './components/ColorChart';
import TakeTimer from './components/TakeTimer';
import Report from './components/Report';

function playBip() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = 1000;
  o.connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), 200);
}

export default function App() {
  const [slateInfo, setSlateInfo] = useState({ scene: '', take: '', director: '' });
  const [showColorChart, setShowColorChart] = useState(false);
  const [takeRunning, setTakeRunning] = useState(false);
  const [notes, setNotes] = useState([]);
  const [report, setReport] = useState(null);

  const handleStartTake = () => {
    playBip();
    setTimeout(() => {
      setShowColorChart(true);
      setTimeout(() => {
        setShowColorChart(false);
        setTakeRunning(true);
      }, 2000); // Show color chart for 2 seconds
    }, 200); // Bip duration
  };

  const handleEndTake = (duration) => {
    setTakeRunning(false);
    setReport({ ...slateInfo, duration, notes: [...notes] });
    setNotes([]);
  };

  return (
    <div style={{ padding: 20 }}>
      {!takeRunning && !report && (
        <SlateForm slateInfo={slateInfo} setSlateInfo={setSlateInfo} onStartTake={handleStartTake} />
      )}
      <SlateDisplay slateInfo={slateInfo} />
      <ColorChart visible={showColorChart} />
      {takeRunning && (
        <TakeTimer running={takeRunning} onEnd={handleEndTake} notes={notes} setNotes={setNotes} />
      )}
      {report && (
        <Report slateInfo={slateInfo} duration={report.duration} notes={report.notes} />
      )}
      {report && (
        <button onClick={() => setReport(null)}>New Take</button>
      )}
    </div>
  );
}
