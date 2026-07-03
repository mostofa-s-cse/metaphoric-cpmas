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

    if (user.role === 'ACCOUNTANT' || user.role === 'DATA_ENTRY_OPERATOR') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, companyName, contactNumber, address, workType, contractAmount, paidAmount, notes } = body;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const cAmt = contractAmount !== undefined ? parseFloat(contractAmount) : vendor.contractAmount;
    const pAmt = paidAmount !== undefined ? parseFloat(paidAmount) : vendor.paidAmount;
    const dAmt = cAmt - pAmt;

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: name || undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        contactNumber: contactNumber || undefined,
        address: address !== undefined ? address : undefined,
        workType: workType || undefined,
        contractAmount: cAmt,
        paidAmount: pAmt,
        dueAmount: dAmt,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_VENDOR',
        details: `Updated vendor: ${updatedVendor.name}`,
      },
    });

    return NextResponse.json({ vendor: updatedVendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
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
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    await prisma.vendor.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_VENDOR',
        details: `Deleted vendor: ${vendor.name}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
}
