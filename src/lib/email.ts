import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@lunarpay.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'LunarPay';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[EMAIL] SendGrid not configured, skipping email:', options.subject);
    console.log('[EMAIL] Would send to:', options.to);
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      html: options.html,
      replyTo: options.replyTo,
    });

    console.log('[EMAIL] Sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error);
    return false;
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const baseTemplate = (content: string, brandColor: string = '#000000') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: ${brandColor}; }
    .content { background: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #e5e5e5; }
    .button { display: inline-block; background: ${brandColor}; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${brandColor}; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    .amount { font-size: 28px; font-weight: bold; color: ${brandColor}; }
    .details { background: #f9f9f9; border-radius: 6px; padding: 15px; margin: 15px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .details-row:last-child { border-bottom: none; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} LunarPay. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// PORTAL LOGIN OTP
// ============================================

export async function sendPortalLoginCode(
  to: string,
  code: string,
  organizationName: string,
  brandColor?: string
): Promise<boolean> {
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Your Verification Code</h2>
      <p>Use this code to sign in to your customer portal:</p>
      <div class="code">${code}</div>
      <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `, brandColor);

  return sendEmail({
    to,
    subject: `Your ${organizationName} verification code: ${code}`,
    html,
  });
}

// ============================================
// INVOICE EMAILS
// ============================================

interface InvoiceEmailData {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate?: string;
  invoiceUrl: string;
  organizationName: string;
  organizationEmail?: string;
  memo?: string;
  brandColor?: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Invoice ${data.invoiceNumber}</h2>
      <p>Hi ${data.customerName},</p>
      <p>You have a new invoice from ${data.organizationName}.</p>
      
      <div class="details">
        <table>
          <tr>
            <td><strong>Amount Due</strong></td>
            <td style="text-align: right;"><span class="amount">${data.totalAmount}</span></td>
          </tr>
          ${data.dueDate ? `<tr><td>Due Date</td><td style="text-align: right;">${data.dueDate}</td></tr>` : ''}
          <tr>
            <td>Invoice #</td>
            <td style="text-align: right;">${data.invoiceNumber}</td>
          </tr>
        </table>
      </div>
      
      ${data.memo ? `<p style="color: #666; font-style: italic;">"${data.memo}"</p>` : ''}
      
      <div style="text-align: center;">
        <a href="${data.invoiceUrl}" class="button">View & Pay Invoice</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        Questions? Contact ${data.organizationName}${data.organizationEmail ? ` at ${data.organizationEmail}` : ''}.
      </p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject: `Invoice ${data.invoiceNumber} from ${data.organizationName} - ${data.totalAmount}`,
    html,
    replyTo: data.organizationEmail,
  });
}

// ============================================
// PAYMENT CONFIRMATION - CUSTOMER
// ============================================

interface PaymentConfirmationData {
  customerName: string;
  customerEmail: string;
  amount: string;
  lastFour: string;
  paymentMethod: 'card' | 'bank';
  transactionId: string;
  date: string;
  organizationName: string;
  organizationEmail?: string;
  items?: Array<{ name: string; amount: string }>;
  brandColor?: string;
}

export async function sendPaymentConfirmation(data: PaymentConfirmationData): Promise<boolean> {
  const paymentMethodText = data.paymentMethod === 'card' 
    ? `Card ending in ${data.lastFour}` 
    : `Bank account ending in ${data.lastFour}`;

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #16a34a;">Payment Successful</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your payment to ${data.organizationName} has been processed successfully.</p>
      
      <div class="details">
        <table>
          <tr>
            <td><strong>Amount Paid</strong></td>
            <td style="text-align: right;"><span class="amount">${data.amount}</span></td>
          </tr>
          <tr>
            <td>Payment Method</td>
            <td style="text-align: right;">${paymentMethodText}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td style="text-align: right;">${data.date}</td>
          </tr>
          <tr>
            <td>Transaction ID</td>
            <td style="text-align: right; font-family: monospace;">${data.transactionId}</td>
          </tr>
        </table>
      </div>
      
      ${data.items && data.items.length > 0 ? `
        <h3>Items</h3>
        <div class="details">
          <table>
            ${data.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">${item.amount}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}
      
      <p style="font-size: 14px; color: #666;">
        This is your receipt. Keep it for your records.
      </p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject: `Payment receipt from ${data.organizationName} - ${data.amount}`,
    html,
    replyTo: data.organizationEmail,
  });
}

// ============================================
// PAYMENT NOTIFICATION - MERCHANT
// ============================================

interface MerchantPaymentNotificationData {
  merchantEmail: string;
  customerName: string;
  customerEmail: string;
  amount: string;
  netAmount: string;
  fee: string;
  paymentMethod: 'card' | 'bank';
  lastFour: string;
  transactionId: string;
  date: string;
  organizationName: string;
  source?: string; // invoice, payment_link, portal
}

export async function sendMerchantPaymentNotification(data: MerchantPaymentNotificationData): Promise<boolean> {
  const paymentMethodText = data.paymentMethod === 'card' 
    ? `Card ending in ${data.lastFour}` 
    : `Bank account ending in ${data.lastFour}`;

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">LunarPay</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #16a34a;">New Payment Received</h2>
      <p>You've received a new payment for ${data.organizationName}.</p>
      
      <div class="details">
        <table>
          <tr>
            <td><strong>Amount</strong></td>
            <td style="text-align: right;"><span class="amount">${data.amount}</span></td>
          </tr>
          <tr>
            <td>Processing Fee</td>
            <td style="text-align: right;">- ${data.fee}</td>
          </tr>
          <tr style="border-top: 2px solid #ddd;">
            <td><strong>Net Amount</strong></td>
            <td style="text-align: right;"><strong>${data.netAmount}</strong></td>
          </tr>
        </table>
      </div>
      
      <h3>Customer Details</h3>
      <div class="details">
        <table>
          <tr>
            <td>Name</td>
            <td style="text-align: right;">${data.customerName}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td style="text-align: right;">${data.customerEmail}</td>
          </tr>
          <tr>
            <td>Payment Method</td>
            <td style="text-align: right;">${paymentMethodText}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td style="text-align: right;">${data.date}</td>
          </tr>
          ${data.source ? `<tr><td>Source</td><td style="text-align: right;">${data.source}</td></tr>` : ''}
          <tr>
            <td>Transaction ID</td>
            <td style="text-align: right; font-family: monospace; font-size: 12px;">${data.transactionId}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/transactions" class="button">View in Dashboard</a>
      </div>
    </div>
  `);

  return sendEmail({
    to: data.merchantEmail,
    subject: `💰 Payment received: ${data.amount} from ${data.customerName}`,
    html,
  });
}

// ============================================
// USER REGISTRATION / WELCOME EMAIL
// ============================================

export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<boolean> {
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">LunarPay</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Welcome to LunarPay!</h2>
      <p>Hi ${firstName},</p>
      <p>Your account has been created successfully. You're all set to start accepting payments.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/dashboard" class="button">Go to Dashboard</a>
      </div>
      
      <h3>Getting Started</h3>
      <ul>
        <li>Set up your organization details</li>
        <li>Add your products or services</li>
        <li>Create your first invoice or payment link</li>
        <li>Customize your branding</li>
      </ul>
      
      <p>Need help? Reply to this email and we'll be happy to assist.</p>
    </div>
  `);

  return sendEmail({
    to,
    subject: 'Welcome to LunarPay! 🚀',
    html,
  });
}

// ============================================
// PASSWORD RESET
// ============================================

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">LunarPay</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
      
      <p style="font-size: 12px; color: #999;">
        If the button doesn't work, copy and paste this URL into your browser:<br>
        <span style="word-break: break-all;">${resetUrl}</span>
      </p>
    </div>
  `);

  return sendEmail({
    to,
    subject: 'Reset your LunarPay password',
    html,
  });
}

// ============================================
// SUBSCRIPTION CONFIRMATION
// ============================================

interface SubscriptionConfirmationData {
  customerName: string;
  customerEmail: string;
  amount: string;
  frequency: string;
  nextPaymentDate: string;
  organizationName: string;
  organizationEmail?: string;
  productName?: string;
  trialDays?: number;
  brandColor?: string;
}

export async function sendSubscriptionConfirmation(data: SubscriptionConfirmationData): Promise<boolean> {
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #16a34a;">Subscription Confirmed</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your subscription ${data.productName ? `to ${data.productName} ` : ''}with ${data.organizationName} is now active.</p>
      
      ${data.trialDays ? `
        <div style="background: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #16a34a;"><strong>🎉 Free Trial Active</strong></p>
          <p style="margin: 5px 0 0 0;">Your ${data.trialDays}-day free trial has started. You won't be charged until it ends.</p>
        </div>
      ` : ''}
      
      <div class="details">
        <table>
          <tr>
            <td><strong>Amount</strong></td>
            <td style="text-align: right;"><span class="amount">${data.amount}</span></td>
          </tr>
          <tr>
            <td>Billing Frequency</td>
            <td style="text-align: right;">${data.frequency}</td>
          </tr>
          <tr>
            <td>Next Payment</td>
            <td style="text-align: right;">${data.nextPaymentDate}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        You can manage your subscription at any time from your customer portal.
      </p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject: `Subscription confirmed with ${data.organizationName}`,
    html,
    replyTo: data.organizationEmail,
  });
}

// ============================================
// SUBSCRIPTION CANCELLED
// ============================================

export async function sendSubscriptionCancelledEmail(
  customerEmail: string,
  customerName: string,
  organizationName: string,
  organizationEmail?: string,
  brandColor?: string
): Promise<boolean> {
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Subscription Cancelled</h2>
      <p>Hi ${customerName},</p>
      <p>Your subscription with ${organizationName} has been cancelled as requested.</p>
      <p>You will not be charged again. If you change your mind, you can always subscribe again from our website or customer portal.</p>
      <p>Thank you for being a customer!</p>
    </div>
  `, brandColor);

  return sendEmail({
    to: customerEmail,
    subject: `Subscription cancelled - ${organizationName}`,
    html,
    replyTo: organizationEmail,
  });
}

// ============================================
// PAYMENT FAILED NOTIFICATION
// ============================================

interface PaymentFailedData {
  customerEmail: string;
  customerName: string;
  amount: string;
  reason: string;
  retryDate?: string;
  updatePaymentUrl: string;
  organizationName: string;
  organizationEmail?: string;
  brandColor?: string;
}

export async function sendPaymentFailedEmail(data: PaymentFailedData): Promise<boolean> {
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #dc2626;">Payment Failed</h2>
      <p>Hi ${data.customerName},</p>
      <p>We were unable to process your payment of <strong>${data.amount}</strong> to ${data.organizationName}.</p>
      
      <div class="details">
        <table>
          <tr>
            <td>Amount</td>
            <td style="text-align: right;">${data.amount}</td>
          </tr>
          <tr>
            <td>Reason</td>
            <td style="text-align: right; color: #dc2626;">${data.reason}</td>
          </tr>
          ${data.retryDate ? `<tr><td>Next Retry</td><td style="text-align: right;">${data.retryDate}</td></tr>` : ''}
        </table>
      </div>
      
      <p>Please update your payment method to avoid service interruption:</p>
      
      <div style="text-align: center;">
        <a href="${data.updatePaymentUrl}" class="button">Update Payment Method</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        Questions? Contact ${data.organizationName}${data.organizationEmail ? ` at ${data.organizationEmail}` : ''}.
      </p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject: `Action required: Payment failed - ${data.organizationName}`,
    html,
    replyTo: data.organizationEmail,
  });
}
