import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Trash2,
  X,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  MapPin,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import {
  CompanyProfile,
  SalesInvoice,
  Language,
} from '../types/accounting';
import {
  EWayBillRecord,
  EWayBillGenerateRequest,
  TransportMode,
  VehicleType,
} from '../types/ewaybill';
import { EInvoiceRecord } from '../types/einvoice';
import { EWayBillService, EWayBillConfigStatus } from '../services/eWayBillService';
import { formatINR } from '../utils/indianFormatters';

interface EWayBillModuleProps {
  sales: SalesInvoice[];
  company: CompanyProfile;
  eWayBills: EWayBillRecord[];
  eInvoices: EInvoiceRecord[];
  language: Language;
  onSaveEWayBill: (rec: EWayBillRecord) => void;
  onUpdatePartB: (
    ewbNo: string,
    update: {
      vehicleNo: string;
      fromPlace: string;
      fromState: string;
      reasonCode: '1' | '2' | '3' | '4';
      reasonRemarks: string;
      transDocNo?: string;
      transDocDate?: string;
    }
  ) => void;
  onExtendValidity: (
    ewbNo: string,
    extension: {
      remainingDistance: number;
      currentPlace: string;
      currentPincode?: string;
      reasonCode: '1' | '2' | '3' | '4' | '5';
      remarks: string;
    }
  ) => void;
  onCancelEWayBill: (ewbNo: string, reason: string, remarks: string) => void;
  preselectedInvoiceId?: string;
  preselectedIrn?: string;
}

export const EWayBillModule: React.FC<EWayBillModuleProps> = ({
  sales,
  company,
  eWayBills,
  eInvoices,
  language,
  onSaveEWayBill,
  onUpdatePartB,
  onExtendValidity,
  onCancelEWayBill,
  preselectedInvoiceId,
  preselectedIrn,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'generate' | 'checklist'>(
    preselectedInvoiceId || preselectedIrn ? 'generate' : 'list'
  );

  const [configStatus, setConfigStatus] = useState<EWayBillConfigStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACT' | 'CNL' | 'EXP'>('ALL');

  // Selected E-Way Bill Detail / Print Modal
  const [selectedEwb, setSelectedEwb] = useState<EWayBillRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Part B Update Modal
  const [isPartBModalOpen, setIsPartBModalOpen] = useState(false);
  const [partBTarget, setPartBTarget] = useState<EWayBillRecord | null>(null);
  const [partBVehicleNo, setPartBVehicleNo] = useState('');
  const [partBFromPlace, setPartBFromPlace] = useState('');
  const [partBFromState, setPartBFromState] = useState('27');
  const [partBReasonCode, setPartBReasonCode] = useState<'1' | '2' | '3' | '4'>('2');
  const [partBRemarks, setPartBRemarks] = useState('');
  const [partBTransDocNo, setPartBTransDocNo] = useState('');
  const [isUpdatingPartB, setIsUpdatingPartB] = useState(false);
  const [partBError, setPartBError] = useState<string | null>(null);

  // Extend Validity Modal
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<EWayBillRecord | null>(null);
  const [extendRemainingDistance, setExtendRemainingDistance] = useState(100);
  const [extendCurrentPlace, setExtendCurrentPlace] = useState('');
  const [extendReasonCode, setExtendReasonCode] = useState<'1' | '2' | '3' | '4' | '5'>('2');
  const [extendRemarks, setExtendRemarks] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);

  // Cancellation Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<EWayBillRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<'1' | '2' | '3' | '4'>('1');
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Generation Form States
  const [genSource, setGenSource] = useState<'invoice' | 'irn' | 'manual'>('invoice');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preselectedInvoiceId || '');
  const [selectedIrn, setSelectedIrn] = useState<string>(preselectedIrn || '');
  const [subSupplyType, setSubSupplyType] = useState<any>('Supply');
  const [transporterId, setTransporterId] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [transMode, setTransMode] = useState<TransportMode>('1'); // 1-Road
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('R');
  const [transDocNo, setTransDocNo] = useState('');
  const [transDocDate, setTransDocDate] = useState('');
  const [distanceKm, setDistanceKm] = useState(85);
  const [forceSandbox, setForceSandbox] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

  useEffect(() => {
    EWayBillService.getConfigStatus()
      .then((st) => setConfigStatus(st))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (preselectedInvoiceId) {
      setSelectedInvoiceId(preselectedInvoiceId);
      setGenSource('invoice');
      setActiveTab('generate');
    }
    if (preselectedIrn) {
      setSelectedIrn(preselectedIrn);
      setGenSource('irn');
      setActiveTab('generate');
    }
  }, [preselectedInvoiceId, preselectedIrn]);

  // Derived selected invoice
  const currentInvoice = useMemo(() => {
    if (genSource === 'irn' && selectedIrn) {
      const matchEinv = eInvoices.find((e) => e.irn === selectedIrn);
      if (matchEinv) {
        return sales.find((s) => s.id === matchEinv.invoiceId || s.invoiceNumber === matchEinv.invoiceNumber);
      }
    }
    return sales.find((s) => s.id === selectedInvoiceId);
  }, [sales, eInvoices, genSource, selectedInvoiceId, selectedIrn]);

  // Derived linked IRN record
  const currentIrnRecord = useMemo(() => {
    if (genSource === 'irn' && selectedIrn) {
      return eInvoices.find((e) => e.irn === selectedIrn);
    }
    if (currentInvoice) {
      return eInvoices.find(
        (e) => (e.invoiceId === currentInvoice.id || e.invoiceNumber === currentInvoice.invoiceNumber) && e.status === 'GENERATED'
      );
    }
    return undefined;
  }, [eInvoices, genSource, selectedIrn, currentInvoice]);

  // Filtered list
  const filteredEWayBills = useMemo(() => {
    return eWayBills.filter((ewb) => {
      const matchesSearch =
        ewb.ewbNo.includes(searchQuery) ||
        ewb.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ewb.toTradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ewb.toGstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ewb.vehicleNo && ewb.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ? true : ewb.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [eWayBills, searchQuery, statusFilter]);

  // Metrics
  const activeCount = useMemo(() => eWayBills.filter((e) => e.status === 'ACT').length, [eWayBills]);
  const cancelledCount = useMemo(() => eWayBills.filter((e) => e.status === 'CNL').length, [eWayBills]);

  // Handle Generate E-Way Bill
  const handleGenerate = async () => {
    if (!currentInvoice) {
      setGenerationError('Please select a valid sales invoice or IRN to generate an E-Way Bill.');
      return;
    }

    if (transMode === '1' && !vehicleNo.trim() && !transporterId.trim()) {
      setGenerationError('For Road transport, either Vehicle Number (Part B) or Transporter ID (Part A assignment) is required.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);

    const payload: EWayBillGenerateRequest = {
      invoiceId: currentInvoice.id,
      invoiceNumber: currentInvoice.invoiceNumber,
      irn: currentIrnRecord?.irn,
      supplyType: 'Outward',
      subSupplyType,
      docType: 'INV',
      docNo: currentInvoice.invoiceNumber,
      docDate: currentInvoice.invoiceDate,
      fromGstin: company.gstin || '27AABCS1429B1Z8',
      fromTradeName: company.tradeName || company.name,
      fromAddress: company.address,
      fromPlace: company.city,
      fromPincode: company.pincode || '400093',
      fromStateCode: company.stateCode || '27',
      toGstin: currentInvoice.customerGstin || '27AAACA9012K1ZP',
      toTradeName: currentInvoice.customerTradeName || currentInvoice.customerName,
      toAddress: currentInvoice.billingAddress,
      toPlace: currentInvoice.customerState,
      toPincode: currentInvoice.customerPincode || '400064',
      toStateCode: currentInvoice.customerStateCode || '27',
      totalValue: currentInvoice.grandTotal,
      totalTaxable: currentInvoice.totalTaxable,
      cgstValue: currentInvoice.cgstTotal,
      sgstValue: currentInvoice.sgstTotal,
      igstValue: currentInvoice.igstTotal,
      items: currentInvoice.items.map((it) => ({
        productName: it.description,
        hsnCode: it.hsnSac || '847130',
        quantity: it.qty,
        unit: it.unit,
        taxableAmount: it.taxableAmount,
        cgstRate: it.cgstRate,
        sgstRate: it.sgstRate,
        igstRate: it.igstRate,
        totalAmount: it.totalAmount,
      })),
      transporterId: transporterId.trim(),
      transporterName: transporterName.trim(),
      transMode,
      transDocNo: transDocNo.trim(),
      transDocDate: transDocDate || undefined,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      vehicleType,
      distance: Number(distanceKm) || 50,
      forceSandbox,
    };

    const res = await EWayBillService.generateEWayBill(payload);
    setIsGenerating(false);

    if (!res.success || !res.data) {
      setGenerationError(res.error || 'Failed to generate statutory E-Way Bill');
      return;
    }

    onSaveEWayBill(res.data);
    setSelectedEwb(res.data);
    setIsDetailModalOpen(true);
    setGenerationSuccess(
      res.isSandbox
        ? '⚡ [SANDBOX DEMO] E-Way Bill generated successfully for testing without statutory tax liability.'
        : 'Statutory E-Way Bill generated successfully on official NIC Portal.'
    );
    setActiveTab('list');
  };

  // Open Part B modal
  const handleOpenPartB = (ewb: EWayBillRecord) => {
    setPartBTarget(ewb);
    setPartBVehicleNo(ewb.vehicleNo || '');
    setPartBFromPlace(ewb.fromPlace || 'Transit Hub');
    setPartBFromState(ewb.fromStateCode || '27');
    setPartBReasonCode('2');
    setPartBRemarks('');
    setPartBTransDocNo(ewb.transDocNo || '');
    setPartBError(null);
    setIsPartBModalOpen(true);
  };

  // Submit Part B update
  const handleExecutePartB = async () => {
    if (!partBTarget) return;
    if (!partBVehicleNo.trim()) {
      setPartBError('Valid vehicle registration number is required.');
      return;
    }
    if (!partBFromPlace.trim()) {
      setPartBError('Current transit location is required.');
      return;
    }

    setIsUpdatingPartB(true);
    setPartBError(null);

    const res = await EWayBillService.updatePartB({
      ewbNo: partBTarget.ewbNo,
      vehicleNo: partBVehicleNo.trim().toUpperCase(),
      fromPlace: partBFromPlace.trim(),
      fromState: partBFromState,
      reasonCode: partBReasonCode,
      reasonRemarks: partBRemarks.trim() || 'Vehicle reassigned in transit',
      transDocNo: partBTransDocNo.trim() || undefined,
    });

    setIsUpdatingPartB(false);

    if (!res.success) {
      setPartBError(res.error || 'Failed to update Part B on E-Way Bill portal');
      return;
    }

    onUpdatePartB(partBTarget.ewbNo, {
      vehicleNo: partBVehicleNo.trim().toUpperCase(),
      fromPlace: partBFromPlace.trim(),
      fromState: partBFromState,
      reasonCode: partBReasonCode,
      reasonRemarks: partBRemarks.trim() || 'Vehicle reassigned in transit',
      transDocNo: partBTransDocNo.trim() || undefined,
    });

    setIsPartBModalOpen(false);
    setPartBTarget(null);
  };

  // Open Extend Validity modal
  const handleOpenExtend = (ewb: EWayBillRecord) => {
    setExtendTarget(ewb);
    setExtendRemainingDistance(Math.round(ewb.distance / 2) || 50);
    setExtendCurrentPlace(ewb.toPlace || 'In Transit');
    setExtendReasonCode('2');
    setExtendRemarks('');
    setExtendError(null);
    setIsExtendModalOpen(true);
  };

  // Submit Extend Validity
  const handleExecuteExtend = async () => {
    if (!extendTarget) return;
    if (!extendRemarks.trim() || extendRemarks.trim().length < 3) {
      setExtendError('Please state the valid operational delay reason (min 3 chars).');
      return;
    }

    setIsExtending(true);
    setExtendError(null);

    const res = await EWayBillService.extendValidity({
      ewbNo: extendTarget.ewbNo,
      remainingDistance: Number(extendRemainingDistance),
      currentPlace: extendCurrentPlace.trim(),
      reasonCode: extendReasonCode,
      remarks: extendRemarks.trim(),
    });

    setIsExtending(false);

    if (!res.success) {
      setExtendError(res.error || 'Failed to extend validity on portal');
      return;
    }

    onExtendValidity(extendTarget.ewbNo, {
      remainingDistance: Number(extendRemainingDistance),
      currentPlace: extendCurrentPlace.trim(),
      reasonCode: extendReasonCode,
      remarks: extendRemarks.trim(),
    });

    setIsExtendModalOpen(false);
    setExtendTarget(null);
  };

  // Open Cancel Modal
  const handleOpenCancel = (ewb: EWayBillRecord) => {
    setCancelTarget(ewb);
    setCancelReason('1');
    setCancelRemarks('');
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  // Submit Cancel
  const handleExecuteCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelRemarks.trim() || cancelRemarks.trim().length < 3) {
      setCancelError('Mandatory remarks required for cancellation (min 3 characters).');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    const res = await EWayBillService.cancelEWayBill({
      ewbNo: cancelTarget.ewbNo,
      cancelReason,
      cancelRemarks: cancelRemarks.trim(),
    });

    setIsCancelling(false);

    if (!res.success) {
      setCancelError(res.error || 'Failed to cancel E-Way Bill');
      return;
    }

    onCancelEWayBill(cancelTarget.ewbNo, cancelReason, cancelRemarks.trim());
    setIsCancelModalOpen(false);
    setCancelTarget(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Overview */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-blue-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                <Truck className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {language === 'hi' ? 'ई-वे बिल प्रणाली (GST E-Way Bill)' : 'Statutory E-Way Bill Management (GST Rule 138)'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30">
                Rule 138 Compliant
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                {configStatus?.sandboxMode ? 'Sandbox Demo Mode Active' : 'Production Mode'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Generate 12-digit statutory E-Way Bills from invoices or active IRNs. Manage Part B vehicle assignments, transit extensions, 24-hour statutory cancellations, and official printable consignment slips.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1.5 ${
                activeTab === 'generate'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-blue-600/80 hover:bg-blue-600 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'नया ई-वे बिल बनाएं' : '+ Generate E-Way Bill'}</span>
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
              <span>{language === 'hi' ? 'पोर्टल चेकलिस्ट' : 'Portal Checklist'}</span>
            </button>
          </div>
        </div>

        {/* Prominent Sandbox Disclosure Banner as required */}
        <div className="mt-4 pt-3 border-t border-blue-800/60 flex items-start sm:items-center justify-between gap-3 text-xs text-amber-200 bg-amber-950/30 -mx-2 sm:-mx-3 px-3 py-2 rounded-xl border border-amber-500/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">
              <strong>[DEMO SANDBOX MODE ACTIVE]:</strong> E-Way Bill numbers (12-digit) and validity cycles are calculated per statutory Rule 138(10) for verification and testing. No real transit permits are issued on the live NIC portal until production credentials are configured.
            </span>
          </div>
          <span className="text-[11px] font-mono shrink-0 bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
            No Transit Enforcement
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'hi' ? 'ई-वे बिल रजिस्टर' : 'E-Way Bills Registry'}</span>
            <span className="ml-1.5 px-2 py-0.2 rounded-full text-[11px] bg-slate-100 text-slate-700">
              {eWayBills.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'generate'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'hi' ? 'ई-वे बिल जेनेरेटर' : 'Generate E-Way Bill'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'checklist'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'hi' ? 'पोर्टल चेकलिस्ट' : 'Portal Checklist & Rules'}</span>
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="text-xs text-slate-500 hidden sm:block">
            Showing <strong className="text-slate-800">{filteredEWayBills.length}</strong> of {eWayBills.length} records
          </div>
        )}
      </div>

      {/* TAB 1: LIST VIEW */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium">Total Consignments</span>
              <div className="text-xl font-black text-slate-900 mt-1">{eWayBills.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-blue-600 text-xs font-medium">Active (In Transit)</span>
              <div className="text-xl font-black text-blue-700 mt-1">{activeCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-rose-600 text-xs font-medium">Cancelled E-Way Bills</span>
              <div className="text-xl font-black text-rose-700 mt-1">{cancelledCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-violet-600 text-xs font-medium">Sandbox Simulated</span>
              <div className="text-xl font-black text-violet-700 mt-1">
                {eWayBills.filter((e) => e.isSandbox).length}
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by E-Way Bill No, Doc No, Recipient, Vehicle..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                  onClick={() => setStatusFilter('ACT')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === 'ACT' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CNL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === 'CNL' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {filteredEWayBills.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No E-Way Bills Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {eWayBills.length === 0
                    ? 'No statutory E-Way Bills have been created yet. Generate one directly from an invoice or an active e-invoice IRN.'
                    : 'No E-Way Bills match your active search and filter query.'}
                </p>
                {eWayBills.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('generate')}
                    className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Create Your First E-Way Bill</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">E-Way Bill No & Date</th>
                      <th className="px-4 py-3">Document & Goods Value</th>
                      <th className="px-4 py-3">From & To Details</th>
                      <th className="px-4 py-3">Vehicle (Part B)</th>
                      <th className="px-4 py-3">Validity</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEWayBills.map((item) => {
                      const isValid = item.status === 'ACT' && new Date(item.validUpto).getTime() > Date.now();
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-mono font-bold text-slate-900">{item.ewbNo}</div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(item.ewbDate).toLocaleDateString('en-IN')}
                            </div>
                            {item.isSandbox && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                [SANDBOX DEMO]
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{item.docNo}</div>
                            <div className="font-bold text-slate-900 mt-0.5">
                              {formatINR(item.totalValue)}
                            </div>
                            {item.irn && (
                              <span className="text-[10px] text-violet-700 font-mono">
                                IRN: {item.irn.substring(0, 10)}...
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800 truncate max-w-xs">
                              To: {item.toTradeName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.fromPlace} ({item.fromPincode}) → {item.toPlace} ({item.toPincode})
                            </div>
                            <div className="text-[10px] text-slate-400">{item.distance} KM</div>
                          </td>
                          <td className="px-4 py-3">
                            {item.vehicleNo ? (
                              <div>
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {item.vehicleNo}
                                </span>
                                {item.partBHistory.length > 1 && (
                                  <div className="text-[10px] text-blue-600 mt-0.5 font-medium">
                                    {item.partBHistory.length} assignments
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-700 font-semibold text-[11px]">
                                Part B Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'CNL'
                                  ? 'bg-rose-100 text-rose-800'
                                  : isValid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status === 'CNL'
                                ? 'Cancelled'
                                : isValid
                                ? 'Valid Active'
                                : 'Expired'}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Until {new Date(item.validUpto).toLocaleDateString('en-IN')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEwb(item);
                                  setIsDetailModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                                title="View & Print Official E-Way Bill Slip"
                              >
                                View / Print
                              </button>

                              {item.status === 'ACT' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPartB(item)}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer flex items-center space-x-1"
                                    title="Update Vehicle Number (Part B)"
                                  >
                                    <Edit3 className="w-3 h-3 text-slate-600" />
                                    <span className="hidden lg:inline">Part B</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenExtend(item)}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer flex items-center space-x-1"
                                    title="Extend E-Way Bill Validity"
                                  >
                                    <Clock className="w-3 h-3 text-slate-600" />
                                    <span className="hidden lg:inline">Extend</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancel(item)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title="Cancel within statutory 24-hour window"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
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
        </div>
      )}

      {/* TAB 2: GENERATION FORM */}
      {activeTab === 'generate' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Generate Statutory E-Way Bill (Part A & Part B)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generate official consignment documentation under GST Rule 138. Fill in consignment movement details and vehicle assignment.
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

          {/* Generation Source Toggle */}
          <div className="flex items-center space-x-3 bg-slate-100 p-1 rounded-xl max-w-md text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGenSource('invoice')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                genSource === 'invoice' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              From Sales Invoice
            </button>
            <button
              type="button"
              onClick={() => setGenSource('irn')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                genSource === 'irn' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              From E-Invoice (IRN)
            </button>
          </div>

          {/* Document Picker */}
          {genSource === 'invoice' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Select Sales Invoice <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  setGenerationError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Choose an Issued Tax Invoice --</option>
                {sales
                  .filter((s) => s.status !== 'Cancelled')
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} | {inv.customerName} ({inv.invoiceDate}) - {formatINR(inv.grandTotal)}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Select Active E-Invoice (IRN) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedIrn}
                onChange={(e) => {
                  setSelectedIrn(e.target.value);
                  setGenerationError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Choose an Active Statutory IRN --</option>
                {eInvoices
                  .filter((e) => e.status === 'GENERATED')
                  .map((einv) => (
                    <option key={einv.id} value={einv.irn}>
                      IRN: {einv.irn.substring(0, 16)}... | Inv: {einv.invoiceNumber} | {einv.buyerLegalName} ({formatINR(einv.totalInvoiceValue)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Document Summary */}
          {currentInvoice && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Dispatch From (Supplier):</span>
                <div className="font-bold text-slate-800">{company.name}</div>
                <div className="font-mono text-slate-600">{company.gstin}</div>
                <div className="text-slate-500">Pin: {company.pincode}</div>
              </div>

              <div>
                <span className="text-slate-500">Ship To (Consignee):</span>
                <div className="font-bold text-slate-800">{currentInvoice.customerName}</div>
                <div className="font-mono text-slate-600">{currentInvoice.customerGstin || 'Unregistered'}</div>
                <div className="text-slate-500">Pin: {currentInvoice.customerPincode || '400064'}</div>
              </div>

              <div>
                <span className="text-slate-500">Document Value:</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {formatINR(currentInvoice.grandTotal)}
                </div>
                <div className="text-slate-500">Taxable: {formatINR(currentInvoice.totalTaxable)}</div>
              </div>

              <div>
                <span className="text-slate-500">Linked IRN:</span>
                <div className="font-mono text-[11px] text-slate-800 truncate" title={currentIrnRecord?.irn || 'None'}>
                  {currentIrnRecord ? `${currentIrnRecord.irn.substring(0, 16)}...` : 'Direct Invoice (No IRN)'}
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {currentIrnRecord ? 'NIC Schema Synchronized' : 'Standalone E-Way Bill'}
                </span>
              </div>
            </div>
          )}

          {/* Part B Transport & Vehicle Form */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Part B: Transport & Vehicle Information</span>
              <span className="text-[10px] font-normal text-slate-500">(Required for valid movement)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Transport Mode</label>
                <select
                  value={transMode}
                  onChange={(e) => setTransMode(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 - Road</option>
                  <option value="2">2 - Rail</option>
                  <option value="3">3 - Air</option>
                  <option value="4">4 - Ship</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">
                  Approx. Distance (in KM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={4000}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500">
                  Rule 138(10): ~{Math.max(1, Math.ceil(distanceKm / 200))} days validity
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="R">Regular Cargo (200 KM / Day)</option>
                  <option value="O">Over Dimensional Cargo (20 KM / Day)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">
                  Vehicle Number {transMode === '1' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH02AB1234"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Transporter Name</label>
                <input
                  type="text"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. VRL Logistics Ltd"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Transporter ID (GSTIN/TRANSIN)</label>
                <input
                  type="text"
                  value={transporterId}
                  onChange={(e) => setTransporterId(e.target.value)}
                  placeholder="15-digit GSTIN or TRANSIN"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Transport Doc No (LR / RR / B/L)</label>
                <input
                  type="text"
                  value={transDocNo}
                  onChange={(e) => setTransDocNo(e.target.value)}
                  placeholder="e.g. LR/2026/8901"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceSandbox}
                  onChange={(e) => setForceSandbox(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Run in Sandbox Demo Mode (Safe simulation)</span>
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
                disabled={!currentInvoice || isGenerating}
                onClick={handleGenerate}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting to Portal...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Generate Statutory E-Way Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHECKLIST & RULES */}
      {activeTab === 'checklist' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>GST Rule 138 E-Way Bill Statutory Verification Checklist</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify legal conditions, validity periods, and multi-vehicle transshipment rules before live transit operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">1. Mandatory Consignment Threshold</h4>
              <p className="text-slate-600 leading-relaxed">
                An E-Way Bill is mandatory under GST Rule 138 when moving goods where consignment value exceeds <strong>₹50,000</strong> (or interstate mandatory threshold).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">2. Validity Calculation (Rule 138(10))</h4>
              <p className="text-slate-600 leading-relaxed">
                For regular cargo: <strong>1 day per 200 KM</strong> (or part thereof). For Over Dimensional Cargo: <strong>1 day per 20 KM</strong>. Validity terminates at midnight of the last validity day.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">3. Part B Update (Vehicle Reassignment)</h4>
              <p className="text-slate-600 leading-relaxed">
                If the vehicle breaks down or goods undergo transshipment, Part B must be updated before resuming movement on the highway.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">4. Validity Extension & 24-Hour Cancellation</h4>
              <p className="text-slate-600 leading-relaxed">
                Validity can be extended within 8 hours before or after expiry due to traffic, accident, or natural delays. Cancellation must take place within 24 hours of generation provided goods are not checked in transit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL / PRINT SLIP MODAL */}
      {isDetailModalOpen && selectedEwb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 print:p-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Official GST E-Way Bill Consignment Slip
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    EWB No: {selectedEwb.ewbNo} | Document: {selectedEwb.docNo}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sandbox banner */}
            {selectedEwb.isSandbox && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2 print:hidden">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>[DEMO SANDBOX RECORD]:</strong> This E-Way Bill was simulated for testing. Not valid for live highway inspection without production credentials.
                </span>
              </div>
            )}

            {/* Printable Consignment Slip Layout */}
            <div className="border border-slate-300 rounded-xl p-5 space-y-4 text-xs bg-white text-slate-800">
              {/* Slip Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="text-base font-black tracking-wide uppercase text-slate-900">
                  Government of India - GST E-Way Bill System
                </div>
                <div className="text-[11px] text-slate-500">
                  Standard Statutory Consignment Note (Form GST EWB-01)
                </div>
              </div>

              {/* Core Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">E-Way Bill Number:</span>
                  <div className="text-sm font-black font-mono text-slate-900">{selectedEwb.ewbNo}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Generated Date & Time:</span>
                  <div className="font-semibold text-slate-800">
                    {new Date(selectedEwb.ewbDate).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Valid Upto:</span>
                  <div className="font-bold text-emerald-700">
                    {new Date(selectedEwb.validUpto).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Part A Details Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                  PART - A (Consignment Information)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700">From (Supplier / Dispatcher):</span>
                    <div>GSTIN: <span className="font-mono font-bold">{selectedEwb.fromGstin}</span></div>
                    <div>Name: {selectedEwb.fromTradeName}</div>
                    <div>Address: {selectedEwb.fromAddress}, {selectedEwb.fromPlace} ({selectedEwb.fromPincode})</div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-700">To (Recipient / Consignee):</span>
                    <div>GSTIN: <span className="font-mono font-bold">{selectedEwb.toGstin}</span></div>
                    <div>Name: {selectedEwb.toTradeName}</div>
                    <div>Address: {selectedEwb.toAddress}, {selectedEwb.toPlace} ({selectedEwb.toPincode})</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-500">Doc Type & No:</span>
                    <div className="font-bold text-slate-800">{selectedEwb.docType} - {selectedEwb.docNo}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Doc Date:</span>
                    <div className="text-slate-800">{selectedEwb.docDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Goods Value:</span>
                    <div className="font-bold text-slate-900">{formatINR(selectedEwb.totalValue)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Approx. Distance:</span>
                    <div className="font-bold text-slate-800">{selectedEwb.distance} KM</div>
                  </div>
                </div>
              </div>

              {/* Part B Transport Table */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                  PART - B (Vehicle & Transporter Movement)
                </h4>
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-50 text-slate-600 text-[11px]">
                    <tr>
                      <th className="p-2 border-b">Mode</th>
                      <th className="p-2 border-b">Vehicle No</th>
                      <th className="p-2 border-b">From Location</th>
                      <th className="p-2 border-b">Doc No & Date</th>
                      <th className="p-2 border-b">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {selectedEwb.partBHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-slate-500 italic">
                          No vehicle entered yet (Part B unassigned)
                        </td>
                      </tr>
                    ) : (
                      selectedEwb.partBHistory.map((h, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">Road</td>
                          <td className="p-2 font-mono font-bold">{h.vehicleNo}</td>
                          <td className="p-2">{h.fromPlace} ({h.fromState})</td>
                          <td className="p-2">{h.transDocNo || '-'}</td>
                          <td className="p-2 text-slate-500">
                            {new Date(h.updatedAt).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PART B MODAL */}
      {isPartBModalOpen && partBTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-blue-600">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Update Part B (Vehicle Assignment)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPartBModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Updating vehicle for E-Way Bill <strong>{partBTarget.ewbNo}</strong>. Ensure correct registration number before movement resumes.
            </p>

            {partBError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {partBError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">
                  New Vehicle Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={partBVehicleNo}
                  onChange={(e) => setPartBVehicleNo(e.target.value)}
                  placeholder="e.g. MH04CD5678"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">From Place (Current)</label>
                  <input
                    type="text"
                    value={partBFromPlace}
                    onChange={(e) => setPartBFromPlace(e.target.value)}
                    placeholder="e.g. Pune Hub"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">State Code</label>
                  <input
                    type="text"
                    value={partBFromState}
                    onChange={(e) => setPartBFromState(e.target.value)}
                    placeholder="e.g. 27"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Reason for Vehicle Change</label>
                <select
                  value={partBReasonCode}
                  onChange={(e) => setPartBReasonCode(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 - Due to Vehicle Breakdown</option>
                  <option value="2">2 - Due to Transshipment / Hub Transfer</option>
                  <option value="3">3 - Others</option>
                  <option value="4">4 - First Time Assignment</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Remarks</label>
                <input
                  type="text"
                  value={partBRemarks}
                  onChange={(e) => setPartBRemarks(e.target.value)}
                  placeholder="Optional explanatory notes..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPartBModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingPartB}
                onClick={handleExecutePartB}
                className="px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                {isUpdatingPartB ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating on Portal...</span>
                  </>
                ) : (
                  <span>Update Part B</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND VALIDITY MODAL */}
      {isExtendModalOpen && extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Clock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Extend E-Way Bill Validity</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Per Rule 138(10), validity can be extended when goods cannot reach destination within original period due to accident, calamity, or transit delays.
            </p>

            {extendError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {extendError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">
                  Remaining Distance to Destination (KM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={extendRemainingDistance}
                  onChange={(e) => setExtendRemainingDistance(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Current Location of Consignment</label>
                <input
                  type="text"
                  value={extendCurrentPlace}
                  onChange={(e) => setExtendCurrentPlace(e.target.value)}
                  placeholder="e.g. Thane Toll Naka"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Reason for Extension</label>
                <select
                  value={extendReasonCode}
                  onChange={(e) => setExtendReasonCode(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1">1 - Natural Calamity</option>
                  <option value="2">2 - Transshipment Delay</option>
                  <option value="3">3 - Accident / Breakdown</option>
                  <option value="4">4 - Traffic Congestion</option>
                  <option value="5">5 - Law and Order Issue</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">
                  Detailed Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={extendRemarks}
                  onChange={(e) => setExtendRemarks(e.target.value)}
                  placeholder="Explain why delivery could not be completed in time..."
                  rows={2}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExtending}
                onClick={handleExecuteExtend}
                className="px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                {isExtending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extending...</span>
                  </>
                ) : (
                  <span>Extend Validity</span>
                )}
              </button>
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
                <h3 className="text-sm font-bold text-slate-900">Cancel Statutory E-Way Bill</h3>
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
              Cancelling E-Way Bill <strong>{cancelTarget.ewbNo}</strong>. Under GST Rule 138(9), cancellation can only be done within <strong>24 hours</strong> of generation.
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
                  <option value="1">1 - Duplicate Consignment Entry</option>
                  <option value="2">2 - Order Cancelled</option>
                  <option value="3">3 - Data Entry Mistake</option>
                  <option value="4">4 - Others</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Mandatory Cancellation Remarks</label>
                <textarea
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  placeholder="State the reason for cancelling this transit permit..."
                  rows={2}
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
                    <span>Cancelling on Portal...</span>
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
