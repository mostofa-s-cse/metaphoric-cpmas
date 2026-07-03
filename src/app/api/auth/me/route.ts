import { apiSuccess, apiUnauthorized } from '@/lib/apiResponse';
import { getCurrentUser } from '@/lib/auth';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/auth/me';

async function getHandler() {
  const user = await getCurrentUser();
  if (!user) {
    return apiUnauthorized(PATH);
  }
  return apiSuccess({ user }, 'User session retrieved', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
