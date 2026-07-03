import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/labours';

async function getHandler(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const hasPage = searchParams.has('page');
  const hasLimit = searchParams.has('limit');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;

  // Search filter configuration
  const where: Prisma.LabourWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { trade: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [labours, total] = await Promise.all([
    prisma.labour.findMany({
      where,
      orderBy: { name: 'asc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: {
        project: { select: { name: true, code: true } },
        attendances: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
    }),
    prisma.labour.count({ where }),
  ]);

  return apiPaginated(
    'labours',
    labours,
    total,
    page,
    limit,
    'Labour database retrieved successfully',
    PATH
  );
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  if (user.role === 'ACCOUNTANT' || user.role === 'DATA_ENTRY_OPERATOR') {
    return apiForbidden(PATH, 'Accountants and Data Entry Operators are not permitted to register labour workers');
  }

  const body = await request.json();
  const { name, phoneNumber, trade, dailyWage, projectId, employmentStatus } = body;

  if (!name || !phoneNumber || !trade || !dailyWage || !projectId) {
    return apiBadRequest('Missing required fields', PATH);
  }

  const labour = await prisma.labour.create({
    data: {
      name,
      phoneNumber,
      trade,
      dailyWage: parseFloat(dailyWage),
      projectId,
      employmentStatus: employmentStatus || 'ACTIVE',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'CREATE_LABOUR',
      details: `Registered labour worker: ${labour.name} (${labour.trade})`,
    },
  });

  return apiCreated({ labour }, 'Labour worker registered successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
