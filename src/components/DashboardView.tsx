import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ReceiptText,
  ShoppingBag,
  CreditCard,
  Users,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  Calculator,
  FileCheck2,
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import {
  SalesInvoice,
  PurchaseBill,
  Expense,
  Party,
  TDSRecord,
  Language,
} from '../types/accounting';
import { formatINR } from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { ActiveModule } from './Sidebar';

interface DashboardViewProps {
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  parties: Party[];
  tdsRecords: TDSRecord[];
  language: Language;
  onNavigate: (module: ActiveModule) => void;
  onOpenNewInvoice: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewExpense: () => void;
  onOpenNewParty: () => void;
  onResetDemo?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  purchases,
  expenses,
  parties,
  tdsRecords,
  language,
  onNavigate,
  onOpenNewInvoice,
  onOpenNewPurchase,
  onOpenNewExpense,
  onOpenNewParty,
  onResetDemo,
}) => {
  const t = translations[language];

  // Core KPI Calculations derived strictly from live saved records
  const validSales = useMemo(
    () => sales.filter((s) => s.status !== 'Cancelled'),
    [sales]
  );

  const totalSales = useMemo(
    () => validSales.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0),
    [validSales]
  );

  const totalPurchases = useMemo(
    () => purchases.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0),
    [purchases]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
    [expenses]
  );

  // Receivables from Sales (Balance Due)
  const salesReceivables = useMemo(
    () => validSales.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0),
    [validSales]
  );

  // Payables from Purchases (Balance Due)
  const purchasePayables = useMemo(
    () => purchases.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0),
    [purchases]
  );

  // Bank & Cash balance (derived from receipts + opening capital 5,00,000 minus disbursements)
  const totalCashCollected = useMemo(
    () => validSales.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0),
    [validSales]
  );
  const totalCashDisbursed = useMemo(
    () =>
      purchases.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0) + totalExpenses,
    [purchases, totalExpenses]
  );
  // Base capital ₹5,00,000 + collections - disbursements
  const currentBankBalance = useMemo(
    () => 500000 + totalCashCollected - totalCashDisbursed,
    [totalCashCollected, totalCashDisbursed]
  );

  // GST Calculations
  const outputGstTotal = useMemo(
    () =>
      validSales.reduce(
        (acc, curr) => acc + (curr.cgstTotal || 0) + (curr.sgstTotal || 0) + (curr.igstTotal || 0),
        0
      ),
    [validSales]
  );

  const inputGstTotal = useMemo(
    () =>
      purchases
        .filter((p) => p.itcEligibility === 'Eligible')
        .reduce(
          (acc, curr) =>
            acc + (curr.cgstTotal || 0) + (curr.sgstTotal || 0) + (curr.igstTotal || 0),
          0
        ) +
      expenses
        .filter((e) => e.itcClaimed)
        .reduce(
          (acc, curr) =>
            acc + (curr.cgst || 0) + (curr.sgst || 0) + (curr.igst || 0),
          0
        ),
    [purchases, expenses]
  );

  const netGstLiability = Math.max(0, outputGstTotal - inputGstTotal);

  // TDS Calculations
  const pendingTds = useMemo(
    () =>
      tdsRecords
        .filter((tds) => tds.status === 'Pending')
        .reduce((acc, curr) => acc + (curr.tdsDeducted || 0), 0),
    [tdsRecords]
  );

  const flaggedTdsCount = useMemo(
    () => tdsRecords.filter((t) => t.flagForReview).length,
    [tdsRecords]
  );

  // Dynamic Monthly Breakdown calculated directly from saved records
  const monthlyData = useMemo(() => {
    const monthKeys = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
    const monthLabels: Record<string, string> = {
      '2026-04': 'Apr 26',
      '2026-05': 'May 26',
      '2026-06': 'Jun 26',
      '2026-07': 'Jul 26',
      '2026-08': 'Aug 26',
      '2026-09': 'Sep 26',
    };

    const map: Record<string, { sales: number; purchase: number; expense: number }> = {};
    monthKeys.forEach((k) => {
      map[k] = { sales: 0, purchase: 0, expense: 0 };
    });

    validSales.forEach((s) => {
      const ym = s.invoiceDate ? s.invoiceDate.substring(0, 7) : '2026-04';
      if (map[ym]) {
        map[ym].sales += s.grandTotal || 0;
      }
    });

    purchases.forEach((p) => {
      const ym = p.billDate ? p.billDate.substring(0, 7) : '2026-04';
      if (map[ym]) {
        map[ym].purchase += p.grandTotal || 0;
      }
    });

    expenses.forEach((e) => {
      const ym = e.date ? e.date.substring(0, 7) : '2026-04';
      if (map[ym]) {
        map[ym].expense += e.totalAmount || 0;
      }
    });

    return monthKeys.map((k) => ({
      key: k,
      month: monthLabels[k] || k,
      sales: map[k].sales,
      purchase: map[k].purchase,
      expense: map[k].expense,
    }));
  }, [validSales, purchases, expenses]);

  // Max value for monthly chart scaling
  const maxMonthlyVal = useMemo(() => {
    let max = 10000;
    monthlyData.forEach((d) => {
      if (d.sales > max) max = d.sales;
      if (d.purchase > max) max = d.purchase;
      if (d.expense > max) max = d.expense;
    });
    return Math.ceil(max * 1.15);
  }, [monthlyData]);

  // Pending Invoices for Payment Reminders
  const pendingCustomerInvoices = useMemo(
    () =>
      validSales
        .filter((s) => (s.balanceDue || 0) > 0)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [validSales]
  );

  // Pending Vendor Bills
  const pendingVendorBills = useMemo(
    () =>
      purchases
        .filter((p) => (p.balanceDue || 0) > 0)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [purchases]
  );

  const hasAnyRecords = sales.length > 0 || purchases.length > 0 || expenses.length > 0;

  // Navigation items for module jump bar
  const navShortcuts: { id: ActiveModule; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: Building2 },
    { id: 'salesInvoices', label: t.nav.salesInvoices, icon: ReceiptText },
    { id: 'purchaseBills', label: t.nav.purchaseBills, icon: ShoppingBag },
    { id: 'expenses', label: t.nav.expenses, icon: CreditCard },
    { id: 'gstManager', label: t.nav.gstManager, icon: Calculator },
    { id: 'tdsManager', label: t.nav.tdsManager, icon: FileCheck2 },
    { id: 'bankReconciliation', label: t.nav.bankReconciliation, icon: Building2 },
    { id: 'ledgers', label: t.nav.ledgers, icon: BookOpen },
    { id: 'reports', label: t.nav.reports, icon: BarChart3 },
    { id: 'settings', label: t.nav.settings, icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner: Status, Demo Indicator & 4 Core Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.dashboard.title}
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800">
              FY 2026-27
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {hasAnyRecords ? 'Real Records Synced' : 'Empty State (₹0)'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* 4 Required Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Create Sales Invoice */}
          <button
            type="button"
            onClick={onOpenNewInvoice}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.dashboard.createInvoice}</span>
          </button>

          {/* 2. Add Purchase Bill */}
          <button
            type="button"
            onClick={onOpenNewPurchase}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.dashboard.recordPurchase}</span>
          </button>

          {/* 3. Add Expense */}
          <button
            type="button"
            onClick={onOpenNewExpense}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.dashboard.addExpense}</span>
          </button>

          {/* 4. Bank Reconciliation */}
          <button
            type="button"
            onClick={() => onNavigate('bankReconciliation')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.nav.bankReconciliation}</span>
          </button>

          {/* Add Party Shortcut */}
          <button
            type="button"
            onClick={onOpenNewParty}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.dashboard.addParty}</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Ribbon for Dashboard, Sales, Purchase, GST, TDS, BRS, Ledger, Reports, Settings */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
            {language === 'hi' ? 'मॉड्यूल:' : 'Jump to:'}
          </span>
          {navShortcuts.map((item) => {
            const Icon = item.icon;
            const isCurrent = item.id === 'dashboard';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main KPI Cards Grid: Total Sales, Purchases, Expenses, Receivables, Payables, Bank Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Sales */}
        <div
          onClick={() => onNavigate('salesInvoices')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.dashboard.totalSales}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {formatINR(totalSales)}
          </div>
          <div className="flex items-center text-[11px] text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>{validSales.length} Invoices</span>
          </div>
        </div>

        {/* 2. Total Purchases */}
        <div
          onClick={() => onNavigate('purchaseBills')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.dashboard.totalPurchases}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {formatINR(totalPurchases)}
          </div>
          <div className="flex items-center text-[11px] text-indigo-600 font-medium mt-1">
            <span>{purchases.length} Purchase Bills</span>
          </div>
        </div>

        {/* 3. Expenses */}
        <div
          onClick={() => onNavigate('expenses')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.dashboard.totalExpenses}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {formatINR(totalExpenses)}
          </div>
          <div className="flex items-center text-[11px] text-rose-600 font-medium mt-1">
            <span>{expenses.length} Expense Vouchers</span>
          </div>
        </div>

        {/* 4. Receivables (Sundry Debtors) */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.dashboard.receivables}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-600 tracking-tight">
            {formatINR(salesReceivables)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {language === 'hi' ? 'ग्राहकों से देय' : 'Pending from Customers'}
          </div>
        </div>

        {/* 5. Payables (Sundry Creditors) */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.dashboard.payables}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-purple-600 tracking-tight">
            {formatINR(purchasePayables)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {language === 'hi' ? 'विक्रेताओं को देय' : 'Pending to Suppliers'}
          </div>
        </div>

        {/* 6. Bank & Cash Balance */}
        <div
          onClick={() => onNavigate('bankReconciliation')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.dashboard.cashBankBalance}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-blue-700 tracking-tight">
            {formatINR(currentBankBalance)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {language === 'hi' ? 'चालू बैंक शेष' : 'HDFC Current A/c + Cash'}
          </div>
        </div>
      </div>

      {/* Informative Empty State Banner when no records exist */}
      {!hasAnyRecords && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 text-center">
          <FolderOpen className="w-10 h-10 text-amber-600 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-900">
            {language === 'hi' ? 'कोई वित्तीय प्रविष्टि उपलब्ध नहीं है' : 'No Financial Records Found for This Entity'}
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 mb-4">
            {language === 'hi'
              ? 'वर्तमान कंपनी खाते में अभी तक कोई बिक्री चालान, खरीद बिल या व्यय वाउचर दर्ज नहीं किया गया है। सभी आंकड़े ₹0 पर सेट हैं।'
              : 'All accounting registers currently reflect ₹0.00. Create your first sales invoice, inward bill or load demo verification data to begin.'}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={onOpenNewInvoice}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
            >
              + Create First Invoice
            </button>
            {onResetDemo && (
              <button
                onClick={onResetDemo}
                className="px-4 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl cursor-pointer"
              >
                Load Sample Demo Data
              </button>
            )}
          </div>
        </div>
      )}

      {/* Middle Row: Monthly Sales & Expenses Dynamic Chart + Compliance Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Monthly Trend Visualization */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                {t.dashboard.monthlyOverview}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'hi'
                  ? 'सहेजे गए वास्तविक बिलों के आधार पर मासिक टर्नओवर एवं व्यय तुलना'
                  : 'Computed dynamically from saved sales, purchases, and expense vouchers'}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-medium">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Sales</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-600">Purchases</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-60 w-full pt-4 flex flex-col justify-end">
            <div className="grid grid-cols-6 h-48 gap-2 sm:gap-4 items-end border-b border-slate-200 pb-2">
              {monthlyData.map((d, i) => {
                const salesHeight = maxMonthlyVal > 0 ? Math.min(100, (d.sales / maxMonthlyVal) * 100) : 0;
                const purcHeight = maxMonthlyVal > 0 ? Math.min(100, (d.purchase / maxMonthlyVal) * 100) : 0;
                const expHeight = maxMonthlyVal > 0 ? Math.min(100, (d.expense / maxMonthlyVal) * 100) : 0;

                return (
                  <div key={i} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end space-x-1 w-full justify-center h-full">
                      {/* Sales Bar */}
                      <div
                        style={{ height: `${Math.max(4, salesHeight)}%` }}
                        className={`w-2.5 sm:w-4 ${d.sales > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-200'} rounded-t-md transition-all relative cursor-pointer`}
                        title={`Sales (${d.month}): ${formatINR(d.sales)}`}
                      />
                      {/* Purchases Bar */}
                      <div
                        style={{ height: `${Math.max(4, purcHeight)}%` }}
                        className={`w-2.5 sm:w-4 ${d.purchase > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-200'} rounded-t-md transition-all relative cursor-pointer`}
                        title={`Purchases (${d.month}): ${formatINR(d.purchase)}`}
                      />
                      {/* Expenses Bar */}
                      <div
                        style={{ height: `${Math.max(4, expHeight)}%` }}
                        className={`w-2.5 sm:w-4 ${d.expense > 0 ? 'bg-rose-400 hover:bg-rose-500' : 'bg-slate-200'} rounded-t-md transition-all relative cursor-pointer`}
                        title={`Expenses (${d.month}): ${formatINR(d.expense)}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 mt-2">
                      {d.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 font-mono">
              <span>0% Baseline</span>
              <span>Dynamic Peak: {formatINR(maxMonthlyVal)}</span>
            </div>
          </div>
        </div>

        {/* Statutory Compliance Radar Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{t.dashboard.complianceRadar}</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                GST & TDS
              </span>
            </div>

            <div className="space-y-3">
              {/* GSTR-1 Due */}
              <div
                onClick={() => onNavigate('gstManager')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{t.dashboard.gstr1Due}</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    11th May 2026
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Outward supplies: {validSales.length} Invoices</span>
                  <span className="font-semibold text-slate-700">{formatINR(outputGstTotal)} Tax</span>
                </div>
              </div>

              {/* GSTR-3B Due */}
              <div
                onClick={() => onNavigate('gstManager')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{t.dashboard.gstr3bDue}</span>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    20th May 2026
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Net Tax Liability:</span>
                  <span className="font-bold text-amber-700">{formatINR(netGstLiability)}</span>
                </div>
              </div>

              {/* TDS Payment Due */}
              <div
                onClick={() => onNavigate('tdsManager')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{t.dashboard.tdsDepositDue}</span>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                    7th May 2026
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Pending ITNS-281:</span>
                  <span className="font-bold text-rose-600">{formatINR(pendingTds)}</span>
                </div>
              </div>

              {/* Alert if any flagged TDS items */}
              {flaggedTdsCount > 0 && (
                <div
                  onClick={() => onNavigate('tdsManager')}
                  className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center space-x-2 cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    {flaggedTdsCount} item flagged for review (Section 206AA absent PAN alert).
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            {language === 'hi'
              ? 'आधिकारिक पोर्टल gst.gov.in एवं incometax.gov.in पर नियत समय में विवरणी प्रस्तुत करें।'
              : 'Prepare returns punctually. File official tax returns directly on GST & Income Tax portals.'}
          </div>
        </div>
      </div>

      {/* Row: Pending Payment Reminders & Due Dates (Customer Receivables & Vendor Payables) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Customer Invoices (Receivables Reminders) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === 'hi' ? 'बकाया ग्राहक भुगतान स्मरण पत्र' : 'Pending Customer Payment Reminders'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              {pendingCustomerInvoices.length} Pending
            </span>
          </div>

          {pendingCustomerInvoices.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
              <span>All customer invoices are fully settled. No overdue receivables!</span>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-60 pr-1">
              {pendingCustomerInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onNavigate('salesInvoices')}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Due: {inv.dueDate}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium truncate max-w-[200px] sm:max-w-xs">
                      {inv.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-600 font-mono">
                      {formatINR(inv.balanceDue || 0)}
                    </div>
                    <span className="text-[10px] text-slate-400">Balance Due</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Vendor Bills (Payables Reminders) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {language === 'hi' ? 'विक्रेता देयता भुगतान स्मरण पत्र' : 'Upcoming Vendor Bill Commitments'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              {pendingVendorBills.length} Due
            </span>
          </div>

          {pendingVendorBills.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
              <span>No outstanding supplier balances. All vendor bills cleared.</span>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-60 pr-1">
              {pendingVendorBills.map((bill) => (
                <div
                  key={bill.id}
                  onClick={() => onNavigate('purchaseBills')}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{bill.vendorBillNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Due: {bill.dueDate}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium truncate max-w-[200px] sm:max-w-xs">
                      {bill.vendorName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-purple-600 font-mono">
                      {formatINR(bill.balanceDue || 0)}
                    </div>
                    <span className="text-[10px] text-slate-400">Payable Amount</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Sales Invoices & Quick Ledger Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-slate-900 text-base">{t.dashboard.recentTransactions}</h2>
            <span className="text-xs text-slate-500">({sales.length} Invoices on record)</span>
          </div>
          <button
            onClick={() => onNavigate('salesInvoices')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            {language === 'hi' ? 'सभी देखें →' : 'View All Invoices →'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.invoices.invoiceNo}</th>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4">{t.invoices.customer}</th>
                <th className="py-3 px-4">{t.invoices.placeOfSupply}</th>
                <th className="py-3 px-4 text-right">{t.common.taxableAmount}</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">{t.common.grandTotal}</th>
                <th className="py-3 px-4 text-center">{t.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No recent invoice transactions found. Click &quot;Create Invoice&quot; to generate your first bill.
                  </td>
                </tr>
              ) : (
                sales.slice(0, 5).map((inv) => {
                  const totalGst = (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.invoiceDate}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{inv.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inv.customerGstin || 'Unregistered'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700">{inv.placeOfSupply}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({inv.placeOfSupplyCode})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatINR(inv.totalTaxable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatINR(totalGst)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Issued'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
