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

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
        include: {
          cashOuts: true,
          projectAssignments: {
            include: {
              project: { select: { name: true, code: true } }
            }
          }
        },
      }),
      prisma.vendor.count(),
    ]);

    return NextResponse.json(
      formatPaginatedResponse('vendors', vendors, total, page, limit),
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allowed roles can register vendors (checking user exists is sufficient)

    const body = await request.json();
    const { name, companyName, contactNumber, address, workType, notes, assignments } = body;

    if (!name || !contactNumber || !workType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let cAmt = 0.0;
    let pAmt = 0.0;
    
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      cAmt = assignments.reduce((sum, a) => sum + parseFloat(a.contractAmount || '0'), 0.0);
      pAmt = assignments.reduce((sum, a) => sum + parseFloat(a.paidAmount || '0'), 0.0);
    } else {
      cAmt = parseFloat(body.contractAmount || '0');
      pAmt = parseFloat(body.paidAmount || '0');
    }
    const dAmt = cAmt - pAmt;

    const vendor = await prisma.vendor.create({
      data: { name, companyName, contactNumber, address, workType, contractAmount: cAmt, paidAmount: pAmt, dueAmount: dAmt, notes },
    });

    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      await prisma.projectVendor.createMany({
        data: assignments.map((a: any) => {
          const actAmt = parseFloat(a.contractAmount || '0');
          const pdAmt = parseFloat(a.paidAmount || '0');
          return {
            vendorId: vendor.id,
            projectId: a.projectId,
            contractAmount: actAmt,
            paidAmount: pdAmt,
            dueAmount: actAmt - pdAmt,
          };
        }),
      });
    }

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'CREATE_VENDOR', details: `Registered vendor: ${vendor.name} (${vendor.workType})` },
    });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}
