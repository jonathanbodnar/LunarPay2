import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createFundSchema = z.object({
  organizationId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const validatedData = createFundSchema.parse(body);

    const fund = await prisma.fund.create({
      data: {
        userId: currentUser.userId,
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive ?? true,
      },
    });

    return NextResponse.json({ fund }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create fund error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const currentUser = await requireAuth();

    const funds = await prisma.fund.findMany({
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
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ funds });
  } catch (error) {
    console.error('Get funds error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

