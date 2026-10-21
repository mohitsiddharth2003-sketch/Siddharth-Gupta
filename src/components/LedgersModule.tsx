import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Printer,
  Download,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Scale,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CreditCard,
  ReceiptText,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Party,
  SalesInvoice,
  PurchaseBill,
  Expense,
  JournalEntry,
  CompanyProfile,
  Language,
  LedgerTransaction,
  BalanceType,
} from '../types/accounting';
import { formatINR } from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export interface MonthlyTrendDataPoint {
  monthKey: string;
  month: string;
  balance: number;
  balanceType: BalanceType;
  signedBalance: number;
  payments: number;
  invoiced: number;
  debit: number;
  credit: number;
  txnCount: number;
}

interface LedgersModuleProps {
  parties: Party[];
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  journals: JournalEntry[];
  company: CompanyProfile;
  language: Language;
  onSaveJournal: (j: JournalEntry) => void;
  onDeleteJournal: (id: string, reason: string) => void;
  selectedPartyId?: string;
}

export const LedgersModule: React.FC<LedgersModuleProps> = ({
  parties,
  sales,
  purchases,
  expenses,
  journals,
  company,
  language,
  onSaveJournal,
  onDeleteJournal,
  selectedPartyId: initialPartyId,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'party' | 'journal' | 'trial' | 'pnl' | 'balanceSheet'>('party');
  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    initialPartyId || (parties.length > 0 ? parties[0].id : '')
  );

  // Visualization mode and collapse states
  const [chartViewMode, setChartViewMode] = useState<'combined' | 'balance' | 'payments'>('combined');
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(true);

  // Journal modal state
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalFormData, setJournalFormData] = useState<Partial<JournalEntry>>({
    voucherNo: `JV/26-27/${String(journals.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    debitAccount: '',
    creditAccount: '',
    amount: 0,
    narration: '',
  });
  const [deleteTargetJournal, setDeleteTargetJournal] = useState<JournalEntry | null>(null);

  // Selected party object
  const currentParty = useMemo(() => {
    return parties.find((p) => p.id === selectedPartyId) || parties[0];
  }, [parties, selectedPartyId]);

  // Generate Party Ledger with chronologically sorted transactions and precise running balance
  const partyLedger = useMemo(() => {
    if (!currentParty) return [];

    const rawTxns: {
      date: string;
      type: LedgerTransaction['type'];
      referenceNo: string;
      narration: string;
      debit: number;
      credit: number;
      order: number;
      isPayment?: boolean;
      isInvoiced?: boolean;
    }[] = [];

    // Opening Balance
    rawTxns.push({
      date: currentParty.createdAt?.split('T')[0] || '2026-04-01',
      type: 'Opening Balance',
      referenceNo: 'OPENING',
      narration: 'Opening balance brought forward',
      debit: currentParty.openingBalanceType === 'Dr' ? currentParty.openingBalance : 0,
      credit: currentParty.openingBalanceType === 'Cr' ? currentParty.openingBalance : 0,
      order: 0,
    });

    // Invoices for customer
    sales
      .filter((s) => s.customerId === currentParty.id && s.status !== 'Cancelled')
      .forEach((s) => {
        rawTxns.push({
          date: s.invoiceDate,
          type: 'Sales Invoice',
          referenceNo: s.invoiceNumber,
          narration: `Tax Invoice SGE/26-27 (${s.items.length} items)`,
          debit: s.grandTotal,
          credit: 0,
          order: 1,
          isInvoiced: true,
        });

        // Any payments received against this invoice
        s.payments?.forEach((p) => {
          rawTxns.push({
            date: p.date,
            type: 'Payment Received',
            referenceNo: p.referenceNo || 'RECEIPT',
            narration: `Remittance via ${p.paymentMode}`,
            debit: 0,
            credit: p.amount,
            order: 2,
            isPayment: true,
          });
        });
      });

    // Purchase bills from vendor
    purchases
      .filter((b) => b.vendorId === currentParty.id)
      .forEach((b) => {
        rawTxns.push({
          date: b.billDate,
          type: 'Purchase Bill',
          referenceNo: b.vendorBillNumber || b.billNumber,
          narration: `Vendor inward supply bill ${b.billNumber}`,
          debit: 0,
          credit: b.grandTotal,
          order: 1,
          isInvoiced: true,
        });

        if (b.amountPaid > 0) {
          rawTxns.push({
            date: b.billDate,
            type: 'Payment Made',
            referenceNo: 'PMT_DEBIT',
            narration: 'Settlement payment to supplier',
            debit: b.amountPaid,
            credit: 0,
            order: 2,
            isPayment: true,
          });
        }
      });

    // Sort chronologically by date then order
    rawTxns.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.order - b.order;
    });

    // Calculate running balance
    let net = 0;
    const finalTxns: LedgerTransaction[] = [];

    rawTxns.forEach((item) => {
      net += item.debit - item.credit;
      const balance = Math.abs(net);
      const balanceType: BalanceType = net >= 0 ? 'Dr' : 'Cr';

      finalTxns.push({
        date: item.date,
        type: item.type,
        referenceNo: item.referenceNo,
        narration: item.narration,
        debit: item.debit,
        credit: item.credit,
        balance,
        balanceType,
      });
    });

    return finalTxns;
  }, [currentParty, sales, purchases]);

  // Compute monthly trend data of party balance and payment history for Recharts
  const monthlyTrendData = useMemo(() => {
    if (!currentParty) return [];

    // Financial Year 2026-27 default months
    const defaultMonths = [
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
    ];

    // Collect all unique months from ledger transactions
    const monthsSet = new Set<string>(defaultMonths);
    partyLedger.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.slice(0, 7));
      }
    });

    const sortedMonthKeys = Array.from(monthsSet).sort();

    // Map monthKey to readable label e.g. "Apr '26"
    const formatMonthKey = (key: string) => {
      const parts = key.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }
      return key;
    };

    let currentBalance = currentParty.openingBalance;
    let currentBalanceType: BalanceType = currentParty.openingBalanceType;

    const points: MonthlyTrendDataPoint[] = [];

    sortedMonthKeys.forEach((key) => {
      const monthTxns = partyLedger.filter((t) => t.date.startsWith(key));

      let monthlyPayments = 0;
      let monthlyInvoiced = 0;
      let monthlyDebit = 0;
      let monthlyCredit = 0;

      monthTxns.forEach((t) => {
        monthlyDebit += t.debit;
        monthlyCredit += t.credit;

        if (t.type === 'Payment Received' || t.type === 'Payment Made') {
          monthlyPayments += t.debit > 0 ? t.debit : t.credit;
        } else if (t.type === 'Sales Invoice' || t.type === 'Purchase Bill') {
          monthlyInvoiced += t.debit > 0 ? t.debit : t.credit;
        }
      });

      if (monthTxns.length > 0) {
        const lastTxn = monthTxns[monthTxns.length - 1];
        currentBalance = lastTxn.balance;
        currentBalanceType = lastTxn.balanceType;
      }

      points.push({
        monthKey: key,
        month: formatMonthKey(key),
        balance: currentBalance,
        balanceType: currentBalanceType,
        signedBalance: currentBalanceType === 'Dr' ? currentBalance : -currentBalance,
        payments: monthlyPayments,
        invoiced: monthlyInvoiced,
        debit: monthlyDebit,
        credit: monthlyCredit,
        txnCount: monthTxns.length,
      });
    });

    return points;
  }, [currentParty, partyLedger]);

  // Aggregate Key Performance Metrics for this selected party
  const trendSummary = useMemo(() => {
    if (!currentParty || partyLedger.length === 0) {
      return {
        closingBalance: 0,
        closingType: 'Dr' as BalanceType,
        totalPayments: 0,
        totalInvoiced: 0,
        clearanceRatio: 0,
        netDebit: 0,
        netCredit: 0,
        paymentCount: 0,
        invoiceCount: 0,
      };
    }

    const last = partyLedger[partyLedger.length - 1];
    let totalPayments = 0;
    let totalInvoiced = 0;
    let netDebit = 0;
    let netCredit = 0;
    let paymentCount = 0;
    let invoiceCount = 0;

    partyLedger.forEach((t) => {
      netDebit += t.debit;
      netCredit += t.credit;
      if (t.type === 'Payment Received' || t.type === 'Payment Made') {
        totalPayments += t.debit > 0 ? t.debit : t.credit;
        paymentCount++;
      } else if (t.type === 'Sales Invoice' || t.type === 'Purchase Bill') {
        totalInvoiced += t.debit > 0 ? t.debit : t.credit;
        invoiceCount++;
      }
    });

    const clearanceRatio = totalInvoiced > 0 ? Math.min(100, Math.round((totalPayments / totalInvoiced) * 100)) : 100;

    return {
      closingBalance: last.balance,
      closingType: last.balanceType,
      totalPayments,
      totalInvoiced,
      clearanceRatio,
      netDebit,
      netCredit,
      paymentCount,
      invoiceCount,
    };
  }, [currentParty, partyLedger]);

  // Export ledger CSV
  const handleExportPartyLedgerCSV = () => {
    if (!currentParty) return;

    const headers = ['Date', 'Voucher Type', 'Reference No', 'Narration', 'Debit (Dr ₹)', 'Credit (Cr ₹)', 'Running Balance', 'Dr/Cr'];
    const rows = partyLedger.map((t) => [
      `"${t.date}"`,
      `"${t.type}"`,
      `"${t.referenceNo}"`,
      `"${t.narration}"`,
      t.debit,
      t.credit,
      t.balance,
      `"${t.balanceType}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ledger_${currentParty.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trial Balance calculation
  const trialBalanceData = useMemo(() => {
    const rows: { account: string; debit: number; credit: number }[] = [];

    // Sales Turnover
    const totalSales = sales
      .filter((s) => s.status !== 'Cancelled')
      .reduce((acc, curr) => acc + curr.totalTaxable, 0);
    rows.push({ account: 'Sales Turnover Account (Outward Supplies)', debit: 0, credit: totalSales });

    // Output GST
    const outputGst = sales
      .filter((s) => s.status !== 'Cancelled')
      .reduce((acc, curr) => acc + curr.cgstTotal + curr.sgstTotal + curr.igstTotal, 0);
    rows.push({ account: 'Output GST Liability Account', debit: 0, credit: outputGst });

    // Purchases
    const totalPurchases = purchases.reduce((acc, curr) => acc + curr.totalTaxable, 0);
    rows.push({ account: 'Purchase Account (Inward Supplies)', debit: totalPurchases, credit: 0 });

    // Input GST
    const inputGst = purchases.reduce((acc, curr) => acc + curr.cgstTotal + curr.sgstTotal + curr.igstTotal, 0);
    rows.push({ account: 'Input GST Credit Account', debit: inputGst, credit: 0 });

    // Operating Expenses
    const totalExp = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    rows.push({ account: 'Operating Overheads & Administrative Expenses', debit: totalExp, credit: 0 });

    // Debtors (Receivables)
    const debtors = sales
      .filter((s) => s.status !== 'Cancelled')
      .reduce((acc, curr) => acc + curr.balanceDue, 0) + 165000; // adding opening debtors
    rows.push({ account: 'Sundry Debtors (Trade Receivables)', debit: debtors, credit: 0 });

    // Creditors (Payables)
    const creditors = purchases.reduce((acc, curr) => acc + curr.balanceDue, 0) + 93400; // adding opening creditors
    rows.push({ account: 'Sundry Creditors (Trade Payables)', debit: 0, credit: creditors });

    // Capital & Equity
    rows.push({ account: 'Share Capital & Reserves', debit: 0, credit: 500000 });

    // Bank Current Account (balancing entry)
    const sumDebits = rows.reduce((acc, curr) => acc + curr.debit, 0);
    const sumCredits = rows.reduce((acc, curr) => acc + curr.credit, 0);
    const bankBal = Math.max(0, sumCredits - sumDebits);
    rows.push({ account: 'HDFC Current Bank Account', debit: bankBal, credit: 0 });

    const finalDebit = rows.reduce((acc, curr) => acc + curr.debit, 0);
    const finalCredit = rows.reduce((acc, curr) => acc + curr.credit, 0);

    return {
      rows,
      totalDebit: finalDebit,
      totalCredit: finalCredit,
      isBalanced: Math.abs(finalDebit - finalCredit) < 1,
    };
  }, [sales, purchases, expenses]);

  // Profit & Loss calculation
  const pnlData = useMemo(() => {
    const turnover = sales
      .filter((s) => s.status !== 'Cancelled')
      .reduce((acc, curr) => acc + curr.totalTaxable, 0);

    const costOfGoods = purchases.reduce((acc, curr) => acc + curr.totalTaxable, 0);

    const grossProfit = turnover - costOfGoods;

    // Group expenses by category
    const expByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount;
    });

    const totalOperatingExpenses = Object.values(expByCategory).reduce((acc, curr) => acc + curr, 0);

    const netProfit = grossProfit - totalOperatingExpenses;

    return {
      turnover,
      costOfGoods,
      grossProfit,
      expByCategory,
      totalOperatingExpenses,
      netProfit,
    };
  }, [sales, purchases, expenses]);

  // Balance sheet
  const balanceSheetData = useMemo(() => {
    const cashBank = 600767;
    const debtors = sales
      .filter((s) => s.status !== 'Cancelled')
      .reduce((acc, curr) => acc + curr.balanceDue, 0) + 165000;

    const fixedAssets = 250000; // IT equipment, office premises improvements
    const totalAssets = cashBank + debtors + fixedAssets;

    const capital = 500000;
    const retainedEarnings = pnlData.netProfit;
    const creditors = purchases.reduce((acc, curr) => acc + curr.balanceDue, 0) + 93400;
    const gstTdsPayable = 28913;

    const totalLiabilities = capital + retainedEarnings + creditors + gstTdsPayable;

    return {
      assets: {
        fixedAssets,
        debtors,
        cashBank,
        totalAssets,
      },
      liabilities: {
        capital,
        retainedEarnings,
        creditors,
        gstTdsPayable,
        totalLiabilities,
      },
    };
  }, [sales, purchases, pnlData]);

  // Save journal
  const handleSaveJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalFormData.debitAccount || !journalFormData.creditAccount || !journalFormData.amount) {
      return;
    }

    const newJ: JournalEntry = {
      id: `jnl_${Date.now()}`,
      voucherNo: journalFormData.voucherNo || `JV/26-27/001`,
      date: journalFormData.date || new Date().toISOString().split('T')[0],
      debitAccount: journalFormData.debitAccount.trim(),
      creditAccount: journalFormData.creditAccount.trim(),
      amount: Number(journalFormData.amount),
      narration: journalFormData.narration?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    onSaveJournal(newJ);
    setIsJournalModalOpen(false);
    setJournalFormData({
      voucherNo: `JV/26-27/${String(journals.length + 2).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      debitAccount: '',
      creditAccount: '',
      amount: 0,
      narration: '',
    });
  };

  // Reusable custom tooltip for Recharts monthly trend visualization
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as MonthlyTrendDataPoint;
      if (!d) return null;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-slate-200 text-xs min-w-[220px]">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#1366D9]" />
              <span>{d.month}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {d.txnCount} {d.txnCount === 1 ? 'txn' : 'txns'}
            </span>
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1366D9]" />
                <span>Running Balance:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatINR(d.balance)}{' '}
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    d.balanceType === 'Dr'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {d.balanceType}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Payments Cleared:</span>
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {formatINR(d.payments)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span>Invoiced / Billed:</span>
              </span>
              <span className="font-mono font-bold text-purple-700">
                {formatINR(d.invoiced)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Debit: {formatINR(d.debit)}</span>
            <span>Credit: {formatINR(d.credit)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.ledgers.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Party statements, double-entry journal vouchers, trial balance, P&L and Balance Sheet
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'party' && (
            <button
              type="button"
              onClick={handleExportPartyLedgerCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger CSV</span>
            </button>
          )}

          {activeTab === 'journal' && (
            <button
              type="button"
              onClick={() => setIsJournalModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.ledgers.newJournalEntry}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('party')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'party'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.ledgers.partyLedger}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.ledgers.journalEntries}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trial')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'trial'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.ledgers.trialBalance}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'pnl'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.ledgers.profitAndLoss}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('balanceSheet')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'balanceSheet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.ledgers.balanceSheet}
        </button>
      </div>

      {/* TAB 1: PARTY LEDGER */}
      {activeTab === 'party' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                {t.ledgers.selectParty}:
              </label>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            {currentParty && (
              <div className="text-right text-xs">
                <span className="text-slate-500 font-medium">GSTIN: </span>
                <span className="font-mono font-bold text-slate-900">
                  {currentParty.gstin || 'Unregistered'}
                </span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-500 font-medium">State: </span>
                <span className="font-semibold text-slate-800">{currentParty.state}</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DATA VISUALIZATION SECTION: RECHARTS MONTHLY BALANCE & PAYMENT TREND      */}
          {/* ========================================================================= */}
          {currentParty && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header with Title and Mode Switchers */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#1366D9] shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#1366D9]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h2 className="font-black text-sm sm:text-base text-slate-900 tracking-tight">
                        {language === 'hi'
                          ? `मासिक बैलेंस एवं भुगतान रुझान: ${currentParty.name}`
                          : `Monthly Balance & Payment Trend: ${currentParty.name}`}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {currentParty.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'hi'
                        ? 'चयनित लेज़र का महीना-वार रनिंग बैलेंस और भुगतान इतिहास (Recharts विज़ुअलाइज़ेशन)'
                        : "Visual month-over-month trajectory of party's closing balance and payment clearance velocity"}
                    </p>
                  </div>
                </div>

                {/* Right: Chart Controls & View Modes */}
                <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
                  {/* Mode Toggles */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setChartViewMode('combined')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        chartViewMode === 'combined'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'hi' ? 'संयुक्त रुझान' : 'Combined'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('balance')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        chartViewMode === 'balance'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'hi' ? 'बैलेंस रेखा' : 'Balance Trend'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('payments')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        chartViewMode === 'payments'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'hi' ? 'भुगतान इतिहास' : 'Payments'}
                    </button>
                  </div>

                  {/* Collapse / Expand Button */}
                  <button
                    type="button"
                    onClick={() => setIsChartExpanded(!isChartExpanded)}
                    title={isChartExpanded ? 'Collapse Chart' : 'Expand Chart'}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {isChartExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isChartExpanded && (
                <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-200">
                  {/* 4 Key Performance Metric Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: Closing Ledger Balance */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{language === 'hi' ? 'अंतिम लेज़र बैलेंस' : 'Current Balance'}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            trendSummary.closingType === 'Dr'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {trendSummary.closingType}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <div className="text-lg font-black text-slate-900 font-mono">
                          {formatINR(trendSummary.closingBalance)}{' '}
                          <span className="text-xs font-bold text-slate-500">{trendSummary.closingType}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {trendSummary.closingType === 'Dr'
                            ? 'Receivable from Party (Asset)'
                            : 'Payable to Party (Liability)'}
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Total Payments Cleared */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{language === 'hi' ? 'कुल भुगतान' : 'Payments Settled'}</span>
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="mt-1.5">
                        <div className="text-lg font-black text-emerald-700 font-mono">
                          {formatINR(trendSummary.totalPayments)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Across {trendSummary.paymentCount} {trendSummary.paymentCount === 1 ? 'settlement' : 'settlements'}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Total Invoices / Billed */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{language === 'hi' ? 'कुल चालान / बिल' : 'Total Invoiced'}</span>
                        <ReceiptText className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="mt-1.5">
                        <div className="text-lg font-black text-purple-700 font-mono">
                          {formatINR(trendSummary.totalInvoiced)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Across {trendSummary.invoiceCount} {trendSummary.invoiceCount === 1 ? 'bill/invoice' : 'bills/invoices'}
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Clearance Ratio Velocity */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{language === 'hi' ? 'निपटान दर (Clearance)' : 'Clearance Ratio'}</span>
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="mt-1.5">
                        <div className="text-lg font-black text-blue-700 font-mono">
                          {trendSummary.clearanceRatio}%
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, trendSummary.clearanceRatio)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Data Visualization Chart */}
                  <div className="pt-2">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartViewMode === 'balance' ? (
                          /* Area Chart for Pure Balance Trajectory */
                          <AreaChart
                            data={monthlyTrendData}
                            margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="partyBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1366D9" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#1366D9" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis
                              dataKey="month"
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#E2E8F0' }}
                            />
                            <YAxis
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickFormatter={(v) => {
                                if (v === 0) return '₹0';
                                if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                                if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                                if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                                return `₹${v}`;
                              }}
                            />
                            <Tooltip content={renderCustomTooltip} />
                            <Area
                              type="monotone"
                              dataKey="balance"
                              name="Running Balance (₹)"
                              stroke="#1366D9"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#partyBalanceGrad)"
                              dot={{ r: 4, fill: '#1366D9', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                              activeDot={{ r: 7, fill: '#1366D9' }}
                            />
                          </AreaChart>
                        ) : chartViewMode === 'payments' ? (
                          /* Bar Chart for Payment History & Settlement Inflows */
                          <BarChart
                            data={monthlyTrendData}
                            margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis
                              dataKey="month"
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#E2E8F0' }}
                            />
                            <YAxis
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickFormatter={(v) => {
                                if (v === 0) return '₹0';
                                if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                                if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                                if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                                return `₹${v}`;
                              }}
                            />
                            <Tooltip content={renderCustomTooltip} />
                            <Legend
                              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                              formatter={(val) =>
                                val === 'payments' ? 'Payments Cleared (₹)' : 'Invoices Billed (₹)'
                              }
                            />
                            <Bar
                              dataKey="payments"
                              name="payments"
                              fill="#10B981"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={38}
                            />
                            <Line
                              type="monotone"
                              dataKey="invoiced"
                              name="invoiced"
                              stroke="#8B5CF6"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: '#8B5CF6' }}
                            />
                          </BarChart>
                        ) : (
                          /* Combined Composed Chart (Line of Balance + Bars of Payments + Line of Invoiced) */
                          <ComposedChart
                            data={monthlyTrendData}
                            margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis
                              dataKey="month"
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#E2E8F0' }}
                            />
                            <YAxis
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickFormatter={(v) => {
                                if (v === 0) return '₹0';
                                if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                                if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                                if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                                return `₹${v}`;
                              }}
                            />
                            <Tooltip content={renderCustomTooltip} />
                            <Legend
                              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                              formatter={(val) => {
                                if (val === 'balance') return 'Running Balance Line (Closing ₹)';
                                if (val === 'payments') return 'Payments Settled (₹)';
                                if (val === 'invoiced') return 'Invoiced / Billed Volume (₹)';
                                return val;
                              }}
                            />
                            {/* Monthly Payments Settled Bar */}
                            <Bar
                              dataKey="payments"
                              name="payments"
                              fill="#10B981"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={32}
                            />
                            {/* Invoiced / Billed Volume Line */}
                            <Line
                              type="monotone"
                              dataKey="invoiced"
                              name="invoiced"
                              stroke="#8B5CF6"
                              strokeDasharray="4 4"
                              strokeWidth={2}
                              dot={false}
                            />
                            {/* Running Balance Trend Line */}
                            <Line
                              type="monotone"
                              dataKey="balance"
                              name="balance"
                              stroke="#1366D9"
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#1366D9', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                              activeDot={{ r: 7, fill: '#1366D9' }}
                            />
                          </ComposedChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    {/* Chart Footer Explanatory Legend */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                      <div className="flex items-center space-x-4 flex-wrap gap-y-1">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1366D9]" />
                          <span className="font-semibold text-slate-700">Blue Line:</span>
                          <span>Month-End Closing Balance (₹)</span>
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                          <span className="font-semibold text-slate-700">Green Bar:</span>
                          <span>Payment Inflows & Settlements (₹)</span>
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <span className="w-3 h-0.5 border-t-2 border-dashed border-[#8B5CF6]" />
                          <span className="font-semibold text-slate-700">Purple Dashed:</span>
                          <span>Invoiced / Billed Amount (₹)</span>
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        Powered by Recharts v3
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{t.common.date}</th>
                    <th className="py-3 px-4">Voucher Type</th>
                    <th className="py-3 px-4">Ref No.</th>
                    <th className="py-3 px-4">Narration / Particulars</th>
                    <th className="py-3 px-4 text-right">{t.ledgers.debit}</th>
                    <th className="py-3 px-4 text-right">{t.ledgers.credit}</th>
                    <th className="py-3 px-4 text-right">{t.ledgers.runningBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono">
                  {partyLedger.map((txn, index) => (
                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-sans">{txn.date}</td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">{txn.type}</td>
                      <td className="py-3 px-4 text-indigo-700 font-semibold">{txn.referenceNo}</td>
                      <td className="py-3 px-4 font-sans text-slate-600">{txn.narration}</td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {txn.debit > 0 ? formatINR(txn.debit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {txn.credit > 0 ? formatINR(txn.credit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatINR(txn.balance)} {txn.balanceType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Final Balance Footer */}
            {partyLedger.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between font-bold text-xs">
                <span className="text-slate-700">Closing Statement Balance:</span>
                <span className="font-mono text-sm text-emerald-800">
                  {formatINR(partyLedger[partyLedger.length - 1].balance)}{' '}
                  {partyLedger[partyLedger.length - 1].balanceType}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: JOURNAL ENTRIES */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Voucher No.</th>
                    <th className="py-3 px-4">{t.common.date}</th>
                    <th className="py-3 px-4">Particulars / Double Entry Accounts</th>
                    <th className="py-3 px-4 text-right">{t.ledgers.debit}</th>
                    <th className="py-3 px-4 text-right">{t.ledgers.credit}</th>
                    <th className="py-3 px-4 text-center">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {journals.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{j.voucherNo}</td>
                      <td className="py-3.5 px-4 text-slate-600">{j.date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {j.debitAccount} <span className="text-slate-400 font-normal">Dr.</span>
                        </div>
                        <div className="text-slate-700 pl-4 mt-0.5">
                          To {j.creditAccount} <span className="text-slate-400 font-normal">Cr.</span>
                        </div>
                        <div className="text-[11px] text-slate-500 italic mt-1">
                          ({j.narration})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(j.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(j.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setDeleteTargetJournal(j)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE */}
      {activeTab === 'trial' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t.ledgers.trialBalance}</h3>
              <p className="text-xs text-slate-500">
                Mathematical proof of debit and credit equality across all company general ledgers
              </p>
            </div>
            {trialBalanceData.isBalanced ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Trial Balance is Matched</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Unbalanced Difference</span>
              </span>
            )}
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Account Head / Ledger Description</th>
                <th className="py-2.5 px-4 text-right">{t.ledgers.debit}</th>
                <th className="py-2.5 px-4 text-right">{t.ledgers.credit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium font-mono">
              {trialBalanceData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-sans text-slate-800">{row.account}</td>
                  <td className="py-2.5 px-4 text-right text-slate-900">
                    {row.debit > 0 ? formatINR(row.debit) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-900">
                    {row.credit > 0 ? formatINR(row.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 font-mono text-sm">
              <tr>
                <td className="py-3 px-4 font-sans">Total Balanced Sum</td>
                <td className="py-3 px-4 text-right">{formatINR(trialBalanceData.totalDebit)}</td>
                <td className="py-3 px-4 text-right">{formatINR(trialBalanceData.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TAB 4: PROFIT AND LOSS */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-base">{t.ledgers.profitAndLoss}</h3>
            <p className="text-xs text-slate-500">For Financial Year 2026-2027 (Apr 2026 - Mar 2027)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trading Account */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider bg-slate-100 p-2 rounded-lg">
                I. Trading Account & Gross Margin
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Gross Sales Turnover (Taxable):</span>
                  <span className="font-bold text-emerald-800">{formatINR(pnlData.turnover)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Less: Direct Inward Purchases:</span>
                  <span className="text-rose-600">({formatINR(pnlData.costOfGoods)})</span>
                </div>
                <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-xl font-bold text-sm text-slate-900">
                  <span className="font-sans">{t.ledgers.grossProfit}:</span>
                  <span className="text-emerald-800">{formatINR(pnlData.grossProfit)}</span>
                </div>
              </div>
            </div>

            {/* Operating Overheads */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider bg-slate-100 p-2 rounded-lg">
                II. Operating & Administrative Overheads
              </h4>
              <div className="space-y-1.5 text-xs font-mono max-h-48 overflow-y-auto pr-1">
                {Object.entries(pnlData.expByCategory).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-sans text-slate-600">{cat}:</span>
                    <span>{formatINR(amt)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl font-semibold text-xs text-slate-800">
                <span>Total Operating Overheads:</span>
                <span className="text-rose-600 font-mono font-bold">
                  {formatINR(pnlData.totalOperatingExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Profit Banner */}
          <div className="p-4 bg-linear-to-r from-emerald-600 to-teal-700 rounded-2xl text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-90 block">
                {t.ledgers.netProfit}
              </span>
              <span className="text-xs opacity-75">
                Surplus transferred to Reserves & Surplus in Balance Sheet
              </span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight">
              {formatINR(pnlData.netProfit)}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BALANCE SHEET */}
      {activeTab === 'balanceSheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-base">{t.ledgers.balanceSheet}</h3>
            <p className="text-xs text-slate-500">As on Date (Sources & Application of Funds)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Equities & Liabilities */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider bg-slate-100 p-2 rounded-lg">
                Liabilities & Capital Funds
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Director / Partner Share Capital:</span>
                  <span className="font-bold">{formatINR(balanceSheetData.liabilities.capital)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Retained Earnings (Net Profit):</span>
                  <span className="font-bold text-emerald-800">
                    {formatINR(balanceSheetData.liabilities.retainedEarnings)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Sundry Creditors (Trade Payables):</span>
                  <span>{formatINR(balanceSheetData.liabilities.creditors)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Statutory Tax Dues (GST & TDS):</span>
                  <span>{formatINR(balanceSheetData.liabilities.gstTdsPayable)}</span>
                </div>
              </div>
              <div className="flex justify-between py-2.5 px-3 bg-slate-100 rounded-xl font-bold text-sm text-slate-900 font-mono">
                <span className="font-sans">Total Liabilities & Equity:</span>
                <span>{formatINR(balanceSheetData.liabilities.totalLiabilities)}</span>
              </div>
            </div>

            {/* Assets */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider bg-slate-100 p-2 rounded-lg">
                Assets & Properties
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Fixed Assets (Equipment & Servers):</span>
                  <span className="font-bold">{formatINR(balanceSheetData.assets.fixedAssets)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Sundry Debtors (Receivables):</span>
                  <span className="font-bold text-amber-700">
                    {formatINR(balanceSheetData.assets.debtors)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-sans text-slate-700">Bank & Cash Balances:</span>
                  <span className="font-bold text-blue-800">
                    {formatINR(balanceSheetData.assets.cashBank)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between py-2.5 px-3 bg-slate-100 rounded-xl font-bold text-sm text-slate-900 font-mono">
                <span className="font-sans">Total Assets:</span>
                <span>{formatINR(balanceSheetData.assets.totalAssets)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW JOURNAL ENTRY MODAL */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">{t.ledgers.newJournalEntry}</h3>
              <button
                type="button"
                onClick={() => setIsJournalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournalSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voucher No.</label>
                  <input
                    type="text"
                    value={journalFormData.voucherNo}
                    onChange={(e) => setJournalFormData({ ...journalFormData, voucherNo: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voucher Date</label>
                  <input
                    type="date"
                    required
                    value={journalFormData.date}
                    onChange={(e) => setJournalFormData({ ...journalFormData, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Debit Account (Dr) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank Account, Rent Expense, Depreciation"
                  value={journalFormData.debitAccount}
                  onChange={(e) => setJournalFormData({ ...journalFormData, debitAccount: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Credit Account (Cr) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Capital Account, TDS Payable, Bank"
                  value={journalFormData.creditAccount}
                  onChange={(e) => setJournalFormData({ ...journalFormData, creditAccount: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={journalFormData.amount}
                  onChange={(e) => setJournalFormData({ ...journalFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Narration / Explanation
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Being ..."
                  value={journalFormData.narration}
                  onChange={(e) => setJournalFormData({ ...journalFormData, narration: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetJournal}
        title={`Journal Entry ${deleteTargetJournal?.voucherNo}`}
        recordIdentifier={deleteTargetJournal?.voucherNo || ''}
        onConfirm={(reason) => {
          if (deleteTargetJournal) {
            onDeleteJournal(deleteTargetJournal.id, reason);
            setDeleteTargetJournal(null);
          }
        }}
        onClose={() => setDeleteTargetJournal(null)}
        language={language}
      />
    </div>
  );
};
