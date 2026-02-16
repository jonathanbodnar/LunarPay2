import sgMail from '@sendgrid/mail';
import { prisma } from '@/lib/prisma';

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

// ============================================
// CUSTOM TEMPLATE SUPPORT
// ============================================

interface CustomTemplate {
  subject?: string | null;
  heading?: string | null;
  bodyText?: string | null;
  buttonText?: string | null;
  footerText?: string | null;
  isActive: boolean;
}

async function getCustomTemplate(organizationId: number, templateType: string): Promise<CustomTemplate | null> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: {
        organizationId_templateType: {
          organizationId,
          templateType,
        },
      },
    });
    return template;
  } catch (error) {
    console.error('[EMAIL] Failed to fetch custom template:', error);
    return null;
  }
}

function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[EMAIL] SendGrid not configured, skipping email:', options.subject);
    console.log('[EMAIL] Would send to:', options.to);
    return false;
  }

  try {
    console.log('[EMAIL] Sending email to:', options.to, 'from:', FROM_EMAIL, 'subject:', options.subject);
    
    const result = await sgMail.send({
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

    console.log('[EMAIL] Sent successfully to:', options.to, 'status:', result[0]?.statusCode);
    return true;
  } catch (error: unknown) {
    console.error('[EMAIL] Failed to send to:', options.to);
    console.error('[EMAIL] Error:', error);
    
    // Log more details if it's a SendGrid error
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as { response?: { body?: unknown } };
      console.error('[EMAIL] SendGrid response body:', JSON.stringify(sgError.response?.body, null, 2));
    }
    
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
  brandColor?: string,
  organizationId?: number
): Promise<boolean> {
  const variables = {
    organization: organizationName,
    code: code,
    customer_name: to.split('@')[0], // Basic fallback
  };

  // Check for custom template
  let subject = `Your ${organizationName} verification code: ${code}`;
  let heading = 'Your Verification Code';
  let bodyText = 'Use this code to sign in to your customer portal:';
  let footerText = 'This code expires in 10 minutes. If you didn\'t request this code, you can safely ignore this email.';

  if (organizationId) {
    const customTemplate = await getCustomTemplate(organizationId, 'portal_login');
    if (customTemplate && customTemplate.isActive) {
      if (customTemplate.subject) subject = replaceVariables(customTemplate.subject, variables);
      if (customTemplate.heading) heading = replaceVariables(customTemplate.heading, variables);
      if (customTemplate.bodyText) bodyText = replaceVariables(customTemplate.bodyText, variables);
      if (customTemplate.footerText) footerText = replaceVariables(customTemplate.footerText, variables);
    } else if (customTemplate && !customTemplate.isActive) {
      console.log('[EMAIL] Portal login template disabled, skipping email');
      return false;
    }
  }

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">${heading}</h2>
      <p>${bodyText}</p>
      <div class="code">${code}</div>
      <p style="color: #666; font-size: 14px;">${footerText}</p>
    </div>
  `, brandColor);

  return sendEmail({
    to,
    subject,
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
  organizationId?: number;
  memo?: string;
  brandColor?: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
  const variables = {
    organization: data.organizationName,
    customer_name: data.customerName,
    invoice_number: data.invoiceNumber,
    amount: data.totalAmount,
    due_date: data.dueDate || 'N/A',
  };

  // Default values
  let subject = `Invoice ${data.invoiceNumber} from ${data.organizationName} - ${data.totalAmount}`;
  let heading = `Invoice ${data.invoiceNumber}`;
  let bodyText = `You have a new invoice from ${data.organizationName}.`;
  let buttonText = 'View & Pay Invoice';
  let footerText = '';

  // Check for custom template
  if (data.organizationId) {
    const customTemplate = await getCustomTemplate(data.organizationId, 'invoice');
    if (customTemplate && customTemplate.isActive) {
      if (customTemplate.subject) subject = replaceVariables(customTemplate.subject, variables);
      if (customTemplate.heading) heading = replaceVariables(customTemplate.heading, variables);
      if (customTemplate.bodyText) bodyText = replaceVariables(customTemplate.bodyText, variables);
      if (customTemplate.buttonText) buttonText = replaceVariables(customTemplate.buttonText, variables);
      if (customTemplate.footerText) footerText = replaceVariables(customTemplate.footerText, variables);
    } else if (customTemplate && !customTemplate.isActive) {
      console.log('[EMAIL] Invoice template disabled, skipping email');
      return false;
    }
  }

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">${heading}</h2>
      <p>Hi ${data.customerName},</p>
      <p>${bodyText}</p>
      
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
        <a href="${data.invoiceUrl}" class="button">${buttonText}</a>
      </div>
      
      ${footerText ? `<p style="font-size: 14px; color: #666;">${footerText}</p>` : ''}
      
      <p style="font-size: 14px; color: #666;">
        Questions? Contact ${data.organizationName}${data.organizationEmail ? ` at ${data.organizationEmail}` : ''}.
      </p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject,
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
  organizationId?: number;
  items?: Array<{ name: string; amount: string }>;
  brandColor?: string;
}

export async function sendPaymentConfirmation(data: PaymentConfirmationData): Promise<boolean> {
  const paymentMethodText = data.paymentMethod === 'card' 
    ? `Card ending in ${data.lastFour}` 
    : `Bank account ending in ${data.lastFour}`;

  const variables = {
    organization: data.organizationName,
    customer_name: data.customerName,
    amount: data.amount,
    date: data.date,
    payment_method: paymentMethodText,
  };

  // Default values
  let subject = `Payment receipt from ${data.organizationName} - ${data.amount}`;
  let heading = 'Payment Successful';
  let bodyText = `Your payment to ${data.organizationName} has been processed successfully.`;
  let footerText = 'This is your receipt. Keep it for your records.';

  // Check for custom template
  if (data.organizationId) {
    const customTemplate = await getCustomTemplate(data.organizationId, 'payment_confirmation');
    if (customTemplate && customTemplate.isActive) {
      if (customTemplate.subject) subject = replaceVariables(customTemplate.subject, variables);
      if (customTemplate.heading) heading = replaceVariables(customTemplate.heading, variables);
      if (customTemplate.bodyText) bodyText = replaceVariables(customTemplate.bodyText, variables);
      if (customTemplate.footerText) footerText = replaceVariables(customTemplate.footerText, variables);
    } else if (customTemplate && !customTemplate.isActive) {
      console.log('[EMAIL] Payment confirmation template disabled, skipping email');
      return false;
    }
  }

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #16a34a;">${heading}</h2>
      <p>Hi ${data.customerName},</p>
      <p>${bodyText}</p>
      
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
      
      <p style="font-size: 14px; color: #666;">${footerText}</p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject,
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
        <a href="${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/transactions" class="button">View in Dashboard</a>
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
        <a href="${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/dashboard" class="button">Go to Dashboard</a>
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
  organizationId?: number;
  productName?: string;
  trialDays?: number;
  brandColor?: string;
}

export async function sendSubscriptionConfirmation(data: SubscriptionConfirmationData): Promise<boolean> {
  const variables = {
    organization: data.organizationName,
    customer_name: data.customerName,
    amount: data.amount,
    frequency: data.frequency,
    next_payment_date: data.nextPaymentDate,
  };

  // Default values
  let subject = `Subscription confirmed with ${data.organizationName}`;
  let heading = 'Subscription Confirmed';
  let bodyText = `Your subscription ${data.productName ? `to ${data.productName} ` : ''}with ${data.organizationName} is now active.`;
  let footerText = 'You can manage your subscription at any time from your customer portal.';

  // Check for custom template
  if (data.organizationId) {
    const customTemplate = await getCustomTemplate(data.organizationId, 'subscription_confirmation');
    if (customTemplate && customTemplate.isActive) {
      if (customTemplate.subject) subject = replaceVariables(customTemplate.subject, variables);
      if (customTemplate.heading) heading = replaceVariables(customTemplate.heading, variables);
      if (customTemplate.bodyText) bodyText = replaceVariables(customTemplate.bodyText, variables);
      if (customTemplate.footerText) footerText = replaceVariables(customTemplate.footerText, variables);
    } else if (customTemplate && !customTemplate.isActive) {
      console.log('[EMAIL] Subscription confirmation template disabled, skipping email');
      return false;
    }
  }

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #16a34a;">${heading}</h2>
      <p>Hi ${data.customerName},</p>
      <p>${bodyText}</p>
      
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
      
      <p style="font-size: 14px; color: #666;">${footerText}</p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject,
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
  brandColor?: string,
  organizationId?: number
): Promise<boolean> {
  const variables = {
    organization: organizationName,
    customer_name: customerName,
  };

  // Default values
  let subject = `Subscription cancelled - ${organizationName}`;
  let heading = 'Subscription Cancelled';
  let bodyText = `Your subscription with ${organizationName} has been cancelled as requested. You will not be charged again. If you change your mind, you can always subscribe again from our website or customer portal.`;
  let footerText = 'Thank you for being a customer!';

  // Check for custom template
  if (organizationId) {
    const customTemplate = await getCustomTemplate(organizationId, 'subscription_cancelled');
    if (customTemplate && customTemplate.isActive) {
      if (customTemplate.subject) subject = replaceVariables(customTemplate.subject, variables);
      if (customTemplate.heading) heading = replaceVariables(customTemplate.heading, variables);
      if (customTemplate.bodyText) bodyText = replaceVariables(customTemplate.bodyText, variables);
      if (customTemplate.footerText) footerText = replaceVariables(customTemplate.footerText, variables);
    } else if (customTemplate && !customTemplate.isActive) {
      console.log('[EMAIL] Subscription cancelled template disabled, skipping email');
      return false;
    }
  }

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">${heading}</h2>
      <p>Hi ${customerName},</p>
      <p>${bodyText}</p>
      ${footerText ? `<p>${footerText}</p>` : ''}
    </div>
  `, brandColor);

  return sendEmail({
    to: customerEmail,
    subject,
    html,
    replyTo: organizationEmail,
  });
}

// ============================================
// SUBSCRIPTION RECURRING PAYMENT RECEIPT
// ============================================

interface SubscriptionRecurringPaymentData {
  customerName: string;
  customerEmail: string;
  amount: number;
  fee?: number;
  organizationName: string;
  frequency: string;
  nextPaymentDate: string;
  transactionId: string;
  organizationEmail?: string;
  organizationId?: number;
  brandColor?: string;
}

export async function sendSubscriptionRecurringPaymentReceipt(data: SubscriptionRecurringPaymentData): Promise<boolean> {
  const formatFrequency = (freq: string) => {
    const map: Record<string, string> = {
      'W': 'Weekly',
      'M': 'Monthly',
      'Q': 'Quarterly',
      'Y': 'Yearly',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'yearly': 'Yearly',
    };
    return map[freq] || freq;
  };

  const totalAmount = data.fee ? data.amount + data.fee : data.amount;
  
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #16a34a;">✓ Payment Successful</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your recurring ${formatFrequency(data.frequency).toLowerCase()} payment to ${data.organizationName} has been processed successfully.</p>
      
      <div class="details">
        <table>
          <tr>
            <td><strong>Amount</strong></td>
            <td style="text-align: right;"><span class="amount">$${data.amount.toFixed(2)}</span></td>
          </tr>
          ${data.fee ? `
          <tr>
            <td>Processing Fee (covered by you)</td>
            <td style="text-align: right;">$${data.fee.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>Total Charged</strong></td>
            <td style="text-align: right;"><strong>$${totalAmount.toFixed(2)}</strong></td>
          </tr>
          ` : ''}
          <tr>
            <td>Transaction ID</td>
            <td style="text-align: right;">${data.transactionId}</td>
          </tr>
          <tr>
            <td>Billing Frequency</td>
            <td style="text-align: right;">${formatFrequency(data.frequency)}</td>
          </tr>
          <tr>
            <td>Next Payment</td>
            <td style="text-align: right;">${data.nextPaymentDate}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        This is an automated recurring payment. You can manage or cancel your subscription at any time from your customer portal.
      </p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject: `Payment receipt - ${data.organizationName}`,
    html,
    replyTo: data.organizationEmail,
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
  organizationId?: number;
  brandColor?: string;
}

export async function sendPaymentFailedEmail(data: PaymentFailedData): Promise<boolean> {
  const variables = {
    organization: data.organizationName,
    customer_name: data.customerName,
    amount: data.amount,
    reason: data.reason,
  };

  // Default values
  let subject = `Action required: Payment failed - ${data.organizationName}`;
  let heading = 'Payment Failed';
  let bodyText = `We were unable to process your payment of ${data.amount} to ${data.organizationName}.`;
  let buttonText = 'Update Payment Method';
  let footerText = '';

  // Check for custom template
  if (data.organizationId) {
    const customTemplate = await getCustomTemplate(data.organizationId, 'payment_failed');
    if (customTemplate && customTemplate.isActive) {
      if (customTemplate.subject) subject = replaceVariables(customTemplate.subject, variables);
      if (customTemplate.heading) heading = replaceVariables(customTemplate.heading, variables);
      if (customTemplate.bodyText) bodyText = replaceVariables(customTemplate.bodyText, variables);
      if (customTemplate.buttonText) buttonText = replaceVariables(customTemplate.buttonText, variables);
      if (customTemplate.footerText) footerText = replaceVariables(customTemplate.footerText, variables);
    } else if (customTemplate && !customTemplate.isActive) {
      console.log('[EMAIL] Payment failed template disabled, skipping email');
      return false;
    }
  }

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">${data.organizationName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #dc2626;">${heading}</h2>
      <p>Hi ${data.customerName},</p>
      <p>${bodyText}</p>
      
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
        <a href="${data.updatePaymentUrl}" class="button">${buttonText}</a>
      </div>
      
      ${footerText ? `<p style="font-size: 14px; color: #666;">${footerText}</p>` : ''}
      
      <p style="font-size: 14px; color: #666;">
        Questions? Contact ${data.organizationName}${data.organizationEmail ? ` at ${data.organizationEmail}` : ''}.
      </p>
    </div>
  `, data.brandColor);

  return sendEmail({
    to: data.customerEmail,
    subject,
    html,
    replyTo: data.organizationEmail,
  });
}

// ============================================
// TEAM INVITE
// ============================================

interface TeamInviteEmailData {
  to: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}

export async function sendTeamInviteEmail(data: TeamInviteEmailData): Promise<boolean> {
  const roleText = data.role === 'admin' ? 'an Admin' : 'a Team Member';
  
  const html = baseTemplate(`
    <div class="header">
      <div class="logo">LunarPay</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">You're Invited!</h2>
      <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on LunarPay as ${roleText}.</p>
      
      <div class="details">
        <table>
          <tr>
            <td>Organization</td>
            <td style="text-align: right;"><strong>${data.organizationName}</strong></td>
          </tr>
          <tr>
            <td>Your Role</td>
            <td style="text-align: right;">${data.role === 'admin' ? 'Admin' : 'Team Member'}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
      </p>
      
      <p style="font-size: 12px; color: #999;">
        If the button doesn't work, copy and paste this URL into your browser:<br>
        <span style="word-break: break-all;">${data.inviteUrl}</span>
      </p>
    </div>
  `);

  return sendEmail({
    to: data.to,
    subject: `You're invited to join ${data.organizationName} on LunarPay`,
    html,
  });
}

// ============================================
// NEW SUPPORT TICKET NOTIFICATION
// ============================================

interface NewTicketNotificationData {
  ticketNumber: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  userName: string;
  userEmail: string;
  organizationName: string;
}

export async function sendNewTicketNotification(data: NewTicketNotificationData): Promise<boolean> {
  const priorityColors: Record<string, string> = {
    low: '#28a745',
    normal: '#17a2b8',
    high: '#fd7e14',
    urgent: '#dc3545',
  };

  const priorityColor = priorityColors[data.priority] || '#17a2b8';
  const adminUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/admin/tickets`;

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">LunarPay Support</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">New Support Ticket</h2>
      <p>A new support ticket has been submitted and requires attention.</p>
      
      <div class="details">
        <table>
          <tr>
            <td>Ticket Number</td>
            <td style="text-align: right;"><strong>${data.ticketNumber}</strong></td>
          </tr>
          <tr>
            <td>Subject</td>
            <td style="text-align: right;"><strong>${data.subject}</strong></td>
          </tr>
          <tr>
            <td>Category</td>
            <td style="text-align: right;">${data.category}</td>
          </tr>
          <tr>
            <td>Priority</td>
            <td style="text-align: right;"><span style="background: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${data.priority.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td>From</td>
            <td style="text-align: right;">${data.userName} (${data.userEmail})</td>
          </tr>
          <tr>
            <td>Organization</td>
            <td style="text-align: right;">${data.organizationName}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="font-weight: 600; margin: 0 0 10px 0;">Message:</p>
        <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${adminUrl}" class="button">View in Admin Panel</a>
      </div>
    </div>
  `);

  return sendEmail({
    to: 'jb@lunarpay.com',
    subject: `[${data.ticketNumber}] New Support Ticket: ${data.subject}`,
    html,
  });
}

// ============================================
// TICKET CONFIRMATION EMAIL (to user)
// ============================================

interface TicketConfirmationData {
  ticketNumber: string;
  subject: string;
  customerName: string;
  customerEmail: string;
}

export async function sendTicketConfirmation(data: TicketConfirmationData): Promise<boolean> {
  const ticketUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/help-desk`;

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">LunarPay Support</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">We've Got Your Request!</h2>
      <p>Hi ${data.customerName},</p>
      <p>Thank you for contacting LunarPay support. We've received your support ticket and our team is reviewing it now.</p>
      
      <div class="details">
        <table>
          <tr>
            <td>Ticket Number</td>
            <td style="text-align: right;"><strong>${data.ticketNumber}</strong></td>
          </tr>
          <tr>
            <td>Subject</td>
            <td style="text-align: right;">${data.subject}</td>
          </tr>
        </table>
      </div>
      
      <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        💡 <strong>What's next?</strong><br>
        Our support team will review your request and respond as soon as possible. You'll receive an email when we reply.
      </p>
      
      <div style="text-align: center;">
        <a href="${ticketUrl}" class="button">View Your Tickets</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        You can view the status of your ticket and reply to our team anytime in the Help Desk section of your dashboard.
      </p>
    </div>
  `);

  return sendEmail({
    to: data.customerEmail,
    subject: `[${data.ticketNumber}] We've received your support request`,
    html,
  });
}

// ============================================
// ADMIN REPLY NOTIFICATION EMAIL (to user)
// ============================================

interface AdminReplyNotificationData {
  ticketNumber: string;
  subject: string;
  replyMessage: string;
  customerName: string;
  customerEmail: string;
}

export async function sendAdminReplyNotification(data: AdminReplyNotificationData): Promise<boolean> {
  const ticketUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/help-desk`;

  // Truncate message if too long
  const messagePreview = data.replyMessage.length > 200 
    ? data.replyMessage.substring(0, 200) + '...' 
    : data.replyMessage;

  const html = baseTemplate(`
    <div class="header">
      <div class="logo">LunarPay Support</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">You Have a New Reply!</h2>
      <p>Hi ${data.customerName},</p>
      <p>Our support team has replied to your ticket:</p>
      
      <div class="details">
        <table>
          <tr>
            <td>Ticket Number</td>
            <td style="text-align: right;"><strong>${data.ticketNumber}</strong></td>
          </tr>
          <tr>
            <td>Subject</td>
            <td style="text-align: right;">${data.subject}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
        <p style="margin: 0; font-weight: 600; color: #007bff; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">
          Support Team Response
        </p>
        <p style="margin: 0; white-space: pre-wrap;">${messagePreview}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${ticketUrl}" class="button">View Full Response</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        You can continue the conversation by replying in your Help Desk.
      </p>
    </div>
  `);

  return sendEmail({
    to: data.customerEmail,
    subject: `[${data.ticketNumber}] New reply from LunarPay Support`,
    html,
  });
}

// ============================================
// ONBOARDING DRIP EMAIL SEQUENCE
// ============================================

interface OnboardingEmailData {
  to: string;
  firstName: string;
}

const onboardingEmailTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<meta name="x-apple-disable-message-reformatting">` : ''}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; background: #f9fafb; }
    .preheader { display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f9fafb; }
    .container { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .content { background: #ffffff; border-radius: 8px; padding: 40px; }
    .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
    p { margin: 0 0 16px 0; }
    ul { margin: 16px 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
    strong { color: #111; }
    h2 { margin: 0 0 20px 0; color: #111; font-size: 22px; }
    .signature { margin-top: 32px; color: #666; }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="container">
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} LunarPay. All rights reserved.</p>
      <p style="margin-top: 8px;">Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// EMAIL 1: Welcome (Sent ~1 hour after registration)
export async function sendOnboardingEmail1(data: OnboardingEmailData): Promise<boolean> {
  const onboardingUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/settings/payment-setup`;

  const html = onboardingEmailTemplate(`
    <h2>Welcome to LunarPay.</h2>
    
    <p>Before you finish setup, there's something important you need to know.</p>
    
    <p><strong>LunarPay does payments differently—on purpose.</strong></p>
    
    <p>Most processors let you:</p>
    <ul>
      <li>Start accepting payments instantly</li>
      <li>Build revenue</li>
      <li>Then quietly run underwriting later</li>
    </ul>
    
    <p>If that review fails, they don't warn you.<br>
    They shut you down.</p>
    
    <p>We've lived that scenario. That's why LunarPay works in reverse.</p>
    
    <p><strong>We underwrite first.</strong></p>
    
    <p>That means <em>before</em> you accept your first $1:</p>
    <ul>
      <li>Your business is reviewed</li>
      <li>Your risk profile is approved</li>
      <li>Your account is protected</li>
    </ul>
    
    <p>So you don't wake up to frozen funds or a terminated account after you've already built momentum.</p>
    
    <p>It takes a little more intention upfront.<br>
    But it ensures you're safe <em>before</em> you scale.</p>
    
    <p>👉 <strong>Get approved first</strong></p>
    
    <div style="text-align: center;">
      <a href="${onboardingUrl}" class="button">Start Secure Onboarding</a>
    </div>
    
    <p class="signature">— Jonathan</p>
  `, 'There\'s something important you need to know about your payments.');

  return sendEmail({
    to: data.to,
    subject: 'Welcome to LunarPay.',
    html,
  });
}

// EMAIL 2: 24 Hours - The Story
export async function sendOnboardingEmail2(data: OnboardingEmailData): Promise<boolean> {
  const onboardingUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/settings/payment-setup`;

  const html = onboardingEmailTemplate(`
    <p>I remember the day like it was yesterday.</p>
    
    <p>I was standing in my kitchen when the notification came through.</p>
    
    <p>It might as well have said:</p>
    
    <p><strong>"This is the last day of your business."</strong></p>
    
    <p>Because that's exactly what it meant.</p>
    
    <p><strong>"Your Stripe account has been terminated."</strong></p>
    
    <p>No warning.<br>
    No explanation.<br>
    No one to call.</p>
    
    <p>At the time, we had spent <strong>14 months</strong> building a marketing company to <strong>$135,000 in monthly recurring revenue</strong>.</p>
    
    <p>No venture capital.<br>
    No shortcuts.<br>
    Just blood, sweat, and long nights.</p>
    
    <p>And overnight, our cashflow disappeared.</p>
    
    <p>Cards stopped charging.<br>
    Revenue flatlined.<br>
    Payroll became a crisis.</p>
    
    <p>It took <strong>three months</strong> to move cards and resume billing—but by then, the damage was already done.</p>
    
    <p>We lost more than half our customers.<br>
    We couldn't pay our staff.<br>
    A real business collapsed because of one processor decision.</p>
    
    <p>Stripe never told us <em>why</em>.</p>
    
    <p>That moment permanently changed how I think about payments.</p>
    
    <p><strong>If you don't control your payments, you don't control your business.</strong></p>
    
    <p>That's why LunarPay exists—and why we make sure you're approved <em>before</em> you ever accept money.</p>
    
    <p>👉 <strong>Protect my payments</strong></p>
    
    <div style="text-align: center;">
      <a href="${onboardingUrl}" class="button">Finish Account Review</a>
    </div>
    
    <p class="signature">— Jonathan</p>
  `, 'I was standing in my kitchen when the notification came through.');

  return sendEmail({
    to: data.to,
    subject: 'This is the last day of your business.',
    html,
  });
}

// EMAIL 3: 72 Hours - The Explanation
export async function sendOnboardingEmail3(data: OnboardingEmailData): Promise<boolean> {
  const onboardingUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/settings/payment-setup`;

  const html = onboardingEmailTemplate(`
    <p>Here's what most payment processors don't explain.</p>
    
    <p>When they say "start accepting payments instantly,"<br>
    what they really mean is:</p>
    
    <blockquote style="border-left: 3px solid #ddd; margin: 20px 0; padding-left: 20px; color: #555; font-style: italic;">
      "We'll review you later."
    </blockquote>
    
    <p>Underwriting happens <em>after</em> you build revenue.<br>
    Risk checks happen <em>after</em> customers are on file.<br>
    Shutdowns happen when it hurts the most.</p>
    
    <p><strong>LunarPay flips that model.</strong></p>
    
    <p>We intentionally:</p>
    <ul>
      <li>Review businesses <strong>before activation</strong></li>
      <li>Work only with free-speech-aligned partners</li>
      <li>Reduce chargebacks and sudden holds</li>
      <li>Protect long-term operators, not short-term volume</li>
    </ul>
    
    <p>Yes, it's different.<br>
    Yes, it's more deliberate.</p>
    
    <p>But it means you don't build on quicksand.</p>
    
    <p>We'd rather take a little more time now<br>
    than force you to rebuild later.</p>
    
    <p>👉 <strong>Secure my account</strong></p>
    
    <div style="text-align: center;">
      <a href="${onboardingUrl}" class="button">Complete Approval</a>
    </div>
    
    <p class="signature">— Jonathan</p>
  `, 'What most payment processors don\'t tell you.');

  return sendEmail({
    to: data.to,
    subject: 'The part they don\'t tell you',
    html,
  });
}

// EMAIL 4: 2 Weeks - Re-engagement
export async function sendOnboardingEmail4(data: OnboardingEmailData): Promise<boolean> {
  const onboardingUrl = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/settings/payment-setup`;

  const html = onboardingEmailTemplate(`
    <p>Quick check-in.</p>
    
    <p>If you're still processing payments elsewhere, ask yourself one question:</p>
    
    <p><strong>Would you be okay losing your ability to charge customers tomorrow—without explanation?</strong></p>
    
    <p>Because that's the reality for most businesses today.</p>
    
    <p>LunarPay isn't for everyone.</p>
    
    <p>It's for businesses that:</p>
    <ul>
      <li>Value stability over shortcuts</li>
      <li>Care about free speech and independence</li>
      <li>Want to build something that lasts</li>
    </ul>
    
    <p>If that sounds like you, the next step is still open.</p>
    
    <p>👉 <strong>Lock in payment protection</strong></p>
    
    <div style="text-align: center;">
      <a href="${onboardingUrl}" class="button">Finish Onboarding</a>
    </div>
    
    <p>No hype.<br>
    No surprises.<br>
    Just a payment stack built for businesses that plan to be here tomorrow.</p>
    
    <p class="signature">— Jonathan</p>
  `, 'Would you be okay losing your ability to charge customers tomorrow?');

  return sendEmail({
    to: data.to,
    subject: 'Are your payments safe?',
    html,
  });
}


// ============================================
// LEAD NURTURING DRIP EMAIL SEQUENCE
// For leads who signed up but haven't registered
// ============================================

interface LeadNurturingEmailData {
  to: string;
  firstName?: string;
}

const REGISTER_URL = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com'}/register`;

const leadNurturingTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<meta name="x-apple-disable-message-reformatting">` : ''}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; background: #f9fafb; }
    .preheader { display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f9fafb; }
    .container { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .content { background: #ffffff; border-radius: 8px; padding: 40px; }
    .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
    p { margin: 0 0 16px 0; }
    ul { margin: 16px 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
    strong { color: #111; }
    h2 { margin: 0 0 20px 0; color: #111; font-size: 22px; }
    .signature { margin-top: 32px; color: #666; }
    .highlight { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 0 6px 6px 0; }
    .price { font-size: 24px; font-weight: 700; color: #111; }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="container">
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} LunarPay. All rights reserved.</p>
      <p style="margin-top: 8px;">Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// LEAD EMAIL 1: Immediate — The Hook + Pricing
export async function sendLeadNurturingEmail1(data: LeadNurturingEmailData): Promise<boolean> {
  const registerUrl = `${REGISTER_URL}?email=${encodeURIComponent(data.to)}`;

  const html = leadNurturingTemplate(`
    <h2>They shut down $135K/month overnight.</h2>

    <p>Thanks for checking out LunarPay. Before you go any further, you should know why we exist.</p>

    <p>In 2024, Stripe disabled the account for <strong>Libs of TikTok</strong> and froze their funds. No warning. No appeal. Just gone.</p>

    <p>The same year, a Senate Commerce Committee investigation revealed that payment processors have been <strong>systematically removing conservative organizations</strong> from their platforms&mdash;following playbooks written by activist groups.</p>

    <p>Gab lost <strong>80% of its subscription revenue</strong> overnight when Stripe pulled the plug. PayPal froze the Free Speech Union's accounts. Moms for Liberty had donations frozen mid-campaign.</p>

    <p><strong>This isn't a conspiracy theory. It's a business model.</strong></p>

    <p>LunarPay was built specifically so this can't happen to you.</p>

    <div class="highlight">
      <p style="margin-bottom: 8px;"><strong>Simple, transparent pricing:</strong></p>
      <p class="price" style="margin-bottom: 4px;">Starting at 2.75% + 27&cent;</p>
      <p style="margin: 0; color: #666; font-size: 14px;">No hidden fees. No surprise holds. No ideological audits.</p>
    </div>

    <p>We underwrite you <em>before</em> activation&mdash;not after you've built your revenue. That means once you're approved, <strong>you stay approved.</strong></p>

    <div style="text-align: center;">
      <a href="${registerUrl}" class="button">Create Your Free Account</a>
    </div>

    <p class="signature">&mdash; Jonathan Bodnar<br><span style="font-size: 13px;">Founder, LunarPay</span></p>
  `, 'They shut down a $135K/month business with one email. Here\'s how to make sure it never happens to you.');

  return sendEmail({
    to: data.to,
    subject: 'They froze $135K overnight. No warning.',
    html,
  });
}

// LEAD EMAIL 2: 24 hours — Jonathan's personal Stripe story
export async function sendLeadNurturingEmail2(data: LeadNurturingEmailData): Promise<boolean> {
  const registerUrl = `${REGISTER_URL}?email=${encodeURIComponent(data.to)}`;

  const html = leadNurturingTemplate(`
    <p>I need to tell you something personal.</p>

    <p>A few years ago, I built a marketing company from zero to <strong>$135,000 in monthly recurring revenue</strong>. No investors. No shortcuts. Just 14 months of grinding.</p>

    <p>Then one morning, I got a notification from Stripe:</p>

    <p><strong>"Your account has been terminated."</strong></p>

    <p>No warning.<br>
    No explanation.<br>
    No human to call.</p>

    <p>Cards stopped charging. Revenue flatlined overnight. Payroll became a crisis.</p>

    <p>It took <strong>three months</strong> to migrate cards to a new processor. By then, we'd lost more than half our customers. A real business&mdash;one that supported real families&mdash;collapsed because of one company's internal decision.</p>

    <p>Stripe never told me why.</p>

    <p>That moment changed everything for me. I realized something that should terrify every business owner:</p>

    <p><strong>If you don't control your payment processing, you don't control your business.</strong></p>

    <p>That's why I built LunarPay. Not as another payment processor&mdash;but as a <em>safe</em> one. One that reviews you first, approves you first, and doesn't pull the rug out later.</p>

    <div style="text-align: center;">
      <a href="${registerUrl}" class="button">Protect Your Revenue</a>
    </div>

    <p class="signature">&mdash; Jonathan</p>
  `, 'I lost $135K/month because of one email from Stripe.');

  return sendEmail({
    to: data.to,
    subject: 'The email that killed my business',
    html,
  });
}

// LEAD EMAIL 3: Day 3 — The deplatforming pattern (proof + fear)
export async function sendLeadNurturingEmail3(data: LeadNurturingEmailData): Promise<boolean> {
  const registerUrl = `${REGISTER_URL}?email=${encodeURIComponent(data.to)}`;

  const html = leadNurturingTemplate(`
    <p>This isn't about politics. It's about a pattern.</p>

    <p>Here's a short list of organizations that have had their payment processing <strong>shut down, frozen, or revoked</strong> in the last few years:</p>

    <ul>
      <li><strong>Libs of TikTok</strong> &mdash; Stripe disabled their account and froze funds (2024)</li>
      <li><strong>Moms for Liberty</strong> &mdash; PayPal froze donations mid-campaign (2022)</li>
      <li><strong>The Free Speech Union</strong> &mdash; PayPal closed accounts without explanation (2022)</li>
      <li><strong>Gab</strong> &mdash; Stripe pulled service; 80% revenue loss overnight (2018)</li>
      <li><strong>Gays Against Groomers</strong> &mdash; Banned from PayPal <em>and</em> Venmo within minutes (2022)</li>
      <li><strong>Indigenous Advance Ministries</strong> &mdash; Bank of America closed their account (2023)</li>
      <li><strong>Gun accessory retailers</strong> &mdash; Stripe terminated for selling legal products (2023)</li>
    </ul>

    <p>These aren't fringe organizations. They're nonprofits, media companies, and small businesses selling <em>legal products</em> to <em>willing customers</em>.</p>

    <p>The 2024 Senate Commerce Committee report confirmed what we already knew: <strong>big tech and big finance are coordinating to remove businesses they disagree with.</strong></p>

    <p>The question isn't whether this could happen to you.</p>

    <p><strong>The question is whether you'll have a backup plan when it does.</strong></p>

    <div style="text-align: center;">
      <a href="${registerUrl}" class="button">Get Approved Before You Need To</a>
    </div>

    <p class="signature">&mdash; Jonathan</p>
  `, 'Stripe, PayPal, Venmo, Bank of America — the list keeps growing.');

  return sendEmail({
    to: data.to,
    subject: 'The list of businesses they\'ve shut down',
    html,
  });
}

// LEAD EMAIL 4: Day 5 — How LunarPay is different (value + mechanism)
export async function sendLeadNurturingEmail4(data: LeadNurturingEmailData): Promise<boolean> {
  const registerUrl = `${REGISTER_URL}?email=${encodeURIComponent(data.to)}`;

  const html = leadNurturingTemplate(`
    <p>You might be wondering: "How is LunarPay actually different?"</p>

    <p>Fair question. Here's the honest answer.</p>

    <p>Most processors&mdash;Stripe, Square, PayPal&mdash;use a model called <strong>"instant onboarding."</strong> Sounds great, right?</p>

    <p>Here's what it actually means:</p>

    <ol style="margin: 16px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">They let you start processing immediately</li>
      <li style="margin-bottom: 8px;">You build up revenue and customers</li>
      <li style="margin-bottom: 8px;">They run underwriting <em>later</em>&mdash;quietly, in the background</li>
      <li style="margin-bottom: 8px;">If you fail their review, they terminate you without warning</li>
    </ol>

    <p>By the time they shut you down, you're dependent. Your customers' cards are on file. Your recurring billing is running. Your payroll depends on it.</p>

    <p><strong>LunarPay flips this model completely.</strong></p>

    <p>We underwrite you <em>first</em>. Before your first dollar. That means:</p>

    <ul>
      <li><strong>No surprise shutdowns</strong> &mdash; you're pre-approved</li>
      <li><strong>No ideological audits</strong> &mdash; we work with free-speech-aligned partners</li>
      <li><strong>No frozen funds</strong> &mdash; your money is your money</li>
      <li><strong>No mystery "risk reviews"</strong> &mdash; if there's ever an issue, we talk to you first</li>
    </ul>

    <p>Yes, it takes a few extra minutes upfront. But you'll never wake up to a "your account has been terminated" email.</p>

    <p>That's the trade-off. And we think it's worth it.</p>

    <div style="text-align: center;">
      <a href="${registerUrl}" class="button">Start Your Application</a>
    </div>

    <p class="signature">&mdash; Jonathan</p>
  `, 'Most processors let you in fast so they can kick you out quietly.');

  return sendEmail({
    to: data.to,
    subject: 'Why "instant approval" is a trap',
    html,
  });
}

// LEAD EMAIL 5: Day 8 — Social proof + urgency
export async function sendLeadNurturingEmail5(data: LeadNurturingEmailData): Promise<boolean> {
  const registerUrl = `${REGISTER_URL}?email=${encodeURIComponent(data.to)}`;

  const html = leadNurturingTemplate(`
    <p>Quick question:</p>

    <p><strong>If your payment processor shut you down tomorrow&mdash;no warning, no explanation&mdash;how long would it take you to recover?</strong></p>

    <p>For most businesses, the answer is devastating:</p>

    <ul>
      <li>2&ndash;4 weeks to find a new processor willing to take you</li>
      <li>1&ndash;3 months to migrate saved cards (if you even can)</li>
      <li>30&ndash;60% customer churn during the transition</li>
      <li>Payroll missed, vendors unpaid, momentum destroyed</li>
    </ul>

    <p>I know because I lived it. $135K/month to near-zero in one notification.</p>

    <p>The businesses that survive aren't the ones who react fastest.<br>
    <strong>They're the ones who planned ahead.</strong></p>

    <p>LunarPay takes minutes to apply. The approval process is straightforward. And once you're in, you're in&mdash;no second-guessing, no political litmus tests, no silent reviews.</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>It costs nothing to apply.</strong> Your account is free until you start processing. There's literally no reason not to have a backup plan.</p>
    </div>

    <div style="text-align: center;">
      <a href="${registerUrl}" class="button">Secure Your Backup Plan</a>
    </div>

    <p class="signature">&mdash; Jonathan</p>
  `, 'If they shut you down tomorrow, how long until you recover?');

  return sendEmail({
    to: data.to,
    subject: 'What\'s your backup plan?',
    html,
  });
}

// LEAD EMAIL 6: Day 12 — Final push / breakup email
export async function sendLeadNurturingEmail6(data: LeadNurturingEmailData): Promise<boolean> {
  const registerUrl = `${REGISTER_URL}?email=${encodeURIComponent(data.to)}`;

  const html = leadNurturingTemplate(`
    <p>I'll keep this short.</p>

    <p>You signed up because something about LunarPay caught your attention. Maybe you've been burned before. Maybe you're worried about the future. Maybe you just want options.</p>

    <p>Whatever the reason&mdash;<strong>the window to act is always before you need to.</strong></p>

    <p>Every business I've talked to that got deplatformed says the same thing:</p>

    <blockquote style="border-left: 3px solid #ddd; margin: 20px 0; padding-left: 20px; color: #555; font-style: italic;">
      "I thought it would never happen to me."
    </blockquote>

    <p>The American Family Association thought that. So did Libs of TikTok. So did I, when Stripe killed my company overnight.</p>

    <p>I'm not going to email you again after this. But I want to leave you with one thought:</p>

    <p><strong>The best time to fireproof your business is before the fire.</strong></p>

    <p>LunarPay is here when you're ready. No pressure. No gimmicks. Just payment processing that won't cancel you.</p>

    <div style="text-align: center;">
      <a href="${registerUrl}" class="button">Finish Registration</a>
    </div>

    <p class="signature">&mdash; Jonathan Bodnar<br><span style="font-size: 13px;">Founder, LunarPay</span></p>
  `, 'This is my last email. But I want to leave you with one thought.');

  return sendEmail({
    to: data.to,
    subject: 'I thought it would never happen to me.',
    html,
  });
}
