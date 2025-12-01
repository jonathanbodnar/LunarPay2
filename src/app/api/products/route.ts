import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createProductSchema = z.object({
  organizationId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  qty: z.number().nullable().optional(),
  isSubscription: z.boolean().optional(),
  subscriptionInterval: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        userId: currentUser.userId,
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        qty: validatedData.qty,
        isSubscription: validatedData.isSubscription || false,
        subscriptionInterval: validatedData.subscriptionInterval,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

