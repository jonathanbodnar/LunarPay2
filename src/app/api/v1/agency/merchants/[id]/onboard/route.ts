/**
 * POST /api/v1/agency/merchants/:id/onboard
 *
 * Submit merchant info and bank details to Fortis for processing.
 * Returns the MPA link for the merchant to complete their application.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { MerchantOnboardingData } from '@/types/fortis';
import { requireAgencyKey, ApiAuthError, apiError } from '@/lib/api-auth';
import { cleanPhoneForFortis } from '@/lib/utils';

const onboardSchema = z.object({
  // Primary principal
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  email: z.string().email().max(254),

  // Business
  dbaName: z.string().min(1).max(255),
  legalName: z.string().min(1).max(255),
  website: z.string().max(255).optional(),
  fedTaxId: z.string().max(20).optional(),
  ownershipType: z.string().max(50).optional(),
  ownerTitle: z.string().max(100).optional(),
  ownershipPercent: z.number().int().min(1).max(100).optional(),
  dateOfBirth: z.string().max(10).optional(),

  // Business address
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  postalCode: z.string().min(1).max(20),

  // Owner home address (falls back to business address)
  ownerAddressLine1: z.string().max(255).optional(),
  ownerCity: z.string().max(100).optional(),
  ownerState: z.string().max(50).optional(),
  ownerPostalCode: z.string().max(20).optional(),

  // Volume estimates (ranges 1-7 for avg ticket/monthly volume, dollar amount for high ticket)
  ccAverageTicketRange: z.number().int().min(1).max(7),
  ccMonthlyVolumeRange: z.number().int().min(1).max(7),
  ccHighTicket: z.number().int().min(1).max(30000),
  ecAverageTicketRange: z.number().int().min(1).max(7),
  ecMonthlyVolumeRange: z.number().int().min(1).max(7),
  ecHighTicket: z.number().int().min(1).max(30000),

  // Bank info
  routingNumber: z.string().min(9).max(9),
  accountNumber: z.string().min(4).max(17),
  accountHolderName: z.string().min(1).max(255),
  altRoutingNumber: z.string().min(9).max(9).optional(),
  altAccountNumber: z.string().min(4).max(17).optional(),
  altAccountHolderName: z.string().max(255).optional(),
}).superRefine((val, ctx) => {
  // A single transaction cannot be larger than the whole month's volume.
  // Fortis rejects this on the MPA and the onboarding page warns about it
  // (onboarding/[token]/page.tsx tip panel), but the API accepted it happily
  // and the merchant only discovered the problem inside the Fortis iframe,
  // after the application had already been submitted.
  //
  // Monthly volume arrives as a 1-7 range; the ceiling is the top of that band.
  // Bands 4+ start at $50k, above the $30k high-ticket maximum, so in practice
  // only bands 1-3 can be violated.
  const MONTHLY_VOLUME_CEILING: Record<number, number> = {
    1: 5_000,
    2: 10_000,
    3: 25_000,
    4: 50_000,
    5: 100_000,
    6: 250_000,
    7: Number.POSITIVE_INFINITY,
  };

  const pairs: Array<{
    highTicket: number;
    volumeRange: number;
    highField: 'ccHighTicket' | 'ecHighTicket';
    label: string;
  }> = [
    {
      highTicket: val.ccHighTicket,
      volumeRange: val.ccMonthlyVolumeRange,
      highField: 'ccHighTicket',
      label: 'card',
    },
    {
      highTicket: val.ecHighTicket,
      volumeRange: val.ecMonthlyVolumeRange,
      highField: 'ecHighTicket',
      label: 'eCheck',
    },
  ];

  for (const p of pairs) {
    const ceiling = MONTHLY_VOLUME_CEILING[p.volumeRange];
    if (ceiling !== undefined && p.highTicket > ceiling) {
      ctx.addIssue({
        code: 'custom',
        path: [p.highField],
        message:
          `${p.highField} ($${p.highTicket.toLocaleString()}) cannot exceed the ${p.label} monthly ` +
          `volume band ${p.volumeRange} (up to $${ceiling.toLocaleString()}). ` +
          `Raise the monthly volume range or lower the high ticket.`,
      });
    }
  }
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agency = await requireAgencyKey(request);
    const { id } = await params;
    const merchantId = parseInt(id);
    if (isNaN(merchantId)) return apiError('Invalid merchant ID', 400);

    const body = await request.json();
    const parsed = onboardSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;

    const user = await prisma.user.findFirst({
      where: { id: merchantId, agencyId: agency.agencyId },
      include: {
        organizations: {
          take: 1,
          include: { fortisOnboarding: true },
        },
      },
    });

    if (!user) return apiError('Merchant not found', 404);

    const org = user.organizations[0];
    if (!org) return apiError('Merchant has no organization', 400);

    if (org.fortisOnboarding?.appStatus === 'ACTIVE') {
      return apiError('Merchant is already onboarded and active', 400);
    }

    // If MPA link already exists, return it
    if (org.fortisOnboarding?.mpaLink) {
      return Response.json({
        data: {
          status: 'BANK_INFORMATION_SENT',
          mpaLink: org.fortisOnboarding.mpaLink,
          mpaEmbedUrl: `https://app.lunarpay.com/onboarding/${org.token}`,
          message: 'Application already submitted. Returning existing MPA link.',
        },
      });
    }

    const fortisEnv = process.env.fortis_environment;
    const isTest = fortisEnv !== 'prd';
    const templateCode = isTest
      ? 'Testing1234'
      : (org.fortisTemplate || 'lunarpayfr');

    const cleanedPhone = cleanPhoneForFortis(data.phone);

    const merchantPayload: MerchantOnboardingData = {
      primary_principal: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: cleanedPhone,
        title: data.ownerTitle || 'Owner',
        ownership_percent: data.ownershipPercent ?? 100,
        date_of_birth: data.dateOfBirth || undefined,
        address_line_1: data.ownerAddressLine1 || data.addressLine1,
        city: data.ownerCity || data.city,
        state_province: data.ownerState || data.state,
        postal_code: data.ownerPostalCode || data.postalCode,
      },
      email: data.email,
      dba_name: data.dbaName,
      legal_name: data.legalName,
      template_code: templateCode,
      website: data.website || '',
      fed_tax_id: data.fedTaxId || undefined,
      ownership_type: (data.ownershipType as 'llc' | 'llp' | 'corporation' | 'sole_proprietorship' | 'partnership' | 'non_profit') || undefined,

      cc_average_ticket_range: data.ccAverageTicketRange,
      cc_monthly_volume_range: data.ccMonthlyVolumeRange,
      cc_high_ticket: data.ccHighTicket,
      ec_average_ticket_range: data.ecAverageTicketRange,
      ec_monthly_volume_range: data.ecMonthlyVolumeRange,
      ec_high_ticket: data.ecHighTicket,

      swiped_percent: 0,
      keyed_percent: 0,
      ecommerce_percent: 100,

      location: {
        address_line_1: data.addressLine1,
        address_line_2: data.addressLine2 || undefined,
        city: data.city,
        state_province: data.state,
        postal_code: data.postalCode,
        phone_number: cleanedPhone,
      },
      app_delivery: 'link_iframe',
      bank_account: {
        routing_number: data.routingNumber,
        account_number: data.accountNumber,
        account_holder_name: data.accountHolderName,
      },
      alt_bank_account: {
        routing_number: data.altRoutingNumber || data.routingNumber,
        account_number: data.altAccountNumber || data.accountNumber,
        account_holder_name: data.altAccountHolderName || data.accountHolderName,
        deposit_type: 'fees_adjustments',
      },
      contact: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: cleanedPhone,
      },
      client_app_id: org.id.toString(),
    };

    const fortisClient = createFortisClient();

    // Field-level audit of what we actually send, so the volume/percentage
    // mapping can be checked against Fortis's current spec without asking an
    // operator to reproduce a submission. The client's own request logging is
    // development-only, and this payload carries full bank account and routing
    // numbers — redacted here rather than logged, since the open question is
    // which FIELD NAMES arrive, not what the values are.
    console.log('[Agency Onboard] Fortis onboardMerchant payload:', JSON.stringify({
      ...merchantPayload,
      bank_account: {
        ...merchantPayload.bank_account,
        account_number: '***redacted***',
        routing_number: '***redacted***',
      },
      alt_bank_account: merchantPayload.alt_bank_account
        ? {
            ...merchantPayload.alt_bank_account,
            account_number: '***redacted***',
            routing_number: '***redacted***',
          }
        : undefined,
      primary_principal: {
        ...merchantPayload.primary_principal,
        date_of_birth: merchantPayload.primary_principal.date_of_birth ? '***redacted***' : undefined,
      },
      fed_tax_id: merchantPayload.fed_tax_id ? '***redacted***' : undefined,
    }));

    const result = await fortisClient.onboardMerchant(merchantPayload);

    console.log(
      '[Agency Onboard] Fortis onboardMerchant response:',
      JSON.stringify({ status: result.status, message: result.message, result: result.result })
    );

    if (!result.status) {
      console.error('[Agency Onboard] Fortis error:', JSON.stringify(result));

      const resultStr = JSON.stringify(result);
      if (resultStr.includes('Duplicate Client App ID') || resultStr.includes('E05')) {
        // Fortis already holds an application for this client_app_id but we
        // have no link stored (that is the only way execution reaches here —
        // an existing mpaLink short-circuits above). Recover the link from
        // Fortis instead of recording BANK_INFORMATION_SENT with mpa_link NULL,
        // which strands the merchant on "Application Not Ready" permanently
        // with only a manual DB write to get out.
        let recoveredLink: string | null = null;
        try {
          const existing = await fortisClient.getOnboardingStatus(org.id.toString());
          recoveredLink = existing.data?.app_link ?? null;
        } catch (lookupError) {
          console.error('[Agency Onboard] E05 link recovery failed:', lookupError);
        }

        if (org.fortisOnboarding) {
          // Guarded write: the recovery lookup above is a second network call,
          // widening the window in which the approval webhook could flip this
          // row to ACTIVE. Stamping BANK_INFORMATION_SENT over ACTIVE would 403
          // every charging endpoint for a merchant who is already live, because
          // api-auth gates on appStatus rather than on stored credentials.
          await prisma.fortisOnboarding.updateMany({
            where: { organizationId: org.id, appStatus: { not: 'ACTIVE' } },
            data: {
              appStatus: 'BANK_INFORMATION_SENT',
              ...(recoveredLink ? { mpaLink: recoveredLink } : {}),
              processorResponse: JSON.stringify(result),
            },
          });
        }

        if (recoveredLink) {
          return Response.json({
            data: {
              status: 'BANK_INFORMATION_SENT',
              mpaLink: recoveredLink,
              mpaEmbedUrl: `https://app.lunarpay.com/onboarding/${org.token}`,
              message: 'Application already existed at Fortis. Recovered the existing MPA link.',
            },
          });
        }

        // Deliberately still a 400 with the same shape as before. Partners
        // already branch on this status for the duplicate case; recovery adds a
        // success path above without moving the failure path out from under
        // them.
        return apiError(
          'Application already submitted to Fortis, but the MPA link could not be recovered. ' +
            'Use POST /api/admin/repair-mpa-link to restore it.',
          400
        );
      }

      if (org.fortisOnboarding) {
        await prisma.fortisOnboarding.update({
          where: { organizationId: org.id },
          data: { appStatus: 'FORM_ERROR', processorResponse: JSON.stringify(result) },
        });
      }

      const errorMsg = typeof result.message === 'string'
        ? result.message
        : (result.message ? JSON.stringify(result.message) : 'Onboarding failed');
      return apiError(errorMsg, 400);
    }

    const mpaLink = result.result?.data?.app_link || null;

    const onboardingData = {
      signFirstName: data.firstName,
      signLastName: data.lastName,
      signPhoneNumber: data.phone,
      email: data.email,
      merchantAddressLine1: data.addressLine1,
      merchantState: data.state,
      merchantCity: data.city,
      merchantPostalCode: data.postalCode,
      accountNumberLast4: data.accountNumber.slice(-4),
      routingNumberLast4: data.routingNumber.slice(-4),
      accountHolderName: data.accountHolderName,
      appStatus: 'BANK_INFORMATION_SENT',
      mpaLink,
      processorResponse: JSON.stringify(result.result),
      stepCompleted: 2,
    };

    if (org.fortisOnboarding) {
      await prisma.fortisOnboarding.update({
        where: { organizationId: org.id },
        data: onboardingData,
      });
    } else {
      await prisma.fortisOnboarding.create({
        data: { ...onboardingData, userId: user.id, organizationId: org.id },
      });
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { name: data.dbaName, legalName: data.legalName, website: data.website },
    });

    return Response.json({
      data: {
        status: 'BANK_INFORMATION_SENT',
        mpaLink,
        mpaEmbedUrl: mpaLink ? `https://app.lunarpay.com/onboarding/${org.token}` : null,
        message: 'Merchant onboarding submitted. Merchant must complete the MPA form.',
      },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/agency/merchants/:id/onboard POST]', e);
    return apiError('Internal server error', 500);
  }
}
