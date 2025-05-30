import React from 'react';

export default function SlateForm({ slateInfo, setSlateInfo }) {
  return (
    <div className="slate-grid">
      <div className="slate-field">
        <label>Scene:</label>
        <input
          placeholder="1A"
          value={slateInfo.scene || ''}
          onChange={e => setSlateInfo({ ...slateInfo, scene: e.target.value })}
        />
      </div>
      <div className="slate-field">
        <label>Take:</label>
        <input
          placeholder="1"
          value={slateInfo.take || ''}
          onChange={e => setSlateInfo({ ...slateInfo, take: e.target.value })}
        />
      </div>
      <div className="slate-field">
        <label>Roll:</label>
        <input
          placeholder="001"
          value={slateInfo.roll || ''}
          onChange={e => setSlateInfo({ ...slateInfo, roll: e.target.value })}
        />
      </div>
      <div className="slate-field">
        <label>Camera:</label>
        <input
          placeholder="Camera Name/ID"
          value={slateInfo.camera || ''}
          onChange={e => setSlateInfo({ ...slateInfo, camera: e.target.value })}
        />
      </div>
      <div className="slate-field full-width">
        <label>Director:</label>
        <input
          placeholder="Director Name"
          value={slateInfo.director || ''}
          onChange={e => setSlateInfo({ ...slateInfo, director: e.target.value })}
        />
      </div>
      <div className="slate-field full-width">
        <label>DOP:</label>
        <input
          placeholder="Director of Photography"
          value={slateInfo.dop || ''}
          onChange={e => setSlateInfo({ ...slateInfo, dop: e.target.value })}
        />
      </div>
      <div className="slate-field full-width">
        <label>Production:</label>
        <input
          placeholder="Production Title"
          value={slateInfo.prod || ''}
          onChange={e => setSlateInfo({ ...slateInfo, prod: e.target.value })}
        />
      </div>
      <div className="slate-field full-width">
        <label>Notes:</label>
        <input
          placeholder="Additional notes"
          value={slateInfo.notes || ''}
          onChange={e => setSlateInfo({ ...slateInfo, notes: e.target.value })}
        />
      </div>
    </div>
  );
} 