import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { MerchantOnboardingData } from '@/types/fortis';

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const {
      organizationId,
      signFirstName,
      signLastName,
      signPhoneNumber,
      email,
      dbaName,
      legalName,
      website,
      addressLine1,
      state,
      city,
      postalCode,
      routingNumber,
      accountNumber,
      accountHolderName,
      altRoutingNumber,
      altAccountNumber,
      altAccountHolderName,
    } = body;

    // Verify user owns this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if already onboarded
    if (organization.fortisOnboarding?.appStatus === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Organization already onboarded' },
        { status: 400 }
      );
    }

    // Determine test mode
    const isTest = process.env.FORTIS_ENVIRONMENT !== 'prd';
    const templateCode = isTest ? 'Testing1234' : (organization.fortisTemplate || 'ActiveBase4');

    // Prepare Fortis onboarding data
    const merchantData: MerchantOnboardingData = {
      primary_principal: {
        first_name: signFirstName,
        last_name: signLastName,
        phone_number: signPhoneNumber,
      },
      email,
      dba_name: dbaName,
      template_code: templateCode,
      website,
      location: {
        address_line_1: addressLine1,
        state_province: state,
        city,
        postal_code: postalCode,
        phone_number: signPhoneNumber,
      },
      app_delivery: 'link_iframe',
      bank_account: {
        routing_number: routingNumber,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
      },
      alt_bank_account: {
        routing_number: altRoutingNumber,
        account_number: altAccountNumber,
        account_holder_name: altAccountHolderName,
      },
      legal_name: legalName,
      contact: {
        phone_number: signPhoneNumber,
      },
      client_app_id: organizationId.toString(),
    };

    // Call Fortis API
    const fortisClient = createFortisClient();
    const result = await fortisClient.onboardMerchant(merchantData);

    if (!result.status) {
      // Update onboarding record with error
      await prisma.fortisOnboarding.update({
        where: { organizationId },
        data: {
          appStatus: 'FORM_ERROR',
          processorResponse: JSON.stringify(result),
        },
      });

      return NextResponse.json(
        { error: result.message || 'Onboarding failed' },
        { status: 400 }
      );
    }

    // Save onboarding details
    const onboardingData = {
      signFirstName,
      signLastName,
      signPhoneNumber,
      email,
      merchantAddressLine1: addressLine1,
      merchantState: state,
      merchantCity: city,
      merchantPostalCode: postalCode,
      accountNumberLast4: accountNumber.slice(-4),
      routingNumberLast4: routingNumber.slice(-4),
      accountHolderName,
      account2NumberLast4: altAccountNumber.slice(-4),
      routing2NumberLast4: altRoutingNumber.slice(-4),
      account2HolderName: altAccountHolderName,
      appStatus: 'BANK_INFORMATION_SENT',
      mpaLink: result.result?.data?.app_link || null,
      processorResponse: JSON.stringify(result.result),
    };

    // Update or create onboarding record
    if (organization.fortisOnboarding) {
      await prisma.fortisOnboarding.update({
        where: { organizationId },
        data: onboardingData,
      });
    } else {
      await prisma.fortisOnboarding.create({
        data: {
          ...onboardingData,
          userId: currentUser.userId,
          organizationId,
        },
      });
    }

    // Update organization details
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dbaName,
        legalName,
        website,
      },
    });

    return NextResponse.json({
      status: true,
      appLink: result.result?.data?.app_link,
      appStatus: 'BANK_INFORMATION_SENT',
      message: 'Merchant onboarding initiated successfully',
    });
  } catch (error) {
    console.error('Fortis onboarding error:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

