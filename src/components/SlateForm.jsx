import React from 'react';

export default function SlateForm({ slateInfo, setSlateInfo, onStartTake }) {
  return (
    <form onSubmit={e => { e.preventDefault(); onStartTake(); }}>
      <input
        placeholder="Scene Number"
        value={slateInfo.scene}
        onChange={e => setSlateInfo({ ...slateInfo, scene: e.target.value })}
        required
      />
      <input
        placeholder="Take Number"
        value={slateInfo.take}
        onChange={e => setSlateInfo({ ...slateInfo, take: e.target.value })}
        required
      />
      <input
        placeholder="Director"
        value={slateInfo.director}
        onChange={e => setSlateInfo({ ...slateInfo, director: e.target.value })}
        required
      />
      <button type="submit">Start Take</button>
    </form>
  );
} 