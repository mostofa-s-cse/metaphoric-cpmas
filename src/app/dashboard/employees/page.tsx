'use client';

/**
 * CPMAS — Workforce Management (Employees, Labor & Attendance)
 * Powered by RTK Query, React Hook Form, and Zod validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { Modal } from '@/components/ui/Modal';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetEmployeesQuery,
  useGetLaboursQuery,
  useGetProjectsListQuery,
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useCreateLabourMutation,
  useDeleteLabourMutation,
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
  useCreateCashOutMutation,
  ApiEmployee,
  ApiLabour,
} from '@/store/api/cpmasApi';
import {
  employeeSchema,
  EmployeeFormValues,
  labourSchema,
  LabourFormValues,
} from '@/lib/schemas';
import {
  Users2,
  Plus,
  Search,
  Phone,
  Mail,
  UserCheck,
  Building,
  DollarSign,
  Calendar,
  X,
  Check,
  AlertCircle,
  Loader2,
  CalendarCheck,
  UserPlus,
  UserX,
  CreditCard,
  NotebookTabs,
  Trash2,
} from 'lucide-react';

export default function EmployeesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'employees' | 'labour' | 'attendance'>('employees');

  // Queries & Mutations
  const { data: empData, isLoading: isFetchingEmployees, error: empError, refetch: refetchEmployees } = useGetEmployeesQuery();
  const { data: labData, isLoading: isFetchingLabours, error: labError, refetch: refetchLabours } = useGetLaboursQuery();
  const { data: prjData } = useGetProjectsListQuery();

  const [createEmployee, { isLoading: isCreatingEmployee }] = useCreateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [createLabour, { isLoading: isCreatingLabour }] = useCreateLabourMutation();
  const [deleteLabour] = useDeleteLabourMutation();
  const [createCashOut, { isLoading: isProcessingSalary }] = useCreateCashOutMutation();

  const employees = empData?.employees || [];
  const labours = labData?.labours || [];
  const projects = prjData?.projects || [];

  // Search states
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchLabour, setSearchLabour] = useState('');

  // Pagination state
  const [empPage, setEmpPage] = useState(1);
  const [empLimit, setEmpLimit] = useState(10);
  const [labPage, setLabPage] = useState(1);
  const [labLimit, setLabLimit] = useState(10);

  // Attendance logging states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});

  // Query for fetching attendance on the selected date
  const {
    data: attendanceData,
    isFetching: isFetchingAttendance,
    refetch: refetchAttendance,
  } = useGetAttendanceQuery({ date: selectedDate }, { skip: activeTab !== 'attendance' });

  const [saveAttendance, { isLoading: isSavingAttendance }] = useCreateAttendanceMutation();

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLabourModalOpen, setIsLabourModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<ApiEmployee | null>(null);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<{ id: string; type: 'employee' | 'labour' } | null>(null);

  // Salary disbursement manual form state
  const [salaryFormData, setSalaryFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    basicSalary: '',
    bonus: '0',
    deduction: '0',
    paidAmount: '',
    paymentMethod: 'BANK',
    referenceNumber: '',
    notes: '',
  });

  // React Hook Form for Employee
  const {
    register: registerEmployee,
    handleSubmit: handleSubmitEmployee,
    reset: resetEmployee,
    control: controlEmployee,
    formState: { errors: employeeErrors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: '',
      fullName: '',
      designation: '',
      department: 'Engineering',
      phoneNumber: '',
      email: '',
      joiningDate: new Date().toISOString().split('T')[0],
      monthlySalary: '',
      employmentStatus: 'ACTIVE',
    },
    mode: 'all',
  });

  // React Hook Form for Labour
  const {
    register: registerLabour,
    handleSubmit: handleSubmitLabour,
    reset: resetLabour,
    setValue: setLabourValue,
    formState: { errors: labourErrors },
  } = useForm<LabourFormValues>({
    resolver: zodResolver(labourSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      trade: 'Mason',
      dailyWage: '',
      projectId: '',
      employmentStatus: 'ACTIVE',
    },
    mode: 'all',
  });

  // Load fetched attendance into form state
  useEffect(() => {
    if (activeTab === 'attendance' && attendanceData) {
      const records: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
      (attendanceData.attendance || []).forEach((att: any) => {
        records[att.labourId] = att.status;
      });

      // Default remaining active workers to PRESENT
      labours.forEach((l) => {
        if (!records[l.id] && l.employmentStatus === 'ACTIVE') {
          records[l.id] = 'PRESENT';
        }
      });

      setAttendanceRecords(records);
    }
  }, [attendanceData, labours, activeTab]);

  const handleOpenEmployeeCreate = () => {
    resetEmployee({
      employeeId: '',
      fullName: '',
      designation: '',
      department: 'Engineering',
      phoneNumber: '',
      email: '',
      joiningDate: new Date().toISOString().split('T')[0],
      monthlySalary: '',
      employmentStatus: 'ACTIVE',
    });
    setIsEmployeeModalOpen(true);
  };

  const handleOpenLabourCreate = () => {
    if (projects.length === 0) {
      toast.error('Please create a project first before registering site labor.');
      return;
    }
    resetLabour({
      name: '',
      phoneNumber: '',
      trade: 'Mason',
      dailyWage: '',
      projectId: projects[0].id,
      employmentStatus: 'ACTIVE',
    });
    setIsLabourModalOpen(true);
  };

  const onEmployeeSubmit = async (values: EmployeeFormValues) => {
    try {
      await toast.handlePromise(createEmployee({
        ...values,
        monthlySalary: parseFloat(values.monthlySalary),
      }).unwrap());
      refetchEmployees();
      setIsEmployeeModalOpen(false);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const onLabourSubmit = async (values: LabourFormValues) => {
    try {
      await toast.handlePromise(createLabour({
        ...values,
        dailyWage: parseFloat(values.dailyWage),
      }).unwrap());
      refetchLabours();
      setIsLabourModalOpen(false);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const handleDeleteClick = (id: string, type: 'employee' | 'labour') => {
    setPersonToDelete({ id, type });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    try {
      if (personToDelete.type === 'employee') {
        await toast.handlePromise(deleteEmployee(personToDelete.id).unwrap());
        refetchEmployees();
      } else {
        await toast.handlePromise(deleteLabour(personToDelete.id).unwrap());
        refetchLabours();
      }
      setDeleteConfirmOpen(false);
      setPersonToDelete(null);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const handleOpenSalaryDisburse = (emp: ApiEmployee) => {
    setSelectedEmployee(emp);
    setSalaryFormData({
      month: new Date().toISOString().slice(0, 7),
      basicSalary: emp.monthlySalary.toString(),
      bonus: '0',
      deduction: '0',
      paidAmount: emp.monthlySalary.toString(),
      paymentMethod: 'BANK',
      referenceNumber: '',
      notes: '',
    });
    setIsSalaryModalOpen(true);
  };

  const handleDisburseSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const basic = parseFloat(salaryFormData.basicSalary) || 0;
    const bonus = parseFloat(salaryFormData.bonus) || 0;
    const ded = parseFloat(salaryFormData.deduction) || 0;
    const paid = parseFloat(salaryFormData.paidAmount) || 0;
    const net = basic + bonus - ded;

    const payload = {
      date: new Date(`${salaryFormData.month}-01`).toISOString(),
      expenseCategory: 'EMPLOYEE_SALARY',
      paidTo: selectedEmployee.fullName,
      amount: paid,
      paymentMethod: salaryFormData.paymentMethod,
      referenceNumber: salaryFormData.referenceNumber,
      notes: `Salary for ${salaryFormData.month}. Basic: ${basic}, Bonus: ${bonus}, Ded: ${ded}, Net: ${net}. ${salaryFormData.notes}`,
    };

    try {
      await toast.handlePromise(
        createCashOut(payload).unwrap(),
        {
          successMessage: `Successfully logged salary disbursement of ${formatCurrency(paid)} for ${selectedEmployee.fullName}`
        }
      );
      setIsSalaryModalOpen(false);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const handleSaveAttendance = async () => {
    const recordsArray = Object.entries(attendanceRecords).map(([labourId, status]) => {
      const worker = labours.find((l) => l.id === labourId);
      return {
        labourId,
        status,
        projectId: worker?.projectId,
      };
    });

    try {
      await toast.handlePromise(
        saveAttendance({
          date: selectedDate,
          records: recordsArray,
        }).unwrap()
      );
      refetchAttendance();
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    }
  };

  const toggleAttendanceStatus = (labourId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [labourId]: status,
    }));
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  const filteredLabours = labours.filter(
    (lab) =>
      lab.name.toLowerCase().includes(searchLabour.toLowerCase()) ||
      lab.trade.toLowerCase().includes(searchLabour.toLowerCase())
  );

  useEffect(() => { setEmpPage(1); }, [searchEmployee]);
  useEffect(() => { setLabPage(1); }, [searchLabour]);

  const paginatedEmployees = filteredEmployees.slice((empPage - 1) * empLimit, empPage * empLimit);
  const paginatedLabours = filteredLabours.slice((labPage - 1) * labLimit, labPage * labLimit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const isFetching = isFetchingEmployees || isFetchingLabours;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <Users2 className="h-5.5 w-5.5 text-cyan-400" />
            Workforce Management
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Register engineers, staff and site labor, log daily attendance sheets, and disburse monthly salaries.
          </p>
        </div>

        {/* Tab-specific actions */}
        {user && user.role !== 'DATA_ENTRY_OPERATOR' && (
          <div className="flex gap-2">
            {activeTab === 'employees' && (
              <Button
                onClick={handleOpenEmployeeCreate}
                icon={<UserPlus className="h-4.5 w-4.5" />}
              >
                Register Employee
              </Button>
            )}
            {activeTab === 'labour' && (
              <Button
                onClick={handleOpenLabourCreate}
                icon={<UserPlus className="h-4.5 w-4.5" />}
              >
                Register Labour
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'employees'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Employees &amp; Engineers ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('labour')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'labour'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Labour Registry ({labours.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Daily Labor Attendance
        </button>
      </div>

      {/* Tab 1: Employees */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, name or designation..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
            />
          </div>

          {isFetching ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-400 mb-2" />
              <span className="text-slate-500 text-xs">Loading employee logs...</span>
            </div>
          ) : empError ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
              <Users2 className="h-10 w-10 text-rose-500 mb-2" />
              <span className="text-slate-350 text-xs font-semibold">Failed to fetch employees</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4 text-slate-500 text-xs">
              No employees registered.
            </div>
          ) : (
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/20 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Full Name</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Joining Date</th>
                      <th className="p-4 text-right">Monthly Salary</th>
                      <th className="p-4 text-center">Salaries</th>
                      {user?.role === 'SUPER_ADMIN' && <th className="p-4 text-right">Delete</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-bold text-cyan-455 font-mono">{emp.employeeId}</td>
                        <td className="p-4 font-semibold text-slate-200">{emp.fullName}</td>
                        <td className="p-4 text-slate-350">{emp.designation}</td>
                        <td className="p-4 text-slate-400">{emp.department}</td>
                        <td className="p-4 text-slate-500">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                        <td className="p-4 text-right font-bold text-slate-200">
                          {formatCurrency(emp.monthlySalary)}
                        </td>
                        <td className="p-4 text-center">
                          {user && ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(user.role) ? (
                            <button
                              onClick={() => handleOpenSalaryDisburse(emp)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow flex items-center gap-1 mx-auto"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Pay Salary</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-550 italic">No access</span>
                          )}
                        </td>
                        {user?.role === 'SUPER_ADMIN' && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteClick(emp.id, 'employee')}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer animate-in duration-200"
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
                currentPage={empPage}
                totalPages={Math.ceil(filteredEmployees.length / empLimit)}
                totalItems={filteredEmployees.length}
                limit={empLimit}
                onPageChange={setEmpPage}
                onLimitChange={(l) => { setEmpLimit(l); setEmpPage(1); }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Labour */}
      {activeTab === 'labour' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by worker name or trade trade..."
              value={searchLabour}
              onChange={(e) => setSearchLabour(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
            />
          </div>

          {isFetching ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-400 mb-2" />
              <span className="text-slate-500 text-xs">Loading labor logs...</span>
            </div>
          ) : labError ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
              <Users2 className="h-10 w-10 text-rose-500 mb-2" />
              <span className="text-slate-350 text-xs font-semibold">Failed to fetch labors registry</span>
            </div>
          ) : filteredLabours.length === 0 ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4 text-slate-500 text-xs">
              No workers registered in labour registry.
            </div>
          ) : (
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/20 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="p-4">Name</th>
                      <th className="p-4">Assigned Project</th>
                      <th className="p-4">Trade Craft</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4 text-right">Daily Wage</th>
                      <th className="p-4 text-center">Status</th>
                      {user?.role === 'SUPER_ADMIN' && <th className="p-4 text-right">Delete</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedLabours.map((lab) => (
                      <tr key={lab.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-semibold text-slate-200">{lab.name}</td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-300 block">{lab.project?.name}</span>
                          <span className="text-[10px] font-mono text-cyan-405 block mt-0.5">
                            {lab.project?.code}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-300">{lab.trade}</td>
                        <td className="p-4 text-slate-450">{lab.phoneNumber}</td>
                        <td className="p-4 text-right font-bold text-slate-200">
                          {formatCurrency(lab.dailyWage)}/day
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              lab.employmentStatus === 'ACTIVE'
                                ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                                : 'text-slate-400 border-slate-500/20 bg-slate-500/5'
                            }`}
                          >
                            {lab.employmentStatus}
                          </span>
                        </td>
                        {user?.role === 'SUPER_ADMIN' && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteClick(lab.id, 'labour')}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer animate-in duration-200"
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
                currentPage={labPage}
                totalPages={Math.ceil(filteredLabours.length / labLimit)}
                totalItems={filteredLabours.length}
                limit={labLimit}
                onPageChange={setLabPage}
                onLimitChange={(l) => { setLabLimit(l); setLabPage(1); }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Daily Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-cyan-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-200">Daily labor attendance log sheet</h3>
                <p className="text-[10px] text-slate-500">Record check-ins to run payroll billing</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DatePickerInput
                id="attendanceDate"
                value={selectedDate}
                onChange={setSelectedDate}
              />
              {user && user.role !== 'DATA_ENTRY_OPERATOR' && (
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance || labours.length === 0}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingAttendance && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Attendance</span>
                </button>
              )}
            </div>
          </div>

          {isFetchingAttendance || isFetchingLabours ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-400 mb-2" />
              <span className="text-slate-500 text-xs">Loading attendance log card...</span>
            </div>
          ) : labours.length === 0 ? (
            <div className="h-60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4 text-slate-500 text-xs">
              No active labour force registered.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/20 backdrop-blur-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="p-4">Worker Name</th>
                    <th className="p-4">Assigned Project</th>
                    <th className="p-4">Craft Type</th>
                    <th className="p-4 text-center">Attendance Logs status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {labours
                    .filter((l) => l.employmentStatus === 'ACTIVE')
                    .map((l) => {
                      const currentStatus = attendanceRecords[l.id] || 'PRESENT';
                      return (
                        <tr key={l.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 font-semibold text-slate-200">{l.name}</td>
                          <td className="p-4 text-slate-400">{l.project?.name}</td>
                          <td className="p-4 text-slate-455 font-mono">{l.trade}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={user?.role === 'DATA_ENTRY_OPERATOR'}
                                onClick={() => toggleAttendanceStatus(l.id, 'PRESENT')}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === 'PRESENT'
                                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                                    : 'bg-transparent text-slate-600 hover:text-slate-400 border border-transparent'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>PRESENT</span>
                              </button>
                              <button
                                type="button"
                                disabled={user?.role === 'DATA_ENTRY_OPERATOR'}
                                onClick={() => toggleAttendanceStatus(l.id, 'ABSENT')}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === 'ABSENT'
                                    ? 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                                    : 'bg-transparent text-slate-600 hover:text-slate-400 border border-transparent'
                                }`}
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>ABSENT</span>
                              </button>
                              <button
                                type="button"
                                disabled={user?.role === 'DATA_ENTRY_OPERATOR'}
                                onClick={() => toggleAttendanceStatus(l.id, 'LEAVE')}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === 'LEAVE'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-transparent text-slate-600 hover:text-slate-400 border border-transparent'
                                }`}
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>LEAVE</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Register Employee */}
      <Modal
        open={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Building className="h-4.5 w-4.5 text-cyan-400" />
            Register Staff Employee
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSubmitEmployee(onEmployeeSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Employee ID</label>
                  <input
                    type="text"
                    {...registerEmployee('employeeId')}
                    placeholder="e.g. EMP-202"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      employeeErrors.employeeId
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {employeeErrors.employeeId && (
                    <p className="text-rose-400 text-[10px] mt-1">{employeeErrors.employeeId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    {...registerEmployee('fullName')}
                    placeholder="e.g. David Smith"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      employeeErrors.fullName
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {employeeErrors.fullName && (
                    <p className="text-rose-400 text-[10px] mt-1">{employeeErrors.fullName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Designation</label>
                  <input
                    type="text"
                    {...registerEmployee('designation')}
                    placeholder="e.g. Project Engineer"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      employeeErrors.designation
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {employeeErrors.designation && (
                    <p className="text-rose-400 text-[10px] mt-1">{employeeErrors.designation.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Department</label>
                  <select
                    {...registerEmployee('department')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Accounts &amp; Finance">Accounts &amp; Finance</option>
                    <option value="Operations &amp; Management">Operations &amp; Management</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Procurement">Procurement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Phone Number</label>
                  <input
                    type="text"
                    {...registerEmployee('phoneNumber')}
                    placeholder="e.g. +1 555-0199"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      employeeErrors.phoneNumber
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {employeeErrors.phoneNumber && (
                    <p className="text-rose-400 text-[10px] mt-1">{employeeErrors.phoneNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    {...registerEmployee('email')}
                    placeholder="e.g. david@cpmas.com"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      employeeErrors.email
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {employeeErrors.email && (
                    <p className="text-rose-400 text-[10px] mt-1">{employeeErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Joining Date</label>
                  <Controller
                    name="joiningDate"
                    control={controlEmployee}
                    render={({ field }) => (
                      <DatePickerInput
                        id="joiningDate"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!employeeErrors.joiningDate}
                      />
                    )}
                  />
                  {employeeErrors.joiningDate && (
                    <p className="text-rose-400 text-[10px] mt-1">{employeeErrors.joiningDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Monthly Salary ($)</label>
                  <input
                    type="text"
                    {...registerEmployee('monthlySalary')}
                    placeholder="e.g. 5000"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      employeeErrors.monthlySalary
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {employeeErrors.monthlySalary && (
                    <p className="text-rose-400 text-[10px] mt-1">{employeeErrors.monthlySalary.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEmployeeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isCreatingEmployee}
                >
                  Register Employee
                </Button>
              </div>
            </form>
      </Modal>

      {/* Modal 2: Register Labour */}
      <Modal
        open={isLabourModalOpen}
        onClose={() => setIsLabourModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <NotebookTabs className="h-4.5 w-4.5 text-cyan-400" />
            Register Site Labour Worker
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSubmitLabour(onLabourSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Worker Name</label>
                  <input
                    type="text"
                    {...registerLabour('name')}
                    placeholder="e.g. Mason Robert"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      labourErrors.name
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {labourErrors.name && <p className="text-rose-400 text-[10px] mt-1">{labourErrors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Phone Number</label>
                  <input
                    type="text"
                    {...registerLabour('phoneNumber')}
                    placeholder="e.g. +1 555-8910"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      labourErrors.phoneNumber
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {labourErrors.phoneNumber && (
                    <p className="text-rose-400 text-[10px] mt-1">{labourErrors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Trade Craft</label>
                  <select
                    {...registerLabour('trade')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="Mason">Mason</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Steel Worker">Steel Worker</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Helper / Laborer">Helper / Laborer</option>
                    <option value="Site Supervisor">Site Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Daily Wage ($)</label>
                  <input
                    type="text"
                    {...registerLabour('dailyWage')}
                    placeholder="e.g. 150"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      labourErrors.dailyWage
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {labourErrors.dailyWage && (
                    <p className="text-rose-400 text-[10px] mt-1">{labourErrors.dailyWage.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Assign to Project</label>
                <select
                  {...registerLabour('projectId')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsLabourModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isCreatingLabour}
                >
                  Register Worker
                </Button>
              </div>
            </form>
      </Modal>

      {/* Modal 3: Disburse Salary (Employee or Labour) */}
      {selectedEmployee && (
        <Modal
          open={isSalaryModalOpen}
          onClose={() => setIsSalaryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
              Disburse Salary / Wages
            </div>
          }
          size="md"
        >
          <form onSubmit={handleDisburseSalarySubmit} className="space-y-4">
              <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/40 text-xs space-y-1">
                <p>
                  <span className="font-bold text-slate-400">Employee:</span> {selectedEmployee.fullName}
                </p>
                <p>
                  <span className="font-bold text-slate-400">Designation:</span> {selectedEmployee.designation}
                </p>
                <p>
                  <span className="font-bold text-slate-400">Fixed monthly pay:</span>{' '}
                  {formatCurrency(selectedEmployee.monthlySalary)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-450 text-xs font-semibold mb-2">Billing Month</label>
                  <input
                    type="month"
                    required
                    value={salaryFormData.month}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-450 text-xs font-semibold mb-2">Basic Salary ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={salaryFormData.basicSalary}
                    onChange={(e) => {
                      const basic = e.target.value;
                      const bonus = salaryFormData.bonus;
                      const ded = salaryFormData.deduction;
                      setSalaryFormData({
                        ...salaryFormData,
                        basicSalary: basic,
                        paidAmount: (
                          (parseFloat(basic) || 0) +
                          (parseFloat(bonus) || 0) -
                          (parseFloat(ded) || 0)
                        ).toString(),
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-455 text-xs font-semibold mb-2">Allowance/Bonus ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={salaryFormData.bonus}
                    onChange={(e) => {
                      const basic = salaryFormData.basicSalary;
                      const bonus = e.target.value;
                      const ded = salaryFormData.deduction;
                      setSalaryFormData({
                        ...salaryFormData,
                        bonus: bonus,
                        paidAmount: (
                          (parseFloat(basic) || 0) +
                          (parseFloat(bonus) || 0) -
                          (parseFloat(ded) || 0)
                        ).toString(),
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-455 text-xs font-semibold mb-2">Deductions ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={salaryFormData.deduction}
                    onChange={(e) => {
                      const basic = salaryFormData.basicSalary;
                      const bonus = salaryFormData.bonus;
                      const ded = e.target.value;
                      setSalaryFormData({
                        ...salaryFormData,
                        deduction: ded,
                        paidAmount: (
                          (parseFloat(basic) || 0) +
                          (parseFloat(bonus) || 0) -
                          (parseFloat(ded) || 0)
                        ).toString(),
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-455 text-xs font-semibold mb-2">Actual Paid Net ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={salaryFormData.paidAmount}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, paidAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs font-bold text-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-455 text-xs font-semibold mb-2">Payment Method</label>
                  <select
                    value={salaryFormData.paymentMethod}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs transition-all cursor-pointer"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="MOBILE_BANKING">MOBILE BANKING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-455 text-xs font-semibold mb-2">Reference # (Check/Receipt No.)</label>
                <input
                  type="text"
                  value={salaryFormData.referenceNumber}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, referenceNumber: e.target.value })}
                  placeholder="e.g. TXN-10294"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-455 text-xs font-semibold mb-2">Transaction Notes</label>
                <textarea
                  rows={2}
                  value={salaryFormData.notes}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, notes: e.target.value })}
                  placeholder="Add payroll transaction details..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsSalaryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isProcessingSalary}
                >
                  Disburse Salary
                </Button>
              </div>
            </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record?"
        description="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
