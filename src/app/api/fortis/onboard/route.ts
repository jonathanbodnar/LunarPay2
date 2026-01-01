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
      // Primary contact
      signFirstName,
      signLastName,
      signPhoneNumber,
      email,
      // Business info
      dbaName,
      legalName,
      website,
      fedTaxId,
      ownershipType,
      // Owner details (optional)
      ownerTitle,
      ownershipPercent,
      dateOfBirth,
      ownerAddressLine1,
      ownerCity,
      ownerState,
      ownerPostalCode,
      // Business address
      addressLine1,
      addressLine2,
      state,
      city,
      postalCode,
      // Volume estimates (optional)
      annualRevenue,
      averageTicket,
      highestTicket,
      // Bank info
      routingNumber,
      accountNumber,
      accountHolderName,
      accountType,
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

    // Determine test mode (fortis_environment: 'dev' or 'prd')
    const isTest = process.env.fortis_environment !== 'prd';
    const templateCode = isTest ? 'Testing1234' : (organization.fortisTemplate || process.env.FORTIS_TPL_DEFAULT || 'ActiveBase4');

    // Prepare Fortis onboarding data with all available fields
    const merchantData: MerchantOnboardingData = {
      // Primary principal (owner) with all available details
      primary_principal: {
        first_name: signFirstName,
        last_name: signLastName,
        phone_number: signPhoneNumber,
        email: email,
        title: ownerTitle || 'Owner',
        ownership_percent: ownershipPercent ? parseInt(ownershipPercent) : 100,
        date_of_birth: dateOfBirth || undefined,
        // Owner's home address (if different from business)
        address_line_1: ownerAddressLine1 || addressLine1,
        city: ownerCity || city,
        state_province: ownerState || state,
        postal_code: ownerPostalCode || postalCode,
        country: 'US',
      },
      
      // Business contact
      email,
      
      // Business names
      dba_name: dbaName,
      legal_name: legalName,
      
      // Business details
      template_code: templateCode,
      website,
      fed_tax_id: fedTaxId || undefined,
      ownership_type: ownershipType || undefined,
      
      // Volume estimates (convert to cents if provided as dollars)
      annual_revenue: annualRevenue ? parseInt(annualRevenue) * 100 : undefined,
      average_ticket: averageTicket ? parseInt(averageTicket) * 100 : undefined,
      highest_ticket: highestTicket ? parseInt(highestTicket) * 100 : undefined,
      
      // Business location
      location: {
        address_line_1: addressLine1,
        address_line_2: addressLine2 || undefined,
        city,
        state_province: state,
        postal_code: postalCode,
        country: 'US',
        phone_number: signPhoneNumber,
      },
      
      // Application delivery as embedded iframe
      app_delivery: 'link_iframe',
      
      // Bank accounts
      bank_account: {
        routing_number: routingNumber,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        account_type: accountType || 'checking',
      },
      alt_bank_account: {
        routing_number: altRoutingNumber,
        account_number: altAccountNumber,
        account_holder_name: altAccountHolderName,
        account_type: accountType || 'checking',
      },
      
      // Contact information
      contact: {
        first_name: signFirstName,
        last_name: signLastName,
        phone_number: signPhoneNumber,
        email: email,
      },
      
      // Our internal organization ID for webhook matching
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

