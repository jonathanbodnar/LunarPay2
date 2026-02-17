import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const merchants = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            starterStep: true,
          },
        },
        fortisOnboarding: {
          select: {
            appStatus: true,
            stepCompleted: true,
            signFirstName: true,
            merchantAddressLine1: true,
            achAccountNumber: true,
          },
        },
        transactions: {
          where: { status: 'P' },
          select: { totalAmount: true },
        },
        donors: {
          select: { id: true },
        },
        invoices: {
          select: { id: true },
        },
        products: {
          select: { id: true },
        },
      },
    });

    const formattedMerchants = merchants.map(m => {
      const fortis = m.fortisOnboarding;
      const hasOrg = !!m.name;
      const hasMerchantInfo = !!(fortis?.signFirstName && fortis?.merchantAddressLine1);
      const hasBankInfo = !!fortis?.achAccountNumber;
      const hasCustomers = m.donors.length > 0;
      const hasProducts = (m.products?.length || 0) > 0;
      const hasInvoices = m.invoices.length > 0;
      const fortisAppStatus = fortis?.appStatus || null;

      let onboardingStatus: string;
      let onboardingDetail: string;

      if (fortisAppStatus === 'ACTIVE') {
        if (hasCustomers && hasProducts && hasInvoices) {
          onboardingStatus = 'FULLY_SETUP';
          onboardingDetail = 'Fully set up and processing';
        } else {
          const remaining = [];
          if (!hasCustomers) remaining.push('customer');
          if (!hasProducts) remaining.push('product');
          if (!hasInvoices) remaining.push('invoice');
          onboardingStatus = 'ACTIVE_INCOMPLETE';
          onboardingDetail = `Payment active — needs first ${remaining.join(', ')}`;
        }
      } else if (fortisAppStatus === 'BANK_INFORMATION_SENT') {
        onboardingStatus = 'AWAITING_APPROVAL';
        onboardingDetail = 'Application submitted — awaiting Fortis approval';
      } else if (fortisAppStatus === 'FORM_ERROR') {
        onboardingStatus = 'FORM_ERROR';
        onboardingDetail = 'Fortis application error — needs to resubmit';
      } else if (fortisAppStatus === 'PENDING') {
        if (hasBankInfo) {
          onboardingStatus = 'BANK_SUBMITTED';
          onboardingDetail = 'Bank info entered — submitting to Fortis';
        } else if (hasMerchantInfo) {
          onboardingStatus = 'NEEDS_BANK_INFO';
          onboardingDetail = 'Merchant info done — needs bank account (Step 2b)';
        } else {
          onboardingStatus = 'NEEDS_MERCHANT_INFO';
          onboardingDetail = 'Started Fortis onboarding — needs merchant info (Step 2a)';
        }
      } else if (hasOrg) {
        onboardingStatus = 'NEEDS_PAYMENT_SETUP';
        onboardingDetail = 'Organization created — hasn\'t started payment setup (Step 2)';
      } else {
        onboardingStatus = 'JUST_REGISTERED';
        onboardingDetail = 'Just registered — hasn\'t created organization (Step 1)';
      }

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phoneNumber,
        city: m.city,
        state: m.state,
        createdAt: m.createdAt.toISOString(),
        fortisStatus: fortisAppStatus || 'NOT_STARTED',
        onboardingStatus,
        onboardingDetail,
        totalProcessed: m.transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0),
        totalCustomers: m.donors.length,
        totalInvoices: m.invoices.length,
        ownerName: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || 'Unknown',
        ownerEmail: m.user.email,
        restricted: m.restricted || false,
        restrictedReason: m.restrictedReason || null,
      };
    });

    return NextResponse.json({
      merchants: formattedMerchants,
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin merchants error:', error);
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 });
  }
}

