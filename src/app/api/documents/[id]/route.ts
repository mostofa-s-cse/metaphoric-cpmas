import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/apiResponse';

const PATH = '/api/documents';

// Helper to delete physical file from disk
async function deletePhysicalFile(url: string) {
  try {
    const cleanPath = url.replace(/^\/public/, ''); // Normalize legacy prefix
    if (cleanPath.startsWith('/uploads/')) {
      const filename = cleanPath.replace('/uploads/', '');
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
      await fs.unlink(filepath);
      console.log(`Successfully deleted physical file: ${filepath}`);
    }
  } catch (err) {
    // File might not exist or be read-only — fail gracefully
    console.warn('Physical file deletion warning:', err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    // RBAC: Only Super Admin can delete documents
    if (user.role !== 'SUPER_ADMIN') {
      return apiForbidden(PATH, 'Forbidden: Super Admin access required');
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, name: true, url: true, category: true },
    });

    if (!document) {
      return apiNotFound('Document', PATH);
    }

    // 1. Delete the physical file from disk
    await deletePhysicalFile(document.url);

    // 2. Delete the record from database
    await prisma.document.delete({
      where: { id },
    });

    // 3. Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_DOCUMENT',
        details: `Deleted document: ${document.name} (${document.category})`,
      },
    });

    return apiSuccess(null, 'Document deleted successfully', PATH);
  } catch (error) {
    console.error('Error deleting document:', error);
    return apiError('Failed to delete document', PATH);
  }
}
