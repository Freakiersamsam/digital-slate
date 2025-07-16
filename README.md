# CollabSync - Real-time Video Production Notes

Synchronized collaborative note-taking for video production teams. Show the sync screen to camera, share with your team, and get timestamped notes directly in your editing timeline.

## 🎬 For Video Productions

Perfect for:
- **Directors**: Performance and scene notes
- **Script Supervisors**: Continuity tracking  
- **Editors**: Pre-edit markers and selects
- **Clients**: Real-time feedback during shoots
- **DOPs**: Technical notes and camera settings

## 🚀 Quick Start

1. **Start Session**: Create new session, show sync screen to all cameras
2. **Share Access**: Team scans QR or uses link to join
3. **Take Notes**: Everything is timestamped automatically
4. **Export**: Download as Premiere/DaVinci markers

## ✨ Key Features

### Instant Sync
- Audio beep + visual marker for frame-accurate sync
- QR code for instant team access
- Works with any camera/audio setup

### Real-time Collaboration  
- Multiple users simultaneously
- See who's typing in real-time
- Automatic conflict resolution
- Color-coded contributions

### Transparent Timestamping
- Every keystroke tracked
- Natural pause detection
- No manual timestamps needed
- Microsecond precision

### AI-Powered Cleanup
- Organize messy notes without losing timing
- Categorize by department
- Extract action items
- Keep original + cleaned versions

### Direct Export to NLEs
- Premiere Pro (FCP XML)
- DaVinci Resolve (EDL/XML)
- Avid (ALE)
- Final Cut Pro (FCPXML)
- CSV for custom workflows

## 🛠️ Technical Stack

- **Frontend**: React + Vite
- **Real-time**: Firebase/Supabase
- **AI**: OpenAI API
- **Export**: Custom parsers for each NLE format
- **Mobile**: PWA with offline support

## 🚦 MVP Roadmap (3-4 weeks)

### Week 1: Real-time Foundation
- [ ] Firebase/Supabase backend setup
- [ ] Session/room management system
- [ ] Enhanced sync with QR codes
- [ ] Real-time collaborative notes
- [ ] User presence tracking

### Week 2: Intelligence Layer
- [ ] Automatic action timestamping
- [ ] Keystroke tracking and chunking
- [ ] AI integration for cleanup
- [ ] EDL/XML export implementation
- [ ] Marker categorization

### Week 3-4: Polish & Launch
- [ ] Multi-user UI enhancements
- [ ] Export format templates
- [ ] Performance optimization
- [ ] Documentation & demos
- [ ] Beta testing

## 🚀 Phase 2 Roadmap (Future)

### Enhanced Collaboration
- [ ] Voice note transcription
- [ ] Frame grab attachments
- [ ] Department-specific views
- [ ] Advanced permissions

### Professional Features
- [ ] Plugin for major NLEs
- [ ] Multi-camera sync
- [ ] Cloud rendering integration
- [ ] API for third-party tools
- [ ] Enterprise features

## 📱 Installation

```bash
# Clone repository
git clone https://github.com/Freakiersamsam/digital-slate

# Install dependencies  
npm install

# Start development server
npm run dev

# For production
npm run build
```

## 🔧 Configuration

Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your-key
VITE_OPENAI_API_KEY=your-key
```

## 📖 Usage Guide

### Starting a Session
1. Fill production details (optional)
2. Click "Start Session" 
3. Show sync screen to all cameras
4. Share session link/QR with team

### Taking Notes
- Just type - everything is timestamped
- Use @mentions for specific departments
- Add #tags for categorization
- Attach images or drawings

### Exporting to Your NLE
1. Click "Export" 
2. Choose format (Premiere/DaVinci/etc)
3. Select timeline framerate
4. Import markers directly into your project

### Supported Export Formats

**EDL (Edit Decision List)**
- Universal format for basic markers
- Compatible with most NLEs
- Includes comments and colors

**FCP XML**
- Full marker metadata
- Categories and keywords
- Color coding
- Compatible with Premiere Pro, DaVinci Resolve

**Custom CSV**
- For spreadsheet workflows
- Includes all timestamp data
- Customizable columns

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
