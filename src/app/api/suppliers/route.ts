import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getPaginationParams, formatPaginatedResponse } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { page, limit, skip, take } = getPaginationParams(request);

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
        include: { 
          materials: true, 
          cashOuts: true,
          projectAssignments: {
            include: {
              project: { select: { name: true, code: true } }
            }
          }
        },
      }),
      prisma.supplier.count(),
    ]);

    return NextResponse.json(
      formatPaginatedResponse('suppliers', suppliers, total, page, limit),
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'PROJECT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await request.json();
    const { name, companyName, phoneNumber, email, address, openingBalance, notes, assignments } = body;

    if (!name || !phoneNumber) {
      return NextResponse.json({ error: 'Name and Phone Number are required' }, { status: 400 });
    }

    let oBalance = parseFloat(openingBalance) || 0.0;
    
    // We are maintaining supplier project calculations exactly like contractor/vendors
    // We will use openingBalance as the general current due if there are no assignments,
    // otherwise the currentDue logic can sum up the assignments dueAmount.
    
    let cAmt = 0.0;
    let pAmt = 0.0;
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      cAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.contractAmount || '0'), 0.0);
      pAmt = assignments.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount || '0'), 0.0);
    }
    const dAmt = cAmt - pAmt;
    
    // We'll consider currentDue as sum of assignment dues + any opening balance dues
    const totalDue = dAmt + oBalance;

    const supplier = await prisma.supplier.create({
      data: {
        name, companyName, phoneNumber, email, address,
        openingBalance: oBalance,
        currentDue: totalDue,
        notes,
      },
    });

    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      await prisma.projectSupplier.createMany({
        data: assignments.map((a: any) => {
          const actAmt = parseFloat(a.contractAmount || '0');
          const pdAmt = parseFloat(a.paidAmount || '0');
          return {
            supplierId: supplier.id,
            projectId: a.projectId,
            contractAmount: actAmt,
            paidAmount: pdAmt,
            dueAmount: actAmt - pdAmt,
          };
        }),
      });
    }

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'CREATE_SUPPLIER', details: `Created supplier: ${supplier.name}` },
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
