import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiUnauthorized,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/vendors';

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
  const where: Prisma.VendorWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
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
    prisma.vendor.count({ where }),
  ]);

  return apiPaginated(
    'vendors',
    vendors,
    total,
    page,
    limit,
    'Vendors retrieved successfully',
    PATH
  );
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  const body = await request.json();
  const { name, companyName, contactNumber, address, workType, notes, assignments } = body;

  if (!name || !contactNumber || !workType) {
    return apiBadRequest('Missing required fields', PATH);
  }

  let cAmt = 0.0;
  let pAmt = 0.0;
  
  if (assignments && Array.isArray(assignments) && assignments.length > 0) {
    cAmt = assignments.reduce((sum, a) => sum + parseFloat(a.contractAmount || '0'), 0.0);
    pAmt = assignments.reduce((sum, a) => sum + parseFloat(a.paidAmount || '0'), 0.0);
  } else {
    cAmt = parseFloat(body.contractAmount || '0');
    pAmt = parseFloat(body.paidAmount || '0');
  }
  const dAmt = cAmt - pAmt;

  const vendor = await prisma.vendor.create({
    data: {
      name,
      companyName,
      contactNumber,
      address,
      workType,
      contractAmount: cAmt as any,
      paidAmount: pAmt as any,
      dueAmount: dAmt as any,
      notes,
    },
  });

  if (assignments && Array.isArray(assignments) && assignments.length > 0) {
    await prisma.projectVendor.createMany({
      data: assignments.map((a: any) => {
        const actAmt = parseFloat(a.contractAmount || '0');
        const pdAmt = parseFloat(a.paidAmount || '0');
        return {
          vendorId: vendor.id,
          projectId: a.projectId,
          contractAmount: actAmt as any,
          paidAmount: pdAmt as any,
          dueAmount: (actAmt - pdAmt) as any,
        };
      }),
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'CREATE_VENDOR',
      details: `Registered vendor: ${vendor.name} (${vendor.workType})`,
    },
  });

  return apiCreated({ vendor }, 'Vendor registered successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
