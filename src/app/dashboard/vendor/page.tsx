'use client';

/**
 * CPMAS — Vendor Registry
 * Powered by RTK Query, React Hook Form, and Zod schema validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Pagination } from '@/components/ui/Pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  ApiVendor,
} from '@/store/api/cpmasApi';
import { vendorSchema, VendorFormValues } from '@/lib/schemas';
import {
  Briefcase,
  Plus,
  Search,
  Phone,
  MapPin,
  Hammer,
  Trash2,
  Edit2,
  Loader2,
  Clock,
} from 'lucide-react';

export default function VendorsPage() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Queries & Mutations
  const { data, isLoading: isFetching, error: fetchError, refetch: refetchVendors } = useGetVendorsQuery();
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

  const vendors = data?.vendors || [];

  // Search filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // History slide-over drawer state
  const [selectedVendor, setSelectedVendor] = useState<ApiVendor | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      companyName: '',
      contactNumber: '',
      address: '',
      workType: 'Civil & Foundation',
      contractAmount: '',
      paidAmount: '0',
      notes: '',
    },
    mode: 'onBlur',
  });

  // Track updates to selected vendor when list refreshes
  useEffect(() => {
    if (selectedVendor) {
      const updated = vendors.find((v) => v.id === selectedVendor.id);
      if (updated) {
        setSelectedVendor(updated);
      }
    }
  }, [vendors, selectedVendor]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedVendorId(null);
    reset({
      name: '',
      companyName: '',
      contactNumber: '',
      address: '',
      workType: 'Civil & Foundation',
      contractAmount: '',
      paidAmount: '0',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vnd: ApiVendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedVendorId(vnd.id);
    reset({
      name: vnd.name,
      companyName: vnd.companyName || '',
      contactNumber: vnd.contactNumber,
      address: vnd.address || '',
      workType: vnd.workType,
      contractAmount: vnd.contractAmount.toString(),
      paidAmount: vnd.paidAmount.toString(),
      notes: vnd.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVendorToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!vendorToDelete) return;
    try {
      await deleteVendor(vendorToDelete).unwrap();
      showSuccessToast('Vendor deleted successfully');
      refetchVendors();
      if (selectedVendor?.id === vendorToDelete) {
        setIsHistoryOpen(false);
      }
      setDeleteConfirmOpen(false);
      setVendorToDelete(null);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to delete vendor');
    }
  };

  const onSubmit = async (values: VendorFormValues) => {
    try {
      const payload = {
        ...values,
        contractAmount: parseFloat(values.contractAmount),
        paidAmount: parseFloat(values.paidAmount || '0'),
      };
      if (modalMode === 'create') {
        await createVendor(payload).unwrap();
        showSuccessToast('Vendor assignment registered');
        refetchVendors();
      } else if (selectedVendorId) {
        await updateVendor({ id: selectedVendorId, ...payload }).unwrap();
        showSuccessToast('Vendor profile updated');
        refetchVendors();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to save vendor profile');
    }
  };

  const handleViewHistory = (vnd: ApiVendor) => {
    setSelectedVendor(vnd);
    setIsHistoryOpen(true);
  };

  const filteredVendors = vendors.filter(
    (vnd) =>
      vnd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vnd.workType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vnd.companyName && vnd.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => { setPage(1); }, [searchTerm]);

  const paginatedVendors = filteredVendors.slice((page - 1) * limit, page * limit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isBusy = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <Briefcase className="h-5.5 w-5.5 text-cyan-400" />
            Vendor Assignments
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Register subcontracting partners, assign work packages, track contract values, paid milestones, and dues
          </p>
        </div>

        {user && !['ACCOUNTANT', 'DATA_ENTRY_OPERATOR'].includes(user.role) && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-550 text-slate-950 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer text-xs"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Register Vendor</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by company, vendor name or trade type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
        />
      </div>

      {/* Vendors registry grid */}
      {isFetching ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <span className="text-slate-500 text-xs font-semibold">Loading vendors database...</span>
        </div>
      ) : fetchError ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-6">
          <Briefcase className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-slate-350 text-sm font-semibold">Failed to fetch vendors registry</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
          <Briefcase className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-slate-400 text-sm font-bold">No vendors registered</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Add a subcontracting partner to track tasks, contract scopes, and billings.'}
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedVendors.map((vnd) => (
            <div
              key={vnd.id}
              onClick={() => handleViewHistory(vnd)}
              className="bg-slate-900/25 border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700/85 cursor-pointer flex flex-col justify-between group relative overflow-hidden backdrop-blur-md hover:shadow-xl"
            >
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Hammer className="h-3.5 w-3.5" />
                  {vnd.workType}
                </span>
                <h3 className="font-bold text-slate-200 text-sm mt-2.5 group-hover:text-cyan-400 transition-colors">
                  {vnd.name}
                </h3>
                {vnd.companyName && (
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">{vnd.companyName}</p>
                )}
                {vnd.notes && (
                  <p className="text-slate-500 text-[11px] mt-2.5 line-clamp-2 leading-relaxed font-medium">
                    {vnd.notes}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-4 space-y-2.5">
                <div className="flex items-center text-[11px] text-slate-400 gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{vnd.contactNumber}</span>
                </div>
                {vnd.address && (
                  <div className="flex items-center text-[11px] text-slate-400 gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{vnd.address}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 border-t border-slate-800/40 pt-3 text-center text-[10px] font-medium">
                  <div className="p-1.5 bg-slate-950/30 border border-slate-800 rounded-xl">
                    <span className="text-slate-550 block">Contract</span>
                    <span className="text-slate-200 font-bold block mt-0.5">
                      {formatCurrency(vnd.contractAmount)}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/30 border border-slate-800 rounded-xl">
                    <span className="text-slate-550 block">Paid</span>
                    <span className="text-emerald-400 font-bold block mt-0.5">
                      {formatCurrency(vnd.paidAmount)}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/30 border border-slate-800 rounded-xl">
                    <span className="text-slate-550 block">Outstanding</span>
                    <span
                      className={`font-bold block mt-0.5 ${
                        vnd.dueAmount > 0 ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {formatCurrency(vnd.dueAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {user && !['ACCOUNTANT', 'DATA_ENTRY_OPERATOR'].includes(user.role) && (
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleOpenEdit(vnd, e)}
                    className="p-2 text-slate-450 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-lg border border-transparent hover:border-cyan-500/10 transition-all cursor-pointer"
                    title="Edit vendor"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {['SUPER_ADMIN', 'ADMIN'].includes(user.role) && (
                    <button
                      onClick={(e) => handleDeleteClick(vnd.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                      title="Delete vendor"
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
          totalPages={Math.ceil(filteredVendors.length / limit)}
          totalItems={filteredVendors.length}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
        </>
      )}

      {/* History Drawer */}
      <Drawer
        open={isHistoryOpen && !!selectedVendor}
        onClose={() => setIsHistoryOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-200 text-sm leading-none">{selectedVendor?.name}</h2>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Vendor Ledger Log</p>
            </div>
          </div>
        }
      >
        {selectedVendor && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Payments History */}
              <div>
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  Milestone Payments Disbursed
                </h3>
                {!selectedVendor.cashOuts || selectedVendor.cashOuts.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No cash disbursements logged.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {selectedVendor.cashOuts.map((co: any) => (
                      <div
                        key={co.id}
                        className="text-xs p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">Disbursed via {co.paymentMethod}</p>
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

              {/* Progress Summary */}
              <div className="p-4 border border-slate-800 rounded-xl bg-slate-950/30 text-xs space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contract billing status
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-450">Agreed Contract Cap:</span>
                  <span className="font-bold text-slate-200">{formatCurrency(selectedVendor.contractAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Disbursed Milestones:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(selectedVendor.paidAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800/80 font-semibold">
                  <span className="text-slate-300">Remaining Due Liability:</span>
                  <span className={`font-bold ${selectedVendor.dueAmount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {formatCurrency(selectedVendor.dueAmount)}
                  </span>
                </div>
              </div>
          </div>
        )}
      </Drawer>

      {/* CRUD Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="h-4.5 w-4.5 text-cyan-400" />
            {modalMode === 'create' ? 'Register Vendor Profile' : 'Edit Vendor Profile'}
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Vendor Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. John Doe"
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
                    placeholder="e.g. Doe Excavations LLC"
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
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Contact Number</label>
                  <input
                    type="text"
                    {...register('contactNumber')}
                    placeholder="e.g. +1 555-9090"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.contactNumber
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.contactNumber && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.contactNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Work Assignment (Trade)</label>
                  <input
                    type="text"
                    {...register('workType')}
                    placeholder="e.g. Electrical &amp; Wiring"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.workType
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.workType && <p className="text-rose-400 text-[10px] mt-1">{errors.workType.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Office Address</label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="e.g. 22 Trench Rd, West City"
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.address
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.address && <p className="text-rose-400 text-[10px] mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Contract Amount ($)</label>
                  <input
                    type="text"
                    {...register('contractAmount')}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.contractAmount
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.contractAmount && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.contractAmount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Paid Amount ($)</label>
                  <input
                    type="text"
                    {...register('paidAmount')}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.paidAmount
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.paidAmount && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.paidAmount.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Notes</label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  placeholder="e.g. Piling and foundations supplier..."
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.notes
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.notes && <p className="text-rose-400 text-[10px] mt-1">{errors.notes.message}</p>}
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
                  <span>{modalMode === 'create' ? 'Register' : 'Save Changes'}</span>
                </button>
              </div>
          </form>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor?"
        description="Are you sure you want to delete this vendor assignment? All associated transaction histories will no longer point to this vendor."
        confirmText="Delete"
      />
    </div>
  );
}
