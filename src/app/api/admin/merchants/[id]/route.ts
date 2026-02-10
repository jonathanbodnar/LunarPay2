import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// DELETE /api/admin/merchants/[id] - Delete a merchant and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = parseInt(id);

    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    // Get org info before deleting
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, userId: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Delete all related data in correct order (foreign key dependencies)
    // Use a transaction so it's all-or-nothing
    await prisma.$transaction(async (tx) => {
      // Delete ticket messages
      await tx.ticketMessage.deleteMany({
        where: { ticket: { organizationId } },
      });

      // Delete tickets
      await tx.ticket.deleteMany({
        where: { organizationId },
      });

      // Delete payment link product paid records
      await tx.paymentLinkProductPaid.deleteMany({
        where: { paymentLink: { organizationId } },
      });

      // Delete payment link products
      await tx.paymentLinkProduct.deleteMany({
        where: { paymentLink: { organizationId } },
      });

      // Delete payment links
      await tx.paymentLink.deleteMany({
        where: { organizationId },
      });

      // Delete invoice products
      await tx.invoiceProduct.deleteMany({
        where: { invoice: { organizationId } },
      });

      // Delete invoices
      await tx.invoice.deleteMany({
        where: { organizationId },
      });

      // Delete transaction funds
      await tx.transactionFund.deleteMany({
        where: { transaction: { organizationId } },
      });

      // Delete transactions
      await tx.transaction.deleteMany({
        where: { organizationId },
      });

      // Delete subscriptions
      await tx.subscription.deleteMany({
        where: { organizationId },
      });

      // Delete sources (payment methods)
      await tx.source.deleteMany({
        where: { organizationId },
      });

      // Delete donors (customers)
      await tx.donor.deleteMany({
        where: { organizationId },
      });

      // Delete products
      await tx.product.deleteMany({
        where: { organizationId },
      });

      // Delete funds
      await tx.fund.deleteMany({
        where: { organizationId },
      });

      // Delete fortis onboarding
      await tx.fortisOnboarding.deleteMany({
        where: { organizationId },
      });

      // Delete chat settings
      await tx.chatSetting.deleteMany({
        where: { organizationId },
      });

      // Delete email templates
      await tx.emailTemplate.deleteMany({
        where: { organizationId },
      });

      // Delete team members
      await tx.teamMember.deleteMany({
        where: { organizationId },
      });

      // Delete team invites
      await tx.teamInvite.deleteMany({
        where: { organizationId },
      });

      // Delete sub-organizations (campuses)
      await tx.subOrganization.deleteMany({
        where: { organizationId },
      });

      // Delete the organization itself
      await tx.organization.delete({
        where: { id: organizationId },
      });

      // Check if the user has any other organizations
      const otherOrgs = await tx.organization.count({
        where: { userId: organization.userId },
      });

      // If user has no other organizations, delete the user too
      if (otherOrgs === 0) {
        await tx.user.delete({
          where: { id: organization.userId },
        });
      }
    });

    console.log(`[ADMIN] Merchant ${organizationId} (${organization.name}) deleted by admin`);

    return NextResponse.json({
      success: true,
      message: `${organization.name} has been permanently deleted`,
    });
  } catch (error) {
    console.error('[ADMIN] Error deleting merchant:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant', details: (error as Error).message },
      { status: 500 }
    );
  }
}
