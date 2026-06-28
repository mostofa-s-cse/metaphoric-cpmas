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

    const [labours, total] = await Promise.all([
      prisma.labour.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
        include: {
          project: { select: { name: true, code: true } },
          attendances: true,
        },
      }),
      prisma.labour.count(),
    ]);

    return NextResponse.json(formatPaginatedResponse('labours', labours, total, page, limit));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch labour database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'ACCOUNTANT' || user.role === 'DATA_ENTRY_OPERATOR') {
      // General staff cannot modify base labor registrations
    }

    const body = await request.json();
    const { name, phoneNumber, trade, dailyWage, projectId, employmentStatus } = body;

    if (!name || !phoneNumber || !trade || !dailyWage || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const labour = await prisma.labour.create({
      data: {
        name, phoneNumber, trade,
        dailyWage: parseFloat(dailyWage),
        projectId,
        employmentStatus: employmentStatus || 'ACTIVE',
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'CREATE_LABOUR', details: `Registered labour worker: ${labour.name} (${labour.trade})` },
    });

    return NextResponse.json({ labour });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to register labour worker' }, { status: 500 });
  }
}
