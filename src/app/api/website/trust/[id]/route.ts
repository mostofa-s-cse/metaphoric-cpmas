import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden } from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/website/trust/[id]';

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await prisma.websiteTrustBadge.findUnique({ where: { id } });
  if (!data) return apiBadRequest('Not found', PATH);
  return apiSuccess(data, 'Retrieved successfully', PATH);
}

async function putHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized(PATH);
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return apiForbidden(PATH);

  const { id } = await params;
  const body = await request.json();
  const data = await prisma.websiteTrustBadge.update({ where: { id }, data: body });
  return apiSuccess(data, 'Updated successfully', PATH);
}

async function deleteHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized(PATH);
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return apiForbidden(PATH);

  const { id } = await params;
  await prisma.websiteTrustBadge.delete({ where: { id } });
  return apiSuccess({ id }, 'Deleted successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const PUT = withErrorHandler(putHandler, PATH);
export const DELETE = withErrorHandler(deleteHandler, PATH);
