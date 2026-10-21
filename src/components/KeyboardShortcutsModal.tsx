import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  X,
  FilePlus,
  Save,
  Users,
  LayoutDashboard,
  ReceiptText,
  ShoppingBag,
  CreditCard,
  FileCheck2,
  Calculator,
  Building2,
  BarChart3,
  Settings,
  HelpCircle,
  Download,
  CornerDownLeft,
  Sparkles,
  QrCode,
  Truck,
} from 'lucide-react';
import { Language } from '../types/accounting';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

interface ShortcutItem {
  keys: string[];
  action: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
}) => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent || ''));
    }
  }, []);

  if (!isOpen) return null;

  const modKey = isMac ? '⌘' : 'Ctrl';

  const voucherShortcuts: ShortcutItem[] = [
    {
      keys: [modKey, 'N'],
      action: language === 'hi' ? 'नया बिक्री चालान (सेल इनवॉइस)' : 'New Sales Invoice',
      description: language === 'hi' ? 'त्वरित जीएसटी बिक्री चालान प्रविष्टि खोलें' : 'Open new GST tax sales invoice modal',
      icon: FilePlus,
      badge: 'Most Used',
    },
    {
      keys: [modKey, 'S'],
      action: language === 'hi' ? 'सहेजें (त्वरित सेव)' : 'Save Active Voucher / Form',
      description: language === 'hi' ? 'चालान, बिल या पार्टी फॉर्म को तुरंत सेव करें' : 'Instantly submit and save active transaction form',
      icon: Save,
      badge: 'Essential',
    },
    {
      keys: [modKey, 'B'],
      action: language === 'hi' ? 'नया खरीद बिल (परचेज बिल)' : 'New Purchase Bill',
      description: language === 'hi' ? 'आपूर्तिकर्ता खरीद प्रविष्टि खोलें' : 'Open new vendor purchase bill entry',
      icon: ShoppingBag,
    },
    {
      keys: [modKey, 'E'],
      action: language === 'hi' ? 'नया खर्च वाउचर' : 'New Expense Voucher',
      description: language === 'hi' ? 'व्यावसायिक व्यय प्रविष्टि दर्ज करें' : 'Record official business expenditure voucher',
      icon: CreditCard,
    },
    {
      keys: ['Esc'],
      action: language === 'hi' ? 'बंद करें / रद्द करें' : 'Close Modal / Cancel',
      description: language === 'hi' ? 'खुला हुआ कोई भी डायलॉग या प्रपत्र बंद करें' : 'Dismiss any open dialog or return to main view',
      icon: X,
    },
  ];

  const navigationShortcuts: ShortcutItem[] = [
    {
      keys: [modKey, 'P'],
      action: language === 'hi' ? 'पार्टी मास्टर (ग्राहक व विक्रेता)' : 'Parties Master Directory',
      description: language === 'hi' ? 'ग्राहक और आपूर्तिकर्ता लेजर सूची खोलें' : 'Open customer and vendor directory & balances',
      icon: Users,
      badge: 'Requested',
    },
    {
      keys: [modKey, 'D'],
      action: language === 'hi' ? 'डैशबोर्ड दृश्य' : 'Dashboard Overview',
      description: language === 'hi' ? 'मुख्य वित्तीय समीक्षा व मेट्रिक्स पर जाएं' : 'Return to main analytics & summary widgets',
      icon: LayoutDashboard,
    },
    {
      keys: [modKey, 'I'],
      action: language === 'hi' ? 'बिक्री चालान सूची' : 'Sales Invoices List',
      description: language === 'hi' ? 'सभी जीएसटी इनवॉइस और भुगतान स्थिति' : 'View all sales invoices and payment records',
      icon: ReceiptText,
    },
    {
      keys: [modKey, 'G'],
      action: language === 'hi' ? 'जीएसटी प्रबंधक' : 'GST Manager & Returns',
      description: language === 'hi' ? 'GSTR-1, GSTR-3B और कर गणना' : 'GSTR-1, GSTR-3B statutory returns portal',
      icon: FileCheck2,
    },
    {
      keys: [modKey, 'T'],
      action: language === 'hi' ? 'टीडीएस अनुपालन' : 'TDS Compliance (Sec 194)',
      description: language === 'hi' ? 'टीडीएस कटौती व चालान प्रबंधन' : 'TDS deductor records, rates & deposit summary',
      icon: Calculator,
    },
    {
      keys: [modKey, 'K'],
      action: language === 'hi' ? 'बैंक समाधान (BRS)' : 'Bank Reconciliation (BRS)',
      description: language === 'hi' ? 'बैंक स्टेटमेंट लेनदेन मिलान' : 'Match bank feed statements with ledger entries',
      icon: Building2,
    },
    {
      keys: [modKey, 'R'],
      action: language === 'hi' ? 'वित्तीय रिपोर्ट' : 'Reports & Financial Statements',
      description: language === 'hi' ? 'लाभ-हानि खाता, बैलेंस शीट व डे-बुक' : 'Profit & Loss, Balance Sheet & Trial Balance',
      icon: BarChart3,
    },
    {
      keys: [modKey, 'Shift', 'E'],
      action: language === 'hi' ? 'ई-चालान पोर्टल (E-Invoice)' : 'E-Invoice Portal (IRN & QR)',
      description: language === 'hi' ? 'आईआरएन निर्माण, पावती व क्यूआर कोड' : 'Rule 48(4) IRN generation, Ack and signed QR codes',
      icon: QrCode,
      badge: 'New',
    },
    {
      keys: [modKey, 'Shift', 'W'],
      action: language === 'hi' ? 'ई-वे बिल पोर्टल (E-Way Bill)' : 'E-Way Bill Portal (EWB)',
      description: language === 'hi' ? 'ई-वे बिल, पार्ट-बी वाहन अपडेट व वैधता विस्तार' : 'Generate EWB, Part-B vehicle updates & validity extensions',
      icon: Truck,
      badge: 'New',
    },
    {
      keys: [modKey, 'M'],
      action: language === 'hi' ? 'कंपनी सेटिंग्स' : 'Company & System Settings',
      description: language === 'hi' ? 'फर्म प्रोफाइल, जीएसटी नंबर व बैकअप' : 'Manage master firm profile and preferences',
      icon: Settings,
    },
  ];

  const utilityShortcuts: ShortcutItem[] = [
    {
      keys: [modKey, '/'],
      action: language === 'hi' ? 'शॉर्टकट मार्गदर्शिका' : 'Keyboard Shortcuts Help',
      description: language === 'hi' ? 'यह मार्गदर्शिका कभी भी खोलें (या ? दबाएं)' : 'Open this cheat sheet anytime (or press ?)',
      icon: Keyboard,
      badge: 'Help',
    },
    {
      keys: [modKey, 'Shift', 'B'],
      action: language === 'hi' ? 'पूर्ण बैकअप डाउनलोड' : 'Full System Backup',
      description: language === 'hi' ? 'सुरक्षित JSON फाइल में संपूर्ण डेटा डाउनलोड करें' : 'Download encrypted JSON statutory system backup',
      icon: Download,
    },
  ];

  const renderKeyGroup = (keys: string[]) => (
    <div className="flex items-center space-x-1 shrink-0">
      {keys.map((k, i) => (
        <React.Fragment key={k + i}>
          <kbd className="px-2 py-1 text-[11px] font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-xs min-w-[24px] text-center inline-block">
            {k}
          </kbd>
          {i < keys.length - 1 && <span className="text-slate-400 text-xs font-bold">+</span>}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-sm">
              <Keyboard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-white text-base">
                  {language === 'hi' ? 'कीबोर्ड शॉर्टकट मार्गदर्शिका' : 'Keyboard Shortcuts Cheatsheet'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {isMac ? 'macOS (⌘ Cmd)' : 'Windows / Linux (Ctrl)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'hi'
                  ? 'पेशेवर चार्टर्ड अकाउंटेंट्स व मुनीमों हेतु सुपरफास्ट नेविगेशन'
                  : 'High-speed keyboard navigation designed for professional accountants'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700">
          {/* Section 1: Quick Vouchers */}
          <div>
            <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-slate-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                {language === 'hi' ? 'वाउचर व प्रविष्टि शॉर्टकट' : 'Voucher & Entry Shortcuts'}
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {language === 'hi' ? 'कहीं से भी तुरंत बनाएं' : 'Create from anywhere'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {voucherShortcuts.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                        <Icon className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {s.action}
                          </span>
                          {s.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {s.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{s.description}</p>
                      </div>
                    </div>
                    {renderKeyGroup(s.keys)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Masters & Navigation */}
          <div>
            <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-slate-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                {language === 'hi' ? 'मास्टर व मॉड्यूल नेविगेशन' : 'Masters & Module Navigation'}
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {language === 'hi' ? '1-क्लिक में मॉड्यूल बदलें' : 'Instant module switcher'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navigationShortcuts.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                        <Icon className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {s.action}
                          </span>
                          {s.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {s.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{s.description}</p>
                      </div>
                    </div>
                    {renderKeyGroup(s.keys)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Utilities */}
          <div>
            <div className="flex items-center justify-between mb-2.5 pb-1 border-b border-slate-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
                <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {language === 'hi' ? 'प्रणाली व बैकअप शॉर्टकट' : 'System & Backup Tools'}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {utilityShortcuts.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 mr-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                        <Icon className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate block">
                          {s.action}
                        </span>
                        <p className="text-[10px] text-slate-500 truncate">{s.description}</p>
                      </div>
                    </div>
                    {renderKeyGroup(s.keys)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accountant Pro-Tip Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {language === 'hi' ? 'अकाउंटेंट टिप (Tally व Busy उपयोगकर्ताओं हेतु):' : 'Accountant Speed Tip:'}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {language === 'hi'
                  ? 'चालान फॉर्म भरते समय Ctrl + S दबाने पर ब्राउज़र का सेव डायलॉग नहीं खुलेगा, बल्कि आपका जीएसटी वाउचर सीधे डेटाबेस में सहेजा जाएगा। किसी भी समय ? या Ctrl + / दबाकर इस गाइड को देख सकते हैं।'
                  : 'Pressing Ctrl + S inside an active invoice/bill modal triggers direct voucher submission to the accounting database without opening browser page save. You can press ? or Ctrl + / anytime to toggle this cheatsheet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            {language === 'hi' ? 'बाहर निकलने के लिए Esc दबाएं' : 'Press Esc to exit anytime'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer transition-colors shadow-xs"
          >
            {language === 'hi' ? 'समझ गया' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
