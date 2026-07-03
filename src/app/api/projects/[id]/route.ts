import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        materials: {
          include: { supplier: true }
        },
        cashIns: true,
        cashOuts: {
          include: {
            supplier: true,
            contractor: true,
            employee: true,
            labour: true
          }
        },
        labours: true,
        documents: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Project details fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: PM, Admin, Super Admin can update projects
    if (user.role === 'ACCOUNTANT' || user.role === 'DATA_ENTRY_OPERATOR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      code,
      clientName,
      clientContactNumber,
      projectLocation,
      startDate,
      expectedCompletionDate,
      estimatedBudget,
      status,
      projectType,
      description,
    } = body;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if code was updated and if it is unique
    if (code && code !== existingProject.code) {
      const codeCheck = await prisma.project.findUnique({ where: { code } });
      if (codeCheck) {
        return NextResponse.json({ error: 'Project code must be unique' }, { status: 400 });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name || undefined,
        code: code || undefined,
        clientName: clientName || undefined,
        clientContactNumber: clientContactNumber || undefined,
        projectLocation: projectLocation || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : undefined,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
        status: status || undefined,
        projectType: projectType || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_PROJECT',
        details: `Updated project ${updatedProject.name} (${updatedProject.code})`,
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error: any) {
    console.error('Project update error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Only Admin and Super Admin can delete projects
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_PROJECT',
        details: `Deleted project ${project.name} (${project.code})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Project delete error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
