// sessionStorage.js
// Utility for local session/note storage and CSV export. Backend-ready structure.

// Key for localStorage
const STORAGE_KEY = 'digitalSlateSessions';

// Get all sessions from localStorage
export function loadSessions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Save all sessions to localStorage
export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Save a single session (by id)
export function saveSession(sessionId, sessionData) {
  const sessions = loadSessions();
  sessions[sessionId] = sessionData;
  saveSessions(sessions);
}

// Load a single session (by id)
export function loadSession(sessionId) {
  const sessions = loadSessions();
  return sessions[sessionId] || null;
}

// Remove a session
export function removeSession(sessionId) {
  const sessions = loadSessions();
  delete sessions[sessionId];
  saveSessions(sessions);
}

// Export session data as CSV (browser download)
export function exportSessionCSV(sessionData, filename = 'session.csv') {
  // Columns: Timecode In,Name,Comment,Timecode Out,Duration,Marker Type
  const header = ['Timecode In','Name','Comment','Timecode Out','Duration','Marker Type'];
  const rows = sessionData.map(row => [
    row.timecodeIn || '',
    row.name || '',
    row.comment || '',
    row.timecodeOut || '',
    row.duration || '',
    row.markerType || ''
  ]);
  const csv = [header, ...rows].map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// --- BACKEND INTEGRATION READY ---
// To use a backend, replace the above save/load/export functions with API calls.
// For example, POST to /save-session, GET from /get-session, etc. 