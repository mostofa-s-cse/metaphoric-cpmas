import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { getPaginationParams, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Super Admin can view all users
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    return NextResponse.json(formatPaginatedResponse('users', users, total, page, limit));
  } catch (error: any) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Super Admin can create users
    if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { email, fullName, password, role } = body;

    if (!email || !fullName || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }


    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email address already registered' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
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

    return NextResponse.json({ user: newUser });
  } catch (error: any) {
    console.error('User create error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
