import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden } from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/website/sections';

async function getHandler(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized(PATH);

  const sections = await prisma.websiteSection.findMany();
  
  // Transform from array to a key-value object by sectionKey
  const sectionsObject = sections.reduce((acc, curr) => {
    acc[curr.sectionKey] = curr;
    return acc;
  }, {} as Record<string, any>);

  return apiSuccess(sectionsObject, 'Sections retrieved successfully', PATH);
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized(PATH);
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return apiForbidden(PATH, 'Only Admins can modify website sections');
  }

  const body = await request.json();
  const { sectionKey, title, subtitle, highlight, description, imageUrl, videoUrl, extraData, isActive } = body;

  if (!sectionKey) {
    return apiBadRequest('Missing sectionKey', PATH);
  }

  const section = await prisma.websiteSection.upsert({
    where: { sectionKey },
    update: { title, subtitle, highlight, description, imageUrl, videoUrl, extraData, isActive },
    create: { sectionKey, title, subtitle, highlight, description, imageUrl, videoUrl, extraData, isActive: isActive ?? true },
  });

  return apiSuccess(section, 'Section updated successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
