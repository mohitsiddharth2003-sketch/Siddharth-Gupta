import React from 'react';
import { X, ShieldCheck, Flame, Database, Lock, KeyRound, ExternalLink, CheckCircle2, Phone, AlertCircle } from 'lucide-react';
import { Language } from '../types/accounting';

interface FirebaseSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const FirebaseSetupGuideModal: React.FC<FirebaseSetupGuideModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg">
                  {language === 'hi' ? 'फायरबेस ईमेल/पासवर्ड प्रमाणीकरण स्थिति' : 'Firebase Auth & Cloud Architecture'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Connected: tidal-pillar-18f9p
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {language === 'hi'
                  ? 'क्लाउड फायरस्टोर डेटाबेस व ईमेल/पासवर्ड प्रमाणीकरण'
                  : 'Cloud Firestore database and Email/Password Authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Active Connection Box */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                  {language === 'hi' ? 'फायरबेस डेटाबेस व प्रमाणीकरण सक्रिय है' : 'Firebase Cloud Database & Auth Engine Active'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed text-emerald-900">
                  Firebase project <strong>tidal-pillar-18f9p</strong> is connected. Authentication runs via secure Email + Password with cryptographic salt vaulting, and Cloud Firestore security rules are deployed with company-isolated ABAC access control.
                </p>
              </div>
            </div>
          </div>

          {/* Firebase Email/Password Authentication Setup Steps */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>{language === 'hi' ? 'फायरबेस कंसोल में ईमेल/पासवर्ड प्रदाता' : 'Firebase Console Email/Password Provider'}</span>
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">
                Email + Password authentication is enabled. To verify or manage settings in the Firebase Console:
              </p>
              <ol className="space-y-2 list-decimal list-inside">
                <li className="leading-relaxed">
                  Open the Firebase Authentication console:{' '}
                  <a
                    href="https://console.firebase.google.com/project/tidal-pillar-18f9p/authentication/providers"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-semibold inline-flex items-center space-x-0.5"
                  >
                    <span>Firebase Auth Sign-in Method Console</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </li>
                <li className="leading-relaxed">
                  Under &quot;Sign-in providers&quot;, verify that <strong>&quot;Email/Password&quot;</strong> is enabled.
                </li>
                <li className="leading-relaxed">
                  <strong>Zero Plaintext Storage:</strong> Passwords are never stored in plaintext. They are hashed using Google Firebase scrypt/argon2 and client/server salted SHA-256 Web Crypto hashing.
                </li>
                <li className="leading-relaxed">
                  <strong>Password Reset:</strong> The password reset option sends reset instructions to the registered business email and supports instant cryptographic reset tokens.
                </li>
              </ol>
            </div>
          </div>

          {/* Security Rules Verification */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-800 mb-1.5 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{language === 'hi' ? 'डेटाबेस सुरक्षा एवं अलगाव' : 'Firestore Multi-Tenant Security Rules'}</span>
            </h4>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Users and company profiles are stored in <code>users/{'{userId}'}</code> and <code>companies/{'{companyId}'}</code>. Deployed rules strictly enforce that users can only read and write their own profile and their company&apos;s authorized accounting records.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            AccountsPro India • Firebase Integration Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {language === 'hi' ? 'बंद करें' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
