import { NextResponse } from 'next/server';
import { requireAuth, getUserOrgIds } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const customerId = parseInt(id);

    console.log('[Customer API] Fetching customer:', {
      customerId,
      userId: currentUser.userId,
      userEmail: currentUser.email,
    });

    // Get all orgs user has access to (owned + team member)
    const orgIds = await getUserOrgIds(currentUser.userId);

    console.log('[Customer API] User organizations (owned + team):', orgIds);

    // Build where clause - handle case where user has no orgs
    const whereClause: any = {
      id: customerId,
    };

    if (orgIds.length > 0) {
      whereClause.OR = [
        { userId: currentUser.userId },
        { organizationId: { in: orgIds } },
      ];
    } else {
      // User has no orgs, so only match direct ownership
      whereClause.userId = currentUser.userId;
    }

    console.log('[Customer API] Where clause:', JSON.stringify(whereClause, null, 2));

    // Find customer that belongs to user directly OR to user's organizations
    const customer = await prisma.donor.findFirst({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 transactions
          select: {
            id: true,
            totalAmount: true,
            source: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            sources: true,
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      console.log('[Customer API] Customer not found or not accessible:', {
        customerId,
        userId: currentUser.userId,
        orgIds,
      });
      
      // Check if customer exists at all
      const anyCustomer = await prisma.donor.findUnique({
        where: { id: customerId },
        select: { id: true, userId: true, organizationId: true },
      });
      
      if (anyCustomer) {
        console.log('[Customer API] Customer exists but not accessible:', {
          customer: anyCustomer,
          currentUserId: currentUser.userId,
          userOrgIds: orgIds,
        });
      } else {
        console.log('[Customer API] Customer does not exist:', customerId);
      }
      
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    console.log('[Customer API] Customer found:', {
      id: customer.id,
      userId: customer.userId,
      organizationId: customer.organizationId,
    });

    return NextResponse.json({ customer });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('[Customer API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const customerId = parseInt(id);
    const body = await request.json();

    const validatedData = updateCustomerSchema.parse(body);

    // Get all orgs user has access to (owned + team member)
    const orgIdsUpdate = await getUserOrgIds(currentUser.userId);

    // Build where clause - handle case where user has no orgs
    const whereClauseUpdate: any = { id: customerId };
    if (orgIdsUpdate.length > 0) {
      whereClauseUpdate.OR = [
        { userId: currentUser.userId },
        { organizationId: { in: orgIdsUpdate } },
      ];
    } else {
      whereClauseUpdate.userId = currentUser.userId;
    }

    // Verify ownership (direct or via organization)
    const existing = await prisma.donor.findFirst({
      where: whereClauseUpdate,
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer
    const customer = await prisma.donor.update({
      where: { id: customerId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zip: validatedData.zip,
      },
    });

    return NextResponse.json({ customer });
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

    console.error('Update customer error:', error);
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
    const currentUser = await requireAuth();
    const { id } = await params;
    const customerId = parseInt(id);

    // Get all orgs user has access to (owned + team member)
    const orgIdsDelete = await getUserOrgIds(currentUser.userId);

    // Build where clause
    const whereClauseDelete: any = { id: customerId };
    if (orgIdsDelete.length > 0) {
      whereClauseDelete.OR = [
        { userId: currentUser.userId },
        { organizationId: { in: orgIdsDelete } },
      ];
    } else {
      whereClauseDelete.userId = currentUser.userId;
    }

    const existing = await prisma.donor.findFirst({
      where: whereClauseDelete,
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    await prisma.donor.delete({
      where: { id: customerId },
    });

    return NextResponse.json({
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
