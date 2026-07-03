import { NextRequest } from 'next/server';
import { prisma, rawPrisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  apiSuccess,
  apiPaginated,
  apiUnauthorized,
  apiForbidden,
  apiBadRequest,
  apiError,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/audit-logs';

async function getHandler(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Access check: Only SUPER_ADMIN and ADMIN can view audit logs
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Insufficient privilege level to view system audit logs.');
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const actionGroup = searchParams.get('actionGroup') || 'ALL'; // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'ALL'
  const entityType = searchParams.get('entityType') || 'ALL'; // 'PROJECT', 'SUPPLIER', etc.
  const startDateStr = searchParams.get('startDate') || '';
  const endDateStr = searchParams.get('endDate') || '';
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '15', 10);
  const skip = (page - 1) * limit;

  // Build filters dynamically
  const andConditions: Prisma.AuditLogWhereInput[] = [];

  // Search filter
  if (search) {
    andConditions.push({
      OR: [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  // Action group filter (e.g. matches CREATE_*, UPDATE_*)
  if (actionGroup !== 'ALL') {
    andConditions.push({
      action: { startsWith: actionGroup },
    });
  }

  // Entity filter (e.g. matches *_PROJECT, *_SUPPLIER)
  if (entityType !== 'ALL') {
    if (entityType === 'LOGIN') {
      andConditions.push({
        action: { contains: 'LOGIN' },
      });
    } else {
      andConditions.push({
        action: { endsWith: entityType },
      });
    }
  }

  // Date range filter
  if (startDateStr || endDateStr) {
    const dateCondition: any = {};
    if (startDateStr) {
      const sDate = new Date(startDateStr);
      sDate.setHours(0, 0, 0, 0);
      dateCondition.gte = sDate;
    }
    if (endDateStr) {
      const eDate = new Date(endDateStr);
      eDate.setHours(23, 59, 59, 999);
      dateCondition.lte = eDate;
    }
    andConditions.push({
      createdAt: dateCondition,
    });
  }

  const where: Prisma.AuditLogWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return apiPaginated(
    'auditLogs',
    logs,
    total,
    page,
    limit,
    'System audit logs retrieved successfully',
    PATH
  );
}

async function deleteHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  // Only SUPER_ADMIN can delete/prune audit logs
  if (user.role !== 'SUPER_ADMIN') {
    return apiForbidden(PATH, 'Forbidden: Only Super Administrator is permitted to prune audit logs.');
  }

  const body = await request.json();
  const { startDate, endDate } = body;

  if (!startDate || !endDate) {
    return apiBadRequest('Start Date and End Date are required to prune logs.', PATH);
  }

  const sDate = new Date(startDate);
  sDate.setHours(0, 0, 0, 0);

  const eDate = new Date(endDate);
  eDate.setHours(23, 59, 59, 999);

  if (sDate > eDate) {
    return apiBadRequest('Start Date cannot be after End Date.', PATH);
  }

  // Prune matching logs
  const { count } = await rawPrisma.auditLog.deleteMany({
    where: {
      createdAt: {
        gte: sDate,
        lte: eDate,
      },
    },
  });

  // Manually log this prune action (to avoid extension looping, using rawPrisma)
  await rawPrisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'PRUNE_AUDIT_LOGS',
      details: `Pruned ${count} system audit logs between ${startDate} and ${endDate}`,
    },
  });

  return apiSuccess(
    { count },
    `Successfully pruned ${count} audit log records from the system database.`,
    PATH
  );
}

export const GET = withErrorHandler(getHandler, PATH);
export const DELETE = withErrorHandler(deleteHandler, PATH);
