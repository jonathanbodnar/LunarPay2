import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Validation schema for Merchant Information (Primary Principal + Merchant Business Info)
const merchantInfoSchema = z.object({
  organizationId: z.number().int().positive('Organization ID is required'),
  
  // Primary Principal Information
  signFirstName: z.string().min(1, 'First name is required').max(100),
  signLastName: z.string().min(1, 'Last name is required').max(100),
  signPhoneNumber: z.string().min(1, 'Phone number is required').max(50),
  email: z.string().email('Valid email is required').max(255),
  
  // Merchant Information
  dbaName: z.string().min(1, 'Company name (DBA) is required').max(255),
  legalName: z.string().min(1, 'Legal name is required').max(255),
  website: z.string().max(255).optional().or(z.literal('')),
  
  // Merchant Address
  merchantAddressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  merchantState: z.string().min(1, 'State is required').max(50),
  merchantCity: z.string().min(1, 'City is required').max(100),
  merchantPostalCode: z.string().min(1, 'Postal code is required').max(20),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    
    // Validate input
    const validatedData = merchantInfoSchema.parse(body);
    
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

    // Check if already completed onboarding (future-proof for additional statuses)
    const completedStatuses = ['ACTIVE'];
    if (organization.fortisOnboarding?.appStatus && 
        completedStatuses.includes(organization.fortisOnboarding.appStatus)) {
      return NextResponse.json(
        { status: false, message: 'Organization already onboarded' },
        { status: 400 }
      );
    }

    // Validate website format (similar to PHP website_check)
    let website = validatedData.website || '';
    if (website) {
      // Add http:// if not present
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        website = 'http://' + website;
      }
      
      // Validate URL format
      try {
        new URL(website);
        // Check if it has at least 2 parts (domain.tld)
        const urlParts = website.replace(/^https?:\/\//, '').split('.');
        if (urlParts.length < 2) {
          throw new Error('Invalid URL');
        }
      } catch (error) {
        return NextResponse.json(
          { status: false, message: 'A valid website URL is required' },
          { status: 400 }
        );
      }
    }

    // Update organization with merchant information
    const updatedOrganization = await prisma.organization.update({
      where: { id: validatedData.organizationId },
      data: {
        name: validatedData.dbaName.trim().replace(/\s+/g, ' '), // Remove extra spaces
        legalName: validatedData.legalName,
        website: website || null,
        email: validatedData.email,
        phoneNumber: validatedData.signPhoneNumber,
        streetAddress: validatedData.merchantAddressLine1,
        state: validatedData.merchantState,
        city: validatedData.merchantCity,
        postal: validatedData.merchantPostalCode,
      },
    });

    // Update or create Fortis onboarding record with type safety
    const onboardingData: Prisma.FortisOnboardingUpdateInput = {
      signFirstName: validatedData.signFirstName,
      signLastName: validatedData.signLastName,
      signPhoneNumber: validatedData.signPhoneNumber,
      email: validatedData.email,
      merchantAddressLine1: validatedData.merchantAddressLine1,
      merchantState: validatedData.merchantState,
      merchantCity: validatedData.merchantCity,
      merchantPostalCode: validatedData.merchantPostalCode,
      stepCompleted: 1, // Merchant information step completed
    };

    if (organization.fortisOnboarding) {
      await prisma.fortisOnboarding.update({
        where: { organizationId: validatedData.organizationId },
        data: onboardingData,
      });
    } else {
      // Create new onboarding record - use relation connect for organization
      await prisma.fortisOnboarding.create({
        data: {
          signFirstName: validatedData.signFirstName,
          signLastName: validatedData.signLastName,
          signPhoneNumber: validatedData.signPhoneNumber,
          email: validatedData.email,
          merchantAddressLine1: validatedData.merchantAddressLine1,
          merchantState: validatedData.merchantState,
          merchantCity: validatedData.merchantCity,
          merchantPostalCode: validatedData.merchantPostalCode,
          stepCompleted: 1,
          userId: currentUser.userId,
          organization: { connect: { id: validatedData.organizationId } },
          appStatus: 'PENDING',
        },
      });
    }

    // Update chat settings domain if exists
    const chatSetting = await prisma.chatSetting.findFirst({
      where: {
        userId: currentUser.userId,
        organizationId: validatedData.organizationId,
      },
    });

    if (chatSetting && website) {
      await prisma.chatSetting.update({
        where: { id: chatSetting.id },
        data: { domain: website },
      });
    }

    return NextResponse.json({
      status: true,
      message: 'Merchant information saved successfully',
      organizationId: updatedOrganization.id,
      stepCompleted: 1,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message).join(', ');
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

    console.error('Merchant info onboarding error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

