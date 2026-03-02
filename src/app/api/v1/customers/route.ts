/**
 * GET  /api/v1/customers     — List customers (paginated)
 * POST /api/v1/customers     — Create or upsert a customer
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const createSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const search = searchParams.get('search') ?? '';

    const where = {
      organizationId: auth.organizationId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.donor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          address: true, city: true, state: true, zip: true, country: true,
          amountAcum: true, createdAt: true, updatedAt: true,
        },
      }),
      prisma.donor.count({ where }),
    ]);

    return Response.json({
      data: customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/customers GET]', e);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;

    // Upsert by email if provided
    let customer;
    if (data.email) {
      customer = await prisma.donor.findFirst({
        where: { organizationId: auth.organizationId, email: data.email },
      });
      if (customer) {
        customer = await prisma.donor.update({
          where: { id: customer.id },
          data: {
            firstName: data.firstName ?? customer.firstName,
            lastName: data.lastName ?? customer.lastName,
            phone: data.phone ?? customer.phone,
            address: data.address ?? customer.address,
            city: data.city ?? customer.city,
            state: data.state ?? customer.state,
            zip: data.zip ?? customer.zip,
            country: data.country ?? customer.country,
          },
        });
        return Response.json({ data: customer, created: false }, { status: 200 });
      }
    }

    customer = await prisma.donor.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        createdFrom: 'api',
        ...data,
      },
    });

    return Response.json({ data: customer, created: true }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/customers POST]', e);
    return apiError('Internal server error', 500);
  }
}
