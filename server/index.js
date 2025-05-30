const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR);
}

// POST /save-session-csv
// Body: { sessionId: string, data: [ { timecodeIn, name, comment, timecodeOut, duration, markerType } ] }
app.post('/save-session-csv', async (req, res) => {
  const { sessionId, data } = req.body;
  if (!sessionId || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Missing sessionId or data' });
  }
  const csvPath = path.join(SESSIONS_DIR, `${sessionId}.csv`);
  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'timecodeIn', title: 'Timecode In' },
      { id: 'name', title: 'Name' },
      { id: 'comment', title: 'Comment' },
      { id: 'timecodeOut', title: 'Timecode Out' },
      { id: 'duration', title: 'Duration' },
      { id: 'markerType', title: 'Marker Type' },
    ],
  });
  try {
    await csvWriter.writeRecords(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write CSV', details: err.message });
  }
});

// GET /export-session-csv/:sessionId
app.get('/export-session-csv/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const csvPath = path.join(SESSIONS_DIR, `${sessionId}.csv`);
  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: 'CSV not found' });
  }
  res.download(csvPath, `${sessionId}.csv`);
});

app.listen(PORT, () => {
  console.log(`CSV backend server running on http://localhost:${PORT}`);
}); 