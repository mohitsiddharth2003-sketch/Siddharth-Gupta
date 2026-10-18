import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Trash2,
  X,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { AccountingService } from '../services/storage';

interface SafeDataResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export const SafeDataResetModal: React.FC<SafeDataResetModalProps> = ({
  isOpen,
  onClose,
  onResetComplete,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      const backupJson = AccountingService.exportFullBackup();
      const company = AccountingService.getCompany();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AccountsPro_Backup_Before_Reset_${company.gstin || 'MSME'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupDownloaded(true);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to generate backup snapshot.');
    }
  };

  const handleExecuteReset = () => {
    if (confirmationText.trim() !== 'DELETE DEMO DATA') {
      setErrorMessage('Please type "DELETE DEMO DATA" exactly to confirm.');
      return;
    }

    setIsResetting(true);
    setErrorMessage('');

    try {
      AccountingService.clearDemoTransactionalData();
      onResetComplete();
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to clear demo data.');
      setIsResetting(false);
    }
  };

  const isConfirmed = confirmationText.trim() === 'DELETE DEMO DATA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Safe Data Reset / डेटा रीसेट</h2>
              <p className="text-xs text-rose-100">Clean transactional demo data without losing company profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Warning Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              महत्वपूर्ण चेतावनी (Critical Warning)
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Deleted transactional demo data recover नहीं होगा। रीसेट के बाद सभी transaction counts <strong>0</strong> दिखेंगे और Dashboard खाली (empty state) हो जाएगा।
            </p>
          </div>

          {/* Deletion & Preservation Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1.5">
              <div className="font-bold text-rose-800 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                क्या Delete होगा (Count = 0):
              </div>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
                <li>Demo Sales Invoices (0)</li>
                <li>Demo Purchase Bills (0)</li>
                <li>Demo Expenses (0)</li>
                <li>Demo Customers & Vendors (0)</li>
                <li>Demo TDS records (0)</li>
                <li>Bank Reconciliation entries (0)</li>
                <li>Demo Journal vouchers (0)</li>
              </ul>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                क्या सुरक्षित रहेगा (Preserved):
              </div>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
                <li>Company profile & Legal name</li>
                <li>GSTIN, PAN & State settings</li>
                <li>Registered bank details & IFSC</li>
                <li>Admin user login & session</li>
                <li>Master Chart of Accounts</li>
                <li>Statutory GST / TDS rules</li>
              </ul>
            </div>
          </div>

          {/* Step 1: Backup Option */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  Step 1: सुरक्षा हेतु बैकअप डाउनलोड करें (Recommended)
                </h4>
                <p className="text-[11px] text-slate-500">
                  रीसेट से पहले वर्तमान डेटा का पूरा JSON बैकअप डाउनलोड कर लें।
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {backupDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Backed Up!
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Download JSON Backup
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Confirmation input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Step 2: पुष्टि करने के लिए नीचे <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold select-all">DELETE DEMO DATA</span> टाइप करें:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE DEMO DATA"
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel / रद्द करें
          </button>
          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={!isConfirmed || isResetting}
            className={`px-5 py-2 text-xs font-semibold rounded-xl text-white flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
              isConfirmed && !isResetting
                ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {isResetting ? 'Cleaning Data...' : 'Safely Purge Demo Data (Reset to 0)'}
          </button>
        </div>
      </div>
    </div>
  );
};
