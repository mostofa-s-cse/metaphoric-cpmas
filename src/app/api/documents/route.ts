import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiBadRequest,
  apiUnauthorized,
} from '@/lib/apiResponse';

const PATH = '/api/documents';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    const documents = await prisma.document.findMany({
      orderBy: { uploadDate: 'desc' },
      include: {
        project: { select: { name: true, code: true } },
        supplier: { select: { name: true } },
        vendor: { select: { name: true } },
      },
    });

    return apiSuccess({ documents }, 'Documents retrieved successfully', PATH);
  } catch (error) {
    console.error('Fetch documents error:', error);
    return apiError('Failed to fetch document index', PATH);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    const body = await request.json();
    const { name, url, fileType, category, projectId, supplierId, vendorId, description, mockUrl } = body;

    if (!name || !fileType || !category) {
      return apiBadRequest('Name, File Type and Category are required', PATH);
    }

    // Generate a default mock URL if not provided (defaulting to /uploads/ relative format)
    const docUrl = url || mockUrl || `/uploads/${name.toLowerCase().replace(/\s+/g, '_')}.${fileType.toLowerCase()}`;

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

    return apiCreated({ document }, 'Document uploaded successfully', PATH);
  } catch (error) {
    console.error('Create document error:', error);
    return apiError('Failed to upload document', PATH);
  }
}
