import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import {
  apiSuccess,
  apiCreated,
  apiPaginated,
  apiError,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
} from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/materials';

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
  const where: Prisma.MaterialWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { project: { name: { contains: search, mode: 'insensitive' } } },
          { supplier: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      ...(hasPage || hasLimit ? { skip, take: limit } : {}),
      include: {
        supplier: { select: { name: true } },
        project: { select: { name: true, code: true } },
      },
    }),
    prisma.material.count({ where }),
  ]);

  return apiPaginated(
    'materials',
    materials,
    total,
    page,
    limit,
    'Materials inventory retrieved successfully',
    PATH
  );
}

async function postHandler(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }

  if (user.role === 'ACCOUNTANT') {
    return apiForbidden(PATH, 'Accountants are not permitted to register daily material inventory records');
  }

  const body = await request.json();
  const { name, category, quantity, unit, unitPrice, supplierId, projectId, purchaseDate, invoiceNumber } = body;

  if (!name || !category || !quantity || !unit || !unitPrice || !supplierId || !projectId || !purchaseDate) {
    return apiBadRequest('Missing required inventory fields', PATH);
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

  return apiCreated({ material, cashOut }, 'Material purchase recorded successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
export const POST = withErrorHandler(postHandler, PATH);
