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
import { EInvoiceRecord } from '../types/einvoice';
import { EWayBillRecord } from '../types/ewaybill';
import { numberToWordsINR } from '../utils/indianFormatters';
import { FirestoreAccountingService } from './firestoreAccounting';

const STORAGE_KEYS = {
  COMPANY: 'accountspro_company',
  PARTIES: 'accountspro_parties',
  SALES: 'accountspro_sales',
  PURCHASES: 'accountspro_purchases',
  EXPENSES: 'accountspro_expenses',
  TDS: 'accountspro_tds',
  BANK_ITEMS: 'accountspro_bank_items',
  JOURNALS: 'accountspro_journals',
  AUDIT_LOG: 'accountspro_audit_log',
  IS_DEMO: 'accountspro_is_demo',
  EINVOICES: 'accountspro_einvoices',
  EWAYBILLS: 'accountspro_ewaybills',
};

export const INITIAL_COMPANY: CompanyProfile = {
  id: 'comp_01',
  name: 'Shree Ganesh Enterprises Pvt Ltd',
  tradeName: 'Ganesh Tech & Engineering Solutions',
  gstin: '27AABCS1429B1Z8',
  pan: 'AABCS1429B',
  address: 'Plot No. 42, Sector 9, MIDC Industrial Area, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '400093',
  phone: '+91 98201 54321',
  email: 'accounts@ganeshenterprises.in',
  bankName: 'HDFC Bank Ltd',
  bankAccountNo: '50200034189021',
  bankIfsc: 'HDFC0000060',
  bankBranch: 'MIDC Andheri East Branch, Mumbai',
  financialYear: '2026-2027',
  invoicePrefix: 'SGE/26-27/',
  invoiceNextNumber: 104,
  reverseChargeDefault: false,
  termsAndConditions:
    '1. Payment is strictly due within 15 days of invoice date.\n2. Overdue interest @18% p.a. will be levied after due date.\n3. Goods once sold will not be accepted back.\n4. Subject to Mumbai Jurisdiction only.',
};

export const INITIAL_PARTIES: Party[] = [];

export const SAMPLE_DEMO_PARTIES: Party[] = [
  {
    id: 'party_cust_01',
    type: 'Customer',
    name: 'Apex Retail Technologies Ltd',
    tradeName: 'Apex Retail',
    gstin: '27AAACA9012K1ZP',
    pan: 'AAACA9012K',
    phone: '+91 98112 34567',
    email: 'billing@apexretail.com',
    billingAddress: 'Tower B, 4th Floor, Mindspace Tech Park, Malad West',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400064',
    openingBalance: 45000,
    openingBalanceType: 'Dr',
    creditLimit: 500000,
    notes: 'Key enterprise account with 15 days payment terms.',
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'party_cust_02',
    type: 'Customer',
    name: 'Bangalore Cloud Systems LLP',
    tradeName: 'CloudSys South',
    gstin: '29AABFB4031E1Z3',
    pan: 'AABFB4031E',
    phone: '+91 80234 56789',
    email: 'finance@cloudsys.in',
    billingAddress: 'No. 88, 100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    stateCode: '29',
    pincode: '560038',
    openingBalance: 120000,
    openingBalanceType: 'Dr',
    creditLimit: 1000000,
    notes: 'Inter-State supply customer, attracts 18% IGST.',
    createdAt: '2026-04-02T11:30:00Z',
  },
  {
    id: 'party_vend_01',
    type: 'Vendor',
    name: 'Delhi Tech Wholesale Hub Pvt Ltd',
    tradeName: 'Delhi Tech Hub',
    gstin: '07AAACD8765L1Z1',
    pan: 'AAACD8765L',
    phone: '+91 11456 78901',
    email: 'sales@delhitechhub.in',
    billingAddress: '402, Nehru Place Commercial Complex',
    city: 'New Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110019',
    openingBalance: 78000,
    openingBalanceType: 'Cr',
    notes: 'Hardware and server supplier, Inter-State IGST credit.',
    createdAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'party_vend_02',
    type: 'Vendor',
    name: 'Maharashtra Office Stationers',
    tradeName: 'Stationers Pro',
    gstin: '27AABCM6743J1Z9',
    pan: 'AABCM6743J',
    phone: '+91 97654 32109',
    email: 'orders@mstationers.in',
    billingAddress: 'Shop 12, Station Road, Dadar West',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400028',
    openingBalance: 15400,
    openingBalanceType: 'Cr',
    notes: 'Monthly office consumables vendor.',
    createdAt: '2026-04-03T14:15:00Z',
  },
  {
    id: 'party_vend_03',
    type: 'Vendor',
    name: 'Advocate V. K. Sharma & Associates',
    tradeName: 'Sharma Law Chambers',
    gstin: '27AAQPS8812A1Z4',
    pan: 'AAQPS8812A',
    phone: '+91 98210 11223',
    email: 'vksharma@sharmachambers.com',
    billingAddress: 'Chamber 204, High Court Annexe, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400001',
    openingBalance: 0,
    openingBalanceType: 'Cr',
    notes: 'Legal & compliance retainership. Subject to TDS u/s 194J.',
    createdAt: '2026-04-05T16:00:00Z',
  },
];

export const INITIAL_SALES: SalesInvoice[] = [];

export const SAMPLE_DEMO_SALES: SalesInvoice[] = [
  {
    id: 'inv_01',
    invoiceNumber: 'SGE/26-27/101',
    invoiceDate: '2026-04-05',
    dueDate: '2026-04-20',
    customerId: 'party_cust_01',
    customerName: 'Apex Retail Technologies Ltd',
    customerGstin: '27AAACA9012K1ZP',
    customerPan: 'AAACA9012K',
    customerPhone: '+91 98112 34567',
    customerState: 'Maharashtra',
    customerStateCode: '27',
    billingAddress: 'Tower B, 4th Floor, Mindspace Tech Park, Malad West, Mumbai, MH - 400064',
    placeOfSupply: 'Maharashtra',
    placeOfSupplyCode: '27',
    isInterState: false,
    isRcm: false,
    items: [
      {
        id: 'item_101_1',
        description: 'Enterprise ERP Implementation & Accounting Setup',
        hsnSac: '998314',
        qty: 1,
        unit: 'SET',
        rate: 85000,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 85000,
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        cgstAmount: 7650,
        sgstAmount: 7650,
        igstAmount: 0,
        totalAmount: 100300,
      },
      {
        id: 'item_101_2',
        description: 'Biometric Attendance Devices with Cloud Sync',
        hsnSac: '847190',
        qty: 4,
        unit: 'NOS',
        rate: 6500,
        discountPercent: 5,
        discountAmount: 1300,
        taxableAmount: 24700,
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        cgstAmount: 2223,
        sgstAmount: 2223,
        igstAmount: 0,
        totalAmount: 29146,
      },
    ],
    subTotal: 111000,
    discountTotal: 1300,
    totalTaxable: 109700,
    cgstTotal: 9873,
    sgstTotal: 9873,
    igstTotal: 0,
    roundOff: 0,
    grandTotal: 129446,
    totalInWords: numberToWordsINR(129446),
    notes: 'Thank you for your business. Please quote invoice number when transferring funds.',
    termsAndConditions: '1. Payment due within 15 days.\n2. Goods/Services verified and accepted.',
    status: 'Issued',
    amountPaid: 50000,
    balanceDue: 79446,
    payments: [
      {
        id: 'pay_101_1',
        date: '2026-04-10',
        amount: 50000,
        paymentMode: 'Bank Transfer (NEFT/RTGS)',
        referenceNo: 'HDFCR5202604100918',
        notes: 'Part advance received via NEFT',
      },
    ],
    createdAt: '2026-04-05T11:00:00Z',
    updatedAt: '2026-04-10T12:00:00Z',
  },
  {
    id: 'inv_02',
    invoiceNumber: 'SGE/26-27/102',
    invoiceDate: '2026-04-08',
    dueDate: '2026-04-23',
    customerId: 'party_cust_02',
    customerName: 'Bangalore Cloud Systems LLP',
    customerGstin: '29AABFB4031E1Z3',
    customerPan: 'AABFB4031E',
    customerPhone: '+91 80234 56789',
    customerState: 'Karnataka',
    customerStateCode: '29',
    billingAddress: 'No. 88, 100 Feet Road, Indiranagar, Bengaluru, KA - 560038',
    placeOfSupply: 'Karnataka',
    placeOfSupplyCode: '29',
    isInterState: true,
    isRcm: false,
    items: [
      {
        id: 'item_102_1',
        description: 'Annual Cloud Architecture Consulting & Maintenance',
        hsnSac: '998315',
        qty: 1,
        unit: 'SET',
        rate: 150000,
        discountPercent: 10,
        discountAmount: 15000,
        taxableAmount: 135000,
        gstRate: 18,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 24300,
        totalAmount: 159300,
      },
    ],
    subTotal: 150000,
    discountTotal: 15000,
    totalTaxable: 135000,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 24300,
    roundOff: 0,
    grandTotal: 159300,
    totalInWords: numberToWordsINR(159300),
    notes: 'Inter-State supply of services under IGST Act.',
    status: 'Paid',
    amountPaid: 159300,
    balanceDue: 0,
    payments: [
      {
        id: 'pay_102_1',
        date: '2026-04-12',
        amount: 159300,
        paymentMode: 'Bank Transfer (NEFT/RTGS)',
        referenceNo: 'UTIBR5202604128834',
        notes: 'Full payment received into HDFC account',
      },
    ],
    createdAt: '2026-04-08T14:30:00Z',
    updatedAt: '2026-04-12T16:00:00Z',
  },
  {
    id: 'inv_03',
    invoiceNumber: 'SGE/26-27/103',
    invoiceDate: '2026-04-12',
    dueDate: '2026-04-27',
    customerId: 'party_cust_01',
    customerName: 'Apex Retail Technologies Ltd',
    customerGstin: '27AAACA9012K1ZP',
    customerPan: 'AAACA9012K',
    customerPhone: '+91 98112 34567',
    customerState: 'Maharashtra',
    customerStateCode: '27',
    billingAddress: 'Tower B, 4th Floor, Mindspace Tech Park, Malad West, Mumbai, MH - 400064',
    placeOfSupply: 'Maharashtra',
    placeOfSupplyCode: '27',
    isInterState: false,
    isRcm: false,
    items: [
      {
        id: 'item_103_1',
        description: 'Thermal Receipt Rolls & Barcode Labels (50 Boxes)',
        hsnSac: '481190',
        qty: 50,
        unit: 'BOX',
        rate: 800,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 40000,
        gstRate: 12,
        cgstRate: 6,
        sgstRate: 6,
        igstRate: 0,
        cgstAmount: 2400,
        sgstAmount: 2400,
        igstAmount: 0,
        totalAmount: 44800,
      },
    ],
    subTotal: 40000,
    discountTotal: 0,
    totalTaxable: 40000,
    cgstTotal: 2400,
    sgstTotal: 2400,
    igstTotal: 0,
    roundOff: 0,
    grandTotal: 44800,
    totalInWords: numberToWordsINR(44800),
    status: 'Issued',
    amountPaid: 0,
    balanceDue: 44800,
    payments: [],
    createdAt: '2026-04-12T10:00:00Z',
    updatedAt: '2026-04-12T10:00:00Z',
  },
];

export const INITIAL_PURCHASES: PurchaseBill[] = [];

export const SAMPLE_DEMO_PURCHASES: PurchaseBill[] = [
  {
    id: 'pb_01',
    billNumber: 'PB/26-27/001',
    vendorBillNumber: 'DTH/26/8941',
    billDate: '2026-04-03',
    dueDate: '2026-04-18',
    vendorId: 'party_vend_01',
    vendorName: 'Delhi Tech Wholesale Hub Pvt Ltd',
    vendorGstin: '07AAACD8765L1Z1',
    vendorState: 'Delhi',
    vendorStateCode: '07',
    isInterState: true,
    items: [
      {
        id: 'pitem_01',
        description: 'Server Rack Mount Units & Switch Hardware',
        hsnSac: '847170',
        qty: 2,
        unit: 'SET',
        rate: 42000,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 84000,
        gstRate: 18,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 15120,
        totalAmount: 99120,
      },
    ],
    subTotal: 84000,
    totalTaxable: 84000,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 15120,
    roundOff: 0,
    grandTotal: 99120,
    itcEligibility: 'Eligible',
    paymentStatus: 'Paid',
    amountPaid: 99120,
    balanceDue: 0,
    notes: 'Eligible ITC claimed in GSTR-3B Table 4(A)(5)',
    createdAt: '2026-04-03T11:00:00Z',
  },
  {
    id: 'pb_02',
    billNumber: 'PB/26-27/002',
    vendorBillNumber: 'MOS/APR/091',
    billDate: '2026-04-06',
    dueDate: '2026-04-21',
    vendorId: 'party_vend_02',
    vendorName: 'Maharashtra Office Stationers',
    vendorGstin: '27AABCM6743J1Z9',
    vendorState: 'Maharashtra',
    vendorStateCode: '27',
    isInterState: false,
    items: [
      {
        id: 'pitem_02',
        description: 'Copier Paper, Printing Cartridges, Filing Folders',
        hsnSac: '480210',
        qty: 1,
        unit: 'SET',
        rate: 18500,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 18500,
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        cgstAmount: 1665,
        sgstAmount: 1665,
        igstAmount: 0,
        totalAmount: 21830,
      },
    ],
    subTotal: 18500,
    totalTaxable: 18500,
    cgstTotal: 1665,
    sgstTotal: 1665,
    igstTotal: 0,
    roundOff: 0,
    grandTotal: 21830,
    itcEligibility: 'Eligible',
    paymentStatus: 'Unpaid',
    amountPaid: 0,
    balanceDue: 21830,
    notes: 'Intra-state purchase, eligible for CGST & SGST credit.',
    createdAt: '2026-04-06T15:00:00Z',
  },
];

export const INITIAL_EXPENSES: Expense[] = [];

export const SAMPLE_DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp_01',
    voucherNo: 'EXP/26-27/001',
    date: '2026-04-02',
    category: 'Rent',
    description: 'Office Premises Rent for MIDC Andheri Office (Month of April)',
    amount: 50000,
    gstApplicable: true,
    gstRate: 18,
    cgst: 4500,
    sgst: 4500,
    igst: 0,
    totalAmount: 59000,
    itcClaimed: true,
    paymentMode: 'Bank Transfer (NEFT/RTGS)',
    referenceNo: 'HDFCR5202604020012',
    paidTo: 'Apex Realty Properties Ltd',
    vendorGstin: '27AAACP1122D1ZV',
    notes: 'Subject to TDS 194I @ 10% (Rent)',
    createdAt: '2026-04-02T10:00:00Z',
  },
  {
    id: 'exp_02',
    voucherNo: 'EXP/26-27/002',
    date: '2026-04-05',
    category: 'Electricity & Utilities',
    description: 'Tata Power Commercial Electricity Bill for March consumption',
    amount: 14200,
    gstApplicable: false,
    gstRate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 14200,
    itcClaimed: false,
    paymentMode: 'UPI',
    referenceNo: 'UPI/TATAPOWER/389102',
    paidTo: 'Tata Power Ltd',
    notes: 'Utility bill, GST exempt',
    createdAt: '2026-04-05T12:00:00Z',
  },
  {
    id: 'exp_03',
    voucherNo: 'EXP/26-27/003',
    date: '2026-04-07',
    category: 'Professional & Legal Fees',
    description: 'Retainership Fee for Corporate Law & Secretarial Audit',
    amount: 35000,
    gstApplicable: true,
    gstRate: 18,
    cgst: 3150,
    sgst: 3150,
    igst: 0,
    totalAmount: 41300,
    itcClaimed: true,
    paymentMode: 'Bank Transfer (NEFT/RTGS)',
    referenceNo: 'HDFCR5202604079812',
    paidTo: 'Advocate V. K. Sharma & Associates',
    vendorGstin: '27AAQPS8812A1Z4',
    notes: 'TDS deducted u/s 194J @ 10%',
    createdAt: '2026-04-07T14:00:00Z',
  },
  {
    id: 'exp_04',
    voucherNo: 'EXP/26-27/004',
    date: '2026-04-10',
    category: 'Travel & Conveyance',
    description: 'Local client visits & fuel expenses for marketing team',
    amount: 4850,
    gstApplicable: false,
    gstRate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 4850,
    itcClaimed: false,
    paymentMode: 'Cash',
    referenceNo: 'PETTY/APR/12',
    paidTo: 'Petty Cash Impress',
    notes: 'Reimbursed through petty cash book',
    createdAt: '2026-04-10T16:00:00Z',
  },
];

export const INITIAL_TDS: TDSRecord[] = [];

export const SAMPLE_DEMO_TDS: TDSRecord[] = [
  {
    id: 'tds_01',
    sectionCode: '194J_PROF',
    section: '194J',
    sectionTitle: 'Professional Fees (Legal retainership)',
    partyId: 'party_vend_03',
    partyName: 'Advocate V. K. Sharma & Associates',
    partyPan: 'AAQPS8812A',
    invoiceOrRef: 'EXP/26-27/003',
    transactionDate: '2026-04-07',
    paymentAmount: 35000,
    applicableRate: 10,
    isHigherDeduction206AA: false,
    tdsDeducted: 3500,
    tdsDeposited: 0,
    dueDate: '2026-05-07',
    status: 'Pending',
    flagForReview: false,
    reviewReason: '',
    createdAt: '2026-04-07T14:30:00Z',
  },
  {
    id: 'tds_02',
    sectionCode: '194I_RENT_BLDG',
    section: '194I(a)',
    sectionTitle: 'Rent of Office Land & Building',
    partyName: 'Apex Realty Properties Ltd',
    partyPan: 'AAACP1122D',
    invoiceOrRef: 'EXP/26-27/001',
    transactionDate: '2026-04-02',
    paymentAmount: 50000,
    applicableRate: 10,
    isHigherDeduction206AA: false,
    tdsDeducted: 5000,
    tdsDeposited: 5000,
    challanBsrCode: '0210045',
    challanTenderDate: '2026-04-04',
    challanSerialNo: '04918',
    dueDate: '2026-05-07',
    status: 'Deposited',
    flagForReview: false,
    reviewReason: '',
    createdAt: '2026-04-02T11:00:00Z',
  },
  {
    id: 'tds_03',
    sectionCode: '194C_OTH',
    section: '194C',
    sectionTitle: 'Contractor Payment (Annual Server Maintenance)',
    partyName: 'Rapid Tech Support Services',
    partyPan: '', // Missing PAN!
    invoiceOrRef: 'CONT/2026/088',
    transactionDate: '2026-04-11',
    paymentAmount: 40000,
    applicableRate: 20, // 206AA higher deduction!
    isHigherDeduction206AA: true,
    tdsDeducted: 8000,
    tdsDeposited: 0,
    dueDate: '2026-05-07',
    status: 'Pending',
    flagForReview: true,
    reviewReason: 'Section 206AA Alert: Party PAN missing or unlinked. Higher deduction @ 20% enforced.',
    createdAt: '2026-04-11T12:00:00Z',
  },
];

export const INITIAL_BANK_ITEMS: BankStatementItem[] = [];

export const SAMPLE_DEMO_BANK_ITEMS: BankStatementItem[] = [
  {
    id: 'bnk_01',
    date: '2026-04-02',
    description: 'NEFT-RENT APEX REALTY-HDFCR5202604020012',
    refOrChequeNo: 'HDFCR5202604020012',
    withdrawal: 54000, // 59000 less 5000 TDS
    deposit: 0,
    balance: 446000,
    matched: true,
    matchedBookEntryId: 'exp_01',
    matchedEntryType: 'Expense',
    notes: 'Rent payment net of 10% TDS',
  },
  {
    id: 'bnk_02',
    date: '2026-04-03',
    description: 'RTGS-DELHI TECH WHOLESALE-DTH/26/8941',
    refOrChequeNo: 'UTIBR5202604031122',
    withdrawal: 99120,
    deposit: 0,
    balance: 346880,
    matched: true,
    matchedBookEntryId: 'pb_01',
    matchedEntryType: 'Purchase',
    notes: 'Full settlement of hardware purchase bill',
  },
  {
    id: 'bnk_03',
    date: '2026-04-10',
    description: 'NEFT-CR APEX RETAIL TECH-ADVANCE INV101',
    refOrChequeNo: 'HDFCR5202604100918',
    withdrawal: 0,
    deposit: 50000,
    balance: 396880,
    matched: true,
    matchedBookEntryId: 'inv_01',
    matchedEntryType: 'Sale',
    notes: 'Advance against invoice 101',
  },
  {
    id: 'bnk_04',
    date: '2026-04-12',
    description: 'RTGS-CR BANGALORE CLOUD SYSTEMS-FULL PMT',
    refOrChequeNo: 'UTIBR5202604128834',
    withdrawal: 0,
    deposit: 159300,
    balance: 556180,
    matched: true,
    matchedBookEntryId: 'inv_02',
    matchedEntryType: 'Sale',
    notes: 'Invoice 102 settled in full',
  },
  {
    id: 'bnk_05',
    date: '2026-04-13',
    description: 'CHQ DEP 849201-CLEARING PENDING',
    refOrChequeNo: 'CHQ849201',
    withdrawal: 0,
    deposit: 45000,
    balance: 601180,
    matched: false,
    notes: 'Unreconciled cheque in transit from client',
  },
  {
    id: 'bnk_06',
    date: '2026-04-14',
    description: 'BANK SERVICE CHARGES & CONSOLIDATED SMS',
    refOrChequeNo: 'BKCHG-APR26',
    withdrawal: 413,
    deposit: 0,
    balance: 600767,
    matched: false,
    notes: 'Bank debit charges awaiting book journal entry',
  },
];

export const INITIAL_JOURNALS: JournalEntry[] = [];

export const SAMPLE_DEMO_JOURNALS: JournalEntry[] = [
  {
    id: 'jnl_01',
    voucherNo: 'JV/26-27/001',
    date: '2026-04-01',
    debitAccount: 'Bank Account (HDFC)',
    creditAccount: 'Capital Account (Director Share)',
    amount: 500000,
    narration: 'Being opening business equity injected into current bank account',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'jnl_02',
    voucherNo: 'JV/26-27/002',
    date: '2026-04-02',
    debitAccount: 'Rent Expense Account',
    creditAccount: 'TDS Payable u/s 194I',
    amount: 5000,
    narration: 'Being TDS @ 10% deducted on April office rent payment',
    createdAt: '2026-04-02T10:30:00Z',
  },
];

export const INITIAL_EINVOICES: EInvoiceRecord[] = [];

export const SAMPLE_DEMO_EINVOICES: EInvoiceRecord[] = [
  {
    id: 'einv_demo_01',
    invoiceId: 'inv_01',
    invoiceNumber: 'SGE/26-27/101',
    invoiceDate: '2026-04-05',
    supplyType: 'B2B',
    sellerGstin: '27AABCS1429B1Z8',
    sellerLegalName: 'Shree Ganesh Enterprises Pvt Ltd',
    sellerTradeName: 'Ganesh Tech & Engineering Solutions',
    sellerAddress: 'Plot No. 42, Sector 9, MIDC Industrial Area, Andheri East',
    sellerPlace: 'Mumbai',
    sellerStateCode: '27',
    sellerPincode: '400093',
    buyerGstin: '27AAACA9012K1ZP',
    buyerLegalName: 'Apex Retail Technologies Ltd',
    buyerTradeName: 'Apex Retail',
    buyerAddress: 'Tower B, 4th Floor, Mindspace Tech Park, Malad West',
    buyerPlace: 'Mumbai',
    buyerStateCode: '27',
    buyerPincode: '400064',
    placeOfSupplyCode: '27',
    totalTaxableValue: 109700,
    cgstValue: 9873,
    sgstValue: 9873,
    igstValue: 0,
    roundOff: 0,
    totalInvoiceValue: 129446,
    items: [
      {
        itemNo: 1,
        productDesc: 'Enterprise Cloud Accounting & ERP Software Implementation',
        isService: true,
        hsnCode: '998313',
        quantity: 1,
        unit: 'NOS',
        unitPrice: 109700,
        totalAmount: 109700,
        discount: 0,
        taxableAmount: 109700,
        gstRate: 18,
        cgstAmount: 9873,
        sgstAmount: 9873,
        igstAmount: 0,
        totalItemValue: 129446,
      },
    ],
    irn: '5C72D24E1955AEF9B27CA74D7653F8CEE8457D284D8BF582695507E882E47481',
    ackNo: '1126109482910482',
    ackDate: '2026-04-05T10:35:00Z',
    signedQRCode: 'NIC:EINVOICE:1.03:27AABCS1429B1Z8:27AAACA9012K1ZP:SGE/26-27/101:INV:2026-04-05:129446:1:998313:5C72D24E1955AEF9B27CA74D7653F8CEE8457D284D8BF582695507E882E47481',
    signedInvoicePayload: JSON.stringify({
      Version: '1.03',
      DocDtls: { Typ: 'INV', No: 'SGE/26-27/101', Dt: '2026-04-05' },
      Irn: '5C72D24E1955AEF9B27CA74D7653F8CEE8457D284D8BF582695507E882E47481',
      Status: 'ACT',
    }, null, 2),
    status: 'GENERATED',
    isSandbox: true,
    irpProvider: 'NIC-Sandbox (Simulation Engine)',
    createdAt: '2026-04-05T10:35:00Z',
    updatedAt: '2026-04-05T10:35:00Z',
  },
];

export const INITIAL_EWAYBILLS: EWayBillRecord[] = [];

export const SAMPLE_DEMO_EWAYBILLS: EWayBillRecord[] = [
  {
    id: 'ewb_demo_01',
    ewbNo: '241088492019',
    ewbDate: '2026-04-05T11:00:00Z',
    validUpto: '2026-04-07T23:59:59Z',
    status: 'ACT',
    invoiceId: 'inv_01',
    invoiceNumber: 'SGE/26-27/101',
    irn: '5C72D24E1955AEF9B27CA74D7653F8CEE8457D284D8BF582695507E882E47481',
    supplyType: 'Outward',
    subSupplyType: 'Supply',
    docType: 'INV',
    docNo: 'SGE/26-27/101',
    docDate: '2026-04-05',
    fromGstin: '27AABCS1429B1Z8',
    fromTradeName: 'Ganesh Tech & Engineering Solutions',
    fromAddress: 'Plot No. 42, Sector 9, MIDC Industrial Area, Andheri East',
    fromPlace: 'Mumbai',
    fromPincode: '400093',
    fromStateCode: '27',
    toGstin: '27AAACA9012K1ZP',
    toTradeName: 'Apex Retail Technologies Ltd',
    toAddress: 'Tower B, 4th Floor, Mindspace Tech Park, Malad West',
    toPlace: 'Mumbai',
    toPincode: '400064',
    toStateCode: '27',
    totalValue: 129446,
    totalTaxable: 109700,
    cgstValue: 9873,
    sgstValue: 9873,
    igstValue: 0,
    items: [
      {
        itemNo: 1,
        productName: 'Server & ERP Hardware System',
        hsnCode: '847130',
        quantity: 1,
        unit: 'SET',
        taxableAmount: 109700,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        totalAmount: 129446,
      },
    ],
    transporterId: '27AABCT2345C1Z1',
    transporterName: 'Express Logistics India',
    transMode: '1',
    transDocNo: 'LR/2026/8849',
    transDocDate: '2026-04-05',
    vehicleNo: 'MH02AB1234',
    vehicleType: 'R',
    distance: 45,
    partBHistory: [
      {
        vehicleNo: 'MH02AB1234',
        fromPlace: 'Mumbai MIDC',
        fromState: '27',
        reasonCode: '4',
        reasonRemarks: 'First time dispatch assignment',
        transDocNo: 'LR/2026/8849',
        transDocDate: '2026-04-05',
        updatedAt: '2026-04-05T11:00:00Z',
      },
    ],
    validityExtensionHistory: [],
    isSandbox: true,
    irpProvider: 'NIC-EWB-Sandbox (Simulation Engine)',
    createdAt: '2026-04-05T11:00:00Z',
    updatedAt: '2026-04-05T11:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_01',
    timestamp: '2026-04-01T08:00:00Z',
    action: 'CREATE',
    module: 'System',
    recordId: 'init_fy2627',
    details: 'Financial Year 2026-2027 opened with demo enterprise ledger schema.',
    user: 'Senior Accountant (Mohit)',
  },
  {
    id: 'log_02',
    timestamp: '2026-04-05T11:00:00Z',
    action: 'CREATE',
    module: 'Sales Invoices',
    recordId: 'inv_01',
    details: 'Generated Tax Invoice SGE/26-27/101 for Apex Retail Technologies Ltd (₹1,29,446).',
    user: 'Senior Accountant (Mohit)',
  },
  {
    id: 'log_03',
    timestamp: '2026-04-11T12:00:00Z',
    action: 'CREATE',
    module: 'TDS Manager',
    recordId: 'tds_03',
    details: 'Enforced Section 206AA 20% higher deduction on contractor due to absent PAN.',
    user: 'Tax Auditor',
  },
];

function getScopedKey(key: string): string {
  try {
    const activeCompanyId = localStorage.getItem('accountspro_active_company_id');
    if (!activeCompanyId || activeCompanyId === 'comp_01') {
      return key;
    }
    return `${key}_${activeCompanyId}`;
  } catch {
    return key;
  }
}

// Helper to get or set local storage
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const scoped = getScopedKey(key);
    const raw = localStorage.getItem(scoped);
    if (raw === null) {
      const activeCompanyId = localStorage.getItem('accountspro_active_company_id');
      const isPurged = localStorage.getItem(`accountspro_demo_purged_${activeCompanyId || 'comp_01'}`) === 'true';
      if (isPurged && Array.isArray(defaultValue)) {
        localStorage.setItem(scoped, JSON.stringify([]));
        return [] as unknown as T;
      }
      if (activeCompanyId && activeCompanyId !== 'comp_01') {
        let initialVal: any = Array.isArray(defaultValue) ? [] : defaultValue;
        if (key === STORAGE_KEYS.COMPANY) {
          const sessionRaw = localStorage.getItem('accountspro_auth_session_v1');
          if (sessionRaw) {
            const sess = JSON.parse(sessionRaw);
            initialVal = {
              ...INITIAL_COMPANY,
              id: sess.companyId,
              name: sess.companyName || 'My Accounting Entity',
              tradeName: sess.companyName || 'My Entity',
              gstin: sess.companyGstin || '',
              pan: sess.companyGstin && sess.companyGstin.length >= 10 ? sess.companyGstin.substring(2, 12) : '',
            };
          }
        }
        localStorage.setItem(scoped, JSON.stringify(initialVal));
        return initialVal as T;
      }
      localStorage.setItem(scoped, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    const scoped = getScopedKey(key);
    localStorage.setItem(scoped, JSON.stringify(val));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export class AccountingService {
  static getActiveCompanyId(): string {
    try {
      return localStorage.getItem('accountspro_active_company_id') || 'comp_01';
    } catch {
      return 'comp_01';
    }
  }

  // Sync entire accounting database from Cloud Firestore
  static async syncWithFirestore(companyId?: string): Promise<boolean> {
    const compId = companyId || this.getActiveCompanyId();
    try {
      const bundle = await FirestoreAccountingService.loadAllForCompany(compId);
      if (bundle) {
        setStorage(STORAGE_KEYS.COMPANY, bundle.company);
        setStorage(STORAGE_KEYS.PARTIES, bundle.parties);
        setStorage(STORAGE_KEYS.SALES, bundle.sales);
        setStorage(STORAGE_KEYS.PURCHASES, bundle.purchases);
        setStorage(STORAGE_KEYS.EXPENSES, bundle.expenses);
        setStorage(STORAGE_KEYS.TDS, bundle.tdsRecords);
        setStorage(STORAGE_KEYS.BANK_ITEMS, bundle.bankItems);
        setStorage(STORAGE_KEYS.JOURNALS, bundle.journals);
        setStorage(STORAGE_KEYS.AUDIT_LOG, bundle.auditLogs);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[AccountingService] Notice: could not load from Firestore, using cached ledger:', err);
      return false;
    }
  }

  // Company
  static getCompany(): CompanyProfile {
    return getStorage<CompanyProfile>(STORAGE_KEYS.COMPANY, INITIAL_COMPANY);
  }

  static updateCompany(comp: CompanyProfile): void {
    const compId = this.getActiveCompanyId();
    setStorage(STORAGE_KEYS.COMPANY, comp);
    this.addAuditLog('UPDATE', 'Settings', comp.id, 'Updated company profile and bank details.');
    FirestoreAccountingService.saveCompany(compId, comp).catch((err) => {
      console.warn('[AccountingService] Firestore company update background warning:', err);
    });
  }

  // Parties
  static getParties(): Party[] {
    return getStorage<Party[]>(STORAGE_KEYS.PARTIES, INITIAL_PARTIES);
  }

  static saveParty(party: Party): void {
    const compId = this.getActiveCompanyId();
    const parties = this.getParties();
    const idx = parties.findIndex((p) => p.id === party.id);
    if (idx >= 0) {
      parties[idx] = party;
      this.addAuditLog('UPDATE', 'Parties', party.id, `Updated party ${party.name} (${party.type}).`);
    } else {
      parties.push(party);
      this.addAuditLog('CREATE', 'Parties', party.id, `Created new party ${party.name} (${party.type}).`);
    }
    setStorage(STORAGE_KEYS.PARTIES, parties);
    FirestoreAccountingService.saveParty(compId, party).catch((err) => {
      console.warn('[AccountingService] Firestore party save warning:', err);
    });
  }

  static deleteParty(id: string): { success: boolean; error?: string } {
    const compId = this.getActiveCompanyId();
    // Check if party has invoices or bills
    const sales = this.getSales();
    const hasSales = sales.some((s) => s.customerId === id);
    if (hasSales) {
      return { success: false, error: 'Cannot delete party: Active sales invoices exist for this customer.' };
    }

    const purchases = this.getPurchases();
    const hasPurchases = purchases.some((p) => p.vendorId === id);
    if (hasPurchases) {
      return { success: false, error: 'Cannot delete party: Active purchase bills exist for this vendor.' };
    }

    const parties = this.getParties().filter((p) => p.id !== id);
    setStorage(STORAGE_KEYS.PARTIES, parties);
    this.addAuditLog('DELETE', 'Parties', id, 'Deleted party record after validation.');
    FirestoreAccountingService.deleteParty(compId, id).catch((err) => {
      console.warn('[AccountingService] Firestore party delete warning:', err);
    });
    return { success: true };
  }

  // Sales
  static getSales(): SalesInvoice[] {
    return getStorage<SalesInvoice[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  }

  static saveSale(inv: SalesInvoice): { success: boolean; error?: string } {
    const compId = this.getActiveCompanyId();
    const sales = this.getSales();

    // Prevent duplicate invoice numbers within the company
    const duplicate = sales.find(
      (s) => s.id !== inv.id && s.invoiceNumber.trim().toLowerCase() === inv.invoiceNumber.trim().toLowerCase()
    );
    if (duplicate) {
      return {
        success: false,
        error: `Duplicate Invoice Detected: Tax Invoice "${inv.invoiceNumber}" already exists in the company records.`,
      };
    }

    const idx = sales.findIndex((s) => s.id === inv.id);
    if (idx >= 0) {
      sales[idx] = inv;
      this.addAuditLog('UPDATE', 'Sales Invoices', inv.id, `Updated invoice ${inv.invoiceNumber} (₹${inv.grandTotal}).`);
    } else {
      sales.unshift(inv);
      // increment next invoice number
      const company = this.getCompany();
      company.invoiceNextNumber += 1;
      this.updateCompany(company);
      this.addAuditLog('CREATE', 'Sales Invoices', inv.id, `Created invoice ${inv.invoiceNumber} for ${inv.customerName} (₹${inv.grandTotal}).`);
    }
    setStorage(STORAGE_KEYS.SALES, sales);

    // Persist to Cloud Firestore
    FirestoreAccountingService.saveSaleInvoice(compId, inv).catch((err) => {
      console.warn('[AccountingService] Firestore save sale warning:', err);
    });

    return { success: true };
  }

  static deleteSale(id: string): void {
    const compId = this.getActiveCompanyId();
    const sale = this.getSales().find((s) => s.id === id);
    const sales = this.getSales().filter((s) => s.id !== id);
    setStorage(STORAGE_KEYS.SALES, sales);
    this.addAuditLog('DELETE', 'Sales Invoices', id, `Cancelled and deleted invoice ${sale?.invoiceNumber || id}.`);
    FirestoreAccountingService.deleteSaleInvoice(compId, id).catch((err) => {
      console.warn('[AccountingService] Firestore delete sale warning:', err);
    });
  }

  // Purchases
  static getPurchases(): PurchaseBill[] {
    return getStorage<PurchaseBill[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  }

  static savePurchase(bill: PurchaseBill): { success: boolean; error?: string } {
    const compId = this.getActiveCompanyId();
    const list = this.getPurchases();

    // Prevent duplicate bill numbers from the same vendor
    const duplicate = list.find(
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

    const idx = list.findIndex((p) => p.id === bill.id);
    if (idx >= 0) {
      list[idx] = bill;
      this.addAuditLog('UPDATE', 'Purchase Bills', bill.id, `Updated purchase bill ${bill.vendorBillNumber}.`);
    } else {
      list.unshift(bill);
      this.addAuditLog('CREATE', 'Purchase Bills', bill.id, `Recorded purchase bill ${bill.vendorBillNumber} from ${bill.vendorName} (₹${bill.grandTotal}).`);
    }
    setStorage(STORAGE_KEYS.PURCHASES, list);
    FirestoreAccountingService.savePurchaseBill(compId, bill).catch((err) => {
      console.warn('[AccountingService] Firestore save purchase warning:', err);
    });
    return { success: true };
  }

  static deletePurchase(id: string): void {
    const compId = this.getActiveCompanyId();
    const bill = this.getPurchases().find((p) => p.id === id);
    const list = this.getPurchases().filter((p) => p.id !== id);
    setStorage(STORAGE_KEYS.PURCHASES, list);
    this.addAuditLog('DELETE', 'Purchase Bills', id, `Deleted purchase bill ${bill?.vendorBillNumber || id}.`);
    FirestoreAccountingService.deletePurchaseBill(compId, id).catch((err) => {
      console.warn('[AccountingService] Firestore delete purchase warning:', err);
    });
  }

  // Expenses
  static getExpenses(): Expense[] {
    return getStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  static saveExpense(exp: Expense): void {
    const compId = this.getActiveCompanyId();
    const list = this.getExpenses();
    const idx = list.findIndex((e) => e.id === exp.id);
    if (idx >= 0) {
      list[idx] = exp;
      this.addAuditLog('UPDATE', 'Expenses', exp.id, `Updated expense voucher ${exp.voucherNo}.`);
    } else {
      list.unshift(exp);
      this.addAuditLog('CREATE', 'Expenses', exp.id, `Recorded expense ${exp.voucherNo} for ${exp.category} (₹${exp.amount}).`);
    }
    setStorage(STORAGE_KEYS.EXPENSES, list);
    FirestoreAccountingService.saveExpense(compId, exp).catch((err) => {
      console.warn('[AccountingService] Firestore save expense warning:', err);
    });
  }

  static deleteExpense(id: string): void {
    const compId = this.getActiveCompanyId();
    const exp = this.getExpenses().find((e) => e.id === id);
    const list = this.getExpenses().filter((e) => e.id !== id);
    setStorage(STORAGE_KEYS.EXPENSES, list);
    this.addAuditLog('DELETE', 'Expenses', id, `Deleted expense voucher ${exp?.voucherNo || id}.`);
    FirestoreAccountingService.deleteExpense(compId, id).catch((err) => {
      console.warn('[AccountingService] Firestore delete expense warning:', err);
    });
  }

  // TDS
  static getTDS(): TDSRecord[] {
    return getStorage<TDSRecord[]>(STORAGE_KEYS.TDS, INITIAL_TDS);
  }

  static saveTDS(record: TDSRecord): void {
    const compId = this.getActiveCompanyId();
    const list = this.getTDS();
    const idx = list.findIndex((t) => t.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
      this.addAuditLog('UPDATE', 'TDS Manager', record.id, `Updated TDS record u/s ${record.section} for ${record.partyName}.`);
    } else {
      list.unshift(record);
      this.addAuditLog('CREATE', 'TDS Manager', record.id, `Recorded TDS deduction u/s ${record.section} (₹${record.tdsDeducted}) for ${record.partyName}.`);
    }
    setStorage(STORAGE_KEYS.TDS, list);
    FirestoreAccountingService.saveTDSRecord(compId, record).catch((err) => {
      console.warn('[AccountingService] Firestore save TDS warning:', err);
    });
  }

  static deleteTDS(id: string): void {
    const compId = this.getActiveCompanyId();
    const item = this.getTDS().find((t) => t.id === id);
    const list = this.getTDS().filter((t) => t.id !== id);
    setStorage(STORAGE_KEYS.TDS, list);
    this.addAuditLog('DELETE', 'TDS Manager', id, `Deleted TDS entry u/s ${item?.section || id}.`);
    FirestoreAccountingService.deleteTDSRecord(compId, id).catch((err) => {
      console.warn('[AccountingService] Firestore delete TDS warning:', err);
    });
  }

  // Bank Items (BRS)
  static getBankItems(): BankStatementItem[] {
    return getStorage<BankStatementItem[]>(STORAGE_KEYS.BANK_ITEMS, INITIAL_BANK_ITEMS);
  }

  static saveBankItems(items: BankStatementItem[]): void {
    const compId = this.getActiveCompanyId();
    setStorage(STORAGE_KEYS.BANK_ITEMS, items);
    items.forEach((item) => {
      FirestoreAccountingService.saveBankItem(compId, item).catch(() => {});
    });
  }

  static matchBankItem(bankItemId: string, bookEntryId: string, entryType: 'Sale' | 'Purchase' | 'Expense' | 'Journal'): void {
    const compId = this.getActiveCompanyId();
    const items = this.getBankItems();
    const item = items.find((i) => i.id === bankItemId);
    if (item) {
      item.matched = true;
      item.matchedBookEntryId = bookEntryId;
      item.matchedEntryType = entryType;
      setStorage(STORAGE_KEYS.BANK_ITEMS, items);
      this.addAuditLog('MATCH', 'Bank Reconciliation', bankItemId, `Matched bank item "${item.description}" to ${entryType} record #${bookEntryId}.`);
      FirestoreAccountingService.saveBankItem(compId, item).catch(() => {});
    }
  }

  static unmatchBankItem(bankItemId: string): void {
    const compId = this.getActiveCompanyId();
    const items = this.getBankItems();
    const item = items.find((i) => i.id === bankItemId);
    if (item) {
      item.matched = false;
      item.matchedBookEntryId = undefined;
      item.matchedEntryType = undefined;
      setStorage(STORAGE_KEYS.BANK_ITEMS, items);
      this.addAuditLog('RECONCILE', 'Bank Reconciliation', bankItemId, `Unmatched bank item "${item.description}".`);
      FirestoreAccountingService.saveBankItem(compId, item).catch(() => {});
    }
  }

  // Journal Entries
  static getJournals(): JournalEntry[] {
    return getStorage<JournalEntry[]>(STORAGE_KEYS.JOURNALS, INITIAL_JOURNALS);
  }

  static saveJournal(entry: JournalEntry): void {
    const compId = this.getActiveCompanyId();
    const list = this.getJournals();
    const idx = list.findIndex((j) => j.id === entry.id);
    if (idx >= 0) {
      list[idx] = entry;
      this.addAuditLog('UPDATE', 'Journals', entry.id, `Updated journal voucher ${entry.voucherNo}.`);
    } else {
      list.unshift(entry);
      this.addAuditLog('CREATE', 'Journals', entry.id, `Posted journal entry ${entry.voucherNo}: Dr ${entry.debitAccount} / Cr ${entry.creditAccount} (₹${entry.amount}).`);
    }
    setStorage(STORAGE_KEYS.JOURNALS, list);
    FirestoreAccountingService.saveJournalEntry(compId, entry).catch(() => {});
  }

  static deleteJournal(id: string): void {
    const entry = this.getJournals().find((j) => j.id === id);
    const list = this.getJournals().filter((j) => j.id !== id);
    setStorage(STORAGE_KEYS.JOURNALS, list);
    this.addAuditLog('DELETE', 'Journals', id, `Reversed and deleted journal entry ${entry?.voucherNo || id}.`);
  }

  // Audit Log
  static getAuditLogs(): AuditLogEntry[] {
    return getStorage<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOG, INITIAL_AUDIT_LOGS);
  }

  static addAuditLog(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'MATCH' | 'RECONCILE',
    module: string,
    recordId: string,
    details: string,
    user = 'Senior Accountant'
  ): void {
    const compId = this.getActiveCompanyId();
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      module,
      recordId,
      details,
      user,
    };
    logs.unshift(newEntry);
    setStorage(STORAGE_KEYS.AUDIT_LOG, logs.slice(0, 500)); // maintain up to 500 records
    FirestoreAccountingService.addAuditLog(compId, action, module, recordId, details, user).catch(() => {});
  }

  // ==========================================
  // E-INVOICE STATUTORY METHODS
  // ==========================================
  static getEInvoices(): EInvoiceRecord[] {
    return getStorage<EInvoiceRecord[]>(STORAGE_KEYS.EINVOICES, INITIAL_EINVOICES);
  }

  static saveEInvoice(rec: EInvoiceRecord): { success: boolean; error?: string } {
    const list = this.getEInvoices();
    const existingIdx = list.findIndex((e) => e.id === rec.id || e.irn === rec.irn);
    if (existingIdx >= 0) {
      list[existingIdx] = rec;
      this.addAuditLog('UPDATE', 'E-Invoice', rec.irn, `Updated E-Invoice status to ${rec.status} for Invoice ${rec.invoiceNumber}.`);
    } else {
      list.unshift(rec);
      this.addAuditLog('CREATE', 'E-Invoice', rec.irn, `Generated statutory IRN ${rec.irn.substring(0, 16)}... for Invoice ${rec.invoiceNumber} (${rec.isSandbox ? 'SANDBOX DEMO' : 'LIVE'}).`);
    }
    setStorage(STORAGE_KEYS.EINVOICES, list);
    return { success: true };
  }

  static getEInvoiceByInvoiceId(invId: string): EInvoiceRecord | undefined {
    return this.getEInvoices().find((e) => e.invoiceId === invId || e.invoiceNumber === invId);
  }

  static getEInvoiceByIrn(irn: string): EInvoiceRecord | undefined {
    return this.getEInvoices().find((e) => e.irn === irn);
  }

  static cancelEInvoice(irn: string, reason: string, remarks: string, user = 'Senior Accountant'): { success: boolean; error?: string } {
    const list = this.getEInvoices();
    const target = list.find((e) => e.irn === irn);
    if (!target) {
      return { success: false, error: 'E-Invoice record not found' };
    }
    target.status = 'CANCELLED';
    target.cancelReason = (reason as any) || '4';
    target.cancelRemarks = remarks;
    target.cancelledAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.EINVOICES, list);
    this.addAuditLog('UPDATE', 'E-Invoice', irn, `Cancelled IRN for Invoice ${target.invoiceNumber}. Reason: ${remarks}`, user);
    return { success: true };
  }

  static deleteEInvoice(id: string): void {
    const list = this.getEInvoices().filter((e) => e.id !== id && e.irn !== id);
    setStorage(STORAGE_KEYS.EINVOICES, list);
    this.addAuditLog('DELETE', 'E-Invoice', id, 'Deleted local e-invoice record cache.');
  }

  // ==========================================
  // E-WAY BILL STATUTORY METHODS
  // ==========================================
  static getEWayBills(): EWayBillRecord[] {
    return getStorage<EWayBillRecord[]>(STORAGE_KEYS.EWAYBILLS, INITIAL_EWAYBILLS);
  }

  static saveEWayBill(ewb: EWayBillRecord): { success: boolean; error?: string } {
    const list = this.getEWayBills();
    const existingIdx = list.findIndex((e) => e.id === ewb.id || e.ewbNo === ewb.ewbNo);
    if (existingIdx >= 0) {
      list[existingIdx] = ewb;
      this.addAuditLog('UPDATE', 'E-Way Bill', ewb.ewbNo, `Updated E-Way Bill ${ewb.ewbNo} status: ${ewb.status}.`);
    } else {
      list.unshift(ewb);
      this.addAuditLog('CREATE', 'E-Way Bill', ewb.ewbNo, `Generated statutory E-Way Bill ${ewb.ewbNo} for Doc ${ewb.docNo} (${ewb.isSandbox ? 'SANDBOX DEMO' : 'LIVE'}).`);
    }
    setStorage(STORAGE_KEYS.EWAYBILLS, list);
    return { success: true };
  }

  static getEWayBillById(id: string): EWayBillRecord | undefined {
    return this.getEWayBills().find((e) => e.id === id);
  }

  static getEWayBillByEwbNo(ewbNo: string): EWayBillRecord | undefined {
    return this.getEWayBills().find((e) => e.ewbNo === ewbNo);
  }

  static getEWayBillByInvoiceId(invId: string): EWayBillRecord | undefined {
    return this.getEWayBills().find((e) => e.invoiceId === invId || e.invoiceNumber === invId || e.docNo === invId);
  }

  static updateEWayBillPartB(
    ewbNo: string,
    update: { vehicleNo: string; fromPlace: string; fromState: string; reasonCode: '1' | '2' | '3' | '4'; reasonRemarks: string; transDocNo?: string; transDocDate?: string },
    user = 'Transport Officer'
  ): { success: boolean; error?: string } {
    const list = this.getEWayBills();
    const target = list.find((e) => e.ewbNo === ewbNo);
    if (!target) return { success: false, error: 'E-Way Bill not found' };

    target.vehicleNo = update.vehicleNo.toUpperCase();
    target.partBHistory.push({
      vehicleNo: update.vehicleNo.toUpperCase(),
      fromPlace: update.fromPlace,
      fromState: update.fromState,
      reasonCode: update.reasonCode,
      reasonRemarks: update.reasonRemarks,
      transDocNo: update.transDocNo,
      transDocDate: update.transDocDate,
      updatedAt: new Date().toISOString(),
    });
    target.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.EWAYBILLS, list);
    this.addAuditLog('UPDATE', 'E-Way Bill', ewbNo, `Updated Part B: Assigned vehicle ${update.vehicleNo} at ${update.fromPlace}.`, user);
    return { success: true };
  }

  static extendEWayBillValidity(
    ewbNo: string,
    extension: { remainingDistance: number; currentPlace: string; currentPincode?: string; reasonCode: '1' | '2' | '3' | '4' | '5'; remarks: string },
    user = 'Senior Accountant'
  ): { success: boolean; error?: string } {
    const list = this.getEWayBills();
    const target = list.find((e) => e.ewbNo === ewbNo);
    if (!target) return { success: false, error: 'E-Way Bill not found' };

    const addDays = Math.max(1, Math.ceil(extension.remainingDistance / 200));
    const newValidUptoDate = new Date(Date.now() + addDays * 24 * 60 * 60 * 1000);
    newValidUptoDate.setHours(23, 59, 59, 999);
    const newValidUpto = newValidUptoDate.toISOString();

    target.validUpto = newValidUpto;
    target.validityExtensionHistory.push({
      remainingDistance: extension.remainingDistance,
      currentPlace: extension.currentPlace,
      currentPincode: extension.currentPincode,
      reasonCode: extension.reasonCode,
      remarks: extension.remarks,
      extendedUpto: newValidUpto,
      updatedAt: new Date().toISOString(),
    });
    target.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.EWAYBILLS, list);
    this.addAuditLog('UPDATE', 'E-Way Bill', ewbNo, `Extended validity upto ${new Date(newValidUpto).toLocaleDateString('en-IN')} for remaining ${extension.remainingDistance} KM.`, user);
    return { success: true };
  }

  static cancelEWayBill(ewbNo: string, reason: string, remarks: string, user = 'Senior Accountant'): { success: boolean; error?: string } {
    const list = this.getEWayBills();
    const target = list.find((e) => e.ewbNo === ewbNo);
    if (!target) return { success: false, error: 'E-Way Bill not found' };

    target.status = 'CNL';
    target.cancelReason = (reason as any) || '4';
    target.cancelRemarks = remarks;
    target.cancelledAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.EWAYBILLS, list);
    this.addAuditLog('UPDATE', 'E-Way Bill', ewbNo, `Cancelled E-Way Bill ${ewbNo}. Reason: ${remarks}`, user);
    return { success: true };
  }

  static deleteEWayBill(id: string): void {
    const list = this.getEWayBills().filter((e) => e.id !== id && e.ewbNo !== id);
    setStorage(STORAGE_KEYS.EWAYBILLS, list);
    this.addAuditLog('DELETE', 'E-Way Bill', id, 'Deleted local e-way bill record cache.');
  }

  // Backup & Restore
  static exportFullBackup(): string {
    const compId = this.getActiveCompanyId();
    const data = FirestoreAccountingService.exportBackup(compId);
    this.recordBackupTime(compId);
    return JSON.stringify(data, null, 2);
  }

  static getLastBackupTime(companyId?: string): string | null {
    try {
      const compId = companyId || this.getActiveCompanyId();
      return (
        localStorage.getItem(`accountspro_last_backup_time_${compId}`) ||
        localStorage.getItem('accountspro_last_backup_time') ||
        null
      );
    } catch {
      return null;
    }
  }

  static recordBackupTime(companyId?: string, timestamp?: string): void {
    try {
      const compId = companyId || this.getActiveCompanyId();
      const timeStr = timestamp || new Date().toISOString();
      localStorage.setItem(`accountspro_last_backup_time_${compId}`, timeStr);
      localStorage.setItem('accountspro_last_backup_time', timeStr);
      this.addAuditLog(
        'CREATE',
        'System',
        'backup_export',
        `Generated full system backup snapshot on ${new Date(timeStr).toLocaleString('en-IN')}`
      );
    } catch (e) {
      console.error('Failed to record backup time:', e);
    }
  }

  static getBackupDueStatus(companyId?: string): {
    isOverdue: boolean;
    daysSince: number | null;
    lastBackup: string | null;
    formattedDate: string;
  } {
    const lastBackup = this.getLastBackupTime(companyId);
    if (!lastBackup) {
      return {
        isOverdue: true,
        daysSince: null,
        lastBackup: null,
        formattedDate: 'Never (Initial backup required)',
      };
    }

    try {
      const lastTime = new Date(lastBackup).getTime();
      if (isNaN(lastTime)) {
        return {
          isOverdue: true,
          daysSince: null,
          lastBackup: null,
          formattedDate: 'Never (Initial backup required)',
        };
      }
      const diffMs = Date.now() - lastTime;
      const daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const formattedDate = new Date(lastBackup).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        isOverdue: daysSince >= 7,
        daysSince,
        lastBackup,
        formattedDate: `${formattedDate} (${daysSince === 0 ? 'Today' : `${daysSince} day${daysSince > 1 ? 's' : ''} ago`})`,
      };
    } catch {
      return {
        isOverdue: true,
        daysSince: null,
        lastBackup: null,
        formattedDate: 'Invalid timestamp (Backup required)',
      };
    }
  }

  static snoozeBackupReminder(hours = 24): void {
    try {
      const until = Date.now() + hours * 60 * 60 * 1000;
      localStorage.setItem('accountspro_backup_snooze_until', until.toString());
    } catch {}
  }

  static isBackupReminderSnoozed(): boolean {
    try {
      const untilRaw = localStorage.getItem('accountspro_backup_snooze_until');
      if (!untilRaw) return false;
      const until = parseInt(untilRaw, 10);
      return !isNaN(until) && Date.now() < until;
    } catch {
      return false;
    }
  }

  static async importFullBackupAsync(jsonString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const compId = this.getActiveCompanyId();
      const data = JSON.parse(jsonString);
      if (!data.company || !data.sales || !data.parties) {
        return { success: false, error: 'Invalid backup format: required accounting nodes missing.' };
      }
      await FirestoreAccountingService.restoreBackup(compId, data);
      await this.syncWithFirestore(compId);
      this.recordBackupTime(compId);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse JSON file' };
    }
  }

  static importFullBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const compId = this.getActiveCompanyId();
      const data = JSON.parse(jsonString);
      if (!data.company || !data.sales || !data.parties) {
        return { success: false, error: 'Invalid backup format: required accounting nodes missing.' };
      }
      setStorage(STORAGE_KEYS.COMPANY, data.company);
      setStorage(STORAGE_KEYS.PARTIES, data.parties || []);
      setStorage(STORAGE_KEYS.SALES, data.sales || []);
      setStorage(STORAGE_KEYS.PURCHASES, data.purchases || []);
      setStorage(STORAGE_KEYS.EXPENSES, data.expenses || []);
      setStorage(STORAGE_KEYS.TDS, data.tdsRecords || data.tds || []);
      setStorage(STORAGE_KEYS.BANK_ITEMS, data.bankItems || []);
      setStorage(STORAGE_KEYS.JOURNALS, data.journals || []);
      setStorage(STORAGE_KEYS.EINVOICES, data.eInvoices || data.einvoices || []);
      setStorage(STORAGE_KEYS.EWAYBILLS, data.eWayBills || data.ewaybills || []);
      this.addAuditLog('RESTORE', 'System', 'backup_restore', 'Restored system database from JSON backup file.');
      FirestoreAccountingService.restoreBackup(compId, data).catch(console.warn);
      this.recordBackupTime(compId);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse JSON file' };
    }
  }

  static resetToDemoData(): void {
    const compId = this.getActiveCompanyId();
    localStorage.removeItem(`accountspro_demo_purged_${compId}`);
    setStorage(STORAGE_KEYS.COMPANY, INITIAL_COMPANY);
    setStorage(STORAGE_KEYS.PARTIES, SAMPLE_DEMO_PARTIES);
    setStorage(STORAGE_KEYS.SALES, SAMPLE_DEMO_SALES);
    setStorage(STORAGE_KEYS.PURCHASES, SAMPLE_DEMO_PURCHASES);
    setStorage(STORAGE_KEYS.EXPENSES, SAMPLE_DEMO_EXPENSES);
    setStorage(STORAGE_KEYS.TDS, SAMPLE_DEMO_TDS);
    setStorage(STORAGE_KEYS.BANK_ITEMS, SAMPLE_DEMO_BANK_ITEMS);
    setStorage(STORAGE_KEYS.JOURNALS, SAMPLE_DEMO_JOURNALS);
    setStorage(STORAGE_KEYS.AUDIT_LOG, INITIAL_AUDIT_LOGS);
    setStorage(STORAGE_KEYS.EINVOICES, SAMPLE_DEMO_EINVOICES);
    setStorage(STORAGE_KEYS.EWAYBILLS, SAMPLE_DEMO_EWAYBILLS);
    this.addAuditLog('RESTORE', 'System', 'demo_reset', 'Loaded Indian demo enterprise sample records on demand.');
    FirestoreAccountingService.persistEntireBundle(compId, {
      company: INITIAL_COMPANY,
      parties: SAMPLE_DEMO_PARTIES,
      sales: SAMPLE_DEMO_SALES,
      purchases: SAMPLE_DEMO_PURCHASES,
      expenses: SAMPLE_DEMO_EXPENSES,
      tdsRecords: SAMPLE_DEMO_TDS,
      bankItems: SAMPLE_DEMO_BANK_ITEMS,
      journals: SAMPLE_DEMO_JOURNALS,
      auditLogs: INITIAL_AUDIT_LOGS,
    }).catch(console.warn);
  }

  // Safe Data Reset: Completely clears transactional demo records while preserving company configuration, GSTIN, PAN, and system structure
  static clearDemoTransactionalData(): void {
    const compId = this.getActiveCompanyId();
    localStorage.setItem(`accountspro_demo_purged_${compId}`, 'true');
    
    // Purge all transactional records
    setStorage(STORAGE_KEYS.SALES, []);
    setStorage(STORAGE_KEYS.PURCHASES, []);
    setStorage(STORAGE_KEYS.EXPENSES, []);
    setStorage(STORAGE_KEYS.PARTIES, []);
    setStorage(STORAGE_KEYS.TDS, []);
    setStorage(STORAGE_KEYS.BANK_ITEMS, []);
    setStorage(STORAGE_KEYS.JOURNALS, []);
    setStorage(STORAGE_KEYS.EINVOICES, []);
    setStorage(STORAGE_KEYS.EWAYBILLS, []);
    
    // Preserve company profile, settings, GSTIN, PAN, Bank Details
    const existingCompany = this.getCompany();
    const updatedCompany: CompanyProfile = {
      ...existingCompany,
      invoiceNextNumber: 1, // Reset numbering counter for fresh start
    };
    setStorage(STORAGE_KEYS.COMPANY, updatedCompany);

    // Record statutory audit event
    this.addAuditLog(
      'DELETE',
      'System',
      'safe_demo_purge',
      'SAFE RESET COMPLETED: Cleared all demo sales invoices, purchase bills, expenses, parties, TDS records, bank reconciliation entries, and journals. System transaction counts reset to 0. Company profile and master configurations preserved.'
    );

    // Sync state with Firestore
    FirestoreAccountingService.persistEntireBundle(compId, {
      company: updatedCompany,
      parties: [],
      sales: [],
      purchases: [],
      expenses: [],
      tdsRecords: [],
      bankItems: [],
      journals: [],
      auditLogs: this.getAuditLogs(),
    }).catch(console.warn);
  }
}
