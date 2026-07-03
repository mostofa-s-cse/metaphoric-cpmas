import { apiSuccess, apiError, apiUnauthorized } from '@/lib/apiResponse';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const PATH = '/api/projects/list';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
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

    return apiSuccess({ projects }, 'Project basic list retrieved successfully', PATH);
  } catch (error: any) {
    console.error('Projects list fetch error:', error);
    return apiError('Failed to fetch project list', PATH);
  }
}
