/**
 * GET /api/checkout/session?token=cs_xxx — Fetch session details for the hosted payment page
 * POST /api/checkout/session — Mark session as completed after payment
 *
 * Internal API used by the /pay/[token] hosted page. No API key auth —
 * secured by the unguessable session token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { calculatePlatformFee } from '@/lib/utils';
import { logPaymentEvent } from '@/lib/payment-logger';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token || !token.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
    }

    const sessions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cs.id, cs.token, cs.amount, cs.currency, cs.description,
              cs.customer_email, cs.customer_name, cs.status,
              cs.success_url, cs.cancel_url, cs.expires_at,
              cs.organization_id,
              cd.church_name as org_name, cd.logo as org_logo,
              cd.primary_color, cd.background_color, cd.button_text_color
       FROM checkout_sessions cs
       JOIN church_detail cd ON cd.ch_id = cs.organization_id
       WHERE cs.token = $1
       LIMIT 1`,
      token
    );

    if (!sessions.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const s = sessions[0];

    if (s.status === 'completed') {
      return NextResponse.json({
        session: {
          id: s.id,
          status: 'completed',
          amount: Number(s.amount),
          currency: s.currency,
          description: s.description,
          success_url: s.success_url,
          org_name: s.org_name,
        },
      });
    }

    if (new Date(s.expires_at) < new Date()) {
      await prisma.$queryRawUnsafe(
        `UPDATE checkout_sessions SET status = 'expired', updated_at = NOW() WHERE id = $1`,
        s.id
      );
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    return NextResponse.json({
      session: {
        id: s.id,
        amount: Number(s.amount),
        currency: s.currency,
        description: s.description,
        customer_email: s.customer_email,
        customer_name: s.customer_name,
        status: s.status,
        cancel_url: s.cancel_url,
        success_url: s.success_url,
        expires_at: s.expires_at,
        organization_id: s.organization_id,
        org_name: s.org_name,
        org_logo: s.org_logo,
        primary_color: s.primary_color || '#000000',
        background_color: s.background_color || '#f8fafc',
        button_text_color: s.button_text_color || '#ffffff',
      },
    });
  } catch (error) {
    console.error('[Checkout Session GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, ticketId, amount, customerEmail, customerFirstName, customerLastName } = body;

    if (!token || !token.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
    }

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const sessions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cs.id, cs.amount, cs.organization_id, cs.user_id, cs.status,
              cs.customer_email, cs.customer_name, cs.customer_id,
              cs.success_url, cs.expires_at
       FROM checkout_sessions cs
       WHERE cs.token = $1
       LIMIT 1`,
      token
    );

    if (!sessions.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessions[0];

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    const organizationId = session.organization_id;

    // Get merchant Fortis credentials
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        fortisOnboarding: {
          select: {
            authUserId: true,
            authUserApiKey: true,
            locationId: true,
          },
        },
      },
    });

    if (!organization?.fortisOnboarding?.authUserId || !organization?.fortisOnboarding?.authUserApiKey) {
      return NextResponse.json({ error: 'Merchant payment credentials not configured' }, { status: 400 });
    }

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(
      env as 'sandbox' | 'production',
      organization.fortisOnboarding.authUserId,
      organization.fortisOnboarding.authUserApiKey
    );

    // Charge the card via ticket sale with save_account to get token_id
    const amountInCents = amount || Math.round(Number(session.amount) * 100);
    const result = await fortisClient.processTicketSale({
      ticket_id: ticketId,
      transaction_amount: amountInCents,
      save_account: true,
      location_id: organization.fortisOnboarding.locationId || undefined,
      transaction_c1: `LP-checkout-${session.id}`,
    });

    console.log('[Checkout] Fortis ticket result:', {
      status: result.status,
      tokenId: result.tokenId,
      transactionId: result.transaction?.id,
      message: result.message,
    });

    if (!result.status) {
      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId,
        metadata: { type: 'checkout_session', referenceId: session.id, ticketId, error: result.message },
      });
      return NextResponse.json({
        success: false,
        error: result.message || 'Payment was declined',
        reasonCode: result.reasonCode,
      });
    }

    const txData = result.transaction || {};
    const tokenId = result.tokenId;
    const fortisTransactionId = txData.id;
    const last_four = txData.last_four || txData.last4 || '';
    const account_holder_name = txData.account_holder_name || session.customer_name || '';
    const account_type = txData.account_type || '';
    const payment_method = txData.payment_method || 'cc';
    const exp_date = txData.exp_date || '';

    const amountInDollars = amountInCents / 100;
    const fee = calculatePlatformFee(amountInDollars);
    const netAmount = amountInDollars - fee;

    const cEmail = customerEmail || session.customer_email;
    const cFirstName = customerFirstName || (session.customer_name || '').split(' ')[0] || '';
    const cLastName = customerLastName || (session.customer_name || '').split(' ').slice(1).join(' ') || '';

    // Find or create donor
    let donorId = session.customer_id;
    if (!donorId && cEmail) {
      const existingDonor = await prisma.donor.findFirst({
        where: { email: { equals: cEmail, mode: 'insensitive' }, organizationId },
      });
      if (existingDonor) donorId = existingDonor.id;
    }
    if (!donorId && tokenId) {
      const existingSource = await prisma.source.findFirst({
        where: { fortisWalletId: tokenId, organizationId },
        include: { donor: true },
      });
      if (existingSource?.donor) donorId = existingSource.donor.id;
    }
    if (!donorId && (cEmail || cFirstName || account_holder_name)) {
      const donor = await prisma.donor.create({
        data: {
          userId: session.user_id,
          organizationId,
          firstName: cFirstName || account_holder_name?.split(' ')[0] || 'Guest',
          lastName: cLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
          email: cEmail || null,
          amountAcum: 0,
          feeAcum: 0,
          netAcum: 0,
        },
      });
      donorId = donor.id;
    }

    const truncate = (s: string | null | undefined, max: number) => (s && s.length > max ? s.substring(0, max) : s || '');

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user_id,
        organizationId,
        donorId: donorId || 0,
        firstName: truncate(cFirstName || account_holder_name?.split(' ')[0] || 'Guest', 100),
        lastName: truncate(cLastName || account_holder_name?.split(' ').slice(1).join(' ') || '', 100),
        email: truncate(cEmail, 254),
        totalAmount: amountInDollars,
        subTotalAmount: netAmount,
        fee,
        source: payment_method === 'ach' ? 'BNK' : 'CC',
        status: 'P',
        transactionType: 'DO',
        givingSource: 'checkout',
        fortisTransactionId: truncate(fortisTransactionId, 50),
        requestResponse: JSON.stringify(result),
        template: 'lunarpayfr',
      },
    });

    // Update checkout session as completed
    await prisma.$queryRawUnsafe(
      `UPDATE checkout_sessions 
       SET status = 'completed', transaction_id = $1, fortis_transaction_id = $2, 
           paid_at = NOW(), updated_at = NOW(), customer_id = $3
       WHERE token = $4`,
      transaction.id,
      fortisTransactionId || null,
      donorId || null,
      token
    );

    // Update donor totals
    if (donorId) {
      try {
        const currentDonor = await prisma.donor.findUnique({
          where: { id: donorId },
          select: { amountAcum: true, feeAcum: true, netAcum: true, firstDate: true },
        });
        await prisma.donor.update({
          where: { id: donorId },
          data: {
            amountAcum: Number(currentDonor?.amountAcum || 0) + amountInDollars,
            feeAcum: Number(currentDonor?.feeAcum || 0) + fee,
            netAcum: Number(currentDonor?.netAcum || 0) + netAmount,
            firstDate: currentDonor?.firstDate || new Date(),
          },
        });
      } catch (err) {
        console.error('[Checkout] Failed to update donor totals:', err);
      }
    }

    // Save payment method using the token_id
    let savedSourceId: number | null = null;
    if (tokenId && donorId) {
      const existing = await prisma.source.findFirst({
        where: { fortisWalletId: tokenId, donorId },
      });
      if (!existing) {
        let expMonth: string | null = null;
        let expYear: string | null = null;
        if (exp_date && exp_date.length === 4) {
          expMonth = exp_date.substring(0, 2);
          expYear = '20' + exp_date.substring(2, 4);
        }
        const newSource = await prisma.source.create({
          data: {
            donorId,
            organizationId,
            sourceType: payment_method === 'ach' ? 'ach' : 'cc',
            bankType: account_type || null,
            lastDigits: last_four || '',
            nameHolder: account_holder_name || '',
            expMonth,
            expYear,
            isDefault: true,
            isActive: true,
            isSaved: true,
            fortisWalletId: tokenId,
            fortisCustomerId: donorId.toString(),
          },
        });
        savedSourceId = newSource.id;

        await prisma.source.updateMany({
          where: { donorId, id: { not: newSource.id } },
          data: { isDefault: false },
        });
      } else {
        savedSourceId = existing.id;
      }
    }

    await logPaymentEvent({
      eventType: 'payment.succeeded',
      organizationId,
      transactionId: transaction.id,
      amount: amountInDollars,
      fortisTransactionId,
      metadata: { type: 'checkout_session', referenceId: session.id, tokenId, cardSaved: !!savedSourceId },
    });

    return NextResponse.json({
      success: true,
      status: 'succeeded',
      transaction_id: transaction.id.toString(),
      card_saved: !!savedSourceId,
      source_id: savedSourceId,
      success_url: session.success_url,
    });
  } catch (error) {
    console.error('[Checkout Session POST]', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
