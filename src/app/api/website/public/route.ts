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

  let settingsList = settings;
  if (settingsList.length === 0) {
    try {
      const defaultBrand = {
        name: 'Metaphoric',
        nameAlt: 'Metaphoric Architect',
        tagline: 'Architect',
        city: 'Dhaka, Bangladesh',
        facebook: 'https://www.facebook.com/metaphoricarchitect',
        instagram: 'https://www.instagram.com/',
        email: 'info@metaphoricarchitect.com',
        phone: '+880 1XXX-XXXXXX',
        address: 'Dhaka, Bangladesh',
        followers: '15.8K',
        years: '10+',
        projects: '200+',
        satisfaction: '98%',
        studioDesc: 'Metaphoric Architect is a Dhaka-based multidisciplinary firm specializing in architecture, interior design, urban planning, construction management, and consulting. We craft spaces that blend timeless form with purposeful function.'
      };
      const created = await prisma.websiteSettings.create({
        data: {
          key: 'BRAND_INFO',
          value: defaultBrand
        }
      });
      settingsList = [created];
    } catch (e) {
      console.error('Failed to seed settings on the fly', e);
    }
  }

  let sectionsList = sections;
  if (sectionsList.length === 0) {
    try {
      await prisma.websiteSection.createMany({
        data: [
          {
            sectionKey: 'HERO',
            title: 'Build',
            highlight: 'Dreams.',
            subtitle: 'Architecture · Design · Planning · Dhaka',
            description: 'Metaphoric Architect is a Dhaka-based firm delivering architecture, design, planning, construction & consulting services across Bangladesh.',
            imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2800&q=80',
            videoUrl: '',
            isActive: true
          },
          {
            sectionKey: 'ABOUT_FIRM',
            title: 'Spaces that speak',
            highlight: 'purpose.',
            subtitle: '01. The Firm',
            description: 'Metaphoric Architect is a Dhaka-based firm specializing in architecture, interior design, urban planning, construction management, and consulting.',
            imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
            isActive: true
          }
        ]
      });
      sectionsList = await prisma.websiteSection.findMany({ where: { isActive: true } });
    } catch (e) {
      console.error('Failed to seed sections on the fly', e);
    }
  }

  // Transform settings array to key-value object
  const settingsObject = settingsList.reduce((acc, curr) => {
    let val = curr.value as any;
    if (curr.key === 'BRAND_INFO' && val && !val.studioDesc) {
      val = {
        ...val,
        studioDesc: 'Metaphoric Architect is a Dhaka-based multidisciplinary firm specializing in architecture, interior design, urban planning, construction management, and consulting. We craft spaces that blend timeless form with purposeful function.'
      };
      // Save it back asynchronously so next time it is already saved in the database
      prisma.websiteSettings.update({
        where: { key: 'BRAND_INFO' },
        data: { value: val }
      }).catch(console.error);
    }
    acc[curr.key] = val;
    return acc;
  }, {} as Record<string, any>);

  return apiSuccess({
    settings: settingsObject,
    sections: sectionsList,
    services,
    portfolio,
    team,
    trustBadges,
    testimonials,
    faqs
  }, 'Public website data retrieved successfully', PATH);
}

export const GET = withErrorHandler(getHandler, PATH);
