import React from 'react';
import {
  HardDriveDownload,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Users,
  Receipt,
  FileText,
} from 'lucide-react';
import { Language } from '../types/accounting';

interface BackupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackupNow: () => void;
  onSnooze: (hours?: number) => void;
  daysSince: number | null;
  lastBackupFormatted: string;
  recordCounts: {
    sales: number;
    purchases: number;
    expenses: number;
    parties: number;
    tds: number;
    journals: number;
  };
  language?: Language;
}

export const BackupReminderModal: React.FC<BackupReminderModalProps> = ({
  isOpen,
  onClose,
  onBackupNow,
  onSnooze,
  daysSince,
  lastBackupFormatted,
  recordCounts,
  language = 'en',
}) => {
  if (!isOpen) return null;

  const isHindi = language === 'hi';
  const totalRecords =
    recordCounts.sales +
    recordCounts.purchases +
    recordCounts.expenses +
    recordCounts.parties +
    recordCounts.tds +
    recordCounts.journals;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-amber-200/90 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header Badge Bar */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white mb-0.5">
                {isHindi ? '7-दिवसीय बैकअप चेतावनी' : '7-Day Safety Advisory'}
              </span>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isHindi ? 'सिस्टम बैकअप रिमाइंडर' : 'Full System Backup Recommended'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Status Message Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800 flex items-start space-x-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-900 text-sm">
                {daysSince === null
                  ? isHindi
                    ? 'कोई बैकअप रिकॉर्ड नहीं मिला (बैकअप लंबित)'
                    : 'No System Backup Created Yet'
                  : isHindi
                  ? `अंतिम बैकअप ${daysSince} दिन पहले लिया गया था (अनुशंसित: हर 7 दिन)`
                  : `Last Full Backup was created ${daysSince} days ago (Recommended: every 7 days)`}
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {isHindi
                  ? 'अंतिम बैकअप स्थिति: '
                  : 'Last registered backup: '}
                <span className="font-semibold text-slate-800">{lastBackupFormatted}</span>.
                {isHindi
                  ? ' डेटा की सुरक्षा और आयकर/जीएसटी नियमों के अनुपालन हेतु साप्ताहिक बैकअप लेना आवश्यक है।'
                  : ' Weekly offline JSON snapshots protect your accounting books from accidental loss, browser cache wipes, or system changes.'}
              </p>
            </div>
          </div>

          {/* Records at Stake */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isHindi ? 'सुरक्षित करने हेतु वर्तमान रिकॉर्ड्स' : 'Active Records to Backup'}
              </h4>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {totalRecords} {isHindi ? 'कुल रिकॉर्ड्स' : 'Total Entries'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">{recordCounts.sales}</div>
                  <div className="text-[10px] text-slate-500">{isHindi ? 'बिक्री बिल' : 'Sales Invoices'}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">{recordCounts.purchases}</div>
                  <div className="text-[10px] text-slate-500">{isHindi ? 'खरीद बिल' : 'Purchases'}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">{recordCounts.expenses}</div>
                  <div className="text-[10px] text-slate-500">{isHindi ? 'खर्चे' : 'Expenses'}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">{recordCounts.parties}</div>
                  <div className="text-[10px] text-slate-500">{isHindi ? 'पार्टियां' : 'Parties'}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">{recordCounts.tds}</div>
                  <div className="text-[10px] text-slate-500">{isHindi ? 'टीडीएस' : 'TDS Records'}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">{recordCounts.journals}</div>
                  <div className="text-[10px] text-slate-500">{isHindi ? 'जर्नल' : 'Journals'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700">
              {isHindi ? 'कानूनी अनुपालन संदर्भ: ' : 'Statutory Compliance Note: '}
            </span>
            <span>
              {isHindi
                ? 'आयकर नियम 6F और सीजीएसटी धारा 35(1) के अनुसार सभी बहीखाता रिकॉर्ड सुरक्षित रखना अनिवार्य है। ऑफ़लाइन JSON स्नैपशॉट पूरी तरह सुरक्षित और रीस्टोर करने योग्य है।'
                : 'Under Indian Income Tax Rule 6F and CGST Section 35(1), all transactional records and books must be securely maintained. This JSON snapshot is encrypted and instantly restorable.'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={onBackupNow}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>{isHindi ? 'अभी फुल बैकअप डाउनलोड करें' : 'Download Full System Backup Now'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSnooze(24)}
              className="w-full sm:w-auto py-3 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              title="Snooze reminder for 24 hours"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{isHindi ? '24 घंटे बाद याद दिलाएं' : 'Remind in 24h'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-3 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isHindi ? 'बंद करें' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
