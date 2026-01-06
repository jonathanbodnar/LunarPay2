import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER USE
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const orgId = searchParams.get('orgId') || '1';

  try {
    // Check if customer exists
    const customer = await prisma.donor.findFirst({
      where: {
        email: email?.toLowerCase(),
        organizationId: parseInt(orgId),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Check recent OTPs
    const recentOtps = await prisma.$queryRaw<Array<{
      id: number;
      email: string;
      code: string;
      expires_at: Date;
      used: boolean;
      created_at: Date;
    }>>`
      SELECT id, email, code, expires_at, used, created_at
      FROM customer_otp
      WHERE organization_id = ${parseInt(orgId)}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Check SendGrid config
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const sendgridFrom = process.env.SENDGRID_FROM_EMAIL;

    return NextResponse.json({
      customerFound: !!customer,
      customer: customer ? {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
      } : null,
      recentOtps: recentOtps.map(otp => ({
        ...otp,
        code: '***' + otp.code.slice(-2), // Partially hide code
      })),
      sendgrid: {
        keyConfigured: !!sendgridKey,
        keyPrefix: sendgridKey ? sendgridKey.substring(0, 10) + '...' : null,
        fromEmail: sendgridFrom || 'noreply@lunarpay.com (default)',
      },
    });
  } catch (error) {
    console.error('Debug email error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    );
  }
}

