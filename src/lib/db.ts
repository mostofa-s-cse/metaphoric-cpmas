import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

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

export const prisma = prismaClient;
