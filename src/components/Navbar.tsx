import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  AlertTriangle,
  Keyboard,
  Users,
  ChevronDown,
  Laptop,
  Smartphone,
  ArrowRightLeft,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Search,
  ReceiptText,
  ShoppingBag,
  CreditCard,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import { Language, CompanyProfile } from '../types/accounting';
import { AuthSession, ActiveSessionInfo, TeamMemberInfo, UserRole } from '../types/auth';
import { translations } from '../utils/translations';
import { PresenceService } from '../services/presenceService';
import { AuthService } from '../services/auth';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  company: CompanyProfile;
  currentUser?: AuthSession | null;
  onLogout?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onResetDemo: () => void;
  onSafeReset?: () => void;
  onBackup: () => void;
  onOpenAudit: () => void;
  onOpenCloudGuide?: () => void;
  isCloudSyncing?: boolean;
  isBackupOverdue?: boolean;
  onOpenBackupReminder?: () => void;
  onOpenShortcuts?: () => void;
  onSwitchUser?: (session: AuthSession) => void;
  activeModule?: string;
  onNavigate?: (module: any) => void;
  onOpenNewInvoice?: () => void;
  onOpenNewPurchase?: () => void;
  onOpenNewExpense?: () => void;
  onOpenNewParty?: () => void;
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
  onSafeReset,
  onBackup,
  onOpenAudit,
  onOpenCloudGuide,
  isCloudSyncing = false,
  isBackupOverdue = false,
  onOpenBackupReminder,
  onOpenShortcuts,
  onSwitchUser,
  activeModule = 'dashboard',
  onNavigate,
  onOpenNewInvoice,
  onOpenNewPurchase,
  onOpenNewExpense,
  onOpenNewParty,
}) => {
  const t = translations[language];

  // Real-time active users queried directly from PresenceService
  const [activeSessions, setActiveSessions] = useState<ActiveSessionInfo[]>(() =>
    PresenceService.getSessions()
  );
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [isUsersPopoverOpen, setIsUsersPopoverOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const usersDropdownRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const companyMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine whether the current view is the Admin & Company Settings page
  const isAdminPage = activeModule === 'settings';

  // Global '/' keyboard shortcut to focus Zoho search bar
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Subscribe to live active users on the platform via PresenceService
  useEffect(() => {
    const unsubscribe = PresenceService.subscribe((sessions) => {
      setActiveSessions(sessions);
    });

    PresenceService.getTeamMembers(company.id || 'comp_01').then((members) => {
      setTeamMembers(members);
    });

    return () => {
      unsubscribe();
    };
  }, [company.id, currentUser]);

  // Click outside listener to dismiss menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (usersDropdownRef.current && !usersDropdownRef.current.contains(target)) {
        setIsUsersPopoverOpen(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(target)) {
        setIsNewMenuOpen(false);
      }
      if (companyMenuRef.current && !companyMenuRef.current.contains(target)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper: compute initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper: Role styling theme
  const getRoleTheme = (role: UserRole | string = 'Accountant') => {
    switch (role) {
      case 'Admin':
        return {
          bg: 'bg-linear-to-tr from-violet-600 to-indigo-700',
          badge: 'bg-violet-100 text-violet-800 border-violet-200',
        };
      case 'Senior Accountant':
        return {
          bg: 'bg-linear-to-tr from-emerald-600 to-teal-700',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'Tax Auditor':
        return {
          bg: 'bg-linear-to-tr from-amber-600 to-orange-700',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      default:
        return {
          bg: 'bg-linear-to-tr from-sky-600 to-blue-700',
          badge: 'bg-sky-100 text-sky-800 border-sky-200',
        };
    }
  };

  // Other active users (excluding current self) retrieved from PresenceService
  const otherActiveUsers = activeSessions.filter(
    (s) => s.userId !== currentUser?.userId && s.email?.toLowerCase() !== currentUser?.email?.toLowerCase()
  );

  // Handle quick role / user switch
  const handleQuickSwitch = async (email: string) => {
    setIsSwitchingUser(true);
    try {
      const res = await AuthService.quickDemoLogin(email);
      if (res.success && res.session) {
        onSwitchUser?.(res.session);
        setIsUsersPopoverOpen(false);
      }
    } finally {
      setIsSwitchingUser(false);
    }
  };

  // Manual refresh trigger
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const companyId = company.id || currentUser?.companyId || 'comp_01';
      const updatedTeam = await PresenceService.getTeamMembers(companyId);
      setTeamMembers(updatedTeam);
      setActiveSessions(PresenceService.getSessions());
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('inv') || q.includes('bill') || q.includes('sale')) {
      onNavigate?.('salesInvoices');
    } else if (q.includes('pur') || q.includes('buy')) {
      onNavigate?.('purchaseBills');
    } else if (q.includes('exp')) {
      onNavigate?.('expenses');
    } else if (q.includes('party') || q.includes('cust') || q.includes('vend')) {
      onNavigate?.('parties');
    } else if (q.includes('gst') || q.includes('tax')) {
      onNavigate?.('gstManager');
    } else if (q.includes('tds')) {
      onNavigate?.('tdsManager');
    } else if (q.includes('bank')) {
      onNavigate?.('bankReconciliation');
    } else {
      onNavigate?.('salesInvoices');
    }
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 shadow-2xs print:hidden transition-colors duration-150">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Left: Mobile Toggle & Zoho Books Brand Logo & Organization Selector */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Zoho Books Iconic 4-Color Brand Quadrants */}
            <div 
              onClick={() => onNavigate?.('dashboard')}
              className="flex items-center space-x-2 cursor-pointer group select-none"
              title="Zoho Books | AccountsPro India Dashboard"
            >
              <div className="flex flex-col gap-0.5 p-1 rounded-lg bg-slate-900 shadow-xs group-hover:scale-105 transition-transform">
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EA4335]" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[#34A853]" />
                </div>
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4285F4]" />
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FBBC05]" />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                    Zoho<span className="text-[#1366D9]">Books</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400">|</span>
                  <span className="hidden sm:inline-block text-[11px] font-bold text-slate-600">
                    AccountsPro
                  </span>
                </div>
                <span className="text-[9px] text-emerald-700 font-semibold tracking-wider uppercase">
                  GST & E-Invoice India
                </span>
              </div>
            </div>

            {/* Zoho Organization Dropdown Switcher */}
            <div className="relative hidden md:block" ref={companyMenuRef}>
              <button
                type="button"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  isCompanyDropdownOpen
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
                title="Active Business Organization"
              >
                <Building2 className="w-3.5 h-3.5 text-[#1366D9] shrink-0" />
                <div className="flex flex-col max-w-[180px] lg:max-w-xs">
                  <span className="text-xs font-bold truncate leading-tight">
                    {company.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono truncate leading-tight">
                    {company.gstin} · FY {company.financialYear}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Organization Quick Info Dropdown */}
              {isCompanyDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                    {language === 'hi' ? 'सक्रिय कंपनी विवरण' : 'Active Organization Profile'}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Trade Name:</span>{' '}
                      <span className="font-semibold text-slate-800">{company.tradeName || company.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">GSTIN:</span>{' '}
                      <span className="font-mono font-bold text-blue-700">{company.gstin}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">PAN:</span>{' '}
                      <span className="font-mono font-semibold text-slate-800">{company.pan}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">State:</span>{' '}
                      <span className="text-slate-800 font-medium">{company.state} (Code: {company.stateCode})</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCompanyDropdownOpen(false);
                        onNavigate?.('settings');
                      }}
                      className="text-xs font-bold text-[#1366D9] hover:text-[#0F54B3] flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{language === 'hi' ? 'कंपनी सेटिंग्स प्रबंधित करें →' : 'Manage Company Profile →'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Zoho Books Global Search Bar with '/' Shortcut */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center flex-1 max-w-md mx-4 relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'खोजें: चालान, बिल, पार्टी, रिपोर्ट... (दबाएं /)' : 'Search in invoices, bills, parties, ledgers... (Press /)'}
              className="w-full pl-9 pr-12 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs rounded-lg border border-slate-200 focus:border-[#1366D9] focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400 transition-all outline-hidden"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
              /
            </kbd>
          </form>

          {/* Right: Zoho "+ New" Quick Action, Tools & User Profile with Real-Time Presence */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* Zoho "+ New" Quick Action Dropdown */}
            <div className="relative" ref={newMenuRef}>
              <button
                type="button"
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="bg-[#1366D9] hover:bg-[#0F54B3] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                title="Create New Transaction (Zoho Quick Create)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'hi' ? 'नया बनाएँ' : 'New'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isNewMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Zoho Quick Create Dropdown Menu */}
              {isNewMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'hi' ? 'त्वरित निर्माण' : 'Quick Create'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenNewInvoice?.();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors text-left cursor-pointer"
                  >
                    <ReceiptText className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'hi' ? 'बिक्री चालान (Sales Invoice)' : 'Sales Invoice'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenNewPurchase?.();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors text-left cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <span>{language === 'hi' ? 'खरीद बिल (Purchase Bill)' : 'Purchase Bill'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenNewExpense?.();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors text-left cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-rose-600" />
                    <span>{language === 'hi' ? 'व्यावसायिक व्यय (Expense)' : 'Expense Voucher'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenNewParty?.();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors text-left cursor-pointer border-t border-slate-100"
                  >
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span>{language === 'hi' ? 'ग्राहक / विक्रेता (Party)' : 'Customer / Vendor'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cloud Firestore Status Badge */}
            <div
              onClick={onOpenCloudGuide}
              title={isCloudSyncing ? 'Synchronizing with Cloud Firestore...' : 'Cloud Firestore Active: Click for Integration Guide'}
              className="hidden xl:flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-3 h-3 mr-1 text-[#1366D9] animate-spin" />
              ) : (
                <Database className="w-3 h-3 mr-1 text-[#1366D9]" />
              )}
              <span className="text-[11px] font-medium">{isCloudSyncing ? 'Syncing...' : 'Cloud DB'}</span>
            </div>

            {/* Audit Button */}
            <button
              onClick={onOpenAudit}
              title="Statutory Compliance Audit Trail"
              className="inline-flex items-center px-2 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:mr-1 text-emerald-600" />
              <span className="hidden sm:inline">Audit</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-1.5 py-0.5 font-bold rounded-md transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`px-1.5 py-0.5 font-bold rounded-md transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-[#1366D9] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Theme Toggle (Light / Dark Mode with semantic tokens) */}
            <ThemeToggle showMenu={true} />

            {/* ======================================================================================= */}
            {/* ZOHO ACCOUNTS USER PROFILE WITH REAL-TIME ACTIVE USERS AVATAR STACK (ADMIN RESTRICTED)  */}
            {/* ======================================================================================= */}
            {currentUser && (
              <div className="flex items-center pl-1.5 sm:pl-2.5 border-l border-slate-200 dark:border-slate-700" ref={usersDropdownRef}>
                {/* Zoho User Profile Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsUsersPopoverOpen(!isUsersPopoverOpen)}
                  title={
                    isAdminPage
                      ? `Zoho Accounts: ${currentUser.name} (${currentUser.role}) • ${activeSessions.length} active on platform (Click to open)`
                      : `Zoho Accounts: ${currentUser.name} (${currentUser.role}) • Active sessions view restricted to Admin page`
                  }
                  className={`group flex items-center space-x-2 p-1 sm:px-2 sm:py-1 rounded-xl transition-all border cursor-pointer select-none ${
                    isUsersPopoverOpen
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Logged In User Avatar with Pulsing Green Online Dot */}
                  <div className="relative">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-xs ring-2 ring-blue-500/20 ${
                        getRoleTheme(currentUser.role).bg
                      }`}
                    >
                      {getInitials(currentUser.name)}
                    </div>

                    {/* Live Online Indicator: Pulsing Green Dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-1.5 ring-white"></span>
                    </span>
                  </div>

                  {/* Logged in Name & Role (Hidden on mobile) */}
                  <div className="hidden lg:flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[105px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold truncate">
                      {currentUser.role}
                    </span>
                  </div>

                  {/* Visual Indicator: Small Avatar Stack of Other Active Users on the Platform */}
                  <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
                    {otherActiveUsers.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                        {otherActiveUsers.slice(0, 3).map((session, idx) => {
                          const theme = getRoleTheme(session.role);
                          return (
                            <div
                              key={session.sessionId || session.userId || idx}
                              title={`${session.name} (${session.role}) • Online in real-time`}
                              className={`relative inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black text-white shadow-xs ring-1.5 ring-white transition-transform group-hover:scale-105 ${theme.bg}`}
                              style={{ zIndex: 10 - idx }}
                            >
                              <span>{getInitials(session.name)}</span>
                              {/* Online Status Dot */}
                              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white"></span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="relative flex h-2 w-2 mx-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                    )}

                    {/* Active Counter Badge */}
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 group-hover:bg-blue-100/80 group-hover:text-blue-900 px-1.5 py-0.5 rounded-full border border-slate-200 transition-colors">
                      {otherActiveUsers.length > 0 ? `+${otherActiveUsers.length}` : '1'}
                    </span>

                    {/* Admin Access Indicator */}
                    {isAdminPage ? (
                      <span className="hidden sm:inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                        Admin
                      </span>
                    ) : (
                      <span
                        className="hidden sm:inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full border border-slate-200"
                        title="Active users details restricted to Admin page"
                      >
                        <Lock className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                        Admin
                      </span>
                    )}

                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                        isUsersPopoverOpen ? 'rotate-180 text-[#1366D9]' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* ========================================================================= */}
                {/* ZOHO ACCOUNTS PROFILE & ACTIVE SESSIONS POPOVER (ADMIN RESTRICTED VIEW)    */}
                {/* ========================================================================= */}
                {isUsersPopoverOpen && (
                  <div className="absolute right-3 sm:right-5 lg:right-6 top-16 w-84 sm:w-96 bg-white rounded-2xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.18)] border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Zoho 4-Color Accent Stripe */}
                    <div className="w-full h-1 flex">
                      <div className="w-1/4 h-full bg-[#EA4335]" />
                      <div className="w-1/4 h-full bg-[#34A853]" />
                      <div className="w-1/4 h-full bg-[#1366D9]" />
                      <div className="w-1/4 h-full bg-[#FBBC05]" />
                    </div>

                    {/* Top Zoho Accounts Brand Banner */}
                    <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col gap-0.5 p-1 rounded-sm bg-slate-900 shadow-2xs">
                          <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-[1px] bg-[#EA4335]" />
                            <div className="w-1.5 h-1.5 rounded-[1px] bg-[#34A853]" />
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-[1px] bg-[#1366D9]" />
                            <div className="w-1.5 h-1.5 rounded-[1px] bg-[#FBBC05]" />
                          </div>
                        </div>
                        <span className="font-extrabold text-xs text-slate-900 tracking-tight">
                          Zoho <span className="text-[#1366D9]">Accounts</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={handleManualRefresh}
                          title="Refresh Active Sessions"
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1366D9]' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsUsersPopoverOpen(false)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Zoho User Profile Card Header */}
                    <div className="p-4 bg-white border-b border-slate-100">
                      <div className="flex items-center space-x-3.5">
                        <div className="relative shrink-0">
                          <div
                            className={`w-12 h-12 rounded-full text-white font-extrabold text-base flex items-center justify-center shadow-xs ring-4 ring-slate-100 ${
                              getRoleTheme(currentUser.role).bg
                            }`}
                          >
                            {getInitials(currentUser.name)}
                          </div>
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                            title="Active Now on this device"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {currentUser.name}
                            </h4>
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${getRoleTheme(currentUser.role).badge}`}>
                              {currentUser.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                            {currentUser.email}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-1">
                            <span>ZUID: {currentUser.userId.replace(/[^0-9]/g, '').slice(0, 8) || '84920194'}</span>
                            <span>•</span>
                            <span className="truncate text-slate-600 font-semibold">{company.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Zoho "My Account" Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUsersPopoverOpen(false);
                            onNavigate?.('settings');
                          }}
                          className="text-xs font-bold text-[#1366D9] hover:text-[#0F54B3] flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{language === 'hi' ? 'मेरा खाता व कंपनी प्रोफ़ाइल' : 'My Zoho Account Profile'}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </button>

                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                          {activeSessions.length} {activeSessions.length === 1 ? 'Session Active' : 'Sessions Active'}
                        </span>
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* ACTIVE SESSIONS SECTION: CONDITIONALLY RENDERED BASED ON ADMIN PAGE ACCESS */}
                    {/* ========================================================================= */}
                    {isAdminPage ? (
                      /* FULL ACCESS ON ADMIN PAGE */
                      <div>
                        {/* Section Header */}
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              {language === 'hi' ? 'सक्रिय सत्र एवं सहकर्मी' : 'Active Sessions on Platform'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            Real-Time Presence
                          </span>
                        </div>

                        {/* Sessions List */}
                        <div className="p-3 max-h-64 overflow-y-auto space-y-2">
                          {/* Current Device Session */}
                          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className="relative shrink-0">
                                  <div className={`w-7 h-7 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center ${getRoleTheme(currentUser.role).bg}`}>
                                    {getInitials(currentUser.name)}
                                  </div>
                                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1">
                                    <span>{currentUser.name}</span>
                                    <span className="text-[9px] font-bold text-[#1366D9] bg-blue-100/80 px-1.5 py-0.2 rounded-full">
                                      This Device
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                Active Now
                              </span>
                            </div>
                          </div>

                          {/* Other Active Users on the Platform */}
                          {otherActiveUsers.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 text-xs">
                              {language === 'hi'
                                ? 'वर्तमान में कोई अन्य सहकर्मी ऑनलाइन नहीं है।'
                                : 'No other active users online right now.'}
                            </div>
                          ) : (
                            otherActiveUsers.map((session, idx) => {
                              const theme = getRoleTheme(session.role);
                              return (
                                <div
                                  key={session.sessionId || session.userId || idx}
                                  className="flex items-start justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-colors shadow-2xs"
                                >
                                  <div className="flex items-start space-x-2.5 min-w-0">
                                    <div className="relative shrink-0 mt-0.5">
                                      <div className={`w-7 h-7 rounded-full text-white font-black text-[10px] flex items-center justify-center ${theme.bg}`}>
                                        {getInitials(session.name)}
                                      </div>
                                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 text-xs truncate">
                                        {session.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono truncate">{session.email}</div>
                                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-0.5">
                                        {session.deviceInfo?.includes('Mobile') ? (
                                          <Smartphone className="w-3 h-3 text-slate-500" />
                                        ) : (
                                          <Laptop className="w-3 h-3 text-slate-500" />
                                        )}
                                        <span className="truncate max-w-[130px]">{session.deviceInfo || 'Desktop Browser'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1 shrink-0">
                                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${theme.badge}`}>
                                      {session.role}
                                    </span>
                                    <span className="text-[9px] font-bold text-emerald-700 flex items-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                      Online
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Zoho Multi-User Switcher (Test 2 Logins Without Losing Sessions) */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>{language === 'hi' ? 'त्वरित खाता स्विच (2 लॉगिन परीक्षण):' : 'Zoho Quick Account Switcher:'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => handleQuickSwitch('ca.sharma@accountspro.in')}
                              disabled={isSwitchingUser}
                              className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                                currentUser.email === 'ca.sharma@accountspro.in'
                                  ? 'bg-blue-100/80 border-blue-300 text-blue-900 font-bold'
                                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="font-bold text-[11px] truncate">CA Rajesh Sharma</div>
                              <div className="text-[10px] text-slate-500 font-semibold">Admin / Owner</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickSwitch('priya.patel@patelenterprises.com')}
                              disabled={isSwitchingUser}
                              className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                                currentUser.email === 'priya.patel@patelenterprises.com'
                                  ? 'bg-blue-100/80 border-blue-300 text-blue-900 font-bold'
                                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="font-bold text-[11px] truncate">Priya Patel</div>
                              <div className="text-[10px] text-slate-500 font-semibold">Sr. Accountant</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* RESTRICTED ACCESS WHEN NOT ON ADMIN PAGE ("and only admin page par access ho") */
                      <div className="p-5 text-center bg-slate-50/50">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                          <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900">
                          {language === 'hi' ? 'केवल एडमिन पेज पर एक्सेस उपलब्ध है' : 'Admin Page Access Only'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-xs mx-auto">
                          {language === 'hi'
                            ? 'सुरक्षा एवं गोपनीयता हेतु सक्रिय ऑनलाइन उपयोगकर्ताओं व जुड़े उपकरणों की विस्तृत सूची केवल कंपनी सेटिंग्स (एडमिन पोर्टल) पर उपलब्ध है।'
                            : 'Active users and real-time device sessions across your organization are strictly visible on the Admin & Settings page.'}
                        </p>
                        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUsersPopoverOpen(false);
                              onNavigate?.('settings');
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-[#1366D9] hover:bg-[#0F54B3] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            <span>
                              {language === 'hi' ? 'एडमिन पेज खोलें (सेटिंग्स) →' : 'Open Admin Page (Settings) →'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Zoho Accounts Bottom Sign Out Action */}
                    {onLogout && (
                      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          AccountsPro Identity v1.0
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUsersPopoverOpen(false);
                            onLogout();
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'साइन आउट' : 'Sign Out'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
