import { Language } from '../types/accounting';

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  demoDataBadge: string;
  demoDataWarning: string;
  nav: {
    dashboard: string;
    salesInvoices: string;
    purchaseBills: string;
    expenses: string;
    parties: string;
    gstManager: string;
    tdsManager: string;
    bankReconciliation: string;
    ledgers: string;
    reports: string;
    settings: string;
  };
  common: {
    actions: string;
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    confirm: string;
    search: string;
    filter: string;
    all: string;
    print: string;
    exportCSV: string;
    preview: string;
    close: string;
    status: string;
    date: string;
    amount: string;
    total: string;
    grandTotal: string;
    taxableAmount: string;
    cgst: string;
    sgst: string;
    igst: string;
    notes: string;
    view: string;
    download: string;
    clear: string;
    confirmDeleteTitle: string;
    confirmDeleteMsg: string;
    success: string;
    error: string;
    loading: string;
    noData: string;
    resetDemo: string;
    backupData: string;
    restoreData: string;
    refresh: string;
    financialYear: string;
    language: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalSales: string;
    totalPurchases: string;
    totalExpenses: string;
    receivables: string;
    payables: string;
    cashBankBalance: string;
    netGstPayable: string;
    tdsDue: string;
    monthlyOverview: string;
    complianceRadar: string;
    recentTransactions: string;
    quickActions: string;
    createInvoice: string;
    recordPurchase: string;
    addExpense: string;
    addParty: string;
    dueDates: string;
    gstr1Due: string;
    gstr3bDue: string;
    tdsDepositDue: string;
  };
  invoices: {
    title: string;
    newInvoice: string;
    editInvoice: string;
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    customer: string;
    customerGstin: string;
    placeOfSupply: string;
    itemDetails: string;
    addItem: string;
    description: string;
    hsnSac: string;
    qty: string;
    unit: string;
    rate: string;
    discPercent: string;
    taxableValue: string;
    gstRate: string;
    subTotal: string;
    roundOff: string;
    rcmApplicable: string;
    amountInWords: string;
    termsConditions: string;
    bankDetails: string;
    authorizedSignatory: string;
    originalForRecipient: string;
    recordPayment: string;
  };
  purchases: {
    title: string;
    newBill: string;
    billNo: string;
    vendorBillNo: string;
    vendor: string;
    itcEligibility: string;
    eligibleItc: string;
    ineligibleItc: string;
    blockedItc: string;
  };
  expenses: {
    title: string;
    newExpense: string;
    category: string;
    paymentMode: string;
    voucherNo: string;
    paidTo: string;
    gstApplicable: string;
    itcClaimed: string;
  };
  parties: {
    title: string;
    newParty: string;
    partyType: string;
    name: string;
    tradeName: string;
    gstin: string;
    pan: string;
    phone: string;
    email: string;
    billingAddress: string;
    state: string;
    openingBalance: string;
    currentOutstanding: string;
    customersOnly: string;
    vendorsOnly: string;
  };
  gst: {
    title: string;
    subtitle: string;
    summary: string;
    outputGst: string;
    inputGst: string;
    netTaxLiability: string;
    itcCreditBalance: string;
    gstr1Review: string;
    gstr3bReview: string;
    disclaimer: string;
    table4B2B: string;
    table5B2CLarge: string;
    table7B2CSmall: string;
    table12HSN: string;
    table31Outward: string;
    table4ITC: string;
  };
  tds: {
    title: string;
    subtitle: string;
    newRecord: string;
    section: string;
    deductee: string;
    pan: string;
    paymentAmount: string;
    rate: string;
    tdsDeducted: string;
    tdsDeposited: string;
    dueDate: string;
    depositStatus: string;
    flaggedReview: string;
    higherRateWarning: string;
    recordDeposit: string;
    challanDetails: string;
  };
  brs: {
    title: string;
    subtitle: string;
    uploadStatement: string;
    passbookBalance: string;
    booksBalance: string;
    difference: string;
    matchedCount: string;
    unmatchedCount: string;
    autoMatch: string;
    unmatchedBankEntries: string;
    matchedHistory: string;
  };
  ledgers: {
    title: string;
    partyLedger: string;
    journalEntries: string;
    cashBankBook: string;
    trialBalance: string;
    profitAndLoss: string;
    balanceSheet: string;
    selectParty: string;
    runningBalance: string;
    debit: string;
    credit: string;
    newJournalEntry: string;
    grossProfit: string;
    netProfit: string;
    tradingAccount: string;
  };
  reports: {
    title: string;
    salesRegister: string;
    purchaseRegister: string;
    expenseReport: string;
    ageingReport: string;
    monthlyMis: string;
    dateRange: string;
    exportAll: string;
  };
  settings: {
    title: string;
    companyProfile: string;
    taxDefaults: string;
    invoiceSeries: string;
    auditTrail: string;
    dataManagement: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: 'AccountsPro India',
    appTagline: 'Professional Accounting, GST & TDS Management System',
    demoDataBadge: 'Sample Demo Data Loaded',
    demoDataWarning: 'This environment is loaded with sample Indian accounting records for evaluation. You can add real transactions or reset anytime.',
    nav: {
      dashboard: 'Dashboard',
      salesInvoices: 'Sales Invoices',
      purchaseBills: 'Purchase Bills',
      expenses: 'Expenses',
      parties: 'Customers & Vendors',
      gstManager: 'GST Manager',
      tdsManager: 'TDS Manager',
      bankReconciliation: 'Bank Reconciliation',
      ledgers: 'Ledgers & Accounts',
      reports: 'Reports & MIS',
      settings: 'Settings & Audit',
    },
    common: {
      actions: 'Actions',
      add: 'Add New',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save Record',
      cancel: 'Cancel',
      confirm: 'Confirm',
      search: 'Search by keyword, name, invoice...',
      filter: 'Filter',
      all: 'All',
      print: 'Print / PDF',
      exportCSV: 'Export CSV',
      preview: 'Preview',
      close: 'Close',
      status: 'Status',
      date: 'Date',
      amount: 'Amount',
      total: 'Total',
      grandTotal: 'Grand Total',
      taxableAmount: 'Taxable Amount',
      cgst: 'CGST',
      sgst: 'SGST',
      igst: 'IGST',
      notes: 'Notes / Remarks',
      view: 'View',
      download: 'Download',
      clear: 'Clear',
      confirmDeleteTitle: 'Confirm Deletion',
      confirmDeleteMsg: 'Are you sure you want to delete this record? This action will be recorded in the audit trail.',
      success: 'Operation completed successfully',
      error: 'An error occurred',
      loading: 'Loading data...',
      noData: 'No records found',
      resetDemo: 'Reset Demo Data',
      backupData: 'Backup (Export JSON)',
      restoreData: 'Restore (Import JSON)',
      refresh: 'Refresh',
      financialYear: 'Financial Year',
      language: 'Language',
    },
    dashboard: {
      title: 'Accounts Overview',
      subtitle: 'Real-time financial pulse, cash flow & compliance status',
      totalSales: 'Total Sales (Turnover)',
      totalPurchases: 'Total Purchases',
      totalExpenses: 'Operating Expenses',
      receivables: 'Sundry Debtors (Receivables)',
      payables: 'Sundry Creditors (Payables)',
      cashBankBalance: 'Net Cash & Bank Balance',
      netGstPayable: 'Net GST Liability',
      tdsDue: 'TDS Payable',
      monthlyOverview: 'Monthly Performance (Sales vs Purchases vs Expenses)',
      complianceRadar: 'Tax & Compliance Radar',
      recentTransactions: 'Recent Financial Activities',
      quickActions: 'Quick Actions',
      createInvoice: 'New Tax Invoice',
      recordPurchase: 'Record Purchase Bill',
      addExpense: 'Add Expense Voucher',
      addParty: 'Add Customer / Vendor',
      dueDates: 'Upcoming Statutory Due Dates',
      gstr1Due: 'GSTR-1 Monthly Return',
      gstr3bDue: 'GSTR-3B Summary Return',
      tdsDepositDue: 'TDS Challan ITNS-281 Payment',
    },
    invoices: {
      title: 'Tax Invoices (Sales)',
      newInvoice: 'Create Sales Invoice',
      editInvoice: 'Edit Sales Invoice',
      invoiceNo: 'Invoice No.',
      invoiceDate: 'Invoice Date',
      dueDate: 'Due Date',
      customer: 'Customer',
      customerGstin: 'Customer GSTIN',
      placeOfSupply: 'Place of Supply',
      itemDetails: 'Line Items & GST Details',
      addItem: '+ Add Line Item',
      description: 'Item Description / SAC',
      hsnSac: 'HSN / SAC',
      qty: 'Qty',
      unit: 'Unit',
      rate: 'Rate (₹)',
      discPercent: 'Disc %',
      taxableValue: 'Taxable Val (₹)',
      gstRate: 'GST %',
      subTotal: 'Sub Total',
      roundOff: 'Round Off',
      rcmApplicable: 'Reverse Charge (RCM)',
      amountInWords: 'Amount in Words',
      termsConditions: 'Terms & Conditions',
      bankDetails: 'Bank Details for Remittance',
      authorizedSignatory: 'Authorized Signatory',
      originalForRecipient: 'Tax Invoice (Original for Recipient)',
      recordPayment: 'Record Payment Receipt',
    },
    purchases: {
      title: 'Purchase Bills (Inward Supplies)',
      newBill: 'Record Purchase Bill',
      billNo: 'Internal Bill Ref',
      vendorBillNo: 'Supplier Invoice No.',
      vendor: 'Supplier / Vendor',
      itcEligibility: 'ITC Eligibility',
      eligibleItc: 'Eligible ITC',
      ineligibleItc: 'Ineligible ITC',
      blockedItc: 'Blocked ITC u/s 17(5)',
    },
    expenses: {
      title: 'Expense Vouchers',
      newExpense: 'Record Expense',
      category: 'Expense Category',
      paymentMode: 'Payment Mode',
      voucherNo: 'Voucher No.',
      paidTo: 'Paid To (Beneficiary)',
      gstApplicable: 'GST Applicable (Input Credit)',
      itcClaimed: 'ITC Claimed',
    },
    parties: {
      title: 'Customer & Vendor Master',
      newParty: 'Add New Party',
      partyType: 'Party Type',
      name: 'Legal Entity Name',
      tradeName: 'Trade Name',
      gstin: 'GSTIN (15 Digits)',
      pan: 'PAN (10 Digits)',
      phone: 'Contact Phone',
      email: 'Email Address',
      billingAddress: 'Registered Address',
      state: 'State & State Code',
      openingBalance: 'Opening Balance',
      currentOutstanding: 'Current Ledger Balance',
      customersOnly: 'Customers',
      vendorsOnly: 'Vendors',
    },
    gst: {
      title: 'GST Compliance & Returns Review',
      subtitle: 'Tax liability computations, input tax credit reconciliation and GSTR review tables',
      summary: 'GST Summary for the Period',
      outputGst: 'Output Tax (On Sales)',
      inputGst: 'Input Tax Credit (ITC on Purchases)',
      netTaxLiability: 'Net Tax Payable (Cash)',
      itcCreditBalance: 'ITC Balance Carried Forward',
      gstr1Review: 'GSTR-1 Outward Supplies Review',
      gstr3bReview: 'GSTR-3B Monthly Return Review',
      disclaimer: 'Official Filing Notice: AccountsPro India generates computation tables strictly for verification and internal preparation. Tax returns must be filed directly on the official Government GST portal (gst.gov.in).',
      table4B2B: 'Table 4: B2B Invoices (Registered Buyers)',
      table5B2CLarge: 'Table 5: B2C Large (Inter-state > ₹2.5L)',
      table7B2CSmall: 'Table 7: B2C Small (Other Retail)',
      table12HSN: 'Table 12: HSN-wise Summary of Outward Supplies',
      table31Outward: 'Table 3.1: Details of Outward Supplies and Inward Supplies Liable to Reverse Charge',
      table4ITC: 'Table 4: Eligible Input Tax Credit (ITC)',
    },
    tds: {
      title: 'TDS Manager & Section 194 Register',
      subtitle: 'Deductions, PAN verification, threshold alerts & challan tracking',
      newRecord: 'Record TDS Deduction',
      section: 'Section & Nature of Payment',
      deductee: 'Deductee Party',
      pan: 'Deductee PAN',
      paymentAmount: 'Gross Payment / Credit (₹)',
      rate: 'Applicable Rate %',
      tdsDeducted: 'TDS Deducted (₹)',
      tdsDeposited: 'Deposited (₹)',
      dueDate: 'Statutory Due Date',
      depositStatus: 'Deposit Status',
      flaggedReview: 'Flagged for Review',
      higherRateWarning: 'Section 206AA Alert: Deductee PAN missing or invalid! Higher rate of 20% applicable.',
      recordDeposit: 'Record ITNS-281 Challan',
      challanDetails: 'Challan BSR Code, Date & Serial No.',
    },
    brs: {
      title: 'Bank Reconciliation Statement (BRS)',
      subtitle: 'Match bank transactions with book ledgers and identify floating cheques/deposits',
      uploadStatement: 'Import Bank Statement (CSV)',
      passbookBalance: 'Balance as per Bank Passbook',
      booksBalance: 'Balance as per Company Books',
      difference: 'Reconciliation Difference',
      matchedCount: 'Matched Entries',
      unmatchedCount: 'Unmatched Entries',
      autoMatch: 'Run Auto Match Engine',
      unmatchedBankEntries: 'Unmatched Bank Transactions',
      matchedHistory: 'Reconciled Transactions',
    },
    ledgers: {
      title: 'Accounting Books & Financial Statements',
      partyLedger: 'Party Statement of Account',
      journalEntries: 'Journal Vouchers',
      cashBankBook: 'Cash & Bank Book',
      trialBalance: 'Trial Balance',
      profitAndLoss: 'Profit & Loss Statement',
      balanceSheet: 'Balance Sheet',
      selectParty: 'Select Customer or Vendor',
      runningBalance: 'Running Balance',
      debit: 'Debit (Dr ₹)',
      credit: 'Credit (Cr ₹)',
      newJournalEntry: 'Record Journal Entry',
      grossProfit: 'Gross Profit',
      netProfit: 'Net Profit for the Period',
      tradingAccount: 'Trading Account',
    },
    reports: {
      title: 'Accounting & Statutory Reports',
      salesRegister: 'Sales Register',
      purchaseRegister: 'Purchase Register',
      expenseReport: 'Category-wise Expenses',
      ageingReport: 'Outstanding Ageing Analysis',
      monthlyMis: 'Monthly MIS Executive Summary',
      dateRange: 'Select Date Range',
      exportAll: 'Export All Reports to CSV',
    },
    settings: {
      title: 'Company Settings & Audit Vault',
      companyProfile: 'Company / Firm Master',
      taxDefaults: 'GST & Invoice Defaults',
      invoiceSeries: 'Numbering Series',
      auditTrail: 'Compliance Audit Trail',
      dataManagement: 'Backup, Restore & Reset',
    },
  },
  hi: {
    appName: 'अकाउंट्सप्रो इंडिया',
    appTagline: 'भारतीय लेखा, जीएसटी एवं टीडीएस प्रबंधन प्रणाली',
    demoDataBadge: 'नमूना डेमो डेटा लोड किया गया',
    demoDataWarning: 'यह वातावरण मूल्यांकन के लिए नमूना भारतीय लेखा रिकॉर्ड के साथ लोड है। आप वास्तविक लेनदेन जोड़ सकते हैं या कभी भी रीसेट कर सकते हैं।',
    nav: {
      dashboard: 'डैशबोर्ड',
      salesInvoices: 'बिक्री चालान (सेल्स)',
      purchaseBills: 'खरीद बिल (परचेज)',
      expenses: 'व्यापारिक खर्चे',
      parties: 'ग्राहक व आपूर्तिकर्ता',
      gstManager: 'जीएसटी मैनेजर',
      tdsManager: 'टीडीएस मैनेजर',
      bankReconciliation: 'बैंक समाधान (BRS)',
      ledgers: 'खाताबही एवं लेजर',
      reports: 'रिपोर्ट्स व एमआईएस',
      settings: 'सेटिंग्स व ऑडिट',
    },
    common: {
      actions: 'कार्रवाई',
      add: 'नया जोड़ें',
      edit: 'संशोधित करें',
      delete: 'हटाएं',
      save: 'सुरक्षित करें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      search: 'खोजें: नाम, बिल नंबर, आदि...',
      filter: 'फ़िल्टर',
      all: 'सभी',
      print: 'प्रिंट / पीडीएफ',
      exportCSV: 'सीएसवी निर्यात',
      preview: 'पूर्वावलोकन',
      close: 'बंद करें',
      status: 'स्थिति',
      date: 'दिनांक',
      amount: 'राशि',
      total: 'कुल',
      grandTotal: 'कुल योग (Grand Total)',
      taxableAmount: 'कर योग्य मूल्य (Taxable)',
      cgst: 'सीजीएसटी',
      sgst: 'एसजीएसटी',
      igst: 'आईजीएसटी',
      notes: 'टिप्पणी / विवरण',
      view: 'देखें',
      download: 'डाउनलोड',
      clear: 'साफ़ करें',
      confirmDeleteTitle: 'रिकॉर्ड हटाने की पुष्टि',
      confirmDeleteMsg: 'क्या आप निश्चित रूप से इस वित्तीय रिकॉर्ड को हटाना चाहते हैं? यह क्रिया ऑडिट ट्रेल में दर्ज होगी।',
      success: 'कार्य सफलतापूर्वक पूरा हुआ',
      error: 'त्रुटि उत्पन्न हुई',
      loading: 'डेटा लोड हो रहा है...',
      noData: 'कोई रिकॉर्ड उपलब्ध नहीं है',
      resetDemo: 'डेमो डेटा रीसेट करें',
      backupData: 'बैकअप (JSON डाउनलोड)',
      restoreData: 'रिस्टोर (JSON अपलोड)',
      refresh: 'रीफ्रेश',
      financialYear: 'वित्तीय वर्ष',
      language: 'भाषा',
    },
    dashboard: {
      title: 'लेखा समीक्षा एवं डैशबोर्ड',
      subtitle: 'व्यापार का वास्तविक समय नकदी प्रवाह एवं कर अनुपालन सारांश',
      totalSales: 'कुल बिक्री (टर्नओवर)',
      totalPurchases: 'कुल खरीद',
      totalExpenses: 'व्यापारिक खर्चे',
      receivables: 'प्राप्य राशियां (देनदार)',
      payables: 'देय राशियां (लेनदार)',
      cashBankBalance: 'रोकड़ व बैंक शेष',
      netGstPayable: 'शुद्ध जीएसटी देयता',
      tdsDue: 'देय टीडीएस',
      monthlyOverview: 'मासिक प्रदर्शन (बिक्री बनाम खरीद बनाम खर्चे)',
      complianceRadar: 'कर एवं वैधानिक अनुपालन रडार',
      recentTransactions: 'हालिया वित्तीय लेनदेन',
      quickActions: 'त्वरित कार्य',
      createInvoice: 'नया टैक्स इनवॉइस बनाएं',
      recordPurchase: 'खरीद बिल दर्ज करें',
      addExpense: 'खर्च वाउचर जोड़ें',
      addParty: 'नया ग्राहक/विक्रेता जोड़ें',
      dueDates: 'आगामी नियत तिथियां (Due Dates)',
      gstr1Due: 'जीएसटीआर-1 मासिक विवरणी',
      gstr3bDue: 'जीएसटीआर-3बी संक्षिप्त विवरणी',
      tdsDepositDue: 'टीडीएस चालान ITNS-281 जमा',
    },
    invoices: {
      title: 'बिक्री कर चालान (Tax Invoices)',
      newInvoice: 'नया बिक्री चालान बनाएं',
      editInvoice: 'चालान संशोधित करें',
      invoiceNo: 'चालान संख्या (Invoice No.)',
      invoiceDate: 'चालान तिथि',
      dueDate: 'भुगतान की अंतिम तिथि',
      customer: 'ग्राहक का नाम',
      customerGstin: 'ग्राहक जीएसटी नंबर',
      placeOfSupply: 'आपूर्ति का स्थान (Place of Supply)',
      itemDetails: 'सामग्री विवरण एवं जीएसटी',
      addItem: '+ नई सामग्री जोड़ें',
      description: 'विवरण / एचएसएन',
      hsnSac: 'एचएसएन / सैक कोड',
      qty: 'मात्रा',
      unit: 'इकाई',
      rate: 'दर (₹)',
      discPercent: 'छूट %',
      taxableValue: 'कर योग्य मूल्य (₹)',
      gstRate: 'जीएसटी दर %',
      subTotal: 'उप-योग',
      roundOff: 'पूर्णांक (Round Off)',
      rcmApplicable: 'रिवर्स चार्ज लागू (RCM)',
      amountInWords: 'राशि शब्दों में',
      termsConditions: 'नियम एवं शर्तें',
      bankDetails: 'बैंक भुगतान विवरण',
      authorizedSignatory: 'अधिकृत हस्ताक्षरकर्ता',
      originalForRecipient: 'टैक्स इनवॉइस (मूल प्रति - प्राप्तकर्ता हेतु)',
      recordPayment: 'भुगतान प्राप्ति दर्ज करें',
    },
    purchases: {
      title: 'खरीद बिल (Purchase Bills)',
      newBill: 'नया खरीद बिल दर्ज करें',
      billNo: 'आंतरिक बिल संदर्भ',
      vendorBillNo: 'विक्रेता का बिल नंबर',
      vendor: 'आपूर्तिकर्ता / विक्रेता',
      itcEligibility: 'आईटीसी पात्रता (इनपुट टैक्स)',
      eligibleItc: 'पात्र आईटीसी',
      ineligibleItc: 'अपात्र आईटीसी',
      blockedItc: 'अवरुद्ध आईटीसी धारा 17(5)',
    },
    expenses: {
      title: 'व्यापारिक खर्च वाउचर',
      newExpense: 'नया खर्च दर्ज करें',
      category: 'खर्च की श्रेणी',
      paymentMode: 'भुगतान का माध्यम',
      voucherNo: 'वाउचर संख्या',
      paidTo: 'भुगतान प्राप्तकर्ता',
      gstApplicable: 'जीएसटी लागू (इनपुट क्रेडिट)',
      itcClaimed: 'आईटीसी का दावा किया गया',
    },
    parties: {
      title: 'ग्राहक एवं विक्रेता मास्टर',
      newParty: 'नई पार्टी जोड़ें',
      partyType: 'पार्टी का प्रकार',
      name: 'कानूनी नाम',
      tradeName: 'व्यापारिक नाम (ट्रेड नेम)',
      gstin: 'जीएसटी नंबर (15 अक्षर)',
      pan: 'पैन नंबर (10 अक्षर)',
      phone: 'संपर्क फोन',
      email: 'ईमेल',
      billingAddress: 'पंजीकृत पता',
      state: 'राज्य व राज्य कोड',
      openingBalance: 'प्रारंभिक शेष (Opening)',
      currentOutstanding: 'वर्तमान खाता शेष',
      customersOnly: 'केवल ग्राहक',
      vendorsOnly: 'केवल विक्रेता',
    },
    gst: {
      title: 'जीएसटी अनुपालन एवं विवरणी समीक्षा',
      subtitle: 'कर देयता गणना, इनपुट क्रेडिट मिलान एवं जीएसटीआर समीक्षा तालिकाएं',
      summary: 'अवधि का जीएसटी सारांश',
      outputGst: 'आउटपुट कर (बिक्री पर)',
      inputGst: 'इनपुट टैक्स क्रेडिट (खरीद पर)',
      netTaxLiability: 'शुद्ध देय नकद कर',
      itcCreditBalance: 'अगली अवधि हेतु शेष आईटीसी',
      gstr1Review: 'जीएसटीआर-1 बाह्य आपूर्ति समीक्षा',
      gstr3bReview: 'जीएसटीआर-3बी मासिक विवरणी समीक्षा',
      disclaimer: 'सरकारी विवरणी सूचना: अकाउंट्सप्रो इंडिया केवल आंतरिक तैयारी एवं सत्यापन हेतु गणना तालिकाएं तैयार करता है। कर विवरणी आधिकारिक सरकारी पोर्टल (gst.gov.in) पर ही दाखिल की जानी चाहिए।',
      table4B2B: 'तालिका 4: बी2बी चालान (पंजीकृत क्रेता)',
      table5B2CLarge: 'तालिका 5: बी2सी बड़े चालान (अंतरराज्यीय > ₹2.5 लाख)',
      table7B2CSmall: 'तालिका 7: बी2सी छोटे चालान (अन्य खुदरा बिक्री)',
      table12HSN: 'तालिका 12: एचएसएन अनुसार बाह्य आपूर्ति सारांश',
      table31Outward: 'तालिका 3.1: बाह्य आपूर्ति एवं रिवर्स चार्ज आपूर्ति का विवरण',
      table4ITC: 'तालिका 4: उपलब्ध इनपुट टैक्स क्रेडिट (ITC)',
    },
    tds: {
      title: 'टीडीएस प्रबंधक एवं धारा 194 रजिस्टर',
      subtitle: 'कटौती, पैन सत्यापन, सीमा अलर्ट एवं चालान रिकॉर्डिंग',
      newRecord: 'टीडीएस कटौती दर्ज करें',
      section: 'धारा एवं भुगतान की प्रकृति',
      deductee: 'कटौती प्राप्तकर्ता पार्टी',
      pan: 'प्राप्तकर्ता का पैन',
      paymentAmount: 'सकल भुगतान राशि (₹)',
      rate: 'लागू टीडीएस दर %',
      tdsDeducted: 'काटा गया टीडीएस (₹)',
      tdsDeposited: 'जमा किया गया टीडीएस (₹)',
      dueDate: 'वैधानिक नियत तिथि',
      depositStatus: 'जमा स्थिति',
      flaggedReview: 'पुनरावलोकन हेतु चिह्नित',
      higherRateWarning: 'धारा 206AA चेतावनी: पार्टी का पैन अमान्य या अनुपलब्ध है! 20% की उच्च दर लागू है।',
      recordDeposit: 'ITNS-281 चालान दर्ज करें',
      challanDetails: 'बीएसआर कोड, चालान तिथि व क्रम संख्या',
    },
    brs: {
      title: 'बैंक समाधान विवरण (BRS)',
      subtitle: 'बैंक पासबुक व बहीखाता प्रविष्टियों का मिलान एवं अंतर का विश्लेषण',
      uploadStatement: 'बैंक विवरण (CSV) आयात करें',
      passbookBalance: 'बैंक पासबुक के अनुसार शेष',
      booksBalance: 'कंपनी बहीखाते के अनुसार शेष',
      difference: 'समाधान अंतर (Difference)',
      matchedCount: 'मिलान किए गए लेनदेन',
      unmatchedCount: 'अमिलान लेनदेन',
      autoMatch: 'ऑटो-मैच इंजन चलाएं',
      unmatchedBankEntries: 'अमिलान बैंक लेनदेन',
      matchedHistory: 'सत्यापित एवं समाधानित लेनदेन',
    },
    ledgers: {
      title: 'खाताबही, जर्नल एवं वित्तीय विवरण',
      partyLedger: 'पार्टी खाता विवरण (लेजर)',
      journalEntries: 'जर्नल वाउचर प्रविष्टियां',
      cashBankBook: 'रोकड़ व बैंक बही',
      trialBalance: 'तलपट (Trial Balance)',
      profitAndLoss: 'लाभ-हानि विवरण (P&L)',
      balanceSheet: 'तुलन पत्र (बैलेंस शीट)',
      selectParty: 'ग्राहक या विक्रेता चुनें',
      runningBalance: 'चलती शेष राशि (Balance)',
      debit: 'नामे (Dr ₹)',
      credit: 'जमा (Cr ₹)',
      newJournalEntry: 'जर्नल प्रविष्टि दर्ज करें',
      grossProfit: 'सकल लाभ (Gross Profit)',
      netProfit: 'अवधि का शुद्ध लाभ (Net Profit)',
      tradingAccount: 'व्यापारिक खाता (Trading)',
    },
    reports: {
      title: 'लेखा एवं वैधानिक रिपोर्ट',
      salesRegister: 'बिक्री रजिस्टर (Sales Register)',
      purchaseRegister: 'खरीद रजिस्टर (Purchase Register)',
      expenseReport: 'श्रेणीवार खर्च रिपोर्ट',
      ageingReport: 'देनदार/लेनदार आयुवार विश्लेषण',
      monthlyMis: 'मासिक एमआईएस कार्यकारी सारांश',
      dateRange: 'दिनांक सीमा चुनें',
      exportAll: 'सभी रिपोर्ट CSV में निर्यात करें',
    },
    settings: {
      title: 'कंपनी सेटिंग्स एवं अनुपालन ऑडिट',
      companyProfile: 'कंपनी / फर्म विवरण',
      taxDefaults: 'जीएसटी एवं इनवॉइस डिफ़ॉल्ट्स',
      invoiceSeries: 'क्रमांक श्रृंखला (Series)',
      auditTrail: 'अनुपालन ऑडिट ट्रेल',
      dataManagement: 'बैकअप, रिस्टोर एवं रीसेट',
    },
  },
};
