import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  CreditCard,
  Users,
  Calculator,
  FileCheck2,
  Building2,
  BookOpen,
  BarChart3,
  Settings,
  ChevronRight,
  ShieldAlert,
  LogOut,
  UserCheck,
  Flame,
  Lock,
} from 'lucide-react';
import { Language } from '../types/accounting';
import { AuthSession } from '../types/auth';
import { translations } from '../utils/translations';

export type ActiveModule =
  | 'dashboard'
  | 'salesInvoices'
  | 'purchaseBills'
  | 'expenses'
  | 'parties'
  | 'gstManager'
  | 'tdsManager'
  | 'bankReconciliation'
  | 'ledgers'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (m: ActiveModule) => void;
  language: Language;
  badgeCounts: {
    invoices: number;
    purchases: number;
    expenses: number;
    parties: number;
    tdsPending: number;
    bankUnmatched: number;
  };
  currentUser?: AuthSession | null;
  onLogout?: () => void;
  onOpenCloudGuide?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  language,
  badgeCounts,
  currentUser,
  onLogout,
  onOpenCloudGuide,
  mobileOpen,
  onCloseMobile,
}) => {
  const t = translations[language];

  const navItems: {
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'salesInvoices',
      label: t.nav.salesInvoices,
      icon: ReceiptText,
      badge: badgeCounts.invoices,
    },
    {
      id: 'purchaseBills',
      label: t.nav.purchaseBills,
      icon: ShoppingBag,
      badge: badgeCounts.purchases,
    },
    {
      id: 'expenses',
      label: t.nav.expenses,
      icon: CreditCard,
      badge: badgeCounts.expenses,
    },
    {
      id: 'parties',
      label: t.nav.parties,
      icon: Users,
      badge: badgeCounts.parties,
    },
    {
      id: 'gstManager',
      label: t.nav.gstManager,
      icon: Calculator,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'tdsManager',
      label: t.nav.tdsManager,
      icon: FileCheck2,
      badge: badgeCounts.tdsPending > 0 ? badgeCounts.tdsPending : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'bankReconciliation',
      label: t.nav.bankReconciliation,
      icon: Building2,
      badge: badgeCounts.bankUnmatched > 0 ? badgeCounts.bankUnmatched : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'ledgers',
      label: t.nav.ledgers,
      icon: BookOpen,
    },
    {
      id: 'reports',
      label: t.nav.reports,
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: Settings,
    },
  ];

  const handleSelect = (id: ActiveModule) => {
    onSelectModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-200 ease-in-out print:hidden flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'hi' ? 'लेखा मॉड्यूल' : 'Accounting Modules'}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                          isActive
                            ? 'bg-emerald-700 text-emerald-100'
                            : item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Session & Compliance Notice */}
        <div className="p-3 border-t border-slate-100 space-y-3">
          {/* User Profile Card */}
          {currentUser && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    {currentUser.role}
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {currentUser.companyName}
              </div>
            </div>
          )}

          {/* Cloud Status / Firebase Guide Button */}
          {onOpenCloudGuide && (
            <button
              type="button"
              onClick={onOpenCloudGuide}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-[11px]">Cloud Auth Guide</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                Status
              </span>
            </button>
          )}

          {/* GST / Statutory Notice box */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'hi' ? 'जीएसटी/टीडीएस सूचना' : 'Statutory Advisory'}</span>
            </div>
            <p className="leading-relaxed text-[10px] text-slate-500">
              {language === 'hi'
                ? 'जीएसटीआर-1 एवं 3बी विवरणी आधिकारिक पोर्टल (gst.gov.in) पर नियत तिथि तक जमा करें।'
                : 'Returns must be filed directly at gst.gov.in and incometax.gov.in.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
