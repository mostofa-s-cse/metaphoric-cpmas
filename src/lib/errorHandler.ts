import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiBadRequest, apiConflict, apiNotFound } from './apiResponse';
import { userSessionStore } from './userContext';
import { getCurrentUser } from './auth';

export type ApiHandler = (request: any, context: any) => Promise<NextResponse | any> | NextResponse | any;

/**
 * High-order function wrapper to capture all errors in API routes.
 * Prevents routes from crashing, logs details securely, formats
 * errors into standard ApiEnvelope format, and propagates current user session
 * for automated database auditing logs.
 */
export function withErrorHandler(handler: ApiHandler, path: string) {
  return async (request: any, context: any) => {
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      if (user) {
        userId = user.id;
      }
    } catch (e) {
      // Catch silently to let handler handle it if it doesn't require auth
    }

    return userSessionStore.run({ userId }, async () => {
      try {
        return await handler(request, context);
      } catch (error: any) {
        console.error(`[API ERROR] Path: ${path}`, error);

        // Handle Prisma database constraints
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          switch (error.code) {
            case 'P2002': {
              const fields = (error.meta?.target as string[])?.join(', ') || 'field';
              return apiConflict(`A record with this ${fields} already exists.`, path);
            }
            case 'P2003': {
              return apiBadRequest('Relation constraint failed. Referenced record might not exist or is in use.', path);
            }
            case 'P2025': {
              return apiNotFound(error.meta?.cause as string || 'Requested record', path);
            }
            default:
              return apiError(`Database error: ${error.message}`, path, 500);
          }
        }

        // Handle invalid JSON body parser exceptions
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          return apiBadRequest('Invalid JSON payload in request body.', path);
        }

        // Handle custom throw errors with standard status code properties
        if (typeof error.statusCode === 'number') {
          return apiError(error.message, path, error.statusCode);
        }

        // Default fallback
        const defaultMsg = error instanceof Error ? error.message : 'An unexpected server error occurred';
        return apiError(defaultMsg, path, 500);
      }
    });
  };
}
