import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess } from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/website/public';

async function getHandler(request: NextRequest) {
  const [
    settings,
    sections,
    services,
    portfolio,
    team,
    trustBadges,
    testimonials,
    faqs
  ] = await Promise.all([
    prisma.websiteSettings.findMany(),
    prisma.websiteSection.findMany({ where: { isActive: true } }),
    prisma.websiteService.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.websitePortfolio.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.websiteTeam.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.websiteTrustBadge.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.websiteTestimonial.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    prisma.websiteFAQ.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } })
  ]);

  return apiSuccess({
    settings,
    sections,
    services,
    portfolio,
    team,
    trustBadges,
    testimonials,
    faqs
  }, 'Public website data retrieved successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
