// Zapier Integration - Webhook Triggers and Actions
import { prisma } from '@/lib/prisma';

// Trigger types that Zapier can subscribe to
export type ZapierTrigger = 
  | 'new_customer'
  | 'new_invoice'
  | 'invoice_paid'
  | 'new_transaction'
  | 'new_subscription'
  | 'subscription_cancelled'
  | 'subscription_failed'
  | 'payment_failed';

export const ZAPIER_TRIGGERS = [
  { id: 'new_customer', name: 'New Customer', description: 'Triggers when a new customer is created' },
  { id: 'new_invoice', name: 'New Invoice', description: 'Triggers when a new invoice is created' },
  { id: 'invoice_paid', name: 'Invoice Paid', description: 'Triggers when an invoice is marked as paid' },
  { id: 'new_transaction', name: 'New Transaction', description: 'Triggers when a payment is processed' },
  { id: 'new_subscription', name: 'New Subscription', description: 'Triggers when a new subscription is created' },
  { id: 'subscription_cancelled', name: 'Subscription Cancelled', description: 'Triggers when a subscription is cancelled' },
  { id: 'subscription_failed', name: 'Subscription Payment Failed', description: 'Triggers when a subscription payment fails' },
  { id: 'payment_failed', name: 'Payment Failed', description: 'Triggers when any payment fails' },
];

export const ZAPIER_ACTIONS = [
  { id: 'create_customer', name: 'Create Customer', description: 'Create a new customer in LunarPay' },
  { id: 'create_invoice', name: 'Create Invoice', description: 'Create a new invoice in LunarPay' },
  { id: 'create_product', name: 'Create Product', description: 'Create a new product in LunarPay' },
];

/**
 * Send webhook to all subscribed Zapier hooks for a trigger
 */
export async function sendZapierWebhook(
  organizationId: number,
  trigger: ZapierTrigger,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Get all active webhooks for this trigger and organization
    const webhooks = await prisma.$queryRaw<Array<{
      id: number;
      webhook_url: string;
    }>>`
      SELECT id, webhook_url FROM zapier_webhooks 
      WHERE organization_id = ${organizationId} 
      AND trigger_type = ${trigger}
      AND is_active = true
    `;

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    // Send webhook to each subscriber
    const sendPromises = webhooks.map(async (webhook) => {
      try {
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trigger,
            timestamp: new Date().toISOString(),
            data,
          }),
        });

        if (!response.ok) {
          console.error(`[ZAPIER] Webhook failed for ${webhook.id}:`, response.status);
        }
      } catch (error) {
        console.error(`[ZAPIER] Webhook error for ${webhook.id}:`, error);
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('[ZAPIER] Send webhook error:', error);
  }
}

// Helper functions to format data for Zapier

export function formatCustomerForZapier(customer: {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  createdAt?: Date | null;
}) {
  return {
    id: customer.id,
    first_name: customer.firstName || '',
    last_name: customer.lastName || '',
    full_name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    zip: customer.zip || '',
    created_at: customer.createdAt?.toISOString() || new Date().toISOString(),
  };
}

export function formatInvoiceForZapier(invoice: {
  id: number;
  reference?: string | null;
  status?: string | null;
  totalAmount?: number | null;
  dueDate?: Date | null;
  createdAt?: Date | null;
  donor?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}) {
  const total = invoice.totalAmount ? Number(invoice.totalAmount) : 0;
  return {
    id: invoice.id,
    invoice_number: invoice.reference || `INV-${invoice.id}`,
    status: invoice.status || 'draft',
    total: total,
    total_formatted: `$${(total / 100).toFixed(2)}`,
    due_date: invoice.dueDate?.toISOString() || null,
    created_at: invoice.createdAt?.toISOString() || new Date().toISOString(),
    customer: invoice.donor ? {
      id: invoice.donor.id,
      name: `${invoice.donor.firstName || ''} ${invoice.donor.lastName || ''}`.trim(),
      email: invoice.donor.email || '',
    } : null,
  };
}

export function formatTransactionForZapier(transaction: {
  id: number | bigint;
  totalAmount?: number | null;
  status?: string | null;
  transactionType?: string | null;
  fortisTransactionId?: string | null;
  createdAt?: Date | null;
  donor?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}) {
  const amount = transaction.totalAmount ? Number(transaction.totalAmount) : 0;
  return {
    id: Number(transaction.id),
    amount: amount,
    amount_formatted: `$${(amount / 100).toFixed(2)}`,
    status: transaction.status || 'pending',
    type: transaction.transactionType || 'charge',
    external_id: transaction.fortisTransactionId || null,
    created_at: transaction.createdAt?.toISOString() || new Date().toISOString(),
    customer: transaction.donor ? {
      id: transaction.donor.id,
      name: `${transaction.donor.firstName || ''} ${transaction.donor.lastName || ''}`.trim(),
      email: transaction.donor.email || '',
    } : null,
  };
}

export function formatSubscriptionForZapier(subscription: {
  id: number;
  status?: string | null;
  amount?: number | null;
  interval?: string | null;
  intervalCount?: number | null;
  startDate?: Date | null;
  nextBillingDate?: Date | null;
  createdAt?: Date | null;
  donor?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  product?: {
    id: number;
    name?: string | null;
  } | null;
}) {
  return {
    id: subscription.id,
    status: subscription.status || 'active',
    amount: subscription.amount || 0,
    amount_formatted: `$${((subscription.amount || 0) / 100).toFixed(2)}`,
    interval: subscription.interval || 'month',
    interval_count: subscription.intervalCount || 1,
    start_date: subscription.startDate?.toISOString() || null,
    next_billing_date: subscription.nextBillingDate?.toISOString() || null,
    created_at: subscription.createdAt?.toISOString() || new Date().toISOString(),
    customer: subscription.donor ? {
      id: subscription.donor.id,
      name: `${subscription.donor.firstName || ''} ${subscription.donor.lastName || ''}`.trim(),
      email: subscription.donor.email || '',
    } : null,
    product: subscription.product ? {
      id: subscription.product.id,
      name: subscription.product.name || '',
    } : null,
  };
}

