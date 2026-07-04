import React from 'react';
import PortfolioClient from './PortfolioClient';
import { prisma } from '@/lib/db';

export const revalidate = 3600; // revalidate every hour

export default async function PortfolioPage() {
  const items = await prisma.websitePortfolio.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  // Map to simple fields to avoid pass-by-reference issues with Prisma Decimal/Json etc.
  const serializedItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    coverImage: item.coverImage,
    order: item.order,
  }));

  return <PortfolioClient initialItems={serializedItems} />;
}
