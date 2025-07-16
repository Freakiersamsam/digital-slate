export async function exportSessionPDF({ 
  notes, 
  slateInfo, 
  sessionStart, 
  filename = 'digital-slate-session.pdf' 
}) {
  console.log('[DEBUG] exportSessionPDF called', { notes, slateInfo, sessionStart, filename });
  try {
    if (!notes || notes.length === 0) {
      alert('No notes to export!');
      return;
    }

    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4',
      compress: true
    });

    const colors = {
      primary: '#3a3a3a',
      secondary: '#6a6a6a',
      accent: '#e67e22',
      background: '#f7f5f3',
      cardBg: '#faf8f6',
      border: '#e8e4e0',
      text: {
        primary: '#4a4a4a',
        secondary: '#7a7a7a',
        light: '#999999'
      }
    };

    const setColor = (colorCode) => {
      const hex = colorCode.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return [r, g, b];
    };

    const truncateText = (text, maxWidth, addEllipsis = true) => {
      if (!text) return '';
      let truncated = text.toString();
      if (doc.getTextWidth(truncated) <= maxWidth) return truncated;
      
      const ellipsis = addEllipsis ? '...' : '';
      while (doc.getTextWidth(truncated + ellipsis) > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      return truncated + ellipsis;
    };

    const _wrapTextInColumn = (text, maxWidth) => {
      if (!text) return [''];
      const textStr = text.toString();
      const manualLines = textStr.split(/\r?\n/);
      let allLines = [];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      manualLines.forEach(line => {
        if (line.trim() === '') {
          allLines.push('');
          return;
        }
        let currentLine = '';
        let charIndex = 0;
        while (charIndex < line.length) {
          // Try adding one character at a time
          let testLine = currentLine + line[charIndex];
          if (doc.getTextWidth(testLine) <= maxWidth) {
            currentLine = testLine;
            charIndex++;
          } else {
            if (currentLine.trim() !== '') {
              // Push the current line before breaking
              allLines.push(currentLine.trimEnd());
              currentLine = '';
            } else {
              // Handle case where a single character sequence is too long
              let subWord = '';
              while (charIndex < line.length && doc.getTextWidth(subWord + line[charIndex] + '-') <= maxWidth) {
                subWord += line[charIndex];
                charIndex++;
              }
              if (subWord.length > 0) {
                allLines.push(subWord + (charIndex < line.length ? '-' : ''));
                subWord = '';
              } else {
                // If even one char doesn't fit, push it to avoid infinite loop
                allLines.push(line[charIndex]);
                charIndex++;
              }
            }
          }
        }
        if (currentLine.trim() !== '') {
          allLines.push(currentLine.trimEnd());
        }
      });
      console.log('[DEBUG] wrapTextInColumn output', { input: textStr, lines: allLines });
      return allLines.length > 0 ? allLines : [''];
    };

    // --- New robust word-wrapping and hyphenation for notes column ---
    function _wrapTextWithHyphenation(doc, text, maxWidth) {
      if (!text) return [''];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = [];
      const paragraphs = text.toString().split(/\r?\n/);
      for (const para of paragraphs) {
        if (para.trim() === '') {
          lines.push('');
          continue;
        }
        let words = para.split(/(\s+)/); // keep spaces
        let currentLine = '';
        for (let i = 0; i < words.length; i++) {
          let word = words[i];
          // If whitespace, just add
          if (/^\s+$/.test(word)) {
            currentLine += word;
            continue;
          }
          // If word fits in current line
          if (doc.getTextWidth(currentLine + word) <= maxWidth) {
            currentLine += word;
          } else {
            // If word itself is too long, break it with hyphens
            if (doc.getTextWidth(word) > maxWidth) {
              // Push current line if not empty
              if (currentLine.trim() !== '') {
                lines.push(currentLine.trimEnd());
                currentLine = '';
              }
              let subWord = '';
              for (let c = 0; c < word.length; c++) {
                let testSub = subWord + word[c];
                if (doc.getTextWidth(testSub + '-') > maxWidth) {
                  if (subWord.length > 0) {
                    lines.push(subWord + '-');
                    subWord = word[c];
                  } else {
                    // Single char too wide, just add it
                    lines.push(word[c]);
                    subWord = '';
                  }
                } else {
                  subWord = testSub;
                }
              }
              if (subWord.length > 0) {
                currentLine = subWord;
              }
            } else {
              // Word fits on its own, but not with current line
              if (currentLine.trim() !== '') {
                lines.push(currentLine.trimEnd());
              }
              currentLine = word;
            }
          }
        }
        if (currentLine.trim() !== '') {
          lines.push(currentLine.trimEnd());
        }
      }
      return lines.length > 0 ? lines : [''];
    }

    // --- Completely new robust word-wrapping and hyphenation for notes column ---
    function wrapTextNotesStrict(doc, text, maxWidth) {
      if (!text) return [''];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const lines = [];
      const paragraphs = text.toString().split(/\r?\n/);
      for (const para of paragraphs) {
        if (para.trim() === '') {
          lines.push('');
          continue;
        }
        let tokens = para.match(/\S+|\s+/g) || [];
        let currentLine = '';
        for (let i = 0; i < tokens.length; i++) {
          let token = tokens[i];
          // If token fits, add it
          if (doc.getTextWidth(currentLine + token) <= maxWidth) {
            currentLine += token;
          } else {
            // If token is a long word, break it with hyphens
            if (!/^\s+$/.test(token) && doc.getTextWidth(token) > maxWidth) {
              // Push current line if not empty
              if (currentLine.trim() !== '') {
                lines.push(currentLine.trimEnd());
                currentLine = '';
              }
              let subWord = '';
              for (let c = 0; c < token.length; c++) {
                let testSub = subWord + token[c];
                if (doc.getTextWidth(testSub + '-') > maxWidth) {
                  if (subWord.length > 0) {
                    lines.push(subWord + '-');
                    subWord = token[c];
                  } else {
                    // Single char too wide, just add it
                    lines.push(token[c]);
                    subWord = '';
                  }
                } else {
                  subWord = testSub;
                }
              }
              if (subWord.length > 0) {
                currentLine = subWord;
              }
            } else {
              // Token is whitespace or fits on its own, but not with current line
              if (currentLine.trim() !== '') {
                lines.push(currentLine.trimEnd());
              }
              currentLine = token;
            }
          }
        }
        if (currentLine.trim() !== '') {
          lines.push(currentLine.trimEnd());
        }
      }
      return lines.length > 0 ? lines : [''];
    }

    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);

    const headerHeight = 30;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    doc.setTextColor(...setColor(colors.primary));
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Slate', margin, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...setColor(colors.text.secondary));
    const headerDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const headerText = `Exported ${headerDate}`;
    doc.text(headerText, pageWidth - margin, 18, { align: 'right' });

    const cardY = headerHeight + 10;
    const cardHeight = 45;
    
    doc.setFillColor(...setColor(colors.border));
    doc.roundedRect(margin + 1, cardY + 1, contentWidth, cardHeight, 3, 3, 'F');
    doc.setFillColor(...setColor(colors.cardBg));
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 3, 3, 'F');
    
    doc.setDrawColor(...setColor(colors.border));
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 3, 3, 'S');

    doc.setTextColor(...setColor(colors.text.primary));
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Overview', margin + 8, cardY + 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const leftColX = margin + 8;
    const rightColX = margin + (contentWidth / 2) + 8;
    const labelWidth = 22;
    const maxValueWidth = (contentWidth / 2) - 30;
    
    const leftColumnItems = [
      { label: 'Production:', value: slateInfo?.prod || 'Not specified' },
      { label: 'Director:', value: slateInfo?.director || 'Not specified' },
      { label: 'DOP:', value: slateInfo?.dop || 'Not specified' },
      { label: 'Camera:', value: slateInfo?.camera || 'Not specified' }
    ];
    
    const rightColumnItems = [
      { label: 'Started:', value: new Date(sessionStart).toLocaleString() },
      { label: 'Roll:', value: slateInfo?.roll || 'Not specified' },
      { label: 'Total Notes:', value: notes.length.toString() },
      { label: 'Location:', value: slateInfo?.location || 'Not specified' }
    ];

    let leftY = cardY + 18;
    let rightY = cardY + 18;
    
    leftColumnItems.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...setColor(colors.text.secondary));
      doc.text(item.label, leftColX, leftY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...setColor(colors.text.primary));
      const displayValue = truncateText(item.value, maxValueWidth);
      doc.text(displayValue, leftColX + labelWidth, leftY);
      leftY += 7;
    });
    
    rightColumnItems.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...setColor(colors.text.secondary));
      doc.text(item.label, rightColX, rightY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...setColor(colors.text.primary));
      const displayValue = truncateText(item.value, maxValueWidth);
      doc.text(displayValue, rightColX + labelWidth, rightY);
      rightY += 7;
    });

    const tableY = cardY + cardHeight + 20;
    const headerRowHeight = 14;
    
    doc.setFillColor(...setColor(colors.primary));
    doc.roundedRect(margin, tableY, contentWidth, headerRowHeight, 2, 2, 'F');

    const columns = [
      { title: 'Timecode', x: margin + 2, width: 28, align: 'left' },
      { title: 'Relative', x: margin + 32, width: 24, align: 'left' },
      { title: 'Scene', x: margin + 58, width: 16, align: 'center' },
      { title: 'Take', x: margin + 76, width: 16, align: 'left' },
      { title: 'Notes', x: margin + 94, width: 94, align: 'left' }
    ];

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    columns.forEach(col => {
      if (col.align === 'center') {
        doc.text(col.title, col.x + (col.width / 2), tableY + 9, { align: 'center' });
      } else {
        doc.text(col.title, col.x + 2, tableY + 9);
      }
    });

    let currentY = tableY + headerRowHeight + 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    notes.forEach((note, idx) => {
      let relativeTime = '';
      if (note.slateInfo && note.slateInfo.takeStart != null && note.timecodeIn != null) {
        let noteTime = typeof note.timecodeIn === 'number' ? note.timecodeIn : parseFloat(note.timecodeIn);
        let takeStart = typeof note.slateInfo.takeStart === 'number' ? note.slateInfo.takeStart : parseFloat(note.slateInfo.takeStart);
        if (!isNaN(noteTime) && !isNaN(takeStart) && noteTime >= takeStart) {
          let relSec = noteTime - takeStart;
          let min = Math.floor(relSec / 60);
          let sec = (relSec % 60).toFixed(3);
          relativeTime = `${min}:${sec.padStart(6, '0')}`;
        }
      }

      const timecodeText = truncateText(note.timecodeIn || '-', columns[0].width - 4);
      const relativeTimeText = truncateText(relativeTime, columns[1].width - 4);
      const sceneText = truncateText(note.slateInfo?.scene || '-', columns[2].width - 4);
      const takeText = truncateText(note.slateInfo?.take || '-', columns[3].width - 4);
      
      // Use new strict wrapping for notes
      const notesLines = wrapTextNotesStrict(doc, note.content || '', columns[4].width - 8);
      const lineHeight = 4;
      const minRowHeight = 10;
      const dynamicRowHeight = Math.max(minRowHeight, notesLines.length * lineHeight + 6);

      const pageBottomLimit = 260;
      if (currentY + dynamicRowHeight > pageBottomLimit) {
        doc.addPage();
        currentY = 30;
        doc.setFillColor(...setColor(colors.primary));
        doc.roundedRect(margin, currentY - headerRowHeight, contentWidth, headerRowHeight, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        columns.forEach(col => {
          if (col.align === 'center') {
            doc.text(col.title, col.x + (col.width / 2), currentY - 5, { align: 'center' });
          } else {
            doc.text(col.title, col.x + 2, currentY - 5);
          }
        });
        currentY += 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(...setColor(colors.background));
        doc.rect(margin, currentY - 1, contentWidth, dynamicRowHeight, 'F');
      }

      doc.setTextColor(...setColor(colors.text.primary));
      const centerY = currentY + (dynamicRowHeight / 2) + 1;
      doc.text(timecodeText, columns[0].x + 2, centerY);
      doc.text(relativeTimeText, columns[1].x + 2, centerY);
      if (sceneText && sceneText !== '-') {
        doc.text(sceneText, columns[2].x + (columns[2].width / 2), centerY, { align: 'center' });
      } else {
        doc.text('-', columns[2].x + (columns[2].width / 2), centerY, { align: 'center' });
      }
      doc.text(takeText, columns[3].x + 2, centerY);
      
      if (notesLines.length > 0) {
        const notesStartY = currentY + ((dynamicRowHeight - (notesLines.length * lineHeight)) / 2) + 3;
        notesLines.forEach((line, lineIdx) => {
          if (line && line.toString().trim()) {
            doc.text(line, columns[4].x + 3, notesStartY + (lineIdx * lineHeight));
          }
        });
      }
      currentY += dynamicRowHeight;
    });

    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...setColor(colors.border));
      doc.setLineWidth(0.5);
      doc.line(margin, 285, pageWidth - margin, 285);
      
      doc.setFontSize(8);
      doc.setTextColor(...setColor(colors.text.light));
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by Digital Slate', margin, 290);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
    }

    doc.save(filename);
    console.log('[DEBUG] PDF save triggered', filename);
  } catch (err) {
    console.error('[DEBUG] Error in exportSessionPDF:', err);
    alert('PDF export failed: ' + err.message);
  }
}