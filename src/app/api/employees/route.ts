import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      orderBy: { employeeId: 'asc' },
      include: {
        salaries: true,
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { employeeId, fullName, designation, department, phoneNumber, email, joiningDate, monthlySalary, employmentStatus } = body;

    if (!employeeId || !fullName || !designation || !department || !phoneNumber || !joiningDate || !monthlySalary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const checkUniqueId = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (checkUniqueId) {
      return NextResponse.json({ error: 'Employee ID must be unique' }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        fullName,
        designation,
        department,
        phoneNumber,
        email,
        joiningDate: new Date(joiningDate),
        monthlySalary: parseFloat(monthlySalary),
        employmentStatus: employmentStatus || 'ACTIVE',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_EMPLOYEE',
        details: `Registered employee: ${employee.fullName} (${employee.employeeId})`,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
