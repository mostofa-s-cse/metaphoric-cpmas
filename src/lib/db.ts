import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { userSessionStore } from './userContext';
import { encrypt, decrypt } from './crypto';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

let prismaClient: PrismaClient;

if (process.env.DATABASE_URL) {
  // Serverless: cap pool size so we don't exhaust Postgres's
  // max connection limit when many function instances each open their own pool.
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const adapter = new PrismaPg(pool);
  prismaClient = globalForPrisma.prisma ?? new PrismaClient({ adapter });
} else {
  prismaClient = globalForPrisma.prisma ?? new PrismaClient();
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

// ─── Financial Amounts Encryption / Decryption Traverser ─────────────────────
//
// Automatically encrypts numeric/string amounts before writes to database,
// and decrypts ciphertexts back into numbers after reads.
//
// ─────────────────────────────────────────────────────────────────────────────

const AMOUNT_FIELDS = [
  'estimatedBudget',
  'openingBalance',
  'currentDue',
  'contractAmount',
  'paidAmount',
  'dueAmount',
  'dailyWage',
  'unitPrice',
  'totalPrice',
  'amount',
  'basicSalary',
  'bonus',
  'deduction',
  'netSalary',
  'monthlySalary'
];

function encryptPayload(obj: any, fields: string[]) {
  if (!obj || typeof obj !== 'object') return;
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      encryptPayload(item, fields);
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (fields.includes(key) && val !== undefined && val !== null) {
      if (typeof val === 'number') {
        obj[key] = encrypt(String(val));
      } else if (typeof val === 'string' && val !== '') {
        if (!val.includes(':')) {
          obj[key] = encrypt(val);
        }
      }
    } else if (typeof val === 'object') {
      encryptPayload(val, fields);
    }
  }
}

function decryptPayload(obj: any, fields: string[]) {
  if (!obj || typeof obj !== 'object') return;
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      decryptPayload(item, fields);
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (fields.includes(key) && val !== undefined && val !== null) {
      if (typeof val === 'string' && val.includes(':')) {
        const decryptedStr = decrypt(val);
        const numVal = parseFloat(decryptedStr);
        obj[key] = isNaN(numVal) ? decryptedStr : numVal;
      } else if (typeof val === 'string' && (val === '0.0' || val === '0')) {
        obj[key] = 0.0;
      }
    } else if (typeof val === 'object') {
      decryptPayload(val, fields);
    }
  }
}

// ─── Auditing & Encryption Extension ──────────────────────────────────────────

const extendedPrisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // 1. Encrypt input amount fields
        encryptPayload(args, AMOUNT_FIELDS);

        // 2. Run the actual query
        const result = await query(args);

        // 3. Decrypt output amount fields in the result
        decryptPayload(result, AMOUNT_FIELDS);

        // 4. Automated Auditing
        const store = userSessionStore.getStore();
        if (
          store?.userId &&
          model !== 'AuditLog' &&
          ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(operation)
        ) {
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
