import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  Building2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  SalesInvoice,
  PurchaseBill,
  Expense,
  CompanyProfile,
  Language,
} from '../types/accounting';
import { formatINR } from '../utils/indianFormatters';
import { translations } from '../utils/translations';

interface GSTManagerModuleProps {
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  company: CompanyProfile;
  language: Language;
}

export const GSTManagerModule: React.FC<GSTManagerModuleProps> = ({
  sales,
  purchases,
  expenses,
  company,
  language,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'summary' | 'gstr1' | 'gstr3b'>('summary');

  // Active non-cancelled sales
  const validSales = useMemo(() => sales.filter((s) => s.status !== 'Cancelled'), [sales]);

  // Output Tax Breakup
  const outputTax = useMemo(() => {
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    validSales.forEach((s) => {
      taxable += s.totalTaxable;
      cgst += s.cgstTotal;
      sgst += s.sgstTotal;
      igst += s.igstTotal;
    });

    return {
      taxable,
      cgst,
      sgst,
      igst,
      totalGst: cgst + sgst + igst,
    };
  }, [validSales]);

  // Input Tax Breakup (from Eligible Purchases + Expenses where ITC is claimed)
  const inputTax = useMemo(() => {
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let blockedItc = 0;

    purchases.forEach((p) => {
      if (p.itcEligibility === 'Eligible') {
        taxable += p.totalTaxable;
        cgst += p.cgstTotal;
        sgst += p.sgstTotal;
        igst += p.igstTotal;
      } else if (p.itcEligibility === 'Blocked_17_5') {
        blockedItc += p.cgstTotal + p.sgstTotal + p.igstTotal;
      }
    });

    expenses.forEach((e) => {
      if (e.itcClaimed) {
        taxable += e.amount;
        cgst += e.cgst;
        sgst += e.sgst;
        igst += e.igst;
      }
    });

    return {
      taxable,
      cgst,
      sgst,
      igst,
      totalGst: cgst + sgst + igst,
      blockedItc,
    };
  }, [purchases, expenses]);

  // Net Tax Liability
  const netLiability = useMemo(() => {
    const netCgst = Math.max(0, outputTax.cgst - inputTax.cgst);
    const netSgst = Math.max(0, outputTax.sgst - inputTax.sgst);
    const netIgst = Math.max(0, outputTax.igst - inputTax.igst);

    const excessCgst = Math.max(0, inputTax.cgst - outputTax.cgst);
    const excessSgst = Math.max(0, inputTax.sgst - outputTax.sgst);
    const excessIgst = Math.max(0, inputTax.igst - outputTax.igst);

    return {
      payableCgst: netCgst,
      payableSgst: netSgst,
      payableIgst: netIgst,
      totalPayable: netCgst + netSgst + netIgst,
      carryForwardCgst: excessCgst,
      carryForwardSgst: excessSgst,
      carryForwardIgst: excessIgst,
      totalCarryForward: excessCgst + excessSgst + excessIgst,
    };
  }, [outputTax, inputTax]);

  // GSTR-1 Buckets
  const gstr1Buckets = useMemo(() => {
    // Table 4: B2B Invoices (customer has GSTIN)
    const b2b = validSales.filter((s) => s.customerGstin && s.customerGstin.trim().length === 15);

    // Table 5: B2C Large (Unregistered or no GSTIN, inter-state > 2.5 Lakhs)
    const b2cLarge = validSales.filter(
      (s) =>
        (!s.customerGstin || s.customerGstin.trim().length !== 15) &&
        s.isInterState &&
        s.totalTaxable > 250000
    );

    // Table 7: B2C Small (Other retail or intra-state unregistered)
    const b2cSmall = validSales.filter(
      (s) =>
        (!s.customerGstin || s.customerGstin.trim().length !== 15) &&
        (!s.isInterState || s.totalTaxable <= 250000)
    );

    // Table 12: HSN Summary
    const hsnMap: Record<
      string,
      {
        hsn: string;
        description: string;
        uqc: string;
        totalQty: number;
        totalVal: number;
        taxableVal: number;
        cgst: number;
        sgst: number;
        igst: number;
      }
    > = {};

    validSales.forEach((s) => {
      s.items.forEach((item) => {
        const hsn = item.hsnSac || 'OTHER';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn,
            description: item.description,
            uqc: item.unit,
            totalQty: 0,
            totalVal: 0,
            taxableVal: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
          };
        }
        hsnMap[hsn].totalQty += item.qty;
        hsnMap[hsn].totalVal += item.totalAmount;
        hsnMap[hsn].taxableVal += item.taxableAmount;
        hsnMap[hsn].cgst += item.cgstAmount;
        hsnMap[hsn].sgst += item.sgstAmount;
        hsnMap[hsn].igst += item.igstAmount;
      });
    });

    // Table 13: Documents summary
    const totalDocs = sales.length;
    const cancelledDocs = sales.filter((s) => s.status === 'Cancelled').length;
    const netIssued = totalDocs - cancelledDocs;

    return {
      b2b,
      b2cLarge,
      b2cSmall,
      hsnSummary: Object.values(hsnMap),
      table13: {
        totalDocs,
        cancelledDocs,
        netIssued,
        fromSerial: sales.length > 0 ? sales[sales.length - 1].invoiceNumber : 'N/A',
        toSerial: sales.length > 0 ? sales[0].invoiceNumber : 'N/A',
      },
    };
  }, [sales, validSales]);

  // Export GSTR-1 preparation JSON
  const handleExportGSTR1Json = () => {
    const payload = {
      gstin: company.gstin,
      fp: company.financialYear,
      b2b: gstr1Buckets.b2b.map((s) => ({
        ctin: s.customerGstin,
        inv: [
          {
            inum: s.invoiceNumber,
            idt: s.invoiceDate,
            val: s.grandTotal,
            pos: s.placeOfSupplyCode,
            rchrg: s.isRcm ? 'Y' : 'N',
            itms: s.items.map((i) => ({
              num: 1,
              itm_det: {
                rt: i.gstRate,
                txval: i.taxableAmount,
                iamt: i.igstAmount,
                camt: i.cgstAmount,
                samt: i.sgstAmount,
              },
            })),
          },
        ],
      })),
      hsn: {
        data: gstr1Buckets.hsnSummary,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_Offline_Review_${company.gstin}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Statutory Disclaimer Notice Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block text-sm mb-0.5">
              {language === 'hi' ? 'वैधानिक सरकारी सूचना' : 'Statutory Return Advisory'}
            </span>
            {t.gst.disclaimer}
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.gst.title}
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800">
              GSTIN: {company.gstin}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t.gst.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleExportGSTR1Json}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export GSTR-1 Review JSON</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.gst.summary}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gstr1')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'gstr1'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.gst.gstr1Review}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gstr3b')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'gstr3b'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.gst.gstr3bReview}
        </button>
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-5">
          {/* Output vs Input Tax Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Output GST Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    ↑
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.gst.outputGst}</h3>
                    <p className="text-[11px] text-slate-500">Collected on outward supplies (Sales)</p>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900 text-base">
                  {formatINR(outputTax.totalGst)}
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Taxable Turnover:</span>
                  <span className="font-semibold text-slate-900">{formatINR(outputTax.taxable)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span>{formatINR(outputTax.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST):</span>
                  <span>{formatINR(outputTax.sgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST):</span>
                  <span>{formatINR(outputTax.igst)}</span>
                </div>
              </div>
            </div>

            {/* Input Tax Credit (ITC) Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    ↓
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.gst.inputGst}</h3>
                    <p className="text-[11px] text-slate-500">Eligible credits from inward purchases & expenses</p>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-indigo-700 text-base">
                  {formatINR(inputTax.totalGst)}
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Eligible Inward Supplies:</span>
                  <span className="font-semibold text-slate-900">{formatINR(inputTax.taxable)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input CGST:</span>
                  <span>{formatINR(inputTax.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input SGST:</span>
                  <span>{formatINR(inputTax.sgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input IGST:</span>
                  <span>{formatINR(inputTax.igst)}</span>
                </div>
                {inputTax.blockedItc > 0 && (
                  <div className="flex justify-between text-rose-600 pt-1 border-t border-slate-100">
                    <span>Blocked Credit u/s 17(5):</span>
                    <span>{formatINR(inputTax.blockedItc)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Net Settlement Balance Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {netLiability.totalPayable > 0 ? t.gst.netTaxLiability : t.gst.itcCreditBalance}
                </h3>
                <p className="text-xs text-slate-500">
                  Net statutory tax settlement after set-off under GST Rules (IGST → CGST → SGST)
                </p>
              </div>

              <div className="text-right">
                <div
                  className={`text-xl font-black font-mono ${
                    netLiability.totalPayable > 0 ? 'text-amber-600' : 'text-emerald-700'
                  }`}
                >
                  {netLiability.totalPayable > 0
                    ? formatINR(netLiability.totalPayable)
                    : formatINR(netLiability.totalCarryForward)}
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {netLiability.totalPayable > 0 ? 'Cash Payable in GSTR-3B' : 'Credit Carried Forward'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Net CGST:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatINR(netLiability.payableCgst)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Net SGST:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatINR(netLiability.payableSgst)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Net IGST:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatINR(netLiability.payableIgst)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-1 REVIEW */}
      {activeTab === 'gstr1' && (
        <div className="space-y-6">
          {/* Table 4 B2B */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {t.gst.table4B2B}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tax invoices issued to registered recipients with valid GSTIN
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {gstr1Buckets.b2b.length} Invoices
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">GSTIN of Recipient</th>
                    <th className="py-2.5 px-3">Receiver Name</th>
                    <th className="py-2.5 px-3">Invoice No.</th>
                    <th className="py-2.5 px-3">Invoice Date</th>
                    <th className="py-2.5 px-3 text-right">Invoice Value</th>
                    <th className="py-2.5 px-3">Place of Supply</th>
                    <th className="py-2.5 px-3 text-center">RCM</th>
                    <th className="py-2.5 px-3 text-right">Taxable</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {gstr1Buckets.b2b.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono text-emerald-800 font-semibold">
                        {inv.customerGstin}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{inv.customerName}</td>
                      <td className="py-2 px-3 font-mono">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{inv.invoiceDate}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-2 px-3">
                        {inv.placeOfSupplyCode}-{inv.placeOfSupply}
                      </td>
                      <td className="py-2 px-3 text-center">{inv.isRcm ? 'Y' : 'N'}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatINR(inv.totalTaxable)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(inv.igstTotal)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(inv.cgstTotal)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(inv.sgstTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 12 HSN Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {t.gst.table12HSN}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Mandatory 6-digit HSN/SAC summary of outward supplies
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">HSN / SAC</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">UQC</th>
                    <th className="py-2.5 px-3 text-right">Total Quantity</th>
                    <th className="py-2.5 px-3 text-right">Total Value</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {gstr1Buckets.hsnSummary.map((hsn) => (
                    <tr key={hsn.hsn} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{hsn.hsn}</td>
                      <td className="py-2 px-3 text-slate-700">{hsn.description}</td>
                      <td className="py-2 px-3 text-center text-slate-500">{hsn.uqc}</td>
                      <td className="py-2 px-3 text-right font-mono">{hsn.totalQty}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {formatINR(hsn.totalVal)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(hsn.taxableVal)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(hsn.igst)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(hsn.cgst)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(hsn.sgst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 13 Documents Issued */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">
              Table 13: Documents Issued During the Tax Period
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Reconciliation of serial numbering series for invoices
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Total Invoices Generated</span>
                <span className="font-bold text-slate-800 text-sm">
                  {gstr1Buckets.table13.totalDocs}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Cancelled Invoices</span>
                <span className="font-bold text-rose-600 text-sm">
                  {gstr1Buckets.table13.cancelledDocs}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Net Issued</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {gstr1Buckets.table13.netIssued}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px]">Invoice Series</span>
                <span className="font-bold text-slate-800 text-sm">
                  {company.invoicePrefix}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GSTR-3B REVIEW */}
      {activeTab === 'gstr3b' && (
        <div className="space-y-6">
          {/* Table 3.1 Outward supplies */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                {t.gst.table31Outward}
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Nature of Supplies</th>
                  <th className="py-2.5 px-4 text-right">Total Taxable Value</th>
                  <th className="py-2.5 px-4 text-right">Integrated Tax</th>
                  <th className="py-2.5 px-4 text-right">Central Tax</th>
                  <th className="py-2.5 px-4 text-right">State/UT Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono">
                <tr>
                  <td className="py-3 px-4 font-sans text-slate-800">
                    (a) Outward taxable supplies (other than zero rated, nil rated and exempted)
                  </td>
                  <td className="py-3 px-4 text-right font-bold">{formatINR(outputTax.taxable)}</td>
                  <td className="py-3 px-4 text-right">{formatINR(outputTax.igst)}</td>
                  <td className="py-3 px-4 text-right">{formatINR(outputTax.cgst)}</td>
                  <td className="py-3 px-4 text-right">{formatINR(outputTax.sgst)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans text-slate-800">
                    (b) Outward taxable supplies (zero rated)
                  </td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans text-slate-800">
                    (d) Inward supplies liable to reverse charge (RCM)
                  </td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                  <td className="py-3 px-4 text-right">₹0.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 4 Eligible ITC */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                {t.gst.table4ITC}
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4 text-right">Integrated Tax</th>
                  <th className="py-2.5 px-4 text-right">Central Tax</th>
                  <th className="py-2.5 px-4 text-right">State/UT Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono">
                <tr>
                  <td className="py-3 px-4 font-sans text-slate-800 font-semibold">
                    (A) ITC Available (whether in full or part)
                  </td>
                  <td colSpan={3}></td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-2 px-6 font-sans text-slate-700">
                    (5) All other ITC (Purchases & Operating Expenses)
                  </td>
                  <td className="py-2 px-4 text-right text-indigo-700 font-bold">{formatINR(inputTax.igst)}</td>
                  <td className="py-2 px-4 text-right text-indigo-700 font-bold">{formatINR(inputTax.cgst)}</td>
                  <td className="py-2 px-4 text-right text-indigo-700 font-bold">{formatINR(inputTax.sgst)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans text-rose-800 font-semibold">
                    (B) Ineligible ITC (Section 17(5))
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600">₹0.00</td>
                  <td className="py-3 px-4 text-right text-rose-600">{formatINR(inputTax.blockedItc / 2)}</td>
                  <td className="py-3 px-4 text-right text-rose-600">{formatINR(inputTax.blockedItc / 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
