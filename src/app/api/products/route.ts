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
  subscriptionInterval: z.string().nullable().optional(),
  recurrence: z.string().optional(),
  customSchedule: z.array(z.object({
    date: z.string(),
    amount: z.string(),
  })).nullable().optional(),
  showOnPortal: z.boolean().optional(),
});

export async function GET() {
  try {
    const currentUser = await requireAuth();

    const products = await prisma.product.findMany({
      where: {
        userId: currentUser.userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    
    console.log('Creating product with data:', body);
    const validatedData = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        userId: currentUser.userId,
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        qty: validatedData.qty ?? null,
        isSubscription: validatedData.isSubscription || false,
        subscriptionInterval: validatedData.subscriptionInterval || null,
        showOnPortal: validatedData.showOnPortal || false,
      },
    });

    console.log('Product created successfully:', product.id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Product validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
