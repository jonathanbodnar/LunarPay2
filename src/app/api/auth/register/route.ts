import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, setAuthCookie, generateRandomToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
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
        
        const result = await prisma.$transaction(async (tx) => {
          // Create initial organization
          const orgToken = generateRandomToken(32);
          const organization = await tx.organization.create({
            data: {
              userId: existingUser.id,
              name: 'My Organization',
              token: orgToken,
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

          // Create Fortis onboarding
          await tx.fortisOnboarding.create({
            data: {
              userId: existingUser.id,
              organizationId: organization.id,
              appStatus: 'PENDING',
            },
          });

          return organization;
        });

        const token = generateToken({
          userId: existingUser.id,
          email: existingUser.email,
        });

        await setAuthCookie(token);

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

      // Create initial organization for user
      const orgToken = generateRandomToken(32);
      const organization = await tx.organization.create({
        data: {
          userId: user.id,
          name: 'My Organization',
          token: orgToken,
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

      // Create Fortis onboarding record
      await tx.fortisOnboarding.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          appStatus: 'PENDING',
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

    // Send welcome email (don't block on this)
    sendWelcomeEmail(
      result.user.email,
      result.user.firstName || 'there'
    ).catch(err => console.error('Failed to send welcome email:', err));

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

