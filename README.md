# Digital Slate

A modern web app for digital film slating, camera synchronization, and note-taking on set. Built with React and Vite, it provides a clean, responsive interface for tracking takes, timecodes, and production notes, with easy CSV export for post-production workflows.

## Features

- Modern, clean, and responsive UI
- Digital film slate: track production, scene, take, roll, camera, director, and notes
- Timecode display (global and session-relative)
- Start/End Take with beep (bip) and color chart flash
- Take timing: snapshot timecode in/out and duration
- Notes system: timestamped notes, associated with takes and scenes
- Notes auto-save to browser (localStorage)
- CSV export of notes and takes (with timecode in/out, comment, and placeholder for AI summary)
- HTML report export for session notes
- Color chart display for camera calibration
- Fully offline-capable (no backend required)
- Backend-ready code structure for future cloud sync

## TODO / Roadmap

- [ ] **AI summary for notes**: Use AI to generate a summary for each note (currently a placeholder in CSV)
- [ ] **Backend integration**: Optionally sync sessions/notes to a server for multi-device access
- [ ] **Multi-session management**: UI for managing multiple sessions/projects
- [ ] **Advanced timecode features**: Support for external timecode sources, LTC, or manual entry
- [ ] **Customizable color chart**: Support for different calibration charts
- [ ] **User authentication** (if backend is enabled)
- [ ] **UI/UX polish**: More themes, dark/light mode toggle, accessibility improvements
- [ ] **Mobile optimizations**: Enhanced touch support and layout for phones/tablets
- [ ] **Export enhancements**: PDF export, more CSV fields, batch export
- [ ] **Cloud backup**: Google Drive/Dropbox integration (optional)

## Getting Started

To run locally:

```sh
npm install
npm run dev
```

To build and deploy to GitHub Pages:

```sh
npm run build
npm run deploy
```

## Backend Server for CSV Export (optional)

To run the backend server (for saving and exporting session CSV files):

```sh
npm install
npm run server
```

The server will listen on port 5000 by default.
