// PDF export utility with emoji support using Noto Emoji font
// Usage: import and call exportSessionPDFWithEmoji({ notes, slateInfo, sessionStart, filename })
import notoEmojiBase64 from '../NotoEmoji-Regular.ttf.base64?raw';

export async function exportSessionPDFWithEmoji({ 
  notes, 
  slateInfo, 
  sessionStart, 
  filename = 'digital-slate-session-emoji.pdf' 
}) {
  try {
    if (!notes || notes.length === 0) throw new Error('No notes to export');
    const { jsPDF } = await import('jspdf');
    jsPDF.API.addFileToVFS('NotoEmoji-Regular.ttf', notoEmojiBase64);
    jsPDF.API.addFont('NotoEmoji-Regular.ttf', 'NotoEmoji', 'normal');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    const headerHeight = 30;

    // Header with emoji font (test: only emoji, large size)
    doc.setFont('NotoEmoji');
    doc.setFontSize(40);
    doc.text('🎬', margin, 25);
    // Optionally, add the text below in normal font
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.text('Digital Slate', margin + 25, 25);
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
      // Improved: Split note content into emoji/non-emoji segments and set font accordingly
      const splitTextByEmoji = (text) => {
        // Regex for most emoji (covers most single codepoint emojis)
        const emojiRegex = /([\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD-\u25FE\u2614-\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA-\u26AB\u26BD-\u26BE\u26C4-\u26C5\u26CE\u26D4\u26EA\u26F2-\u26F3\u26F5\u26FA\u26FD\u2705\u270A-\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B-\u2B1C\u2B50\u2B55\u1F004\u1F0CF\u1F18E\u1F191-\u1F19A\u1F1E6-\u1F1FF\u1F201-\u1F202\u1F21A\u1F22F\u1F232-\u1F23A\u1F250-\u1F251\u1F300-\u1F321\u1F324-\u1F393\u1F396-\u1F397\u1F399-\u1F39B\u1F39E-\u1F3F0\u1F3F3-\u1F3F5\u1F3F7-\u1F4FD\u1F4FF-\u1F53D\u1F549-\u1F54E\u1F550-\u1F567\u1F56F-\u1F570\u1F573-\u1F579\u1F587\u1F58A-\u1F58D\u1F590\u1F595-\u1F596\u1F5A4\u1F5A5\u1F5A8\u1F5B1-\u1F5B2\u1F5BC\u1F5C2-\u1F5C4\u1F5D1-\u1F5D3\u1F5DC-\u1F5DE\u1F5E1\u1F5E3\u1F5E8\u1F5EF\u1F5F3\u1F5FA-\u1F64F\u1F680-\u1F6C5\u1F6CB-\u1F6D2\u1F6E0-\u1F6E5\u1F6E9\u1F6EB-\u1F6EC\u1F6F0\u1F6F3\u1F910-\u1F93A\u1F93C-\u1F93E\u1F940-\u1F945\u1F947-\u1F94C\u1F950-\u1F96B\u1F980-\u1F997\u1F9C0\u1F9D0-\u1F9E6])/g;
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
      };
      let x = margin + 103;
      const segments = splitTextByEmoji(note.content || '');
      segments.forEach(seg => {
        if (seg.isEmoji) {
          doc.setFont('NotoEmoji');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        doc.text(seg.text, x, y, { maxWidth: 85 });
        // Advance x for next segment (approximate width)
        x += doc.getTextWidth(seg.text);
      });
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
