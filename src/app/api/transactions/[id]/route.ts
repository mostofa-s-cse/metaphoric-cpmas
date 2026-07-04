import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/transactions';

async function deleteHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Only SUPER_ADMIN and ADMIN can delete ledger transactions
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Only administrators can delete transactions');
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'in' | 'out'

  if (!type || (type !== 'in' && type !== 'out')) {
    return apiBadRequest('Invalid or missing transaction type query parameter', PATH);
  }

  if (type === 'in') {
    const cashIn = await prisma.cashIn.findUnique({
      where: { id },
      select: { id: true, clientName: true, amount: true },
    });

    if (!cashIn) {
      return apiNotFound('Cash In transaction', PATH);
    }

    await prisma.cashIn.delete({
      where: { id },
    });

    return apiSuccess(null, 'Cash-in transaction deleted successfully', PATH);
  } else {
    const cashOut = await prisma.cashOut.findUnique({
      where: { id },
      include: {
        material: { select: { id: true } },
      },
    });

    if (!cashOut) {
      return apiNotFound('Cash Out transaction', PATH);
    }

    // If this cashOut is linked to a material purchase, prevent delete via transaction ledger
    // (Material purchase records should be deleted from the Inventory view to keep inventory synced)
    if (cashOut.materialId) {
      return apiBadRequest(
        'This transaction is linked to a material purchase. Please delete it from the Materials Inventory page instead.',
        PATH
      );
    }

    // Revert vendor balances if it was a vendor payment
    if (cashOut.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: cashOut.vendorId },
        select: { paidAmount: true, dueAmount: true },
      });
      const oldPaid = vendor ? Number(vendor.paidAmount) : 0.0;
      const oldDue = vendor ? Number(vendor.dueAmount) : 0.0;
      const txnAmt = Number(cashOut.amount);

      await prisma.vendor.update({
        where: { id: cashOut.vendorId },
        data: {
          paidAmount: String(oldPaid - txnAmt),
          dueAmount: String(oldDue + txnAmt),
        },
      });

      if (cashOut.projectId) {
        const projectVendors = await prisma.projectVendor.findMany({
          where: { vendorId: cashOut.vendorId, projectId: cashOut.projectId },
          select: { id: true, paidAmount: true, dueAmount: true },
        });
        for (const pv of projectVendors) {
          const pvPaid = Number(pv.paidAmount);
          const pvDue = Number(pv.dueAmount);
          await prisma.projectVendor.update({
            where: { id: pv.id },
            data: {
              paidAmount: String(pvPaid - txnAmt),
              dueAmount: String(pvDue + txnAmt),
            },
          });
        }
      }
    }

    // Revert supplier balances if it was a supplier payment
    if (cashOut.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: cashOut.supplierId },
        select: { currentDue: true },
      });
      const oldDue = supplier ? Number(supplier.currentDue) : 0.0;
      const txnAmt = Number(cashOut.amount);

      await prisma.supplier.update({
        where: { id: cashOut.supplierId },
        data: {
          currentDue: String(oldDue + txnAmt),
        },
      });
    }

    await prisma.cashOut.delete({
      where: { id },
    });

    return apiSuccess(null, 'Cash-out transaction deleted successfully', PATH);
  }
}

export const DELETE = withErrorHandler(deleteHandler, PATH);
