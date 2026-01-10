/**
 * Payment Event Logger
 * Structured logging for all payment events
 */

import { prisma } from '@/lib/prisma';

export type PaymentEventType =
  | 'payment.created'
  | 'payment.processed'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.status_updated'
  | 'ach.pending'
  | 'refund.succeeded'
  | 'refund.failed'
  | 'webhook.received'
  | 'webhook.processed'
  | 'webhook.failed'
  | 'subscription.created'
  | 'subscription.trial_started'
  | 'subscription.renewed'
  | 'subscription.cancelled';

export interface PaymentEventData {
  eventType: PaymentEventType;
  transactionId?: bigint | string;
  organizationId?: number;
  userId?: number;
  donorId?: number;
  amount?: number;
  status?: string;
  paymentMethod?: string;
  fortisTransactionId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a payment event to the database
 */
export async function logPaymentEvent(data: PaymentEventData): Promise<void> {
  try {
    // Store event in FortisWebhook table (we can create a dedicated table later)
    await prisma.fortisWebhook.create({
      data: {
        eventJson: JSON.stringify({
          event_type: data.eventType,
          transaction_id: data.transactionId?.toString(),
          organization_id: data.organizationId,
          user_id: data.userId,
          donor_id: data.donorId,
          amount: data.amount,
          status: data.status,
          payment_method: data.paymentMethod,
          fortis_transaction_id: data.fortisTransactionId,
          error: data.error,
          metadata: data.metadata,
          timestamp: new Date().toISOString(),
        }),
        system: 'lunarpay',
        mode: 'payment_event',
      },
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Payment Event]', {
        type: data.eventType,
        transactionId: data.transactionId,
        status: data.status,
        amount: data.amount,
      });
    }
  } catch (error) {
    // Don't throw - logging should never break the main flow
    console.error('[Payment Logger] Failed to log event:', error);
  }
}

/**
 * Log payment creation
 */
export async function logPaymentCreated(
  transactionId: bigint,
  organizationId: number,
  userId: number,
  donorId: number,
  amount: number,
  paymentMethod: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logPaymentEvent({
    eventType: 'payment.created',
    transactionId,
    organizationId,
    userId,
    donorId,
    amount,
    paymentMethod,
    metadata,
  });
}

/**
 * Log payment processing
 */
export async function logPaymentProcessed(
  transactionId: bigint,
  fortisTransactionId: string,
  status: 'P' | 'N',
  metadata?: Record<string, any>
): Promise<void> {
  await logPaymentEvent({
    eventType: 'payment.processed',
    transactionId,
    fortisTransactionId,
    status: status === 'P' ? 'succeeded' : 'failed',
    metadata,
  });
}

/**
 * Log payment success
 */
export async function logPaymentSucceeded(
  transactionId: bigint,
  amount: number,
  fortisTransactionId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logPaymentEvent({
    eventType: 'payment.succeeded',
    transactionId,
    amount,
    fortisTransactionId,
    status: 'succeeded',
    metadata,
  });
}

/**
 * Log payment failure
 */
export async function logPaymentFailed(
  transactionId: bigint,
  error: string,
  fortisTransactionId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logPaymentEvent({
    eventType: 'payment.failed',
    transactionId,
    error,
    fortisTransactionId,
    status: 'failed',
    metadata,
  });
}

/**
 * Log payment refund
 */
export async function logPaymentRefunded(
  transactionId: bigint,
  refundTransactionId: bigint,
  amount: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logPaymentEvent({
    eventType: 'payment.refunded',
    transactionId,
    amount: -amount, // Negative for refund
    metadata: {
      ...metadata,
      refund_transaction_id: refundTransactionId.toString(),
    },
  });
}

/**
 * Log payment status update (from webhook)
 */
export async function logPaymentStatusUpdated(
  fortisTransactionId: string,
  oldStatus: string,
  newStatus: string,
  transactionId?: bigint,
  metadata?: Record<string, any>
): Promise<void> {
  await logPaymentEvent({
    eventType: 'payment.status_updated',
    transactionId,
    fortisTransactionId,
    status: newStatus,
    metadata: {
      ...metadata,
      old_status: oldStatus,
      new_status: newStatus,
    },
  });
}

/**
 * Log webhook received
 */
export async function logWebhookReceived(
  eventType: string,
  organizationId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logPaymentEvent({
    eventType: 'webhook.received',
    organizationId,
    metadata: {
      ...metadata,
      webhook_event_type: eventType,
    },
  });
}

