import { NextRequest } from 'next/server';

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T, K extends string> {
  [key: string]: any;
  pagination: PaginationMetadata;
}

/**
 * Parses page and limit from NextRequest searchParams.
 */
export function getPaginationParams(request: NextRequest, defaultLimit = 10) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);

  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : defaultLimit;
  const skip = (safePage - 1) * safeLimit;

  // Returns pagination parameters for Prisma query
  return {
    page: safePage,
    limit: safeLimit,
    skip,
    take: safeLimit,
    isPaginated: searchParams.has('page') || searchParams.has('limit'),
  };
}

/**
 * Formats data and pagination metadata into a standardized response.
 */
export function formatPaginatedResponse<T, K extends string>(
  key: K,
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T, K> {
  return {
    [key]: data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
