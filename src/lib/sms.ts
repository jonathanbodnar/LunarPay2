// SMS notification system using Twilio

interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS(options: SMSOptions) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: options.to,
          From: fromNumber,
          Body: options.message,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        messageId: data.sid,
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.message,
      };
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Send transaction receipt via SMS
export async function sendTransactionReceiptSMS(
  phone: string,
  amount: number,
  reference: string
) {
  const message = `Thank you for your payment of $${amount.toFixed(2)}! Receipt #${reference}. Questions? Reply to this message.`;
  return await sendSMS({ to: phone, message });
}

// Send invoice reminder via SMS
export async function sendInvoiceReminderSMS(
  phone: string,
  amount: number,
  invoiceUrl: string
) {
  const message = `Reminder: You have an invoice for $${amount.toFixed(2)}. Pay now: ${invoiceUrl}`;
  return await sendSMS({ to: phone, message });
}

// Send subscription reminder via SMS
export async function sendSubscriptionReminderSMS(
  phone: string,
  amount: number,
  nextDate: string
) {
  const message = `Your subscription of $${amount.toFixed(2)} will renew on ${nextDate}.`;
  return await sendSMS({ to: phone, message });
}

