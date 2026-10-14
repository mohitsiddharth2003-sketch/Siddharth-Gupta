import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Language } from '../types/accounting';
import { translations } from '../utils/translations';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  recordIdentifier: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  language: Language;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  recordIdentifier,
  onConfirm,
  onClose,
  language,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const t = translations[language];

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(language === 'hi' ? 'कृपया हटाने का कारण दर्ज करें (ऑडिट रिकॉर्ड हेतु)' : 'Please provide a valid deletion reason for statutory audit trail');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t.common.confirmDeleteTitle}</h3>
              <p className="text-xs text-slate-500">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <p className="font-semibold mb-1">
              {language === 'hi' ? 'वित्तीय सुरक्षा नियम' : 'Financial Record Protection Policy'}
            </p>
            <p>
              {language === 'hi'
                ? `रिकॉर्ड "${recordIdentifier}" को हटाने की सूचना ऑडिट लॉग में स्थायी रूप से दर्ज की जाएगी।`
                : `Deleting record "${recordIdentifier}" permanently alters the general ledger and will be flagged in the audit register.`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'hi' ? 'हटाने का कारण (अनिवार्य)' : 'Reason for Deletion / Reversal (Required)'} *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                language === 'hi'
                  ? 'उदा: इनवॉइस रद्द किया गया, गलत पार्टी चयनित, या डुप्लीकेट प्रविष्टि...'
                  : 'e.g., Cancelled by client, clerical error in GST rate, duplicated entry...'
              }
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
            />
            {error && <p className="text-rose-600 text-xs mt-1 font-medium">{error}</p>}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.common.delete}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
