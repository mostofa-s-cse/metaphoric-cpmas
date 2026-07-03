import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

  // 2. Create Initial Projects
  const projectData = [
    {
      name: 'Skyline Heights Commercial Center',
      code: 'PRJ-SKY-001',
      clientName: 'Skyline Developers Ltd',
      clientContactNumber: '+1 (555) 019-2834',
      projectLocation: '742 Evergreen Terrace, Downtown',
      startDate: new Date('2026-01-01'),
      expectedCompletionDate: new Date('2027-06-30'),
      estimatedBudget: 5000000.0,
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
      estimatedBudget: 3200000.0,
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
      estimatedBudget: 12000000.0,
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

  // 3. Create Sample Suppliers
  const supplierData = [
    {
      name: 'Apex Steel & Cement',
      companyName: 'Apex Materials Group',
      phoneNumber: '+1 (555) 123-4567',
      email: 'sales@apexmaterials.com',
      address: 'Industrial Zone Block C, Cityville',
      openingBalance: 10000.0,
      currentDue: 15000.0,
      notes: 'Key supplier for structural steel and Portland cement.',
    },
    {
      name: 'National Timber & Hardwood',
      companyName: 'National Forest Products',
      phoneNumber: '+1 (555) 987-6543',
      email: 'info@nationaltimber.com',
      address: '44 Logging Way, Forest Town',
      openingBalance: 0.0,
      currentDue: 5400.0,
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

  // 4. Create Sample Vendors
  const vendorData = [
    {
      name: 'John Doe Civil works',
      companyName: 'Doe Excavations & Concrete LLC',
      contactNumber: '+1 (555) 444-1122',
      address: '22 Trench Rd, Metroville',
      workType: 'Civil & Foundation',
      contractAmount: 450000.0,
      paidAmount: 300000.0,
      dueAmount: 150000.0,
      notes: 'Subcontractor handling foundation piling and deep excavating.',
    },
    {
      name: 'BrightSpark Electricals',
      companyName: 'BrightSpark Controls Corp',
      contactNumber: '+1 (555) 777-8899',
      address: '88 Voltage Blvd, Cityville',
      workType: 'Electrical & Wiring',
      contractAmount: 180000.0,
      paidAmount: 80000.0,
      dueAmount: 100000.0,
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

  // 5. Create Sample Employees
  const employeeData = [
    {
      employeeId: 'EMP-001',
      fullName: 'Sarah Jenkins',
      designation: 'Senior Project Engineer',
      department: 'Engineering',
      phoneNumber: '+1 (555) 606-7070',
      email: 'sjenkins@cpmas.com',
      joiningDate: new Date('2024-03-01'),
      monthlySalary: 6500.0,
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
      monthlySalary: 4200.0,
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

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
