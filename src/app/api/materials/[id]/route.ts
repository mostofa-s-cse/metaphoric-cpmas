import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/materials';

async function deleteHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Role check: Only SUPER_ADMIN and ADMIN can delete material records
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Only administrators can delete materials');
  }

  const { id } = await params;
  const material = await prisma.material.findUnique({
    where: { id },
    select: { id: true, name: true, totalPrice: true, supplierId: true },
  });

  if (!material) {
    return apiNotFound('Material record', PATH);
  }

  // Adjust supplier's due balance (deduct the material totalPrice)
  if (material.supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: material.supplierId },
      select: { currentDue: true },
    });
    const currentDueNum = supplier ? Number(supplier.currentDue) : 0.0;
    const materialTotal = Number(material.totalPrice);

    await prisma.supplier.update({
      where: { id: material.supplierId },
      data: {
        currentDue: String(currentDueNum - materialTotal),
      },
    });
  }

  // Delete associated auto-generated CashOut record (where materialId matches)
  await prisma.cashOut.deleteMany({
    where: { materialId: material.id },
  });

  // Delete the material record
  await prisma.material.delete({
    where: { id },
  });

  return apiSuccess(null, 'Material purchase record deleted successfully', PATH);
}

export const DELETE = withErrorHandler(deleteHandler, PATH);
