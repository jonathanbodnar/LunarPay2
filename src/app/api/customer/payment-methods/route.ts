import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const addPaymentMethodSchema = z.object({
  token: z.string(),
  type: z.enum(['card', 'bank']),
  setAsDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const customerId = decoded.customerId;

    const paymentMethods = await prisma.source.findMany({
      where: { donorId: customerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const customerId = decoded.customerId;

    const body = await request.json();
    const validatedData = addPaymentMethodSchema.parse(body);

    // TODO: Tokenize with payment processor
    // For now, create a placeholder

    const paymentMethod = await prisma.source.create({
      data: {
        donorId: customerId,
        type: validatedData.type,
        token: validatedData.token,
        isDefault: validatedData.setAsDefault || false,
        // Additional fields would come from tokenization response
      },
    });

    // If set as default, unset other defaults
    if (validatedData.setAsDefault) {
      await prisma.source.updateMany({
        where: {
          donorId: customerId,
          id: { not: paymentMethod.id },
        },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(
      { paymentMethod },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Add payment method error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

