import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { userSessionStore } from './userContext';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

let prismaClient: PrismaClient;

if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prismaClient = globalForPrisma.prisma ?? new PrismaClient({ adapter });
} else {
  // Fallback to default client (which will try to resolve connection string from config)
  prismaClient = globalForPrisma.prisma ?? new PrismaClient();
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

// ─── Auditing Extension for Automated Audit Logging ──────────────────────────
//
// Automatically intercepts write and delete queries, formats a description,
// and saves audit log entries using the raw unextended client to avoid loops.
//
// ─────────────────────────────────────────────────────────────────────────────

const extendedPrisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);

        const store = userSessionStore.getStore();
        if (
          store?.userId &&
          model !== 'AuditLog' &&
          ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(operation)
        ) {
          // Build description details
          let details = `Performed ${operation.toUpperCase()} on model ${model}`;
          let entityName = '';

          if (result && typeof result === 'object') {
            const resObj = result as any;
            entityName = resObj.name || resObj.fullName || resObj.code || resObj.employeeId || '';
          }

          if (operation === 'create' && result && typeof result === 'object' && 'id' in result) {
            details = `Created ${model} record ${entityName ? `(${entityName}) ` : ''}with ID: ${(result as any).id}`;
          } else if (operation === 'update' && result && typeof result === 'object' && 'id' in result) {
            details = `Updated ${model} record ${entityName ? `(${entityName}) ` : ''}with ID: ${(result as any).id}`;
          } else if (operation === 'delete') {
            details = `Deleted ${model} record: ${JSON.stringify(args.where)}`;
          }

          // Use the raw prismaClient to bypass extension and prevent infinite recursion
          prismaClient.auditLog.create({
            data: {
              userId: store.userId,
              action: `${operation.toUpperCase()}_${model.toUpperCase()}`,
              details,
            },
          }).catch((err) => {
            console.error('[DATABASE AUTOMATED AUDITING ERROR]', err);
          });
        }

        return result;
      },
    },
  },
});

export const prisma = extendedPrisma as unknown as PrismaClient;
export const rawPrisma = prismaClient;
