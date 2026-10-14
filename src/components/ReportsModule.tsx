import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  PieChart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from 'lucide-react';
import {
  SalesInvoice,
  PurchaseBill,
  Expense,
  Party,
  CompanyProfile,
  Language,
} from '../types/accounting';
import { formatINR } from '../utils/indianFormatters';
import { translations } from '../utils/translations';

interface ReportsModuleProps {
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  parties: Party[];
  company: CompanyProfile;
  language: Language;
}

type ReportType = 'sales' | 'purchases' | 'expenses' | 'ageing' | 'mis';

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  sales,
  purchases,
  expenses,
  parties,
  company,
  language,
}) => {
  const t = translations[language];

  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2027-03-31');

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => s.invoiceDate >= fromDate && s.invoiceDate <= toDate);
  }, [sales, fromDate, toDate]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => p.billDate >= fromDate && p.billDate <= toDate);
  }, [purchases, fromDate, toDate]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => e.date >= fromDate && e.date <= toDate);
  }, [expenses, fromDate, toDate]);

  // Ageing calculation for Debtors (Receivables)
  const debtorsAgeing = useMemo(() => {
    const today = new Date('2026-04-14').getTime(); // simulated current date

    const buckets = {
      days0to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
      total: 0,
    };

    const details: {
      customerName: string;
      invoiceNo: string;
      invoiceDate: string;
      dueDate: string;
      daysOverdue: number;
      amountDue: number;
      bucket: string;
    }[] = [];

    sales
      .filter((s) => s.balanceDue > 0 && s.status !== 'Cancelled')
      .forEach((s) => {
        const invTime = new Date(s.invoiceDate).getTime();
        const diffDays = Math.max(0, Math.floor((today - invTime) / (1000 * 3600 * 24)));
        const due = s.balanceDue;

        let bucket = '0-30 Days';
        if (diffDays <= 30) {
          buckets.days0to30 += due;
        } else if (diffDays <= 60) {
          buckets.days31to60 += due;
          bucket = '31-60 Days';
        } else if (diffDays <= 90) {
          buckets.days61to90 += due;
          bucket = '61-90 Days';
        } else {
          buckets.days90plus += due;
          bucket = '90+ Days';
        }
        buckets.total += due;

        details.push({
          customerName: s.customerName,
          invoiceNo: s.invoiceNumber,
          invoiceDate: s.invoiceDate,
          dueDate: s.dueDate,
          daysOverdue: diffDays,
          amountDue: due,
          bucket,
        });
      });

    return { buckets, details };
  }, [sales]);

  // Monthly MIS metrics
  const misData = useMemo(() => {
    const totalSalesTaxable = filteredSales
      .filter((s) => s.status !== 'Cancelled')
      .reduce((acc, curr) => acc + curr.totalTaxable, 0);

    const totalPurchasesTaxable = filteredPurchases.reduce(
      (acc, curr) => acc + curr.totalTaxable,
      0
    );

    const grossMargin = totalSalesTaxable - totalPurchasesTaxable;
    const grossMarginPct =
      totalSalesTaxable > 0 ? (grossMargin / totalSalesTaxable) * 100 : 0;

    const operatingOverheads = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const estimatedEbitda = grossMargin - operatingOverheads;

    // Top Customers
    const customerMap: Record<string, number> = {};
    filteredSales.forEach((s) => {
      customerMap[s.customerName] = (customerMap[s.customerName] || 0) + s.grandTotal;
    });
    const topCustomers = Object.entries(customerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top Expenses
    const expenseMap: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      expenseMap[e.category] = (expenseMap[e.category] || 0) + e.totalAmount;
    });
    const topExpenses = Object.entries(expenseMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalSalesTaxable,
      totalPurchasesTaxable,
      grossMargin,
      grossMarginPct,
      operatingOverheads,
      estimatedEbitda,
      topCustomers,
      topExpenses,
    };
  }, [filteredSales, filteredPurchases, filteredExpenses]);

  // Export current report CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `Report_${activeReport}.csv`;

    if (activeReport === 'sales') {
      headers = ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Taxable (₹)', 'CGST', 'SGST', 'IGST', 'Grand Total', 'Status'];
      rows = filteredSales.map((s) => [
        `"${s.invoiceNumber}"`,
        `"${s.invoiceDate}"`,
        `"${s.customerName}"`,
        `"${s.customerGstin || ''}"`,
        s.totalTaxable,
        s.cgstTotal,
        s.sgstTotal,
        s.igstTotal,
        s.grandTotal,
        `"${s.status}"`,
      ]);
    } else if (activeReport === 'purchases') {
      headers = ['Bill Ref', 'Supplier Bill No', 'Date', 'Supplier', 'Taxable (₹)', 'Input GST', 'Total (₹)', 'ITC'];
      rows = filteredPurchases.map((p) => [
        `"${p.billNumber}"`,
        `"${p.vendorBillNumber}"`,
        `"${p.billDate}"`,
        `"${p.vendorName}"`,
        p.totalTaxable,
        p.cgstTotal + p.sgstTotal + p.igstTotal,
        p.grandTotal,
        `"${p.itcEligibility}"`,
      ]);
    } else if (activeReport === 'expenses') {
      headers = ['Voucher No', 'Date', 'Category', 'Description', 'Payment Mode', 'Taxable', 'GST', 'Total'];
      rows = filteredExpenses.map((e) => [
        `"${e.voucherNo}"`,
        `"${e.date}"`,
        `"${e.category}"`,
        `"${e.description}"`,
        `"${e.paymentMode}"`,
        e.amount,
        e.cgst + e.sgst + e.igst,
        e.totalAmount,
      ]);
    } else if (activeReport === 'ageing') {
      headers = ['Customer Name', 'Invoice No', 'Invoice Date', 'Due Date', 'Days Overdue', 'Amount Due (₹)', 'Ageing Bucket'];
      rows = debtorsAgeing.details.map((d) => [
        `"${d.customerName}"`,
        `"${d.invoiceNo}"`,
        `"${d.invoiceDate}"`,
        `"${d.dueDate}"`,
        d.daysOverdue,
        d.amountDue,
        `"${d.bucket}"`,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.reports.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Statutory registers, debt ageing schedule & executive MIS analytics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        {/* Module Sub-tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveReport('sales')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
              activeReport === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.reports.salesRegister}
          </button>
          <button
            type="button"
            onClick={() => setActiveReport('purchases')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
              activeReport === 'purchases' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.reports.purchaseRegister}
          </button>
          <button
            type="button"
            onClick={() => setActiveReport('expenses')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
              activeReport === 'expenses' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.reports.expenseReport}
          </button>
          <button
            type="button"
            onClick={() => setActiveReport('ageing')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
              activeReport === 'ageing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.reports.ageingReport}
          </button>
          <button
            type="button"
            onClick={() => setActiveReport('mis')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
              activeReport === 'mis' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.reports.monthlyMis}
          </button>
        </div>

        {/* Date pickers */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
          />
          <span className="text-slate-500 font-medium">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
          />
        </div>
      </div>

      {/* REPORT CONTENT: SALES REGISTER */}
      {activeReport === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Customer GSTIN</th>
                  <th className="py-3 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">IGST</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{s.invoiceNumber}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">{s.invoiceDate}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">
                      {s.customerName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{s.customerGstin || 'URP'}</td>
                    <td className="py-2.5 px-4 text-right">{formatINR(s.totalTaxable)}</td>
                    <td className="py-2.5 px-4 text-right">{formatINR(s.cgstTotal)}</td>
                    <td className="py-2.5 px-4 text-right">{formatINR(s.sgstTotal)}</td>
                    <td className="py-2.5 px-4 text-right">{formatINR(s.igstTotal)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatINR(s.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: AGEING REPORT */}
      {activeReport === 'ageing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">0 - 30 Days</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatINR(debtorsAgeing.buckets.days0to30)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">31 - 60 Days</span>
              <span className="font-mono font-bold text-amber-700 text-sm">
                {formatINR(debtorsAgeing.buckets.days31to60)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-orange-600 block">61 - 90 Days</span>
              <span className="font-mono font-bold text-orange-700 text-sm">
                {formatINR(debtorsAgeing.buckets.days61to90)}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">90+ Days (Overdue)</span>
              <span className="font-mono font-bold text-rose-700 text-sm">
                {formatINR(debtorsAgeing.buckets.days90plus)}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl text-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Receivables</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatINR(debtorsAgeing.buckets.total)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Days Overdue</th>
                  <th className="py-3 px-4 text-center">Ageing Bracket</th>
                  <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {debtorsAgeing.details.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{d.customerName}</td>
                    <td className="py-2.5 px-4 font-mono text-indigo-700">{d.invoiceNo}</td>
                    <td className="py-2.5 px-4 text-slate-600">{d.invoiceDate}</td>
                    <td className="py-2.5 px-4 text-slate-600">{d.dueDate}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-600">
                      {d.daysOverdue} days
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {d.bucket}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(d.amountDue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: MONTHLY MIS */}
      {activeReport === 'mis' && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Taxable Sales Revenue
              </span>
              <div className="text-xl font-bold font-mono text-slate-900">
                {formatINR(misData.totalSalesTaxable)}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Direct Cost of Purchases
              </span>
              <div className="text-xl font-bold font-mono text-slate-900">
                {formatINR(misData.totalPurchasesTaxable)}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Gross Margin</span>
              <div className="text-xl font-bold font-mono text-emerald-700">
                {formatINR(misData.grossMargin)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {misData.grossMarginPct.toFixed(1)}% Margin
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Estimated EBITDA
              </span>
              <div className="text-xl font-bold font-mono text-indigo-700">
                {formatINR(misData.estimatedEbitda)}
              </div>
            </div>
          </div>

          {/* Top Customers & Top Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Top Customers by Revenue</h3>
              <div className="space-y-2.5 text-xs">
                {misData.topCustomers.map(([cust, rev]) => (
                  <div key={cust} className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">{cust}</span>
                    <span className="font-mono font-bold text-emerald-700">{formatINR(rev)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Top Expenses by Category</h3>
              <div className="space-y-2.5 text-xs">
                {misData.topExpenses.map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-mono font-bold text-rose-600">{formatINR(amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
