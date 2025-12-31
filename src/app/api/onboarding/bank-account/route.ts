import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, getLast4Digits } from '@/lib/encryption';
import { z } from 'zod';

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

    // Check if merchant info is completed
    if (!organization.fortisOnboarding || 
        (organization.fortisOnboarding.stepCompleted !== null && organization.fortisOnboarding.stepCompleted < 1)) {
      return NextResponse.json(
        { status: false, message: 'Please complete merchant information first' },
        { status: 400 }
      );
    }

    // Check if already completed onboarding
    if (organization.fortisOnboarding.appStatus === 'ACTIVE') {
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

    // Prepare update data
    const updateData: any = {
      achAccountNumber: encryptedAccountNumber,
      achRoutingNumber: encryptedRoutingNumber,
      accountNumberLast4,
      routingNumberLast4,
      accountHolderName: validatedData.accountHolderName,
    };
    
    // Add stepCompleted - will work after Prisma Client is regenerated and server restarted
    // If you get an error, restart the Next.js dev server after running: npx prisma generate
    updateData.stepCompleted = 2;

    // Handle alternative bank account if provided
    if (validatedData.achAccountNumber2 && validatedData.achRoutingNumber2 && validatedData.accountHolderName2) {
      updateData.achAccountNumber2 = encrypt(validatedData.achAccountNumber2);
      updateData.achRoutingNumber2 = encrypt(validatedData.achRoutingNumber2);
      updateData.account2NumberLast4 = getLast4Digits(validatedData.achAccountNumber2);
      updateData.routing2NumberLast4 = getLast4Digits(validatedData.achRoutingNumber2);
      updateData.account2HolderName = validatedData.accountHolderName2;
    }

    // Update Fortis onboarding record
    await prisma.fortisOnboarding.update({
      where: { organizationId: validatedData.organizationId },
      data: updateData,
    });

    return NextResponse.json({
      status: true,
      message: 'Bank account information saved successfully',
      organizationId: validatedData.organizationId,
      stepCompleted: 2,
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

