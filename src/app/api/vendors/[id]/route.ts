import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/vendors';

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
  const { name, companyName, contactNumber, address, workType, contractAmount, paidAmount, notes, assignments } = body;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    select: { id: true, name: true, contractAmount: true, paidAmount: true },
  });
  if (!vendor) {
    return apiNotFound('Vendor', PATH);
  }

  // Sync project assignments
  await prisma.projectVendor.deleteMany({ where: { vendorId: id } });

  if (assignments && Array.isArray(assignments) && assignments.length > 0) {
    await prisma.projectVendor.createMany({
      data: assignments.map((a: any) => {
        const actAmt = parseFloat(a.contractAmount || '0');
        const pdAmt = parseFloat(a.paidAmount || '0');
        return {
          vendorId: id,
          projectId: a.projectId,
          contractAmount: actAmt as any,
          paidAmount: pdAmt as any,
          dueAmount: (actAmt - pdAmt) as any,
        };
      }),
    });
  }

  let cAmt = 0.0;
  let pAmt = 0.0;

  if (assignments && Array.isArray(assignments) && assignments.length > 0) {
    cAmt = assignments.reduce((sum, a) => sum + parseFloat(a.contractAmount || '0'), 0.0);
    pAmt = assignments.reduce((sum, a) => sum + parseFloat(a.paidAmount || '0'), 0.0);
  } else {
    cAmt = contractAmount !== undefined ? parseFloat(contractAmount) : Number(vendor.contractAmount);
    pAmt = paidAmount !== undefined ? parseFloat(paidAmount) : Number(vendor.paidAmount);
  }
  const dAmt = cAmt - pAmt;

  const updatedVendor = await prisma.vendor.update({
    where: { id },
    data: {
      name: name || undefined,
      companyName: companyName !== undefined ? companyName : undefined,
      contactNumber: contactNumber || undefined,
      address: address !== undefined ? address : undefined,
      workType: workType || undefined,
      contractAmount: cAmt as any,
      paidAmount: pAmt as any,
      dueAmount: dAmt as any,
      notes: notes !== undefined ? notes : undefined,
    },
  });

  return apiSuccess({ vendor: updatedVendor }, 'Vendor updated successfully', PATH);
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
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!vendor) {
    return apiNotFound('Vendor', PATH);
  }

  await prisma.vendor.delete({ where: { id } });

  return apiSuccess(null, 'Vendor deleted successfully', PATH);
}

export const PUT = withErrorHandler(putHandler, PATH);
export const DELETE = withErrorHandler(deleteHandler, PATH);
