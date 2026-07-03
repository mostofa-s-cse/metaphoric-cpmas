import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiUnauthorized,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/transactions';

async function getHandler(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'in' | 'out' | null
  const search = searchParams.get('search') || '';
  const hasPage = searchParams.has('page');
  const hasLimit = searchParams.has('limit');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;

  // Search filter configuration for CashIn
  const cashInWhere: Prisma.CashInWhereInput = search
    ? {
        OR: [
          { clientName: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { project: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

  // Search filter configuration for CashOut
  const cashOutWhere: Prisma.CashOutWhereInput = search
    ? {
        OR: [
          { paidTo: { contains: search, mode: 'insensitive' } },
          { expenseCategory: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { project: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

  if (type === 'in') {
    const cashIns = await prisma.cashIn.findMany({
      where: cashInWhere,
      orderBy: { date: 'desc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: { project: { select: { name: true, code: true } } },
    });
    return apiSuccess({ cashIns }, 'Cash-in transactions retrieved successfully', PATH);
  }

  if (type === 'out') {
    const cashOuts = await prisma.cashOut.findMany({
      where: cashOutWhere,
      orderBy: { date: 'desc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: {
        project: { select: { name: true, code: true } },
        supplier: { select: { name: true } },
        vendor: { select: { name: true } },
        employee: { select: { fullName: true } },
      },
    });
    return apiSuccess({ cashOuts }, 'Cash-out transactions retrieved successfully', PATH);
  }

  // Default: return both
  const [cashIns, cashOuts] = await Promise.all([
    prisma.cashIn.findMany({
      where: cashInWhere,
      orderBy: { date: 'desc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: { project: { select: { name: true, code: true } } },
    }),
    prisma.cashOut.findMany({
      where: cashOutWhere,
      orderBy: { date: 'desc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: {
        project: { select: { name: true, code: true } },
        supplier: { select: { name: true } },
        vendor: { select: { name: true } },
        employee: { select: { fullName: true } },
      },
    }),
  ]);

  return apiSuccess({ cashIns, cashOuts }, 'All transactions retrieved successfully', PATH);
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

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
    return apiBadRequest('Missing required transactional details', PATH);
  }

  const txnAmount = parseFloat(amount);

  if (type === 'CASHIN') {
    if (!clientName || !source || !bankOrCash) {
      return apiBadRequest('Missing required Cash In details', PATH);
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

    return apiCreated({ cashIn }, 'Cash-in transaction recorded successfully', PATH);
  } else if (type === 'CASHOUT') {
    if (!expenseCategory || !paidTo) {
      return apiBadRequest('Missing required Cash Out details', PATH);
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

    return apiCreated({ cashOut }, 'Cash-out transaction recorded successfully', PATH);
  } else {
    return apiBadRequest('Invalid transaction type specified', PATH);
  }
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
