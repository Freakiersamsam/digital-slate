// Enhanced PDF export utility for Digital Slate
// Inspired by Anthropic's clean, modern design aesthetic
// Usage: import and call exportSessionPDF({ notes, slateInfo, sessionStart, filename })

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
    
    // Create document with optimized settings
    const doc = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4',
      compress: true
    });

    // Anthropic-inspired color palette with softer tones
    const colors = {
      primary: '#3a3a3a',        // Softer charcoal (less intense)
      secondary: '#6a6a6a',      // Medium gray
      accent: '#e67e22',         // Warm orange
      background: '#f7f5f3',     // Cream background
      cardBg: '#faf8f6',         // Soft cream card
      border: '#e8e4e0',        // Warm light border
      text: {
        primary: '#4a4a4a',      // Softer dark text
        secondary: '#7a7a7a',    // Medium text
        light: '#999999'         // Light text
      }
    };

    // Helper function to set colors
    const setColor = (colorCode) => {
      const hex = colorCode.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return [r, g, b];
    };

    // Page margins and layout
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);

    // Modern header without beige bar - clean white background
    const headerHeight = 30;
    
    // Clean white background for entire header area
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Remove emoji from header, just use text
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

    // Session information card with more comprehensive info
    const cardY = headerHeight + 10;
    const cardHeight = 45; // Increased height for more info
    
    // Card background with subtle shadow effect
    doc.setFillColor(...setColor(colors.border));
    doc.roundedRect(margin + 1, cardY + 1, contentWidth, cardHeight, 3, 3, 'F'); // Shadow
    doc.setFillColor(...setColor(colors.cardBg));
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 3, 3, 'F');
    
    // Card border
    doc.setDrawColor(...setColor(colors.border));
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 3, 3, 'S');

    // Session info with improved typography and proper text fitting
    doc.setTextColor(...setColor(colors.text.primary));
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Overview', margin + 8, cardY + 10);

    doc.setFontSize(8); // Smaller font to fit more info
    doc.setFont('helvetica', 'normal');
    
    // Two-column layout for session info
    const leftColX = margin + 8;
    const rightColX = margin + (contentWidth / 2) + 8;
    const labelWidth = 22;
    const maxValueWidth = (contentWidth / 2) - 30; // Max width for values
    
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
    
    // Left column
    leftColumnItems.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...setColor(colors.text.secondary));
      doc.text(item.label, leftColX, leftY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...setColor(colors.text.primary));
      
      // Truncate text if too long
      let displayValue = item.value;
      if (doc.getTextWidth(displayValue) > maxValueWidth) {
        while (doc.getTextWidth(displayValue + '...') > maxValueWidth && displayValue.length > 0) {
          displayValue = displayValue.slice(0, -1);
        }
        displayValue += '...';
      }
      
      doc.text(displayValue, leftColX + labelWidth, leftY);
      leftY += 7;
    });
    
    // Right column
    rightColumnItems.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...setColor(colors.text.secondary));
      doc.text(item.label, rightColX, rightY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...setColor(colors.text.primary));
      
      // Truncate text if too long
      let displayValue = item.value;
      if (doc.getTextWidth(displayValue) > maxValueWidth) {
        while (doc.getTextWidth(displayValue + '...') > maxValueWidth && displayValue.length > 0) {
          displayValue = displayValue.slice(0, -1);
        }
        displayValue += '...';
      }
      
      doc.text(displayValue, rightColX + labelWidth, rightY);
      rightY += 7;
    });

    // Notes table header
    const tableY = cardY + cardHeight + 20;
    const rowHeight = 12;
    const headerRowHeight = 14;
    
    // Table header background
    doc.setFillColor(...setColor(colors.primary));
    doc.roundedRect(margin, tableY, contentWidth, headerRowHeight, 2, 2, 'F');

    // Column definitions with better proportions and center alignment for Scene
    const columns = [
      { title: 'Timecode', x: margin + 4, width: 22, align: 'left' },
      { title: 'Relative', x: margin + 28, width: 18, align: 'left' },
      { title: 'Scene', x: margin + 48, width: 12, align: 'center' },
      { title: 'Take', x: margin + 62, width: 12, align: 'left' },
      { title: 'Notes', x: margin + 76, width: 110, align: 'left' }
    ];

    // Header text with center alignment for Scene column
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    columns.forEach(col => {
      if (col.align === 'center') {
        doc.text(col.title, col.x + (col.width / 2), tableY + 9, { align: 'center' });
      } else {
        doc.text(col.title, col.x, tableY + 9);
      }
    });

    // Table rows with improved styling
    let currentY = tableY + headerRowHeight + 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    notes.forEach((note, idx) => {
      // Check for page break
      if (currentY > 270) {
        doc.addPage();
        currentY = 30;
        
        // Repeat header on new page with center alignment
        doc.setFillColor(...setColor(colors.primary));
        doc.roundedRect(margin, currentY - headerRowHeight, contentWidth, headerRowHeight, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        columns.forEach(col => {
          if (col.align === 'center') {
            doc.text(col.title, col.x + (col.width / 2), currentY - 5, { align: 'center' });
          } else {
            doc.text(col.title, col.x, currentY - 5);
          }
        });
        
        currentY += 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }

      // Alternating row colors with subtle styling
      if (idx % 2 === 0) {
        doc.setFillColor(...setColor(colors.background));
        doc.rect(margin, currentY - 2, contentWidth, rowHeight, 'F');
      }

      // Row data with improved formatting and proper text wrapping
      const rowData = [
        { text: note.timecodeIn || '-', x: columns[0].x },
        { text: note.relativeTime || '-', x: columns[1].x },
        { text: note.slateInfo?.scene || '-', x: columns[2].x },
        { text: note.slateInfo?.take || '-', x: columns[3].x }
      ];

      doc.setTextColor(...setColor(colors.text.primary));
      
      // Handle regular columns
      rowData.forEach((data) => {
        doc.text(data.text, data.x, currentY + 6);
      });

      // Handle notes column with proper wrapping and emoji font
      const noteText = note.content || '';
      if (noteText) {
        // Split into lines that fit the column width
        const wrappedLines = doc.splitTextToSize(noteText, columns[4].width);
        const maxLines = Math.floor((270 - currentY) / 4); // Calculate max lines that fit on page
        const linesToShow = Math.min(wrappedLines.length, 3, maxLines); // Max 3 lines or what fits
        for (let i = 0; i < linesToShow; i++) {
          const line = wrappedLines[i];
          let x = columns[4].x;
          // Split line into emoji/non-emoji segments
          const segments = splitTextByEmoji(line);
          segments.forEach(seg => {
            doc.setFont('helvetica', 'normal');
            doc.text(seg.text, x, currentY + 6 + (i * 4), { baseline: 'top' });
            x += doc.getTextWidth(seg.text);
          });
        }
        // Adjust row height if we have multiple lines
        if (linesToShow > 1) {
          currentY += (linesToShow - 1) * 4;
        }
      }

      currentY += rowHeight;
    });

    // Restore font for rest of document
    doc.setFont('helvetica', 'normal');

    // Enhanced footer
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(...setColor(colors.border));
      doc.setLineWidth(0.5);
      doc.line(margin, 285, pageWidth - margin, 285);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(...setColor(colors.text.light));
      doc.setFont('helvetica', 'normal');
      
      // Left side - generation info
      doc.text('Generated by Digital Slate', margin, 290);
      
      // Right side - page numbers
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
    }

    // Save with the exact same behavior as original
    doc.save(filename);
    console.log('[DEBUG] PDF save triggered', filename);
  } catch (err) {
    console.error('[DEBUG] Error in exportSessionPDF:', err);
    alert('PDF export failed: ' + err.message);
  }
}