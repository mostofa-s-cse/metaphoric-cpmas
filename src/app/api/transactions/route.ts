import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'in' | 'out' | null

    if (type === 'in') {
      const cashIns = await prisma.cashIn.findMany({
        orderBy: { date: 'desc' },
        include: { project: { select: { name: true, code: true } } },
      });
      return NextResponse.json({ cashIns }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (type === 'out') {
      const cashOuts = await prisma.cashOut.findMany({
        orderBy: { date: 'desc' },
        include: {
          project: { select: { name: true, code: true } },
          supplier: { select: { name: true } },
          vendor: { select: { name: true } },
          employee: { select: { fullName: true } },
        },
      });
      return NextResponse.json({ cashOuts }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Default: return both
    const [cashIns, cashOuts] = await Promise.all([
      prisma.cashIn.findMany({
        orderBy: { date: 'desc' },
        include: { project: { select: { name: true, code: true } } },
      }),
      prisma.cashOut.findMany({
        orderBy: { date: 'desc' },
        include: {
          project: { select: { name: true, code: true } },
          supplier: { select: { name: true } },
          vendor: { select: { name: true } },
          employee: { select: { fullName: true } },
        },
      }),
    ]);

    return NextResponse.json({ cashIns, cashOuts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch financial ledger' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allowed roles can register transactions (checking user exists is sufficient)

    const body = await request.json();
    const {
      type, // 'CASHIN' | 'CASHOUT'
      date,
      projectId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
      
      // CashIn specific
      clientName,
      source,
      bankOrCash,

      // CashOut specific
      expenseCategory,
      paidTo,
      supplierId,
      vendorId,
      employeeId,
    } = body;

    if (!type || !date || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required transactional details' }, { status: 400 });
    }

    const txnAmount = parseFloat(amount);

    if (type === 'CASHIN') {
      if (!clientName || !source || !bankOrCash) {
        return NextResponse.json({ error: 'Missing required Cash In details' }, { status: 400 });
      }

      const cashIn = await prisma.cashIn.create({
        data: {
          date: new Date(date),
          projectId: projectId || null,
          clientName,
          amount: txnAmount,
          paymentMethod,
          bankOrCash,
          referenceNumber,
          source,
          notes,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_CASH_IN',
          details: `Recorded Cash In: $${txnAmount} from ${clientName} (${source})`,
        },
      });

      return NextResponse.json({ success: true, transaction: cashIn });
    } else if (type === 'CASHOUT') {
      if (!expenseCategory || !paidTo) {
        return NextResponse.json({ error: 'Missing required Cash Out details' }, { status: 400 });
      }

      const cashOut = await prisma.cashOut.create({
        data: {
          date: new Date(date),
          projectId: projectId || null,
          expenseCategory,
          paidTo,
          amount: txnAmount,
          paymentMethod,
          referenceNumber,
          notes,
          supplierId: supplierId || null,
          vendorId: vendorId || null,
          employeeId: employeeId || null,
        },
      });

      // Update vendor balances if vendor payment
      if (vendorId) {
        await prisma.vendor.update({
          where: { id: vendorId },
          data: {
            paidAmount: { increment: txnAmount },
            dueAmount: { decrement: txnAmount },
          },
        });

        if (projectId) {
          await prisma.projectVendor.updateMany({
            where: { vendorId, projectId },
            data: {
              paidAmount: { increment: txnAmount },
              dueAmount: { decrement: txnAmount },
            },
          });
        }
      }

      // Update supplier balances if supplier payment
      if (supplierId) {
        await prisma.supplier.update({
          where: { id: supplierId },
          data: {
            currentDue: { decrement: txnAmount },
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_CASH_OUT',
          details: `Recorded Cash Out: $${txnAmount} for ${expenseCategory} to ${paidTo}`,
        },
      });

      return NextResponse.json({ success: true, transaction: cashOut });
    } else {
      return NextResponse.json({ error: 'Invalid transaction type specified' }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
  }
}
