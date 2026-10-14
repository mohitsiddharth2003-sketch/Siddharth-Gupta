import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  Edit,
  Eye,
  CreditCard,
  CheckCircle,
  Clock,
  X,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SalesInvoice,
  InvoiceItem,
  Party,
  CompanyProfile,
  Language,
  UnitType,
  GSTRate,
  InvoiceStatus,
  PaymentRecord,
  GSTDetails,
} from '../types/accounting';
import {
  formatINR,
  numberToWordsINR,
  INDIAN_STATES,
  GST_RATES,
  isInterStateTransaction,
} from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { InvoicePrintPreviewModal } from './InvoicePrintPreviewModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { GSTINAutoFillField } from './GSTINAutoFillField';

interface SalesInvoiceModuleProps {
  sales: SalesInvoice[];
  parties: Party[];
  company: CompanyProfile;
  language: Language;
  onSaveInvoice: (inv: SalesInvoice) => void;
  onDeleteInvoice: (id: string, reason: string) => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

const DEFAULT_UNITS: UnitType[] = ['PCS', 'BOX', 'KG', 'MTR', 'SET', 'NOS', 'HRS', 'DAY', 'LTR', 'BAG'];

export const SalesInvoiceModule: React.FC<SalesInvoiceModuleProps> = ({
  sales,
  parties,
  company,
  language,
  onSaveInvoice,
  onDeleteInvoice,
  isCreateOpen,
  setIsCreateOpen,
}) => {
  const t = translations[language];

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modals state
  const [previewInvoice, setPreviewInvoice] = useState<SalesInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<SalesInvoice | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<Partial<SalesInvoice>>({
    invoiceNumber: `${company.invoicePrefix}${company.invoiceNextNumber}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    customerGstin: '',
    customerPan: '',
    customerPhone: '',
    customerState: company.state,
    customerStateCode: company.stateCode,
    billingAddress: '',
    placeOfSupply: company.state,
    placeOfSupplyCode: company.stateCode,
    isInterState: false,
    isRcm: false,
    status: 'Issued',
    notes: 'Thank you for your business!',
    termsAndConditions: company.termsAndConditions,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `item_${Date.now()}_1`,
      description: '',
      hsnSac: '',
      qty: 1,
      unit: 'NOS',
      rate: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 0,
      gstRate: 18,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    },
  ]);

  const [formError, setFormError] = useState('');

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentRecord['paymentMode']>('Bank Transfer (NEFT/RTGS)');
  const [paymentRef, setPaymentRef] = useState('');

  // Filter customers
  const customers = useMemo(() => {
    return parties.filter((p) => p.type === 'Customer' || p.type === 'Both');
  }, [parties]);

  // Recalculate item taxes whenever rate/qty/disc/gstRate or placeOfSupply changes
  const calculateItem = (
    item: InvoiceItem,
    isInterState: boolean
  ): InvoiceItem => {
    const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
    const discPct = Number(item.discountPercent) || 0;
    const discAmt = (gross * discPct) / 100;
    const taxable = Math.max(0, gross - discAmt);
    const rate = Number(item.gstRate) || 0;

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstRate = rate;
      igstAmount = (taxable * igstRate) / 100;
    } else {
      cgstRate = rate / 2;
      sgstRate = rate / 2;
      cgstAmount = (taxable * cgstRate) / 100;
      sgstAmount = (taxable * sgstRate) / 100;
    }

    const total = taxable + cgstAmount + sgstAmount + igstAmount;

    return {
      ...item,
      discountAmount: Number(discAmt.toFixed(2)),
      taxableAmount: Number(taxable.toFixed(2)),
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount: Number(cgstAmount.toFixed(2)),
      sgstAmount: Number(sgstAmount.toFixed(2)),
      igstAmount: Number(igstAmount.toFixed(2)),
      totalAmount: Number(total.toFixed(2)),
    };
  };

  // Re-calculate totals
  const totals = useMemo(() => {
    const isInterState = formData.isInterState ?? false;
    let subTotal = 0;
    let discountTotal = 0;
    let totalTaxable = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    items.forEach((item) => {
      const calc = calculateItem(item, isInterState);
      subTotal += (Number(calc.qty) || 0) * (Number(calc.rate) || 0);
      discountTotal += calc.discountAmount;
      totalTaxable += calc.taxableAmount;
      cgstTotal += calc.cgstAmount;
      sgstTotal += calc.sgstAmount;
      igstTotal += calc.igstAmount;
    });

    const exactTotal = totalTaxable + cgstTotal + sgstTotal + igstTotal;
    const roundedGrandTotal = Math.round(exactTotal);
    const roundOff = Number((roundedGrandTotal - exactTotal).toFixed(2));

    return {
      subTotal: Number(subTotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      totalTaxable: Number(totalTaxable.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      roundOff,
      grandTotal: roundedGrandTotal,
    };
  }, [items, formData.isInterState]);

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const isInter = isInterStateTransaction(company.stateCode, cust.stateCode);

    setFormData((prev) => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.name,
      customerGstin: cust.gstin || '',
      customerPan: cust.pan || '',
      customerPhone: cust.phone || '',
      customerState: cust.state,
      customerStateCode: cust.stateCode,
      billingAddress: cust.billingAddress,
      placeOfSupply: cust.state,
      placeOfSupplyCode: cust.stateCode,
      isInterState: isInter,
    }));

    // Update items tax calculation with new inter-state status
    setItems((prevItems) => prevItems.map((item) => calculateItem(item, isInter)));
  };

  // Handle GST auto-fill for customer in Sales Invoice
  const handleCustomerGSTDetailsFetched = (details: GSTDetails) => {
    const existing = customers.find(
      (c) => c.gstin && c.gstin.trim().toUpperCase() === details.gstin.trim().toUpperCase()
    );

    const isInter = isInterStateTransaction(company.stateCode, details.stateCode);

    setFormData((prev) => ({
      ...prev,
      customerId: existing ? existing.id : prev.customerId || `cust_auto_${Date.now()}`,
      customerName: details.legalName || prev.customerName,
      customerTradeName: details.tradeName || prev.customerTradeName,
      customerGstin: details.gstin,
      customerPan: details.pan || prev.customerPan,
      customerState: details.state,
      customerStateCode: details.stateCode,
      billingAddress: details.address || prev.billingAddress,
      customerPincode: details.pincode,
      customerDistrict: details.district,
      customerGstStatus: details.gstStatus,
      customerTaxpayerType: details.taxpayerType,
      customerGstVerifiedAt: details.verifiedAt || new Date().toISOString(),
      placeOfSupply: details.state,
      placeOfSupplyCode: details.stateCode,
      isInterState: isInter,
    }));

    setItems((prevItems) => prevItems.map((item) => calculateItem(item, isInter)));
  };

  // Handle Place of Supply change
  const handlePlaceOfSupplyChange = (stateCode: string) => {
    const stateObj = INDIAN_STATES.find((s) => s.code === stateCode);
    if (!stateObj) return;

    const isInter = isInterStateTransaction(company.stateCode, stateCode);

    setFormData((prev) => ({
      ...prev,
      placeOfSupply: stateObj.name,
      placeOfSupplyCode: stateCode,
      isInterState: isInter,
    }));

    setItems((prevItems) => prevItems.map((item) => calculateItem(item, isInter)));
  };

  // Item field change
  const handleItemFieldChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      copy[index] = calculateItem(copy[index], formData.isInterState ?? false);
      return copy;
    });
  };

  // Add Item
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${items.length + 1}`,
      description: '',
      hsnSac: '',
      qty: 1,
      unit: 'NOS',
      rate: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 0,
      gstRate: 18,
      cgstRate: (formData.isInterState ? 0 : 9),
      sgstRate: (formData.isInterState ? 0 : 9),
      igstRate: (formData.isInterState ? 18 : 0),
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Open Edit
  const handleStartEdit = (inv: SalesInvoice) => {
    setEditingInvoice(inv);
    setFormData({
      ...inv,
    });
    setItems(inv.items.map((i) => ({ ...i })));
    setIsCreateOpen(true);
  };

  // Reset form
  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingInvoice(null);
    setFormError('');
    setFormData({
      invoiceNumber: `${company.invoicePrefix}${company.invoiceNextNumber}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      customerId: '',
      customerName: '',
      customerGstin: '',
      customerPan: '',
      customerPhone: '',
      customerState: company.state,
      customerStateCode: company.stateCode,
      billingAddress: '',
      placeOfSupply: company.state,
      placeOfSupplyCode: company.stateCode,
      isInterState: false,
      isRcm: false,
      status: 'Issued',
      notes: 'Thank you for your business!',
      termsAndConditions: company.termsAndConditions,
    });
    setItems([
      {
        id: `item_${Date.now()}_1`,
        description: '',
        hsnSac: '',
        qty: 1,
        unit: 'NOS',
        rate: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 0,
        gstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 0,
      },
    ]);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const invNum = formData.invoiceNumber?.trim();
    if (!invNum) {
      setFormError(language === 'hi' ? 'कृपया चालान संख्या दर्ज करें' : 'Please provide invoice number');
      return;
    }

    const isDuplicate = sales.some(
      (s) => s.id !== editingInvoice?.id && s.invoiceNumber.trim().toLowerCase() === invNum.toLowerCase()
    );
    if (isDuplicate) {
      setFormError(
        language === 'hi'
          ? `चालान संख्या "${invNum}" पहले से मौजूद है। कृपया एक अद्वितीय चालान संख्या का उपयोग करें।`
          : `Invoice number "${invNum}" already exists. Accidental duplicate invoice numbers are prohibited under GST rules.`
      );
      return;
    }

    if (!formData.customerId || !formData.customerName) {
      setFormError(language === 'hi' ? 'कृपया ग्राहक चुनें' : 'Please select a customer');
      return;
    }

    if (items.length === 0 || !items.some((i) => i.description.trim() && i.rate > 0)) {
      setFormError(language === 'hi' ? 'कृपया कम से कम एक वैध सामग्री विवरण एवं दर दर्ज करें' : 'Please enter at least one line item with description and rate');
      return;
    }

    const calculatedItems = items.map((item) =>
      calculateItem(item, formData.isInterState ?? false)
    );

    const paid = editingInvoice ? editingInvoice.amountPaid : 0;
    const bal = Math.max(0, totals.grandTotal - paid);
    let st: InvoiceStatus = formData.status as InvoiceStatus || 'Issued';
    if (paid >= totals.grandTotal && totals.grandTotal > 0) {
      st = 'Paid';
    } else if (paid > 0 && bal > 0) {
      st = 'Partially Paid';
    }

    const invoiceToSave: SalesInvoice = {
      id: editingInvoice ? editingInvoice.id : `inv_${Date.now()}`,
      invoiceNumber: formData.invoiceNumber || `${company.invoicePrefix}${company.invoiceNextNumber}`,
      invoiceDate: formData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      customerId: formData.customerId,
      customerName: formData.customerName,
      customerGstin: formData.customerGstin,
      customerPan: formData.customerPan,
      customerPhone: formData.customerPhone,
      customerState: formData.customerState || company.state,
      customerStateCode: formData.customerStateCode || company.stateCode,
      billingAddress: formData.billingAddress || '',
      placeOfSupply: formData.placeOfSupply || company.state,
      placeOfSupplyCode: formData.placeOfSupplyCode || company.stateCode,
      isInterState: formData.isInterState ?? false,
      isRcm: formData.isRcm ?? false,
      items: calculatedItems,
      subTotal: totals.subTotal,
      discountTotal: totals.discountTotal,
      totalTaxable: totals.totalTaxable,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      igstTotal: totals.igstTotal,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      totalInWords: numberToWordsINR(totals.grandTotal),
      notes: formData.notes,
      termsAndConditions: formData.termsAndConditions,
      status: st,
      amountPaid: paid,
      balanceDue: bal,
      payments: editingInvoice ? editingInvoice.payments : [],
      createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveInvoice(invoiceToSave);
    handleCloseModal();
  };

  // Record Payment
  const handleRecordPayment = () => {
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      paymentMode,
      referenceNo: paymentRef.trim(),
      notes: `Recorded against invoice ${paymentModalInvoice.invoiceNumber}`,
    };

    const newPaid = paymentModalInvoice.amountPaid + Number(paymentAmount);
    const newBal = Math.max(0, paymentModalInvoice.grandTotal - newPaid);
    const newStatus: InvoiceStatus = newBal <= 0 ? 'Paid' : 'Partially Paid';

    const updated: SalesInvoice = {
      ...paymentModalInvoice,
      amountPaid: newPaid,
      balanceDue: newBal,
      status: newStatus,
      payments: [...paymentModalInvoice.payments, newPayment],
      updatedAt: new Date().toISOString(),
    };

    onSaveInvoice(updated);
    setPaymentModalInvoice(null);
    setPaymentAmount(0);
    setPaymentRef('');
  };

  // Filtered sales list
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customerGstin && s.customerGstin.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchDate = !dateFilter || s.invoiceDate === dateFilter;

      return matchSearch && matchStatus && matchDate;
    });
  }, [sales, searchTerm, statusFilter, dateFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Invoice Date',
      'Due Date',
      'Customer Name',
      'Customer GSTIN',
      'Place of Supply',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Grand Total',
      'Amount Paid',
      'Balance Due',
      'Status',
    ];

    const rows = filteredSales.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.invoiceDate}"`,
      `"${inv.dueDate}"`,
      `"${inv.customerName}"`,
      `"${inv.customerGstin || ''}"`,
      `"${inv.placeOfSupply}"`,
      inv.totalTaxable,
      inv.cgstTotal,
      inv.sgstTotal,
      inv.igstTotal,
      inv.grandTotal,
      inv.amountPaid,
      inv.balanceDue,
      `"${inv.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Register_${company.financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.invoices.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'hi'
              ? 'जीएसटी कर चालान निर्माण, मुद्रण, भुगतान ट्रैकिंग एवं रिटर्न रिपोर्टिंग'
              : 'GST Compliant Tax Invoices, HSN Summary, E-Way Bill Details & Payment Tracking'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.common.exportCSV}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingInvoice(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.invoices.newInvoice}</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'hi' ? 'चालान संख्या, ग्राहक, या जीएसटी नंबर से खोजें...' : 'Search by invoice no, customer, GSTIN...'}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">{language === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
            <option value="Issued">Issued</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          {(searchTerm || statusFilter !== 'All' || dateFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setDateFilter('');
              }}
              className="text-xs px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              {t.common.clear}
            </button>
          )}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.invoices.invoiceNo}</th>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4">{t.invoices.customer}</th>
                <th className="py-3 px-4">{t.invoices.placeOfSupply}</th>
                <th className="py-3 px-4 text-right">{t.common.taxableAmount}</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">{t.common.grandTotal}</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">{t.common.status}</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredSales.map((inv) => {
                  const totalGst = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{inv.invoiceDate}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.customerGstin || 'URP'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700">{inv.placeOfSupply}</span>
                        {inv.isInterState ? (
                          <span className="ml-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            IGST
                          </span>
                        ) : (
                          <span className="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            CGST+SGST
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatINR(inv.totalTaxable)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatINR(totalGst)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            inv.balanceDue > 0 ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        >
                          {formatINR(inv.balanceDue)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Issued'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            title={t.common.preview}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {inv.balanceDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentModalInvoice(inv);
                                setPaymentAmount(inv.balanceDue);
                              }}
                              title={t.invoices.recordPayment}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(inv)}
                            title={t.common.edit}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(inv)}
                            title={t.common.delete}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT INVOICE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  {editingInvoice ? t.invoices.editInvoice : t.invoices.newInvoice}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'जीएसटी नियमों के अनुसार कर चालान विवरण दर्ज करें'
                    : 'Issue GST compliant tax invoice with automatic CGST, SGST & IGST split'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 overflow-y-auto space-y-5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.invoices.invoiceNo} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.invoices.invoiceDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.invoices.dueDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.invoices.placeOfSupply} *
                  </label>
                  <select
                    value={formData.placeOfSupplyCode}
                    onChange={(e) => handlePlaceOfSupplyChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Details & GST Auto-Fill */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t.invoices.customer} (Registered Client) *
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                    >
                      <option value="">-- {language === 'hi' ? 'ग्राहक चुनें (या नीचे जीएसटी खोजें)' : 'Select Existing Customer (or Auto-Fill via GSTIN below)'} --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.gstin ? `(${c.gstin})` : '(Unregistered)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Customer Legal Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerName || ''}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Legal Entity Name as registered with GST"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* GSTIN Auto-Fill Field */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <GSTINAutoFillField
                    gstin={formData.customerGstin || ''}
                    onChangeGstin={(g) => setFormData({ ...formData, customerGstin: g })}
                    onDetailsFetched={handleCustomerGSTDetailsFetched}
                    onFallbackExtracted={(ext) => {
                      const isInter = isInterStateTransaction(company.stateCode, ext.stateCode);
                      setFormData((prev) => ({
                        ...prev,
                        customerStateCode: ext.stateCode,
                        customerState: ext.stateName || prev.customerState,
                        customerPan: ext.pan,
                        placeOfSupply: ext.stateName || prev.placeOfSupply,
                        placeOfSupplyCode: ext.stateCode,
                        isInterState: isInter,
                      }));
                      setItems((prevItems) => prevItems.map((item) => calculateItem(item, isInter)));
                    }}
                    currentGstStatus={formData.customerGstStatus}
                    currentTaxpayerType={formData.customerTaxpayerType}
                    verifiedAt={formData.customerGstVerifiedAt}
                    language={language}
                    label="Customer GSTIN (15 Digits Auto-Fill)"
                  />
                </div>

                {/* Review & Edit Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Customer Trade Name
                    </label>
                    <input
                      type="text"
                      value={formData.customerTradeName || ''}
                      onChange={(e) => setFormData({ ...formData, customerTradeName: e.target.value })}
                      placeholder="Brand or Trade Name"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Income Tax PAN
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.customerPan || ''}
                      onChange={(e) => setFormData({ ...formData, customerPan: e.target.value.toUpperCase() })}
                      placeholder="e.g. AAAAA0000A"
                      className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Customer State & Code
                    </label>
                    <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-700 font-medium">
                      {formData.customerStateCode ? `${formData.customerStateCode} - ${formData.customerState}` : 'Pending GSTIN or Selection'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'बिलिंग पता' : 'Principal Place of Business / Registered Billing Address'}
                  </label>
                  <input
                    type="text"
                    value={formData.billingAddress || ''}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="Principal Place of Business address as per GST registry"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* RCM Checkbox and Tax Indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isRcm}
                    onChange={(e) => setFormData({ ...formData, isRcm: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{t.invoices.rcmApplicable} (Reverse Charge Mechanism)</span>
                </label>

                <div className="text-xs font-semibold">
                  Tax Structure:{' '}
                  {formData.isInterState ? (
                    <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Inter-State (IGST Applicable)
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Intra-State (CGST + SGST Split)
                    </span>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{t.invoices.itemDetails}</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.invoices.addItem}</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[200px]">{t.invoices.description} *</th>
                        <th className="py-2.5 px-3 w-24">{t.invoices.hsnSac}</th>
                        <th className="py-2.5 px-3 w-16 text-right">{t.invoices.qty}</th>
                        <th className="py-2.5 px-3 w-20">{t.invoices.unit}</th>
                        <th className="py-2.5 px-3 w-24 text-right">{t.invoices.rate} *</th>
                        <th className="py-2.5 px-3 w-20 text-right">{t.invoices.discPercent}</th>
                        <th className="py-2.5 px-3 w-24 text-right">{t.invoices.taxableValue}</th>
                        <th className="py-2.5 px-3 w-20 text-center">{t.invoices.gstRate}</th>
                        <th className="py-2.5 px-3 w-28 text-right">Line Total (₹)</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              placeholder="Product or service description"
                              value={item.description}
                              onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                              className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="998314"
                              value={item.hsnSac}
                              onChange={(e) => handleItemFieldChange(idx, 'hsnSac', e.target.value)}
                              className="w-full font-mono text-xs px-2 py-1.5 rounded-lg border border-slate-300"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={item.qty}
                              onChange={(e) => handleItemFieldChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-full font-mono text-xs px-2 py-1.5 rounded-lg border border-slate-300 text-right"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value as UnitType)}
                              className="w-full text-xs px-1.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                            >
                              {DEFAULT_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={item.rate}
                              onChange={(e) => handleItemFieldChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-full font-mono text-xs px-2 py-1.5 rounded-lg border border-slate-300 text-right"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={item.discountPercent}
                              onChange={(e) => handleItemFieldChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                              className="w-full font-mono text-xs px-2 py-1.5 rounded-lg border border-slate-300 text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium">
                            {formatINR(item.taxableAmount, { showSymbol: false })}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <select
                              value={item.gstRate}
                              onChange={(e) => handleItemFieldChange(idx, 'gstRate', parseInt(e.target.value) as GSTRate)}
                              className="w-full font-mono text-xs px-1.5 py-1.5 rounded-lg border border-slate-300 bg-white text-center"
                            >
                              {GST_RATES.map((r) => (
                                <option key={r} value={r}>
                                  {r}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatINR(item.totalAmount, { showSymbol: false })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.common.notes}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 resize-none"
                  />
                  <div className="mt-2 text-[11px] font-semibold text-slate-500 italic">
                    {t.invoices.amountInWords}: <span className="text-slate-800">{numberToWordsINR(totals.grandTotal)}</span>
                  </div>
                </div>

                {/* Calculation Cards */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span>{formatINR(totals.totalTaxable)}</span>
                  </div>

                  {!formData.isInterState ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST:</span>
                        <span>{formatINR(totals.cgstTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST:</span>
                        <span>{formatINR(totals.sgstTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST:</span>
                      <span>{formatINR(totals.igstTotal)}</span>
                    </div>
                  )}

                  {totals.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Round Off:</span>
                      <span>{formatINR(totals.roundOff)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-300">
                    <span>{t.common.grandTotal}:</span>
                    <span className="text-emerald-700 font-black">{formatINR(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {t.invoices.recordPayment} - {paymentModalInvoice.invoiceNumber}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between font-mono">
                <div>
                  <span className="text-slate-500 block">Total Invoice:</span>
                  <span className="font-bold">{formatINR(paymentModalInvoice.grandTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Balance Due:</span>
                  <span className="font-bold text-amber-600">{formatINR(paymentModalInvoice.balanceDue)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Received Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentModalInvoice.balanceDue}
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT / RTGS)</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction / UTR / Cheque Ref No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFCR520260410..."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Record Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PRINT PREVIEW MODAL */}
      <InvoicePrintPreviewModal
        invoice={previewInvoice}
        company={company}
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        language={language}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title={`Sales Invoice ${deleteTarget?.invoiceNumber}`}
        recordIdentifier={deleteTarget?.invoiceNumber || ''}
        onConfirm={(reason) => {
          if (deleteTarget) {
            onDeleteInvoice(deleteTarget.id, reason);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
        language={language}
      />
    </div>
  );
};
