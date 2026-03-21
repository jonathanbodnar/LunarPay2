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

  // Bank info
  routingNumber: z.string().min(9).max(9),
  accountNumber: z.string().min(4).max(17),
  accountHolderName: z.string().min(1).max(255),
  altRoutingNumber: z.string().min(9).max(9).optional(),
  altAccountNumber: z.string().min(4).max(17).optional(),
  altAccountHolderName: z.string().max(255).optional(),
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
      : (org.fortisTemplate || process.env.FORTIS_TPL_DEFAULT || 'ActiveBase4');

    const merchantPayload: MerchantOnboardingData = {
      primary_principal: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
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
      website: data.website,
      fed_tax_id: data.fedTaxId || undefined,
      ownership_type: data.ownershipType || undefined,
      location: {
        address_line_1: data.addressLine1,
        address_line_2: data.addressLine2 || undefined,
        city: data.city,
        state_province: data.state,
        postal_code: data.postalCode,
        phone_number: data.phone,
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
        phone_number: data.phone,
      },
      client_app_id: org.id.toString(),
    };

    const fortisClient = createFortisClient();
    const result = await fortisClient.onboardMerchant(merchantPayload);

    if (!result.status) {
      console.error('[Agency Onboard] Fortis error:', JSON.stringify(result));

      const resultStr = JSON.stringify(result);
      if (resultStr.includes('Duplicate Client App ID') || resultStr.includes('E05')) {
        if (org.fortisOnboarding) {
          await prisma.fortisOnboarding.update({
            where: { organizationId: org.id },
            data: { appStatus: 'BANK_INFORMATION_SENT', processorResponse: JSON.stringify(result) },
          });
        }
        return apiError('Application already submitted to Fortis. Check merchant status for MPA link.', 400);
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
