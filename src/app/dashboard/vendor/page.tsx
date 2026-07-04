'use client';

/**
 * CPMAS — Vendor Registry
 * Powered by RTK Query, React Hook Form, and Zod schema validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useGetProjectsListQuery,
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
  const toast = useToast();

  // Queries & Mutations
  const { data, isLoading: isFetching, error: fetchError, refetch: refetchVendors } = useGetVendorsQuery();
  const { data: prjData } = useGetProjectsListQuery();
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

  const vendors = data?.vendors || [];
  const projects = prjData?.projects || [];

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
    control,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      companyName: '',
      contactNumber: '',
      address: '',
      workType: '',
      notes: '',
      assignments: [],
    },
    mode: 'all',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'assignments',
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
      workType: '',
      notes: '',
      assignments: [{ projectId: '', contractAmount: '', paidAmount: '0' }],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vnd: ApiVendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedVendorId(vnd.id);

    const formAssignments = (vnd.projectAssignments || []).map((pa) => ({
      projectId: pa.projectId,
      contractAmount: pa.contractAmount.toString(),
      paidAmount: pa.paidAmount.toString(),
    }));

    reset({
      name: vnd.name,
      companyName: vnd.companyName || '',
      contactNumber: vnd.contactNumber,
      address: vnd.address || '',
      workType: vnd.workType,
      notes: vnd.notes || '',
      assignments: formAssignments,
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
      await toast.handlePromise(deleteVendor(vendorToDelete).unwrap());
      refetchVendors();
      if (selectedVendor?.id === vendorToDelete) {
        setIsHistoryOpen(false);
      }
      setDeleteConfirmOpen(false);
      setVendorToDelete(null);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const onSubmit = async (values: VendorFormValues) => {
    try {
      const payload = {
        ...values,
        assignments: (values.assignments || []).map((a) => ({
          projectId: a.projectId,
          contractAmount: a.contractAmount,
          paidAmount: a.paidAmount || '0',
        })),
      };
      if (modalMode === 'create') {
        await toast.handlePromise(createVendor(payload).unwrap());
      } else if (selectedVendorId) {
        await toast.handlePromise(updateVendor({ id: selectedVendorId, ...payload }).unwrap());
      }
      refetchVendors();
      setIsModalOpen(false);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
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
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <Briefcase className="h-5.5 w-5.5 text-cyan-400" />
            Vendor Assignments
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Register subcontracting partners, assign multiple project contracts, track overall/project billing milestones and dues
          </p>
        </div>

        {user && !['ACCOUNTANT', 'DATA_ENTRY_OPERATOR'].includes(user.role) && (
          <Button
            onClick={handleOpenCreate}
            icon={<Plus className="h-4.5 w-4.5" />}
          >
            Register Vendor
          </Button>
        )}
      </div>

      {/* Filter */}
      <Input
        placeholder="Search by company, vendor name or trade type..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="h-4 w-4" />}
      />

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

                {/* Assigned Projects Badges */}
                {vnd.projectAssignments && vnd.projectAssignments.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {vnd.projectAssignments.map((pa: any) => (
                      <span
                        key={pa.id}
                        className="text-[9px] font-bold px-2 py-1 bg-slate-950/80 border border-slate-850 text-slate-400 rounded-lg uppercase tracking-wider font-mono hover:text-cyan-400 transition-colors"
                        title={`${pa.project?.name || ''} (Contract: ${formatCurrency(pa.contractAmount)})`}
                      >
                        {pa.project?.code || pa.project?.name}
                      </span>
                    ))}
                  </div>
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
                    <span className="text-slate-550 block text-[9px] uppercase tracking-wider">Total Contract</span>
                    <span className="text-slate-200 font-bold block mt-0.5">
                      {formatCurrency(vnd.contractAmount)}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/30 border border-slate-800 rounded-xl">
                    <span className="text-slate-550 block text-[9px] uppercase tracking-wider">Total Paid</span>
                    <span className="text-emerald-400 font-bold block mt-0.5">
                      {formatCurrency(vnd.paidAmount)}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-950/30 border border-slate-800 rounded-xl">
                    <span className="text-slate-550 block text-[9px] uppercase tracking-wider">Total Due</span>
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
              {/* Project-wise Billings */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/30">
                <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                  Project-wise Billings Breakdown
                </h3>
                {!selectedVendor.projectAssignments || selectedVendor.projectAssignments.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No active project assignments.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedVendor.projectAssignments.map((pa) => (
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
                  Total Vendor billing status
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-450">Agreed Contract Cap (Total):</span>
                  <span className="font-bold text-slate-200">{formatCurrency(selectedVendor.contractAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Disbursed Milestones (Total):</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(selectedVendor.paidAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800/80 font-semibold">
                  <span className="text-slate-300">Remaining Due Liability (Total):</span>
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
                  <Input
                    {...register('name')}
                    placeholder="e.g. John Doe"
                    error={errors.name?.message}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Company Name</label>
                  <Input
                    {...register('companyName')}
                    placeholder="e.g. Doe Excavations LLC"
                    error={errors.companyName?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Contact Number</label>
                  <Input
                    {...register('contactNumber')}
                    placeholder="e.g. +1 555-9090"
                    error={errors.contactNumber?.message}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Work Assignment (Trade)</label>
                  <Input
                    {...register('workType')}
                    placeholder="e.g. Electrical &amp; Wiring"
                    error={errors.workType?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Office Address</label>
                <Input
                  {...register('address')}
                  placeholder="e.g. 22 Trench Rd, West City"
                  error={errors.address?.message}
                />
              </div>

              {/* Project Assignments Section */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest">
                    Project Assignments
                  </h4>
                  <button
                    type="button"
                    onClick={() => append({ projectId: '', contractAmount: '', paidAmount: '0' })}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:text-slate-100 rounded-lg text-[10px] font-bold text-slate-400 transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-cyan-400" />
                    <span>Add Project Assignment</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No project assignments added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-slate-950/40 p-3 border border-slate-850 rounded-xl">
                        <div className="col-span-5">
                          <label className="block text-slate-500 text-[10px] font-semibold mb-1.5">Project</label>
                          <Select
                            {...register(`assignments.${index}.projectId` as const)}
                            error={errors.assignments?.[index]?.projectId?.message}
                          >
                            <option value="" disabled className="bg-slate-900 text-slate-250">Select Project...</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                                {p.code} - {p.name}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="col-span-3">
                          <label className="block text-slate-500 text-[10px] font-semibold mb-1.5">Contract ($)</label>
                          <Input
                            placeholder="0.00"
                            {...register(`assignments.${index}.contractAmount` as const)}
                            error={errors.assignments?.[index]?.contractAmount?.message}
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="block text-slate-500 text-[10px] font-semibold mb-1.5">Paid ($)</label>
                          <Input
                            placeholder="0.00"
                            {...register(`assignments.${index}.paidAmount` as const)}
                          />
                        </div>

                        <div className="col-span-1 flex justify-center pb-1">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-md transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.assignments?.message && (
                  <p className="text-rose-400 text-[10px] mt-1">{errors.assignments.message}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Notes</label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  placeholder="e.g. Piling and foundations supplier..."
                  className={`w-full px-3 py-2 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/80 focus:ring-cyan-500/30 rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all placeholder:text-slate-650 shadow-inner ${
                    errors.notes
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.notes && <p className="text-rose-400 text-[10px] mt-1">{errors.notes.message}</p>}
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isBusy}
                >
                  {modalMode === 'create' ? 'Register' : 'Save Changes'}
                </Button>
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
