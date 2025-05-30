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

### Phase 1 - Local Improvements (1-2 weeks)
#### Quick Wins (1-2 days each)
- [ ] Add favicon and app icon
- [ ] Implement dark/light mode toggle
- [ ] Improve landscape mode support for mobile
- [ ] Add basic error handling and user feedback
- [ ] Enhance mobile keyboard handling
- [ ] Optimize basic localStorage usage

#### Core Features (3-7 days each)
- [ ] Implement PDF export
- [ ] Add MarkerBox for Premiere notes export
- [ ] Add haptic feedback for mobile devices
- [ ] Implement notes categories and tags
- [ ] Add search and filter functionality
- [ ] Set up proper error boundaries
- [ ] Migrate to TypeScript
- [ ] Implement state management (Redux/Context)
- [ ] Add unit and integration tests
- [ ] Set up logging system

#### Advanced Local Features (1-2 weeks each)
- [ ] Implement AI integration (client-side)
- [ ] Add advanced localStorage optimization with compression
- [ ] Set up service worker for offline support
- [ ] Implement virtual scrolling for large note lists

### Phase 2 - Server Integration (3-6 weeks)
#### Basic Server Features (1-2 weeks each)
- [ ] Set up user authentication system
- [ ] Implement basic user management
- [ ] Add simple project management
- [ ] Set up basic real-time sync

#### Advanced Server Features (2-4 weeks each)
- [ ] Implement QR code sharing system
- [ ] Add advanced real-time sync between devices
- [ ] Develop advanced project management
- [ ] Enable multi-device collaboration
- [ ] Set up cloud backup system

### Implementation Notes
- Phase 1 can be implemented independently and locally
- Phase 2 requires server setup and should be planned accordingly
- Each feature in Phase 1 can be developed and tested in isolation
- Server features should be planned together to ensure consistent architecture
- Consider using a BaaS (Backend as a Service) solution for Phase 2 to speed up development

### Technical Dependencies
#### Phase 1
- TypeScript
- Redux/Context API
- Jest/React Testing Library
- PDF generation library
- Compression library
- Service Worker API
- Virtual scrolling library

#### Phase 2
- Authentication system (e.g., Auth0, Firebase)
- Real-time database (e.g., Firebase, Supabase)
- WebSocket implementation
- QR code generation library
- Cloud storage solution

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
