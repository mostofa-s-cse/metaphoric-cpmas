import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/suppliers';

async function putHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  const { id } = await params;
  const body = await request.json();
  const { name, companyName, phoneNumber, email, address, notes, assignments } = body;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: { id: true, name: true, openingBalance: true },
  });
  if (!supplier) {
    return apiNotFound('Supplier', PATH);
  }
  
  let cAmt = 0.0;
  let pAmt = 0.0;
  if (assignments && Array.isArray(assignments) && assignments.length > 0) {
    cAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.contractAmount || '0'), 0.0);
    pAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount || '0'), 0.0);
  }
  const dAmt = cAmt - pAmt;
  const totalDue = dAmt + supplier.openingBalance;

  const updatedSupplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: name || undefined,
      companyName: companyName !== undefined ? companyName : undefined,
      phoneNumber: phoneNumber || undefined,
      email: email !== undefined ? email : undefined,
      address: address !== undefined ? address : undefined,
      currentDue: totalDue,
      notes: notes !== undefined ? notes : undefined,
    },
  });

  if (assignments && Array.isArray(assignments)) {
    await prisma.projectSupplier.deleteMany({ where: { supplierId: id } });
    if (assignments.length > 0) {
      await prisma.projectSupplier.createMany({
        data: assignments.map((a: any) => {
          const actAmt = parseFloat(a.contractAmount || '0');
          const pdAmt = parseFloat(a.paidAmount || '0');
          return {
            supplierId: id,
            projectId: a.projectId,
            contractAmount: actAmt,
            paidAmount: pdAmt,
            dueAmount: actAmt - pdAmt,
          };
        }),
      });
    }
  }

  return apiSuccess({ supplier: updatedSupplier }, 'Supplier updated successfully', PATH);
}

async function deleteHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Insufficient privileges');
  }

  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!supplier) {
    return apiNotFound('Supplier', PATH);
  }

  await prisma.supplier.delete({ where: { id } });

  return apiSuccess(null, 'Supplier deleted successfully', PATH);
}

export const PUT = withErrorHandler(putHandler, PATH);
export const DELETE = withErrorHandler(deleteHandler, PATH);
