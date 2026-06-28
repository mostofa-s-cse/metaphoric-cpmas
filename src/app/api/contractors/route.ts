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

    const [contractors, total] = await Promise.all([
      prisma.contractor.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
        include: { cashOuts: true },
      }),
      prisma.contractor.count(),
    ]);

    return NextResponse.json(formatPaginatedResponse('contractors', contractors, total, page, limit));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: PM, Admin, Super Admin can register contractors
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

    const contractor = await prisma.contractor.create({
      data: { name, companyName, contactNumber, address, workType, contractAmount: cAmt, paidAmount: pAmt, dueAmount: dAmt, notes },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'CREATE_CONTRACTOR', details: `Registered contractor: ${contractor.name} (${contractor.workType})` },
    });

    return NextResponse.json({ contractor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
