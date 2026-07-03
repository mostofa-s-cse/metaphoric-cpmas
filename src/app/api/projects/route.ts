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

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          materials: true,
          cashOuts: true,
          cashIns: true,
          labours: true,
        },
      }),
      prisma.project.count(),
    ]);

    return NextResponse.json(formatPaginatedResponse('projects', projects, total, page, limit));
  } catch (error: any) {
    console.error('Projects fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: PM, Admin, Super Admin can create projects
    if (user.role === 'ACCOUNTANT' || user.role === 'DATA_ENTRY_OPERATOR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, code, clientName, clientContactNumber, projectLocation,
      startDate, expectedCompletionDate, estimatedBudget, status, projectType, description,
    } = body;

    if (!name || !code || !clientName || !clientContactNumber || !projectLocation || !startDate || !expectedCompletionDate || !estimatedBudget || !projectType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingProject = await prisma.project.findUnique({ where: { code } });
    if (existingProject) {
      return NextResponse.json({ error: 'Project code must be unique' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name, code, clientName, clientContactNumber, projectLocation,
        startDate: new Date(startDate),
        expectedCompletionDate: new Date(expectedCompletionDate),
        estimatedBudget: parseFloat(estimatedBudget),
        status: status || 'PLANNING',
        projectType,
        description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_PROJECT',
        details: `Created project ${project.name} (${project.code})`,
      },
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Project create error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
