import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return a basic list containing only ID, Code, and Name for selection menus
    const projects = await prisma.project.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Projects list fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch project list' }, { status: 500 });
  }
}
