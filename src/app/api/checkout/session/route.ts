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
import { sendAgencyWebhook, type CheckoutSessionCompletedPayload } from '@/lib/agency-webhook';

function addFrequency(date: Date, frequency: string): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token || !token.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
    }

    const sessions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cs.id, cs.token, cs.amount, cs.currency, cs.description,
              cs.customer_email, cs.customer_name, cs.status,
              cs.success_url, cs.cancel_url, cs.expires_at, cs.payment_methods,
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

    const paymentMethods = (s.payment_methods || 'cc,ach').split(',').map((m: string) => m.trim()).filter(Boolean);

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
        payment_methods: paymentMethods,
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
    const { token, ticketId, amount, customerEmail, customerFirstName, customerLastName, paymentMethod } = body;
    const isAch = paymentMethod === 'ach';

    if (!token || !token.startsWith('cs_')) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 400 });
    }

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const session = await prisma.checkoutSession.findUnique({
      where: { token },
      select: {
        id: true,
        amount: true,
        organizationId: true,
        userId: true,
        status: true,
        customerEmail: true,
        customerName: true,
        customerId: true,
        successUrl: true,
        expiresAt: true,
        metadata: true,
        mode: true,
        modeConfig: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    const organizationId = session.organizationId;

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

    // ────────────────────────────────────────────────────────────────────────
    // Detect trial mode: save the card WITHOUT charging
    // ────────────────────────────────────────────────────────────────────────
    const cfg = (session.modeConfig ?? {}) as any;
    const isTrialSubscription =
      session.mode === 'subscription' && cfg?.recurring?.trial === true;

    const cEmail = customerEmail || session.customerEmail;
    const cFirstName = customerFirstName || (session.customerName || '').split(' ')[0] || '';
    const cLastName = customerLastName || (session.customerName || '').split(' ').slice(1).join(' ') || '';
    const truncate = (s: string | null | undefined, max: number) => (s && s.length > max ? s.substring(0, max) : s || '');
    const account_holder_name = cFirstName + ' ' + cLastName;

    if (isTrialSubscription) {
      // ── TRIAL FLOW: save card only, no charge ──────────────────────────
      const vaultResult = await fortisClient.createAccountVault({
        ticket_id: ticketId,
        location_id: organization.fortisOnboarding.locationId || '',
        payment_method: isAch ? 'ach' : 'cc',
        account_holder_name: account_holder_name.trim(),
        accountvault_c1: `LP-trial-${session.id}`,
      });

      if (!vaultResult.status) {
        return NextResponse.json({
          success: false,
          error: vaultResult.message || 'Failed to save payment method',
        });
      }

      const tokenId = vaultResult.tokenId;
      const payment_method = isAch ? 'ach' : 'cc';

      // Find or create donor (same logic as regular flow)
      let donorId = session.customerId;
      if (!donorId && cEmail) {
        const existingDonor = await prisma.donor.findFirst({
          where: { email: { equals: cEmail, mode: 'insensitive' }, organizationId },
        });
        if (existingDonor) donorId = existingDonor.id;
      }
      if (!donorId && (cEmail || cFirstName)) {
        const donor = await prisma.donor.create({
          data: {
            userId: session.userId,
            organizationId,
            firstName: cFirstName || 'Guest',
            lastName: cLastName || '',
            email: cEmail || null,
            amountAcum: 0,
            feeAcum: 0,
            netAcum: 0,
          },
        });
        donorId = donor.id;
      }

      // Save the card source
      let savedSourceId: number | null = null;
      if (donorId && tokenId) {
        const newSource = await prisma.source.create({
          data: {
            donorId,
            organizationId,
            sourceType: payment_method,
            bankType: null,
            lastDigits: vaultResult.lastFour || '',
            nameHolder: account_holder_name.trim(),
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
      }

      // Create subscription (no initial charge)
      let createdSubscriptionId: number | null = null;
      const recurring = cfg.recurring;
      const recurringFreq: string = recurring.frequency;
      const recurringAmount: number = Number(recurring.amount ?? Number(session.amount));
      const startDate = recurring.start_on
        ? new Date(recurring.start_on)
        : addFrequency(new Date(), recurringFreq);

      if (savedSourceId && donorId) {
        const sub = await prisma.subscription.create({
          data: {
            donorId,
            organizationId,
            sourceId: savedSourceId,
            amount: recurringAmount,
            frequency: recurringFreq,
            status: 'A',
            firstName: cFirstName || 'Guest',
            lastName: cLastName || '',
            email: cEmail || '',
            givingSource: 'checkout',
            source: payment_method === 'ach' ? 'BNK' : 'CC',
            fortisWalletId: tokenId || null,
            fortisCustomerId: donorId.toString(),
            startOn: new Date(),
            nextPaymentOn: startDate,
          },
        });
        createdSubscriptionId = sub.id;
        console.log(`[Checkout] mode=subscription+trial created subscription ${sub.id} (first charge ${startDate.toISOString()})`);
      }

      // Mark session completed (no transaction — card was only saved)
      await prisma.checkoutSession.update({
        where: { token },
        data: {
          status: 'completed',
          paidAt: new Date(),
          customerId: donorId || null,
          donorId: donorId || null,
          subscriptionId: createdSubscriptionId,
        },
      });

      // Fire agency webhook (trial — no transaction)
      try {
        const merchantUser = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { agencyId: true },
        });
        if (merchantUser?.agencyId) {
          const sourceRow = savedSourceId
            ? await prisma.source.findUnique({
                where: { id: savedSourceId },
                select: { lastDigits: true, sourceType: true },
              })
            : null;

          const webhookPayload: CheckoutSessionCompletedPayload = {
            event: 'checkout.session.completed',
            session: {
              id: session.id,
              token,
              amount: 0,
              currency: 'USD',
              description: null,
              customer_email: cEmail || null,
              customer_name: `${cFirstName} ${cLastName}`.trim() || null,
              metadata: session.metadata ? safeParseJson(session.metadata) : null,
              mode: 'subscription',
              paid_at: new Date().toISOString(),
            },
            merchant: {
              id: session.userId,
              organizationId,
              businessName: organization.name,
            },
            transaction: {
              id: '',
              fortis_transaction_id: null,
              amount: 0,
              payment_method: payment_method === 'ach' ? 'ach' : 'cc',
            },
            customer: donorId ? { id: donorId, email: cEmail || null } : null,
            payment_method: savedSourceId
              ? { id: savedSourceId, type: sourceRow?.sourceType === 'ach' ? 'ach' : 'cc', last4: sourceRow?.lastDigits || null }
              : null,
            resources: { subscription_id: createdSubscriptionId, payment_schedule_id: null },
            timestamp: new Date().toISOString(),
          };

          sendAgencyWebhook(merchantUser.agencyId, webhookPayload).catch(() => {});
        }
      } catch (whErr) {
        console.error('[Checkout] trial webhook dispatch failed:', whErr);
      }

      await logPaymentEvent({
        eventType: 'subscription.created',
        organizationId,
        metadata: { type: 'checkout_session_trial', referenceId: session.id, subscriptionId: createdSubscriptionId },
      });

      return NextResponse.json({
        success: true,
        status: 'trial_started',
        card_saved: !!savedSourceId,
        source_id: savedSourceId,
        customer_id: donorId,
        subscription_id: createdSubscriptionId,
        payment_schedule_id: null,
        success_url: session.successUrl,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // REGULAR FLOW: charge the card AND save it
    // ────────────────────────────────────────────────────────────────────────
    const amountInCents = amount || Math.round(Number(session.amount) * 100);
    const result = isAch
      ? await fortisClient.processACHTicketSale({
          ticket_id: ticketId,
          transaction_amount: amountInCents,
          save_account: true,
          location_id: organization.fortisOnboarding.locationId || undefined,
          transaction_c1: `LP-checkout-${session.id}`,
        })
      : await fortisClient.processTicketSale({
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
    const account_type = txData.account_type || '';
    const payment_method = isAch ? 'ach' : (txData.payment_method || 'cc');
    const exp_date = txData.exp_date || '';

    const amountInDollars = amountInCents / 100;
    const fee = calculatePlatformFee(amountInDollars);
    const netAmount = amountInDollars - fee;

    // Find or create donor
    let donorId = session.customerId;
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
          userId: session.userId,
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

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
        organizationId,
        donorId: donorId || 0,
        firstName: truncate(cFirstName || account_holder_name?.split(' ')[0] || 'Guest', 100),
        lastName: truncate(cLastName || account_holder_name?.split(' ').slice(1).join(' ') || '', 100),
        email: truncate(cEmail, 254),
        totalAmount: amountInDollars,
        subTotalAmount: netAmount,
        fee,
        source: payment_method === 'ach' ? 'BNK' : 'CC',
        status: payment_method === 'ach' ? 'U' : 'P',
        transactionType: 'DO',
        givingSource: 'checkout',
        fortisTransactionId: truncate(fortisTransactionId, 50),
        requestResponse: JSON.stringify(result),
        template: 'lunarpayfr',
      },
    });

    // Mark the session completed
    await prisma.checkoutSession.update({
      where: { token },
      data: {
        status: 'completed',
        transactionId: transaction.id,
        fortisTransactionId: fortisTransactionId || null,
        paidAt: new Date(),
        customerId: donorId || null,
        donorId: donorId || null,
      },
    });

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

    // Save / dedup the payment method.
    let savedSourceId: number | null = null;
    if (donorId) {
      let expMonth: string | null = null;
      let expYear: string | null = null;
      if (exp_date && exp_date.length === 4) {
        expMonth = exp_date.substring(0, 2);
        expYear = '20' + exp_date.substring(2, 4);
      }

      let existing = tokenId
        ? await prisma.source.findFirst({ where: { fortisWalletId: tokenId, donorId } })
        : null;

      if (!existing && last_four) {
        existing = await prisma.source.findFirst({
          where: {
            donorId,
            organizationId,
            sourceType: payment_method === 'ach' ? 'ach' : 'cc',
            lastDigits: last_four,
            ...(expMonth ? { expMonth } : {}),
            ...(expYear ? { expYear } : {}),
            isActive: true,
          },
          orderBy: { id: 'desc' },
        });
      }

      if (existing) {
        savedSourceId = existing.id;
        if (tokenId && existing.fortisWalletId !== tokenId) {
          await prisma.source.update({
            where: { id: existing.id },
            data: { fortisWalletId: tokenId, updatedAt: new Date() },
          });
        }
      } else if (tokenId) {
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
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Mode-based follow-up: subscription / installments
    // ────────────────────────────────────────────────────────────────────────
    let createdSubscriptionId: number | null = null;
    let createdPaymentScheduleId: number | null = null;
    let modeFollowupError: string | null = null;

    if (savedSourceId && donorId && session.mode && session.mode !== 'payment') {
      try {
        if (session.mode === 'subscription') {
          const recurring = cfg.recurring ?? {};
          const recurringFreq: string = recurring.frequency;
          const recurringAmount: number = Number(
            recurring.amount ?? Number(session.amount)
          );
          const startDate = recurring.start_on
            ? new Date(recurring.start_on)
            : addFrequency(new Date(), recurringFreq);

          const sub = await prisma.subscription.create({
            data: {
              donorId,
              organizationId,
              sourceId: savedSourceId,
              amount: recurringAmount,
              frequency: recurringFreq,
              status: 'A',
              firstName: cFirstName || account_holder_name?.split(' ')[0] || 'Guest',
              lastName: cLastName || account_holder_name?.split(' ').slice(1).join(' ') || '',
              email: cEmail || '',
              givingSource: 'checkout',
              source: payment_method === 'ach' ? 'BNK' : 'CC',
              fortisWalletId: tokenId || null,
              fortisCustomerId: donorId.toString(),
              startOn: new Date(),
              nextPaymentOn: startDate,
            },
          });
          createdSubscriptionId = sub.id;
          console.log(
            `[Checkout] mode=subscription created subscription ${sub.id} (next ${startDate.toISOString()})`
          );
        }

        if (session.mode === 'installments') {
          const inst = cfg.installments ?? {};
          const totalPayments: number = Number(inst.count);
          const remaining = Math.max(0, totalPayments - 1);
          const perAmount: number = Number(inst.amount ?? Number(session.amount));
          const freq: string = inst.frequency;
          const firstFutureDate = inst.start_on
            ? new Date(inst.start_on)
            : addFrequency(new Date(), freq);

          if (remaining > 0) {
            const payments: { amount: number; dueDate: Date; status: string }[] = [];
            let cursor = firstFutureDate;
            for (let i = 0; i < remaining; i++) {
              payments.push({ amount: perAmount, dueDate: cursor, status: 'pending' });
              cursor = addFrequency(cursor, freq);
            }

            const schedule = await prisma.paymentSchedule.create({
              data: {
                organizationId,
                customerId: donorId,
                sourceId: savedSourceId,
                description: `Installments 2-${totalPayments} of ${totalPayments}`,
                status: 'active',
                totalAmount: perAmount * remaining,
                paidAmount: 0,
                paymentsTotal: remaining,
                paymentsCompleted: 0,
                paymentsFailed: 0,
                payments: { create: payments },
              },
            });
            createdPaymentScheduleId = schedule.id;
            console.log(
              `[Checkout] mode=installments created payment_schedule ${schedule.id} (${remaining} future payments)`
            );
          } else {
            console.log('[Checkout] mode=installments with count<=1 — nothing to schedule');
          }
        }

        if (createdSubscriptionId || createdPaymentScheduleId) {
          await prisma.checkoutSession.update({
            where: { token },
            data: {
              subscriptionId: createdSubscriptionId,
              paymentScheduleId: createdPaymentScheduleId,
            },
          });
        }
      } catch (followupError) {
        modeFollowupError =
          followupError instanceof Error ? followupError.message : String(followupError);
        console.error(
          `[Checkout] mode=${session.mode} follow-up failed for session ${session.id}:`,
          followupError
        );
      }
    }

    // Fire agency webhook
    try {
      const merchantUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { agencyId: true },
      });
      if (merchantUser?.agencyId) {
        const sourceRow = savedSourceId
          ? await prisma.source.findUnique({
              where: { id: savedSourceId },
              select: { lastDigits: true, sourceType: true },
            })
          : null;

        const webhookPayload: CheckoutSessionCompletedPayload = {
          event: 'checkout.session.completed',
          session: {
            id: session.id,
            token,
            amount: amountInDollars,
            currency: 'USD',
            description: null,
            customer_email: cEmail || null,
            customer_name: `${cFirstName} ${cLastName}`.trim() || null,
            metadata: session.metadata ? safeParseJson(session.metadata) : null,
            mode: session.mode || 'payment',
            paid_at: new Date().toISOString(),
          },
          merchant: {
            id: session.userId,
            organizationId,
            businessName: organization.name,
          },
          transaction: {
            id: transaction.id.toString(),
            fortis_transaction_id: fortisTransactionId || null,
            amount: amountInDollars,
            payment_method: payment_method === 'ach' ? 'ach' : 'cc',
          },
          customer: donorId
            ? { id: donorId, email: cEmail || null }
            : null,
          payment_method: savedSourceId
            ? {
                id: savedSourceId,
                type: (sourceRow?.sourceType === 'ach' ? 'ach' : 'cc'),
                last4: sourceRow?.lastDigits || null,
              }
            : null,
          resources: {
            subscription_id: createdSubscriptionId,
            payment_schedule_id: createdPaymentScheduleId,
          },
          timestamp: new Date().toISOString(),
        };

        sendAgencyWebhook(merchantUser.agencyId, webhookPayload).catch(() => {});
      }
    } catch (whErr) {
      console.error('[Checkout] checkout.session.completed webhook dispatch failed:', whErr);
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
      customer_id: donorId,
      subscription_id: createdSubscriptionId,
      payment_schedule_id: createdPaymentScheduleId,
      mode_followup_error: modeFollowupError,
      success_url: session.successUrl,
    });
  } catch (error) {
    console.error('[Checkout Session POST]', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

function safeParseJson(s: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
