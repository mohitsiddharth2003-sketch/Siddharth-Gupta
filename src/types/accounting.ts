export type Language = 'en' | 'hi';

export interface CompanyProfile {
  id: string;
  name: string;
  tradeName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  stateCode: string; // e.g. "27"
  pincode: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  financialYear: string; // e.g. "2026-2027"
  invoicePrefix: string; // e.g. "INV/26-27/"
  invoiceNextNumber: number;
  reverseChargeDefault: boolean;
  termsAndConditions: string;
}

export type PartyType = 'Customer' | 'Vendor' | 'Both';
export type BalanceType = 'Dr' | 'Cr';

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  phone: string;
  email?: string;
  billingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pincode?: string;
  openingBalance: number;
  openingBalanceType: BalanceType;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
}

export type UnitType = 'PCS' | 'BOX' | 'KG' | 'MTR' | 'SET' | 'NOS' | 'HRS' | 'DAY' | 'LTR' | 'BAG';
export type GSTRate = 0 | 5 | 12 | 18 | 28;

export interface InvoiceItem {
  id: string;
  description: string;
  hsnSac: string;
  qty: number;
  unit: UnitType;
  rate: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: GSTRate;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Cancelled';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank Transfer (NEFT/RTGS)' | 'UPI' | 'Cheque' | 'Card';
  referenceNo?: string;
  notes?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerPan?: string;
  customerPhone?: string;
  customerState: string;
  customerStateCode: string;
  billingAddress: string;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  isInterState: boolean;
  isRcm: boolean; // Reverse Charge
  items: InvoiceItem[];
  subTotal: number;
  discountTotal: number;
  totalTaxable: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  totalInWords: string;
  notes?: string;
  termsAndConditions?: string;
  status: InvoiceStatus;
  amountPaid: number;
  balanceDue: number;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type ITCEligibility = 'Eligible' | 'Ineligible' | 'Blocked_17_5';
export type PurchaseStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

export interface PurchaseBill {
  id: string;
  billNumber: string;
  vendorBillNumber: string;
  billDate: string;
  dueDate: string;
  vendorId: string;
  vendorName: string;
  vendorGstin?: string;
  vendorState: string;
  vendorStateCode: string;
  isInterState: boolean;
  items: InvoiceItem[];
  subTotal: number;
  totalTaxable: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  itcEligibility: ITCEligibility;
  paymentStatus: PurchaseStatus;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Rent'
  | 'Office Supplies'
  | 'Electricity & Utilities'
  | 'Travel & Conveyance'
  | 'Professional & Legal Fees'
  | 'Repairs & Maintenance'
  | 'Salaries & Wages'
  | 'Freight & Logistics'
  | 'Marketing & Advertising'
  | 'Software & Subscriptions'
  | 'Bank Charges'
  | 'Taxes & Licenses'
  | 'Miscellaneous';

export type PaymentMode = 'Cash' | 'Bank Transfer (NEFT/RTGS)' | 'UPI' | 'Cheque' | 'Credit/Debit Card';

export interface Expense {
  id: string;
  voucherNo: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  gstApplicable: boolean;
  gstRate: GSTRate;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  itcClaimed: boolean;
  paymentMode: PaymentMode;
  referenceNo?: string;
  paidTo?: string;
  vendorGstin?: string;
  notes?: string;
  createdAt: string;
}

export type TDSSectionCode = 
  | '194C_IND'
  | '194C_OTH'
  | '194J_TECH'
  | '194J_PROF'
  | '194I_RENT_BLDG'
  | '194I_RENT_PLANT'
  | '194H'
  | '194Q'
  | '192';

export interface TDSConfig {
  sectionCode: TDSSectionCode;
  section: string;
  title: string;
  defaultRate: number;
  thresholdLimit: number;
  description: string;
}

export type TDSStatus = 'Pending' | 'Deposited' | 'Overdue';

export interface TDSRecord {
  id: string;
  sectionCode: TDSSectionCode;
  section: string;
  sectionTitle: string;
  partyId?: string;
  partyName: string;
  partyPan: string;
  invoiceOrRef: string;
  transactionDate: string;
  paymentAmount: number;
  applicableRate: number;
  isHigherDeduction206AA: boolean; // 20% if PAN missing/invalid
  tdsDeducted: number;
  tdsDeposited: number;
  challanBsrCode?: string;
  challanTenderDate?: string;
  challanSerialNo?: string;
  dueDate: string;
  status: TDSStatus;
  flagForReview: boolean;
  reviewReason?: string;
  createdAt: string;
}

export interface BankStatementItem {
  id: string;
  date: string;
  description: string;
  refOrChequeNo: string;
  withdrawal: number;
  deposit: number;
  balance: number;
  matched: boolean;
  matchedBookEntryId?: string;
  matchedEntryType?: 'Sale' | 'Purchase' | 'Expense' | 'Journal';
  notes?: string;
}

export interface JournalEntry {
  id: string;
  voucherNo: string;
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration: string;
  partyId?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'MATCH' | 'RECONCILE';
  module: string;
  recordId: string;
  details: string;
  user: string;
}

export interface LedgerTransaction {
  date: string;
  type: 'Sales Invoice' | 'Purchase Bill' | 'Expense' | 'Payment Received' | 'Payment Made' | 'Journal' | 'Opening Balance';
  referenceNo: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: BalanceType;
}

export interface StateInfo {
  code: string;
  name: string;
}
