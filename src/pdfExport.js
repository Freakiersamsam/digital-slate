// Enhanced PDF export utility for Digital Slate
// Inspired by Anthropic's clean, modern design aesthetic
// Usage: import and call exportSessionPDF({ notes, slateInfo, sessionStart, filename })

import notoEmojiFontBase64 from '../NotoEmoji-Regular.ttf.base64?raw';

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

  // Modern header without beige bar - clean white background
  const headerHeight = 30;
  
  // Clean white background for entire header area
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Helper to split text into emoji and non-emoji segments
  function splitTextByEmoji(text) {
    // Regex for most emoji (covers most single codepoint emojis)
    const emojiRegex = /([\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD-\u25FE\u2614-\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA-\u26AB\u26BD-\u26BE\u26C4-\u26C5\u26CE\u26D4\u26EA\u26F2-\u26F3\u26F5\u26FA\u26FD\u2705\u270A-\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B-\u2B1C\u2B50\u2B55\u1F004\u1F0CF\u1F18E\u1F191-\u1F19A\u1F1E6-\u1F1FF\u1F201-\u1F202\u1F21A\u1F22F\u1F232-\u1F23A\u1F250-\u1F251\u1F300-\u1F321\u1F324-\u1F393\u1F396-\u1F397\u1F399-\u1F39B\u1F39E-\u1F3F0\u1F3F3-\u1F3F5\u1F3F7-\u1F4FD\u1F4FF-\u1F53D\u1F549-\u1F54E\u1F550-\u1F567\u1F56F-\u1F570\u1F573-\u1F57A\u1F587\u1F58A-\u1F58D\u1F590\u1F595-\u1F596\u1F5A4-\u1F5A5\u1F5A8\u1F5B1-\u1F5B2\u1F5BC\u1F5C2-\u1F5C4\u1F5D1-\u1F5D3\u1F5DC-\u1F5DE\u1F5E1\u1F5E3\u1F5E8\u1F5EF\u1F5F3\u1F5FA-\u1F64F\u1F680-\u1F6C5\u1F6CB-\u1F6D2\u1F6E0-\u1F6E5\u1F6E9\u1F6EB-\u1F6EC\u1F6F0\u1F6F3-\u1F6F8\u1F910-\u1F93A\u1F93C-\u1F93E\u1F940-\u1F945\u1F947-\u1F94C\u1F950-\u1F96B\u1F980-\u1F997\u1F9C0\u1F9D0-\u1F9E6\u1FA70-\u1FA73\u1FA78-\u1FA7A\u1FA80-\u1FA82\u1FA90-\u1FA95\u1FAD0-\u1FAD9\u200D\uFE0F\u2640\u2642\u2695\u1F3FB-\u1F3FF])/gu;
    const segments = [];
    let lastIndex = 0;
    let match;
    while ((match = emojiRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), isEmoji: false });
      }
      segments.push({ text: match[0], isEmoji: true });
      lastIndex = emojiRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isEmoji: false });
    }
    return segments;
  }

  // --- Emoji font embedding logic ---
  // Noto Emoji font (monochrome, base64-encoded)
  // Download from https://github.com/googlefonts/noto-emoji/blob/main/fonts/NotoEmoji-Regular.ttf
  // Convert to base64: base64 -i NotoEmoji-Regular.ttf | pbcopy
  // Paste the full base64 string below (replace <BASE64_STRING_HERE>)
  const notoEmojiFont = notoEmojiFontBase64;

  // Register Noto Emoji font if available
  if (notoEmojiFont && notoEmojiFont.trim().length > 0 && notoEmojiFont !== '<BASE64_STRING_HERE>') {
    doc.addFileToVFS('NotoEmoji-Regular.ttf', notoEmojiFont);
    doc.addFont('NotoEmoji-Regular.ttf', 'NotoEmoji', 'normal');
  }

  // Simple header with emoji font if available
  if (notoEmojiFont && notoEmojiFont.trim().length > 0 && notoEmojiFont !== '<BASE64_STRING_HERE>') {
    doc.setFont('NotoEmoji', 'normal');
  } else {
    doc.setFont('helvetica', 'bold');
  }
  doc.setTextColor(...setColor(colors.primary));
  doc.setFontSize(20);
  doc.text('🎬 Digital Slate', margin, 18);
  
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
          if (seg.isEmoji && notoEmojiFont && notoEmojiFont.trim().length > 0 && notoEmojiFont !== '<BASE64_STRING_HERE>') {
            doc.setFont('NotoEmoji', 'normal');
          } else {
            doc.setFont('helvetica', 'normal');
          }
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
}