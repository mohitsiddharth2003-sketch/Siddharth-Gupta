import React, { useState } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  FileText,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Search,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import {
  CompanyProfile,
  AuditLogEntry,
  Language,
} from '../types/accounting';
import { INDIAN_STATES, validateGSTIN, validatePAN } from '../utils/indianFormatters';
import { translations } from '../utils/translations';

interface SettingsModuleProps {
  company: CompanyProfile;
  auditLogs: AuditLogEntry[];
  language: Language;
  onUpdateCompany: (comp: CompanyProfile) => void;
  onResetDemo: () => void;
  onOpenSafeReset?: () => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  company,
  auditLogs,
  language,
  onUpdateCompany,
  onResetDemo,
  onOpenSafeReset,
  onBackup,
  onRestore,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'company' | 'audit' | 'data'>('company');
  const [formData, setFormData] = useState<CompanyProfile>({ ...company });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Audit search
  const [auditSearch, setAuditSearch] = useState('');

  const handleStateChange = (stateCode: string) => {
    const s = INDIAN_STATES.find((item) => item.code === stateCode);
    if (!s) return;
    setFormData((prev) => ({
      ...prev,
      state: s.name,
      stateCode: s.code,
    }));
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.gstin) {
      const gstinVal = validateGSTIN(formData.gstin);
      if (!gstinVal.valid) {
        setErrorMessage(gstinVal.error || 'Invalid GSTIN');
        return;
      }
    }

    if (formData.pan) {
      const panVal = validatePAN(formData.pan);
      if (!panVal.valid) {
        setErrorMessage(panVal.error || 'Invalid PAN');
        return;
      }
    }

    onUpdateCompany(formData);
    setSuccessMessage('Company details and banking configuration updated successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onRestore(e.target.files[0]);
    }
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.module.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.user.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.settings.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure entity profile, banking, statutory numbering series and review immutable audit log
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'company'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.settings.companyProfile}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.settings.auditTrail} ({auditLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'data'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.settings.dataManagement}
        </button>
      </div>

      {/* TAB 1: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              1. Legal Entity & GST Registration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade / Brand Name</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (15 Digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Income Tax PAN *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State & State Code *</label>
                <select
                  value={formData.stateCode}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Address *</label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 resize-none"
              />
            </div>
          </div>

          {/* Bank Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              2. Bank Account Details (Printed on Invoices for NEFT/RTGS Remittances)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  value={formData.bankAccountNo}
                  onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  required
                  value={formData.bankIfsc}
                  onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={formData.bankBranch}
                  onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Numbering Series */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              3. Invoice Numbering & Financial Year
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Financial Year *</label>
                <input
                  type="text"
                  required
                  value={formData.financialYear}
                  onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix *</label>
                <input
                  type="text"
                  required
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Number Sequence</label>
                <input
                  type="number"
                  min="1"
                  value={formData.invoiceNextNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNextNumber: parseInt(e.target.value) || 1 })}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              Save Company Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by module, user, action or keyword..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filteredLogs.length} Logged Events
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Details & Statutory Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800'
                              : log.action === 'DELETE'
                              ? 'bg-rose-100 text-rose-800'
                              : log.action === 'MATCH'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{log.module}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.user}</td>
                      <td className="py-2.5 px-4 text-slate-700">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA MANAGEMENT */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Backup */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{t.common.backupData}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Export complete database containing all sales invoices, purchase bills, parties, ledgers and audit records as an offline JSON snapshot.
              </p>
            </div>
            <button
              type="button"
              onClick={onBackup}
              className="w-full py-2.5 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              Download Full Backup JSON
            </button>
          </div>

          {/* Restore */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{t.common.restoreData}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Restore accounts from a previously exported AccountsPro backup file. All entities will be verified against the schema.
              </p>
            </div>
            <label className="w-full text-center py-2.5 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer">
              Choose JSON File
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Safe Data Reset (Count = 0) */}
          <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Safe Data Reset (0)</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Safely purge all transactional demo records (sales, purchases, expenses, parties, TDS) to 0 counts while preserving company GSTIN & settings.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSafeReset}
              className="w-full py-2.5 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
            >
              Purge Demo Data (0)
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{t.common.resetDemo}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Reload factory Indian demo records (Shree Ganesh Enterprises) with sample transactions for demonstration.
              </p>
            </div>
            <button
              type="button"
              onClick={onResetDemo}
              className="w-full py-2.5 text-xs font-semibold rounded-xl text-amber-800 bg-amber-100 hover:bg-amber-200 cursor-pointer"
            >
              Reload Sample Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
