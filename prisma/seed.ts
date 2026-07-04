import 'dotenv/config';
import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Users for each role
  const roles = [
    { email: 'superadmin@cpmas.com', fullName: 'Super Admin User', role: 'SUPER_ADMIN' },
    { email: 'admin@cpmas.com', fullName: 'Admin User', role: 'ADMIN' },
    { email: 'accountant@cpmas.com', fullName: 'Accountant User', role: 'ACCOUNTANT' },
    { email: 'pm@cpmas.com', fullName: 'Project Manager User', role: 'PROJECT_MANAGER' },
    { email: 'operator@cpmas.com', fullName: 'Data Entry Operator User', role: 'DATA_ENTRY_OPERATOR' },
  ] as const;

  const passwordHash = await bcrypt.hash('Password123!', 10);

  for (const user of roles) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          passwordHash,
        },
      });
      console.log(`Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  // 2. Create Initial Projects (budgets passed as String)
  const projectData = [
    {
      name: 'Skyline Heights Commercial Center',
      code: 'PRJ-SKY-001',
      clientName: 'Skyline Developers Ltd',
      clientContactNumber: '+1 (555) 019-2834',
      projectLocation: '742 Evergreen Terrace, Downtown',
      startDate: new Date('2026-01-01'),
      expectedCompletionDate: new Date('2027-06-30'),
      estimatedBudget: '5000000.0',
      status: 'RUNNING' as const,
      projectType: 'CONSTRUCTION' as const,
      description: 'A 15-story premium commercial building with mixed retail and office spaces.',
    },
    {
      name: 'Greenwood Residential Estate',
      code: 'PRJ-GRN-002',
      clientName: 'Greenwood Estates Inc',
      clientContactNumber: '+1 (555) 014-9988',
      projectLocation: '12 River Road, Suburbs',
      startDate: new Date('2026-03-15'),
      expectedCompletionDate: new Date('2027-12-31'),
      estimatedBudget: '3200000.0',
      status: 'PLANNING' as const,
      projectType: 'SUPERVISION' as const,
      description: 'A gated community containing 45 eco-friendly residential villas.',
    },
    {
      name: 'Metro City Overpass Bridge',
      code: 'PRJ-MTR-003',
      clientName: 'City Municipal Corp',
      clientContactNumber: '+1 (555) 017-7755',
      projectLocation: 'Express Highway Intersect 4',
      startDate: new Date('2025-05-10'),
      expectedCompletionDate: new Date('2026-05-10'),
      estimatedBudget: '12000000.0',
      status: 'COMPLETED' as const,
      projectType: 'CONSTRUCTION' as const,
      description: 'Public infrastructure bridge project spanning 1.2 kilometers.',
    },
  ];

  for (const prj of projectData) {
    const existing = await prisma.project.findUnique({ where: { code: prj.code } });
    if (!existing) {
      await prisma.project.create({ data: prj });
      console.log(`Created project: ${prj.name}`);
    }
  }

  // 3. Create Sample Suppliers (balances passed as String)
  const supplierData = [
    {
      name: 'Apex Steel & Cement',
      companyName: 'Apex Materials Group',
      phoneNumber: '+1 (555) 123-4567',
      email: 'sales@apexmaterials.com',
      address: 'Industrial Zone Block C, Cityville',
      openingBalance: '10000.0',
      currentDue: '15000.0',
      notes: 'Key supplier for structural steel and Portland cement.',
    },
    {
      name: 'National Timber & Hardwood',
      companyName: 'National Forest Products',
      phoneNumber: '+1 (555) 987-6543',
      email: 'info@nationaltimber.com',
      address: '44 Logging Way, Forest Town',
      openingBalance: '0.0',
      currentDue: '5400.0',
      notes: 'Supplier for structural wood framing and scaffolding planks.',
    },
  ];

  for (const sup of supplierData) {
    const existing = await prisma.supplier.findFirst({ where: { name: sup.name } });
    if (!existing) {
      await prisma.supplier.create({ data: sup });
      console.log(`Created supplier: ${sup.name}`);
    }
  }

  // 4. Create Sample Vendors (amounts passed as String)
  const vendorData = [
    {
      name: 'John Doe Civil works',
      companyName: 'Doe Excavations & Concrete LLC',
      contactNumber: '+1 (555) 444-1122',
      address: '22 Trench Rd, Metroville',
      workType: 'Civil & Foundation',
      contractAmount: '450000.0',
      paidAmount: '300000.0',
      dueAmount: '150000.0',
      notes: 'Subcontractor handling foundation piling and deep excavating.',
    },
    {
      name: 'BrightSpark Electricals',
      companyName: 'BrightSpark Controls Corp',
      contactNumber: '+1 (555) 777-8899',
      address: '88 Voltage Blvd, Cityville',
      workType: 'Electrical & Wiring',
      contractAmount: '180000.0',
      paidAmount: '80000.0',
      dueAmount: '100000.0',
      notes: 'Responsible for main electrical risers and distribution panels.',
    },
  ];

  for (const ctr of vendorData) {
    const existing = await prisma.vendor.findFirst({ where: { name: ctr.name } });
    if (!existing) {
      await prisma.vendor.create({ data: ctr });
      console.log(`Created vendor: ${ctr.name}`);
    }
  }

  // 5. Create Sample Employees (salaries passed as String)
  const employeeData = [
    {
      employeeId: 'EMP-001',
      fullName: 'Sarah Jenkins',
      designation: 'Senior Project Engineer',
      department: 'Engineering',
      phoneNumber: '+1 (555) 606-7070',
      email: 'sjenkins@cpmas.com',
      joiningDate: new Date('2024-03-01'),
      monthlySalary: '6500.0',
      employmentStatus: 'ACTIVE',
    },
    {
      employeeId: 'EMP-002',
      fullName: 'Michael Vance',
      designation: 'Assistant Quantity Surveyor',
      department: 'Finance & Planning',
      phoneNumber: '+1 (555) 303-4040',
      email: 'mvance@cpmas.com',
      joiningDate: new Date('2025-07-15'),
      monthlySalary: '4200.0',
      employmentStatus: 'ACTIVE',
    },
  ];

  for (const emp of employeeData) {
    const existing = await prisma.employee.findUnique({ where: { employeeId: emp.employeeId } });
    if (!existing) {
      await prisma.employee.create({ data: emp });
      console.log(`Created employee: ${emp.fullName}`);
    }
  }

  // 6. Website CMS Seed Data
  console.log('Seeding website CMS data...');

  // Services
  if ((await prisma.websiteService.count()) === 0) {
    await prisma.websiteService.createMany({
      data: [
        { title: 'Architectural Design', description: 'Innovative and sustainable architectural solutions for commercial and residential spaces.', imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', order: 1 },
        { title: 'Interior Design', description: 'Crafting interior spaces that balance aesthetics, functionality, and comfort.', imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', order: 2 },
        { title: 'Urban Planning', description: 'Developing comprehensive master plans that shape the future of urban communities.', imageUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80', order: 3 },
        { title: 'Construction Management', description: 'End-to-end project oversight ensuring quality, safety, and timely delivery.', imageUrl: 'https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&w=800&q=80', order: 4 },
      ]
    });
  }

  // Portfolio
  if ((await prisma.websitePortfolio.count()) === 0) {
    await prisma.websitePortfolio.createMany({
      data: [
        { title: 'The Vertex Tower', category: 'Commercial', coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', theChallenge: 'A state-of-the-art 40-story commercial tower featuring sustainable green spaces.', order: 1 },
        { title: 'Lumina Residences', category: 'Residential', coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', theChallenge: 'Luxury apartments with panoramic city views and modern minimalist interiors.', order: 2 },
        { title: 'Eco Pavilion', category: 'Public Space', coverImage: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80', theChallenge: 'An eco-friendly public gathering space built entirely with recycled materials.', order: 3 },
      ]
    });
  }

  // Team
  if ((await prisma.websiteTeam.count()) === 0) {
    await prisma.websiteTeam.createMany({
      data: [
        { name: 'Ar. Rafiqul Islam', role: 'Principal Architect', bio: 'Over 20 years of experience in shaping the modern skyline of Dhaka.', imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80', order: 1 },
        { name: 'Nadia Hossain', role: 'Lead Interior Designer', bio: 'Specializes in creating immersive and functional interior experiences.', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', order: 2 },
        { name: 'Kamal Ahmed', role: 'Chief Structural Engineer', bio: 'Ensuring every visionary design stands strong and safe.', imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', order: 3 },
      ]
    });
  }

  // Trust Badges
  if ((await prisma.websiteTrustBadge.count()) === 0) {
    await prisma.websiteTrustBadge.createMany({
      data: [
        { name: 'ISO 9001 Certified', type: 'CERTIFICATION', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/ISO_9001-2015.svg/120px-ISO_9001-2015.svg.png', order: 1 },
        { name: 'LEED Platinum', type: 'CERTIFICATION', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Leed-Platinum.svg/120px-Leed-Platinum.svg.png', order: 2 },
        { name: 'IAB Member', type: 'PARTNER_LOGO', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Institute_of_Architects_Bangladesh_logo.png/120px-Institute_of_Architects_Bangladesh_logo.png', order: 3 },
      ]
    });
  }

  // Testimonials
  if ((await prisma.websiteTestimonial.count()) === 0) {
    await prisma.websiteTestimonial.createMany({
      data: [
        { clientName: 'Mohammed Rahman', clientRole: 'CEO, Vertex Group', reviewText: 'Metaphoric completely transformed our vision into reality. Their attention to detail is unmatched.', order: 1 },
        { clientName: 'Sarah Jenkins', clientRole: 'Director, Lumina Estates', reviewText: 'Professional, creative, and delivered on time. The best architectural firm we have worked with.', order: 2 },
      ]
    });
  }

  // FAQs
  if ((await prisma.websiteFAQ.count()) === 0) {
    await prisma.websiteFAQ.createMany({
      data: [
        { question: 'Do you handle both design and construction?', answer: 'Yes, we provide end-to-end services from initial conceptualization to final construction management.', order: 1 },
        { question: 'What is your typical project timeline?', answer: 'Timelines vary greatly by project size, but a standard commercial building takes 18-24 months from design to handover.', order: 2 },
        { question: 'Do you offer sustainable/green architecture?', answer: 'Absolutely. We specialize in LEED-certified designs and eco-friendly material sourcing.', order: 3 },
      ]
    });
  }

  // Settings & Sections
  if ((await prisma.websiteSettings.count()) === 0) {
    await prisma.websiteSettings.create({
      data: {
        key: 'BRAND_INFO',
        value: {
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
        }
      }
    });
  }

  if ((await prisma.websiteSection.count()) === 0) {
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
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
