import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  apiCreated,
  apiPaginated,
  apiError,
  apiBadRequest,
  apiUnauthorized,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/suppliers';

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
  const where: Prisma.SupplierWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: {
        projectAssignments: {
          include: {
            project: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    }),
    prisma.supplier.count({ where }),
  ]);

  return apiPaginated(
    'suppliers',
    suppliers,
    total,
    page,
    limit,
    'Suppliers retrieved successfully',
    PATH
  );
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  const body = await request.json();
  const { name, companyName, phoneNumber, email, address, openingBalance, notes, assignments } = body;

  if (!name || !phoneNumber) {
    return apiBadRequest('Name and Phone Number are required', PATH);
  }

  const oBalance = parseFloat(openingBalance) || 0.0;
  
  let cAmt = 0.0;
  let pAmt = 0.0;
  if (assignments && Array.isArray(assignments) && assignments.length > 0) {
    cAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.contractAmount || '0'), 0.0);
    pAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount || '0'), 0.0);
  }
  const dAmt = cAmt - pAmt;
  const totalDue = dAmt + oBalance;

  const supplier = await prisma.supplier.create({
    data: {
      name,
      companyName,
      phoneNumber,
      email,
      address,
      openingBalance: oBalance,
      currentDue: totalDue,
      notes,
    },
  });

  if (assignments && Array.isArray(assignments) && assignments.length > 0) {
    await prisma.projectSupplier.createMany({
      data: assignments.map((a: any) => {
        const actAmt = parseFloat(a.contractAmount || '0');
        const pdAmt = parseFloat(a.paidAmount || '0');
        return {
          supplierId: supplier.id,
          projectId: a.projectId,
          contractAmount: actAmt,
          paidAmount: pdAmt,
          dueAmount: actAmt - pdAmt,
        };
      }),
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'CREATE_SUPPLIER',
      details: `Created supplier: ${supplier.name}`,
    },
  });

  return apiCreated({ supplier }, 'Supplier created successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
