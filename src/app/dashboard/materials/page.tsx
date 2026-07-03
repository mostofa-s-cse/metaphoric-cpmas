'use client';

/**
 * CPMAS — Materials Management
 * Powered by RTK Query, React Hook Form, and Zod schema validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { Modal } from '@/components/ui/Modal';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Pagination } from '@/components/ui/Pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetMaterialsQuery,
  useGetProjectsListQuery,
  useGetSuppliersQuery,
  useCreateMaterialMutation,
  useDeleteMaterialMutation,
} from '@/store/api/cpmasApi';
import { materialSchema, MaterialFormValues } from '@/lib/schemas';
import {
  PackageSearch,
  Plus,
  Search,
  Truck,
  FolderKanban,
  DollarSign,
  Calendar,
  Layers,
  X,
  Trash2,
  Loader2,
  Info,
} from 'lucide-react';

export default function MaterialsPage() {
  const { user } = useAuth();
  const toast = useToast();

  // Queries & Mutations
  const { data: matData, isLoading: isFetchingMaterials, error: matError, refetch: refetchMaterials } = useGetMaterialsQuery();
  const { data: prjData, isLoading: isFetchingProjects } = useGetProjectsListQuery();
  const { data: supData, isLoading: isFetchingSuppliers } = useGetSuppliersQuery();
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [deleteMaterial] = useDeleteMaterialMutation();

  const materials = matData?.materials || [];
  const projects = prjData?.projects || [];
  const suppliers = supData?.suppliers || [];

  // Search filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      category: '',
      quantity: '',
      unit: '',
      unitPrice: '',
      supplierId: '',
      projectId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
    },
    mode: 'all',
  });

  const handleOpenCreate = () => {
    if (projects.length === 0) {
      toast.error('You must create a Project before logging materials');
      return;
    }
    if (suppliers.length === 0) {
      toast.error('You must create a Supplier before logging materials');
      return;
    }

    reset({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      unitPrice: '',
      supplierId: '',
      projectId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setMaterialToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    try {
      await toast.handlePromise(deleteMaterial(materialToDelete).unwrap());
      refetchMaterials();
      setDeleteConfirmOpen(false);
      setMaterialToDelete(null);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const onSubmit = async (values: MaterialFormValues) => {
    try {
      const payload = {
        ...values,
        quantity: parseFloat(values.quantity),
        unitPrice: parseFloat(values.unitPrice),
      };
      await toast.handlePromise(createMaterial(payload).unwrap());
      refetchMaterials();
      setIsModalOpen(false);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const filteredMaterials = materials.filter(
    (mat) =>
      mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => { setPage(1); }, [searchTerm]);

  const paginatedMaterials = filteredMaterials.slice((page - 1) * limit, page * limit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const isFetching = isFetchingMaterials || isFetchingProjects || isFetchingSuppliers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <PackageSearch className="h-5.5 w-5.5 text-cyan-400" />
            Inventory &amp; Materials Purchase Log
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Track material deliveries, log challan details, assign items to active projects, and link suppliers
          </p>
        </div>

        {user && user.role !== 'ACCOUNTANT' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-550 text-slate-950 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer text-xs"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Log Material Purchase</span>
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by material, supplier, project, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
        />
      </div>

      {/* Main Table */}
      {isFetching ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <span className="text-slate-500 text-xs font-semibold">Loading materials inventory...</span>
        </div>
      ) : matError ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-6">
          <PackageSearch className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-slate-350 text-sm font-semibold">Failed to fetch materials ledger</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
          <PackageSearch className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-slate-400 text-sm font-bold">No purchase logs found</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
            {searchTerm
              ? 'Try adjusting your search query.'
              : 'Log a new material delivery invoice to track material budgets on projects.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/25 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="py-4.5 px-6">Material details</th>
                  <th className="py-4.5 px-4">Project Assigned</th>
                  <th className="py-4.5 px-4">Supplier Vendor</th>
                  <th className="py-4.5 px-4">Invoice / Challan</th>
                  <th className="py-4.5 px-4">Qty &amp; Unit Price</th>
                  <th className="py-4.5 px-4">Total Cost</th>
                  <th className="py-4.5 px-4">Date logged</th>
                  {user && user.role !== 'ACCOUNTANT' && <th className="py-4.5 px-6 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {paginatedMaterials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4.5 px-6">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                        {mat.category}
                      </span>
                      <h4 className="font-bold text-slate-200 mt-0.5">{mat.name}</h4>
                    </td>
                    <td className="py-4.5 px-4">
                      <div className="flex items-center gap-1.5 max-w-[140px]">
                        <FolderKanban className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-300 font-semibold">{mat.project.name}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-4">
                      <div className="flex items-center gap-1.5 max-w-[140px]">
                        <Truck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-350">{mat.supplier.name}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-4 text-slate-400 font-mono text-[10px]">
                      {mat.invoiceNumber || '—'}
                    </td>
                    <td className="py-4.5 px-4 text-slate-400">
                      <span className="text-slate-200 font-bold">{mat.quantity}</span> {mat.unit}{' '}
                      <span className="text-[10px] text-slate-600 block mt-0.5">
                        @ {formatCurrency(mat.unitPrice)}
                      </span>
                    </td>
                    <td className="py-4.5 px-4 font-bold text-slate-200">{formatCurrency(mat.totalPrice)}</td>
                    <td className="py-4.5 px-4 text-slate-450 font-mono text-[10px]">
                      {new Date(mat.purchaseDate).toLocaleDateString()}
                    </td>
                    {user && user.role !== 'ACCOUNTANT' && (
                      <td className="py-4.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteClick(mat.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(filteredMaterials.length / limit)}
            totalItems={filteredMaterials.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      )}

      {/* Log Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <PackageSearch className="h-4.5 w-4.5 text-cyan-400" />
            Log Material Purchase Invoice
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Item Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Portland Cement 50Grade"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                  errors.name
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              />
              {errors.name && <p className="text-rose-400 text-[10px] mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Category</label>
              <input
                type="text"
                {...register('category')}
                placeholder="e.g. Cement"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                  errors.category
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              />
              {errors.category && <p className="text-rose-400 text-[10px] mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Quantity</label>
              <input
                type="text"
                {...register('quantity')}
                placeholder="e.g. 500"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                  errors.quantity
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              />
              {errors.quantity && <p className="text-rose-400 text-[10px] mt-1">{errors.quantity.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Unit</label>
              <input
                type="text"
                {...register('unit')}
                placeholder="e.g. Bags"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                  errors.unit
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              />
              {errors.unit && <p className="text-rose-400 text-[10px] mt-1">{errors.unit.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Unit Price ($)</label>
              <input
                type="text"
                {...register('unitPrice')}
                placeholder="e.g. 8.50"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                  errors.unitPrice
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              />
              {errors.unitPrice && (
                <p className="text-rose-400 text-[10px] mt-1">{errors.unitPrice.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Supplier</label>
              <select
                {...register('supplierId')}
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all cursor-pointer ${
                  errors.supplierId
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="text-rose-400 text-[10px] mt-1">{errors.supplierId.message}</p>}
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Assign to Project</label>
              <select
                {...register('projectId')}
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all cursor-pointer ${
                  errors.projectId
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              >
                <option value="">Select Project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
              {errors.projectId && <p className="text-rose-400 text-[10px] mt-1">{errors.projectId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Purchase Date</label>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <DatePickerInput
                    id="purchaseDate"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.purchaseDate}
                  />
                )}
              />
              {errors.purchaseDate && (
                <p className="text-rose-400 text-[10px] mt-1">{errors.purchaseDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Invoice / Challan #</label>
              <input
                type="text"
                {...register('invoiceNumber')}
                placeholder="e.g. INV-9283"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                  errors.invoiceNumber
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                }`}
              />
              {errors.invoiceNumber && (
                <p className="text-rose-400 text-[10px] mt-1">{errors.invoiceNumber.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer animate-in duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record?"
        description="Delete this purchase record? The associated expense transaction logged under the project accounts will also be deleted."
        confirmText="Delete"
        isConfirming={false}
      />
    </div>
  );
}
