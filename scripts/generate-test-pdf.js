const { jsPDF } = require('jspdf');
const doc = new jsPDF();
doc.setFontSize(16);
doc.text('Digital Slate - Session Notes (Test Data)', 10, 15);
doc.setFontSize(12);
doc.text('Production: Test Production', 10, 25);
doc.text('Session Start: 2025-05-30 08:00:00', 10, 32);
let y = 42;
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
notes.forEach((note) => {
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  let meta = `[${note.timecodeIn} | +${note.relativeTime}]`;
  if (note.scene || note.take) meta += ` (Scene: ${note.scene || ''} Take: ${note.take || ''})`;
  doc.text(meta, 10, y);
  y += 7;
  doc.text(note.content, 14, y);
  y += 10;
});
doc.save('/Users/samuelferland/Downloads/digital-slate-test-session.pdf');
console.log('PDF generated at ~/Downloads/digital-slate-test-session.pdf');
