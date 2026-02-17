import { jsPDF } from 'jspdf';

export async function GET() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();   // 612
  const H = doc.internal.pageSize.getHeight();  // 792
  const M = 50; // margin

  // ─── Colors ───
  const navy  = [10, 10, 40] as const;
  const blue  = [37, 99, 235] as const;
  const gray  = [107, 114, 128] as const;
  const lightGray = [243, 244, 246] as const;
  const green = [22, 163, 74] as const;
  const white = [255, 255, 255] as const;

  // ─── Helpers ───
  const setColor = (c: readonly number[]) => doc.setTextColor(c[0], c[1], c[2]);
  const fillRect = (x: number, y: number, w: number, h: number, c: readonly number[], r = 0) => {
    doc.setFillColor(c[0], c[1], c[2]);
    if (r > 0) doc.roundedRect(x, y, w, h, r, r, 'F');
    else doc.rect(x, y, w, h, 'F');
  };
  const drawLine = (x1: number, y1: number, x2: number, y2: number, c: readonly number[], width = 0.5) => {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
  };

  // ═══════════════════════════════════════════
  // HEADER / LETTERHEAD
  // ═══════════════════════════════════════════

  // Top accent bar
  fillRect(0, 0, W, 4, blue);

  // ── Draw crescent moon logo icon ──
  const ms = 1.3; // moon scale
  const mx = M;   // moon x offset
  const my = 22;   // moon y offset

  // Outer circle (stroke only)
  doc.setDrawColor(navy[0], navy[1], navy[2]);
  doc.setLineWidth(2 * ms);
  doc.setLineCap('round');
  doc.circle(mx + 10 * ms, my + 8 * ms, 6 * ms, 'S');

  // Inner filled circle (creates crescent by overlapping)
  // First erase overlap with white, then fill navy
  doc.setFillColor(255, 255, 255);
  doc.circle(mx + 13 * ms, my + 5.5 * ms, 4.3 * ms, 'F');
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.circle(mx + 13 * ms, my + 5.5 * ms, 4 * ms, 'F');

  // Logo text "LunarPay" to the right of the icon
  const textX = M + 24 * ms;
  let y = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  setColor(navy);
  doc.text('LunarPay', textX, y);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(gray);
  doc.text('Free-Speech Payment Processing', textX, y + 14);

  // Right-side contact
  doc.setFontSize(8.5);
  setColor(gray);
  const rightX = W - M;
  doc.text('app.lunarpay.com', rightX, y - 8, { align: 'right' });
  doc.text('support@lunarpay.com', rightX, y + 3, { align: 'right' });

  // Divider
  y += 30;
  drawLine(M, y, W - M, y, [229, 231, 235], 1);

  // ═══════════════════════════════════════════
  // TITLE SECTION
  // ═══════════════════════════════════════════

  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  setColor(navy);
  doc.text('Fee Schedule', M, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setColor(gray);
  doc.text('Transparent, flat-rate pricing with no hidden fees.', M, y);

  y += 8;
  doc.setFontSize(8.5);
  setColor(gray);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  doc.text(`Effective: ${today}`, M, y);

  // ═══════════════════════════════════════════
  // CREDIT & DEBIT CARDS
  // ═══════════════════════════════════════════

  y += 30;
  const cardW = (W - M * 2 - 20) / 2;

  // Card box
  fillRect(M, y, cardW, 120, lightGray, 8);

  // Card header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(gray);
  doc.text('CREDIT & DEBIT CARDS', M + 16, y + 22);

  // Card brands text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor([156, 163, 175]);
  doc.text('Visa  |  Mastercard  |  Discover  |  Amex', M + 16, y + 36);

  // Rate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  setColor(navy);
  doc.text('2.75%', M + 16, y + 72);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  setColor(gray);
  doc.text('+  27\u00A2', M + 108, y + 72);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(gray);
  doc.text('per transaction', M + 16, y + 90);

  // ═══════════════════════════════════════════
  // ACH / BANK TRANSFER
  // ═══════════════════════════════════════════

  const achX = M + cardW + 20;
  fillRect(achX, y, cardW, 120, lightGray, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(gray);
  doc.text('ACH / BANK TRANSFER', achX + 16, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor([156, 163, 175]);
  doc.text('Direct bank-to-bank payments', achX + 16, y + 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  setColor(navy);
  doc.text('1%', achX + 16, y + 72);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  setColor(gray);
  doc.text('+  50\u00A2', achX + 56, y + 72);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(gray);
  doc.text('per transaction', achX + 16, y + 90);

  // ═══════════════════════════════════════════
  // ADDITIONAL FEES TABLE
  // ═══════════════════════════════════════════

  y += 145;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(navy);
  doc.text('Additional Fees', M, y);

  y += 18;
  const tableW = W - M * 2;
  const col1W = tableW * 0.55;

  // Table header
  fillRect(M, y, tableW, 28, navy, 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(white);
  doc.text('Fee Type', M + 14, y + 18);
  doc.text('Rate', M + col1W + 14, y + 18);

  // Table rows
  const fees = [
    { type: 'International Credit/Debit Cards', rate: '+ 2% added to standard card rate', note: 'For cards issued outside the United States' },
    { type: 'Automatically Update Expired Cards', rate: '$10/mo  +  30\u00A2 per update', note: 'Keeps recurring payments running when cards expire' },
    { type: 'Chargeback Fee', rate: '$15 per occurrence', note: 'Charged only when a dispute is filed' },
  ];

  y += 28;
  fees.forEach((fee, i) => {
    const rowH = 48;
    if (i % 2 === 0) fillRect(M, y, tableW, rowH, [249, 250, 251]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(navy);
    doc.text(fee.type, M + 14, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(gray);
    doc.text(fee.note, M + 14, y + 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(blue);
    doc.text(fee.rate, M + col1W + 14, y + 24);

    y += rowH;
  });

  // Table border
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(M, y - fees.length * 48 - 28, tableW, fees.length * 48 + 28, 4, 4, 'S');

  // ═══════════════════════════════════════════
  // WHAT'S NOT INCLUDED (no hidden fees)
  // ═══════════════════════════════════════════

  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor(navy);
  doc.text('No Hidden Fees', M, y);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(gray);
  const noFees = [
    'No setup fees',
    'No monthly minimums',
    'No PCI compliance fees',
    'No gateway fees',
    'No batch fees',
    'No annual fees',
    'No early termination fees',
    'No statement fees',
  ];

  // Two columns
  const colWidth = (tableW - 20) / 2;
  noFees.forEach((item, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const ix = M + col * (colWidth + 20);
    const iy = y + row * 18;

    // Checkmark
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(green);
    doc.text('\u2713', ix, iy + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    setColor(navy);
    doc.text(item, ix + 16, iy + 12);
  });

  // ═══════════════════════════════════════════
  // RATE LOCK GUARANTEE
  // ═══════════════════════════════════════════

  y += 4 * 18 + 24;
  fillRect(M, y, tableW, 64, [240, 253, 244], 8);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(1);
  doc.roundedRect(M, y, tableW, 64, 8, 8, 'S');

  // Shield icon (text placeholder)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setColor(green);
  doc.text('\u2713', M + 16, y + 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setColor([21, 128, 61]);
  doc.text('Rate Lock Guarantee', M + 36, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor([22, 101, 52]);
  doc.text('We will never increase your rate or charge additional fees beyond what is listed in this schedule.', M + 36, y + 44);

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════

  const fY = H - 40;
  drawLine(M, fY - 10, W - M, fY - 10, [229, 231, 235], 0.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor([156, 163, 175]);
  doc.text('LunarPay, Inc.  \u2022  app.lunarpay.com  \u2022  support@lunarpay.com', M, fY);
  doc.text('This document is for informational purposes. Fees are subject to the terms of your merchant agreement.', M, fY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Page 1 of 1', W - M, fY, { align: 'right' });

  // Bottom accent bar
  fillRect(0, H - 4, W, 4, blue);

  // ─── Output ───
  const pdfBuffer = doc.output('arraybuffer');

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="LunarPay-Fee-Schedule.pdf"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
