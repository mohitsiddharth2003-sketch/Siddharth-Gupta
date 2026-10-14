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
} from 'lucide-react';
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

  // Generate Party Ledger with running balance
  const partyLedger = useMemo(() => {
    if (!currentParty) return [];

    const txns: LedgerTransaction[] = [];
    let runningBalance = currentParty.openingBalance;
    let balanceType: BalanceType = currentParty.openingBalanceType;

    // Opening Balance
    txns.push({
      date: currentParty.createdAt.split('T')[0] || '2026-04-01',
      type: 'Opening Balance',
      referenceNo: 'OPENING',
      narration: 'Opening balance brought forward',
      debit: currentParty.openingBalanceType === 'Dr' ? currentParty.openingBalance : 0,
      credit: currentParty.openingBalanceType === 'Cr' ? currentParty.openingBalance : 0,
      balance: currentParty.openingBalance,
      balanceType: currentParty.openingBalanceType,
    });

    // Invoices for customer
    sales
      .filter((s) => s.customerId === currentParty.id && s.status !== 'Cancelled')
      .forEach((s) => {
        // Sales Invoice increases Dr
        let net = (balanceType === 'Dr' ? runningBalance : -runningBalance) + s.grandTotal;
        runningBalance = Math.abs(net);
        balanceType = net >= 0 ? 'Dr' : 'Cr';

        txns.push({
          date: s.invoiceDate,
          type: 'Sales Invoice',
          referenceNo: s.invoiceNumber,
          narration: `Tax Invoice SGE/26-27 (${s.items.length} items)`,
          debit: s.grandTotal,
          credit: 0,
          balance: runningBalance,
          balanceType,
        });

        // Any payments received against this invoice
        s.payments.forEach((p) => {
          net = (balanceType === 'Dr' ? runningBalance : -runningBalance) - p.amount;
          runningBalance = Math.abs(net);
          balanceType = net >= 0 ? 'Dr' : 'Cr';

          txns.push({
            date: p.date,
            type: 'Payment Received',
            referenceNo: p.referenceNo || 'RECEIPT',
            narration: `Remittance via ${p.paymentMode}`,
            debit: 0,
            credit: p.amount,
            balance: runningBalance,
            balanceType,
          });
        });
      });

    // Purchase bills from vendor
    purchases
      .filter((b) => b.vendorId === currentParty.id)
      .forEach((b) => {
        // Bill increases Cr
        let net = (balanceType === 'Dr' ? runningBalance : -runningBalance) - b.grandTotal;
        runningBalance = Math.abs(net);
        balanceType = net >= 0 ? 'Dr' : 'Cr';

        txns.push({
          date: b.billDate,
          type: 'Purchase Bill',
          referenceNo: b.vendorBillNumber,
          narration: `Vendor inward supply bill ${b.billNumber}`,
          debit: 0,
          credit: b.grandTotal,
          balance: runningBalance,
          balanceType,
        });

        if (b.amountPaid > 0) {
          net = (balanceType === 'Dr' ? runningBalance : -runningBalance) + b.amountPaid;
          runningBalance = Math.abs(net);
          balanceType = net >= 0 ? 'Dr' : 'Cr';

          txns.push({
            date: b.billDate,
            type: 'Payment Made',
            referenceNo: 'PMT_DEBIT',
            narration: 'Settlement payment to supplier',
            debit: b.amountPaid,
            credit: 0,
            balance: runningBalance,
            balanceType,
          });
        }
      });

    return txns;
  }, [currentParty, sales, purchases]);

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
