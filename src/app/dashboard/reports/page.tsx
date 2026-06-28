import React from 'react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  TrendingUp,
  Coins,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Briefcase,
  Layers,
  HelpCircle,
  FolderKanban
} from 'lucide-react';

export const revalidate = 0; // Disable cache

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // RBAC: Only Super Admin, Admin, and Accountant can access reports
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
    return (
      <div className="border border-slate-800 rounded-2xl p-16 text-center text-slate-500">
        <HelpCircle className="h-10 w-10 mx-auto text-slate-700 mb-3" />
        <p className="font-semibold text-sm">Forbidden Access</p>
        <p className="text-xs mt-1 text-slate-600">You do not have permissions to view executive financial statements.</p>
      </div>
    );
  }

  // Fetch all transactions and projects
  const projects = await prisma.project.findMany({
    include: {
      cashIns: true,
      cashOuts: true,
    },
  });

  const cashIns = await prisma.cashIn.findMany();
  const cashOuts = await prisma.cashOut.findMany();

  // 1. Overall Totals
  const totalCashIn = cashIns.reduce((sum, ci) => sum + ci.amount, 0);
  const totalCashOut = cashOuts.reduce((sum, co) => sum + co.amount, 0);
  const netProfit = totalCashIn - totalCashOut;

  // 2. Cost Category Aggregations for P&L
  const getExpenseByCategory = (cat: string) => {
    return cashOuts.filter((co) => co.expenseCategory === cat).reduce((sum, co) => sum + co.amount, 0);
  };

  const plCategories = [
    { label: 'Materials Cost', amount: getExpenseByCategory('MATERIALS') },
    { label: 'Labor Cost', amount: getExpenseByCategory('LABOR') },
    { label: 'Employee Salaries', amount: getExpenseByCategory('EMPLOYEE_SALARY') },
    { label: 'Contractor Milestones', amount: getExpenseByCategory('CONTRACTOR_PAYMENT') },
    { label: 'Office Rent & Admin', amount: getExpenseByCategory('OFFICE_RENT') },
    { label: 'Utilities & Internet', amount: getExpenseByCategory('UTILITIES') },
    { label: 'Transportation Costs', amount: getExpenseByCategory('TRANSPORTATION') },
    { label: 'Fuel Expenses', amount: getExpenseByCategory('FUEL') },
    { label: 'Equipment Rental', amount: getExpenseByCategory('EQUIPMENT_RENTAL') },
    { label: 'Other/Miscellaneous Overheads', amount: cashOuts.filter((co) => !['MATERIALS', 'LABOR', 'CONTRACTOR_PAYMENT', 'EMPLOYEE_SALARY', 'OFFICE_RENT', 'UTILITIES', 'TRANSPORTATION', 'FUEL', 'EQUIPMENT_RENTAL'].includes(co.expenseCategory)).reduce((sum, co) => sum + co.amount, 0) },
  ];

  const totalCostFromCategories = plCategories.reduce((sum, cat) => sum + cat.amount, 0);

  // 3. Cash Flow Summary
  const openingBalance = 50000.0; // Simulated opening equity
  const closingBalance = openingBalance + totalCashIn - totalCashOut;

  // 4. Project Profitability Calculations
  const projectReports = projects.map((p) => {
    const revenue = p.cashIns.reduce((sum, ci) => sum + ci.amount, 0) || p.estimatedBudget;
    const materialCost = p.cashOuts.filter((co) => co.expenseCategory === 'MATERIALS').reduce((sum, co) => sum + co.amount, 0);
    const laborCost = p.cashOuts.filter((co) => co.expenseCategory === 'LABOR').reduce((sum, co) => sum + co.amount, 0);
    const contractorCost = p.cashOuts.filter((co) => co.expenseCategory === 'CONTRACTOR_PAYMENT').reduce((sum, co) => sum + co.amount, 0);
    const salaryCost = p.cashOuts.filter((co) => co.expenseCategory === 'EMPLOYEE_SALARY').reduce((sum, co) => sum + co.amount, 0);
    const otherCost = p.cashOuts.filter((co) => !['MATERIALS', 'LABOR', 'CONTRACTOR_PAYMENT', 'EMPLOYEE_SALARY'].includes(co.expenseCategory)).reduce((sum, co) => sum + co.amount, 0);

    const totalCost = materialCost + laborCost + contractorCost + salaryCost + otherCost;
    const grossProfit = revenue - totalCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      budget: p.estimatedBudget,
      revenue,
      totalCost,
      grossProfit,
      margin,
    };
  });

  const formatVal = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
          Financial Statements & Reports
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Automated corporate profit and loss statement, cash flow reconciliation, and construction project profitability audit.
        </p>
      </div>

      {/* Cash Flow Reconciliation */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
        <h2 className="text-slate-200 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wallet className="h-4.5 w-4.5 text-cyan-400" />
          Cash Flow Statement Reconciliation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Opening Cash Balance</span>
            <span className="text-base font-bold text-slate-250">{formatVal(openingBalance)}</span>
          </div>
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Total Additions (Cash In)</span>
            <span className="text-base font-bold text-emerald-400">+{formatVal(totalCashIn)}</span>
          </div>
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Total Reductions (Cash Out)</span>
            <span className="text-base font-bold text-rose-455">-{formatVal(totalCashOut)}</span>
          </div>
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Closing Cash Balance</span>
            <span className="text-base font-bold text-cyan-400">{formatVal(closingBalance)}</span>
          </div>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Table */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-200 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
            Corporate Profit & Loss (P&L) Statement
          </h2>
          
          <div className="space-y-4">
            {/* Revenue Line */}
            <div className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="font-bold text-xs text-slate-300">TOTAL CASH REVENUE</span>
              <span className="font-bold text-sm text-emerald-400">+{formatVal(totalCashIn)}</span>
            </div>

            {/* Expenses List */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
              <div className="p-3 bg-slate-950/40 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Operating Cost Centers
              </div>
              <div className="divide-y divide-slate-800 text-xs">
                {plCategories.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-900/10">
                    <span className="text-slate-400">{cat.label}</span>
                    <span className="font-semibold text-rose-455">-{formatVal(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Line */}
            <div className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800 rounded-xl border-t-2 border-t-cyan-500/20">
              <div>
                <span className="font-bold text-xs text-slate-250">NET PROFIT / LOSS</span>
                <p className="text-[9px] text-slate-500 mt-0.5">Calculated: Total collections minus total spending</p>
              </div>
              <span className={`font-bold text-sm ${netProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                {formatVal(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Project Profitability Margins */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-200 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <FolderKanban className="h-4.5 w-4.5 text-blue-400" />
            Project Profitability Audit
          </h2>
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {projectReports.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No projects registered.</p>
            ) : (
              projectReports.map((report) => (
                <div key={report.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{report.code}</span>
                      <h4 className="font-bold text-slate-200 mt-0.5 truncate w-36">{report.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      report.margin >= 20 ? 'bg-emerald-500/10 text-emerald-400' :
                      report.margin >= 5 ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-rose-500/10 text-rose-455'
                    }`}>
                      {report.margin.toFixed(1)}% Margin
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/40">
                    <div className="flex justify-between">
                      <span>Collections:</span>
                      <span className="font-bold text-slate-300">{formatVal(report.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent:</span>
                      <span className="font-bold text-rose-455">{formatVal(report.totalCost)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-900">
                      <span>Return:</span>
                      <span className={`font-bold ${report.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatVal(report.grossProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
