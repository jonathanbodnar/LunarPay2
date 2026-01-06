import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { encrypt, getLast4Digits } from '@/lib/encryption';
import { z } from 'zod';
import { createFortisClient } from '@/lib/fortis/client';
import { MerchantOnboardingData } from '@/types/fortis';

// Validation schema for Bank Account Information
const bankAccountSchema = z.object({
  organizationId: z.number().int().positive('Organization ID is required'),
  
  // Primary Bank Account
  achAccountNumber: z.string()
    .min(4, 'Account number must be at least 4 digits')
    .max(17, 'Account number is too long')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  achRoutingNumber: z.string()
    .min(9, 'Routing number must be 9 digits')
    .max(9, 'Routing number must be 9 digits')
    .regex(/^\d+$/, 'Routing number must contain only digits'),
  accountHolderName: z.string()
    .min(1, 'Account holder name is required')
    .max(255, 'Account holder name is too long'),
  
  // Alternative Bank Account (optional but recommended)
  achAccountNumber2: z.string()
    .min(4, 'Account number must be at least 4 digits')
    .max(17, 'Account number is too long')
    .regex(/^\d+$/, 'Account number must contain only digits')
    .optional(),
  achRoutingNumber2: z.string()
    .min(9, 'Routing number must be 9 digits')
    .max(9, 'Routing number must be 9 digits')
    .regex(/^\d+$/, 'Routing number must contain only digits')
    .optional(),
  accountHolderName2: z.string()
    .min(1, 'Account holder name is required')
    .max(255, 'Account holder name is too long')
    .optional(),
}).refine(
  (data) => {
    // If alternative account is provided, all fields must be present
    if (data.achAccountNumber2 || data.achRoutingNumber2 || data.accountHolderName2) {
      return data.achAccountNumber2 && data.achRoutingNumber2 && data.accountHolderName2;
    }
    return true;
  },
  {
    message: 'If providing alternative bank account, all fields (account number, routing number, and holder name) are required',
    path: ['achAccountNumber2'],
  }
);

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    
    // Validate input
    const validatedData = bankAccountSchema.parse(body);
    
    // Verify user owns this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: validatedData.organizationId,
        userId: currentUser.userId,
      },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { status: false, message: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Check if merchant info is completed (stepCompleted defaults to 0, so < 1 means not started)
    if (!organization.fortisOnboarding || 
        (organization.fortisOnboarding.stepCompleted ?? 0) < 1) {
      return NextResponse.json(
        { status: false, message: 'Please complete merchant information first' },
        { status: 400 }
      );
    }

    // Check if already completed onboarding (future-proof for additional statuses)
    const completedStatuses = ['ACTIVE'];
    if (organization.fortisOnboarding.appStatus && 
        completedStatuses.includes(organization.fortisOnboarding.appStatus)) {
      return NextResponse.json(
        { status: false, message: 'Organization already onboarded' },
        { status: 400 }
      );
    }

    // Encrypt bank account numbers (store full numbers encrypted, last 4 for display)
    const encryptedAccountNumber = encrypt(validatedData.achAccountNumber);
    const encryptedRoutingNumber = encrypt(validatedData.achRoutingNumber);
    const accountNumberLast4 = getLast4Digits(validatedData.achAccountNumber);
    const routingNumberLast4 = getLast4Digits(validatedData.achRoutingNumber);

    // Prepare update data with type safety
    const updateData: Prisma.FortisOnboardingUpdateInput = {
      achAccountNumber: encryptedAccountNumber,
      achRoutingNumber: encryptedRoutingNumber,
      accountNumberLast4,
      routingNumberLast4,
      accountHolderName: validatedData.accountHolderName,
      stepCompleted: 2, // Bank account step completed
    };

    // Handle alternative bank account if provided (consistent naming with primary account)
    if (validatedData.achAccountNumber2 && validatedData.achRoutingNumber2 && validatedData.accountHolderName2) {
      updateData.achAccountNumber2 = encrypt(validatedData.achAccountNumber2);
      updateData.achRoutingNumber2 = encrypt(validatedData.achRoutingNumber2);
      updateData.account2NumberLast4 = getLast4Digits(validatedData.achAccountNumber2);
      updateData.routing2NumberLast4 = getLast4Digits(validatedData.achRoutingNumber2);
      updateData.account2HolderName = validatedData.accountHolderName2;
    }

    // Update Fortis onboarding record with bank account info first
    await prisma.fortisOnboarding.update({
      where: { organizationId: validatedData.organizationId },
      data: updateData,
    });

    // Now call Fortis onboarding API with all merchant data
    const onboarding = organization.fortisOnboarding;
    
    // Determine test mode - treat 'dev', 'development', 'test' as sandbox
    const envRaw = process.env.FORTIS_ENVIRONMENT || 'sandbox';
    const isTest = envRaw !== 'prd' && envRaw !== 'production' && envRaw !== 'prod';
    const templateCode = isTest ? 'Testing1234' : (organization.fortisTemplate || 'ActiveBase4');

    // Prepare Fortis onboarding data combining step 1 and step 2 data
    const merchantData: MerchantOnboardingData = {
      primary_principal: {
        first_name: onboarding.signFirstName || '',
        last_name: onboarding.signLastName || '',
        phone_number: onboarding.signPhoneNumber || '',
      },
      email: onboarding.email || '',
      dba_name: organization.name || '',
      template_code: templateCode,
      website: organization.website || '',
      location: {
        address_line_1: onboarding.merchantAddressLine1 || '',
        state_province: onboarding.merchantState || '',
        city: onboarding.merchantCity || '',
        postal_code: onboarding.merchantPostalCode || '',
        phone_number: onboarding.signPhoneNumber || '',
      },
      app_delivery: 'link_iframe',
      bank_account: {
        routing_number: validatedData.achRoutingNumber,
        account_number: validatedData.achAccountNumber,
        account_holder_name: validatedData.accountHolderName,
      },
      alt_bank_account: validatedData.achAccountNumber2 && validatedData.achRoutingNumber2 && validatedData.accountHolderName2 ? {
        routing_number: validatedData.achRoutingNumber2,
        account_number: validatedData.achAccountNumber2,
        account_holder_name: validatedData.accountHolderName2,
      } : {
        routing_number: validatedData.achRoutingNumber,
        account_number: validatedData.achAccountNumber,
        account_holder_name: validatedData.accountHolderName,
      },
      legal_name: organization.legalName || organization.name || '',
      contact: {
        phone_number: onboarding.signPhoneNumber || '',
      },
      client_app_id: validatedData.organizationId.toString(),
    };

    // Call Fortis API
    let fortisClient;
    try {
      fortisClient = createFortisClient();
    } catch (error) {
      console.error('[Bank Account Onboarding] Failed to create Fortis client:', error);
      return NextResponse.json(
        { 
          status: false, 
          message: (error as Error).message || 'Failed to initialize Fortis client',
          stepCompleted: 2,
        },
        { status: 500 }
      );
    }
    
    const fortisResult = await fortisClient.onboardMerchant(merchantData);

    // Extract mpa_link from Fortis response
    const mpaLink = fortisResult.result?.data?.app_link || null;

    // Update onboarding record with mpa_link and status
    await prisma.fortisOnboarding.update({
      where: { organizationId: validatedData.organizationId },
      data: {
        appStatus: fortisResult.status ? 'BANK_INFORMATION_SENT' : 'FORM_ERROR',
        mpaLink: mpaLink,
        processorResponse: JSON.stringify(fortisResult.result),
      },
    });

    if (!fortisResult.status) {
      // Log detailed error for debugging
      console.error('[Bank Account Onboarding] Fortis API failed:', {
        message: fortisResult.message,
        result: fortisResult.result,
        organizationId: validatedData.organizationId,
        errorDetail: (fortisResult.result as any)?.detail,
      });
      
      return NextResponse.json(
        { 
          status: false, 
          message: fortisResult.message || 'Fortis onboarding failed',
          stepCompleted: 2,
          error: (fortisResult.result as any)?.detail || fortisResult.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      message: 'Bank account information saved and merchant onboarding initiated successfully',
      organizationId: validatedData.organizationId,
      stepCompleted: 2,
      mpaLink: mpaLink, // Return MPA link for frontend to display
      appStatus: 'BANK_INFORMATION_SENT',
      // Return only last 4 digits for confirmation (never full numbers)
      bankAccountInfo: {
        accountNumberLast4,
        routingNumberLast4,
        accountHolderName: validatedData.accountHolderName,
        hasAlternativeAccount: !!(validatedData.achAccountNumber2 && validatedData.achRoutingNumber2),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      }).join(', ');
      return NextResponse.json(
        { status: false, message: errorMessages },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { status: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Bank account onboarding error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

