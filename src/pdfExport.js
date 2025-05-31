// Enhanced PDF export utility for Digital Slate
// Inspired by Anthropic's clean, modern design aesthetic
// Usage: import and call exportSessionPDF({ notes, slateInfo, sessionStart, filename })

export async function exportSessionPDF({ 
  notes, 
  slateInfo, 
  sessionStart, 
  filename = 'digital-slate-session.pdf' 
}) {
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

  // Modern header with gradient-like effect
  const headerHeight = 35;
  
  // Subtle background gradient effect (using rectangles)
  doc.setFillColor(...setColor(colors.background));
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Main header bar
  doc.setFillColor(...setColor(colors.primary));
  doc.roundedRect(margin, 8, contentWidth, 20, 2, 2, 'F');

  // Header text with better typography and emoji handling
  doc.setTextColor(...setColor('#ffffff'));
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  // Use simple film icon instead of emoji to avoid encoding issues
  doc.text('🎬 Digital Slate', margin + 8, 20);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const headerDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const headerText = `Exported ${headerDate}`;
  const headerTextWidth = doc.getTextWidth(headerText);
  doc.text(headerText, pageWidth - margin - 8, 20, { align: 'right' });

  // Session information card
  const cardY = headerHeight + 15;
  const cardHeight = 25;
  
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
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Session Overview', margin + 8, cardY + 10);

  doc.setFontSize(9); // Smaller font to fit better
  doc.setTextColor(...setColor(colors.text.secondary));
  
  const infoItems = [
    { label: 'Production:', value: slateInfo?.prod || 'Not specified' },
    { label: 'Started:', value: new Date(sessionStart).toLocaleString() },
    { label: 'Total Notes:', value: notes.length.toString() }
  ];

  let infoY = cardY + 16;
  const labelWidth = 25; // Fixed width for labels
  const availableWidth = contentWidth - 16 - labelWidth; // Available width for values
  
  infoItems.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...setColor(colors.text.secondary));
    doc.text(item.label, margin + 8, infoY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...setColor(colors.text.primary));
    
    // Wrap text if it's too long
    const wrappedValue = doc.splitTextToSize(item.value, availableWidth);
    doc.text(wrappedValue[0], margin + 8 + labelWidth, infoY); // Only show first line to fit
    
    infoY += 5;
  });

  // Notes table header
  const tableY = cardY + cardHeight + 20;
  const rowHeight = 12;
  const headerRowHeight = 14;
  
  // Table header background
  doc.setFillColor(...setColor(colors.primary));
  doc.roundedRect(margin, tableY, contentWidth, headerRowHeight, 2, 2, 'F');

  // Column definitions with better proportions for proper text wrapping
  const columns = [
    { title: 'Timecode', x: margin + 4, width: 22 },
    { title: 'Relative', x: margin + 28, width: 18 },
    { title: 'Scene', x: margin + 48, width: 12 },
    { title: 'Take', x: margin + 62, width: 12 },
    { title: 'Notes', x: margin + 76, width: 110 } // More space for notes
  ];

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  columns.forEach(col => {
    doc.text(col.title, col.x, tableY + 9);
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
      
      // Repeat header on new page
      doc.setFillColor(...setColor(colors.primary));
      doc.roundedRect(margin, currentY - headerRowHeight, contentWidth, headerRowHeight, 2, 2, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      columns.forEach(col => {
        doc.text(col.title, col.x, currentY - 5);
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

    // Handle notes column with proper wrapping
    const noteText = note.content || '';
    if (noteText) {
      const wrappedLines = doc.splitTextToSize(noteText, columns[4].width);
      const maxLines = Math.floor((270 - currentY) / 4); // Calculate max lines that fit on page
      const linesToShow = Math.min(wrappedLines.length, 3, maxLines); // Max 3 lines or what fits
      
      for (let i = 0; i < linesToShow; i++) {
        doc.text(wrappedLines[i], columns[4].x, currentY + 6 + (i * 4));
      }
      
      // Adjust row height if we have multiple lines
      if (linesToShow > 1) {
        currentY += (linesToShow - 1) * 4;
      }
    }

    currentY += rowHeight;
  });

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
}