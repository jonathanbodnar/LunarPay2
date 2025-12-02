import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  id: number;
  reference: string | null;
  totalAmount: number;
  fee: number;
  dueDate: string | null;
  memo: string | null;
  footer: string | null;
  createdAt: string;
  donor: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    address: string | null;
  };
  organization: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  products: Array<{
    productName: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(24);
  doc.setTextColor(84, 105, 212); // Blue color
  doc.text('INVOICE', 20, 20);
  
  // Add invoice reference
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (invoice.reference) {
    doc.text(`Invoice #: ${invoice.reference}`, 20, 30);
  }
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 36);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 42);
  }
  
  // Add organization info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('From:', 20, 55);
  doc.setFontSize(10);
  doc.text(invoice.organization.name, 20, 61);
  if (invoice.organization.email) {
    doc.text(invoice.organization.email, 20, 67);
  }
  if (invoice.organization.phone) {
    doc.text(invoice.organization.phone, 20, 73);
  }
  if (invoice.organization.address) {
    doc.text(invoice.organization.address, 20, 79);
  }
  
  // Add customer info
  doc.setFontSize(12);
  doc.text('Bill To:', 120, 55);
  doc.setFontSize(10);
  doc.text(`${invoice.donor.firstName || ''} ${invoice.donor.lastName || ''}`.trim(), 120, 61);
  if (invoice.donor.email) {
    doc.text(invoice.donor.email, 120, 67);
  }
  if (invoice.donor.address) {
    doc.text(invoice.donor.address, 120, 73);
  }
  
  // Add line items table
  const tableData = invoice.products.map(product => [
    product.productName,
    product.qty.toString(),
    `$${product.price.toFixed(2)}`,
    `$${product.subtotal.toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [84, 105, 212],
      textColor: [255, 255, 255],
    },
  });
  
  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add totals
  doc.setFontSize(10);
  const totalsX = 140;
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(`$${invoice.totalAmount.toFixed(2)}`, 180, finalY, { align: 'right' });
  
  if (invoice.fee > 0) {
    doc.text('Processing Fee:', totalsX, finalY + 6);
    doc.text(`$${invoice.fee.toFixed(2)}`, 180, finalY + 6, { align: 'right' });
  }
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  const totalY = invoice.fee > 0 ? finalY + 12 : finalY + 6;
  doc.text('Total:', totalsX, totalY);
  doc.text(`$${(invoice.totalAmount + invoice.fee).toFixed(2)}`, 180, totalY, { align: 'right' });
  
  // Add memo if present
  if (invoice.memo) {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text('Notes:', 20, totalY + 15);
    const memoLines = doc.splitTextToSize(invoice.memo, 170);
    doc.text(memoLines, 20, totalY + 21);
  }
  
  // Add footer if present
  if (invoice.footer) {
    const footerY = doc.internal.pageSize.height - 30;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const footerLines = doc.splitTextToSize(invoice.footer, 170);
    doc.text(footerLines, 20, footerY);
  }
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

export function generateInvoicePDFURL(invoice: InvoiceData): string {
  const doc = new jsPDF();
  
  // Same PDF generation logic as above...
  // (simplified for URL generation)
  
  doc.setFontSize(24);
  doc.text('INVOICE', 20, 20);
  
  // Return data URL
  return doc.output('dataurlstring');
}

