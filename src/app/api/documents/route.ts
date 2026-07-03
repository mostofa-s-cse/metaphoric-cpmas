import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      orderBy: { uploadDate: 'desc' },
      include: {
        project: { select: { name: true, code: true } },
        supplier: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch document index' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, fileType, category, projectId, supplierId, vendorId, description, mockUrl } = body;

    if (!name || !fileType || !category) {
      return NextResponse.json({ error: 'Name, File Type and Category are required' }, { status: 400 });
    }

    // Generate a default mock URL if not provided
    const docUrl = mockUrl || `/public/uploads/${name.toLowerCase().replace(/\s+/g, '_')}.${fileType.toLowerCase()}`;

    const document = await prisma.document.create({
      data: {
        name,
        fileType,
        category,
        url: docUrl,
        projectId: projectId || null,
        supplierId: supplierId || null,
        vendorId: vendorId || null,
        description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPLOAD_DOCUMENT',
        details: `Uploaded document: ${document.name} (${document.category})`,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
