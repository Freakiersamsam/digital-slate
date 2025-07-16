import { convert } from 'xml-js';

class ExportService {
  constructor() {
    this.frameRates = {
      '23.976': { frames: 24, dropFrame: false },
      '24': { frames: 24, dropFrame: false },
      '25': { frames: 25, dropFrame: false },
      '29.97': { frames: 30, dropFrame: true },
      '30': { frames: 30, dropFrame: false },
      '50': { frames: 50, dropFrame: false },
      '59.94': { frames: 60, dropFrame: true },
      '60': { frames: 60, dropFrame: false },
    };
  }

  // Convert milliseconds to timecode
  msToTimecode(ms, frameRate = '25', dropFrame = false) {
    const fps = this.frameRates[frameRate]?.frames || 25;
    const totalFrames = Math.floor(ms / 1000 * fps);
    
    if (dropFrame && (frameRate === '29.97' || frameRate === '59.94')) {
      return this.framesToDropFrameTimecode(totalFrames, fps);
    }
    
    const hours = Math.floor(totalFrames / (fps * 3600));
    const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
    const seconds = Math.floor((totalFrames % (fps * 60)) / fps);
    const frames = totalFrames % fps;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  // Convert frames to drop frame timecode
  framesToDropFrameTimecode(totalFrames, fps) {
    const dropFrames = fps === 30 ? 2 : 4; // 2 for 29.97, 4 for 59.94
    const framesPerMinute = fps * 60 - dropFrames;
    const framesPer10Minutes = framesPerMinute * 10 + dropFrames;
    
    const _d = Math.floor(totalFrames / framesPer10Minutes);
    const m = totalFrames % framesPer10Minutes;
    
    let additionalFrames = 0;
    if (m > dropFrames) {
      additionalFrames = dropFrames + Math.floor((m - dropFrames) / framesPerMinute) * dropFrames;
    }
    
    const correctedFrames = totalFrames + additionalFrames;
    
    const hours = Math.floor(correctedFrames / (fps * 3600));
    const minutes = Math.floor((correctedFrames % (fps * 3600)) / (fps * 60));
    const seconds = Math.floor((correctedFrames % (fps * 60)) / fps);
    const frames = correctedFrames % fps;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')};${frames.toString().padStart(2, '0')}`;
  }

  // Export to EDL format
  exportEDL(sessionData, options = {}) {
    const {
      frameRate = '25',
      title = 'CollabSync Session',
      startTimecode: _startTimecode = '01:00:00:00'
    } = options;

    const notes = Object.values(sessionData.notes || {});
    const metadata = sessionData.metadata || {};
    
    let edl = `TITLE: ${title}\n`;
    edl += `FCM: ${this.frameRates[frameRate]?.dropFrame ? 'DROP FRAME' : 'NON-DROP FRAME'}\n\n`;
    
    // Sort notes by timestamp
    notes.sort((a, b) => a.timestamp - b.timestamp);
    
    notes.forEach((note, index) => {
      const eventNumber = (index + 1).toString().padStart(3, '0');
      const reelName = metadata.production || 'REEL001';
      const channel = 'V'; // Video channel
      const transition = 'C'; // Cut
      
      // Calculate timecodes relative to sync
      const relativeMs = note.relativeTime || 0;
      const inTimecode = this.msToTimecode(relativeMs, frameRate);
      const outTimecode = this.msToTimecode(relativeMs + 1000, frameRate); // 1 second duration
      
      edl += `${eventNumber}  ${reelName}      ${channel}     ${transition}        ${inTimecode} ${outTimecode} ${inTimecode} ${outTimecode}\n`;
      edl += `* FROM CLIP NAME: ${metadata.scene ? `Scene_${metadata.scene}` : 'Scene'}_Take_${metadata.take || '1'}\n`;
      edl += `* COMMENT: ${this.sanitizeEDLComment(note.text)}\n`;
      
      if (note.userName && note.userName !== 'Anonymous') {
        edl += `* NOTE: Added by ${note.userName}\n`;
      }
      
      if (note.category && note.category !== 'general') {
        edl += `* CATEGORY: ${note.category.toUpperCase()}\n`;
      }
      
      edl += '\n';
    });
    
    return edl;
  }

  // Export to FCP XML format
  exportFCPXML(sessionData, options = {}) {
    const {
      frameRate = '25',
      projectName = 'CollabSync Project'
    } = options;

    const notes = Object.values(sessionData.notes || {});
    const metadata = sessionData.metadata || {};
    
    // Sort notes by timestamp
    notes.sort((a, b) => a.timestamp - b.timestamp);
    
    const fps = this.frameRates[frameRate]?.frames || 25;
    const frameDuration = `1/${fps}s`;
    
    // Build XML structure
    const fcpxml = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'UTF-8'
        }
      },
      fcpxml: {
        _attributes: {
          version: '1.9'
        },
        resources: {
          format: {
            _attributes: {
              id: 'r1',
              frameDuration: frameDuration,
              width: '1920',
              height: '1080'
            }
          }
        },
        library: {
          event: {
            _attributes: {
              name: metadata.production || 'Production'
            },
            project: {
              _attributes: {
                name: projectName
              },
              sequence: {
                _attributes: {
                  format: 'r1',
                  duration: `${Math.floor(notes[notes.length - 1]?.relativeTime / 1000 * fps)}/${fps}s`
                },
                spine: notes.map((note) => ({
                  marker: {
                    _attributes: {
                      start: `${Math.floor((note.relativeTime || 0) / 1000 * fps)}/${fps}s`,
                      duration: frameDuration,
                      value: this.createMarkerName(note, metadata)
                    },
                    note: {
                      _text: note.text
                    },
                    'marker-color': {
                      _attributes: {
                        color: this.getMarkerColor(note.category)
                      }
                    },
                    keyword: note.tags?.map(tag => ({
                      _attributes: { value: tag }
                    })) || []
                  }
                }))
              }
            }
          }
        }
      }
    };
    
    // Convert to XML string
    return convert.js2xml(fcpxml, { 
      compact: true, 
      ignoreComment: true, 
      spaces: 2 
    });
  }

  // Export to CSV (enhanced version)
  exportCSV(sessionData) {
    const notes = Object.values(sessionData.notes || {});
    const metadata = sessionData.metadata || {};
    
    // Sort notes by timestamp
    notes.sort((a, b) => a.timestamp - b.timestamp);
    
    // CSV Headers
    const headers = [
      'Timecode In',
      'Timecode Out',
      'Duration',
      'Name',
      'Comment',
      'Category',
      'Tags',
      'User',
      'Timestamp',
      'Scene',
      'Take'
    ];
    
    // Build rows
    const rows = notes.map(note => {
      const duration = note.metadata?.duration || 1000;
      return [
        note.timecodeIn || this.msToTimecode(note.relativeTime || 0),
        this.msToTimecode((note.relativeTime || 0) + duration),
        this.msToTimecode(duration, '25', false),
        this.createMarkerName(note, metadata),
        `"${note.text.replace(/"/g, '""')}"`,
        note.category || 'general',
        (note.tags || []).join('; '),
        note.userName || 'Anonymous',
        new Date(note.timestamp).toISOString(),
        metadata.scene || '',
        metadata.take || ''
      ];
    });
    
    // Combine headers and rows
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csv;
  }

  // Export to Avid ALE format
  exportALE(sessionData, options = {}) {
    const {
      frameRate = '25',
      tape: _tape = 'TAPE001'
    } = options;

    const notes = Object.values(sessionData.notes || {});
    const metadata = sessionData.metadata || {};
    
    let ale = 'Heading\n';
    ale += 'FIELD_DELIM\tTABS\n';
    ale += 'VIDEO_FORMAT\t1080\n';
    ale += `FPS\t${frameRate}\n`;
    ale += 'FILM_FORMAT\t35mm, 4 perf\n';
    ale += '\n';
    ale += 'Column\n';
    ale += 'Name\tTape\tStart\tEnd\tScene\tTake\tComment\tMarker\n';
    ale += '\n';
    ale += 'Data\n';
    
    notes.forEach((note, index) => {
      const name = `MARKER_${(index + 1).toString().padStart(3, '0')}`;
      const start = this.msToTimecode(note.relativeTime || 0, frameRate);
      const end = this.msToTimecode((note.relativeTime || 0) + 1000, frameRate);
      
      ale += `${name}\t${_tape}\t${start}\t${end}\t${metadata.scene || ''}\t${metadata.take || ''}\t${this.sanitizeALEComment(note.text)}\t*\n`;
    });
    
    return ale;
  }

  // Helper methods
  sanitizeEDLComment(text) {
    // EDL comments have character limitations
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    return text
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[<>"&']/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, 120); // EDL comment limit
  }

  sanitizeALEComment(text) {
    // ALE comments should not contain tabs or newlines
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    return text
      .replace(/[\t\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[<>"&']/g, '') // Remove potentially dangerous characters
      .trim();
  }

  createMarkerName(note, metadata) {
    const parts = [];
    
    // Sanitize inputs
    if (metadata.scene && typeof metadata.scene === 'string') {
      parts.push(`Sc${metadata.scene.replace(/[^a-zA-Z0-9]/g, '')}`);
    }
    if (metadata.take && typeof metadata.take === 'string') {
      parts.push(`Tk${metadata.take.replace(/[^a-zA-Z0-9]/g, '')}`);
    }
    if (note.category && note.category !== 'general' && typeof note.category === 'string') {
      const sanitizedCategory = note.category.replace(/[^a-zA-Z0-9]/g, '');
      if (sanitizedCategory) {
        parts.push(sanitizedCategory.charAt(0).toUpperCase() + sanitizedCategory.slice(1));
      }
    }
    
    return parts.join('_') || 'Marker';
  }

  getMarkerColor(category) {
    const colors = {
      'director': 'blue',
      'script': 'green',
      'camera': 'orange',
      'sound': 'purple',
      'continuity': 'yellow',
      'vfx': 'red',
      'general': 'white'
    };
    
    return colors[category] || 'white';
  }

  // Download file helper
  downloadFile(content, filename, mimeType) {
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

  // Main export method
  async exportSession(sessionData, format, options = {}) {
    let content, filename, mimeType;
    
    switch (format) {
      case 'edl':
        content = this.exportEDL(sessionData, options);
        filename = `${sessionData.metadata?.production || 'session'}_markers.edl`;
        mimeType = 'text/plain';
        break;
        
      case 'fcpxml':
        content = this.exportFCPXML(sessionData, options);
        filename = `${sessionData.metadata?.production || 'session'}_markers.fcpxml`;
        mimeType = 'application/xml';
        break;
        
      case 'ale':
        content = this.exportALE(sessionData, options);
        filename = `${sessionData.metadata?.production || 'session'}_markers.ale`;
        mimeType = 'text/plain';
        break;
        
      case 'csv':
      default:
        content = this.exportCSV(sessionData, options);
        filename = `${sessionData.metadata?.production || 'session'}_notes.csv`;
        mimeType = 'text/csv';
        break;
    }
    
    this.downloadFile(content, filename, mimeType);
    return { success: true, filename };
  }
}

export default new ExportService();