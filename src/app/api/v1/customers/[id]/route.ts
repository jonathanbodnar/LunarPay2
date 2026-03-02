/**
 * GET /api/v1/customers/:id   — Get a customer
 * PUT /api/v1/customers/:id   — Update a customer
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
});

async function getCustomer(auth: { organizationId: number }, id: number) {
  const customer = await prisma.donor.findFirst({
    where: { id, organizationId: auth.organizationId },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      address: true, city: true, state: true, zip: true, country: true,
      amountAcum: true, createdAt: true, updatedAt: true,
    },
  });
  return customer;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const customerId = parseInt(id);
    if (isNaN(customerId)) return apiError('Invalid customer ID', 400);

    const customer = await getCustomer(auth, customerId);
    if (!customer) return apiError('Customer not found', 404);

    return Response.json({ data: customer });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/customers/:id GET]', e);
    return apiError('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const customerId = parseInt(id);
    if (isNaN(customerId)) return apiError('Invalid customer ID', 400);

    const existing = await getCustomer(auth, customerId);
    if (!existing) return apiError('Customer not found', 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const customer = await prisma.donor.update({
      where: { id: customerId },
      data: parsed.data,
    });

    return Response.json({ data: customer });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/customers/:id PUT]', e);
    return apiError('Internal server error', 500);
  }
}
