// PDF export utility with emoji support using Noto Emoji font
// Usage: import and call exportSessionPDFWithEmoji({ notes, slateInfo, sessionStart, filename })

export async function exportSessionPDFWithEmoji({ 
  notes, 
  slateInfo, 
  sessionStart, 
  filename = 'digital-slate-session-emoji.pdf' 
}) {
  try {
    if (!notes || notes.length === 0) throw new Error('No notes to export');
    const { jsPDF } = await import('jspdf');
    // Import base64 font string
    const notoEmojiBase64 = await fetch('/NotoEmoji-Regular.ttf.base64').then(r => r.text());
    jsPDF.API.addFileToVFS('NotoEmoji-Regular.ttf', notoEmojiBase64);
    jsPDF.API.addFont('NotoEmoji-Regular.ttf', 'NotoEmoji', 'normal');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    const headerHeight = 30;

    // Header with emoji font
    doc.setFont('NotoEmoji');
    doc.setFontSize(20);
    doc.text('🎬 Digital Slate', margin, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const headerDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Exported ${headerDate}`, pageWidth - margin, 18, { align: 'right' });

    // Session info card
    const cardY = headerHeight + 10;
    const cardHeight = 45;
    doc.setDrawColor(220);
    doc.setFillColor(245);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Session Overview', margin + 8, cardY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const leftColX = margin + 8;
    const rightColX = margin + (contentWidth / 2) + 8;
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
      doc.text(item.label, leftColX, leftY);
      doc.text(item.value, leftColX + 22, leftY);
      leftY += 7;
    });
    rightColumnItems.forEach(item => {
      doc.text(item.label, rightColX, rightY);
      doc.text(item.value, rightColX + 22, rightY);
      rightY += 7;
    });

    // Notes table header
    const tableY = cardY + cardHeight + 20;
    const rowHeight = 12;
    const headerRowHeight = 14;
    doc.setFillColor(220);
    doc.roundedRect(margin, tableY, contentWidth, headerRowHeight, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Timecode', margin + 3, tableY + 9);
    doc.text('Relative', margin + 33, tableY + 9);
    doc.text('Scene', margin + 63, tableY + 9);
    doc.text('Take', margin + 83, tableY + 9);
    doc.text('Note', margin + 103, tableY + 9);

    // Notes rows
    let y = tableY + headerRowHeight + 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    notes.forEach((note, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      if (idx % 2 === 0) {
        doc.setFillColor(245);
        doc.rect(margin, y - 6, contentWidth, rowHeight, 'F');
      }
      doc.text(note.timecodeIn || '', margin + 3, y);
      doc.text(note.relativeTime || '', margin + 33, y);
      doc.text(note.scene || '-', margin + 63, y);
      doc.text(note.take || '-', margin + 83, y);
      // Use emoji font for note content
      doc.setFont('NotoEmoji');
      doc.text(note.content || '', margin + 103, y, { maxWidth: 85 });
      doc.setFont('helvetica', 'normal');
      y += rowHeight;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, 290, { align: 'right' });
    }
    doc.save(filename);
  } catch (err) {
    alert('PDF export with emoji failed: ' + err.message);
    console.error('PDF export with emoji failed:', err);
  }
}
