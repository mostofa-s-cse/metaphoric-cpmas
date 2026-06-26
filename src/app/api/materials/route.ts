import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const materials = await prisma.material.findMany({
      orderBy: { purchaseDate: 'desc' },
      include: {
        supplier: { select: { name: true } },
        project: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch materials inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'ACCOUNTANT') {
      // Accountant is not supposed to add daily material inventory records, only payments
    }

    const body = await request.json();
    const { name, category, quantity, unit, unitPrice, supplierId, projectId, purchaseDate, invoiceNumber } = body;

    if (!name || !category || !quantity || !unit || !unitPrice || !supplierId || !projectId || !purchaseDate) {
      return NextResponse.json({ error: 'Missing required inventory fields' }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const total = qty * price;

    const material = await prisma.material.create({
      data: {
        name,
        category,
        quantity: qty,
        unit,
        unitPrice: price,
        totalPrice: total,
        supplierId,
        projectId,
        purchaseDate: new Date(purchaseDate),
        invoiceNumber,
      },
    });

    // Also automatically log a CashOut expense record for this material purchase!
    const cashOut = await prisma.cashOut.create({
      data: {
        date: new Date(purchaseDate),
        projectId,
        expenseCategory: 'MATERIALS',
        paidTo: `Material Purchase: ${name}`,
        amount: total,
        paymentMethod: 'CASH', // default
        referenceNumber: invoiceNumber,
        notes: `Auto-generated from Material Purchase registry. Qty: ${qty} ${unit} @ $${price}/${unit}`,
        supplierId,
        materialId: material.id,
      },
    });

    // Automatically update the supplier's due balance if not fully cleared (simulated by adding to current due)
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        currentDue: {
          increment: total,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_MATERIAL',
        details: `Purchased material: ${material.name} - Total: $${total}`,
      },
    });

    return NextResponse.json({ material, cashOut });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to record material purchase' }, { status: 500 });
  }
}
