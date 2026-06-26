import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labours = await prisma.labour.findMany({
      orderBy: { name: 'asc' },
      include: {
        project: {
          select: { name: true, code: true }
        },
        attendances: true,
      },
    });

    return NextResponse.json({ labours });
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

    return NextResponse.json({ labour });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to register labour worker' }, { status: 500 });
  }
}
