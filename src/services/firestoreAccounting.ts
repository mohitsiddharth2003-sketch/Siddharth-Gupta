import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
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
} from '../types/accounting';
import {
  INITIAL_COMPANY,
  INITIAL_PARTIES,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_TDS,
  INITIAL_BANK_ITEMS,
  INITIAL_JOURNALS,
  INITIAL_AUDIT_LOGS,
} from './storage';

export interface CompanyAccountingBundle {
  company: CompanyProfile;
  parties: Party[];
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  tdsRecords: TDSRecord[];
  bankItems: BankStatementItem[];
  journals: JournalEntry[];
  auditLogs: AuditLogEntry[];
  exportedAt?: string;
  version?: string;
}

export class FirestoreAccountingService {
  private static localCache: Map<string, CompanyAccountingBundle> = new Map();
  private static isInitializedForCompany: Set<string> = new Set();
  public static lastSyncTimestamp: number = Date.now();
  public static isConnected: boolean = true;

  // Helper to get collection reference under /companies/{companyId}/{subcollection}
  private static getSubColRef(companyId: string, subcollection: string) {
    return collection(db, 'companies', companyId, subcollection);
  }

  // Helper to get doc reference under /companies/{companyId}/{subcollection}/{docId}
  private static getSubDocRef(companyId: string, subcollection: string, docId: string) {
    return doc(db, 'companies', companyId, subcollection, docId);
  }

  /**
   * Load entire accounting bundle for a company from Cloud Firestore.
   * If records do not exist yet in Firestore, seeds initial company dataset.
   */
  static async loadAllForCompany(companyId: string): Promise<CompanyAccountingBundle> {
    const cleanCompanyId = companyId || 'comp_01';
    console.log(`[FirestoreAccounting] Loading accounting dataset for company: ${cleanCompanyId}`);

    try {
      // 1. Fetch Company Profile
      const compDocRef = doc(db, 'companies', cleanCompanyId);
      const compSnap = await getDoc(compDocRef);

      let companyData: CompanyProfile = INITIAL_COMPANY;
      let needsSeed = false;

      if (compSnap.exists()) {
        const snapData = compSnap.data() as Partial<CompanyProfile>;
        companyData = {
          ...INITIAL_COMPANY,
          ...snapData,
          id: cleanCompanyId,
        };
      } else {
        needsSeed = true;
      }

      // 2. Fetch Subcollections in parallel
      const [
        partiesSnap,
        salesSnap,
        purchasesSnap,
        expensesSnap,
        tdsSnap,
        bankSnap,
        journalsSnap,
        logsSnap,
      ] = await Promise.all([
        getDocs(this.getSubColRef(cleanCompanyId, 'parties')),
        getDocs(this.getSubColRef(cleanCompanyId, 'salesInvoices')),
        getDocs(this.getSubColRef(cleanCompanyId, 'purchaseBills')),
        getDocs(this.getSubColRef(cleanCompanyId, 'expenses')),
        getDocs(this.getSubColRef(cleanCompanyId, 'tdsRecords')),
        getDocs(this.getSubColRef(cleanCompanyId, 'bankItems')),
        getDocs(this.getSubColRef(cleanCompanyId, 'journals')),
        getDocs(this.getSubColRef(cleanCompanyId, 'auditLogs')),
      ]);

      let parties: Party[] = partiesSnap.docs.map((d) => d.data() as Party);
      let sales: SalesInvoice[] = salesSnap.docs.map((d) => d.data() as SalesInvoice);
      let purchases: PurchaseBill[] = purchasesSnap.docs.map((d) => d.data() as PurchaseBill);
      let expenses: Expense[] = expensesSnap.docs.map((d) => d.data() as Expense);
      let tdsRecords: TDSRecord[] = tdsSnap.docs.map((d) => d.data() as TDSRecord);
      let bankItems: BankStatementItem[] = bankSnap.docs.map((d) => d.data() as BankStatementItem);
      let journals: JournalEntry[] = journalsSnap.docs.map((d) => d.data() as JournalEntry);
      let auditLogs: AuditLogEntry[] = logsSnap.docs.map((d) => d.data() as AuditLogEntry);

      // If this is a fresh company or demo company with no sales yet in Firestore, seed it once
      if (needsSeed || (sales.length === 0 && cleanCompanyId === 'comp_01')) {
        console.log(`[FirestoreAccounting] Seeding initial dataset for ${cleanCompanyId} to Firestore...`);
        const seedBundle: CompanyAccountingBundle = {
          company: companyData,
          parties: INITIAL_PARTIES,
          sales: INITIAL_SALES,
          purchases: INITIAL_PURCHASES,
          expenses: INITIAL_EXPENSES,
          tdsRecords: INITIAL_TDS,
          bankItems: INITIAL_BANK_ITEMS,
          journals: INITIAL_JOURNALS,
          auditLogs: INITIAL_AUDIT_LOGS,
        };

        await this.persistEntireBundle(cleanCompanyId, seedBundle);
        parties = seedBundle.parties;
        sales = seedBundle.sales;
        purchases = seedBundle.purchases;
        expenses = seedBundle.expenses;
        tdsRecords = seedBundle.tdsRecords;
        bankItems = seedBundle.bankItems;
        journals = seedBundle.journals;
        auditLogs = seedBundle.auditLogs;
      }

      // Sort chronological records
      sales.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
      purchases.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const bundle: CompanyAccountingBundle = {
        company: companyData,
        parties,
        sales,
        purchases,
        expenses,
        tdsRecords,
        bankItems,
        journals,
        auditLogs,
      };

      this.localCache.set(cleanCompanyId, bundle);
      this.isInitializedForCompany.add(cleanCompanyId);
      this.lastSyncTimestamp = Date.now();
      this.isConnected = true;

      // Also sync into local storage as offline cache
      this.saveLocalOfflineBackup(cleanCompanyId, bundle);

      return bundle;
    } catch (err) {
      console.warn(`[FirestoreAccounting] Error loading from Firestore, reading local fallback:`, err);
      this.isConnected = false;
      const fallback = this.loadLocalOfflineBackup(cleanCompanyId);
      this.localCache.set(cleanCompanyId, fallback);
      return fallback;
    }
  }

  /**
   * Persist complete bundle to Firestore in batches
   */
  static async persistEntireBundle(companyId: string, bundle: CompanyAccountingBundle): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';

    try {
      // 1. Save company master
      await setDoc(doc(db, 'companies', cleanCompanyId), {
        ...bundle.company,
        id: cleanCompanyId,
        ownerUid: auth.currentUser?.uid || 'usr_rajesh_01',
        updatedAt: new Date().toISOString(),
      });

      // 2. Batch write records
      const batch = writeBatch(db);

      bundle.parties.forEach((p) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'parties', p.id), p);
      });

      bundle.sales.forEach((s) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'salesInvoices', s.id), s);
      });

      bundle.purchases.forEach((pb) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'purchaseBills', pb.id), pb);
      });

      bundle.expenses.forEach((e) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'expenses', e.id), e);
      });

      bundle.tdsRecords.forEach((t) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'tdsRecords', t.id), t);
      });

      bundle.bankItems.forEach((b) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'bankItems', b.id), b);
      });

      bundle.journals.forEach((j) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'journals', j.id), j);
      });

      bundle.auditLogs.forEach((l) => {
        batch.set(this.getSubDocRef(cleanCompanyId, 'auditLogs', l.id), l);
      });

      await batch.commit();
      console.log(`[FirestoreAccounting] Successfully committed bundle to Firestore for: ${cleanCompanyId}`);
    } catch (err) {
      console.error(`[FirestoreAccounting] Failed to persist bundle to Firestore:`, err);
      throw err;
    }
  }

  // ==========================================
  // MODULE 1: GST & COMPANY SETTINGS
  // ==========================================

  static async saveCompany(companyId: string, comp: CompanyProfile): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await setDoc(doc(db, 'companies', cleanCompanyId), {
        ...comp,
        id: cleanCompanyId,
        ownerUid: auth.currentUser?.uid || 'usr_rajesh_01',
        updatedAt: new Date().toISOString(),
      });
      this.lastSyncTimestamp = Date.now();
    } catch (err) {
      console.warn('[FirestoreAccounting] Could not save company to Firestore, saving to local cache:', err);
    }

    // Update memory & local cache
    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.company = comp;
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // MODULE 2: SALES INVOICES & CREDIT NOTES
  // ==========================================

  static async saveSaleInvoice(
    companyId: string,
    invoice: SalesInvoice
  ): Promise<{ success: boolean; error?: string }> {
    const cleanCompanyId = companyId || 'comp_01';

    // Duplicate Invoice Number Guard
    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      const duplicate = cached.sales.find(
        (s) => s.id !== invoice.id && s.invoiceNumber.trim().toLowerCase() === invoice.invoiceNumber.trim().toLowerCase()
      );
      if (duplicate) {
        return {
          success: false,
          error: `Duplicate Invoice Detected: An invoice with number "${invoice.invoiceNumber}" already exists in the database.`,
        };
      }
    }

    try {
      await setDoc(this.getSubDocRef(cleanCompanyId, 'salesInvoices', invoice.id), invoice);
      this.lastSyncTimestamp = Date.now();
    } catch (err) {
      console.warn('[FirestoreAccounting] Firestore save error for salesInvoice:', err);
    }

    // Update memory
    if (cached) {
      const idx = cached.sales.findIndex((s) => s.id === invoice.id);
      if (idx >= 0) {
        cached.sales[idx] = invoice;
      } else {
        cached.sales.unshift(invoice);
      }
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }

    return { success: true };
  }

  static async deleteSaleInvoice(companyId: string, invoiceId: string): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await deleteDoc(this.getSubDocRef(cleanCompanyId, 'salesInvoices', invoiceId));
      this.lastSyncTimestamp = Date.now();
    } catch (err) {
      console.warn('[FirestoreAccounting] Error deleting sale from Firestore:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.sales = cached.sales.filter((s) => s.id !== invoiceId);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // MODULE 3: PURCHASE BILLS & ITC
  // ==========================================

  static async savePurchaseBill(
    companyId: string,
    bill: PurchaseBill
  ): Promise<{ success: boolean; error?: string }> {
    const cleanCompanyId = companyId || 'comp_01';

    // Check duplicate vendor bill number for same vendor
    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      const duplicate = cached.purchases.find(
        (p) =>
          p.id !== bill.id &&
          p.vendorBillNumber.trim().toLowerCase() === bill.vendorBillNumber.trim().toLowerCase() &&
          p.vendorName.trim().toLowerCase() === bill.vendorName.trim().toLowerCase()
      );
      if (duplicate) {
        return {
          success: false,
          error: `Duplicate Bill: Bill "${bill.vendorBillNumber}" from ${bill.vendorName} is already recorded.`,
        };
      }
    }

    try {
      await setDoc(this.getSubDocRef(cleanCompanyId, 'purchaseBills', bill.id), bill);
      this.lastSyncTimestamp = Date.now();
    } catch (err) {
      console.warn('[FirestoreAccounting] Error saving purchase bill to Firestore:', err);
    }

    if (cached) {
      const idx = cached.purchases.findIndex((p) => p.id === bill.id);
      if (idx >= 0) {
        cached.purchases[idx] = bill;
      } else {
        cached.purchases.unshift(bill);
      }
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }

    return { success: true };
  }

  static async deletePurchaseBill(companyId: string, billId: string): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await deleteDoc(this.getSubDocRef(cleanCompanyId, 'purchaseBills', billId));
      this.lastSyncTimestamp = Date.now();
    } catch (err) {
      console.warn('[FirestoreAccounting] Error deleting purchase bill:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.purchases = cached.purchases.filter((p) => p.id !== billId);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // MODULE 4: PARTIES (CUSTOMERS & VENDORS)
  // ==========================================

  static async saveParty(companyId: string, party: Party): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await setDoc(this.getSubDocRef(cleanCompanyId, 'parties', party.id), party);
      this.lastSyncTimestamp = Date.now();
    } catch (err) {
      console.warn('[FirestoreAccounting] Error saving party:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      const idx = cached.parties.findIndex((p) => p.id === party.id);
      if (idx >= 0) {
        cached.parties[idx] = party;
      } else {
        cached.parties.push(party);
      }
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  static async deleteParty(companyId: string, partyId: string): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await deleteDoc(this.getSubDocRef(cleanCompanyId, 'parties', partyId));
    } catch (err) {
      console.warn('[FirestoreAccounting] Error deleting party:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.parties = cached.parties.filter((p) => p.id !== partyId);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // MODULE 5: BUSINESS EXPENSES
  // ==========================================

  static async saveExpense(companyId: string, expense: Expense): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await setDoc(this.getSubDocRef(cleanCompanyId, 'expenses', expense.id), expense);
    } catch (err) {
      console.warn('[FirestoreAccounting] Error saving expense:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      const idx = cached.expenses.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        cached.expenses[idx] = expense;
      } else {
        cached.expenses.unshift(expense);
      }
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  static async deleteExpense(companyId: string, expenseId: string): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await deleteDoc(this.getSubDocRef(cleanCompanyId, 'expenses', expenseId));
    } catch (err) {
      console.warn('[FirestoreAccounting] Error deleting expense:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.expenses = cached.expenses.filter((e) => e.id !== expenseId);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // MODULE 6: INCOME TAX TDS RECORDS
  // ==========================================

  static async saveTDSRecord(companyId: string, record: TDSRecord): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await setDoc(this.getSubDocRef(cleanCompanyId, 'tdsRecords', record.id), record);
    } catch (err) {
      console.warn('[FirestoreAccounting] Error saving TDS record:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      const idx = cached.tdsRecords.findIndex((t) => t.id === record.id);
      if (idx >= 0) {
        cached.tdsRecords[idx] = record;
      } else {
        cached.tdsRecords.unshift(record);
      }
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  static async deleteTDSRecord(companyId: string, recordId: string): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await deleteDoc(this.getSubDocRef(cleanCompanyId, 'tdsRecords', recordId));
    } catch (err) {
      console.warn('[FirestoreAccounting] Error deleting TDS record:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.tdsRecords = cached.tdsRecords.filter((t) => t.id !== recordId);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // MODULE 7: BANK STATEMENT & RECONCILIATION
  // ==========================================

  static async saveBankItem(companyId: string, item: BankStatementItem): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await setDoc(this.getSubDocRef(cleanCompanyId, 'bankItems', item.id), item);
    } catch (err) {
      console.warn('[FirestoreAccounting] Error saving bank item:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      const idx = cached.bankItems.findIndex((b) => b.id === item.id);
      if (idx >= 0) {
        cached.bankItems[idx] = item;
      } else {
        cached.bankItems.unshift(item);
      }
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  static async deleteBankItem(companyId: string, itemId: string): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await deleteDoc(this.getSubDocRef(cleanCompanyId, 'bankItems', itemId));
    } catch (err) {
      console.warn('[FirestoreAccounting] Error deleting bank item:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.bankItems = cached.bankItems.filter((b) => b.id !== itemId);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // MODULE 8: JOURNAL ENTRIES & AUDIT LOGS
  // ==========================================

  static async saveJournalEntry(companyId: string, entry: JournalEntry): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    try {
      await setDoc(this.getSubDocRef(cleanCompanyId, 'journals', entry.id), entry);
    } catch (err) {
      console.warn('[FirestoreAccounting] Error saving journal entry:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.journals.unshift(entry);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  static async addAuditLog(
    companyId: string,
    action: AuditLogEntry['action'],
    moduleName: string,
    recordId: string,
    details: string,
    userName?: string
  ): Promise<void> {
    const cleanCompanyId = companyId || 'comp_01';
    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      module: moduleName,
      recordId,
      details,
      user: userName || auth.currentUser?.email || 'Authenticated User',
    };

    try {
      // Direct write to immutable auditLogs subcollection
      await setDoc(this.getSubDocRef(cleanCompanyId, 'auditLogs', logEntry.id), logEntry);
    } catch (err) {
      console.warn('[FirestoreAccounting] Notice: audit log buffered:', err);
    }

    const cached = this.localCache.get(cleanCompanyId);
    if (cached) {
      cached.auditLogs.unshift(logEntry);
      this.saveLocalOfflineBackup(cleanCompanyId, cached);
    }
  }

  // ==========================================
  // BACKUP & RESTORE FACILITY
  // ==========================================

  /**
   * Generates a complete JSON backup of the company's accounting data
   */
  static exportBackup(companyId: string): CompanyAccountingBundle {
    const cleanCompanyId = companyId || 'comp_01';
    const bundle = this.localCache.get(cleanCompanyId) || this.loadLocalOfflineBackup(cleanCompanyId);
    return {
      ...bundle,
      exportedAt: new Date().toISOString(),
      version: 'AccountsPro-India-v2.0',
    };
  }

  /**
   * Restores accounting dataset from a validated backup object directly into Firestore
   */
  static async restoreBackup(companyId: string, importedBundle: CompanyAccountingBundle): Promise<boolean> {
    const cleanCompanyId = companyId || 'comp_01';

    if (!importedBundle || !importedBundle.company || !Array.isArray(importedBundle.sales)) {
      throw new Error('Invalid backup file format: Missing company or sales data structures.');
    }

    await this.persistEntireBundle(cleanCompanyId, importedBundle);
    this.localCache.set(cleanCompanyId, importedBundle);
    this.saveLocalOfflineBackup(cleanCompanyId, importedBundle);
    this.lastSyncTimestamp = Date.now();

    await this.addAuditLog(
      cleanCompanyId,
      'RESTORE',
      'System & Backup',
      cleanCompanyId,
      `Restored complete accounting database from backup created at ${importedBundle.exportedAt || 'unknown'}`
    );

    return true;
  }

  // ==========================================
  // OFFLINE CACHE HELPERS
  // ==========================================

  private static saveLocalOfflineBackup(companyId: string, bundle: CompanyAccountingBundle) {
    try {
      localStorage.setItem(`accountspro_db_cache_${companyId}`, JSON.stringify(bundle));
    } catch (e) {
      console.warn('Local cache write limit reached:', e);
    }
  }

  private static loadLocalOfflineBackup(companyId: string): CompanyAccountingBundle {
    try {
      const raw = localStorage.getItem(`accountspro_db_cache_${companyId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Local cache read error:', e);
    }

    return {
      company: INITIAL_COMPANY,
      parties: INITIAL_PARTIES,
      sales: INITIAL_SALES,
      purchases: INITIAL_PURCHASES,
      expenses: INITIAL_EXPENSES,
      tdsRecords: INITIAL_TDS,
      bankItems: INITIAL_BANK_ITEMS,
      journals: INITIAL_JOURNALS,
      auditLogs: INITIAL_AUDIT_LOGS,
    };
  }
}
