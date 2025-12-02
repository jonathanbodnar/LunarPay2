import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'LunarPay'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export function generateInvoiceEmailHTML(invoice: any): string {
  const customerName = `${invoice.donor.firstName || ''} ${invoice.donor.lastName || ''}`.trim();
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #5469d4 0%, #5469d4 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e1e1e1;
    }
    .invoice-details {
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .products {
      margin: 20px 0;
    }
    .product-row {
      padding: 10px 0;
      border-bottom: 1px solid #e1e1e1;
      display: flex;
      justify-content: space-between;
    }
    .total {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #333;
      font-size: 1.2em;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #5469d4;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
      border-top: 1px solid #e1e1e1;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Invoice from ${invoice.organization.name}</h1>
    <p style="margin: 10px 0 0 0;">Invoice #${invoice.reference || invoice.id}</p>
  </div>
  
  <div class="content">
    <p>Hello ${customerName},</p>
    <p>Thank you for your business. Please find your invoice details below.</p>
    
    <div class="invoice-details">
      <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
      <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
      <p style="margin: 5px 0;"><strong>Amount Due:</strong> $${(invoice.totalAmount + invoice.fee).toFixed(2)}</p>
    </div>
    
    ${invoice.memo ? `<p><em>${invoice.memo}</em></p>` : ''}
    
    <div class="products">
      <h3>Invoice Items:</h3>
      ${invoice.products.map((product: any) => `
        <div class="product-row">
          <span>${product.productName} × ${product.qty}</span>
          <span>$${product.subtotal.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
    
    <div class="total">
      <span>Total Amount:</span>
      <span>$${(invoice.totalAmount + invoice.fee).toFixed(2)}</span>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.hash}" class="button">
        View & Pay Invoice
      </a>
    </div>
    
    ${invoice.footer ? `<p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #666; font-size: 0.9em;">${invoice.footer}</p>` : ''}
  </div>
  
  <div class="footer">
    <p>${invoice.organization.name}</p>
    ${invoice.organization.email ? `<p>${invoice.organization.email}</p>` : ''}
    ${invoice.organization.phone ? `<p>${invoice.organization.phone}</p>` : ''}
    <p style="margin-top: 15px; color: #999;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
  `;
}

export function generateReceiptEmailHTML(transaction: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #5469d4;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background: #f9f9f9;
    }
    .receipt-box {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .amount {
      font-size: 2em;
      color: #5469d4;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Payment Receipt</h1>
  </div>
  <div class="content">
    <p>Thank you for your payment!</p>
    <div class="receipt-box">
      <p><strong>Receipt #:</strong> ${transaction.id}</p>
      <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleDateString()}</p>
      <p><strong>Amount Paid:</strong></p>
      <p class="amount">$${transaction.amount.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${transaction.paymentMethod === 'card' ? 'Credit Card' : 'ACH/Bank'}</p>
    </div>
    <p>If you have any questions, please contact us.</p>
  </div>
</body>
</html>
  `;
}

