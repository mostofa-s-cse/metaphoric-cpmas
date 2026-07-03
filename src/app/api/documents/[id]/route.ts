import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Only Super Admin can delete documents
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
