import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Trash2,
  X,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Truck,
  Copy,
  Info,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  CompanyProfile,
  SalesInvoice,
  Language,
} from '../types/accounting';
import {
  EInvoiceRecord,
  EInvoiceGenerateRequest,
} from '../types/einvoice';
import { EInvoiceService, EInvoiceConfigStatus } from '../services/eInvoiceService';
import { formatINR } from '../utils/indianFormatters';

interface EInvoiceModuleProps {
  sales: SalesInvoice[];
  company: CompanyProfile;
  eInvoices: EInvoiceRecord[];
  language: Language;
  onSaveEInvoice: (rec: EInvoiceRecord) => void;
  onCancelEInvoice: (irn: string, reason: string, remarks: string) => void;
  onNavigateToEWayBill?: (invoiceId?: string, irn?: string) => void;
  preselectedInvoiceId?: string;
}

export const EInvoiceModule: React.FC<EInvoiceModuleProps> = ({
  sales,
  company,
  eInvoices,
  language,
  onSaveEInvoice,
  onCancelEInvoice,
  onNavigateToEWayBill,
  preselectedInvoiceId,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'generate' | 'checklist'>(
    preselectedInvoiceId ? 'generate' : 'list'
  );
  const [configStatus, setConfigStatus] = useState<EInvoiceConfigStatus | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GENERATED' | 'CANCELLED'>('ALL');
  const [selectedEInvoice, setSelectedEInvoice] = useState<EInvoiceRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Cancellation Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<EInvoiceRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<'1' | '2' | '3' | '4'>('1');
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Generation Form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoiceId || '');
  const [supplyType, setSupplyType] = useState<'B2B' | 'SEZWP' | 'SEZWOP' | 'EXPWP' | 'EXPWOP' | 'DEXP'>('B2B');
  const [forceSandbox, setForceSandbox] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingConfig(true);
    EInvoiceService.getConfigStatus()
      .then((st) => setConfigStatus(st))
      .catch(() => {})
      .finally(() => setIsLoadingConfig(false));
  }, []);

  useEffect(() => {
    if (preselectedInvoiceId) {
      setSelectedInvoiceId(preselectedInvoiceId);
      setActiveTab('generate');
    }
  }, [preselectedInvoiceId]);

  // Selected invoice object for generation form
  const selectedInvoice = useMemo(() => {
    return sales.find((s) => s.id === selectedInvoiceId);
  }, [sales, selectedInvoiceId]);

  // Check if selected invoice already has an active IRN
  const existingIrnForSelected = useMemo(() => {
    if (!selectedInvoice) return undefined;
    return eInvoices.find(
      (e) => (e.invoiceId === selectedInvoice.id || e.invoiceNumber === selectedInvoice.invoiceNumber) && e.status === 'GENERATED'
    );
  }, [selectedInvoice, eInvoices]);

  // Filtered list
  const filteredEInvoices = useMemo(() => {
    return eInvoices.filter((item) => {
      const matchesSearch =
        item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyerLegalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyerGstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.irn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ackNo.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'ALL' ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [eInvoices, searchQuery, statusFilter]);

  // Metrics
  const activeCount = useMemo(() => eInvoices.filter((e) => e.status === 'GENERATED').length, [eInvoices]);
  const cancelledCount = useMemo(() => eInvoices.filter((e) => e.status === 'CANCELLED').length, [eInvoices]);
  const sandboxCount = useMemo(() => eInvoices.filter((e) => e.isSandbox).length, [eInvoices]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerateIRN = async () => {
    if (!selectedInvoice) {
      setGenerationError('Please select a sales invoice to generate an e-invoice.');
      return;
    }

    if (!selectedInvoice.customerGstin && supplyType === 'B2B') {
      setGenerationError('Customer GSTIN is missing. B2B e-invoicing requires a valid registered 15-character GSTIN.');
      return;
    }

    if (existingIrnForSelected) {
      setGenerationError(`Invoice ${selectedInvoice.invoiceNumber} already has an active IRN: ${existingIrnForSelected.irn}. Duplicate IRN generation is prohibited.`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);

    const payload: EInvoiceGenerateRequest = {
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      invoiceDate: selectedInvoice.invoiceDate,
      supplyType,
      sellerGstin: company.gstin || '27AABCS1429B1Z8',
      sellerLegalName: company.name,
      sellerTradeName: company.tradeName,
      sellerAddress: company.address,
      sellerPlace: company.city,
      sellerStateCode: company.stateCode || '27',
      sellerPincode: company.pincode || '400093',
      buyerGstin: selectedInvoice.customerGstin || '27AAACA9012K1ZP',
      buyerLegalName: selectedInvoice.customerName,
      buyerTradeName: selectedInvoice.customerTradeName,
      buyerAddress: selectedInvoice.billingAddress,
      buyerPlace: selectedInvoice.customerState,
      buyerStateCode: selectedInvoice.customerStateCode || '27',
      buyerPincode: selectedInvoice.customerPincode || '400064',
      placeOfSupplyCode: selectedInvoice.placeOfSupplyCode || '27',
      isInterState: selectedInvoice.isInterState,
      isRcm: selectedInvoice.isRcm,
      items: selectedInvoice.items.map((it) => ({
        description: it.description,
        hsnSac: it.hsnSac || '998313',
        qty: it.qty,
        unit: it.unit,
        rate: it.rate,
        discountAmount: it.discountAmount,
        taxableAmount: it.taxableAmount,
        gstRate: it.gstRate,
        cgstAmount: it.cgstAmount,
        sgstAmount: it.sgstAmount,
        igstAmount: it.igstAmount,
        totalAmount: it.totalAmount,
      })),
      totalTaxable: selectedInvoice.totalTaxable,
      cgstTotal: selectedInvoice.cgstTotal,
      sgstTotal: selectedInvoice.sgstTotal,
      igstTotal: selectedInvoice.igstTotal,
      roundOff: selectedInvoice.roundOff,
      grandTotal: selectedInvoice.grandTotal,
      forceSandbox,
    };

    const res = await EInvoiceService.generateEInvoice(payload);
    setIsGenerating(false);

    if (!res.success || !res.data) {
      setGenerationError(res.error || 'Failed to generate statutory IRN');
      return;
    }

    onSaveEInvoice(res.data);
    setSelectedEInvoice(res.data);
    setIsDetailModalOpen(true);
    setGenerationSuccess(
      res.isSandbox
        ? '⚡ [SANDBOX DEMO] IRN & Signed QR Code generated successfully for testing.'
        : 'Statutory IRN generated successfully on official Government IRP portal.'
    );
    setActiveTab('list');
  };

  const handleOpenCancelModal = (rec: EInvoiceRecord) => {
    setCancelTarget(rec);
    setCancelReason('1');
    setCancelRemarks('');
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  const handleExecuteCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelRemarks.trim() || cancelRemarks.trim().length < 3) {
      setCancelError('Please enter a cancellation reason remark (min 3 characters).');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    const res = await EInvoiceService.cancelEInvoice({
      irn: cancelTarget.irn,
      reason: cancelReason,
      remarks: cancelRemarks.trim(),
    });

    setIsCancelling(false);

    if (!res.success) {
      setCancelError(res.error || 'Failed to cancel IRN on IRP portal');
      return;
    }

    onCancelEInvoice(cancelTarget.irn, cancelReason, cancelRemarks.trim());
    setIsCancelModalOpen(false);
    setCancelTarget(null);
  };

  const handleDownloadJson = (rec: EInvoiceRecord) => {
    const jsonStr = rec.signedInvoicePayload || JSON.stringify(rec, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EInvoice_${rec.invoiceNumber.replace(/[\/\\]/g, '_')}_IRN_${rec.irn.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Provider Information */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-indigo-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="p-2 rounded-xl bg-violet-500/20 text-violet-300">
                <QrCode className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {language === 'hi' ? 'ई-इनवॉयस प्रबंधन (E-Invoice IRP)' : 'Statutory E-Invoice Management (IRP)'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-violet-400/20 text-violet-200 border border-violet-400/30">
                Schema v1.03
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                {configStatus?.sandboxMode ? 'Sandbox Demo Mode Active' : 'Production Mode'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Generate 64-character Invoice Reference Numbers (IRN), statutory Acknowledgement Numbers, and Government-standard signed QR codes. View status, cancel within 24 hours, and seamlessly generate matching E-Way Bills.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1.5 ${
                activeTab === 'generate'
                  ? 'bg-white text-indigo-900 shadow-md'
                  : 'bg-violet-600/80 hover:bg-violet-600 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'नया IRN बनाएं' : '+ Generate New IRN'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                activeTab === 'checklist'
                  ? 'bg-white/20 text-white border-white/40'
                  : 'bg-black/20 hover:bg-black/30 text-slate-300 border-white/10'
              }`}
            >
              <span>{language === 'hi' ? 'सेटअप चेकलिस्ट' : 'API Checklist'}</span>
            </button>
          </div>
        </div>

        {/* Prominent Sandbox Disclosure Banner as required */}
        <div className="mt-4 pt-3 border-t border-indigo-800/60 flex items-start sm:items-center justify-between gap-3 text-xs text-amber-200 bg-amber-950/30 -mx-2 sm:-mx-3 px-3 py-2 rounded-xl border border-amber-500/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">
              <strong>[DEMO SANDBOX MODE ACTIVE]:</strong> Generated IRNs and signed QR codes in this mode are cryptographically validated against statutory Schema v1.03 for simulation and testing. Real statutory registration requires configured official IRP/GSP credentials.
            </span>
          </div>
          <span className="text-[11px] font-mono shrink-0 bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
            No Tax Liability
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'list'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'hi' ? 'ई-इनवॉयस रजिस्टर' : 'E-Invoices Registry'}</span>
            <span className="ml-1.5 px-2 py-0.2 rounded-full text-[11px] bg-slate-100 text-slate-700">
              {eInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'generate'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'hi' ? 'IRN जेनेरेटर' : 'Generate IRN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'checklist'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'hi' ? 'सैंडबॉक्स सेटअप चेकलिस्ट' : 'Sandbox Setup & Verification'}</span>
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="text-xs text-slate-500 hidden sm:block">
            Showing <strong className="text-slate-800">{filteredEInvoices.length}</strong> of {eInvoices.length} e-invoices
          </div>
        )}
      </div>

      {/* TAB 1: LIST / REGISTRY VIEW */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium">Total Registered</span>
              <div className="text-xl font-black text-slate-900 mt-1">{eInvoices.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-emerald-600 text-xs font-medium">Active Valid IRNs</span>
              <div className="text-xl font-black text-emerald-700 mt-1">{activeCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-rose-600 text-xs font-medium">Cancelled IRNs</span>
              <div className="text-xl font-black text-rose-700 mt-1">{cancelledCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-violet-600 text-xs font-medium">Simulated Sandbox</span>
              <div className="text-xl font-black text-violet-700 mt-1">{sandboxCount}</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Invoice No, Customer, GSTIN, IRN..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('GENERATED')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === 'GENERATED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CANCELLED')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === 'CANCELLED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {filteredEInvoices.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No E-Invoices Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {eInvoices.length === 0
                    ? 'No statutory e-invoices have been generated yet. Select an issued Sales Invoice to generate your first official IRN and signed QR code.'
                    : 'No e-invoices match your current search and filter criteria.'}
                </p>
                {eInvoices.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('generate')}
                    className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-bold rounded-lg text-white bg-violet-600 hover:bg-violet-700 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Generate Your First E-Invoice</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Invoice & Date</th>
                      <th className="px-4 py-3">Buyer & GSTIN</th>
                      <th className="px-4 py-3">IRN & Ack No</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Mode & Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEInvoices.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-500">{item.invoiceDate}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{item.buyerLegalName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{item.buyerGstin}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="flex items-center space-x-1">
                            <span className="font-mono text-[11px] text-slate-700 truncate" title={item.irn}>
                              {item.irn.substring(0, 16)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.irn, item.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Copy full 64-character IRN"
                            >
                              {copiedKey === item.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Ack: {item.ackNo}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{formatINR(item.totalInvoiceValue)}</div>
                          <div className="text-[10px] text-slate-500">Tax: {formatINR(item.cgstValue + item.sgstValue + item.igstValue)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'GENERATED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.status === 'GENERATED' ? 'Active IRN' : 'Cancelled'}
                            </span>
                            {item.isSandbox ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                                [SANDBOX DEMO]
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                [LIVE STATUTORY]
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEInvoice(item);
                                setIsDetailModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 cursor-pointer"
                              title="View Signed QR Code and Statutory Details"
                            >
                              View / QR
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadJson(item)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                              title="Download Signed NIC JSON Payload"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {onNavigateToEWayBill && item.status === 'GENERATED' && (
                              <button
                                type="button"
                                onClick={() => onNavigateToEWayBill(item.invoiceId, item.irn)}
                                className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer flex items-center space-x-1"
                                title="Generate E-Way Bill from this IRN"
                              >
                                <Truck className="w-3 h-3" />
                                <span className="hidden md:inline">E-Way Bill</span>
                              </button>
                            )}

                            {item.status === 'GENERATED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(item)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Cancel IRN within 24 hours"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GENERATION FORM */}
      {activeTab === 'generate' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <span>Generate Statutory E-Invoice (IRN)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an issued sales invoice to transmit to the government IRP. Schema v1.03 will validate HSN, GSTINs, and place of supply.
            </p>
          </div>

          {/* Feedback messages */}
          {generationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong className="font-bold">Validation Error: </strong>
                <span>{generationError}</span>
              </div>
            </div>
          )}

          {generationSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <strong className="font-bold">Success: </strong>
                <span>{generationSuccess}</span>
              </div>
            </div>
          )}

          {/* Invoice Picker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Select Issued Sales Invoice <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  setGenerationError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white font-medium"
              >
                <option value="">-- Choose an Issued Tax Invoice --</option>
                {sales
                  .filter((s) => s.status !== 'Cancelled')
                  .map((inv) => {
                    const hasIrn = eInvoices.some(
                      (e) => (e.invoiceId === inv.id || e.invoiceNumber === inv.invoiceNumber) && e.status === 'GENERATED'
                    );
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} | {inv.customerName} ({inv.invoiceDate}) - {formatINR(inv.grandTotal)}{' '}
                        {hasIrn ? ' [Active IRN Exists]' : ''}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Supply Type</label>
              <select
                value={supplyType}
                onChange={(e) => setSupplyType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              >
                <option value="B2B">B2B - Business to Business</option>
                <option value="SEZWP">SEZWP - SEZ with Payment of Tax</option>
                <option value="SEZWOP">SEZWOP - SEZ without Payment of Tax</option>
                <option value="EXPWP">EXPWP - Export with Payment</option>
                <option value="EXPWOP">EXPWOP - Export without Payment</option>
                <option value="DEXP">DEXP - Deemed Export</option>
              </select>
            </div>
          </div>

          {/* Duplicate protection warning */}
          {existingIrnForSelected && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Active IRN Already Exists:</strong> This invoice already has IRN <code>{existingIrnForSelected.irn.substring(0, 16)}...</code>. Generating another IRN for the same document is prohibited under NIC Rule 48(4).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEInvoice(existingIrnForSelected);
                  setIsDetailModalOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200"
              >
                View Existing IRN
              </button>
            </div>
          )}

          {/* Selected Invoice Details Preview */}
          {selectedInvoice && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 font-medium">Seller (Supplier):</span>
                  <div className="font-bold text-slate-800 mt-0.5">{company.name}</div>
                  <div className="font-mono text-slate-600">{company.gstin}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Buyer (Recipient):</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedInvoice.customerName}</div>
                  <div className="font-mono text-slate-600">
                    {selectedInvoice.customerGstin || (
                      <span className="text-rose-600 font-semibold">Missing GSTIN</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Place of Supply:</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedInvoice.placeOfSupply} (State Code {selectedInvoice.placeOfSupplyCode})
                  </div>
                  <div className="text-slate-500">
                    {selectedInvoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Invoice Total:</span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {formatINR(selectedInvoice.grandTotal)}
                  </div>
                  <div className="text-slate-500">
                    Taxable: {formatINR(selectedInvoice.totalTaxable)}
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-700">Line Items to be transmitted:</span>
                <div className="mt-2 space-y-1.5">
                  {selectedInvoice.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-500">{idx + 1}.</span>
                        <span className="font-medium text-slate-800">{it.description}</span>
                        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          HSN: {it.hsnSac || '998313'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900">
                        {it.qty} {it.unit} @ {formatINR(it.rate)} = {formatINR(it.taxableAmount)} ({it.gstRate}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceSandbox}
                  onChange={(e) => setForceSandbox(e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="font-medium">Run in Sandbox Demo Mode (Safe test payload)</span>
              </label>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedInvoice || isGenerating || Boolean(existingIrnForSelected)}
                onClick={handleGenerateIRN}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting to IRP...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generate IRN & Signed QR Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHECKLIST & API SETUP GUIDE */}
      {activeTab === 'checklist' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>E-Invoice NIC / GSP Sandbox Verification Checklist</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify your integration requirements before moving from sandbox simulation to live statutory production filing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[11px]">
                  1
                </span>
                <span>IRP / GSP Account Registration</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Register on the official NIC e-Invoice Portal (<code>einvoice1.gst.gov.in</code>) or an authorized GSP (such as Sandbox.co.in, MasterGST, or ClearTax).
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                Sandbox Portal: einv-apisandbox.nic.in
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[11px]">
                  2
                </span>
                <span>API User Credentials & IP Whitelisting</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Create dedicated API User credentials on the portal under <em>API Registration</em>. If required by your provider, whitelist the egress IP of your hosting container.
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                Auth Scheme: OAuth2 / Client Secret + Bearer Token
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[11px]">
                  3
                </span>
                <span>Server-Side Environment Secrets</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Configure backend environment secrets in AI Studio Secrets panel. Keys are never exposed to frontend code or client browser:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 font-mono text-[11px]">
                <li>EINVOICE_CLIENT_ID</li>
                <li>EINVOICE_CLIENT_SECRET</li>
                <li>EINVOICE_USER_NAME</li>
                <li>EINVOICE_PASSWORD</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[11px]">
                  4
                </span>
                <span>Statutory 24-Hour Cancellation Rules</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                According to GST statutory provisions, an IRN can be cancelled on the IRP portal only within <strong>24 hours</strong> of generation. Once 24 hours elapse, cancellation requires a Credit Note in GSTR-1.
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                Rule 48(4) & Rule 48(5) CGST Rules
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL & SIGNED QR CODE MODAL */}
      {isDetailModalOpen && selectedEInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                  <QrCode className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Statutory E-Invoice IRN Details & Signed QR Code
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Invoice {selectedEInvoice.invoiceNumber} | {selectedEInvoice.invoiceDate}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sandbox banner if applicable */}
            {selectedEInvoice.isSandbox && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>[DEMO SANDBOX RECORD]:</strong> This e-invoice IRN was simulated for testing purposes against NIC Schema v1.03. Real statutory tax registration requires production credentials.
                </span>
              </div>
            )}

            {/* QR Code and Primary IRN Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* QR Code Display */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <QRCodeSVG
                  value={EInvoiceService.buildQrCodeData(selectedEInvoice)}
                  size={160}
                  level="M"
                  includeMargin
                />
                <span className="text-[10px] text-slate-500 mt-2 font-mono text-center">
                  Statutory Signed QR Code
                </span>
              </div>

              {/* IRN, Ack No, Ack Date */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">64-Character IRN Hash:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedEInvoice.irn, 'modal_irn')}
                      className="text-violet-600 hover:text-violet-800 font-semibold flex items-center space-x-1"
                    >
                      {copiedKey === 'modal_irn' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy IRN</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all">
                    {selectedEInvoice.irn}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-slate-600">Ack Number:</span>
                    <div className="font-mono text-slate-900 font-bold mt-0.5">
                      {selectedEInvoice.ackNo}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">Ack Timestamp:</span>
                    <div className="text-slate-800 mt-0.5">
                      {new Date(selectedEInvoice.ackDate).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <span className="font-bold text-slate-600">Seller GSTIN:</span>
                    <div className="font-mono text-slate-800">{selectedEInvoice.sellerGstin}</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">Buyer GSTIN:</span>
                    <div className="font-mono text-slate-800">{selectedEInvoice.buyerGstin}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions: Download JSON, Print, E-Way Bill jump */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleDownloadJson(selectedEInvoice)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Signed JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Copy</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {onNavigateToEWayBill && selectedEInvoice.status === 'GENERATED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      onNavigateToEWayBill(selectedEInvoice.invoiceId, selectedEInvoice.irn);
                    }}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer flex items-center space-x-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Generate E-Way Bill from this IRN</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {isCancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Cancel Statutory E-Invoice IRN</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to cancel the IRN for invoice <strong>{cancelTarget.invoiceNumber}</strong>. Per GST statutory rules, cancellation can only take place within 24 hours of generation.
            </p>

            {cancelError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {cancelError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Cancellation Reason Code</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="1">1 - Duplicate Entry</option>
                  <option value="2">2 - Data Entry Mistake</option>
                  <option value="3">3 - Order Cancelled by Customer</option>
                  <option value="4">4 - Others</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Mandatory Cancellation Remarks</label>
                <textarea
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  placeholder="State the exact reason for IRN cancellation (min 3 chars)..."
                  rows={3}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleExecuteCancel}
                className="px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling on IRP...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
