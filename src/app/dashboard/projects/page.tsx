'use client';

/**
 * CPMAS — Projects Page
 * Powered by RTK Query (caching/fetching), React Hook Form, and Zod validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  ApiProject,
} from '@/store/api/cpmasApi';
import { projectSchema, ProjectFormValues } from '@/lib/schemas';
import {
  FolderKanban,
  Plus,
  Search,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  X,
  Trash2,
  Edit2,
  FileText,
  Hammer,
  Users,
  HardHat,
  Loader2,
  TrendingDown,
  Info,
  Briefcase,
} from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Queries & Mutations
  const { data, isLoading: isFetching, error: fetchError } = useGetProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const projects = data?.projects || [];

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Details drawer state
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: '',
      clientName: '',
      clientContactNumber: '',
      projectLocation: '',
      startDate: '',
      expectedCompletionDate: '',
      estimatedBudget: '',
      status: 'PLANNING',
      description: '',
    },
    mode: 'onBlur',
  });

  // Track selected project updates when projects list refreshes
  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id);
      if (updated) {
        setSelectedProject(updated);
      }
    }
  }, [projects, selectedProject]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedProjectId(null);
    reset({
      name: '',
      code: '',
      clientName: '',
      clientContactNumber: '',
      projectLocation: '',
      startDate: '',
      expectedCompletionDate: '',
      estimatedBudget: '',
      status: 'PLANNING',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: ApiProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedProjectId(project.id);
    reset({
      name: project.name,
      code: project.code,
      clientName: project.clientName,
      clientContactNumber: project.clientContactNumber,
      projectLocation: project.projectLocation,
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      expectedCompletionDate: new Date(project.expectedCompletionDate).toISOString().split('T')[0],
      estimatedBudget: project.estimatedBudget.toString(),
      status: project.status,
      description: project.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        'Are you sure you want to delete this project? This will permanently remove all material records, labour assignments, and transactions related to this project.'
      )
    ) {
      return;
    }

    try {
      await deleteProject(id).unwrap();
      showSuccessToast('Project deleted successfully');
      if (selectedProject?.id === id) {
        setIsDetailsOpen(false);
      }
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to delete project');
    }
  };

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      const payload = {
        ...values,
        estimatedBudget: parseFloat(values.estimatedBudget),
      };
      if (modalMode === 'create') {
        await createProject(payload).unwrap();
        showSuccessToast('Project created successfully');
      } else if (selectedProjectId) {
        await updateProject({ id: selectedProjectId, ...payload }).unwrap();
        showSuccessToast('Project updated successfully');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showErrorToast(err?.data?.error || 'Failed to save project');
    }
  };

  const handleProjectClick = (project: ApiProject) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  // Profitability calculations
  const calculateProfitability = (project: ApiProject | null) => {
    if (!project) return null;

    const projectCashIns = project.cashIns || [];
    const revenue =
      projectCashIns.reduce((sum: number, ci: any) => sum + ci.amount, 0) ||
      project.estimatedBudget;

    const cashOuts = project.cashOuts || [];
    const materialsCost = cashOuts
      .filter((co: any) => co.expenseCategory === 'MATERIALS')
      .reduce((sum: number, co: any) => sum + co.amount, 0);
    const laborCost = cashOuts
      .filter((co: any) => co.expenseCategory === 'LABOR')
      .reduce((sum: number, co: any) => sum + co.amount, 0);
    const contractorCost = cashOuts
      .filter((co: any) => co.expenseCategory === 'CONTRACTOR_PAYMENT')
      .reduce((sum: number, co: any) => sum + co.amount, 0);
    const salaryCost = cashOuts
      .filter((co: any) => co.expenseCategory === 'EMPLOYEE_SALARY')
      .reduce((sum: number, co: any) => sum + co.amount, 0);
    const otherCost = cashOuts
      .filter(
        (co: any) =>
          !['MATERIALS', 'LABOR', 'CONTRACTOR_PAYMENT', 'EMPLOYEE_SALARY'].includes(
            co.expenseCategory
          )
      )
      .reduce((sum: number, co: any) => sum + co.amount, 0);

    const totalCost = materialsCost + laborCost + contractorCost + salaryCost + otherCost;
    const grossProfit = revenue - totalCost;
    const netProfit = grossProfit;
    const profitPercentage = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      materialsCost,
      laborCost,
      contractorCost,
      salaryCost,
      otherCost,
      totalCost,
      grossProfit,
      netProfit,
      profitPercentage,
    };
  };

  const profitability = calculateProfitability(selectedProject);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
      case 'RUNNING':
        return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'COMPLETED':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'ARCHIVED':
        return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
      default:
        return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const isBusy = isCreating || isUpdating;

  return (
    <div className="flex-1 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <FolderKanban className="h-5.5 w-5.5 text-cyan-400" />
            Construction Projects
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage infrastructure development sites, client details, and budgets
          </p>
        </div>

        {/* Action buttons */}
        {(user?.role === 'SUPER_ADMIN' ||
          user?.role === 'ADMIN' ||
          user?.role === 'PROJECT_MANAGER') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-550 text-slate-950 text-xs font-bold rounded-xl shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by project name, code, client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-400 focus:outline-none text-xs transition-all cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="PLANNING">PLANNING</option>
          <option value="RUNNING">RUNNING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {/* Main Content Area */}
      {isFetching ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <p className="text-slate-500 text-xs font-semibold">Loading projects database...</p>
        </div>
      ) : fetchError ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-6">
          <Info className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-slate-350 text-sm font-semibold">Failed to fetch project listings</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
          <FolderKanban className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-slate-400 text-sm font-bold">No projects found</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or status filter settings.'
              : 'Create a new project workspace to start tracking materials and accounting.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/25 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="py-4.5 px-6">Code &amp; Name</th>
                  <th className="py-4.5 px-4">Client Contact</th>
                  <th className="py-4.5 px-4">Location</th>
                  <th className="py-4.5 px-4">Timeframe</th>
                  <th className="py-4.5 px-4">Budget</th>
                  <th className="py-4.5 px-4">Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="hover:bg-slate-900/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 max-w-xs">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                        {project.code}
                      </span>
                      <h4 className="font-bold text-slate-200 mt-0.5 group-hover:text-cyan-300 transition-colors truncate">
                        {project.name}
                      </h4>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-300 block truncate w-32">
                        {project.clientName}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {project.clientContactNumber}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5 truncate w-36">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{project.projectLocation}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>
                          {new Date(project.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          -{' '}
                          {new Date(project.expectedCompletionDate).toLocaleDateString(undefined, {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-200">
                      {formatCurrency(project.estimatedBudget)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {(user?.role === 'SUPER_ADMIN' ||
                          user?.role === 'ADMIN' ||
                          user?.role === 'PROJECT_MANAGER') && (
                          <button
                            onClick={(e) => handleOpenEdit(project, e)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-lg border border-transparent hover:border-cyan-500/10 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {user?.role === 'SUPER_ADMIN' && (
                          <button
                            onClick={(e) => handleDelete(project.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Slide-Over Drawer */}
      {isDetailsOpen && selectedProject && profitability && (
        <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsDetailsOpen(false)} />
          <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 relative flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-350">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/20">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    {selectedProject.code}
                  </span>
                  <h2 className="font-bold text-slate-200 text-sm line-clamp-1">{selectedProject.name}</h2>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Project Stats Summary Widgets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                    <DollarSign className="h-4 w-4 text-cyan-400" />
                    Project Revenue
                  </div>
                  <span className="text-base font-bold text-slate-100">
                    {formatCurrency(profitability.revenue)}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">Based on client collections</p>
                </div>

                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                    Total Expenses
                  </div>
                  <span className="text-base font-bold text-slate-100">
                    {formatCurrency(profitability.totalCost)}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">Material + Labor + Contractor + Salary</p>
                </div>

                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Net Profit
                  </div>
                  <span
                    className={`text-base font-bold ${
                      profitability.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(profitability.netProfit)}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">Revenue minus total cost</p>
                </div>

                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                    <Percent className="h-4 w-4 text-purple-400" />
                    Profit Margin
                  </div>
                  <span
                    className={`text-base font-bold ${
                      profitability.profitPercentage >= 0 ? 'text-purple-400' : 'text-rose-400'
                    }`}
                  >
                    {profitability.profitPercentage.toFixed(2)}%
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">Gross return yield</p>
                </div>
              </div>

              {/* Detailed Expense Breakdown */}
              <div className="border border-slate-850 rounded-xl p-4 bg-slate-950/30">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                  Expense Cost Center breakdown
                </h3>
                <div className="space-y-2.5 text-xs text-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Hammer className="h-3.5 w-3.5 text-slate-500" />
                      Materials Purchase:
                    </span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(profitability.materialsCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <HardHat className="h-3.5 w-3.5 text-slate-500" />
                      Labor Wages:
                    </span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(profitability.laborCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      Contractor Payments:
                    </span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(profitability.contractorCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      Engineers &amp; Staff Salaries:
                    </span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(profitability.salaryCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-slate-500" />
                      Other &amp; Office Overheads:
                    </span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(profitability.otherCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stakeholders Count */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/20">
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                    Materials Purchase
                  </span>
                  <span className="block text-sm font-bold text-slate-200 mt-1">
                    {selectedProject.materials?.length || 0} Invoice(s)
                  </span>
                </div>
                <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/20">
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                    Assigned Labor
                  </span>
                  <span className="block text-sm font-bold text-slate-200 mt-1">
                    {selectedProject.labours?.length || 0} worker(s)
                  </span>
                </div>
                <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/20">
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                    Related Docs
                  </span>
                  <span className="block text-sm font-bold text-slate-200 mt-1">
                    {selectedProject.documents?.length || 0} document(s)
                  </span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/10 space-y-2 text-xs text-slate-400">
                <p>
                  <span className="font-bold text-slate-300">Client Name:</span>{' '}
                  {selectedProject.clientName}
                </p>
                <p>
                  <span className="font-bold text-slate-300">Contact Number:</span>{' '}
                  {selectedProject.clientContactNumber}
                </p>
                <p>
                  <span className="font-bold text-slate-300">Project Location:</span>{' '}
                  {selectedProject.projectLocation}
                </p>
                <p>
                  <span className="font-bold text-slate-300">Description:</span>{' '}
                  {selectedProject.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <FolderKanban className="h-4.5 w-4.5 text-cyan-400" />
                {modalMode === 'create' ? 'Create Construction Project' : 'Edit Project Details'}
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
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Project Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Skyline Heights"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.name
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.name && <p className="text-rose-400 text-[10px] mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Project Code</label>
                  <input
                    type="text"
                    disabled={modalMode === 'edit'}
                    {...register('code')}
                    placeholder="e.g. PRJ-SKY-001"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all disabled:opacity-50 ${
                      errors.code
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.code && <p className="text-rose-400 text-[10px] mt-1">{errors.code.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Client Name</label>
                  <input
                    type="text"
                    {...register('clientName')}
                    placeholder="e.g. Vertex Devs Ltd"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.clientName
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.clientName && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.clientName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Client Contact</label>
                  <input
                    type="text"
                    {...register('clientContactNumber')}
                    placeholder="e.g. +1 555-1234"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.clientContactNumber
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.clientContactNumber && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.clientContactNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Location</label>
                <input
                  type="text"
                  {...register('projectLocation')}
                  placeholder="e.g. 12 Bridge Lane, West Side"
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.projectLocation
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.projectLocation && (
                  <p className="text-rose-400 text-[10px] mt-1">{errors.projectLocation.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.startDate
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.startDate && <p className="text-rose-400 text-[10px] mt-1">{errors.startDate.message}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Completion Date</label>
                  <input
                    type="date"
                    {...register('expectedCompletionDate')}
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.expectedCompletionDate
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.expectedCompletionDate && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.expectedCompletionDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Est. Budget ($)</label>
                  <input
                    type="text"
                    {...register('estimatedBudget')}
                    placeholder="e.g. 1500000"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.estimatedBudget
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.estimatedBudget && (
                    <p className="text-rose-400 text-[10px] mt-1">{errors.estimatedBudget.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Current Status</label>
                <select
                  {...register('status')}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.status
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                {errors.status && <p className="text-rose-400 text-[10px] mt-1">{errors.status.message}</p>}
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="Enter project summary details..."
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.description
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-850 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.description && <p className="text-rose-400 text-[10px] mt-1">{errors.description.message}</p>}
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
                  disabled={isBusy}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Project' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
