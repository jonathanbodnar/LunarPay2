import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTeamMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']),
  permissions: z.array(z.string()).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const memberId = parseInt(id);
    const body = await request.json();
    const validatedData = updateTeamMemberSchema.parse(body);

    // Verify member belongs to current user's team
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        parentId: currentUser.userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Update member
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        permissions: validatedData.permissions?.join(','),
      },
    });

    return NextResponse.json({
      member: updatedMember,
      message: 'Team member updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Update team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const memberId = parseInt(id);

    // Verify member belongs to current user's team
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        parentId: currentUser.userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Delete member
    await prisma.user.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Delete team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

