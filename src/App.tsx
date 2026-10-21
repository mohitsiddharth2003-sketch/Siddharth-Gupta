/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CompanyProfile,
  Party,
  SalesInvoice,
  PurchaseBill,
  Expense,
  TDSRecord,
  BankStatementItem,
  JournalEntry,
  AuditLogEntry,
  Language,
} from './types/accounting';
import { AuthSession } from './types/auth';
import { AuthService } from './services/auth';
import { FirebaseAuthService } from './services/firebaseAuth';
import { testFirestoreConnection } from './services/firebase';
import { AccountingService } from './services/storage';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveModule } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SalesInvoiceModule } from './components/SalesInvoiceModule';
import { PurchaseBillsModule } from './components/PurchaseBillsModule';
import { ExpenseModule } from './components/ExpenseModule';
import { PartiesModule } from './components/PartiesModule';
import { GSTManagerModule } from './components/GSTManagerModule';
import { TDSManagerModule } from './components/TDSManagerModule';
import { BankReconciliationModule } from './components/BankReconciliationModule';
import { LedgersModule } from './components/LedgersModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { WorkspaceModule } from './components/WorkspaceModule';
import { SafeDataResetModal } from './components/SafeDataResetModal';
import { BackupReminderModal } from './components/BackupReminderModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { translations } from './utils/translations';
import { CheckCircle2, AlertCircle, AlertTriangle, Download, Clock, X, Keyboard } from 'lucide-react';
import { SystemAuditModal } from './components/SystemAuditModal';
import { FirebaseSetupGuideModal } from './components/FirebaseSetupGuideModal';
import { EInvoiceRecord } from './types/einvoice';
import { EWayBillRecord } from './types/ewaybill';
import { EInvoiceModule } from './components/EInvoiceModule';
import { EWayBillModule } from './components/EWayBillModule';
import { PresenceService } from './services/presenceService';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(() =>
    AuthService.getCurrentSession()
  );

  // Cloud sync indicator
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Initialize vault, test Firestore connection, clean demo data and sync company data on startup
  useEffect(() => {
    AuthService.initVault();
    testFirestoreConnection();

    const activeCompanyId =
      localStorage.getItem('accountspro_active_company_id') || currentUser?.companyId || 'comp_01';
    
    // Ensure demo data is completely cleaned as requested
    const cleanedKey = `accountspro_demo_cleaned_v3_${activeCompanyId}`;
    if (!localStorage.getItem(cleanedKey)) {
      AccountingService.clearDemoTransactionalData();
      localStorage.setItem(cleanedKey, 'true');
      refreshAllState();
    }

    setIsCloudSyncing(true);
    AccountingService.syncWithFirestore(activeCompanyId)
      .then(() => {
        refreshAllState();
      })
      .finally(() => {
        setIsCloudSyncing(false);
      });
  }, []);

  // Live Multi-User Presence & Session Synchronization
  useEffect(() => {
    if (currentUser) {
      PresenceService.start(currentUser);
    } else {
      PresenceService.stop();
    }
    return () => {
      PresenceService.stop();
    };
  }, [currentUser]);

  // App data state
  const [company, setCompany] = useState<CompanyProfile>(AccountingService.getCompany());
  const [parties, setParties] = useState<Party[]>(AccountingService.getParties());
  const [sales, setSales] = useState<SalesInvoice[]>(AccountingService.getSales());
  const [purchases, setPurchases] = useState<PurchaseBill[]>(AccountingService.getPurchases());
  const [expenses, setExpenses] = useState<Expense[]>(AccountingService.getExpenses());
  const [tdsRecords, setTdsRecords] = useState<TDSRecord[]>(AccountingService.getTDS());
  const [bankItems, setBankItems] = useState<BankStatementItem[]>(AccountingService.getBankItems());
  const [journals, setJournals] = useState<JournalEntry[]>(AccountingService.getJournals());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(AccountingService.getAuditLogs());
  const [eInvoices, setEInvoices] = useState<EInvoiceRecord[]>(() => AccountingService.getEInvoices());
  const [eWayBills, setEWayBills] = useState<EWayBillRecord[]>(() => AccountingService.getEWayBills());

  // Deep linking and preselection states between Invoices, E-Invoices, and E-Way Bills
  const [preselectedEInvoiceId, setPreselectedEInvoiceId] = useState<string | undefined>(undefined);
  const [preselectedEWayBillInvoiceId, setPreselectedEWayBillInvoiceId] = useState<string | undefined>(undefined);
  const [preselectedEWayBillIrn, setPreselectedEWayBillIrn] = useState<string | undefined>(undefined);

  // Modal open states for quick triggers
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isTdsModalOpen, setIsTdsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCloudGuideOpen, setIsCloudGuideOpen] = useState(false);
  const [isSafeResetModalOpen, setIsSafeResetModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [selectedLedgerPartyId, setSelectedLedgerPartyId] = useState<string | undefined>(undefined);

  // 7-day recurring backup reminder state
  const [backupStatus, setBackupStatus] = useState(() => AccountingService.getBackupDueStatus());
  const [isBackupReminderOpen, setIsBackupReminderOpen] = useState(false);
  const [isBackupBannerDismissed, setIsBackupBannerDismissed] = useState(false);
  const hasAutoPromptedBackup = useRef(false);

  // Periodic recurring check for 7-day backup schedule
  useEffect(() => {
    const checkBackupCadence = () => {
      const status = AccountingService.getBackupDueStatus();
      setBackupStatus(status);

      if (status.isOverdue && !AccountingService.isBackupReminderSnoozed()) {
        if (!hasAutoPromptedBackup.current) {
          hasAutoPromptedBackup.current = true;
          setIsBackupReminderOpen(true);
        }
      }
    };

    // Initial check shortly after load
    const timer = setTimeout(checkBackupCadence, 1000);
    // Recurring interval check every 60 seconds
    const interval = setInterval(checkBackupCadence, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync state helpers
  const refreshAllState = () => {
    setCompany(AccountingService.getCompany());
    setParties(AccountingService.getParties());
    setSales(AccountingService.getSales());
    setPurchases(AccountingService.getPurchases());
    setExpenses(AccountingService.getExpenses());
    setTdsRecords(AccountingService.getTDS());
    setBankItems(AccountingService.getBankItems());
    setJournals(AccountingService.getJournals());
    setAuditLogs(AccountingService.getAuditLogs());
    setEInvoices(AccountingService.getEInvoices());
    setEWayBills(AccountingService.getEWayBills());
    setBackupStatus(AccountingService.getBackupDueStatus());
  };

  const handleSafeResetComplete = () => {
    refreshAllState();
    showToast('Demo transactional data safely purged. All transaction counts are now 0.', 'success');
  };

  // Login & Logout Handlers
  const handleLoginSuccess = async (session: AuthSession) => {
    setCurrentUser(session);
    localStorage.setItem('accountspro_active_company_id', session.companyId);
    setIsCloudSyncing(true);
    try {
      await AccountingService.syncWithFirestore(session.companyId);
      refreshAllState();
      showToast(`Welcome back, ${session.name}! Cloud Firestore records synced.`);
    } catch {
      refreshAllState();
      showToast(`Welcome back, ${session.name}! Session authenticated.`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      await PresenceService.logoutSession(currentUser.token, currentUser.email);
    }
    await FirebaseAuthService.logout();
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  // CRUD handlers
  const handleSaveInvoice = (inv: SalesInvoice) => {
    const res = AccountingService.saveSale(inv);
    if (!res.success) {
      showToast(res.error || 'Failed to save tax invoice', 'error');
      return;
    }
    refreshAllState();
    showToast(`Tax Invoice ${inv.invoiceNumber} saved permanently to database.`);
  };

  const handleDeleteInvoice = (id: string, reason: string) => {
    AccountingService.deleteSale(id);
    AccountingService.addAuditLog('DELETE', 'Sales Invoices', id, `Reason: ${reason}`);
    refreshAllState();
    showToast('Sales Invoice deleted and recorded in audit log.');
  };

  const handleSavePurchase = (bill: PurchaseBill) => {
    const res = AccountingService.savePurchase(bill);
    if (!res.success) {
      showToast(res.error || 'Failed to record purchase bill', 'error');
      return;
    }
    refreshAllState();
    showToast(`Purchase Bill ${bill.vendorBillNumber} recorded permanently.`);
  };

  const handleDeletePurchase = (id: string, reason: string) => {
    AccountingService.deletePurchase(id);
    AccountingService.addAuditLog('DELETE', 'Purchase Bills', id, `Reason: ${reason}`);
    refreshAllState();
    showToast('Purchase Bill deleted and recorded in audit log.');
  };

  const handleSaveExpense = (exp: Expense) => {
    AccountingService.saveExpense(exp);
    refreshAllState();
    showToast(`Expense voucher ${exp.voucherNo} saved.`);
  };

  const handleDeleteExpense = (id: string, reason: string) => {
    AccountingService.deleteExpense(id);
    AccountingService.addAuditLog('DELETE', 'Expenses', id, `Reason: ${reason}`);
    refreshAllState();
    showToast('Expense voucher deleted.');
  };

  const handleSaveParty = (party: Party) => {
    AccountingService.saveParty(party);
    refreshAllState();
    showToast(`Party ${party.name} updated.`);
  };

  const handleDeleteParty = (id: string, reason: string) => {
    const res = AccountingService.deleteParty(id);
    if (!res.success) {
      showToast(res.error || 'Failed to delete party', 'error');
      return;
    }
    AccountingService.addAuditLog('DELETE', 'Parties', id, `Reason: ${reason}`);
    refreshAllState();
    showToast('Party record removed.');
  };

  const handleSaveTDS = (rec: TDSRecord) => {
    AccountingService.saveTDS(rec);
    refreshAllState();
    showToast(`TDS record for ${rec.partyName} saved.`);
  };

  const handleDeleteTDS = (id: string, reason: string) => {
    AccountingService.deleteTDS(id);
    AccountingService.addAuditLog('DELETE', 'TDS Manager', id, `Reason: ${reason}`);
    refreshAllState();
    showToast('TDS entry deleted.');
  };

  const handleMatchBankItem = (
    bankItemId: string,
    bookEntryId: string,
    entryType: 'Sale' | 'Purchase' | 'Expense' | 'Journal'
  ) => {
    AccountingService.matchBankItem(bankItemId, bookEntryId, entryType);
    refreshAllState();
    showToast('Bank transaction reconciled successfully.');
  };

  const handleUnmatchBankItem = (bankItemId: string) => {
    AccountingService.unmatchBankItem(bankItemId);
    refreshAllState();
    showToast('Bank transaction unreconciled.');
  };

  const handleSaveBankItems = (items: BankStatementItem[]) => {
    AccountingService.saveBankItems(items);
    refreshAllState();
    showToast('Bank statement transactions updated.');
  };

  const handleSaveJournal = (j: JournalEntry) => {
    AccountingService.saveJournal(j);
    refreshAllState();
    showToast(`Journal entry ${j.voucherNo} posted.`);
  };

  const handleDeleteJournal = (id: string, reason: string) => {
    AccountingService.deleteJournal(id);
    AccountingService.addAuditLog('DELETE', 'Journals', id, `Reason: ${reason}`);
    refreshAllState();
    showToast('Journal voucher reversed and deleted.');
  };

  const handleUpdateCompany = (comp: CompanyProfile) => {
    AccountingService.updateCompany(comp);
    refreshAllState();
    showToast('Company master settings updated.');
  };

  const handleResetDemo = () => {
    AccountingService.resetToDemoData();
    refreshAllState();
    showToast('Demo data reloaded to initial state.');
  };

  const handleBackup = () => {
    const jsonStr = AccountingService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AccountsPro_India_Backup_${company.financialYear}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const updatedStatus = AccountingService.getBackupDueStatus();
    setBackupStatus(updatedStatus);
    setIsBackupReminderOpen(false);
    refreshAllState();
    showToast('Full system backup downloaded and timestamp logged.');
  };

  const handleSnoozeBackup = (hours = 24) => {
    AccountingService.snoozeBackupReminder(hours);
    setIsBackupReminderOpen(false);
    showToast(`Backup reminder snoozed for ${hours} hours.`);
  };

  const handleSimulateOverdueBackup = () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
    AccountingService.recordBackupTime(undefined, eightDaysAgo);
    try {
      localStorage.removeItem('accountspro_backup_snooze_until');
    } catch {}
    const updated = AccountingService.getBackupDueStatus();
    setBackupStatus(updated);
    setIsBackupBannerDismissed(false);
    setIsBackupReminderOpen(true);
    showToast('Simulated 8-day overdue backup state (reminder triggered).', 'success');
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const res = AccountingService.importFullBackup(content);
      if (res.success) {
        refreshAllState();
        showToast('Accounts restored from JSON backup.');
      } else {
        showToast(res.error || 'Restore failed', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Open statement for a party
  const handleOpenPartyLedger = (partyId: string) => {
    setSelectedLedgerPartyId(partyId);
    setActiveModule('ledgers');
  };

  // E-Invoice Handlers
  const handleSaveEInvoice = (rec: EInvoiceRecord) => {
    AccountingService.saveEInvoice(rec);
    refreshAllState();
    showToast(
      language === 'hi'
        ? 'ई-चालान आईआरएन सुरक्षित रूप से दर्ज किया गया।'
        : 'E-Invoice IRN registered successfully.'
    );
  };

  const handleCancelEInvoice = (irn: string, reason: string, remarks: string) => {
    AccountingService.cancelEInvoice(irn, reason, remarks);
    refreshAllState();
    showToast(
      language === 'hi'
        ? 'ई-चालान रद्द कर दिया गया।'
        : 'E-Invoice cancelled with audit trail.'
    );
  };

  // E-Way Bill Handlers
  const handleSaveEWayBill = (rec: EWayBillRecord) => {
    AccountingService.saveEWayBill(rec);
    refreshAllState();
    showToast(
      language === 'hi'
        ? 'ई-वे बिल सफलतापूर्वक उत्पन्न व सहेजा गया।'
        : 'E-Way Bill generated and saved.'
    );
  };

  const handleUpdatePartB = (
    ewbNo: string,
    update: {
      vehicleNo: string;
      fromPlace: string;
      fromState: string;
      reasonCode: '1' | '2' | '3' | '4';
      reasonRemarks: string;
      transDocNo?: string;
      transDocDate?: string;
    }
  ) => {
    AccountingService.updateEWayBillPartB(ewbNo, update);
    refreshAllState();
    showToast('E-Way Bill Part-B vehicle details updated.');
  };

  const handleExtendValidity = (
    ewbNo: string,
    ext: {
      remainingDistance: number;
      currentPlace: string;
      currentPincode?: string;
      reasonCode: '1' | '2' | '3' | '4' | '5';
      remarks: string;
    }
  ) => {
    AccountingService.extendEWayBillValidity(ewbNo, ext);
    refreshAllState();
    showToast('E-Way Bill validity period extended.');
  };

  const handleCancelEWayBill = (ewbNo: string, reason: string, remarks: string) => {
    AccountingService.cancelEWayBill(ewbNo, reason, remarks);
    refreshAllState();
    showToast('E-Way Bill cancelled with statutory audit log.');
  };

  const handleNavigateToEInvoice = (invoiceId?: string) => {
    setPreselectedEInvoiceId(invoiceId);
    setActiveModule('eInvoice');
  };

  const handleNavigateToEWayBill = (invoiceId?: string, irn?: string) => {
    setPreselectedEWayBillInvoiceId(invoiceId);
    setPreselectedEWayBillIrn(irn);
    setActiveModule('eWayBill');
  };

  // Global Accountant Keyboard Shortcuts Hook (Ctrl+N, Ctrl+S, Ctrl+P, etc.)
  useKeyboardShortcuts({
    enabled: Boolean(currentUser),
    onNewInvoice: () => {
      setActiveModule('salesInvoices');
      setIsInvoiceModalOpen(true);
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: नया बिक्री चालान (Ctrl + N)'
          : '⚡ Shortcut: New Sales Invoice (Ctrl + N)'
      );
    },
    onNewPurchase: () => {
      setActiveModule('purchaseBills');
      setIsPurchaseModalOpen(true);
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: नया खरीद बिल (Ctrl + B)'
          : '⚡ Shortcut: New Purchase Bill (Ctrl + B)'
      );
    },
    onNewExpense: () => {
      setActiveModule('expenses');
      setIsExpenseModalOpen(true);
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: नया खर्च वाउचर (Ctrl + E)'
          : '⚡ Shortcut: New Expense Voucher (Ctrl + E)'
      );
    },
    onOpenParties: () => {
      setActiveModule('parties');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: पार्टी मास्टर (Ctrl + P)'
          : '⚡ Shortcut: Parties Master Directory (Ctrl + P)'
      );
    },
    onOpenDashboard: () => {
      setActiveModule('dashboard');
      showToast(
        language === 'hi' ? '⚡ शॉर्टकट: डैशबोर्ड (Ctrl + D)' : '⚡ Shortcut: Dashboard (Ctrl + D)'
      );
    },
    onOpenSales: () => {
      setActiveModule('salesInvoices');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: बिक्री चालान सूची (Ctrl + I)'
          : '⚡ Shortcut: Sales Invoices List (Ctrl + I)'
      );
    },
    onOpenGST: () => {
      setActiveModule('gstManager');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: जीएसटी प्रबंधक (Ctrl + G)'
          : '⚡ Shortcut: GST Manager (Ctrl + G)'
      );
    },
    onOpenTDS: () => {
      setActiveModule('tdsManager');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: टीडीएस प्रबंधक (Ctrl + T)'
          : '⚡ Shortcut: TDS Compliance (Ctrl + T)'
      );
    },
    onOpenBank: () => {
      setActiveModule('bankReconciliation');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: बैंक समाधान (Ctrl + K)'
          : '⚡ Shortcut: Bank Reconciliation (Ctrl + K)'
      );
    },
    onOpenLedgers: () => {
      setActiveModule('ledgers');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: खाता बही व जर्नल (Ctrl + J)'
          : '⚡ Shortcut: Ledgers & Journals (Ctrl + J)'
      );
    },
    onOpenReports: () => {
      setActiveModule('reports');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: वित्तीय रिपोर्ट (Ctrl + R)'
          : '⚡ Shortcut: Financial Reports (Ctrl + R)'
      );
    },
    onOpenEInvoice: () => {
      setActiveModule('eInvoice');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: ई-चालान पोर्टल (Ctrl + Shift + E)'
          : '⚡ Shortcut: E-Invoice Portal (Ctrl + Shift + E)'
      );
    },
    onOpenEWayBill: () => {
      setActiveModule('eWayBill');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: ई-वे बिल पोर्टल (Ctrl + Shift + W)'
          : '⚡ Shortcut: E-Way Bill Portal (Ctrl + Shift + W)'
      );
    },
    onOpenSettings: () => {
      setActiveModule('settings');
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: सेटिंग्स (Ctrl + M)'
          : '⚡ Shortcut: Company Settings (Ctrl + M)'
      );
    },
    onSave: () => {
      showToast(
        language === 'hi'
          ? '⚡ शॉर्टकट: प्रपत्र सहेजा जा रहा है (Ctrl + S)...'
          : '⚡ Shortcut: Submitting active form (Ctrl + S)...'
      );
    },
    onOpenShortcuts: () => {
      setIsShortcutsModalOpen((prev) => !prev);
    },
    onBackup: handleBackup,
    onEscape: () => {
      setIsShortcutsModalOpen(false);
      setIsInvoiceModalOpen(false);
      setIsPurchaseModalOpen(false);
      setIsExpenseModalOpen(false);
      setIsPartyModalOpen(false);
      setIsTdsModalOpen(false);
      setIsAuditModalOpen(false);
      setIsCloudGuideOpen(false);
      setIsSafeResetModalOpen(false);
      setIsBackupReminderOpen(false);
    },
  });

  // Gatekeeper: If user is not authenticated, show modern Login Page exclusively
  if (!currentUser) {
    return (
      <LoginPage
        language={language}
        onLanguageChange={setLanguage}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Badge counts
  const badgeCounts = {
    invoices: sales.length,
    purchases: purchases.length,
    expenses: expenses.length,
    parties: parties.length,
    tdsPending: tdsRecords.filter((t) => t.status === 'Pending').length,
    bankUnmatched: bankItems.filter((b) => !b.matched).length,
    eInvoices: eInvoices.filter((i) => i.status === 'GENERATED').length,
    eWayBills: eWayBills.filter((w) => w.status === 'ACT').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Navbar with User Profile, Cloud Guide, Demo Reset, Audit & Logout */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        company={company}
        currentUser={currentUser}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onResetDemo={handleResetDemo}
        onSafeReset={() => setIsSafeResetModalOpen(true)}
        onBackup={handleBackup}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenCloudGuide={() => setIsCloudGuideOpen(true)}
        isCloudSyncing={isCloudSyncing}
        isBackupOverdue={backupStatus.isOverdue}
        onOpenBackupReminder={() => setIsBackupReminderOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onSwitchUser={handleLoginSuccess}
        activeModule={activeModule}
        onNavigate={setActiveModule}
      />

      {/* 7-Day Overdue Recurring Backup Notification Banner */}
      {backupStatus.isOverdue && !isBackupBannerDismissed && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2.5 shadow-sm print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-2.5">
              <span className="p-1 rounded-lg bg-white/20 text-white shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold">
                  {language === 'hi' ? 'साप्ताहिक बैकअप अनुस्मारक: ' : 'Weekly Backup Overdue: '}
                </span>
                <span>
                  {backupStatus.daysSince === null
                    ? language === 'hi'
                      ? 'कोई बैकअप रिकॉर्ड नहीं मिला। आयकर व जीएसटी नियमों के अनुसार नियमित ऑफलाइन बैकअप आवश्यक है।'
                      : 'No complete offline system backup has been created yet. Back up your financial records now.'
                    : language === 'hi'
                    ? `अंतिम बैकअप ${backupStatus.daysSince} दिन पहले लिया गया था (7 दिनों से अधिक)।`
                    : `Last system backup was created ${backupStatus.daysSince} days ago (exceeds the 7-day safety cycle).`}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleBackup}
                className="px-3 py-1 bg-white text-amber-900 hover:bg-amber-50 font-bold rounded-lg shadow-xs flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'अभी बैकअप लें' : 'Backup Now'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBackupReminderOpen(true)}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'विवरण' : 'Details'}
              </button>
              <button
                type="button"
                onClick={() => handleSnoozeBackup(24)}
                className="px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Snooze for 24 hours"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsBackupBannerDismissed(true)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          language={language}
          badgeCounts={badgeCounts}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenCloudGuide={() => setIsCloudGuideOpen(true)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Dynamic Module Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeModule === 'dashboard' && (
            <DashboardView
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              parties={parties}
              tdsRecords={tdsRecords}
              eInvoices={eInvoices}
              eWayBills={eWayBills}
              language={language}
              onNavigate={setActiveModule}
              onOpenNewInvoice={() => {
                setActiveModule('salesInvoices');
                setIsInvoiceModalOpen(true);
              }}
              onOpenNewPurchase={() => {
                setActiveModule('purchaseBills');
                setIsPurchaseModalOpen(true);
              }}
              onOpenNewExpense={() => {
                setActiveModule('expenses');
                setIsExpenseModalOpen(true);
              }}
              onOpenNewParty={() => {
                setActiveModule('parties');
                setIsPartyModalOpen(true);
              }}
              onResetDemo={handleResetDemo}
              onSafeReset={() => setIsSafeResetModalOpen(true)}
            />
          )}

          {activeModule === 'salesInvoices' && (
            <SalesInvoiceModule
              sales={sales}
              parties={parties}
              company={company}
              eInvoices={eInvoices}
              eWayBills={eWayBills}
              language={language}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onNavigateToEInvoice={handleNavigateToEInvoice}
              onNavigateToEWayBill={(invId) => handleNavigateToEWayBill(invId)}
              isCreateOpen={isInvoiceModalOpen}
              setIsCreateOpen={setIsInvoiceModalOpen}
            />
          )}

          {activeModule === 'eInvoice' && (
            <EInvoiceModule
              sales={sales}
              company={company}
              eInvoices={eInvoices}
              language={language}
              onSaveEInvoice={handleSaveEInvoice}
              onCancelEInvoice={handleCancelEInvoice}
              onNavigateToEWayBill={handleNavigateToEWayBill}
              preselectedInvoiceId={preselectedEInvoiceId}
            />
          )}

          {activeModule === 'eWayBill' && (
            <EWayBillModule
              sales={sales}
              company={company}
              eWayBills={eWayBills}
              eInvoices={eInvoices}
              language={language}
              onSaveEWayBill={handleSaveEWayBill}
              onUpdatePartB={handleUpdatePartB}
              onExtendValidity={handleExtendValidity}
              onCancelEWayBill={handleCancelEWayBill}
              preselectedInvoiceId={preselectedEWayBillInvoiceId}
              preselectedIrn={preselectedEWayBillIrn}
            />
          )}

          {activeModule === 'purchaseBills' && (
            <PurchaseBillsModule
              purchases={purchases}
              parties={parties}
              company={company}
              language={language}
              onSavePurchase={handleSavePurchase}
              onDeletePurchase={handleDeletePurchase}
              isCreateOpen={isPurchaseModalOpen}
              setIsCreateOpen={setIsPurchaseModalOpen}
            />
          )}

          {activeModule === 'expenses' && (
            <ExpenseModule
              expenses={expenses}
              language={language}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              isCreateOpen={isExpenseModalOpen}
              setIsCreateOpen={setIsExpenseModalOpen}
            />
          )}

          {activeModule === 'parties' && (
            <PartiesModule
              parties={parties}
              sales={sales}
              purchases={purchases}
              language={language}
              onSaveParty={handleSaveParty}
              onDeleteParty={handleDeleteParty}
              onOpenLedger={handleOpenPartyLedger}
              isCreateOpen={isPartyModalOpen}
              setIsCreateOpen={setIsPartyModalOpen}
            />
          )}

          {activeModule === 'gstManager' && (
            <GSTManagerModule
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              company={company}
              language={language}
            />
          )}

          {activeModule === 'tdsManager' && (
            <TDSManagerModule
              tdsRecords={tdsRecords}
              parties={parties}
              language={language}
              onSaveTDS={handleSaveTDS}
              onDeleteTDS={handleDeleteTDS}
              isCreateOpen={isTdsModalOpen}
              setIsCreateOpen={setIsTdsModalOpen}
            />
          )}

          {activeModule === 'bankReconciliation' && (
            <BankReconciliationModule
              bankItems={bankItems}
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              company={company}
              language={language}
              onMatch={handleMatchBankItem}
              onUnmatch={handleUnmatchBankItem}
              onSaveBankItems={handleSaveBankItems}
            />
          )}

          {activeModule === 'ledgers' && (
            <LedgersModule
              parties={parties}
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              journals={journals}
              company={company}
              language={language}
              onSaveJournal={handleSaveJournal}
              onDeleteJournal={handleDeleteJournal}
              selectedPartyId={selectedLedgerPartyId}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              parties={parties}
              company={company}
              language={language}
            />
          )}

          {activeModule === 'workspace' && (
            <WorkspaceModule companyName={company.name} />
          )}

          {activeModule === 'settings' && (
            <SettingsModule
              company={company}
              auditLogs={auditLogs}
              language={language}
              onUpdateCompany={handleUpdateCompany}
              onResetDemo={handleResetDemo}
              onOpenSafeReset={() => setIsSafeResetModalOpen(true)}
              onBackup={handleBackup}
              onRestore={handleRestore}
              lastBackupStatus={backupStatus}
              onOpenBackupReminder={() => setIsBackupReminderOpen(true)}
              onSimulateOverdueBackup={handleSimulateOverdueBackup}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-lg bg-slate-900 text-white text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 7-Day Recurring Backup Reminder Modal */}
      <BackupReminderModal
        isOpen={isBackupReminderOpen}
        onClose={() => setIsBackupReminderOpen(false)}
        onBackupNow={handleBackup}
        onSnooze={handleSnoozeBackup}
        daysSince={backupStatus.daysSince}
        lastBackupFormatted={backupStatus.formattedDate}
        recordCounts={{
          sales: sales.length,
          purchases: purchases.length,
          expenses: expenses.length,
          parties: parties.length,
          tds: tdsRecords.length,
          journals: journals.length,
        }}
        language={language}
      />

      {/* Safe Data Reset Modal */}
      <SafeDataResetModal
        isOpen={isSafeResetModalOpen}
        onClose={() => setIsSafeResetModalOpen(false)}
        onResetComplete={handleSafeResetComplete}
      />

      {/* System Audit & Verification Modal */}
      <SystemAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        language={language}
      />

      {/* Cloud & Firebase Setup Guide Modal */}
      <FirebaseSetupGuideModal
        isOpen={isCloudGuideOpen}
        onClose={() => setIsCloudGuideOpen(false)}
        language={language}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        language={language}
      />
    </div>
  );
}
