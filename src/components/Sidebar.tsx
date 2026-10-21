import React, { useState } from 'react';
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
  ChevronDown,
  ShieldAlert,
  LogOut,
  UserCheck,
  Flame,
  Lock,
  Sparkles,
  QrCode,
  Truck,
  FileText,
  Layers,
  ShoppingCart,
  FileCheck,
  FileSpreadsheet,
  Clock,
  RotateCcw,
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
  | 'eInvoice'
  | 'eWayBill'
  | 'tdsManager'
  | 'bankReconciliation'
  | 'ledgers'
  | 'reports'
  | 'workspace'
  | 'settings';

export type SalesSubView =
  | 'customers'
  | 'quotes'
  | 'salesOrders'
  | 'invoices'
  | 'recurringInvoices'
  | 'deliveryChallans'
  | 'paymentsReceived'
  | 'creditNotes'
  | 'eWayBills';

interface SidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (m: ActiveModule, subView?: string) => void;
  language: Language;
  badgeCounts: {
    invoices: number;
    purchases: number;
    expenses: number;
    parties: number;
    tdsPending: number;
    bankUnmatched: number;
    eInvoices?: number;
    eWayBills?: number;
  };
  currentUser?: AuthSession | null;
  onLogout?: () => void;
  onOpenCloudGuide?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeSalesSubView?: string;
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
  activeSalesSubView = 'invoices',
}) => {
  const t = translations[language];

  // Collapsible state for Sales group (default expanded as requested in user reference)
  const [salesExpanded, setSalesExpanded] = useState(true);

  // Submenu items under Sales matching user-uploaded reference screenshot
  const salesSubmenuItems: {
    id: SalesSubView;
    label: string;
    targetModule: ActiveModule;
    badge?: number;
  }[] = [
    { id: 'customers', label: 'Customers', targetModule: 'parties', badge: badgeCounts.parties },
    { id: 'quotes', label: 'Quotes', targetModule: 'salesInvoices' },
    { id: 'salesOrders', label: 'Sales Orders', targetModule: 'salesInvoices' },
    { id: 'invoices', label: 'Invoices', targetModule: 'salesInvoices', badge: badgeCounts.invoices },
    { id: 'recurringInvoices', label: 'Recurring Invoices', targetModule: 'salesInvoices' },
    { id: 'deliveryChallans', label: 'Delivery Challans', targetModule: 'salesInvoices' },
    { id: 'paymentsReceived', label: 'Payments Received', targetModule: 'salesInvoices' },
    { id: 'creditNotes', label: 'Credit Notes', targetModule: 'salesInvoices' },
    { id: 'eWayBills', label: 'e-Way Bills', targetModule: 'eWayBill', badge: badgeCounts.eWayBills },
  ];

  const handleSelect = (id: ActiveModule, subView?: string) => {
    onSelectModule(id, subView);
    onCloseMobile();
  };

  const isSalesActive =
    activeModule === 'salesInvoices' ||
    (activeModule === 'parties' && activeSalesSubView === 'customers') ||
    (activeModule === 'eWayBill' && activeSalesSubView === 'eWayBills');

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Zoho Books Styled Sidebar Container with Semantic Color Tokens for Light & Dark Theme */}
      <aside
        className={`fixed lg:sticky top-14 sm:top-16 z-40 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 shrink-0 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800/80 overflow-y-auto transition-all duration-150 ease-in-out print:hidden flex flex-col justify-between text-slate-700 dark:text-slate-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="py-2.5 px-2.5 space-y-3">
          {/* 1. DASHBOARD */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleSelect('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'dashboard'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#1366D9] dark:text-blue-400 shrink-0" />
                <span>{t.nav.dashboard}</span>
              </div>
              {activeModule === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
            </button>
          </div>

          {/* 2. SALES SECTION (ACCORDION WITH USER'S 9 SUBMENU ITEMS) */}
          <div className="space-y-1">
            {/* Sales Header Button matching image.png */}
            <button
              type="button"
              onClick={() => {
                setSalesExpanded(!salesExpanded);
                if (!isSalesActive) {
                  handleSelect('salesInvoices', 'invoices');
                }
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none ${
                isSalesActive
                  ? 'bg-[#eef2ff] text-[#1366D9] dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                {salesExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                )}
                <ShoppingCart className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <span className="text-xs">Sales</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {badgeCounts.invoices}
              </span>
            </button>

            {/* Indented Submenu Items (Customers, Quotes, Sales Orders, Invoices, Recurring Invoices, Delivery Challans, Payments Received, Credit Notes, e-Way Bills) */}
            {salesExpanded && (
              <div className="pl-6 space-y-0.5 pt-0.5 border-l-2 border-slate-100 dark:border-slate-800/60 ml-4">
                {salesSubmenuItems.map((item) => {
                  const isCurrentSubItem =
                    (item.id === 'customers' && activeModule === 'parties') ||
                    (item.id === 'eWayBills' && activeModule === 'eWayBill') ||
                    (activeModule === 'salesInvoices' && activeSalesSubView === item.id) ||
                    (activeModule === 'salesInvoices' && !activeSalesSubView && item.id === 'invoices');

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.targetModule, item.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isCurrentSubItem
                          ? 'text-[#1366D9] font-bold bg-blue-50/80 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. PURCHASES */}
          <div className="space-y-0.5">
            <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'hi' ? 'खरीद एवं व्यय' : 'PURCHASES'}
            </div>
            <button
              type="button"
              onClick={() => handleSelect('purchaseBills')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'purchaseBills'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShoppingBag className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{t.nav.purchaseBills}</span>
              </div>
              <span className="text-[10px] text-slate-400">{badgeCounts.purchases}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('expenses')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'expenses'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{t.nav.expenses}</span>
              </div>
              <span className="text-[10px] text-slate-400">{badgeCounts.expenses}</span>
            </button>
          </div>

          {/* 4. GST & TAXATION */}
          <div className="space-y-0.5">
            <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'hi' ? 'जीएसटी एवं कर' : 'GST & TAXATION'}
            </div>
            <button
              type="button"
              onClick={() => handleSelect('gstManager')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'gstManager'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Calculator className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.nav.gstManager}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('eInvoice')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'eInvoice'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <QrCode className="w-4 h-4 text-violet-500 shrink-0" />
                <span>{t.nav.eInvoice}</span>
              </div>
              <span className="text-[10px] text-slate-400">{badgeCounts.eInvoices}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('tdsManager')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'tdsManager'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileCheck2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t.nav.tdsManager}</span>
              </div>
              {badgeCounts.tdsPending > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">
                  {badgeCounts.tdsPending}
                </span>
              )}
            </button>
          </div>

          {/* 5. ACCOUNTANT & BANKING */}
          <div className="space-y-0.5">
            <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'hi' ? 'लेखाकार एवं बैंक' : 'BANKING & LEDGERS'}
            </div>
            <button
              type="button"
              onClick={() => handleSelect('bankReconciliation')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'bankReconciliation'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{t.nav.bankReconciliation}</span>
              </div>
              {badgeCounts.bankUnmatched > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold">
                  {badgeCounts.bankUnmatched}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelect('ledgers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'ledgers'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.nav.ledgers}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('reports')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'reports'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>{t.nav.reports}</span>
              </div>
            </button>
          </div>

          {/* 6. INTEGRATIONS & SETTINGS */}
          <div className="space-y-0.5">
            <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === 'hi' ? 'सेटिंग्स व इंटीग्रेशन' : 'INTEGRATIONS & SETTINGS'}
            </div>
            <button
              type="button"
              onClick={() => handleSelect('workspace')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'workspace'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{language === 'hi' ? 'गूगल वर्कस्पेस' : 'Google Workspace'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                activeModule === 'settings'
                  ? 'bg-blue-50 text-[#1366D9] font-bold dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t.nav.settings}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Zoho Bottom Section: Organization GSTIN & Statutory Advisory */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 text-[11px] mb-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>GST Taxpayer</span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">27AABCS1429B1Z8</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>E-Invoice & E-Way Ready</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">NIC-GSP</span>
            </div>
          </div>

          {onOpenCloudGuide && (
            <button
              type="button"
              onClick={onOpenCloudGuide}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Cloud Firestore Sync</span>
              </div>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                Online
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
