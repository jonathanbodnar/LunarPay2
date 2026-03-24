/**
 * GET /api/checkout/session?token=cs_xxx — Fetch session details for the hosted payment page
 * POST /api/checkout/session — Mark session as completed after payment
 *
 * Internal API used by the /pay/[token] hosted page. No API key auth —
 * secured by the unguessable session token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const { token, fortisResponse } = body;

    if (!token || !token.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
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

    if (!fortisResponse) {
      return NextResponse.json({ error: 'Payment response data required' }, { status: 400 });
    }

    const txData = fortisResponse.transaction || fortisResponse.data || fortisResponse;
    const fortisTransactionId = txData.id || txData.transaction_id || fortisResponse.id;
    const transaction_amount = txData.transaction_amount || txData.transactionAmount || txData.amount || 0;
    const status_code = txData.status_code || txData.statusCode || txData.status_id;
    const reason_code_id = txData.reason_code_id || txData.reasonCodeId || txData.reason_code;
    const account_holder_name = txData.account_holder_name || txData.accountHolderName || session.customer_name || '';
    const last_four = txData.last_four || txData.lastFour || txData.last4 || '';
    const account_type = txData.account_type || txData.accountType || '';
    const payment_method = txData.payment_method || txData.paymentMethod || 'cc';
    const token_id = txData.token_id || txData.tokenId || txData.account_vault_id || null;
    const exp_date = txData.exp_date || txData.expDate || '';

    const statusCodeNum = typeof status_code === 'string' ? parseInt(status_code, 10) : status_code;
    const reasonCodeNum = typeof reason_code_id === 'string' ? parseInt(reason_code_id, 10) : reason_code_id;

    const isCCApproved = statusCodeNum === 101 && reasonCodeNum === 1000;
    const isACHPending = (statusCodeNum === 131 || statusCodeNum === 132) && reasonCodeNum === 1000;
    const isGenericSuccess = (reasonCodeNum === 1000) || (txData.status === 'approved' || txData.status === 'success');

    if (!isCCApproved && !isACHPending && !isGenericSuccess) {
      await logPaymentEvent({
        eventType: 'payment.failed',
        organizationId: session.organization_id,
        fortisTransactionId,
        metadata: { type: 'checkout_session', referenceId: session.id, statusCode: status_code, reasonCode: reason_code_id },
      });

      return NextResponse.json({
        success: false,
        error: 'Payment was declined',
        reasonCode: reason_code_id,
      });
    }

    const amountInDollars = transaction_amount / 100;
    const fee = calculatePlatformFee(amountInDollars);
    const netAmount = amountInDollars - fee;

    const organizationId = session.organization_id;

    // Find or create donor
    let donorId = session.customer_id;
    if (!donorId && session.customer_email) {
      const existingDonor = await prisma.donor.findFirst({
        where: { email: { equals: session.customer_email, mode: 'insensitive' }, organizationId },
      });
      if (existingDonor) {
        donorId = existingDonor.id;
      }
    }

    if (!donorId && (session.customer_email || session.customer_name || account_holder_name)) {
      const nameParts = (session.customer_name || account_holder_name || 'Guest').split(' ');
      const donor = await prisma.donor.create({
        data: {
          userId: session.user_id,
          organizationId,
          firstName: nameParts[0] || 'Guest',
          lastName: nameParts.slice(1).join(' ') || '',
          email: session.customer_email || null,
          amountAcum: 0,
          feeAcum: 0,
          netAcum: 0,
        },
      });
      donorId = donor.id;
    }

    const truncate = (s: string | null | undefined, max: number) => (s && s.length > max ? s.substring(0, max) : s || '');
    const nameParts = (session.customer_name || account_holder_name || 'Guest').split(' ');

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user_id,
        organizationId,
        donorId: donorId || 0,
        firstName: truncate(nameParts[0], 100),
        lastName: truncate(nameParts.slice(1).join(' '), 100),
        email: truncate(session.customer_email, 254),
        totalAmount: amountInDollars,
        subTotalAmount: netAmount,
        fee,
        source: payment_method === 'ach' ? 'BNK' : 'CC',
        status: isACHPending ? 'U' : 'P',
        statusAch: payment_method === 'ach' ? (isACHPending ? 'W' : 'P') : null,
        transactionType: 'DO',
        givingSource: 'checkout',
        fortisTransactionId: truncate(fortisTransactionId, 50),
        requestResponse: JSON.stringify(fortisResponse),
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
    if (donorId && (isCCApproved || isGenericSuccess)) {
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

    // Save payment method if token available
    if (token_id && donorId) {
      const existing = await prisma.source.findFirst({
        where: { fortisWalletId: token_id, donorId },
      });
      if (!existing) {
        let expMonth: string | null = null;
        let expYear: string | null = null;
        if (exp_date && exp_date.length === 4) {
          expMonth = exp_date.substring(0, 2);
          expYear = '20' + exp_date.substring(2, 4);
        }
        await prisma.source.create({
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
            fortisWalletId: token_id,
            fortisCustomerId: donorId.toString(),
          },
        });
      }
    }

    await logPaymentEvent({
      eventType: isACHPending ? 'ach.pending' : 'payment.succeeded',
      organizationId,
      transactionId: transaction.id,
      amount: amountInDollars,
      fortisTransactionId,
      metadata: { type: 'checkout_session', referenceId: session.id },
    });

    return NextResponse.json({
      success: true,
      status: isACHPending ? 'pending' : 'succeeded',
      transaction_id: transaction.id.toString(),
      success_url: session.success_url,
    });
  } catch (error) {
    console.error('[Checkout Session POST]', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
