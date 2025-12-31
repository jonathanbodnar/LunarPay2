import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/payment-links/public/:hash - Get payment link by hash (customer access)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    const paymentLink = await prisma.paymentLink.findUnique({
      where: { hash },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            phoneNumber: true,
            email: true,
            website: true,
            primaryColor: true,
            backgroundColor: true,
            buttonTextColor: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                fileHash: true,
              },
            },
          },
        },
      },
    });

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    // Don't allow access to inactive payment links
    if (paymentLink.status !== 'active') {
      return NextResponse.json(
        { error: 'Payment link not available' },
        { status: 404 }
      );
    }

    // Calculate available quantities for each product
    const productsWithAvailability = await Promise.all(
      paymentLink.products.map(async (linkProduct) => {
        if (linkProduct.unlimitedQty) {
          return {
            ...linkProduct,
            available: null,
            unlimited: true,
          };
        }

        // Count sold quantity
        const soldCount = await prisma.paymentLinkProductPaid.aggregate({
          where: {
            paymentLinkProductId: linkProduct.id,
          },
          _sum: {
            qtyReq: true,
          },
        });

        const sold = soldCount._sum.qtyReq || 0;
        const available = (linkProduct.qty || 0) - sold;

        return {
          ...linkProduct,
          sold,
          available,
          unlimited: false,
        };
      })
    );

    return NextResponse.json({
      paymentLink: {
        ...paymentLink,
        products: productsWithAvailability,
      },
    });
  } catch (error) {
    console.error('Get public payment link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

