/**
 * Webhook utility for sending payment notifications to external systems
 */

interface WebhookPayload {
  event: 'payment.completed' | 'payment.failed' | 'subscription.created';
  payment_link_id: number;
  payment_link_name: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  payment: {
    amount: number;
    currency: string;
    method: string;
    transaction_id: string;
  };
  products: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Send a webhook notification to the configured URL
 */
export async function sendWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LunarPay-Webhook/1.0',
        'X-LunarPay-Event': payload.event,
        'X-LunarPay-Timestamp': payload.timestamp,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook failed: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    console.log(`Webhook sent successfully to ${webhookUrl}`);
    return { success: true, statusCode: response.status };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create a payment completed webhook payload
 */
export function createPaymentWebhookPayload(
  paymentLinkId: number,
  paymentLinkName: string,
  customer: { email: string; name: string; phone?: string },
  payment: { amount: number; method: string; transactionId: string },
  products: Array<{ name: string; qty: number; price: number }>,
  metadata?: Record<string, any>
): WebhookPayload {
  return {
    event: 'payment.completed',
    payment_link_id: paymentLinkId,
    payment_link_name: paymentLinkName,
    customer,
    payment: {
      amount: payment.amount,
      currency: 'USD',
      method: payment.method,
      transaction_id: payment.transactionId,
    },
    products,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

/**
 * Queue a webhook for async processing (for production use)
 * This is a simple implementation - in production you'd use a proper queue
 */
export async function queueWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<void> {
  // For now, just send it directly
  // In production, this would add to a queue (Redis, SQS, etc.)
  // for retry handling and async processing
  
  // Fire and forget - don't wait for response
  sendWebhook(webhookUrl, payload).catch((error) => {
    console.error('Queued webhook failed:', error);
  });
}

