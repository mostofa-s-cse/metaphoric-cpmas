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

const PATH = '/api/projects';

async function getHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Only SUPER_ADMIN can view project details
  if (user.role !== 'SUPER_ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Super Admin access required');
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      materials: {
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
        },
      },
      cashIns: true,
      cashOuts: {
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
          employee: {
            select: {
              id: true,
              fullName: true,
              designation: true,
            },
          },
          labour: {
            select: {
              id: true,
              name: true,
              trade: true,
            },
          },
        },
      },
      labours: true,
      documents: true,
    },
  });

  if (!project) {
    return apiNotFound('Project', PATH);
  }

  return apiSuccess({ project }, 'Project details retrieved successfully', PATH);
}

async function putHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Only SUPER_ADMIN can update projects
  if (user.role !== 'SUPER_ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Super Admin access required');
  }

  const { id } = await params;
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

  const existingProject = await prisma.project.findUnique({
    where: { id },
    select: { id: true, code: true, name: true },
  });

  if (!existingProject) {
    return apiNotFound('Project', PATH);
  }

  // Check if code was updated and if it is unique
  if (code && code !== existingProject.code) {
    const codeCheck = await prisma.project.findUnique({
      where: { code },
      select: { id: true },
    });
    if (codeCheck) {
      return apiBadRequest('Project code must be unique', PATH);
    }
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      name: name || undefined,
      code: code || undefined,
      clientName: clientName || undefined,
      clientContactNumber: clientContactNumber || undefined,
      projectLocation: projectLocation || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : undefined,
      estimatedBudget: estimatedBudget ? (parseFloat(estimatedBudget) as any) : undefined,
      status: status || undefined,
      projectType: projectType || undefined,
      description: description !== undefined ? description : undefined,
    },
  });

  return apiSuccess({ project: updatedProject }, 'Project updated successfully', PATH);
}

async function deleteHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Only SUPER_ADMIN can delete projects
  if (user.role !== 'SUPER_ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Super Admin access required');
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, code: true },
  });

  if (!project) {
    return apiNotFound('Project', PATH);
  }

  await prisma.project.delete({
    where: { id },
  });

  return apiSuccess(null, 'Project deleted successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const PUT = withErrorHandler(putHandler, PATH);
export const DELETE = withErrorHandler(deleteHandler, PATH);
