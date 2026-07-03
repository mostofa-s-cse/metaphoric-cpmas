'use client';

/**
 * CPMAS — Financial Ledger (Transactions)
 * Powered by RTK Query, React Hook Form, and Zod validation.
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
  useGetCashInsQuery,
  useGetCashOutsQuery,
  useGetProjectsQuery,
  useCreateCashInMutation,
  useCreateCashOutMutation,
  useDeleteCashInMutation,
  useDeleteCashOutMutation,
  ApiCashIn,
  ApiCashOut,
} from '@/store/api/cpmasApi';
import {
  cashInSchema,
  CashInFormValues,
  cashOutSchema,
  CashOutFormValues,
} from '@/lib/schemas';
import {
  ArrowUpDown,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [activeTab, setActiveTab] = useState<'cashin' | 'cashout'>('cashin');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; type: 'in' | 'out' } | null>(null);

  // Queries & Mutations
  const { data: cashInResponse, isLoading: isFetchingCashIn, error: cashInError, refetch: refetchCashIn } = useGetCashInsQuery();
  const { data: cashOutResponse, isLoading: isFetchingCashOut, error: cashOutError, refetch: refetchCashOut } = useGetCashOutsQuery();
  const { data: prjData } = useGetProjectsQuery();

  const [createCashIn, { isLoading: isCreatingCashIn }] = useCreateCashInMutation();
  const [createCashOut, { isLoading: isCreatingCashOut }] = useCreateCashOutMutation();
  const [deleteCashIn] = useDeleteCashInMutation();
  const [deleteCashOut] = useDeleteCashOutMutation();

  const cashIns = cashInResponse?.cashIns || [];
  const cashOuts = cashOutResponse?.cashOuts || [];
  const projects = prjData?.projects || [];

  // Modals state
  const [isCashInModalOpen, setIsCashInModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);

  // React Hook Form for Cash In
  const {
    register: registerCashIn,
    handleSubmit: handleSubmitCashIn,
    reset: resetCashIn,
    control: controlCashIn,
    formState: { errors: cashInErrors },
  } = useForm<CashInFormValues>({
    resolver: zodResolver(cashInSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      clientName: '',
      amount: '',
      paymentMethod: '' as any,
      bankOrCash: '',
      source: '' as any,
      referenceNumber: '',
      notes: '',
    },
    mode: 'onChange',
  });

  // React Hook Form for Cash Out
  const {
    register: registerCashOut,
    handleSubmit: handleSubmitCashOut,
    reset: resetCashOut,
    control: controlCashOut,
    formState: { errors: cashOutErrors },
  } = useForm<CashOutFormValues>({
    resolver: zodResolver(cashOutSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      expenseCategory: '' as any,
      paidTo: '',
      amount: '',
      paymentMethod: '' as any,
      referenceNumber: '',
      notes: '',
    },
    mode: 'onChange',
  });

  const handleOpenCashIn = () => {
    resetCashIn({
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      clientName: '',
      amount: '',
      paymentMethod: '' as any,
      bankOrCash: '',
      source: '' as any,
      referenceNumber: '',
      notes: '',
    });
    setIsCashInModalOpen(true);
  };

  const handleOpenCashOut = () => {
    resetCashOut({
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      expenseCategory: '' as any,
      paidTo: '',
      amount: '',
      paymentMethod: '' as any,
      referenceNumber: '',
      notes: '',
    });
    setIsCashOutModalOpen(true);
  };

  const onCashInSubmit = async (values: CashInFormValues) => {
    try {
      // Empty string for project means null project
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        projectId: values.projectId === 'GENERAL' ? null : (values.projectId || null),
      };
      await createCashIn(payload).unwrap();
      showSuccessToast('Client payment recorded');
      refetchCashIn();
      setIsCashInModalOpen(false);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to record transaction');
    }
  };

  const onCashOutSubmit = async (values: CashOutFormValues) => {
    try {
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        projectId: values.projectId === 'GENERAL' ? null : (values.projectId || null),
      };
      await createCashOut(payload).unwrap();
      showSuccessToast('Cash disbursement payment recorded');
      refetchCashOut();
      setIsCashOutModalOpen(false);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to record transaction');
    }
  };

  const handleDeleteClick = (id: string, type: 'in' | 'out') => {
    setTransactionToDelete({ id, type });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      if (transactionToDelete.type === 'in') {
        await deleteCashIn(transactionToDelete.id).unwrap();
        refetchCashIn();
      } else {
        await deleteCashOut(transactionToDelete.id).unwrap();
        refetchCashOut();
      }
      showSuccessToast('Transaction deleted successfully');
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to delete transaction');
    }
  };

  const filteredTransactions = (activeTab === 'cashin' ? cashIns : cashOuts).filter((t: any) => {
    const text =
      activeTab === 'cashin'
        ? `${t.clientName} ${t.source} ${t.notes || ''}`
        : `${t.paidTo} ${t.expenseCategory} ${t.notes || ''}`;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => { setPage(1); }, [searchTerm, activeTab]);

  const paginatedTransactions = filteredTransactions.slice((page - 1) * limit, page * limit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const isFetching = activeTab === 'cashin' ? isFetchingCashIn : isFetchingCashOut;
  const fetchError = activeTab === 'cashin' ? cashInError : cashOutError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <ArrowUpDown className="h-5.5 w-5.5 text-cyan-400" />
            Financial Ledger
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Log raw client mobilization collections and general corporate cash overhead outflows
          </p>
        </div>

        {user && user.role !== 'PROJECT_MANAGER' && (
          <div className="flex gap-2">
            <button
              onClick={handleOpenCashIn}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-550 text-slate-950 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Record Cash In</span>
            </button>
            <button
              onClick={handleOpenCashOut}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-100 border border-slate-700 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Record Cash Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => {
            setActiveTab('cashin');
            setSearchTerm('');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'cashin'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Collections / Cash In ({cashIns.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('cashout');
            setSearchTerm('');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'cashout'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Expenses / Cash Out ({cashOuts.length})
        </button>
      </div>

      {/* Filters */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder={
            activeTab === 'cashin'
              ? 'Search client collections by name or source...'
              : 'Search expenses by category or beneficiary...'
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
        />
      </div>

      {/* Ledger Table */}
      {isFetching ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <span className="text-slate-500 text-xs font-semibold">Loading ledger logs...</span>
        </div>
      ) : fetchError ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-6">
          <ArrowUpDown className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-slate-350 text-sm font-semibold">Failed to fetch ledger transactions</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
          <ArrowUpDown className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-slate-400 text-sm font-bold">No ledger transactions registered</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Create a cash transaction to build project cash flow logs.'}
          </p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/20 backdrop-blur-md">
          <div className="overflow-x-auto">
            {activeTab === 'cashin' ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="p-4">Date</th>
                    <th className="p-4">Paid By (Client)</th>
                    <th className="p-4">Source Category</th>
                    <th className="p-4">Deposit To (Bank/Cash)</th>
                    <th className="p-4">Linked Project</th>
                    <th className="p-4 text-right">Amount</th>
                    {user?.role === 'SUPER_ADMIN' && <th className="p-4 text-right">Delete</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTransactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-slate-550 font-mono text-[10px]">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        <div>{t.clientName}</div>
                        {t.referenceNumber && (
                          <span className="text-[9px] text-slate-500 font-mono">Ref: {t.referenceNumber}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-400 border border-cyan-500/10 font-bold uppercase font-mono tracking-wide">
                          {t.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {t.bankOrCash}{' '}
                        <span className="text-[10px] text-slate-600 block mt-0.5 font-semibold">
                          via {t.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-slate-350">{t.project?.name || 'General Income'}</td>
                      <td className="p-4 text-right font-bold text-emerald-400">
                        +{formatCurrency(t.amount)}
                      </td>
                      {user?.role === 'SUPER_ADMIN' && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteClick(t.id, 'in')}
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
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="p-4">Date</th>
                    <th className="p-4">Paid To (Beneficiary)</th>
                    <th className="p-4">Expense Category</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Linked Project</th>
                    <th className="p-4 text-right">Amount</th>
                    {user?.role === 'SUPER_ADMIN' && <th className="p-4 text-right">Delete</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTransactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-slate-550 font-mono text-[10px]">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        <div>{t.paidTo}</div>
                        {t.referenceNumber && (
                          <span className="text-[9px] text-slate-500 font-mono">Ref: {t.referenceNumber}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-rose-400 border border-rose-500/10 font-bold uppercase font-mono tracking-wide">
                          {t.expenseCategory.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{t.paymentMethod}</td>
                      <td className="p-4 text-slate-350">{t.project?.name || 'Corporate Overhead'}</td>
                      <td className="p-4 text-right font-bold text-rose-400">
                        -{formatCurrency(t.amount)}
                      </td>
                      {user?.role === 'SUPER_ADMIN' && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteClick(t.id, 'out')}
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
            )}
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(filteredTransactions.length / limit)}
            totalItems={filteredTransactions.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      )}

      {/* Cash In Modal */}
      <Modal
        open={isCashInModalOpen}
        onClose={() => setIsCashInModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4.5 w-4.5 text-cyan-400" />
            Record Incoming Client Payment
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSubmitCashIn(onCashInSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Paid By (Client)</label>
                  <input
                    type="text"
                    {...registerCashIn('clientName')}
                    placeholder="e.g. Skyline Developers"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      cashInErrors.clientName
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {cashInErrors.clientName && (
                    <p className="text-rose-400 text-[10px] mt-1">{cashInErrors.clientName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Amount Collected ($)</label>
                  <input
                    type="text"
                    {...registerCashIn('amount')}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      cashInErrors.amount
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {cashInErrors.amount && (
                    <p className="text-rose-400 text-[10px] mt-1">{cashInErrors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Receipt Category</label>
                  <select
                    {...registerCashIn('source')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Category...</option>
                    <option value="SIGNING_AGREEMENT">Signing Agreement</option>
                    <option value="MATERIAL_PREPS">Material preps</option>
                    <option value="LABER_PREPS">Laber preps</option>
                    <option value="RUNNING_BILL">Running Bill</option>
                    <option value="FINAL_BILL">Final Bill</option>
                    <option value="CLIENT_PAYMENT">Client Progress Invoice</option>
                    <option value="ADVANCE_PAYMENT">Project Mobilization Advance</option>
                    <option value="INSTALLMENT">Periodic Installment</option>
                    <option value="OTHER_INCOME">Other Miscellaneous Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Assign to Project</label>
                  <select
                    {...registerCashIn('projectId')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Project...</option>
                    <option value="GENERAL">General Corporate Income (No Project)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Receipt Date</label>
                  <Controller
                    name="date"
                    control={controlCashIn}
                    render={({ field }) => (
                      <DatePickerInput
                        id="cashInDate"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!cashInErrors.date}
                      />
                    )}
                  />
                  {cashInErrors.date && <p className="text-rose-400 text-[10px] mt-1">{cashInErrors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Payment Method</label>
                  <select
                    {...registerCashIn('paymentMethod')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Method...</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Ref / Instrument #</label>
                  <input
                    type="text"
                    {...registerCashIn('referenceNumber')}
                    placeholder="e.g. wire #09283"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      cashInErrors.referenceNumber
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {cashInErrors.referenceNumber && (
                    <p className="text-rose-400 text-[10px] mt-1">{cashInErrors.referenceNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">
                  Deposit To (Bank / Cash)
                </label>
                <input
                  type="text"
                  {...registerCashIn('bankOrCash')}
                  placeholder="e.g. City Bank A/C: 1234, DBBL Mobile, or Office Safe Cash"
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    cashInErrors.bankOrCash
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {cashInErrors.bankOrCash && (
                  <p className="text-rose-400 text-[10px] mt-1">{cashInErrors.bankOrCash.message}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Reference Notes</label>
                <textarea
                  rows={2}
                  {...registerCashIn('notes')}
                  placeholder="e.g. Mobilization installment 2..."
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    cashInErrors.notes
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {cashInErrors.notes && <p className="text-rose-400 text-[10px] mt-1">{cashInErrors.notes.message}</p>}
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCashInModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer animate-in duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCashIn}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isCreatingCashIn && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Receipt</span>
                </button>
              </div>
            </form>
      </Modal>

      {/* Cash Out Modal */}
      <Modal
        open={isCashOutModalOpen}
        onClose={() => setIsCashOutModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4.5 w-4.5 text-rose-455" />
            Record Outgoing Cash Disbursement
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSubmitCashOut(onCashOutSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Paid To (Vendor/Labour)</label>
                  <input
                    type="text"
                    {...registerCashOut('paidTo')}
                    placeholder="e.g. Mason team lead"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      cashOutErrors.paidTo
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {cashOutErrors.paidTo && (
                    <p className="text-rose-400 text-[10px] mt-1">{cashOutErrors.paidTo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Disbursed Amount ($)</label>
                  <input
                    type="text"
                    {...registerCashOut('amount')}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      cashOutErrors.amount
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {cashOutErrors.amount && (
                    <p className="text-rose-400 text-[10px] mt-1">{cashOutErrors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Expense Category</label>
                  <select
                    {...registerCashOut('expenseCategory')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Category...</option>
                    <option value="SIGNING_AGREEMENT">Signing Agreement</option>
                    <option value="MATERIAL_PREPS">Material preps</option>
                    <option value="LABER_PREPS">Laber preps</option>
                    <option value="RUNNING_BILL">Running Bill</option>
                    <option value="FINAL_BILL">Final Bill</option>
                    <option value="MATERIALS">Raw Materials Purchase</option>
                    <option value="LABOR">Site Labor Daily Wages</option>
                    <option value="VENDOR_PAYMENT">Vendor Payment Milestone</option>
                    <option value="OFFICE_RENT">Office Rent</option>
                    <option value="UTILITIES">Electricity &amp; Internet Utilities</option>
                    <option value="TRANSPORTATION">Transportation</option>
                    <option value="FUEL">Fuel</option>
                    <option value="EQUIPMENT_RENTAL">Heavy Crane/Equipment Rental</option>
                    <option value="MISCELLANEOUS">Miscellaneous / Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Link to Project</label>
                  <select
                    {...registerCashOut('projectId')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Project...</option>
                    <option value="GENERAL">Corporate Overhead (General Corporate)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Disbursement Date</label>
                  <Controller
                    name="date"
                    control={controlCashOut}
                    render={({ field }) => (
                      <DatePickerInput
                        id="cashOutDate"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!cashOutErrors.date}
                      />
                    )}
                  />
                  {cashOutErrors.date && (
                    <p className="text-rose-400 text-[10px] mt-1">{cashOutErrors.date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Payment Method</label>
                  <select
                    {...registerCashOut('paymentMethod')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Method...</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Ref / Cheque #</label>
                  <input
                    type="text"
                    {...registerCashOut('referenceNumber')}
                    placeholder="e.g. chq #9012"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      cashOutErrors.referenceNumber
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {cashOutErrors.referenceNumber && (
                    <p className="text-rose-400 text-[10px] mt-1">{cashOutErrors.referenceNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Reference Notes</label>
                <textarea
                  rows={2}
                  {...registerCashOut('notes')}
                  placeholder="Additional transaction info..."
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    cashOutErrors.notes
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {cashOutErrors.notes && (
                  <p className="text-rose-400 text-[10px] mt-1">{cashOutErrors.notes.message}</p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCashOutModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer animate-in duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCashOut}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isCreatingCashOut && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction?"
        description="Are you sure you want to delete this transaction record? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
