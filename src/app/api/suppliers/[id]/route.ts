import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'PROJECT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, companyName, phoneNumber, email, address, notes, assignments } = body;

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    
    let cAmt = 0.0;
    let pAmt = 0.0;
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      cAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.contractAmount || '0'), 0.0);
      pAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount || '0'), 0.0);
    }
    const dAmt = cAmt - pAmt;
    const totalDue = dAmt + supplier.openingBalance;

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name || undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        phoneNumber: phoneNumber || undefined,
        email: email !== undefined ? email : undefined,
        address: address !== undefined ? address : undefined,
        currentDue: totalDue,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    if (assignments && Array.isArray(assignments)) {
      await prisma.projectSupplier.deleteMany({ where: { supplierId: id } });
      if (assignments.length > 0) {
        await prisma.projectSupplier.createMany({
          data: assignments.map((a: any) => {
            const actAmt = parseFloat(a.contractAmount || '0');
            const pdAmt = parseFloat(a.paidAmount || '0');
            return {
              supplierId: id,
              projectId: a.projectId,
              contractAmount: actAmt,
              paidAmount: pdAmt,
              dueAmount: actAmt - pdAmt,
            };
          }),
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_SUPPLIER',
        details: `Updated supplier: ${updatedSupplier.name}`,
      },
    });

    return NextResponse.json({ supplier: updatedSupplier });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
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

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await prisma.supplier.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_SUPPLIER',
        details: `Deleted supplier: ${supplier.name}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
