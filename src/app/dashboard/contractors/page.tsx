'use client';

/**
 * CPMAS — Contractor Registry
 * Powered by RTK Query, React Hook Form, and Zod schema validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetContractorsQuery,
  useCreateContractorMutation,
  useUpdateContractorMutation,
  useDeleteContractorMutation,
  ApiContractor,
} from '@/store/api/cpmasApi';
import { contractorSchema, ContractorFormValues } from '@/lib/schemas';
import {
  Briefcase,
  Plus,
  Search,
  Phone,
  MapPin,
  Hammer,
  DollarSign,
  X,
  Trash2,
  Edit2,
  Loader2,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function ContractorsPage() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Queries & Mutations
  const { data, isLoading: isFetching, error: fetchError } = useGetContractorsQuery();
  const [createContractor, { isLoading: isCreating }] = useCreateContractorMutation();
  const [updateContractor, { isLoading: isUpdating }] = useUpdateContractorMutation();
  const [deleteContractor, { isLoading: isDeleting }] = useDeleteContractorMutation();

  const contractors = data?.contractors || [];

  // Search filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);

  // History slide-over drawer state
  const [selectedContractor, setSelectedContractor] = useState<ApiContractor | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorSchema),
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

  // Track updates to selected contractor when list refreshes
  useEffect(() => {
    if (selectedContractor) {
      const updated = contractors.find((c) => c.id === selectedContractor.id);
      if (updated) {
        setSelectedContractor(updated);
      }
    }
  }, [contractors, selectedContractor]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedContractorId(null);
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

  const handleOpenEdit = (ctr: ApiContractor, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedContractorId(ctr.id);
    reset({
      name: ctr.name,
      companyName: ctr.companyName || '',
      contactNumber: ctr.contactNumber,
      address: ctr.address || '',
      workType: ctr.workType,
      contractAmount: ctr.contractAmount.toString(),
      paidAmount: ctr.paidAmount.toString(),
      notes: ctr.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        'Delete this contractor assignment? All associated transaction histories will no longer point to this contractor.'
      )
    ) {
      return;
    }

    try {
      await deleteContractor(id).unwrap();
      showSuccessToast('Contractor deleted successfully');
      if (selectedContractor?.id === id) {
        setIsHistoryOpen(false);
      }
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to delete contractor');
    }
  };

  const onSubmit = async (values: ContractorFormValues) => {
    try {
      const payload = {
        ...values,
        contractAmount: parseFloat(values.contractAmount),
        paidAmount: parseFloat(values.paidAmount || '0'),
      };
      if (modalMode === 'create') {
        await createContractor(payload).unwrap();
        showSuccessToast('Contractor assignment registered');
      } else if (selectedContractorId) {
        await updateContractor({ id: selectedContractorId, ...payload }).unwrap();
        showSuccessToast('Contractor profile updated');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to save contractor profile');
    }
  };

  const handleViewHistory = (ctr: ApiContractor) => {
    setSelectedContractor(ctr);
    setIsHistoryOpen(true);
  };

  const filteredContractors = contractors.filter(
    (ctr) =>
      ctr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ctr.workType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ctr.companyName && ctr.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            Contractor Assignments
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
            <span>Register Contractor</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by company, contractor name or trade type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
        />
      </div>

      {/* Contractors registry grid */}
      {isFetching ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <span className="text-slate-500 text-xs font-semibold">Loading contractors database...</span>
        </div>
      ) : fetchError ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-6">
          <Briefcase className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-slate-350 text-sm font-semibold">Failed to fetch contractors registry</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredContractors.length === 0 ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
          <Briefcase className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-slate-400 text-sm font-bold">No contractors registered</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Add a subcontracting partner to track tasks, contract scopes, and billings.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContractors.map((ctr) => (
            <div
              key={ctr.id}
              onClick={() => handleViewHistory(ctr)}
              className="bg-slate-900/25 border border-slate-800/80 rounded-2xl p-6 transition-all hover:border-slate-700/85 cursor-pointer flex flex-col justify-between group relative overflow-hidden backdrop-blur-md hover:shadow-xl"
            >
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Hammer className="h-3.5 w-3.5" />
                  {ctr.workType}
                </span>
                <h3 className="font-bold text-slate-200 text-sm mt-2.5 group-hover:text-cyan-400 transition-colors">
                  {ctr.name}
                </h3>
                {ctr.companyName && (
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">{ctr.companyName}</p>
                )}
                {ctr.notes && (
                  <p className="text-slate-500 text-[11px] mt-2.5 line-clamp-2 leading-relaxed font-medium">
                    {ctr.notes}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-4 space-y-2.5">
                <div className="flex items-center text-[11px] text-slate-400 gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{ctr.contactNumber}</span>
                </div>
                {ctr.address && (
                  <div className="flex items-center text-[11px] text-slate-400 gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{ctr.address}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 border-t border-slate-800/40 pt-3 text-center text-[10px] font-medium">
                  <div className="p-1.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                    <span className="text-slate-550 block">Contract</span>
                    <span className="text-slate-200 font-bold block mt-0.5">
                      {formatCurrency(ctr.contractAmount)}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                    <span className="text-slate-550 block">Paid</span>
                    <span className="text-emerald-400 font-bold block mt-0.5">
                      {formatCurrency(ctr.paidAmount)}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/30 border border-slate-850 rounded-xl">
                    <span className="text-slate-550 block">Outstanding</span>
                    <span
                      className={`font-bold block mt-0.5 ${
                        ctr.dueAmount > 0 ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {formatCurrency(ctr.dueAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {user && !['ACCOUNTANT', 'DATA_ENTRY_OPERATOR'].includes(user.role) && (
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleOpenEdit(ctr, e)}
                    className="p-2 text-slate-450 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-lg border border-transparent hover:border-cyan-500/10 transition-all cursor-pointer"
                    title="Edit contractor"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {['SUPER_ADMIN', 'ADMIN'].includes(user.role) && (
                    <button
                      onClick={(e) => handleDelete(ctr.id, e)}
                      className="p-2 text-slate-450 hover:text-rose-455 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                      title="Delete contractor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History Drawer */}
      {isHistoryOpen && selectedContractor && (
        <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
          <div className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 relative flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-350">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-200 text-sm leading-none">{selectedContractor.name}</h2>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Contractor Ledger Log</p>
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
              {/* Payments History */}
              <div>
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  Milestone Payments Disbursed
                </h3>
                {!selectedContractor.cashOuts || selectedContractor.cashOuts.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No cash disbursements logged.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {selectedContractor.cashOuts.map((co: any) => (
                      <div
                        key={co.id}
                        className="text-xs p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">Disbursed via {co.paymentMethod}</p>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                            {new Date(co.date).toLocaleDateString()} • Ref:{' '}
                            {co.referenceNumber || 'N/A'}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-405">{formatCurrency(co.amount)}</span>
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
                  <span className="font-bold text-slate-200">{formatCurrency(selectedContractor.contractAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Disbursed Milestones:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(selectedContractor.paidAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800/80 font-semibold">
                  <span className="text-slate-300">Remaining Due Liability:</span>
                  <span className={`font-bold ${selectedContractor.dueAmount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {formatCurrency(selectedContractor.dueAmount)}
                  </span>
                </div>
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
                <Briefcase className="h-4.5 w-4.5 text-cyan-400" />
                {modalMode === 'create' ? 'Register Contractor Profile' : 'Edit Contractor Profile'}
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
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Contractor Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.name
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
                        : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
                        : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
                        : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
                      : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
                        : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
                        : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
                      : 'border-slate-855 focus:border-cyan-500 focus:ring-cyan-500/30'
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
          </div>
        </div>
      )}
    </div>
  );
}
