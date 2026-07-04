import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiCreated } from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/website/portfolio';

async function getHandler(request: NextRequest) {
  const data = await prisma.websitePortfolio.findMany({ orderBy: { order: 'asc' } });
  return apiSuccess(data, 'portfolio retrieved successfully', PATH);
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized(PATH);
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return apiForbidden(PATH, 'Only Admins can modify website');

  const body = await request.json();
  const data = await prisma.websitePortfolio.create({ data: body });
  return apiCreated(data, 'Created successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
