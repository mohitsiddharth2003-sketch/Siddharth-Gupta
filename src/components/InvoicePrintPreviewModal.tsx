import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X, Building2, CheckCircle2 } from 'lucide-react';
import { SalesInvoice, CompanyProfile, Language } from '../types/accounting';
import { EInvoiceRecord } from '../types/einvoice';
import { formatINR, numberToWordsINR } from '../utils/indianFormatters';
import { translations } from '../utils/translations';

interface InvoicePrintPreviewModalProps {
  invoice: SalesInvoice | null;
  company: CompanyProfile;
  eInvoice?: EInvoiceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const InvoicePrintPreviewModal: React.FC<InvoicePrintPreviewModalProps> = ({
  invoice,
  company,
  eInvoice,
  isOpen,
  onClose,
  language,
}) => {
  const [copyType, setCopyType] = useState<'Original' | 'Duplicate' | 'Triplicate'>('Original');
  const t = translations[language];

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group items by HSN for HSN Tax summary table
  const hsnSummary: Record<
    string,
    {
      taxable: number;
      gstRate: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
    }
  > = {};

  invoice.items.forEach((item) => {
    const key = `${item.hsnSac}_${item.gstRate}`;
    if (!hsnSummary[key]) {
      hsnSummary[key] = {
        taxable: 0,
        gstRate: item.gstRate,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
      };
    }
    hsnSummary[key].taxable += item.taxableAmount;
    hsnSummary[key].cgst += item.cgstAmount;
    hsnSummary[key].sgst += item.sgstAmount;
    hsnSummary[key].igst += item.igstAmount;
    hsnSummary[key].totalTax += item.cgstAmount + item.sgstAmount + item.igstAmount;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header Bar - Hidden on print */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setCopyType('Original')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  copyType === 'Original' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Original for Recipient
              </button>
              <button
                type="button"
                onClick={() => setCopyType('Duplicate')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  copyType === 'Duplicate' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Duplicate for Transporter
              </button>
              <button
                type="button"
                onClick={() => setCopyType('Triplicate')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  copyType === 'Triplicate' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                Triplicate for Supplier
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.common.print}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Content */}
        <div className="p-6 sm:p-8 overflow-y-auto text-slate-800 text-xs font-sans print:p-0 print:overflow-visible">
          {/* Top Title Banner */}
          <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-900">
              TAX INVOICE
            </h1>
            <div className="text-[11px] font-semibold text-slate-600 tracking-wide">
              (Issued under Section 31 of Central Goods and Services Tax Act, 2017)
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-800 bg-emerald-50 inline-block px-3 py-0.5 rounded-full border border-emerald-200">
              {copyType === 'Original'
                ? 'ORIGINAL FOR RECIPIENT'
                : copyType === 'Duplicate'
                ? 'DUPLICATE FOR TRANSPORTER'
                : 'TRIPLICATE FOR SUPPLIER'}
            </div>
          </div>

          {/* Statutory E-Invoice IRN & Signed QR Code Banner */}
          {eInvoice && eInvoice.status === 'GENERATED' && (
            <div className="flex items-center justify-between p-3.5 mb-4 rounded-xl border border-violet-300 bg-violet-50/60 text-slate-800">
              <div className="space-y-1 text-xs max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-violet-900 uppercase tracking-wide text-[11px]">
                    Statutory E-Invoice (IRN Registered under Rule 48(4))
                  </span>
                  {eInvoice.isSandbox ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      [SANDBOX DEMO]
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      [LIVE STATUTORY]
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-slate-900 break-all select-all">
                  <strong className="text-slate-600">IRN: </strong>{eInvoice.irn}
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  <strong>Ack No: </strong>{eInvoice.ackNo} &nbsp;|&nbsp; <strong>Ack Timestamp: </strong>{new Date(eInvoice.ackDate).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="shrink-0 ml-4 p-1.5 bg-white rounded-lg border border-violet-200 shadow-2xs">
                <QRCodeSVG
                  value={eInvoice.signedQRCode || eInvoice.irn}
                  size={68}
                  level="M"
                />
              </div>
            </div>
          )}

          {/* Supplier Details & Invoice Meta */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl mb-4 bg-slate-50/50">
            {/* Supplier / Seller */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Details of Supplier (Seller)
              </span>
              <div className="font-extrabold text-sm text-slate-900">{company.name}</div>
              {company.tradeName && (
                <div className="text-xs text-slate-600 font-medium">({company.tradeName})</div>
              )}
              <div className="text-xs text-slate-600">{company.address}</div>
              <div className="text-xs text-slate-600">
                {company.city}, {company.state} - {company.pincode}
              </div>
              <div className="pt-1 font-mono text-xs">
                <span className="font-semibold text-slate-700">GSTIN: </span>
                <span className="font-bold text-slate-900">{company.gstin}</span>
              </div>
              <div className="font-mono text-xs">
                <span className="font-semibold text-slate-700">PAN: </span>
                <span>{company.pan}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-semibold text-slate-700">State Code: </span>
                <span>{company.stateCode}</span>
              </div>
            </div>

            {/* Invoice Metadata */}
            <div className="space-y-1.5 text-right border-l border-slate-200 pl-4">
              <div>
                <span className="text-slate-500 font-medium">Invoice No: </span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Invoice Date: </span>
                <span className="font-semibold text-slate-800">{invoice.invoiceDate}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Due Date: </span>
                <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Place of Supply: </span>
                <span className="font-bold text-slate-800">
                  {invoice.placeOfSupply} (Code: {invoice.placeOfSupplyCode})
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Reverse Charge (RCM): </span>
                <span className="font-semibold text-slate-800">
                  {invoice.isRcm ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="border border-slate-300 p-4 rounded-xl mb-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Details of Receiver (Billed To)
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
                <div className="text-xs text-slate-600 mt-0.5">{invoice.billingAddress}</div>
                <div className="text-xs text-slate-600">
                  State: {invoice.customerState} (Code: {invoice.customerStateCode})
                </div>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div>
                  <span className="font-semibold text-slate-700">GSTIN / UIN: </span>
                  <span className="font-bold text-slate-900">
                    {invoice.customerGstin || 'URP (Unregistered Person)'}
                  </span>
                </div>
                {invoice.customerPan && (
                  <div>
                    <span className="font-semibold text-slate-700">PAN: </span>
                    <span>{invoice.customerPan}</span>
                  </div>
                )}
                {invoice.customerPhone && (
                  <div>
                    <span className="font-semibold text-slate-700">Phone: </span>
                    <span>{invoice.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300 uppercase">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-300">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Description of Goods / Services</th>
                  <th className="py-2.5 px-3 w-20 text-center border-r border-slate-300">HSN/SAC</th>
                  <th className="py-2.5 px-3 w-14 text-right border-r border-slate-300">Qty</th>
                  <th className="py-2.5 px-3 w-14 text-center border-r border-slate-300">Unit</th>
                  <th className="py-2.5 px-3 w-20 text-right border-r border-slate-300">Rate (₹)</th>
                  <th className="py-2.5 px-3 w-16 text-right border-r border-slate-300">Disc %</th>
                  <th className="py-2.5 px-3 w-24 text-right border-r border-slate-300">Taxable (₹)</th>
                  <th className="py-2.5 px-3 w-14 text-center border-r border-slate-300">GST%</th>
                  <th className="py-2.5 px-3 w-24 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="text-xs">
                    <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-200">
                      {index + 1}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 border-r border-slate-200">
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 border-r border-slate-200">
                      {item.hsnSac || '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                      {item.qty}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-200">
                      {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                      {formatINR(item.rate, { showSymbol: false })}
                    </td>
                    <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium border-r border-slate-200">
                      {formatINR(item.taxableAmount, { showSymbol: false })}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-medium border-r border-slate-200">
                      {item.gstRate}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.totalAmount, { showSymbol: false })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakup Section */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Amount in words & Notes */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Invoice Amount in Words
                </span>
                <div className="font-bold text-slate-900 text-xs italic">
                  {invoice.totalInWords || numberToWordsINR(invoice.grandTotal)}
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block mb-0.5">
                  Bank Details for Electronic Remittance (NEFT / RTGS / IMPS)
                </span>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold">Bank: </span>
                  {company.bankName}
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold">Account No: </span>
                  <span className="font-mono font-bold text-slate-900">{company.bankAccountNo}</span>
                </div>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold">IFSC Code: </span>
                  <span className="font-mono font-bold text-slate-900">{company.bankIfsc}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-semibold">Branch: </span>
                  {company.bankBranch}
                </div>
              </div>
            </div>

            {/* Calculations Summary Box */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="divide-y divide-slate-200 text-xs">
                <div className="flex justify-between py-1.5 px-4 bg-slate-50">
                  <span className="text-slate-600">Total Taxable Value</span>
                  <span className="font-mono font-medium">{formatINR(invoice.totalTaxable)}</span>
                </div>

                {!invoice.isInterState ? (
                  <>
                    <div className="flex justify-between py-1.5 px-4">
                      <span className="text-slate-600">Central Tax (CGST)</span>
                      <span className="font-mono font-medium">{formatINR(invoice.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-4">
                      <span className="text-slate-600">State Tax (SGST)</span>
                      <span className="font-mono font-medium">{formatINR(invoice.sgstTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1.5 px-4">
                    <span className="text-slate-600">Integrated Tax (IGST)</span>
                    <span className="font-mono font-medium">{formatINR(invoice.igstTotal)}</span>
                  </div>
                )}

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between py-1.5 px-4 bg-slate-50">
                    <span className="text-slate-600">Round Off</span>
                    <span className="font-mono">{formatINR(invoice.roundOff)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2.5 px-4 bg-emerald-50 text-slate-900 font-extrabold text-sm">
                  <span>Grand Total (INR)</span>
                  <span className="font-mono text-emerald-800">{formatINR(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* HSN Tax Summary Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
            <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 uppercase">
              HSN / SAC Tax Liability Summary
            </div>
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-1 px-3">HSN/SAC</th>
                  <th className="py-1 px-3 text-right">Taxable Value</th>
                  <th className="py-1 px-3 text-right">CGST</th>
                  <th className="py-1 px-3 text-right">SGST</th>
                  <th className="py-1 px-3 text-right">IGST</th>
                  <th className="py-1 px-3 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(hsnSummary).map(([hsn, s]) => (
                  <tr key={hsn}>
                    <td className="py-1 px-3 font-mono text-slate-800">{hsn.split('_')[0]}</td>
                    <td className="py-1 px-3 text-right font-mono">{formatINR(s.taxable)}</td>
                    <td className="py-1 px-3 text-right font-mono">{formatINR(s.cgst)}</td>
                    <td className="py-1 px-3 text-right font-mono">{formatINR(s.sgst)}</td>
                    <td className="py-1 px-3 text-right font-mono">{formatINR(s.igst)}</td>
                    <td className="py-1 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(s.totalTax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Terms & Signatory */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-4 mt-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Terms & Conditions
              </span>
              <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                {invoice.termsAndConditions || company.termsAndConditions}
              </p>
            </div>

            <div className="text-right flex flex-col justify-between items-end min-h-[90px]">
              <div className="text-xs font-bold text-slate-900">
                For {company.name}
              </div>
              <div className="border-t border-slate-400 pt-1 w-48 text-center text-[11px] font-semibold text-slate-600">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
