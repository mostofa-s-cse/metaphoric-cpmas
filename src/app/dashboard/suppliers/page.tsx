'use client';

/**
 * CPMAS — Suppliers Registry
 * Powered by RTK Query, React Hook Form, and Zod schema validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Pagination } from '@/components/ui/Pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetProjectsListQuery,
  ApiSupplier,
} from '@/store/api/cpmasApi';
import { supplierSchema, SupplierFormValues } from '@/lib/schemas';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  X,
  Trash2,
  Edit2,
  Loader2,
  Clock,
  History,
} from 'lucide-react';

export default function SuppliersPage() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Queries & Mutations
  const { data, isLoading: isFetching, error: fetchError, refetch: refetchSuppliers } = useGetSuppliersQuery();
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();

  const suppliers = data?.suppliers || [];
  const { data: projectsData } = useGetProjectsListQuery();
  const projects = projectsData?.projects || [];

  // Search filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<ApiSupplier | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      companyName: '',
      phoneNumber: '',
      email: '',
      address: '',
      openingBalance: '0',
      notes: '',
      assignments: [],
    },
    mode: 'all',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'assignments',
  });

  // Track updates to selected supplier when lists refresh
  useEffect(() => {
    if (selectedSupplier) {
      const updated = suppliers.find((s) => s.id === selectedSupplier.id);
      if (updated) {
        setSelectedSupplier(updated);
      }
    }
  }, [suppliers, selectedSupplier]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedSupplierId(null);
    reset({
      name: '',
      companyName: '',
      phoneNumber: '',
      email: '',
      address: '',
      openingBalance: '0',
      notes: '',
      assignments: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: ApiSupplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedSupplierId(sup.id);
    reset({
      name: sup.name,
      companyName: sup.companyName || '',
      phoneNumber: sup.phoneNumber,
      email: sup.email || '',
      address: sup.address || '',
      openingBalance: sup.openingBalance.toString(),
      notes: sup.notes || '',
      assignments: sup.projectAssignments?.map(a => ({
        projectId: a.projectId,
        contractAmount: a.contractAmount.toString(),
        paidAmount: a.paidAmount.toString(),
      })) || [],
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSupplierToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteSupplier(supplierToDelete).unwrap();
      showSuccessToast('Supplier deleted successfully');
      refetchSuppliers();
      if (selectedSupplier?.id === supplierToDelete) {
        setIsHistoryOpen(false);
      }
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to delete supplier');
    }
  };

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      const payload = {
        ...values,
        openingBalance: parseFloat(values.openingBalance || '0'),
        assignments: values.assignments?.map(a => ({
          projectId: a.projectId,
          contractAmount: parseFloat(a.contractAmount || '0'),
          paidAmount: parseFloat(a.paidAmount || '0'),
        })) || [],
      };
      if (modalMode === 'create') {
        await createSupplier(payload).unwrap();
        showSuccessToast('Supplier profile created');
        refetchSuppliers();
      } else if (selectedSupplierId) {
        await updateSupplier({ id: selectedSupplierId, ...payload }).unwrap();
        showSuccessToast('Supplier profile updated');
        refetchSuppliers();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to save supplier profile');
    }
  };

  const handleViewHistory = (sup: ApiSupplier) => {
    setSelectedSupplier(sup);
    setIsHistoryOpen(true);
  };

  const filteredSuppliers = suppliers.filter(
    (sup) =>
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sup.companyName && sup.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => { setPage(1); }, [searchTerm]);

  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * limit, page * limit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const isBusy = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <Truck className="h-5.5 w-5.5 text-cyan-400" />
            Supplier Registry
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Log procurement vendors, raw material purchases, outstanding liabilities and dues
          </p>
        </div>

        {user && user.role !== 'PROJECT_MANAGER' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-550 text-slate-950 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer text-xs"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Supplier</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by company or supplier name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
        />
      </div>

      {/* Suppliers Table/Grid */}
      {isFetching ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <span className="text-slate-500 text-xs font-semibold">Loading suppliers database...</span>
        </div>
      ) : fetchError ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-6">
          <Truck className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-slate-350 text-sm font-semibold">Failed to fetch suppliers registry</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
          <Truck className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-slate-400 text-sm font-bold">No suppliers registered</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Add a materials supplier to begin logging material purchases.'}
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedSuppliers.map((sup) => (
            <div
              key={sup.id}
              onClick={() => handleViewHistory(sup)}
              className="bg-slate-900/25 border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700/85 cursor-pointer flex flex-col justify-between group relative overflow-hidden backdrop-blur-md hover:shadow-xl"
            >
              <div>
                <h3 className="font-bold text-slate-200 text-sm group-hover:text-cyan-450 transition-colors">
                  {sup.name}
                </h3>
                {sup.companyName && (
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">{sup.companyName}</p>
                )}
                {sup.notes && (
                  <p className="text-slate-500 text-[11px] mt-2.5 line-clamp-2 leading-relaxed font-medium">
                    {sup.notes}
                  </p>
                )}
                
                {/* Assigned Projects Badges */}
                {sup.projectAssignments && sup.projectAssignments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {sup.projectAssignments.map((pa: any) => (
                      <span key={pa.id} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[9px] font-semibold text-slate-400">
                        {pa.project?.name || pa.project?.code}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-4 space-y-2">
                <div className="flex items-center text-[11px] text-slate-400 gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{sup.phoneNumber}</span>
                </div>
                {sup.email && (
                  <div className="flex items-center text-[11px] text-slate-400 gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-center text-[11px] text-slate-400 gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 text-[11px]">
                  <span className="text-slate-400 font-semibold">Total Purchases:</span>
                  <span className="font-bold text-slate-200">
                    {(sup.materials || []).length} Invoice(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Outstanding Due:</span>
                  <span className={`font-bold ${sup.currentDue > 0 ? 'text-amber-400' : 'text-slate-450'}`}>
                    {formatCurrency(sup.currentDue)}
                  </span>
                </div>
              </div>

              {user && user.role !== 'PROJECT_MANAGER' && (
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleOpenEdit(sup, e)}
                    className="p-2 text-slate-450 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-lg border border-transparent hover:border-cyan-500/10 transition-all cursor-pointer"
                    title="Edit supplier"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {['SUPER_ADMIN', 'ADMIN'].includes(user.role) && (
                    <button
                      onClick={(e) => handleDeleteClick(sup.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                      title="Delete supplier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(filteredSuppliers.length / limit)}
          totalItems={filteredSuppliers.length}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
        </>
      )}

      {/* History Drawer */}
      {isHistoryOpen && selectedSupplier && (
        <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
          <div className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 relative flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-350">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-200 text-sm leading-none">{selectedSupplier.name}</h2>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Vendor Account Statement</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Project-wise Billings */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/30">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                  Project-wise Supply Billings
                </h3>
                {!selectedSupplier.projectAssignments || selectedSupplier.projectAssignments.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No active project assignments.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedSupplier.projectAssignments.map((pa: any) => (
                      <div key={pa.id} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200 text-xs">{pa.project.code} - {pa.project.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                          <div>
                            <span className="text-slate-550 block">Contract</span>
                            <span className="font-semibold text-slate-300">{formatCurrency(pa.contractAmount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-550 block">Paid</span>
                            <span className="font-semibold text-emerald-400">{formatCurrency(pa.paidAmount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-550 block">Due</span>
                            <span className={`font-semibold ${pa.dueAmount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                              {formatCurrency(pa.dueAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchases Logs */}
              <div>
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-400" />
                  Material Purchases History
                </h3>
                {!selectedSupplier.materials || selectedSupplier.materials.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No purchase records registered.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedSupplier.materials.map((m: any) => (
                      <div
                        key={m.id}
                        className="text-xs p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">
                            {m.name} ({m.quantity} {m.unit})
                          </p>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                            Invoice: {m.invoiceNumber || 'N/A'} •{' '}
                            {new Date(m.purchaseDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-bold text-cyan-400">{formatCurrency(m.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments Logs */}
              <div>
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-450" />
                  Disbursed Payments History
                </h3>
                {!selectedSupplier.cashOuts || selectedSupplier.cashOuts.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No outgoing cash payments registered.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedSupplier.cashOuts.map((co: any) => (
                      <div
                        key={co.id}
                        className="text-xs p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">Paid via {co.paymentMethod}</p>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                            {new Date(co.date).toLocaleDateString()} • Ref:{' '}
                            {co.referenceNumber || 'N/A'}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-400">{formatCurrency(co.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-cyan-400" />
                {modalMode === 'create' ? 'Create Supplier Profile' : 'Edit Supplier Profile'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Supplier Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Apex Materials"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.name
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.name && <p className="text-rose-400 text-[10px] mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Company Name</label>
                  <input
                    type="text"
                    {...register('companyName')}
                    placeholder="e.g. Apex Materials Group"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.companyName
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.companyName && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.companyName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Phone Number</label>
                  <input
                    type="text"
                    {...register('phoneNumber')}
                    placeholder="e.g. +1 555-4567"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.phoneNumber
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. sales@apex.com"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.email
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.email && <p className="text-rose-400 text-[10px] mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="e.g. Industrial Zone Block C"
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.address
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.address && <p className="text-rose-400 text-[10px] mt-1">{errors.address.message}</p>}
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Opening Balance ($)</label>
                  <input
                    type="text"
                    {...register('openingBalance')}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.openingBalance
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.openingBalance && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.openingBalance.message}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Notes</label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  placeholder="e.g. Structural steel supply partner..."
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.notes
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.notes && <p className="text-rose-400 text-[10px] mt-1">{errors.notes.message}</p>}
              </div>

              {/* Project Assignments Section */}
              <div className="border border-slate-800 rounded-xl p-4 bg-[#0a0f1c] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-white uppercase tracking-[0.1em]">
                    Project Assignments
                  </h4>
                  <button
                    type="button"
                    onClick={() => append({ projectId: '', contractAmount: '', paidAmount: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-slate-500 hover:border-slate-300 rounded-md text-[11px] font-semibold text-slate-200 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Add Project Assignment</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No project assignments added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-3 bg-[#0f172a] p-3.5 border border-slate-300 rounded-xl">
                        <div className="flex-1">
                          <label className="block text-slate-400 text-[11px] font-semibold mb-1.5">Project</label>
                          <select
                            {...register(`assignments.${index}.projectId`)}
                            className="w-full px-3 py-2.5 bg-[#0a0f1c] border border-cyan-700/80 focus:border-cyan-400 rounded-lg text-slate-200 text-[12px] focus:outline-none transition-colors"
                          >
                            <option value="">Select Project...</option>
                            {projects.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                            ))}
                          </select>
                          {errors.assignments?.[index]?.projectId && (
                            <p className="text-rose-400 text-[10px] mt-1">{errors.assignments[index].projectId.message}</p>
                          )}
                        </div>

                        <div className="w-28">
                          <label className="block text-slate-400 text-[11px] font-semibold mb-1.5">Contract ($)</label>
                          <input
                            type="text"
                            placeholder="0.00"
                            {...register(`assignments.${index}.contractAmount`)}
                            className="w-full px-3 py-2.5 bg-[#0a0f1c] border border-slate-800 focus:border-cyan-400 rounded-lg text-slate-200 text-[12px] focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="w-28">
                          <label className="block text-slate-400 text-[11px] font-semibold mb-1.5">Paid ($)</label>
                          <input
                            type="text"
                            placeholder="0"
                            {...register(`assignments.${index}.paidAmount`)}
                            className="w-full px-3 py-2.5 bg-[#0a0f1c] border border-slate-800 focus:border-cyan-400 rounded-lg text-slate-200 text-[12px] focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="pb-2.5 px-1">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remove Assignment"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Supplier' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
