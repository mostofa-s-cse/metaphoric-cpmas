/**
 * CPMAS — RTK Query API Service
 * All API endpoints with caching, invalidation, and tag management.
 * Split into domain-specific endpoint builders for scalability.
 */
import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'PROJECT_MANAGER'
  | 'DATA_ENTRY_OPERATOR';

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'PLANNING' | 'RUNNING' | 'COMPLETED' | 'ARCHIVED';
export type ProjectType = 'CONSULTANCY' | 'SUPERVISION' | 'CONSTRUCTION' | 'SUPPLYING';

export interface ApiProject {
  id: string;
  name: string;
  code: string;
  clientName: string;
  clientContactNumber: string;
  projectLocation: string;
  startDate: string;
  expectedCompletionDate: string;
  estimatedBudget: number;
  status: ProjectStatus;
  projectType: ProjectType;
  description: string | null;
  materials?: any[];
  cashOuts?: any[];
  cashIns?: any[];
  labours?: any[];
  documents?: any[];
  createdAt: string;
}

export interface ApiSupplier {
  id: string;
  name: string;
  companyName: string | null;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  openingBalance: number;
  currentDue: number;
  notes: string | null;
  materials?: any[];
  cashOuts?: any[];
  createdAt: string;
}

export interface ApiVendor {
  id: string;
  name: string;
  companyName: string | null;
  contactNumber: string;
  address: string | null;
  workType: string;
  contractAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string | null;
  cashOuts?: any[];
  projectAssignments?: {
    id: string;
    projectId: string;
    vendorId: string;
    contractAmount: number;
    paidAmount: number;
    dueAmount: number;
    project: {
      name: string;
      code: string;
    };
  }[];
  createdAt: string;
}

export interface ApiEmployee {
  id: string;
  employeeId: string;
  fullName: string;
  designation: string;
  department: string;
  phoneNumber: string;
  email: string | null;
  joiningDate: string;
  monthlySalary: number;
  employmentStatus: string;
  createdAt: string;
}

export interface ApiLabour {
  id: string;
  name: string;
  phoneNumber: string;
  trade: string;
  dailyWage: number;
  employmentStatus: string;
  projectId: string;
  project: { name: string; code: string };
  attendances?: any[];
  createdAt: string;
}

export interface ApiMaterial {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  supplierId: string;
  supplier: { name: string };
  projectId: string;
  project: { name: string; code: string };
  purchaseDate: string;
  invoiceNumber: string | null;
  createdAt: string;
}

export interface ApiCashIn {
  id: string;
  date: string;
  projectId: string | null;
  project?: { name: string; code: string } | null;
  clientName: string;
  amount: number;
  paymentMethod: string;
  bankOrCash: string;
  referenceNumber: string | null;
  source: string;
  notes: string | null;
  createdAt: string;
}

export interface ApiCashOut {
  id: string;
  date: string;
  projectId: string | null;
  project?: { name: string; code: string } | null;
  expenseCategory: string;
  paidTo: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ApiDocument {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  description: string | null;
  fileType: string;
  category: string;
  projectId?: string | null;
  supplierId?: string | null;
  vendorId?: string | null;
  project?: { name: string; code: string } | null;
  supplier?: { name: string } | null;
  vendor?: { name: string } | null;
  employee?: { fullName: string } | null;
  createdAt: string;
}

// ─── Base Query ───────────────────────────────────────────────────────────────

const baseQuery = retry(
  fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include', // send cookies automatically (JWT)
    prepareHeaders: (headers) => {
      // Disable caching on client-side fetch requests
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      return headers;
    },
  }),
  { maxRetries: 0 }
);

// ─── Cache Tags ───────────────────────────────────────────────────────────────

const TAGS = [
  'Auth',
  'Users',
  'Projects',
  'Suppliers',
  'Vendors',
  'Employees',
  'Labours',
  'Attendance',
  'Materials',
  'CashIn',
  'CashOut',
  'Documents',
  'Reports',
] as const;

type CacheTag = (typeof TAGS)[number];

// ─── Main API ─────────────────────────────────────────────────────────────────

export const cpmasApi = createApi({
  reducerPath: 'cpmasApi',
  baseQuery,
  tagTypes: TAGS,
  endpoints: (builder) => ({
    // ── AUTH ─────────────────────────────────────────────────────────────────

    getMe: builder.query<{ user: ApiUser }, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),

    login: builder.mutation<{ user: ApiUser }, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: TAGS,
    }),

    // ── USERS ────────────────────────────────────────────────────────────────

    getUsers: builder.query<{ users: ApiUser[] }, void>({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ id }) => ({ type: 'Users' as CacheTag, id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    }),

    createUser: builder.mutation<
      { user: ApiUser },
      { fullName: string; email: string; password: string; role: UserRole }
    >({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),

    updateUser: builder.mutation<
      { user: ApiUser },
      { id: string; fullName?: string; email?: string; role?: UserRole; newPassword?: string; profileImage?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
        'Auth',
      ],
    }),

    deleteUser: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),

    // ── PROJECTS ─────────────────────────────────────────────────────────────

    getProjects: builder.query<{ projects: ApiProject[] }, void>({
      query: () => '/projects',
      providesTags: (result) =>
        result
          ? [
              ...result.projects.map(({ id }) => ({ type: 'Projects' as CacheTag, id })),
              { type: 'Projects', id: 'LIST' },
            ]
          : [{ type: 'Projects', id: 'LIST' }],
    }),

    getProject: builder.query<{ project: ApiProject }, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Projects', id }],
    }),

    createProject: builder.mutation<{ project: ApiProject }, Partial<ApiProject>>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: [{ type: 'Projects', id: 'LIST' }],
    }),

    updateProject: builder.mutation<{ project: ApiProject }, { id: string } & Partial<ApiProject>>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
        'Reports',
      ],
    }),

    deleteProject: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Projects', id },
        { type: 'Projects', id: 'LIST' },
        'Reports',
      ],
    }),

    // ── SUPPLIERS ────────────────────────────────────────────────────────────

    getSuppliers: builder.query<{ suppliers: ApiSupplier[] }, void>({
      query: () => '/suppliers',
      providesTags: (result) =>
        result
          ? [
              ...result.suppliers.map(({ id }) => ({ type: 'Suppliers' as CacheTag, id })),
              { type: 'Suppliers', id: 'LIST' },
            ]
          : [{ type: 'Suppliers', id: 'LIST' }],
    }),

    getSupplier: builder.query<{ supplier: ApiSupplier }, string>({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Suppliers', id }],
    }),

    createSupplier: builder.mutation<{ supplier: ApiSupplier }, Partial<ApiSupplier>>({
      query: (body) => ({ url: '/suppliers', method: 'POST', body }),
      invalidatesTags: [{ type: 'Suppliers', id: 'LIST' }],
    }),

    updateSupplier: builder.mutation<
      { supplier: ApiSupplier },
      { id: string } & Partial<ApiSupplier>
    >({
      query: ({ id, ...body }) => ({ url: `/suppliers/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Suppliers', id },
        { type: 'Suppliers', id: 'LIST' },
      ],
    }),

    deleteSupplier: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Suppliers', id },
        { type: 'Suppliers', id: 'LIST' },
      ],
    }),

    // ── VENDORS ──────────────────────────────────────────────────────────────

    getVendors: builder.query<{ vendors: ApiVendor[] }, void>({
      query: () => '/vendors',
      providesTags: (result) =>
        result
          ? [
              ...result.vendors.map(({ id }) => ({ type: 'Vendors' as CacheTag, id })),
              { type: 'Vendors', id: 'LIST' },
            ]
          : [{ type: 'Vendors', id: 'LIST' }],
    }),

    createVendor: builder.mutation<{ vendor: ApiVendor }, any>({
      query: (body) => ({ url: '/vendors', method: 'POST', body }),
      invalidatesTags: [{ type: 'Vendors', id: 'LIST' }, 'Vendors'],
    }),

    updateVendor: builder.mutation<{ vendor: ApiVendor }, any>({
      query: ({ id, ...body }) => ({ url: `/vendors/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Vendors', id },
        { type: 'Vendors', id: 'LIST' },
        'Vendors',
      ],
    }),

    deleteVendor: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/vendors/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Vendors', id },
        { type: 'Vendors', id: 'LIST' },
        'Vendors',
      ],
    }),

    // ── EMPLOYEES ────────────────────────────────────────────────────────────

    getEmployees: builder.query<{ employees: ApiEmployee[] }, void>({
      query: () => '/employees',
      providesTags: (result) =>
        result
          ? [
              ...result.employees.map(({ id }) => ({ type: 'Employees' as CacheTag, id })),
              { type: 'Employees', id: 'LIST' },
            ]
          : [{ type: 'Employees', id: 'LIST' }],
    }),

    createEmployee: builder.mutation<{ employee: ApiEmployee }, Partial<ApiEmployee>>({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employees', id: 'LIST' }],
    }),

    updateEmployee: builder.mutation<
      { employee: ApiEmployee },
      { id: string } & Partial<ApiEmployee>
    >({
      query: ({ id, ...body }) => ({ url: `/employees/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Employees', id },
        { type: 'Employees', id: 'LIST' },
      ],
    }),

    deleteEmployee: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Employees', id },
        { type: 'Employees', id: 'LIST' },
      ],
    }),

    // ── LABOUR ───────────────────────────────────────────────────────────────

    getLabours: builder.query<{ labours: ApiLabour[] }, void>({
      query: () => '/labours',
      providesTags: (result) =>
        result
          ? [
              ...result.labours.map(({ id }) => ({ type: 'Labours' as CacheTag, id })),
              { type: 'Labours', id: 'LIST' },
            ]
          : [{ type: 'Labours', id: 'LIST' }],
    }),

    createLabour: builder.mutation<{ labour: ApiLabour }, Partial<ApiLabour>>({
      query: (body) => ({ url: '/labours', method: 'POST', body }),
      invalidatesTags: [{ type: 'Labours', id: 'LIST' }],
    }),

    updateLabour: builder.mutation<{ labour: ApiLabour }, { id: string } & Partial<ApiLabour>>({
      query: ({ id, ...body }) => ({ url: `/labours/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Labours', id },
        { type: 'Labours', id: 'LIST' },
      ],
    }),

    deleteLabour: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/labours/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Labours', id },
        { type: 'Labours', id: 'LIST' },
      ],
    }),

    // ── MATERIALS ────────────────────────────────────────────────────────────

    getMaterials: builder.query<{ materials: ApiMaterial[] }, void>({
      query: () => '/materials',
      providesTags: (result) =>
        result
          ? [
              ...result.materials.map(({ id }) => ({ type: 'Materials' as CacheTag, id })),
              { type: 'Materials', id: 'LIST' },
            ]
          : [{ type: 'Materials', id: 'LIST' }],
    }),

    createMaterial: builder.mutation<{ material: ApiMaterial }, Partial<ApiMaterial>>({
      query: (body) => ({ url: '/materials', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Materials', id: 'LIST' },
        { type: 'Suppliers', id: 'LIST' },
        { type: 'CashOut', id: 'LIST' },
      ],
    }),

    deleteMaterial: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/materials/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Materials', id },
        { type: 'Materials', id: 'LIST' },
      ],
    }),

    // ── TRANSACTIONS (Cash In / Cash Out) ────────────────────────────────────

    getCashIns: builder.query<{ cashIns: ApiCashIn[] }, void>({
      query: () => '/transactions?type=in',
      providesTags: [{ type: 'CashIn', id: 'LIST' }],
    }),

    getCashOuts: builder.query<{ cashOuts: ApiCashOut[] }, void>({
      query: () => '/transactions?type=out',
      providesTags: [{ type: 'CashOut', id: 'LIST' }],
    }),

    createCashIn: builder.mutation<{ cashIn: ApiCashIn }, Partial<ApiCashIn>>({
      query: (body) => ({ url: '/transactions', method: 'POST', body: { ...body, type: 'CASHIN' } }),
      invalidatesTags: [{ type: 'CashIn', id: 'LIST' }, 'Reports'],
    }),

    createCashOut: builder.mutation<{ cashOut: ApiCashOut }, Partial<ApiCashOut>>({
      query: (body) => ({ url: '/transactions', method: 'POST', body: { ...body, type: 'CASHOUT' } }),
      invalidatesTags: [{ type: 'CashOut', id: 'LIST' }, 'Reports'],
    }),

    deleteCashIn: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/transactions/${id}?type=in`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'CashIn', id: 'LIST' }, 'Reports'],
    }),

    deleteCashOut: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/transactions/${id}?type=out`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'CashOut', id: 'LIST' }, 'Reports'],
    }),

    // ── DOCUMENTS ────────────────────────────────────────────────────────────

    getDocuments: builder.query<{ documents: ApiDocument[] }, void>({
      query: () => '/documents',
      providesTags: (result) =>
        result
          ? [
              ...result.documents.map(({ id }) => ({ type: 'Documents' as CacheTag, id })),
              { type: 'Documents', id: 'LIST' },
            ]
          : [{ type: 'Documents', id: 'LIST' }],
    }),

    createDocument: builder.mutation<{ document: ApiDocument }, Partial<ApiDocument>>({
      query: (body) => ({ url: '/documents', method: 'POST', body }),
      invalidatesTags: [{ type: 'Documents', id: 'LIST' }],
    }),

    deleteDocument: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/documents/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Documents', id },
        { type: 'Documents', id: 'LIST' },
      ],
    }),

    // ── ATTENDANCE ───────────────────────────────────────────────────────────

    getAttendance: builder.query<{ attendance: any[] }, { labourId?: string; date?: string }>({
      query: (params) => {
        const qs = new URLSearchParams(params as any).toString();
        return `/attendance${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),

    createAttendance: builder.mutation<any, any>({
      query: (body) => ({ url: '/attendance', method: 'POST', body }),
      invalidatesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),
  }),
});

// ─── Export hooks ─────────────────────────────────────────────────────────────

export const {
  // Auth
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  // Users
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  // Projects
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  // Suppliers
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  // Vendors
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  // Employees
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  // Labour
  useGetLaboursQuery,
  useCreateLabourMutation,
  useUpdateLabourMutation,
  useDeleteLabourMutation,
  // Materials
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useDeleteMaterialMutation,
  // Transactions
  useGetCashInsQuery,
  useGetCashOutsQuery,
  useCreateCashInMutation,
  useCreateCashOutMutation,
  useDeleteCashInMutation,
  useDeleteCashOutMutation,
  // Documents
  useGetDocumentsQuery,
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  // Attendance
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
} = cpmasApi;
