import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden } from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/website/settings';

async function getHandler(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized(PATH);

  const settings = await prisma.websiteSettings.findMany();
  
  // Transform from array of {key, value} to a key-value object
  const settingsObject = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, any>);

  return apiSuccess(settingsObject, 'Settings retrieved successfully', PATH);
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized(PATH);
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return apiForbidden(PATH, 'Only Admins can modify website settings');
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return apiBadRequest('Missing key or value', PATH);
  }

  const setting = await prisma.websiteSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return apiSuccess(setting, 'Setting updated successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
