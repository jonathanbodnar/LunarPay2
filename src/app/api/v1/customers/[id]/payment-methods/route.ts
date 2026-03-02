/**
 * GET  /api/v1/customers/:id/payment-methods  — List saved payment methods
 * POST /api/v1/customers/:id/payment-methods  — Save a card via ticket intention token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const saveSchema = z.object({
  ticketId: z.string().min(1, 'ticketId from Fortis Elements is required'),
  nameHolder: z.string().max(255).optional(),
  setDefault: z.boolean().optional().default(false),
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

    const { ticketId, nameHolder, setDefault } = parsed.data;

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    // Process ticket with amount = 0 or 1 (just to save the card, not charge)
    // We use a $0.01 auth to validate the card; refund immediately
    const ticketResult = await fortisClient.processTicketSale({
      ticket_id: ticketId,
      transaction_amount: 0,
      save_account: true,
      transaction_c1: nameHolder || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Card',
    });

    if (!ticketResult.status) {
      return apiError(ticketResult.message || 'Failed to save payment method', 400);
    }

    // tokenId comes from ticketResult.tokenId or the transaction record
    const tx = ticketResult.transaction as Record<string, unknown> | undefined;
    const tokenId = ticketResult.tokenId || (tx?.token_id as string) || (tx?.account_vault_id as string) || (tx?.id as string);
    const lastDigits = (tx?.last_four as string) || (tx?.account_number as string)?.slice(-4);
    const expMonth = (tx?.exp_month as string) || (tx?.exp_date as string)?.slice(0, 2);
    const expYear = (tx?.exp_year as string) || (tx?.exp_date as string)?.slice(2);
    const fortisCustomerId = (tx?.customer_id as string) || tokenId;
    const sourceType = (tx?.payment_method as string) === 'ach' ? 'ach' : 'cc';

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
