import React, { useState, useEffect } from 'react';
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
  Users,
  UserCheck,
  Laptop,
  Smartphone,
  Plus,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import {
  CompanyProfile,
  AuditLogEntry,
  Language,
} from '../types/accounting';
import { AuthSession, ActiveSessionInfo, TeamMemberInfo, UserRole } from '../types/auth';
import { PresenceService } from '../services/presenceService';
import { AuthService } from '../services/auth';
import { INDIAN_STATES, validateGSTIN, validatePAN } from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { GSTService } from '../services/gstService';

interface SettingsModuleProps {
  company: CompanyProfile;
  auditLogs: AuditLogEntry[];
  language: Language;
  onUpdateCompany: (comp: CompanyProfile) => void;
  onResetDemo: () => void;
  onOpenSafeReset?: () => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  lastBackupStatus?: {
    isOverdue: boolean;
    daysSince: number | null;
    lastBackup: string | null;
    formattedDate: string;
  };
  onOpenBackupReminder?: () => void;
  onSimulateOverdueBackup?: () => void;
  currentUser?: AuthSession | null;
  onSwitchUser?: (session: AuthSession) => void;
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
  lastBackupStatus,
  onOpenBackupReminder,
  onSimulateOverdueBackup,
  currentUser,
  onSwitchUser,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'company' | 'audit' | 'data' | 'team'>('company');
  const [formData, setFormData] = useState<CompanyProfile>({ ...company });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Audit search
  const [auditSearch, setAuditSearch] = useState('');

  // Live Team & Active Sessions
  const [activeSessions, setActiveSessions] = useState<ActiveSessionInfo[]>(() =>
    PresenceService.getSessions()
  );
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Senior Accountant');
  const [newUserPassword, setNewUserPassword] = useState('AccountsPro@2026');

  useEffect(() => {
    const unsub = PresenceService.subscribe((list) => {
      setActiveSessions(list);
    });
    PresenceService.getTeamMembers(company.id || 'comp_01').then((members) => {
      setTeamMembers(members);
    });
    return () => unsub();
  }, [company.id]);

  const handleStateChange = (stateCode: string) => {
    const s = INDIAN_STATES.find((item) => item.code === stateCode);
    if (!s) return;
    setFormData((prev) => ({
      ...prev,
      state: s.name,
      stateCode: s.code,
    }));
  };

  const handleCompanyGstinChange = (inputVal: string) => {
    const val = inputVal.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setFormData((prev) => {
      const next = { ...prev, gstin: val };
      if (val.length === 15) {
        const instant = GSTService.getInstantGSTDetails(val);
        if (instant) {
          next.name = instant.legalName;
          next.tradeName = instant.tradeName || instant.legalName;
          if (instant.pan) next.pan = instant.pan;
          next.state = instant.state;
          next.stateCode = instant.stateCode;
          if (instant.address) next.address = instant.address;
          if (instant.city) next.city = instant.city;
          if (instant.pincode) next.pincode = instant.pincode;
        }
      }
      return next;
    });

    if (val.length === 15) {
      GSTService.fetchDetails(val).then((res) => {
        if (res.success && res.data) {
          setFormData((prev) => ({
            ...prev,
            name: res.data!.legalName || prev.name,
            tradeName: res.data!.tradeName || prev.tradeName,
            pan: res.data!.pan || prev.pan,
            state: res.data!.state || prev.state,
            stateCode: res.data!.stateCode || prev.stateCode,
            address: res.data!.address || prev.address,
            city: res.data!.city || prev.city,
            pincode: res.data!.pincode || prev.pincode,
          }));
        }
      });
    }
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
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'team'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 mr-1" />
          <span>{language === 'hi' ? 'टीम व सक्रिय सत्र' : 'Team & Active Sessions'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {activeSessions.length} Online
          </span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">GSTIN (15 Digits) *</label>
                  {formData.gstin.length === 15 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Company Auto-filled ✓
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) => handleCompanyGstinChange(e.target.value)}
                  placeholder="e.g. 27AABCS1429B1Z8"
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
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
        <div className="space-y-6">
          {/* 7-Day Backup Schedule & Compliance Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  lastBackupStatus?.isOverdue
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}
              >
                {lastBackupStatus?.isOverdue ? (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    7-Day Statutory Backup Cadence
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      lastBackupStatus?.isOverdue
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {lastBackupStatus?.isOverdue ? '⚠️ Backup Overdue (>7 Days)' : '✓ Backup Schedule Healthy'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Last system backup recorded:{' '}
                  <span className="font-semibold text-slate-900">
                    {lastBackupStatus?.formattedDate || 'Never (Initial backup pending)'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Automatic modal reminders trigger when no full backup has occurred in the preceding 7 days to safeguard accounts under Indian Tax Audit rules.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto shrink-0">
              {onOpenBackupReminder && (
                <button
                  type="button"
                  onClick={onOpenBackupReminder}
                  className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  View Reminder Modal
                </button>
              )}
              {onSimulateOverdueBackup && (
                <button
                  type="button"
                  onClick={onSimulateOverdueBackup}
                  title="Simulate 8-day overdue state to test the recurring notification and modal"
                  className="px-3 py-2 text-xs font-semibold rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                >
                  Test 7-Day Alert
                </button>
              )}
              <button
                type="button"
                onClick={onBackup}
                className="px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup Now</span>
              </button>
            </div>
          </div>

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
        </div>
      )}

      {/* TAB 4: TEAM MEMBERS & ACTIVE LOGGED-IN SESSIONS */}
      {activeTab === 'team' && (
        <div className="space-y-6 text-xs">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="font-extrabold text-base text-slate-900">
                  {language === 'hi' ? 'टीम प्रबंधन एवं सक्रिय ऑनलाइन सत्र' : 'Team Members & Active Online Sessions'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {activeSessions.length} {activeSessions.length === 1 ? 'User Online' : 'Users Online'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'देखें कि इस समय कंपनी खाते में कौन-कौन से उपयोगकर्ता लॉगिन हैं और उनके साथ रीयल-टाइम डेटा साझा करें।'
                  : 'View all team members currently logged in, monitor active sessions across devices, and manage roles.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingUser ? 'Cancel' : language === 'hi' ? '+ नया उपयोगकर्ता जोड़ें' : '+ Add Team Member'}</span>
            </button>
          </div>

          {/* Add Team Member Drawer / Form */}
          {isAddingUser && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-200 shadow-xs animate-in fade-in duration-150">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'hi' ? 'नया टीम सदस्य जोड़ें' : 'Add New Accounting Team Member'}</span>
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newUserName || !newUserEmail || !newUserPassword) return;
                  try {
                    await AuthService.register({
                      name: newUserName,
                      email: newUserEmail,
                      password: newUserPassword,
                      role: newUserRole,
                      companyId: company.id || 'comp_01',
                      companyName: company.name,
                      companyGstin: company.gstin,
                    });
                    const updated = await PresenceService.getTeamMembers(company.id || 'comp_01');
                    setTeamMembers(updated);
                    setIsAddingUser(false);
                    setNewUserName('');
                    setNewUserEmail('');
                  } catch (err: any) {
                    alert(err?.message || 'Failed to add user');
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@ganeshenterprises.in"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role & Permission *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Senior Accountant">Senior Accountant (Invoicing & GST)</option>
                    <option value="Tax Auditor">Tax Auditor (Audit & Reports Only)</option>
                    <option value="Accountant">Accountant (Data Entry)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Default Password *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* 1. Live Active Logged In Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'hi' ? 'वर्तमान में सक्रिय ऑनलाइन सत्र (Logged In Now)' : 'Currently Logged In Sessions (Real-Time)'}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {activeSessions.length} active {activeSessions.length === 1 ? 'connection' : 'connections'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Device / Client</th>
                    <th className="py-3 px-4">Login Timestamp</th>
                    <th className="py-3 px-4 text-center">Live Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeSessions.map((s, idx) => {
                    const isSelf = s.userId === currentUser?.userId;
                    return (
                      <tr key={s.sessionId || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>{s.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    You (This Window)
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-800 border border-violet-200">
                            {s.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5 text-slate-600">
                            {s.deviceInfo?.includes('Mobile') ? (
                              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{s.deviceInfo || 'Desktop Browser'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {new Date(s.loginTimestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            Online Now
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isSelf && onSwitchUser && (
                            <button
                              type="button"
                              onClick={() => {
                                AuthService.quickDemoLogin(s.email).then((res) => {
                                  if (res.success && res.session) onSwitchUser(res.session);
                                });
                              }}
                              className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Switch View</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Registered Accounting Team Members */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'hi' ? 'फर्म के पंजीकृत सदस्य' : 'Firm Registered Team Directory'}
              </h3>
              <span className="text-xs text-slate-500">
                {teamMembers.length} authorized users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Company ID</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quick Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {teamMembers.map((m) => {
                    const isOnline = activeSessions.some(
                      (s) => s.email.toLowerCase() === m.email.toLowerCase()
                    );
                    const isCurrent = currentUser?.email.toLowerCase() === m.email.toLowerCase();

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <span>{m.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{m.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {m.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{m.companyId}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOnline
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {isOnline ? 'Logged In' : 'Offline'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isCurrent && onSwitchUser && (
                            <button
                              type="button"
                              onClick={() => {
                                AuthService.quickDemoLogin(m.email).then((res) => {
                                  if (res.success && res.session) onSwitchUser(res.session);
                                });
                              }}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                            >
                              Log in as {m.name.split(' ')[0]}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
