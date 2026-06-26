/**
 * CPMAS — Centralised Zod Validation Schemas
 * All form schemas live here. Import from '@/lib/schemas' anywhere in the app.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────
export const roleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'ACCOUNTANT',
  'PROJECT_MANAGER',
  'DATA_ENTRY_OPERATOR',
]);

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  role: roleEnum,
});

export const editUserSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  role: roleEnum,
  newPassword: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'New password must be at least 6 characters',
    }),
});

export const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────
export const projectStatusEnum = z.enum(['PLANNING', 'RUNNING', 'COMPLETED', 'ARCHIVED']);

export const projectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(120, 'Project name is too long'),
  code: z
    .string()
    .min(2, 'Project code is required')
    .max(30, 'Project code is too long')
    .regex(/^[A-Z0-9\-_]+$/i, 'Code can only contain letters, numbers, hyphens and underscores'),
  clientName: z
    .string()
    .min(2, 'Client name is required'),
  clientContactNumber: z
    .string()
    .min(5, 'Contact number is required'),
  projectLocation: z
    .string()
    .min(3, 'Location is required'),
  startDate: z
    .string()
    .min(1, 'Start date is required'),
  expectedCompletionDate: z
    .string()
    .min(1, 'Completion date is required'),
  estimatedBudget: z
    .string()
    .min(1, 'Budget is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Budget must be a positive number',
    }),
  status: projectStatusEnum,
  description: z.string().max(1000, 'Description too long').optional().or(z.literal('')),
}).refine(
  (data) => new Date(data.expectedCompletionDate) > new Date(data.startDate),
  {
    message: 'Completion date must be after start date',
    path: ['expectedCompletionDate'],
  }
);

export type ProjectFormValues = z.infer<typeof projectSchema>;

// ─────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────
export const supplierSchema = z.object({
  name: z
    .string()
    .min(2, 'Supplier name is required'),
  companyName: z.string().optional().or(z.literal('')),
  phoneNumber: z
    .string()
    .min(5, 'Phone number is required'),
  email: z
    .string()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  openingBalance: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)), { message: 'Must be a number' })
    .optional()
    .or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

// ─────────────────────────────────────────────
// CONTRACTORS
// ─────────────────────────────────────────────
export const contractorSchema = z.object({
  name: z.string().min(2, 'Contractor name is required'),
  companyName: z.string().optional().or(z.literal('')),
  contactNumber: z.string().min(5, 'Contact number is required'),
  address: z.string().optional().or(z.literal('')),
  workType: z.string().min(2, 'Work type is required'),
  contractAmount: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: 'Contract amount must be a non-negative number',
    }),
  paidAmount: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: 'Paid amount must be a non-negative number',
    })
    .optional()
    .or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type ContractorFormValues = z.infer<typeof contractorSchema>;

// ─────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────
export const employeeStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

export const employeeSchema = z.object({
  employeeId: z.string().min(2, 'Employee ID is required'),
  fullName: z.string().min(2, 'Full name is required'),
  designation: z.string().min(2, 'Designation is required'),
  department: z.string().min(2, 'Department is required'),
  phoneNumber: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  joiningDate: z.string().min(1, 'Joining date is required'),
  monthlySalary: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Monthly salary must be a positive number',
    }),
  employmentStatus: employeeStatusEnum,
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

// ─────────────────────────────────────────────
// LABOUR
// ─────────────────────────────────────────────
export const labourSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phoneNumber: z.string().min(5, 'Phone number is required'),
  trade: z.string().min(2, 'Trade is required'),
  dailyWage: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Daily wage must be a positive number',
    }),
  projectId: z.string().min(1, 'Project assignment is required'),
  employmentStatus: z.enum(['ACTIVE', 'INACTIVE']),
});

export type LabourFormValues = z.infer<typeof labourSchema>;

// ─────────────────────────────────────────────
// MATERIALS
// ─────────────────────────────────────────────
export const materialSchema = z.object({
  name: z.string().min(2, 'Material name is required'),
  category: z.string().min(2, 'Category is required'),
  quantity: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Quantity must be positive',
    }),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: 'Unit price must be non-negative',
    }),
  supplierId: z.string().min(1, 'Supplier is required'),
  projectId: z.string().min(1, 'Project is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  invoiceNumber: z.string().optional().or(z.literal('')),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;

// ─────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────
export const paymentMethodEnum = z.enum(['CASH', 'BANK', 'CHEQUE', 'MOBILE_BANKING']);

export const cashInSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  projectId: z.string().optional().or(z.literal('')),
  clientName: z.string().min(2, 'Client name is required'),
  amount: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Amount must be positive',
    }),
  paymentMethod: paymentMethodEnum,
  bankOrCash: z.string().min(1, 'Account/Cash name is required'),
  referenceNumber: z.string().optional().or(z.literal('')),
  source: z.string().min(1, 'Source is required'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const cashOutSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  projectId: z.string().optional().or(z.literal('')),
  expenseCategory: z.string().min(1, 'Category is required'),
  paidTo: z.string().min(2, 'Paid to is required'),
  amount: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Amount must be positive',
    }),
  paymentMethod: paymentMethodEnum,
  referenceNumber: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CashInFormValues = z.infer<typeof cashInSchema>;
export type CashOutFormValues = z.infer<typeof cashOutSchema>;

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────
export const documentSchema = z.object({
  name: z.string().min(2, 'Document name is required'),
  url: z.string().min(1, 'File URL or path is required'),
  description: z.string().max(500).optional().or(z.literal('')),
  fileType: z.string().min(1, 'File type is required'),
  category: z.string().min(1, 'Category is required'),
  projectId: z.string().optional().or(z.literal('')),
  supplierId: z.string().optional().or(z.literal('')),
  contractorId: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal('')),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
