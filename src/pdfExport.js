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

  // Anthropic-inspired color palette
  const colors = {
    primary: '#1a1a1a',        // Deep charcoal
    secondary: '#4a4a4a',      // Medium gray
    accent: '#e67e22',         // Warm orange
    background: '#fafafa',     // Soft white
    cardBg: '#ffffff',         // Pure white
    border: '#e8e8e8',        // Light border
    text: {
      primary: '#2c2c2c',      // Dark text
      secondary: '#666666',    // Medium text
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

  // Header text with better typography
  doc.setTextColor(...setColor('#ffffff'));
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('🎬 Digital Slate', margin + 8, 20);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const headerDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Exported ${headerDate}`, pageWidth - margin - 8, 20, { align: 'right' });

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

  // Session info with improved typography
  doc.setTextColor(...setColor(colors.text.primary));
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Session Overview', margin + 8, cardY + 10);

  doc.setFontSize(10);
  doc.setTextColor(...setColor(colors.text.secondary));
  
  const infoItems = [
    { label: 'Production:', value: slateInfo?.prod || 'Not specified' },
    { label: 'Started:', value: new Date(sessionStart).toLocaleString() },
    { label: 'Total Notes:', value: notes.length.toString() }
  ];

  let infoY = cardY + 16;
  infoItems.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...setColor(colors.text.secondary));
    doc.text(item.label, margin + 8, infoY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...setColor(colors.text.primary));
    doc.text(item.value, margin + 35, infoY);
    
    infoY += 5;
  });

  // Notes table header
  const tableY = cardY + cardHeight + 20;
  const rowHeight = 12;
  const headerRowHeight = 14;
  
  // Table header background
  doc.setFillColor(...setColor(colors.primary));
  doc.roundedRect(margin, tableY, contentWidth, headerRowHeight, 2, 2, 'F');

  // Column definitions with better proportions
  const columns = [
    { title: 'Timecode', x: margin + 4, width: 25 },
    { title: 'Relative', x: margin + 32, width: 20 },
    { title: 'Scene', x: margin + 55, width: 15 },
    { title: 'Take', x: margin + 73, width: 15 },
    { title: 'Notes', x: margin + 91, width: 95 }
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

    // Row data with improved formatting
    const rowData = [
      { text: note.timecodeIn || '-', x: columns[0].x },
      { text: note.relativeTime || '-', x: columns[1].x },
      { text: note.slateInfo?.scene || '-', x: columns[2].x },
      { text: note.slateInfo?.take || '-', x: columns[3].x },
      { text: note.content || '', x: columns[4].x, maxWidth: columns[4].width }
    ];

    doc.setTextColor(...setColor(colors.text.primary));
    
    rowData.forEach((data, colIdx) => {
      if (colIdx === 4) { // Notes column with text wrapping
        const lines = doc.splitTextToSize(data.text, data.maxWidth);
        doc.text(lines.slice(0, 2), data.x, currentY + 6); // Limit to 2 lines
      } else {
        doc.text(data.text, data.x, currentY + 6);
      }
    });

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