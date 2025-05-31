const { jsPDF } = require('jspdf');
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// Header styling
const headerBgColor = '#22223b';
const headerTextColor = '#f2e9e4';
doc.setFillColor(headerBgColor);
doc.rect(0, 0, 210, 25, 'F');
doc.setTextColor(headerTextColor);
doc.setFontSize(22);
doc.setFont('helvetica', 'bold');
doc.text('🎬 Digital Slate', 10, 17);
doc.setFontSize(12);
doc.setFont('helvetica', 'normal');
doc.text('Session Notes (Test Data)', 150, 17, { align: 'right', maxWidth: 50 });

// Slate info section
const slateInfoY = 32;
doc.setTextColor('#22223b');
doc.setFontSize(13);
doc.setFont('helvetica', 'bold');
doc.text('Production:', 10, slateInfoY);
doc.setFont('helvetica', 'normal');
doc.text('Test Production', 40, slateInfoY);
doc.setFont('helvetica', 'bold');
doc.text('Session Start:', 10, slateInfoY + 8);
doc.setFont('helvetica', 'normal');
doc.text('2025-05-30 08:00:00', 40, slateInfoY + 8);

// Table header
const tableY = slateInfoY + 18;
doc.setFillColor('#c9ada7');
doc.rect(10, tableY, 190, 10, 'F');
doc.setTextColor('#22223b');
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.text('Timecode', 13, tableY + 7);
doc.text('Relative', 43, tableY + 7);
doc.text('Scene', 73, tableY + 7);
doc.text('Take', 93, tableY + 7);
doc.text('Note', 113, tableY + 7);

// Table rows
const notes = [
  {timecodeIn: '08:00:00.000', relativeTime: '00:00:00.000', content: 'Call time. Crew arrives on set.', scene: '1A', take: '1'},
  {timecodeIn: '08:15:23.123', relativeTime: '00:15:23.123', content: 'Camera setup complete. Lighting adjusted.', scene: '1A', take: '1'},
  {timecodeIn: '09:05:10.456', relativeTime: '01:05:10.456', content: 'First take. Minor audio issue.', scene: '1A', take: '1'},
  {timecodeIn: '09:45:00.789', relativeTime: '01:45:00.789', content: 'Break for coffee.', scene: '', take: ''},
  {timecodeIn: '10:10:05.321', relativeTime: '02:10:05.321', content: 'Second take. Good performance.', scene: '1A', take: '2'},
  {timecodeIn: '11:30:45.000', relativeTime: '03:30:45.000', content: 'Lunch break.', scene: '', take: ''},
  {timecodeIn: '13:00:00.000', relativeTime: '05:00:00.000', content: 'Afternoon session. Scene 2B setup.', scene: '2B', take: '1'},
  {timecodeIn: '14:20:30.654', relativeTime: '06:20:30.654', content: 'Scene 2B, Take 1. Camera issue, reshoot needed.', scene: '2B', take: '1'},
  {timecodeIn: '15:05:12.111', relativeTime: '07:05:12.111', content: 'Scene 2B, Take 2. Success.', scene: '2B', take: '2'},
  {timecodeIn: '16:45:00.000', relativeTime: '08:45:00.000', content: 'Wrap for the day.', scene: '', take: ''}
];
let y = tableY + 13;
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
notes.forEach((note, idx) => {
  if (y > 275) {
    doc.addPage();
    y = 20;
  }
  // Alternate row color
  if (idx % 2 === 0) {
    doc.setFillColor('#f2e9e4');
    doc.rect(10, y - 5, 190, 9, 'F');
  }
  doc.setTextColor('#22223b');
  doc.text(note.timecodeIn, 13, y);
  doc.text(note.relativeTime, 43, y);
  doc.text(note.scene || '-', 73, y);
  doc.text(note.take || '-', 93, y);
  doc.text(note.content, 113, y, { maxWidth: 85 });
  y += 9;
});

// Footer
const pageCount = doc.internal.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);
  doc.setTextColor('#8d99ae');
  doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: 'right' });
}

doc.save('/Users/samuelferland/Downloads/digital-slate-test-session.pdf');
console.log('PDF generated at ~/Downloads/digital-slate-test-session.pdf');
