import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        materials: true,
        cashOuts: true,
      },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'PROJECT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { name, companyName, phoneNumber, email, address, openingBalance, notes } = body;

    if (!name || !phoneNumber) {
      return NextResponse.json({ error: 'Name and Phone Number are required' }, { status: 400 });
    }

    const oBalance = parseFloat(openingBalance) || 0.0;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        companyName,
        phoneNumber,
        email,
        address,
        openingBalance: oBalance,
        currentDue: oBalance, // Initial due starts as opening balance
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_SUPPLIER',
        details: `Created supplier: ${supplier.name}`,
      },
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
