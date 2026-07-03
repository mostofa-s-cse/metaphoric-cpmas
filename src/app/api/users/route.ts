import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { getPaginationParams } from '@/lib/pagination';
import {
  apiCreated,
  apiPaginated,
  apiError,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
} from '@/lib/apiResponse';

const PATH = '/api/users';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    // Only Super Admin can view all users
    if (user.role !== 'SUPER_ADMIN') {
      return apiForbidden(PATH);
    }

    const { page, limit, skip, take } = getPaginationParams(request);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return apiPaginated('users', users, total, page, limit, 'Users retrieved successfully', PATH);
  } catch (error: any) {
    console.error('Users fetch error:', error);
    return apiError('Failed to fetch users', PATH);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiUnauthorized(PATH);
    }

    // Only Super Admin can create users
    if (currentUser.role !== 'SUPER_ADMIN') {
      return apiForbidden(PATH, 'Forbidden: Insufficient privileges');
    }

    const body = await request.json();
    const { email, fullName, password, role } = body;

    if (!email || !fullName || !password || !role) {
      return apiBadRequest('Missing required fields', PATH);
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return apiBadRequest('Email address already registered', PATH);
    }

    if (password.length < 6) {
      return apiBadRequest('Password must be at least 6 characters', PATH);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: { email, fullName, passwordHash, role },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'CREATE_USER',
        details: `Created user ${newUser.fullName} (${newUser.email}) with role ${newUser.role}`,
      },
    });

    return apiCreated({ user: newUser }, 'User created successfully', PATH);
  } catch (error: any) {
    console.error('User create error:', error);
    return apiError('Failed to create user', PATH);
  }
}
