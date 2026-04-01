import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { MerchantOnboardingData } from '@/types/fortis';
import { cleanPhoneForFortis } from '@/lib/utils';

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
      // Volume estimates (ranges 1-7 for avg ticket / monthly volume, dollar amount for high ticket)
      ccAverageTicketRange,
      ccMonthlyVolumeRange,
      ccHighTicket,
      ecAverageTicketRange,
      ecMonthlyVolumeRange,
      ecHighTicket,
    } = body;

    // Validate volume fields
    const ccVolRange = parseInt(ccMonthlyVolumeRange) || 0;
    const ccAvgRange = parseInt(ccAverageTicketRange) || 0;
    const ccHi = parseInt(ccHighTicket) || 0;
    const ecVolRange = parseInt(ecMonthlyVolumeRange) || 0;
    const ecAvgRange = parseInt(ecAverageTicketRange) || 0;
    const ecHi = parseInt(ecHighTicket) || 0;

    if (!ccVolRange || !ccAvgRange || !ccHi || !ecVolRange || !ecAvgRange || !ecHi) {
      return NextResponse.json({ error: 'All volume fields are required.' }, { status: 400 });
    }
    if (ccVolRange < ccAvgRange) {
      return NextResponse.json({ error: 'CC Monthly Volume range must be >= CC Average Ticket range.' }, { status: 400 });
    }
    if (ecVolRange < ecAvgRange) {
      return NextResponse.json({ error: 'eCheck Monthly Volume range must be >= eCheck Average Ticket range.' }, { status: 400 });
    }

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

    // Check if already onboarded (ACTIVE status)
    if (organization.fortisOnboarding?.appStatus === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Organization already onboarded' },
        { status: 400 }
      );
    }

    // If a Fortis application already exists for this org (any status with an mpaLink),
    // return the existing link instead of calling Fortis again (which would fail with
    // "Duplicate Client App ID"). This covers BANK_INFORMATION_SENT, PENDING, FORM_ERROR, etc.
    if (organization.fortisOnboarding?.mpaLink) {
      console.log('[Fortis Onboard] Returning existing MPA link for org:', organizationId, 'status:', organization.fortisOnboarding.appStatus);

      // Update bank info in case the user changed it before re-submitting
      await prisma.fortisOnboarding.update({
        where: { organizationId },
        data: {
          accountHolderName: accountHolderName || undefined,
          appStatus: 'BANK_INFORMATION_SENT',
        },
      });

      return NextResponse.json({
        status: true,
        appLink: organization.fortisOnboarding.mpaLink,
        appStatus: 'BANK_INFORMATION_SENT',
        message: 'Returning existing merchant application link',
      });
    }

    // Determine test mode (fortis_environment: 'dev' or 'prd')
    const fortisEnv = process.env.fortis_environment;
    const isTest = fortisEnv !== 'prd';
    const templateCode = isTest ? 'Testing1234' : (organization.fortisTemplate || process.env.FORTIS_TPL_DEFAULT || 'ActiveBase4');
    
    console.log('[Fortis Onboard] Environment:', fortisEnv, 'isTest:', isTest, 'templateCode:', templateCode);
    console.log('[Fortis Onboard] Bank info received - routing:', routingNumber?.slice(-4), 'account:', accountNumber?.slice(-4));
    console.log('[Fortis Onboard] Merchant data:', {
      firstName: signFirstName,
      lastName: signLastName,
      phone: signPhoneNumber,
      email,
      dbaName,
      legalName,
      website,
      address: addressLine1,
      city,
      state,
      postalCode,
    });

    const cleanedPhone = cleanPhoneForFortis(signPhoneNumber);

    // Prepare Fortis onboarding data (only allowed fields)
    const merchantData: MerchantOnboardingData = {
      primary_principal: {
        first_name: signFirstName,
        last_name: signLastName,
        phone_number: cleanedPhone,
        title: ownerTitle || 'Owner',
        ownership_percent: ownershipPercent ? parseInt(ownershipPercent) : 100,
        date_of_birth: dateOfBirth || undefined,
        address_line_1: ownerAddressLine1 || addressLine1,
        city: ownerCity || city,
        state_province: ownerState || state,
        postal_code: ownerPostalCode || postalCode,
      },
      email,
      dba_name: dbaName,
      legal_name: legalName,
      template_code: templateCode,
      website,
      fed_tax_id: fedTaxId || undefined,
      ownership_type: ownershipType || undefined,

      cc_average_ticket_range: ccAvgRange,
      cc_monthly_volume_range: ccVolRange,
      cc_high_ticket: ccHi,
      ec_average_ticket_range: ecAvgRange,
      ec_monthly_volume_range: ecVolRange,
      ec_high_ticket: ecHi,

      // 100% ecommerce since LunarPay is online-only
      swiped_percent: 0,
      keyed_percent: 0,
      ecommerce_percent: 100,

      location: {
        address_line_1: addressLine1,
        address_line_2: addressLine2 || undefined,
        city,
        state_province: state,
        postal_code: postalCode,
        phone_number: cleanedPhone,
      },
      app_delivery: 'link_iframe',
      bank_account: {
        routing_number: routingNumber,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
      },
      alt_bank_account: {
        routing_number: altRoutingNumber || routingNumber,
        account_number: altAccountNumber || accountNumber,
        account_holder_name: altAccountHolderName || accountHolderName,
        deposit_type: 'fees_adjustments',
      },
      contact: {
        first_name: signFirstName,
        last_name: signLastName,
        phone_number: cleanedPhone,
      },
      client_app_id: organizationId.toString(),
    };

    // Call Fortis API
    const fortisClient = createFortisClient();
    const result = await fortisClient.onboardMerchant(merchantData);

    if (!result.status) {
      console.error('[Fortis Onboard] API Error:', JSON.stringify(result, null, 2));

      // Check for "Duplicate Client App ID" -- means we already have an application at Fortis
      const resultStr = JSON.stringify(result);
      if (resultStr.includes('Duplicate Client App ID') || resultStr.includes('E05')) {
        console.log('[Fortis Onboard] Duplicate detected, checking for existing record');
        
        // If we have an existing onboarding record with bank info saved, just move to BANK_INFORMATION_SENT
        if (organization.fortisOnboarding) {
          await prisma.fortisOnboarding.update({
            where: { organizationId },
            data: {
              appStatus: 'BANK_INFORMATION_SENT',
              processorResponse: JSON.stringify(result),
            },
          });

          // If there's an mpa_link, return it
          if (organization.fortisOnboarding.mpaLink) {
            return NextResponse.json({
              status: true,
              appLink: organization.fortisOnboarding.mpaLink,
              appStatus: 'BANK_INFORMATION_SENT',
              message: 'Application already submitted. Returning existing link.',
            });
          }
        }

        return NextResponse.json(
          { error: 'Your application has already been submitted to Fortis. Please check your email for the MPA verification link, or contact support if you need assistance.' },
          { status: 400 }
        );
      }
      
      // Update onboarding record with error
      try {
        await prisma.fortisOnboarding.update({
          where: { organizationId },
          data: {
            appStatus: 'FORM_ERROR',
            processorResponse: JSON.stringify(result),
          },
        });
      } catch (dbError) {
        console.error('[Fortis Onboard] DB update error:', dbError);
      }

      const errorMessage = typeof result.message === 'string' 
        ? result.message 
        : (result.message ? JSON.stringify(result.message) : 'Onboarding failed');

      return NextResponse.json(
        { 
          error: errorMessage,
          details: result,
        },
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

    // Send onboarding completion event to Zapier (don't block on this)
    fetch('https://hooks.zapier.com/hooks/catch/25882699/ueiwms2/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: dbaName || legalName,
        email,
        firstName: signFirstName,
        lastName: signLastName,
        organizationId,
        onboardedAt: new Date().toISOString(),
      }),
    }).catch(err => console.error('Failed to send Zapier onboarding webhook:', err));

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

