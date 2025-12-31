import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/portal/auth/request-code - Request OTP code for customer login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, portalSlug } = body;

    if (!email || !portalSlug) {
      return NextResponse.json(
        { error: 'Email and portal slug are required' },
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
        portalSlug: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Portal not found or not enabled' },
        { status: 404 }
      );
    }

    // Find the customer (donor) by email in this organization
    const customer = await prisma.donor.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: organization.id,
      },
      select: {
        id: true,
        firstName: true,
        email: true,
      },
    });

    if (!customer) {
      // Don't reveal if customer doesn't exist for security
      // But still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a code has been sent.',
      });
    }

    // Generate 6-digit OTP code
    const code = crypto.randomInt(100000, 999999).toString();

    // Delete any existing unused OTP for this email/org
    await prisma.customerOtp.deleteMany({
      where: {
        email: email.toLowerCase(),
        organizationId: organization.id,
        used: false,
      },
    });

    // Create new OTP (expires in 10 minutes)
    await prisma.customerOtp.create({
      data: {
        email: email.toLowerCase(),
        organizationId: organization.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // TODO: Send email with the code
    // For now, we'll log it (in production, integrate with email service)
    console.log(`[PORTAL AUTH] OTP Code for ${email}: ${code}`);

    // In development, return the code for testing
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a code has been sent.',
      ...(isDev && { code }), // Only include code in development
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

