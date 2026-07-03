import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getPaginationParams, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { page, limit, skip, take } = getPaginationParams(request);

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
        include: { cashOuts: true },
      }),
      prisma.vendor.count(),
    ]);

    return NextResponse.json(formatPaginatedResponse('vendors', vendors, total, page, limit));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: PM, Admin, Super Admin can register vendors
    if (user.role === 'ACCOUNTANT' || user.role === 'DATA_ENTRY_OPERATOR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { name, companyName, contactNumber, address, workType, contractAmount, paidAmount, notes } = body;

    if (!name || !contactNumber || !workType || !contractAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cAmt = parseFloat(contractAmount) || 0.0;
    const pAmt = parseFloat(paidAmount) || 0.0;
    const dAmt = cAmt - pAmt;

    const vendor = await prisma.vendor.create({
      data: { name, companyName, contactNumber, address, workType, contractAmount: cAmt, paidAmount: pAmt, dueAmount: dAmt, notes },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'CREATE_VENDOR', details: `Registered vendor: ${vendor.name} (${vendor.workType})` },
    });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}
