import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, setAuthCookie, generateRandomToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { checkForSpam } from '@/lib/spam-detection';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  businessName: z.string().min(1, 'Business name is required'),
  paymentProcessor: z.enum(['FTS', 'PSF', 'EPP', 'ETH']).default('FTS'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        organizations: true,
      },
    });

    if (existingUser) {
      // If user exists but has no organization (partial registration), complete it
      if (existingUser.organizations.length === 0) {
        console.log('Completing partial registration for user:', existingUser.id);
        
        // Check for spam
        const spamCheck = checkForSpam(validatedData.businessName || 'My Organization', validatedData.email);
        if (spamCheck.isSpam) {
          console.log(`[REGISTRATION] Auto-restricting suspicious account: ${validatedData.email}, Reason: ${spamCheck.reason}`);
        }
        
        const result = await prisma.$transaction(async (tx) => {
          // Create initial organization with business name
          const orgToken = generateRandomToken(32);
          const organization = await tx.organization.create({
            data: {
              userId: existingUser.id,
              name: validatedData.businessName || 'My Organization',
              token: orgToken,
              restricted: spamCheck.isSpam,
              restrictedReason: spamCheck.isSpam ? spamCheck.reason : null,
              restrictedAt: spamCheck.isSpam ? new Date() : null,
            },
          });

          // Create chat settings
          await tx.chatSetting.create({
            data: {
              userId: existingUser.id,
              organizationId: organization.id,
              primaryColor: '#007bff',
              themeColor: '#007bff',
            },
          });

          // Create Fortis onboarding with pre-filled user data
          await tx.fortisOnboarding.create({
            data: {
              userId: existingUser.id,
              organizationId: organization.id,
              appStatus: 'PENDING',
              signFirstName: existingUser.firstName || validatedData.firstName,
              signLastName: existingUser.lastName || validatedData.lastName,
              signPhoneNumber: validatedData.phone,
              email: existingUser.email,
            },
          });

          return organization;
        });

        const token = generateToken({
          userId: existingUser.id,
          email: existingUser.email,
        });

        await setAuthCookie(token);

        // Send registration event to Zapier (don't block on this)
        fetch('https://hooks.zapier.com/hooks/catch/25882699/ueiw384/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: validatedData.businessName,
            email: validatedData.email,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            registeredAt: new Date().toISOString(),
          }),
        }).catch(err => console.error('Failed to send Zapier registration webhook:', err));

        return NextResponse.json(
          {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
            },
            organization: {
              id: result.id,
              name: result.name,
              token: result.token,
            },
            token,
          },
          { status: 201 }
        );
      }
      
      return NextResponse.json(
        { error: 'User with this email already exists. Try logging in or use password reset.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Check for spam/suspicious business names
    const spamCheck = checkForSpam(validatedData.businessName, validatedData.email);
    if (spamCheck.isSpam) {
      console.log(`[REGISTRATION] Auto-restricting suspicious account: ${validatedData.email}, Reason: ${spamCheck.reason}`);
    }

    // Use a transaction to ensure all-or-nothing registration
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          paymentProcessor: validatedData.paymentProcessor,
          active: true,
          starterStep: 1,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          paymentProcessor: true,
          starterStep: true,
        },
      });

      // Create initial organization for user with business name
      // Auto-restrict if spam detected
      const orgToken = generateRandomToken(32);
      const organization = await tx.organization.create({
        data: {
          userId: user.id,
          name: validatedData.businessName,
          token: orgToken,
          restricted: spamCheck.isSpam,
          restrictedReason: spamCheck.isSpam ? spamCheck.reason : null,
          restrictedAt: spamCheck.isSpam ? new Date() : null,
        },
      });

      // Create chat settings for organization
      await tx.chatSetting.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          primaryColor: '#007bff',
          themeColor: '#007bff',
        },
      });

      // Create Fortis onboarding record with pre-filled user data
      await tx.fortisOnboarding.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          appStatus: 'PENDING',
          signFirstName: validatedData.firstName,
          signLastName: validatedData.lastName,
          signPhoneNumber: validatedData.phone,
          email: validatedData.email,
        },
      });

      return { user, organization };
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
    });

    // Set cookie
    await setAuthCookie(token);

    // Mark any existing lead as converted (don't block on this)
    prisma.lead.updateMany({
      where: { email: validatedData.email.toLowerCase().trim(), converted: false },
      data: { converted: true, convertedAt: new Date() },
    }).catch(err => console.error('Failed to update lead:', err));

    // Send welcome email (don't block on this)
    sendWelcomeEmail(
      result.user.email,
      result.user.firstName || 'there'
    ).catch(err => console.error('Failed to send welcome email:', err));

    // Send registration event to Zapier (don't block on this)
    fetch('https://hooks.zapier.com/hooks/catch/25882699/ueiw384/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: validatedData.businessName,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        registeredAt: new Date().toISOString(),
      }),
    }).catch(err => console.error('Failed to send Zapier registration webhook:', err));

    return NextResponse.json(
      {
        user: result.user,
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          token: result.organization.token,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Registration validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    console.error('Error details:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

