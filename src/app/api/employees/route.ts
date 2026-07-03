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

const PATH = '/api/employees';

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
  const where: Prisma.EmployeeWhereInput = search
    ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
          { designation: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { employeeId: 'asc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: {
        salaries: {
          select: {
            id: true,
            netSalary: true,
            month: true,
            paymentStatus: true,
            paidAmount: true,
            dueAmount: true,
          },
        },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  return apiPaginated(
    'employees',
    employees,
    total,
    page,
    limit,
    'Employees retrieved successfully',
    PATH
  );
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  const body = await request.json();
  const { employeeId, fullName, designation, department, phoneNumber, email, joiningDate, monthlySalary, employmentStatus } = body;

  if (!employeeId || !fullName || !designation || !department || !phoneNumber || !joiningDate || !monthlySalary) {
    return apiBadRequest('Missing required fields', PATH);
  }

  const checkUniqueId = await prisma.employee.findUnique({
    where: { employeeId },
    select: { id: true },
  });
  if (checkUniqueId) {
    return apiBadRequest('Employee ID must be unique', PATH);
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

  return apiCreated({ employee }, 'Employee registered successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
