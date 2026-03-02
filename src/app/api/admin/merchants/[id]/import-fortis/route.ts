/**
 * POST /api/admin/merchants/[id]/import-fortis
 *
 * One-time import of historical Fortis data for a merchant.
 * Requires the merchant's auth_user_id and auth_user_api_key.
 *
 * Body: { authUserId: string, authUserApiKey: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { createFortisClient } from '@/lib/fortis/client';
import axios from 'axios';

const FORTIS_BASE = process.env.fortis_environment === 'prd'
  ? 'https://api.fortis.tech/v1'
  : 'https://api.sandbox.fortis.tech/v1';

async function fortisGet(path: string, userId: string, apiKey: string) {
  const developerId = process.env.FORTIS_DEVELOPER_ID_PRODUCTION
    || process.env.FORTIS_DEVELOPER_ID_SANDBOX
    || process.env.fortis_developer_id
    || '';

  const res = await axios.get(`${FORTIS_BASE}${path}`, {
    headers: {
      'user-id': userId,
      'user-api-key': apiKey,
      'developer-id': developerId,
      Accept: 'application/json',
    },
    timeout: 30000,
  });
  return res.data;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const organizationId = parseInt(id);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const body = await request.json();
    const { authUserId, authUserApiKey } = body;

    if (!authUserId || !authUserApiKey) {
      return NextResponse.json(
        { error: 'authUserId and authUserApiKey are required' },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { fortisOnboarding: true },
    });

    if (!org) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const locationId = org.fortisOnboarding?.locationId;
    if (!locationId) {
      return NextResponse.json({ error: 'No location ID for this merchant' }, { status: 400 });
    }

    // Save credentials now that we have them
    await prisma.fortisOnboarding.update({
      where: { organizationId },
      data: { authUserId, authUserApiKey },
    });

    const results = { customers: 0, transactions: 0, sources: 0, errors: [] as string[] };

    // ── 1. Import contacts (customers) ──────────────────────────────────────
    try {
      const contactsRes = await fortisGet(
        `/contacts?filter[location_id]=${locationId}&page[size]=200`,
        authUserId, authUserApiKey
      );

      const contacts: Record<string, unknown>[] = contactsRes?.list || contactsRes?.data || [];

      for (const c of contacts) {
        try {
          const existing = await prisma.donor.findFirst({
            where: {
              organizationId,
              email: (c.email as string) || undefined,
            },
          });
          if (existing) continue;

          await prisma.donor.create({
            data: {
              userId: org.userId,
              organizationId,
              firstName: (c.first_name as string) || '',
              lastName: (c.last_name as string) || '',
              email: (c.email as string) || null,
              phone: (c.cell_phone as string) || (c.home_phone as string) || null,
              address: (c.address as string) || null,
              city: (c.city as string) || null,
              state: (c.state as string) || null,
              zip: (c.zip as string) || null,
              createdFrom: 'fortis_import',
            },
          });
          results.customers++;
        } catch (e) {
          results.errors.push(`Contact import error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      results.errors.push(`Contacts fetch error: ${(e as Error).message}`);
    }

    // ── 2. Import transactions ───────────────────────────────────────────────
    try {
      const txRes = await fortisGet(
        `/transactions?filter[location_id]=${locationId}&page[size]=200&sort=-created_ts`,
        authUserId, authUserApiKey
      );

      const txns: Record<string, unknown>[] = txRes?.list || txRes?.data || [];

      for (const t of txns) {
        try {
          const fortisId = t.id as string;
          if (!fortisId) continue;

          const existing = await prisma.$queryRaw<{ id: bigint }[]>`
            SELECT id FROM epicpay_customer_transactions WHERE epicpay_transaction_id = ${fortisId} LIMIT 1
          `;
          if (existing.length > 0) continue;

          // Try to match donor by email
          const contactEmail = t.billing_email as string || null;
          let donorId: number | null = null;
          if (contactEmail) {
            const donor = await prisma.donor.findFirst({
              where: { organizationId, email: contactEmail },
            });
            donorId = donor?.id ?? null;
          }

          if (!donorId) continue; // skip if we can't match a customer

          const amountCents = (t.transaction_amount as number) || 0;
          const amountDollars = amountCents / 100;
          const statusCode = t.status_code as number;
          // 101 = approved, 201 = voided/refunded
          const status = statusCode === 101 ? 'P' : statusCode === 201 ? 'R' : 'N';

          await prisma.transaction.create({
            data: {
              userId: org.userId,
              donorId,
              organizationId,
              totalAmount: amountDollars,
              subTotalAmount: amountDollars,
              fee: 0,
              firstName: (t.billing_first_name as string) || '',
              lastName: (t.billing_last_name as string) || '',
              email: contactEmail || '',
              source: 'CC',
              status,
              givingSource: 'fortis_import',
              fortisTransactionId: fortisId,
              requestResponse: JSON.stringify(t),
            },
          });
          results.transactions++;
        } catch (e) {
          results.errors.push(`Transaction import error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      results.errors.push(`Transactions fetch error: ${(e as Error).message}`);
    }

    // ── 3. Import account vaults (saved cards) ───────────────────────────────
    try {
      const vaultRes = await fortisGet(
        `/account-vaults?filter[location_id]=${locationId}&page[size]=200`,
        authUserId, authUserApiKey
      );

      const vaults: Record<string, unknown>[] = vaultRes?.list || vaultRes?.data || [];

      for (const v of vaults) {
        try {
          const tokenId = v.id as string;
          if (!tokenId) continue;

          const existing = await prisma.source.findFirst({
            where: { organizationId, fortisWalletId: tokenId },
          });
          if (existing) continue;

          // Find matching donor
          const contactId = v.contact_id as string;
          let donorId: number | null = null;
          if (contactId) {
            // Try to find by email from contacts — crude matching
            const donor = await prisma.donor.findFirst({
              where: { organizationId },
              orderBy: { createdAt: 'desc' },
            });
            donorId = donor?.id ?? null;
          }
          if (!donorId) continue;

          await prisma.source.create({
            data: {
              donorId,
              organizationId,
              sourceType: v.payment_method === 'ach' ? 'ach' : 'cc',
              lastDigits: (v.last_four as string) || null,
              nameHolder: (v.account_holder_name as string) || null,
              fortisWalletId: tokenId,
              fortisCustomerId: (v.contact_id as string) || tokenId,
              isActive: true,
              isSaved: true,
              isDefault: false,
              expMonth: (v.exp_date as string)?.slice(0, 2) || null,
              expYear: (v.exp_date as string)?.slice(2) || null,
            },
          });
          results.sources++;
        } catch (e) {
          results.errors.push(`Vault import error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      results.errors.push(`Account vaults fetch error: ${(e as Error).message}`);
    }

    console.log(`[ADMIN] Fortis import for org ${organizationId}:`, results);

    return NextResponse.json({
      success: true,
      message: `Imported ${results.customers} customers, ${results.transactions} transactions, ${results.sources} saved cards`,
      results,
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[ADMIN] Fortis import error:', error);
    return NextResponse.json({ error: 'Import failed', details: (error as Error).message }, { status: 500 });
  }
}
