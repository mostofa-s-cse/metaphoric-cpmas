import { NextResponse } from 'next/server';

// ─── Standardized API Response Envelope ──────────────────────────────────────
//
// Every API response follows this structure:
// {
//   "status": "success" | "error",
//   "message": "Human-readable message",
//   "data": { ... } | null,
//   "timestamp": "ISO 8601",
//   "path": "/api/..."
// }
//
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiEnvelope<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
  timestamp: string;
  path: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedData<T = unknown> {
  items: T[];
  pagination: PaginationMeta;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function envelope<T>(
  status: 'success' | 'error',
  message: string,
  data: T | null,
  path: string,
): ApiEnvelope<T> {
  return {
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
    path,
  };
}

// ─── Success Responses ──────────────────────────────────────────────────────

/**
 * Standard success response.
 * @param data   - The response payload
 * @param message - Human-readable success message
 * @param path   - The API path (e.g. "/api/projects")
 * @param statusCode - HTTP status code (default: 200)
 */
export function apiSuccess<T>(
  data: T,
  message: string,
  path: string,
  statusCode = 200,
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(envelope('success', message, data, path), {
    status: statusCode,
  });
}

/**
 * Success response for resource creation (HTTP 201).
 */
export function apiCreated<T>(
  data: T,
  message: string,
  path: string,
): NextResponse<ApiEnvelope<T>> {
  return apiSuccess(data, message, path, 201);
}

/**
 * Paginated success response.
 * @param key   - The data key name (e.g. "projects", "suppliers")
 * @param items - Array of items
 * @param total - Total count in DB
 * @param page  - Current page number
 * @param limit - Items per page
 * @param message - Human-readable message
 * @param path    - The API path
 */
export function apiPaginated<T>(
  key: string,
  items: T[],
  total: number,
  page: number,
  limit: number,
  message: string,
  path: string,
): NextResponse<ApiEnvelope<Record<string, unknown>>> {
  const data = {
    [key]: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    } as PaginationMeta,
  };
  return NextResponse.json(envelope('success', message, data, path), {
    status: 200,
  });
}

// ─── Error Responses ────────────────────────────────────────────────────────

/**
 * Standard error response.
 */
export function apiError(
  message: string,
  path: string,
  statusCode = 500,
): NextResponse<ApiEnvelope<null>> {
  return NextResponse.json(envelope('error', message, null, path), {
    status: statusCode,
  });
}

/** 400 Bad Request */
export function apiBadRequest(message: string, path: string) {
  return apiError(message, path, 400);
}

/** 401 Unauthorized */
export function apiUnauthorized(path: string) {
  const response = apiError('Unauthorized — Please log in to continue.', path, 401);
  response.cookies.set('auth_token', '', {
    path: '/',
    maxAge: 0,
  });
  return response;
}

/** 403 Forbidden */
export function apiForbidden(path: string, detail?: string) {
  return apiError(
    detail || 'Forbidden — You do not have permission to perform this action.',
    path,
    403,
  );
}

/** 404 Not Found */
export function apiNotFound(resource: string, path: string) {
  return apiError(`${resource} not found.`, path, 404);
}

/** 409 Conflict */
export function apiConflict(message: string, path: string) {
  return apiError(message, path, 409);
}
