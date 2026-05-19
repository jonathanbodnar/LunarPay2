/**
 * GET  /api/v1/customers/:id/payment-methods  — List saved payment methods
 * POST /api/v1/customers/:id/payment-methods  — Save a payment method
 *
 * Accepts either:
 *   - tokenizeId: account vault ID from a Fortis Elements tokenization intention
 *     (no charge to customer — preferred method)
 *   - ticketId: ticket ID from a Fortis Elements ticket intention
 *     ($0.01 charge + immediate refund for CC; legacy method)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const saveSchema = z.object({
  /**
   * Account vault ID returned by Fortis Elements `tokenize_success` event.
   * No charge is made when this is provided — preferred over ticketId.
   */
  tokenizeId: z.string().min(1).optional(),
  /**
   * Ticket ID from a Fortis Elements ticket intention (hasRecurring: true).
   * Results in a $0.01 verification charge + refund. Use tokenizeId instead
   * when possible.
   */
  ticketId: z.string().min(1).optional(),
  nameHolder: z.string().max(255).optional(),
  setDefault: z.boolean().optional().default(false),
  /**
   * Payment method to save.
   * - 'cc'  — credit card (default)
   * - 'ach' — bank account / eCheck
   */
  paymentMethod: z.enum(['cc', 'ach']).optional().default('cc'),
  /** Card last 4 digits — optional, sourced from the tokenize_success event data. */
  lastFour: z.string().length(4).optional(),
  /** Card expiry month (2 digits) — optional. */
  expMonth: z.string().length(2).optional(),
  /** Card expiry year (2 or 4 digits) — optional. */
  expYear: z.string().min(2).max(4).optional(),
}).refine((d) => d.tokenizeId || d.ticketId, {
  message: 'Either tokenizeId or ticketId must be provided',
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const customerId = parseInt(id);
    if (isNaN(customerId)) return apiError('Invalid customer ID', 400);

    const customer = await prisma.donor.findFirst({
      where: { id: customerId, organizationId: auth.organizationId },
    });
    if (!customer) return apiError('Customer not found', 404);

    const methods = await prisma.source.findMany({
      where: { donorId: customerId, isActive: true },
      select: {
        id: true, sourceType: true, bankType: true, lastDigits: true,
        nameHolder: true, isDefault: true, expMonth: true, expYear: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ data: methods });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/payment-methods GET]', e);
    return apiError('Internal server error', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const customerId = parseInt(id);
    if (isNaN(customerId)) return apiError('Invalid customer ID', 400);

    const customer = await prisma.donor.findFirst({
      where: { id: customerId, organizationId: auth.organizationId },
    });
    if (!customer) return apiError('Customer not found', 404);

    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { tokenizeId, ticketId, nameHolder, setDefault, paymentMethod,
            lastFour: lastFourParam, expMonth: expMonthParam, expYear: expYearParam } = parsed.data;

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    const holderLabel =
      nameHolder ||
      `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
      (paymentMethod === 'ach' ? 'Bank Account' : 'Card');

    let tokenId: string | undefined;
    let lastDigits: string | undefined;
    let expMonth: string | undefined;
    let expYear: string | undefined;
    let sourceType = paymentMethod;
    let bankType: string | null = null;

    if (tokenizeId) {
      // ── TOKENIZATION PATH ──────────────────────────────────────────────────
      // Card was already vaulted by Fortis Elements (tokenization intention).
      // tokenizeId IS the account_vault_id — no server-side charge needed.
      tokenId = tokenizeId;
      lastDigits = lastFourParam;
      expMonth = expMonthParam;
      expYear = expYearParam;
      // sourceType and bankType remain as set from paymentMethod
    } else {
      // ── TICKET PATH (legacy) ───────────────────────────────────────────────
      // Fortis requires transaction_amount >= 1 cent for ticket sales. We charge
      // $0.01 to save the token, then immediately refund it (for CC). For ACH we
      // don't refund because bank debits don't clear instantly.
      let ticketResult;
      if (paymentMethod === 'ach') {
        ticketResult = await fortisClient.processACHTicketSale({
          ticket_id: ticketId!,
          transaction_amount: 1,
          save_account: true,
          transaction_c1: holderLabel,
        });
      } else {
        ticketResult = await fortisClient.processTicketSale({
          ticket_id: ticketId!,
          transaction_amount: 1,
          save_account: true,
          transaction_c1: holderLabel,
        });
      }

      if (!ticketResult.status) {
        return apiError(ticketResult.message || 'Failed to save payment method', 400);
      }

      const tx = ticketResult.transaction as Record<string, unknown> | undefined;
      tokenId = ticketResult.tokenId || (tx?.token_id as string) || (tx?.account_vault_id as string) || (tx?.id as string);

      // Refund the $0.01 verification charge only for CC.
      const verificationTxId = (tx?.id as string) || null;
      if (paymentMethod !== 'ach' && verificationTxId) {
        fortisClient.refundTransaction(verificationTxId, 1).catch((e) =>
          console.error('[v1/payment-methods] Failed to void $0.01 verification charge:', e)
        );
      }

      lastDigits = (tx?.last_four as string) || (tx?.account_number as string)?.slice(-4);
      expMonth = (tx?.exp_month as string) || (tx?.exp_date as string)?.slice(0, 2);
      expYear = (tx?.exp_year as string) || (tx?.exp_date as string)?.slice(2);
      const resolvedPaymentMethod = (tx?.payment_method as string) || paymentMethod;
      sourceType = resolvedPaymentMethod === 'ach' ? 'ach' : 'cc';
      bankType = sourceType === 'ach' ? ((tx?.account_type as string) || null) : null;
    }

    const fortisCustomerId = tokenId;

    if (!tokenId) {
      return apiError('Failed to retrieve token from payment processor', 502);
    }

    // If setDefault, unset existing defaults
    if (setDefault) {
      await prisma.source.updateMany({
        where: { donorId: customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const source = await prisma.source.create({
      data: {
        donorId: customerId,
        organizationId: auth.organizationId,
        sourceType,
        bankType: bankType || null,
        lastDigits: lastDigits || null,
        nameHolder: nameHolder || null,
        fortisWalletId: tokenId,
        fortisCustomerId: fortisCustomerId || tokenId,
        isActive: true,
        isSaved: true,
        isDefault: setDefault || false,
        expMonth: expMonth || null,
        expYear: expYear || null,
      },
    });

    return Response.json({
      data: {
        id: source.id,
        sourceType: source.sourceType,
        bankType: source.bankType,
        lastDigits: source.lastDigits,
        nameHolder: source.nameHolder,
        isDefault: source.isDefault,
        expMonth: source.expMonth,
        expYear: source.expYear,
        createdAt: source.createdAt,
      },
    }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/payment-methods POST]', e);
    return apiError('Internal server error', 500);
  }
}
