import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/portal/auth/verify-code - Verify OTP code and create session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, portalSlug } = body;

    if (!email || !code || !portalSlug) {
      return NextResponse.json(
        { error: 'Email, code, and portal slug are required' },
        { status: 400 }
      );
    }

    // Find the organization by portal slug
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { portalSlug: portalSlug },
          { slug: portalSlug },
        ],
        portalEnabled: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Portal not found or not enabled' },
        { status: 404 }
      );
    }

    // Find the OTP
    const otp = await prisma.customerOtp.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: organization.id,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otp) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Find the customer
    const customer = await prisma.donor.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: organization.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Mark OTP as used
    await prisma.customerOtp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Create session (expires in 7 days)
    await prisma.customerSession.create({
      data: {
        donorId: customer.id,
        organizationId: organization.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
    });

    response.cookies.set('portal_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}

