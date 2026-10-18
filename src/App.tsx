/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { translations } from './utils/translations';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemAuditModal } from './components/SystemAuditModal';
import { FirebaseSetupGuideModal } from './components/FirebaseSetupGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';

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

  // Modal open states for quick triggers
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isTdsModalOpen, setIsTdsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCloudGuideOpen, setIsCloudGuideOpen] = useState(false);
  const [isSafeResetModalOpen, setIsSafeResetModalOpen] = useState(false);
  const [selectedLedgerPartyId, setSelectedLedgerPartyId] = useState<string | undefined>(undefined);

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
    showToast('Full system backup downloaded.');
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
      />

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
              language={language}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              isCreateOpen={isInvoiceModalOpen}
              setIsCreateOpen={setIsInvoiceModalOpen}
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

      {/* Offline Mode Status Banner (PWA Service Worker) */}
      <OfflineIndicator />
    </div>
  );
}
