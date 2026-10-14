import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Link2,
  Unlink,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  X,
  FileText,
  CopyCheck,
  Scale,
} from 'lucide-react';
import {
  BankStatementItem,
  SalesInvoice,
  PurchaseBill,
  Expense,
  CompanyProfile,
  Language,
} from '../types/accounting';
import { formatINR } from '../utils/indianFormatters';
import { translations } from '../utils/translations';

interface BankReconciliationModuleProps {
  bankItems: BankStatementItem[];
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  company: CompanyProfile;
  language: Language;
  onMatch: (bankItemId: string, bookEntryId: string, entryType: 'Sale' | 'Purchase' | 'Expense' | 'Journal') => void;
  onUnmatch: (bankItemId: string) => void;
  onSaveBankItems: (items: BankStatementItem[]) => void;
}

export const BankReconciliationModule: React.FC<BankReconciliationModuleProps> = ({
  bankItems,
  sales,
  purchases,
  expenses,
  company,
  language,
  onMatch,
  onUnmatch,
  onSaveBankItems,
}) => {
  const t = translations[language];

  const [activeFilter, setActiveFilter] = useState<'all' | 'unmatched' | 'matched' | 'duplicates'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingBankItem, setMatchingBankItem] = useState<BankStatementItem | null>(null);

  // CSV Import Modal & State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);
  const [parsedImportItems, setParsedImportItems] = useState<{
    item: BankStatementItem;
    isDuplicate: boolean;
  }[]>([]);
  const [csvError, setCsvError] = useState('');

  // Opening passbook balance
  const openingPassbookBalance = 500000;

  // Total deposits and withdrawals in bank statement
  const totalDeposits = useMemo(() => {
    return bankItems.reduce((acc, curr) => acc + curr.deposit, 0);
  }, [bankItems]);

  const totalWithdrawals = useMemo(() => {
    return bankItems.reduce((acc, curr) => acc + curr.withdrawal, 0);
  }, [bankItems]);

  // Closing Passbook Balance formula: Opening + Deposits - Withdrawals
  const calculatedClosingPassbook = openingPassbookBalance + totalDeposits - totalWithdrawals;

  // Book Balance from General Ledger:
  // Opening capital (500000) + collections from sales - disbursements (purchases paid + expenses)
  const totalCashCollected = sales.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalCashDisbursed =
    purchases.reduce((acc, curr) => acc + curr.amountPaid, 0) +
    expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const bookBalance = 500000 + totalCashCollected - totalCashDisbursed;

  // Detect duplicate entries within current statement
  const duplicateIds = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();

    bankItems.forEach((item) => {
      const key = `${item.date}_${item.withdrawal || item.deposit}_${(item.refOrChequeNo || '').trim().toLowerCase()}`;
      if (seen.has(key)) {
        dupes.add(item.id);
      } else {
        seen.add(key);
      }
    });

    return dupes;
  }, [bankItems]);

  // Matched / Unmatched lists
  const matchedItems = useMemo(() => bankItems.filter((i) => i.matched), [bankItems]);
  const unmatchedItems = useMemo(() => bankItems.filter((i) => !i.matched), [bankItems]);

  // Difference
  const diff = calculatedClosingPassbook - bookBalance;

  // Normalize date helper
  const normalizeDate = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return new Date().toISOString().split('T')[0];

    // Check DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }

    // Check YYYY-MM-DD
    const yyyymmdd = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return trimmed;
  };

  // Safe Amount Parser (Handles negative numbers, currency symbols, commas)
  const parseAmountNumber = (val: string | undefined): number => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Real CSV text parser
  const handleParseCSV = (csvText: string) => {
    setCsvError('');
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setCsvError('CSV file must have a header row and at least one transaction row.');
        return;
      }

      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

      // Find column indices
      const dateIdx = headers.findIndex((h) => h.includes('date'));
      const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('narration') || h.includes('particular'));
      const refIdx = headers.findIndex((h) => h.includes('ref') || h.includes('cheque') || h.includes('chq') || h.includes('utr'));
      const withdrawalIdx = headers.findIndex((h) => h.includes('dr') || h.includes('withdrawal') || h.includes('debit'));
      const depositIdx = headers.findIndex((h) => h.includes('cr') || h.includes('deposit') || h.includes('credit'));
      const amountIdx = headers.findIndex((h) => h.includes('amount'));
      const balanceIdx = headers.findIndex((h) => h.includes('balance'));

      const parsed: { item: BankStatementItem; isDuplicate: boolean }[] = [];
      let runningBal = calculatedClosingPassbook;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple CSV splitter respecting quotes
        const cols: string[] = [];
        let inQuotes = false;
        let cur = '';
        for (let c = 0; c < line.length; c++) {
          const ch = line[c];
          if (ch === '"') inQuotes = !inQuotes;
          else if (ch === ',' && !inQuotes) {
            cols.push(cur.trim().replace(/^"|"$/g, ''));
            cur = '';
          } else {
            cur += ch;
          }
        }
        cols.push(cur.trim().replace(/^"|"$/g, ''));

        const date = dateIdx >= 0 ? normalizeDate(cols[dateIdx] || '') : new Date().toISOString().split('T')[0];
        const desc = descIdx >= 0 ? cols[descIdx] || 'Bank Transaction' : 'Bank Transaction';
        const ref = refIdx >= 0 ? cols[refIdx] || `REF-${i}` : `REF-${i}`;

        let withdrawal = 0;
        let deposit = 0;

        if (withdrawalIdx >= 0 && depositIdx >= 0) {
          withdrawal = Math.abs(parseAmountNumber(cols[withdrawalIdx]));
          deposit = Math.abs(parseAmountNumber(cols[depositIdx]));
        } else if (amountIdx >= 0) {
          const amt = parseAmountNumber(cols[amountIdx]);
          if (amt < 0) {
            withdrawal = Math.abs(amt);
          } else {
            deposit = amt;
          }
        }

        if (withdrawal === 0 && deposit === 0) continue;

        runningBal = runningBal + deposit - withdrawal;
        const bal = balanceIdx >= 0 && cols[balanceIdx] ? parseAmountNumber(cols[balanceIdx]) : runningBal;

        // Check if duplicate of an existing item in bankItems
        const isDuplicate = bankItems.some(
          (b) =>
            b.date === date &&
            (b.withdrawal === withdrawal || b.deposit === deposit) &&
            b.refOrChequeNo.trim().toLowerCase() === ref.trim().toLowerCase()
        );

        parsed.push({
          item: {
            id: `bnk_${Date.now()}_${i}`,
            date,
            description: desc,
            refOrChequeNo: ref,
            withdrawal,
            deposit,
            balance: bal,
            matched: false,
            notes: 'Imported via CSV',
          },
          isDuplicate,
        });
      }

      if (parsed.length === 0) {
        setCsvError('No valid transaction rows found in CSV. Please verify column headers.');
        return;
      }

      setParsedImportItems(parsed);
      setCsvImportModalOpen(true);
    } catch (e: any) {
      setCsvError(`Failed to parse CSV: ${e.message || 'Check CSV format'}`);
    }
  };

  // File drop/upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        handleParseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  // Commit imported transactions
  const handleConfirmImport = (skipDuplicates: boolean) => {
    const toAdd = parsedImportItems
      .filter((p) => (skipDuplicates ? !p.isDuplicate : true))
      .map((p) => p.item);

    onSaveBankItems([...bankItems, ...toAdd]);
    setCsvImportModalOpen(false);
    setParsedImportItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const sampleHeaders = 'Date,Description,ReferenceNo,Withdrawal,Deposit,Balance';
    const sampleRows = [
      '2026-04-14,"UPI-CR APEX RETAIL TECH-INV103 PART",UPI9921004,0,20000,576180',
      '2026-04-15,"CHQ 091820-TATA POWER ELECTRICITY",CHQ091820,14200,0,561980',
      '2026-04-16,"NEFT-CR MAHARASHTRA CLIENT REFUND",NEFT883912,0,5000,566980',
      '2026-04-16,"BANK CONSOLIDATED SMS CHARGES",BKCHG-APR26,177,0,566803',
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [sampleHeaders, ...sampleRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sample_HDFC_Bank_Statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto match engine
  const handleRunAutoMatch = () => {
    const updated = [...bankItems];
    let matchedCount = 0;

    updated.forEach((item) => {
      if (item.matched) return;

      // Check sales receipts for deposit matches
      if (item.deposit > 0) {
        const foundSale = sales.find(
          (s) =>
            s.amountPaid === item.deposit ||
            s.payments.some((p) => p.amount === item.deposit)
        );
        if (foundSale) {
          item.matched = true;
          item.matchedBookEntryId = foundSale.id;
          item.matchedEntryType = 'Sale';
          matchedCount++;
          return;
        }
      }

      // Check purchases and expenses for withdrawal matches
      if (item.withdrawal > 0) {
        const foundBill = purchases.find((p) => p.amountPaid === item.withdrawal);
        if (foundBill) {
          item.matched = true;
          item.matchedBookEntryId = foundBill.id;
          item.matchedEntryType = 'Purchase';
          matchedCount++;
          return;
        }

        const foundExp = expenses.find((e) => e.totalAmount === item.withdrawal);
        if (foundExp) {
          item.matched = true;
          item.matchedBookEntryId = foundExp.id;
          item.matchedEntryType = 'Expense';
          matchedCount++;
          return;
        }
      }
    });

    onSaveBankItems(updated);
  };

  // Filtered bank list
  const filteredList = useMemo(() => {
    return bankItems.filter((item) => {
      const matchSearch =
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.refOrChequeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.withdrawal || item.deposit).includes(searchTerm);

      let matchFilter = true;
      if (activeFilter === 'unmatched') matchFilter = !item.matched;
      if (activeFilter === 'matched') matchFilter = item.matched;
      if (activeFilter === 'duplicates') matchFilter = duplicateIds.has(item.id);

      return matchSearch && matchFilter;
    });
  }, [bankItems, searchTerm, activeFilter, duplicateIds]);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.brs.title}
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-100 text-blue-800">
              {company.bankName} - A/c {company.bankAccountNo.slice(-4)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t.brs.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Sample CSV */}
          <button
            type="button"
            onClick={handleDownloadSampleCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Bank CSV</span>
          </button>

          {/* Upload CSV */}
          <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Bank CSV</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Auto Match Engine */}
          <button
            type="button"
            onClick={handleRunAutoMatch}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.brs.autoMatch}</span>
          </button>
        </div>
      </div>

      {/* CSV Parsing Error Banner */}
      {csvError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{csvError}</span>
        </div>
      )}

      {/* BRS STATUTORY RECONCILIATION SUMMARY */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center space-x-2">
          <Scale className="w-4 h-4 text-blue-600" />
          <span>Bank Reconciliation Statement (BRS Schedule)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Proof of reconciliation between Bank Passbook balance and General Ledger balance
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-sans">Opening Bank Balance:</span>
            <span className="font-bold text-slate-800 text-base">{formatINR(openingPassbookBalance)}</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">As on 01/04/2026</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-sans">Total Deposits (+):</span>
            <span className="font-bold text-emerald-700 text-base">{formatINR(totalDeposits)}</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">Inward credits</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-sans">Total Withdrawals (-):</span>
            <span className="font-bold text-rose-600 text-base">{formatINR(totalWithdrawals)}</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">Disbursements & charges</span>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
            <span className="text-blue-900 block text-[11px] font-sans font-bold">Closing Passbook Balance:</span>
            <span className="font-bold text-blue-800 text-base">{formatINR(calculatedClosingPassbook)}</span>
            <span className="text-[10px] text-blue-600 block font-sans mt-0.5">Passbook closing</span>
          </div>
        </div>

        {/* Ledger Balance vs Reconciled Difference */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-slate-500 block text-[11px]">General Ledger (Books) Balance:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{formatINR(bookBalance)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Reconciliation Difference:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  diff === 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {formatINR(diff)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Reconciliation Health:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {matchedItems.length} Matched
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {unmatchedItems.length} Unmatched
            </span>
            {duplicateIds.size > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                {duplicateIds.size} Duplicate Alerts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search narration, cheque/ref no, amount..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All ({bankItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unmatched')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'unmatched' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Unmatched ({unmatchedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('matched')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'matched' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Reconciled ({matchedItems.length})
          </button>
          {duplicateIds.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('duplicates')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'duplicates' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600'
              }`}
            >
              Duplicates ({duplicateIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4">Bank Narration / Description</th>
                <th className="py-3 px-4">Cheque / Ref No.</th>
                <th className="py-3 px-4 text-right">Withdrawal (Dr)</th>
                <th className="py-3 px-4 text-right">Deposit (Cr)</th>
                <th className="py-3 px-4 text-right">Passbook Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Match Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isDupe = duplicateIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isDupe ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-600 font-mono">{item.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                          <span>{item.description}</span>
                          {isDupe && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                              Duplicate Entry
                            </span>
                          )}
                        </div>
                        {item.notes && <div className="text-[11px] text-slate-400">{item.notes}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {item.refOrChequeNo || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 font-semibold">
                        {item.withdrawal > 0 ? formatINR(item.withdrawal) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {item.deposit > 0 ? formatINR(item.deposit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatINR(item.balance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.matched ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Matched</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Unmatched</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.matched ? (
                          <button
                            type="button"
                            onClick={() => onUnmatch(item.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>Unlink</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMatchingBankItem(item)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Match Entry</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV IMPORT PREVIEW & DUPLICATE REVIEW MODAL */}
      {csvImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  CSV Bank Statement Import Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Parsed {parsedImportItems.length} transactions from bank feed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCsvImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {parsedImportItems.some((p) => p.isDuplicate) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CopyCheck className="w-4 h-4 text-amber-600" />
                    <span>
                      {parsedImportItems.filter((p) => p.isDuplicate).length} potential duplicate transactions detected.
                    </span>
                  </div>
                </div>
              )}

              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Ref</th>
                    <th className="py-2 px-3 text-right">Dr / Cr</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {parsedImportItems.map((p, i) => (
                    <tr key={i} className={p.isDuplicate ? 'bg-amber-50/50' : ''}>
                      <td className="py-2 px-3">{p.item.date}</td>
                      <td className="py-2 px-3 font-sans truncate max-w-xs">{p.item.description}</td>
                      <td className="py-2 px-3 text-slate-500">{p.item.refOrChequeNo}</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {p.item.deposit > 0 ? (
                          <span className="text-emerald-600">+{formatINR(p.item.deposit)}</span>
                        ) : (
                          <span className="text-rose-600">-{formatINR(p.item.withdrawal)}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {p.isDuplicate ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Duplicate
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCsvImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                {parsedImportItems.some((p) => p.isDuplicate) && (
                  <button
                    type="button"
                    onClick={() => handleConfirmImport(true)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-800 bg-amber-100 hover:bg-amber-200"
                  >
                    Skip Duplicates & Import ({parsedImportItems.filter((p) => !p.isDuplicate).length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleConfirmImport(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
                >
                  Import All ({parsedImportItems.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MATCH MODAL */}
      {matchingBankItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Match Bank Entry: {matchingBankItem.description}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Amount: {formatINR(matchingBankItem.deposit || matchingBankItem.withdrawal)} (
                  {matchingBankItem.deposit > 0 ? 'Credit / Deposit' : 'Debit / Withdrawal'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMatchingBankItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
              <span className="font-semibold text-slate-700 block">
                Select Book Entry to Pair:
              </span>

              {/* Show Candidate Invoices for Deposits */}
              {matchingBankItem.deposit > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Candidate Sales Invoices
                  </span>
                  {sales.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onMatch(matchingBankItem.id, s.id, 'Sale');
                        setMatchingBankItem(null);
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{s.invoiceNumber}</div>
                        <div className="text-slate-500">{s.customerName}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-900">{formatINR(s.grandTotal)}</div>
                        <div className="text-[11px] text-emerald-600">Paid: {formatINR(s.amountPaid)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show Candidate Purchases/Expenses for Withdrawals */}
              {matchingBankItem.withdrawal > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Candidate Purchases & Expenses
                  </span>
                  {purchases.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onMatch(matchingBankItem.id, p.id, 'Purchase');
                        setMatchingBankItem(null);
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.vendorBillNumber}</div>
                        <div className="text-slate-500">{p.vendorName}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {formatINR(p.grandTotal)}
                      </div>
                    </div>
                  ))}

                  {expenses.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => {
                        onMatch(matchingBankItem.id, e.id, 'Expense');
                        setMatchingBankItem(null);
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{e.voucherNo}</div>
                        <div className="text-slate-500">{e.description}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {formatINR(e.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setMatchingBankItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
