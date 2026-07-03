import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/labours';

async function putHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  if (user.role === 'ACCOUNTANT' || user.role === 'DATA_ENTRY_OPERATOR') {
    return apiForbidden(PATH, 'Accountants and Data Entry Operators are not permitted to update labour workers');
  }

  const { id } = await params;
  const body = await request.json();
  const { name, phoneNumber, trade, dailyWage, projectId, employmentStatus } = body;

  const labour = await prisma.labour.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!labour) {
    return apiNotFound('Labour worker', PATH);
  }

  const updatedLabour = await prisma.labour.update({
    where: { id },
    data: {
      name: name || undefined,
      phoneNumber: phoneNumber || undefined,
      trade: trade || undefined,
      dailyWage: dailyWage ? parseFloat(dailyWage) : undefined,
      projectId: projectId || undefined,
      employmentStatus: employmentStatus || undefined,
    },
  });

  return apiSuccess({ labour: updatedLabour }, 'Labour worker updated successfully', PATH);
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
    return apiForbidden(PATH, 'Forbidden: Only administrators can delete labours');
  }

  const { id } = await params;
  const labour = await prisma.labour.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!labour) {
    return apiNotFound('Labour worker', PATH);
  }

  await prisma.labour.delete({
    where: { id },
  });

  return apiSuccess(null, 'Labour worker deleted successfully', PATH);
}

export const PUT = withErrorHandler(putHandler, PATH);
export const DELETE = withErrorHandler(deleteHandler, PATH);
