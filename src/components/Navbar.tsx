import React from 'react';
import { 
  Building2, 
  Globe2, 
  Download, 
  RotateCcw, 
  Menu, 
  X, 
  FileSpreadsheet, 
  Sparkles,
  ShieldCheck,
  LogOut,
  User,
  Flame,
  Lock,
  Database,
  RefreshCw,
} from 'lucide-react';
import { Language, CompanyProfile } from '../types/accounting';
import { AuthSession } from '../types/auth';
import { translations } from '../utils/translations';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  company: CompanyProfile;
  currentUser?: AuthSession | null;
  onLogout?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onResetDemo: () => void;
  onBackup: () => void;
  onOpenAudit: () => void;
  onOpenCloudGuide?: () => void;
  isCloudSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  company,
  currentUser,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  onResetDemo,
  onBackup,
  onOpenAudit,
  onOpenCloudGuide,
  isCloudSyncing = false,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-bold text-lg">
                ₹
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                    {t.appName}
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                    GST & TDS
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center space-x-1.5 font-medium truncate max-w-[160px] sm:max-w-xs">
                  <span className="text-emerald-700 font-semibold">{company.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>FY {company.financialYear}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions, Language Switch, Demo Badge, User Profile & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Demo badge with reset */}
            <div className="hidden xl:flex items-center bg-amber-50 border border-amber-200/80 text-amber-800 text-xs px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
              <span className="font-medium mr-2">{t.demoDataBadge}</span>
              <button
                onClick={onResetDemo}
                title="Reset sample data"
                className="text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Cloud Setup / Vault Status Button */}
            {onOpenCloudGuide && (
              <button
                type="button"
                onClick={onOpenCloudGuide}
                title="View Firebase & Cloud Security Status"
                className="hidden md:inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3 mr-1 text-emerald-600" />
                <span>Vault: SHA-256</span>
              </button>
            )}

            {/* Cloud Firestore Persistent Storage Status */}
            <div
              title="Cloud Firestore Production Database: Multi-tenant isolated, persistent storage"
              className="hidden lg:inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200"
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-3 h-3 mr-1 text-emerald-600 animate-spin" />
              ) : (
                <Database className="w-3 h-3 mr-1 text-emerald-600" />
              )}
              <span>{isCloudSyncing ? 'Syncing...' : 'Firestore DB'}</span>
            </div>

            {/* System Audit Button */}
            <button
              onClick={onOpenAudit}
              title="Run Automated Compliance & Modules Audit"
              className="inline-flex items-center px-2 py-1.5 text-xs font-semibold rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:mr-1 text-emerald-600" />
              <span className="hidden sm:inline">Audit</span>
            </button>

            {/* Backup Button */}
            <button
              onClick={onBackup}
              title={t.common.backupData}
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 sm:mr-1 text-slate-600" />
              <span className="hidden sm:inline">{t.common.backupData.split(' ')[0]}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Logged In User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200 space-x-1.5">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate">
                    {currentUser.role}
                  </span>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sign Out of AccountsPro"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
