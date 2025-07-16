# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.
8. **Security Review**: At the end of every development session, please check through all the code you just wrote and make sure it follows security best practices. Make sure there are no sensitive information in the front end and there are no vulnerabilities that can be exploited.
9. **Never run npm run dev**: Do not run `npm run dev` yourself as it creates a terminal loop. The user will run it in a separate terminal window.

## Project Overview

Digital Slate is a React-based web application for film production, providing digital slate functionality, timecode synchronization, and note-taking capabilities. The app is designed for use on film sets to track takes, manage production notes, and export data for post-production workflows.

## Development Commands

### Primary Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build production assets
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint with React-specific rules
- `npm run server` - Start optional Express backend server on port 5000

### Deployment
- `npm run deploy` - Deploy to GitHub Pages (builds first via predeploy hook)

## Architecture Overview

### Core Application Structure
The app uses a single-page architecture with React components organized around two main tabs:
- **Timecode Sync**: Primary interface for slate operations, timecode display, and take management
- **Notes**: Interface for adding, viewing, and managing production notes

### Key Components
- `App.jsx` - Main application component handling timecode sync, take management, and slate operations
- `Notes.jsx` - Complete notes management system with localStorage persistence
- `SlateForm.jsx` - Form for entering film slate information (production, scene, take, etc.)
- `ColorChart.jsx` - Color calibration chart displayed during take sync
- `ThemeContext.jsx` - Theme management with dark/light mode support

### Data Storage Architecture
The app uses a sophisticated localStorage-based persistence system:
- **sessionStorage.js** - Main storage module with compression using LZ-String
- Data is organized by sessions with unique IDs based on production name and start time
- Automatic compression for storage efficiency
- Export capabilities for CSV and JSON formats
- Ready for backend integration (see server/index.js)

### State Management
- Primary state managed in App.jsx using React hooks
- Theme state managed via React Context (ThemeContext.jsx)
- Notes state managed locally in Notes.jsx with automatic persistence
- No external state management library (Redux, Zustand) currently used

### Timecode System
- Dual timecode display modes: Global time vs. session-relative time
- Precise take timing with millisecond accuracy
- Audio beep and visual color chart for take synchronization
- Keyboard shortcuts (Enter key) for sync operations

### Styling
- CSS-in-JS approach with separate CSS files
- Tailwind CSS for utility classes
- Custom theme system with CSS variables
- Responsive design with mobile-first approach

## Key Technical Details

### Build Configuration
- **Vite** as build tool and dev server
- **React 18** with JSX support
- **ESLint** configured for React with hooks support
- Base path set to `/digital-slate/` for GitHub Pages deployment

### External Dependencies
- `lz-string` for data compression
- `react-window` for virtual scrolling (in VirtualizedNotesList component)
- `jspdf` for PDF export functionality
- `csv-writer` for server-side CSV generation

### Mobile Optimization
- Touch event handling for sync operations
- Viewport meta tag configuration for mobile devices
- Pinch-to-zoom prevention
- Service worker for offline functionality

### Backend Integration
The optional Express server (server/index.js) provides:
- CSV export endpoint for production notes
- File storage in sessions/ directory
- CORS-enabled API for client-server communication
- Ready for expansion to full backend functionality

## Development Notes

### Component Patterns
- Function components with hooks throughout
- forwardRef pattern used for Notes component to expose methods to parent
- Error boundaries implemented for production stability
- Consistent prop passing and state lifting patterns

### Data Flow
1. User interactions in SlateForm update slateInfo state in App.jsx
2. Take operations trigger timecode capture and note creation
3. Notes are automatically saved to localStorage via sessionStorage.js
4. Export functions generate CSV/JSON files for external use

### Performance Considerations
- VirtualizedNotesList component for handling large note lists
- Compression used for localStorage to maximize storage capacity
- Debounced saving to prevent excessive localStorage writes
- Service worker caching for offline performance