import LZString from 'lz-string';

// localStorage.js
// Utility for local data storage and export functionality

const STORAGE_KEY = 'digitalSlateData';
const VERSION = '1.0';

// Validate session data structure
function validateSessionData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.notes)) return false;
  if (!data.slateInfo || typeof data.slateInfo !== 'object') return false;
  return true;
}

// --- Compression helpers ---
function compressData(data) {
  return LZString.compressToUTF16(JSON.stringify(data));
}

function decompressData(compressed) {
  if (!compressed) return null;
  try {
    return JSON.parse(LZString.decompressFromUTF16(compressed));
  } catch (e) {
    console.error('Decompression error:', e);
    return null;
  }
}

// Get all data from localStorage
export function loadAllData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { version: VERSION, sessions: {} };
  const data = decompressData(raw);
  if (!data || !data.version || !data.sessions) {
    return { version: VERSION, sessions: {} };
  }
  return data;
}

// Save all data to localStorage
export function saveAllData(data) {
  if (!data || typeof data !== 'object') {
    console.error('Invalid data format');
    return;
  }
  const dataToSave = {
    version: VERSION,
    lastModified: new Date().toISOString(),
    sessions: data.sessions || {}
  };
  localStorage.setItem(STORAGE_KEY, compressData(dataToSave));
}

// Save a single session
export function saveSession(sessionId, sessionData) {
  try {
    if (!validateSessionData(sessionData)) {
      console.error('Invalid session data format');
      return;
    }
    const allData = loadAllData();
    allData.sessions[sessionId] = {
      ...sessionData,
      lastModified: new Date().toISOString(),
      created: allData.sessions[sessionId]?.created || new Date().toISOString()
    };
    saveAllData(allData);
  } catch (err) {
    console.error('Error saving session:', err);
  }
}

// Load a single session
export function loadSession(sessionId) {
  try {
    const allData = loadAllData();
    return allData.sessions[sessionId] || null;
  } catch (err) {
    console.error('Error loading session:', err);
    return null;
  }
}

// Remove a session
export function removeSession(sessionId) {
  const allData = loadAllData();
  delete allData.sessions[sessionId];
  saveAllData(allData);
}

// Clear all data
export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

// Export a single session as CSV
export function exportSessionCSV(sessionData, filename = 'session.csv') {
  if (!validateSessionData(sessionData)) {
    console.error('Invalid session data format');
    return;
  }

  const header = ['Timecode In', 'Name', 'Comment', 'Timecode Out', 'Duration', 'Marker Type'];
  const rows = sessionData.notes.map(row => [
    row.timecodeIn || '',
    row.name || '',
    row.comment || '',
    row.timecodeOut || '',
    row.duration || '',
    row.markerType || ''
  ]);

  const csv = [header, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  downloadFile(csv, filename, 'text/csv');
}

// Export all sessions as JSON
export function exportAllSessions(filename = 'digital-slate-backup.json') {
  const allData = loadAllData();
  const json = JSON.stringify(allData, null, 2);
  downloadFile(json, filename, 'application/json');
}

// Import sessions from JSON
export function importSessions(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    if (!data.version || !data.sessions) {
      throw new Error('Invalid data format');
    }
    saveAllData(data);
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}

// Helper function to download files
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
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

// Get storage usage information
export function getStorageInfo() {
  const allData = loadAllData();
  const sessionCount = Object.keys(allData.sessions).length;
  const totalSize = new Blob([JSON.stringify(allData)]).size;
  const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
  
  return {
    sessionCount,
    totalSize,
    maxSize,
    usagePercentage: (totalSize / maxSize) * 100,
    lastModified: allData.lastModified
  };
}

// --- BACKEND INTEGRATION READY ---
// To use a backend, replace the above save/load/export functions with API calls.
// For example, POST to /save-session, GET from /get-session, etc.