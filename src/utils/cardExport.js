import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Exports the card DOM element as a PNG download.
 * @param {React.RefObject} cardRef - ref to the card element
 * @param {string} filename - download filename
 */
export async function exportCardAsPNG(cardRef, filename = 'ssc-al-card.png') {
  const el = cardRef.current;
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 3,          // 3× for high-DPI / retina quality
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Exports the card DOM element as a PDF download.
 * Card dimensions: 85.6mm × 54mm (ISO/IEC 7810 ID-1 credit card standard)
 */
export async function exportCardAsPDF(cardRef, member) {
  const el = cardRef.current;
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);

  const safeName = (member?.fullName || 'member').replace(/\s+/g, '_');
  pdf.save(`SSC-AL_Card_${safeName}.pdf`);
}
