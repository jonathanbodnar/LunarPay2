import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  id: number;
  reference: string | null;
  totalAmount: number;
  paidAmount?: number;
  status?: string; // 'draft', 'sent', 'paid', 'partial', 'canceled'
  fee: number;
  dueDate: string | null;
  memo: string | null;
  footer: string | null;
  createdAt: string;
  paidAt?: string | null;
  hash?: string;
  coverFee?: boolean;
  baseUrl?: string; // Base URL for generating pay online link
  donor: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    address: string | null;
    company?: string | null;
  };
  organization: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    logo?: string | null;
    primaryColor?: string | null;
  };
  products: Array<{
    productName: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
}

// Helper to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Get branding color (default to a nice accent red if not set)
  const primaryColor = invoice.organization.primaryColor || '#000000';
  const brandRgb = hexToRgb(primaryColor);
  
  // ========== HEADER ==========
  // "INVOICE" title
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 25);
  
  // Add PAID badge if invoice is paid
  if (invoice.status === 'paid') {
    // Green background badge
    doc.setFillColor(34, 197, 94); // Green
    doc.roundedRect(55, 19, 30, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', 70, 26, { align: 'center' });
  }
  
  // Merchant name/logo (as text for now, could be image if logo URL provided)
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.organization.name.toUpperCase(), 20, 40);
  
  // Invoice details on the right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  const rightColX = 130;
  const rightValX = pageWidth - 20;
  let rightY = 25;
  
  doc.text('Invoice Reference:', rightColX, rightY);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.reference || `INV-${invoice.id}`, rightValX, rightY, { align: 'right' });
  
  rightY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Date of issue:', rightColX, rightY);
  doc.setTextColor(30, 30, 30);
  doc.text(formatDate(invoice.createdAt), rightValX, rightY, { align: 'right' });
  
  if (invoice.dueDate) {
    rightY += 8;
    doc.setTextColor(100, 100, 100);
    doc.text('Due date:', rightColX, rightY);
    doc.setTextColor(30, 30, 30);
    doc.text(formatDate(invoice.dueDate), rightValX, rightY, { align: 'right' });
  }
  
  // ========== FROM / BILLED TO SECTION ==========
  let sectionY = 60;
  
  // From section (left)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('From', 20, sectionY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  let fromY = sectionY + 7;
  doc.text(invoice.organization.name, 20, fromY);
  
  if (invoice.organization.address) {
    fromY += 5;
    const addressLines = doc.splitTextToSize(invoice.organization.address, 80);
    doc.text(addressLines, 20, fromY);
    fromY += (addressLines.length - 1) * 5;
  }
  
  // Billed To section (right)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Billed To', rightColX, sectionY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  let toY = sectionY + 7;
  
  const customerName = `${invoice.donor.firstName || ''} ${invoice.donor.lastName || ''}`.trim();
  const customerLine = invoice.donor.email 
    ? `${customerName} - ${invoice.donor.email}` 
    : customerName;
  doc.text(customerLine, rightValX, toY, { align: 'right' });
  
  if (invoice.donor.company) {
    toY += 5;
    doc.text(invoice.donor.company, rightValX, toY, { align: 'right' });
  }
  
  if (invoice.donor.address) {
    toY += 5;
    const addressLines = doc.splitTextToSize(invoice.donor.address, 70);
    addressLines.forEach((line: string, i: number) => {
      doc.text(line, rightValX, toY + (i * 5), { align: 'right' });
    });
  }
  
  // ========== PAY ONLINE LINK ==========
  const payLinkY = Math.max(fromY, toY) + 15;
  doc.setTextColor(brandRgb[0], brandRgb[1], brandRgb[2]);
  doc.setFont('helvetica', 'normal');
  
  // Construct the pay online URL using provided baseUrl or fallback
  const payOnlineUrl = invoice.hash 
    ? `${invoice.baseUrl || 'https://app.lunarpay.com'}/invoice/${invoice.hash}` 
    : '#';
  
  doc.textWithLink('Pay online', 20, payLinkY, { url: payOnlineUrl });
  
  // ========== MEMO/DESCRIPTION ==========
  let contentY = payLinkY + 10;
  if (invoice.memo) {
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    const memoLines = doc.splitTextToSize(invoice.memo, pageWidth - 40);
    doc.text(memoLines, 20, contentY);
    contentY += memoLines.length * 5 + 10;
  }
  
  // ========== LINE ITEMS TABLE ==========
  const tableData = invoice.products.map(product => [
    product.productName,
    product.qty.toString(),
    formatCurrency(product.price),
    formatCurrency(product.subtotal),
  ]);
  
  autoTable(doc, {
    startY: contentY,
    head: [['Description', 'Qty', 'Unit price', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [100, 100, 100],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: { top: 8, bottom: 8, left: 0, right: 10 },
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 10,
      cellPadding: { top: 8, bottom: 8, left: 0, right: 10 },
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'left', cellWidth: 30 },
      2: { halign: 'left', cellWidth: 40 },
      3: { halign: 'right' },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0,
    },
    didDrawCell: (data) => {
      // Draw bottom border for header using brand color
      if (data.section === 'head') {
        doc.setDrawColor(brandRgb[0], brandRgb[1], brandRgb[2]);
        doc.setLineWidth(0.5);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
  });
  
  // ========== TOTALS SECTION ==========
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalsLabelX = 120;
  const totalsValueX = pageWidth - 20;
  
  // Subtotal
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal', totalsLabelX, finalY);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(invoice.totalAmount), totalsValueX, finalY, { align: 'right' });
  
  // Draw line before Amount due
  finalY += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(totalsLabelX, finalY, totalsValueX, finalY);
  
  // Amount due
  finalY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Amount due', totalsLabelX, finalY);
  doc.setFontSize(12);
  doc.text(formatCurrency(invoice.totalAmount), totalsValueX, finalY, { align: 'right' });
  
  // ========== FOOTER ==========
  if (invoice.footer) {
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const footerLines = doc.splitTextToSize(invoice.footer, pageWidth - 40);
    doc.text(footerLines, 20, footerY);
  }
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

export function generateInvoicePDFURL(invoice: InvoiceData): string {
  // This is a simplified version for data URL generation
  const doc = new jsPDF();
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('INVOICE', 20, 25);
  
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.text(invoice.organization.name.toUpperCase(), 20, 40);
  
  return doc.output('dataurlstring');
}
