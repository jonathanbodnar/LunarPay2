import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, setAuthCookie, generateRandomToken } from '@/lib/auth';
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
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
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

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Set cookie
    await setAuthCookie(token);

    // Create initial organization for user
    const orgToken = generateRandomToken(32);
    const organization = await prisma.organization.create({
      data: {
        userId: user.id,
        name: 'My Organization',
        token: orgToken,
      },
    });

    // Create chat settings for organization
    await prisma.chatSetting.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        primaryColor: '#007bff',
        themeColor: '#007bff',
      },
    });

    // Create Fortis onboarding record
    await prisma.fortisOnboarding.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        appStatus: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        user,
        organization: {
          id: organization.id,
          name: organization.name,
          token: organization.token,
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

