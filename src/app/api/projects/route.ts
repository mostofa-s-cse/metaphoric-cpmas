import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  apiSuccess,
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/projects';

async function getHandler(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const where: Prisma.ProjectWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { clientName: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  // For non-Super Admins, return a basic list containing only ID, Code, and Name for selection menus
  if (user.role !== 'SUPER_ADMIN') {
    const projects = await prisma.project.findMany({
      where,
      orderBy: { code: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
    // Format response to conform to RTK Query paginated shape
    return apiSuccess(
      {
        projects,
        total: projects.length,
        page: 1,
        limit: projects.length,
      },
      'Projects basic list retrieved successfully',
      PATH
    );
  }

  // Full detailed query for SUPER_ADMIN
  const hasPage = searchParams.has('page');
  const hasLimit = searchParams.has('limit');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: {
        materials: {
          select: {
            id: true,
            name: true,
            totalPrice: true,
            purchaseDate: true,
          },
        },
        cashOuts: {
          select: {
            id: true,
            amount: true,
            date: true,
          },
        },
        cashIns: {
          select: {
            id: true,
            amount: true,
            date: true,
          },
        },
        labours: {
          select: {
            id: true,
            name: true,
            dailyWage: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return apiPaginated(
    'projects',
    projects,
    total,
    page,
    limit,
    'Projects paginated list retrieved successfully',
    PATH
  );
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Only SUPER_ADMIN can create projects
  if (user.role !== 'SUPER_ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Super Admin access required');
  }

  const body = await request.json();
  const {
    name,
    code,
    clientName,
    clientContactNumber,
    projectLocation,
    startDate,
    expectedCompletionDate,
    estimatedBudget,
    status,
    projectType,
    description,
  } = body;

  if (
    !name ||
    !code ||
    !clientName ||
    !clientContactNumber ||
    !projectLocation ||
    !startDate ||
    !expectedCompletionDate ||
    !estimatedBudget ||
    !projectType
  ) {
    return apiBadRequest('Missing required fields', PATH);
  }

  const existingProject = await prisma.project.findUnique({
    where: { code },
    select: { id: true },
  });
  if (existingProject) {
    return apiBadRequest('Project code must be unique', PATH);
  }

  const project = await prisma.project.create({
    data: {
      name,
      code,
      clientName,
      clientContactNumber,
      projectLocation,
      startDate: new Date(startDate),
      expectedCompletionDate: new Date(expectedCompletionDate),
      estimatedBudget: parseFloat(estimatedBudget),
      status: status || 'PLANNING',
      projectType,
      description,
    },
  });

  return apiCreated({ project }, 'Project created successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
