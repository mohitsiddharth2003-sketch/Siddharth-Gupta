import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileCheck2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  CreditCard,
  Building,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  TDSRecord,
  TDSSectionCode,
  TDSStatus,
  Party,
  Language,
} from '../types/accounting';
import {
  formatINR,
  validatePAN,
  TDS_SECTIONS_CONFIG,
} from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface TDSManagerModuleProps {
  tdsRecords: TDSRecord[];
  parties: Party[];
  language: Language;
  onSaveTDS: (record: TDSRecord) => void;
  onDeleteTDS: (id: string, reason: string) => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

export const TDSManagerModule: React.FC<TDSManagerModuleProps> = ({
  tdsRecords,
  parties,
  language,
  onSaveTDS,
  onDeleteTDS,
  isCreateOpen,
  setIsCreateOpen,
}) => {
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [editingRecord, setEditingRecord] = useState<TDSRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TDSRecord | null>(null);

  // Challan Deposit Modal state
  const [depositModalRecord, setDepositModalRecord] = useState<TDSRecord | null>(null);
  const [challanBsr, setChallanBsr] = useState('0210045');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanSerial, setChallanSerial] = useState('04918');

  // Form State
  const [formData, setFormData] = useState<Partial<TDSRecord>>({
    sectionCode: '194J_PROF',
    section: '194J',
    sectionTitle: 'Fees for Professional Services',
    partyId: '',
    partyName: '',
    partyPan: '',
    invoiceOrRef: '',
    transactionDate: new Date().toISOString().split('T')[0],
    paymentAmount: 0,
    applicableRate: 10,
    isHigherDeduction206AA: false,
    tdsDeducted: 0,
    tdsDeposited: 0,
    dueDate: '2026-05-07',
    status: 'Pending',
    flagForReview: false,
    reviewReason: '',
  });

  const [formError, setFormError] = useState('');

  // Handle section selection
  const handleSectionSelect = (code: TDSSectionCode) => {
    const config = TDS_SECTIONS_CONFIG.find((s) => s.sectionCode === code);
    if (!config) return;

    let rate = config.defaultRate;
    let is206AA = false;
    let flag = false;
    let reason = '';

    // If PAN is missing, section 206AA mandates minimum 20%
    if (!formData.partyPan || !validatePAN(formData.partyPan).valid) {
      rate = 20;
      is206AA = true;
      flag = true;
      reason = 'Section 206AA Alert: Higher rate of 20% enforced due to missing/invalid PAN.';
    }

    const deducted = Number((((formData.paymentAmount || 0) * rate) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      sectionCode: code,
      section: config.section,
      sectionTitle: config.title,
      applicableRate: rate,
      isHigherDeduction206AA: is206AA,
      tdsDeducted: deducted,
      flagForReview: flag,
      reviewReason: reason,
    }));
  };

  // Handle Party selection
  const handlePartySelect = (partyId: string) => {
    const p = parties.find((item) => item.id === partyId);
    if (!p) return;

    let pan = p.pan || '';
    let rate = formData.applicableRate ?? 10;
    let is206AA = false;
    let flag = false;
    let reason = '';

    if (!pan || !validatePAN(pan).valid) {
      rate = 20;
      is206AA = true;
      flag = true;
      reason = 'Section 206AA Alert: Party PAN missing. Enforcing higher 20% deduction.';
    } else {
      const config = TDS_SECTIONS_CONFIG.find((s) => s.sectionCode === formData.sectionCode);
      rate = config?.defaultRate ?? 10;
    }

    const deducted = Number((((formData.paymentAmount || 0) * rate) / 100).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      partyId: p.id,
      partyName: p.name,
      partyPan: pan,
      applicableRate: rate,
      isHigherDeduction206AA: is206AA,
      tdsDeducted: deducted,
      flagForReview: flag,
      reviewReason: reason,
    }));
  };

  // Handle Amount change
  const handleAmountChange = (amt: number) => {
    const rate = formData.applicableRate ?? 10;
    const deducted = Number(((amt * rate) / 100).toFixed(2));

    const config = TDS_SECTIONS_CONFIG.find((s) => s.sectionCode === formData.sectionCode);
    let flag = formData.flagForReview ?? false;
    let reason = formData.reviewReason ?? '';

    if (config && amt > config.thresholdLimit && !formData.isHigherDeduction206AA) {
      flag = true;
      reason = `Statutory threshold of ${formatINR(config.thresholdLimit)} exceeded. Verify TDS applicability.`;
    }

    setFormData((prev) => ({
      ...prev,
      paymentAmount: amt,
      tdsDeducted: deducted,
      flagForReview: flag,
      reviewReason: reason,
    }));
  };

  const handleStartEdit = (rec: TDSRecord) => {
    setEditingRecord(rec);
    setFormData({ ...rec });
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingRecord(null);
    setFormError('');
    setFormData({
      sectionCode: '194J_PROF',
      section: '194J',
      sectionTitle: 'Fees for Professional Services',
      partyId: '',
      partyName: '',
      partyPan: '',
      invoiceOrRef: '',
      transactionDate: new Date().toISOString().split('T')[0],
      paymentAmount: 0,
      applicableRate: 10,
      isHigherDeduction206AA: false,
      tdsDeducted: 0,
      tdsDeposited: 0,
      dueDate: '2026-05-07',
      status: 'Pending',
      flagForReview: false,
      reviewReason: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.partyName?.trim()) {
      setFormError(language === 'hi' ? 'कृपया पार्टी / कटौतीकर्ता का नाम दर्ज करें' : 'Please provide deductee party name');
      return;
    }

    if (!formData.paymentAmount || formData.paymentAmount <= 0) {
      setFormError(language === 'hi' ? 'कृपया मान्य भुगतान राशि दर्ज करें' : 'Please enter valid payment amount');
      return;
    }

    const recordToSave: TDSRecord = {
      id: editingRecord ? editingRecord.id : `tds_${Date.now()}`,
      sectionCode: formData.sectionCode as TDSSectionCode,
      section: formData.section || '194J',
      sectionTitle: formData.sectionTitle || 'TDS Deduction',
      partyId: formData.partyId,
      partyName: formData.partyName.trim(),
      partyPan: formData.partyPan?.trim().toUpperCase() || '',
      invoiceOrRef: formData.invoiceOrRef?.trim() || '',
      transactionDate: formData.transactionDate || new Date().toISOString().split('T')[0],
      paymentAmount: Number(formData.paymentAmount),
      applicableRate: Number(formData.applicableRate),
      isHigherDeduction206AA: formData.isHigherDeduction206AA ?? false,
      tdsDeducted: Number(formData.tdsDeducted),
      tdsDeposited: Number(formData.tdsDeposited) || 0,
      dueDate: formData.dueDate || '2026-05-07',
      status: (formData.status as TDSStatus) || 'Pending',
      flagForReview: formData.flagForReview ?? false,
      reviewReason: formData.reviewReason,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    onSaveTDS(recordToSave);
    handleCloseModal();
  };

  // Submit Challan ITNS-281
  const handleRecordChallan = () => {
    if (!depositModalRecord) return;

    const updated: TDSRecord = {
      ...depositModalRecord,
      status: 'Deposited',
      tdsDeposited: depositModalRecord.tdsDeducted,
      challanBsrCode: challanBsr.trim(),
      challanTenderDate: challanDate,
      challanSerialNo: challanSerial.trim(),
    };

    onSaveTDS(updated);
    setDepositModalRecord(null);
  };

  // Filtered
  const filteredTds = useMemo(() => {
    return tdsRecords.filter((t) => {
      const matchSearch =
        t.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.partyPan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.section.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSec = sectionFilter === 'All' || t.section === sectionFilter;
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchSearch && matchSec && matchStatus;
    });
  }, [tdsRecords, searchTerm, sectionFilter, statusFilter]);

  const totalDeducted = useMemo(() => {
    return filteredTds.reduce((acc, curr) => acc + curr.tdsDeducted, 0);
  }, [filteredTds]);

  const totalPending = useMemo(() => {
    return filteredTds
      .filter((t) => t.status === 'Pending')
      .reduce((acc, curr) => acc + curr.tdsDeducted, 0);
  }, [filteredTds]);

  return (
    <div className="space-y-5">
      {/* Statutory Disclaimer Notice Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block text-sm mb-0.5">
              {language === 'hi' ? 'वैधानिक टीडीएस अनुपालन सूचना' : 'Statutory TDS Compliance Notice'}
            </span>
            {language === 'hi'
              ? 'कटौती व चालान रिकॉर्डिंग केवल आंतरिक तैयारी एवं धारा 194 मिलान हेतु है। फॉर्म 26Q/24Q त्रैमासिक विवरणी आधिकारिक आयकर ई-फाइलिंग पोर्टल / TRACES पर ही दाखिल की जानी चाहिए। रिटर्न स्वतः फाइल होने का दावा नहीं किया जाता।'
              : 'TDS deduction registers and ITNS-281 challans are maintained for statutory ledger reconciliation and audit preparation. Quarterly TDS returns (Form 26Q / 24Q) must be submitted directly through TIN-FC or the official Income Tax portal (eportal.incometax.gov.in / traces.gov.in). This application does not claim to file returns automatically.'}
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.tds.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t.tds.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingRecord(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.tds.newRecord}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total TDS Deducted (Period)
          </span>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatINR(totalDeducted)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredTds.length} Transactions
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Pending ITNS-281 Deposit
          </span>
          <div className="text-xl font-bold font-mono text-rose-600">
            {formatINR(totalPending)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Due by 7th of next month</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Section 206AA & Review Alerts
          </span>
          <div className="text-xl font-bold font-mono text-amber-600">
            {filteredTds.filter((t) => t.flagForReview).length} Flagged
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            Requires professional CA scrutiny
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deductee party, PAN, section..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All TDS Sections</option>
            <option value="194C">194C (Contractors)</option>
            <option value="194J">194J (Professional/Tech)</option>
            <option value="194I(a)">194I (Rent Land/Bldg)</option>
            <option value="194H">194H (Commission)</option>
            <option value="194Q">194Q (Goods &gt; ₹50L)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Deposit Statuses</option>
            <option value="Pending">Pending Deposit</option>
            <option value="Deposited">Deposited via Challan</option>
          </select>
        </div>
      </div>

      {/* TDS Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.tds.section}</th>
                <th className="py-3 px-4">{t.tds.deductee}</th>
                <th className="py-3 px-4">{t.tds.pan}</th>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4 text-right">Gross Payment</th>
                <th className="py-3 px-4 text-center">Rate %</th>
                <th className="py-3 px-4 text-right">TDS Deducted</th>
                <th className="py-3 px-4 text-center">{t.tds.depositStatus}</th>
                <th className="py-3 px-4">Due Date / Challan</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTds.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredTds.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                        {rec.section}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{rec.partyName}</div>
                      {rec.flagForReview && (
                        <div className="text-[11px] text-amber-700 font-medium flex items-center space-x-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{rec.reviewReason || 'Flagged for review'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {rec.partyPan ? (
                        <span className="font-semibold text-slate-800">{rec.partyPan}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          ABSENT PAN (20%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.transactionDate}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatINR(rec.paymentAmount)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={`font-bold ${
                          rec.isHigherDeduction206AA ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {rec.applicableRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                      {formatINR(rec.tdsDeducted)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Deposited'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {rec.status === 'Deposited' ? (
                        <div className="font-mono text-slate-600">
                          BSR: {rec.challanBsrCode} | {rec.challanTenderDate}
                        </div>
                      ) : (
                        <div className="text-rose-600 font-semibold flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Due: {rec.dueDate}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {rec.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => setDepositModalRecord(rec)}
                            title={t.tds.recordDeposit}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(rec)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rec)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT TDS MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingRecord ? 'Edit TDS Record' : t.tds.newRecord}
                </h3>
                <p className="text-xs text-slate-500">Record Tax Deduction at Source under Chapter XVII-B</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.tds.section} *
                </label>
                <select
                  value={formData.sectionCode}
                  onChange={(e) => handleSectionSelect(e.target.value as TDSSectionCode)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {TDS_SECTIONS_CONFIG.map((c) => (
                    <option key={c.sectionCode} value={c.sectionCode}>
                      {c.section} - {c.title} (Std: {c.defaultRate}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Party selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Existing Party
                  </label>
                  <select
                    value={formData.partyId}
                    onChange={(e) => handlePartySelect(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">-- Choose Party --</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deductee Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Payee or Contractor Name"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deductee PAN (10 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="AAAAA0000A"
                    value={formData.partyPan}
                    onChange={(e) => {
                      const p = e.target.value.toUpperCase();
                      setFormData({ ...formData, partyPan: p });
                    }}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Invoice / Voucher Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EXP/26-27/003"
                    value={formData.invoiceOrRef}
                    onChange={(e) => setFormData({ ...formData, invoiceOrRef: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* 206AA Warning Banner if PAN missing */}
              {(!formData.partyPan || !validatePAN(formData.partyPan).valid) && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">⚠️ Section 206AA Compliance:</span>
                  PAN is missing or invalid. Higher rate of 20% will be deducted and reported in Form 26Q.
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formData.paymentAmount}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    TDS Rate % *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.01"
                    required
                    value={formData.applicableRate}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value) || 0;
                      const deducted = Number((((formData.paymentAmount || 0) * r) / 100).toFixed(2));
                      setFormData({ ...formData, applicableRate: r, tdsDeducted: deducted });
                    }}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    TDS Deducted (₹)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.tdsDeducted}
                    className="w-full font-mono font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-amber-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Challan Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 shadow-xs"
                >
                  Save TDS Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD CHALLAN DEPOSIT MODAL */}
      {depositModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Record ITNS-281 Challan Deposit
                </h3>
                <p className="text-xs text-slate-500">
                  {depositModalRecord.section} - {depositModalRecord.partyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDepositModalRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-mono">
                <span className="text-slate-600">Tax Deducted to Deposit:</span>
                <span className="font-bold text-emerald-700">{formatINR(depositModalRecord.tdsDeducted)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  7-Digit Bank BSR Code *
                </label>
                <input
                  type="text"
                  maxLength={7}
                  placeholder="0210045"
                  value={challanBsr}
                  onChange={(e) => setChallanBsr(e.target.value)}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Challan Tender Date *
                </label>
                <input
                  type="date"
                  value={challanDate}
                  onChange={(e) => setChallanDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Challan Serial Number *
                </label>
                <input
                  type="text"
                  placeholder="04918"
                  value={challanSerial}
                  onChange={(e) => setChallanSerial(e.target.value)}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDepositModalRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleRecordChallan}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title={`TDS Record (${deleteTarget?.section} - ${deleteTarget?.partyName})`}
        recordIdentifier={deleteTarget?.partyName || ''}
        onConfirm={(reason) => {
          if (deleteTarget) {
            onDeleteTDS(deleteTarget.id, reason);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
        language={language}
      />
    </div>
  );
};
