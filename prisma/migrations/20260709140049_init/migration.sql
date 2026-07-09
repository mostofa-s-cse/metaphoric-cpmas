-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER', 'DATA_ENTRY_OPERATOR');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'RUNNING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('CONSULTANCY', 'SUPERVISION', 'CONSTRUCTION', 'SUPPLYING');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');

-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('PAID', 'PARTIAL', 'DUE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "profileImage" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DATA_ENTRY_OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientContactNumber" TEXT NOT NULL,
    "projectLocation" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedCompletionDate" TIMESTAMP(3) NOT NULL,
    "estimatedBudget" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "projectType" "ProjectType" NOT NULL DEFAULT 'CONSTRUCTION',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "openingBalance" TEXT NOT NULL DEFAULT '0.0',
    "currentDue" TEXT NOT NULL DEFAULT '0.0',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "contactNumber" TEXT NOT NULL,
    "address" TEXT,
    "workType" TEXT NOT NULL,
    "contractAmount" TEXT NOT NULL DEFAULT '0.0',
    "paidAmount" TEXT NOT NULL DEFAULT '0.0',
    "dueAmount" TEXT NOT NULL DEFAULT '0.0',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "monthlySalary" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Labour" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "dailyWage" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Labour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "labourId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" TEXT NOT NULL,
    "totalPrice" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashIn" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,
    "clientName" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankOrCash" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashOut" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,
    "expenseCategory" TEXT NOT NULL,
    "paidTo" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "supplierId" TEXT,
    "vendorId" TEXT,
    "employeeId" TEXT,
    "labourId" TEXT,
    "materialId" TEXT,
    "salaryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salary" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "basicSalary" TEXT NOT NULL,
    "bonus" TEXT NOT NULL DEFAULT '0.0',
    "deduction" TEXT NOT NULL DEFAULT '0.0',
    "netSalary" TEXT NOT NULL,
    "paidAmount" TEXT NOT NULL DEFAULT '0.0',
    "dueAmount" TEXT NOT NULL DEFAULT '0.0',
    "paymentStatus" "SalaryStatus" NOT NULL DEFAULT 'DUE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "projectId" TEXT,
    "supplierId" TEXT,
    "vendorId" TEXT,
    "employeeId" TEXT,
    "labourId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectVendor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "contractAmount" TEXT NOT NULL DEFAULT '0.0',
    "paidAmount" TEXT NOT NULL DEFAULT '0.0',
    "dueAmount" TEXT NOT NULL DEFAULT '0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSupplier" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "contractAmount" TEXT NOT NULL DEFAULT '0.0',
    "paidAmount" TEXT NOT NULL DEFAULT '0.0',
    "dueAmount" TEXT NOT NULL DEFAULT '0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSection" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "highlight" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "extraData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WebsiteService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsitePortfolio" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "beforeImage" TEXT,
    "afterImage" TEXT,
    "theChallenge" TEXT,
    "theSolution" TEXT,
    "theOutcome" TEXT,
    "projectMetrics" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WebsitePortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WebsiteTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteTrustBadge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WebsiteTrustBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteTestimonial" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientRole" TEXT NOT NULL,
    "reviewText" TEXT NOT NULL,
    "portfolioId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WebsiteTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteFAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WebsiteFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE INDEX "Employee_fullName_idx" ON "Employee"("fullName");

-- CreateIndex
CREATE INDEX "Labour_name_idx" ON "Labour"("name");

-- CreateIndex
CREATE INDEX "Labour_trade_idx" ON "Labour"("trade");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_labourId_date_key" ON "Attendance"("labourId", "date");

-- CreateIndex
CREATE INDEX "Material_name_idx" ON "Material"("name");

-- CreateIndex
CREATE INDEX "Material_category_idx" ON "Material"("category");

-- CreateIndex
CREATE INDEX "CashIn_clientName_idx" ON "CashIn"("clientName");

-- CreateIndex
CREATE INDEX "CashIn_date_idx" ON "CashIn"("date");

-- CreateIndex
CREATE INDEX "CashOut_paidTo_idx" ON "CashOut"("paidTo");

-- CreateIndex
CREATE INDEX "CashOut_date_idx" ON "CashOut"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Salary_employeeId_month_key" ON "Salary"("employeeId", "month");

-- CreateIndex
CREATE INDEX "Document_name_idx" ON "Document"("name");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectVendor_projectId_vendorId_key" ON "ProjectVendor"("projectId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSupplier_projectId_supplierId_key" ON "ProjectSupplier"("projectId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteSettings_key_key" ON "WebsiteSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteSection_sectionKey_key" ON "WebsiteSection"("sectionKey");

-- AddForeignKey
ALTER TABLE "Labour" ADD CONSTRAINT "Labour_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashIn" ADD CONSTRAINT "CashIn_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashOut" ADD CONSTRAINT "CashOut_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashOut" ADD CONSTRAINT "CashOut_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashOut" ADD CONSTRAINT "CashOut_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashOut" ADD CONSTRAINT "CashOut_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashOut" ADD CONSTRAINT "CashOut_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashOut" ADD CONSTRAINT "CashOut_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashOut" ADD CONSTRAINT "CashOut_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "Salary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salary" ADD CONSTRAINT "Salary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectVendor" ADD CONSTRAINT "ProjectVendor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectVendor" ADD CONSTRAINT "ProjectVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSupplier" ADD CONSTRAINT "ProjectSupplier_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSupplier" ADD CONSTRAINT "ProjectSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
