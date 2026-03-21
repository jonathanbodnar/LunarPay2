/**
 * POST /api/v1/agency/merchants — Register a new merchant under this agency
 * GET  /api/v1/agency/merchants — List all merchants for this agency
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateRandomToken } from '@/lib/auth';
import { requireAgencyKey, generateApiKey, ApiAuthError, apiError } from '@/lib/api-auth';

const createMerchantSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  businessName: z.string().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const agency = await requireAgencyKey(request);
    const body = await request.json();
    const parsed = createMerchantSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password, firstName, lastName, phone, businessName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError('A user with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);
    const publishableKey = generateApiKey('lp_pk_');
    const secretKey = generateApiKey('lp_sk_');
    const orgToken = generateRandomToken(32);

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          paymentProcessor: 'FTS',
          active: true,
          starterStep: 1,
          agencyId: agency.agencyId,
        },
      });

      // Set API keys via raw query (columns added after Prisma client generation)
      await tx.$executeRaw`
        UPDATE users SET publishable_key = ${publishableKey}, secret_key = ${secretKey} WHERE id = ${user.id}
      `;

      const organization = await tx.organization.create({
        data: {
          userId: user.id,
          name: businessName,
          token: orgToken,
        },
      });

      await tx.chatSetting.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          primaryColor: '#007bff',
          themeColor: '#007bff',
        },
      });

      await tx.fortisOnboarding.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          appStatus: 'PENDING',
          signFirstName: firstName,
          signLastName: lastName,
          signPhoneNumber: phone,
          email,
        },
      });

      return { user, organization };
    });

    return Response.json({
      data: {
        merchantId: result.user.id,
        organizationId: result.organization.id,
        email,
        businessName,
        publishableKey,
        secretKey,
        orgToken: orgToken,
        onboardingStatus: 'PENDING',
        mpaEmbedUrl: null,
      },
    }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/agency/merchants POST]', e);
    return apiError('Internal server error', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const agency = await requireAgencyKey(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

    const where = { agencyId: agency.agencyId };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdOn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          organizations: {
            take: 1,
            include: {
              fortisOnboarding: {
                select: { appStatus: true, mpaLink: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map((u: any) => {
      const org = u.organizations[0];
      return {
        merchantId: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        businessName: org?.name || null,
        organizationId: org?.id || null,
        orgToken: org?.token || null,
        onboardingStatus: org?.fortisOnboarding?.appStatus || 'PENDING',
        isActive: org?.fortisOnboarding?.appStatus === 'ACTIVE',
        mpaEmbedUrl: org?.fortisOnboarding?.mpaLink
          ? `https://app.lunarpay.com/onboarding/${org.token}`
          : null,
        createdAt: u.createdOn,
      };
    });

    return Response.json({
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/agency/merchants GET]', e);
    return apiError('Internal server error', 500);
  }
}
