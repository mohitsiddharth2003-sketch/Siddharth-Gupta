import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  ShoppingBag,
  CheckCircle,
  X,
  CreditCard,
} from 'lucide-react';
import {
  PurchaseBill,
  InvoiceItem,
  Party,
  CompanyProfile,
  Language,
  ITCEligibility,
  PurchaseStatus,
  UnitType,
  GSTRate,
  GSTDetails,
} from '../types/accounting';
import {
  formatINR,
  INDIAN_STATES,
  GST_RATES,
  isInterStateTransaction,
} from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { GSTINAutoFillField } from './GSTINAutoFillField';

interface PurchaseBillsModuleProps {
  purchases: PurchaseBill[];
  parties: Party[];
  company: CompanyProfile;
  language: Language;
  onSavePurchase: (bill: PurchaseBill) => void;
  onDeletePurchase: (id: string, reason: string) => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

export const PurchaseBillsModule: React.FC<PurchaseBillsModuleProps> = ({
  purchases,
  parties,
  company,
  language,
  onSavePurchase,
  onDeletePurchase,
  isCreateOpen,
  setIsCreateOpen,
}) => {
  const t = translations[language];

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [itcFilter, setItcFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [editingBill, setEditingBill] = useState<PurchaseBill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseBill | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PurchaseBill>>({
    billNumber: `PB/26-27/${String(purchases.length + 1).padStart(3, '0')}`,
    vendorBillNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    vendorId: '',
    vendorName: '',
    vendorGstin: '',
    vendorState: company.state,
    vendorStateCode: company.stateCode,
    isInterState: false,
    itcEligibility: 'Eligible',
    paymentStatus: 'Unpaid',
    amountPaid: 0,
    balanceDue: 0,
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `pitem_${Date.now()}_1`,
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

  // Vendors list
  const vendors = useMemo(() => {
    return parties.filter((p) => p.type === 'Vendor' || p.type === 'Both');
  }, [parties]);

  // Calculate items
  const calculateItem = (item: InvoiceItem, isInter: boolean): InvoiceItem => {
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

    if (isInter) {
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

  const totals = useMemo(() => {
    const isInter = formData.isInterState ?? false;
    let subTotal = 0;
    let totalTaxable = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    items.forEach((item) => {
      const calc = calculateItem(item, isInter);
      subTotal += (Number(calc.qty) || 0) * (Number(calc.rate) || 0);
      totalTaxable += calc.taxableAmount;
      cgstTotal += calc.cgstAmount;
      sgstTotal += calc.sgstAmount;
      igstTotal += calc.igstAmount;
    });

    const exactTotal = totalTaxable + cgstTotal + sgstTotal + igstTotal;
    const grandTotal = Math.round(exactTotal);
    const roundOff = Number((grandTotal - exactTotal).toFixed(2));

    return {
      subTotal: Number(subTotal.toFixed(2)),
      totalTaxable: Number(totalTaxable.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      roundOff,
      grandTotal,
    };
  }, [items, formData.isInterState]);

  // Handle Vendor selection
  const handleVendorChange = (vendorId: string) => {
    const v = vendors.find((vend) => vend.id === vendorId);
    if (!v) return;

    const isInter = isInterStateTransaction(company.stateCode, v.stateCode);
    setFormData((prev) => ({
      ...prev,
      vendorId: v.id,
      vendorName: v.name,
      vendorGstin: v.gstin || '',
      vendorState: v.state,
      vendorStateCode: v.stateCode,
      isInterState: isInter,
    }));

    setItems((prev) => prev.map((item) => calculateItem(item, isInter)));
  };

  // Handle vendor GST auto-fill
  const handleVendorGSTDetailsFetched = (details: GSTDetails) => {
    const existing = vendors.find(
      (v) => v.gstin && v.gstin.trim().toUpperCase() === details.gstin.trim().toUpperCase()
    );

    const isInter = isInterStateTransaction(company.stateCode, details.stateCode);

    setFormData((prev) => ({
      ...prev,
      vendorId: existing ? existing.id : prev.vendorId || `vend_auto_${Date.now()}`,
      vendorName: details.legalName || prev.vendorName,
      vendorTradeName: details.tradeName || prev.vendorTradeName,
      vendorGstin: details.gstin,
      vendorAddress: details.address || prev.vendorAddress,
      vendorCity: details.city || prev.vendorCity,
      vendorDistrict: details.district || prev.vendorDistrict,
      vendorPincode: details.pincode || prev.vendorPincode,
      vendorGstStatus: details.gstStatus || prev.vendorGstStatus,
      vendorTaxpayerType: details.taxpayerType || prev.vendorTaxpayerType,
      vendorGstVerifiedAt: details.verifiedAt || new Date().toISOString(),
      vendorState: details.state,
      vendorStateCode: details.stateCode,
      isInterState: isInter,
    }));

    setItems((prev) => prev.map((item) => calculateItem(item, isInter)));
  };

  const handleItemFieldChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      copy[index] = calculateItem(copy[index], formData.isInterState ?? false);
      return copy;
    });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `pitem_${Date.now()}_${items.length + 1}`,
      description: '',
      hsnSac: '',
      qty: 1,
      unit: 'NOS',
      rate: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 0,
      gstRate: 18,
      cgstRate: formData.isInterState ? 0 : 9,
      sgstRate: formData.isInterState ? 0 : 9,
      igstRate: formData.isInterState ? 18 : 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleStartEdit = (bill: PurchaseBill) => {
    setEditingBill(bill);
    setFormData({ ...bill });
    setItems(bill.items.map((i) => ({ ...i })));
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingBill(null);
    setFormError('');
    setFormData({
      billNumber: `PB/26-27/${String(purchases.length + 1).padStart(3, '0')}`,
      vendorBillNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      vendorId: '',
      vendorName: '',
      vendorGstin: '',
      vendorState: company.state,
      vendorStateCode: company.stateCode,
      isInterState: false,
      itcEligibility: 'Eligible',
      paymentStatus: 'Unpaid',
      amountPaid: 0,
      balanceDue: 0,
      notes: '',
    });
    setItems([
      {
        id: `pitem_${Date.now()}_1`,
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

    if (!formData.vendorId || !formData.vendorName) {
      setFormError(language === 'hi' ? 'कृपया विक्रेता चुनें' : 'Please select a vendor');
      return;
    }

    if (!formData.vendorBillNumber?.trim()) {
      setFormError(language === 'hi' ? 'कृपया विक्रेता का बिल नंबर दर्ज करें' : 'Please enter Supplier Invoice No.');
      return;
    }

    const trimmedVendorBillNo = formData.vendorBillNumber.trim().toLowerCase();
    const isDuplicate = purchases.some(
      (p) =>
        p.id !== editingBill?.id &&
        p.vendorId === formData.vendorId &&
        p.vendorBillNumber.trim().toLowerCase() === trimmedVendorBillNo
    );
    if (isDuplicate) {
      setFormError(
        language === 'hi'
          ? `इस विक्रेता के लिए बिल नंबर "${formData.vendorBillNumber}" पहले से दर्ज है।`
          : `Supplier bill number "${formData.vendorBillNumber}" has already been recorded for this vendor.`
      );
      return;
    }

    if (!items.some((i) => i.description.trim() && i.rate > 0)) {
      setFormError(language === 'hi' ? 'कृपया कम से कम एक वैध सामग्री दर्ज करें' : 'Please enter at least one item');
      return;
    }

    const calculatedItems = items.map((i) => calculateItem(i, formData.isInterState ?? false));

    const billToSave: PurchaseBill = {
      id: editingBill ? editingBill.id : `pb_${Date.now()}`,
      billNumber: formData.billNumber || `PB/26-27/001`,
      vendorBillNumber: formData.vendorBillNumber.trim(),
      billDate: formData.billDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      vendorId: formData.vendorId,
      vendorName: formData.vendorName,
      vendorGstin: formData.vendorGstin,
      vendorState: formData.vendorState || company.state,
      vendorStateCode: formData.vendorStateCode || company.stateCode,
      isInterState: formData.isInterState ?? false,
      items: calculatedItems,
      subTotal: totals.subTotal,
      totalTaxable: totals.totalTaxable,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      igstTotal: totals.igstTotal,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      itcEligibility: (formData.itcEligibility as ITCEligibility) || 'Eligible',
      paymentStatus: (formData.paymentStatus as PurchaseStatus) || 'Unpaid',
      amountPaid: formData.paymentStatus === 'Paid' ? totals.grandTotal : (formData.amountPaid || 0),
      balanceDue: formData.paymentStatus === 'Paid' ? 0 : Math.max(0, totals.grandTotal - (formData.amountPaid || 0)),
      notes: formData.notes,
      createdAt: editingBill ? editingBill.createdAt : new Date().toISOString(),
    };

    onSavePurchase(billToSave);
    handleCloseModal();
  };

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorBillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.billNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchItc = itcFilter === 'All' || p.itcEligibility === itcFilter;
      const matchStatus = statusFilter === 'All' || p.paymentStatus === statusFilter;

      return matchSearch && matchItc && matchStatus;
    });
  }, [purchases, searchTerm, itcFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.purchases.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'hi'
              ? 'आवक आपूर्ति बिल, इनपुट टैक्स क्रेडिट (ITC) पात्रता एवं विक्रेता भुगतान'
              : 'Record vendor invoices, track Input Tax Credit (ITC) & manage payables'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBill(null);
            setIsCreateOpen(true);
          }}
          title="Create Purchase Bill (Ctrl + B)"
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.purchases.newBill}</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 text-[9px] font-mono bg-indigo-700 rounded border border-indigo-500/60 text-indigo-100 font-bold">
            Ctrl+B
          </kbd>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'hi' ? 'विक्रेता का नाम या बिल नंबर से खोजें...' : 'Search vendor name, bill number...'}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={itcFilter}
            onChange={(e) => setItcFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All ITC Status</option>
            <option value="Eligible">{t.purchases.eligibleItc}</option>
            <option value="Ineligible">{t.purchases.ineligibleItc}</option>
            <option value="Blocked_17_5">{t.purchases.blockedItc}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Payments</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.purchases.billNo}</th>
                <th className="py-3 px-4">{t.purchases.vendorBillNo}</th>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4">{t.purchases.vendor}</th>
                <th className="py-3 px-4 text-right">{t.common.taxableAmount}</th>
                <th className="py-3 px-4 text-right">Input GST</th>
                <th className="py-3 px-4 text-right">{t.common.grandTotal}</th>
                <th className="py-3 px-4 text-center">{t.purchases.itcEligibility}</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((bill) => {
                  const inputGst = bill.cgstTotal + bill.sgstTotal + bill.igstTotal;
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{bill.billNumber}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">
                        {bill.vendorBillNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{bill.billDate}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{bill.vendorName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {bill.vendorGstin || 'Unregistered'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatINR(bill.totalTaxable)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatINR(inputGst)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(bill.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.itcEligibility === 'Eligible'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.itcEligibility === 'Blocked_17_5'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {bill.itcEligibility === 'Blocked_17_5' ? 'Sec 17(5) Blocked' : bill.itcEligibility}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(bill)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(bill)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"
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

      {/* CREATE / EDIT PURCHASE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  {editingBill ? 'Edit Purchase Bill' : t.purchases.newBill}
                </h2>
                <p className="text-xs text-slate-500">
                  Record supplier tax invoice for accurate GSTR-2B & GSTR-3B ITC reconciliation
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.purchases.billNo}
                  </label>
                  <input
                    type="text"
                    value={formData.billNumber}
                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.purchases.vendorBillNo} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DTH/26/8941"
                    value={formData.vendorBillNumber}
                    onChange={(e) => setFormData({ ...formData, vendorBillNumber: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.billDate}
                    onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.purchases.itcEligibility} *
                  </label>
                  <select
                    value={formData.itcEligibility}
                    onChange={(e) => setFormData({ ...formData, itcEligibility: e.target.value as ITCEligibility })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Eligible">Eligible (Normal ITC)</option>
                    <option value="Ineligible">Ineligible</option>
                    <option value="Blocked_17_5">Blocked u/s 17(5)</option>
                  </select>
                </div>
              </div>

              {/* Supplier Details & GST Auto-Fill */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'आपूर्तिकर्ता / विक्रेता का नाम *' : 'Supplier / Vendor Legal Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      language === 'hi'
                        ? 'आपूर्तिकर्ता फर्म का कानूनी नाम (या नीचे जीएसटी नंबर दर्ज करें)'
                        : 'Supplier / Vendor Legal Business Name (or Auto-Fill via GSTIN below)'
                    }
                    value={formData.vendorName || ''}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* GSTIN Auto-Fill Field */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <GSTINAutoFillField
                    gstin={formData.vendorGstin || ''}
                    onChangeGstin={(g) => setFormData({ ...formData, vendorGstin: g })}
                    onDetailsFetched={handleVendorGSTDetailsFetched}
                    onFallbackExtracted={(ext) => {
                      const isInter = isInterStateTransaction(company.stateCode, ext.stateCode);
                      setFormData((prev) => ({
                        ...prev,
                        vendorStateCode: ext.stateCode,
                        vendorState: ext.stateName || prev.vendorState,
                        isInterState: isInter,
                      }));
                      setItems((prev) => prev.map((item) => calculateItem(item, isInter)));
                    }}
                    currentGstStatus={formData.vendorGstStatus}
                    currentTaxpayerType={formData.vendorTaxpayerType}
                    verifiedAt={formData.vendorGstVerifiedAt}
                    language={language}
                    label="Supplier GSTIN (15 Digits Auto-Fill)"
                  />
                </div>

                {/* Review & Edit Supplier Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Supplier Trade / Brand Name
                    </label>
                    <input
                      type="text"
                      value={formData.vendorTradeName || ''}
                      onChange={(e) => setFormData({ ...formData, vendorTradeName: e.target.value })}
                      placeholder="Brand or trade name"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Supplier State & Code
                    </label>
                    <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-700 font-medium">
                      {formData.vendorStateCode ? `${formData.vendorStateCode} - ${formData.vendorState}` : 'Pending GSTIN or Selection'}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      City / PIN
                    </label>
                    <input
                      type="text"
                      value={formData.vendorCity ? `${formData.vendorCity}${formData.vendorPincode ? ` - ${formData.vendorPincode}` : ''}` : ''}
                      onChange={(e) => setFormData({ ...formData, vendorCity: e.target.value })}
                      placeholder="City and PIN code"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Principal Place of Business / Supplier Address
                  </label>
                  <input
                    type="text"
                    value={formData.vendorAddress || ''}
                    onChange={(e) => setFormData({ ...formData, vendorAddress: e.target.value })}
                    placeholder="Registered business address as per GST registry"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Goods / Services Received</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 min-w-[200px]">Description *</th>
                        <th className="py-2 px-3 w-24">HSN</th>
                        <th className="py-2 px-3 w-16 text-right">Qty</th>
                        <th className="py-2 px-3 w-24 text-right">Rate (₹)</th>
                        <th className="py-2 px-3 w-24 text-right">Taxable</th>
                        <th className="py-2 px-3 w-20 text-center">GST %</th>
                        <th className="py-2 px-3 w-28 text-right">Total (₹)</th>
                        <th className="py-2 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              placeholder="Hardware, services, materials..."
                              value={item.description}
                              onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                              className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="847170"
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
                              value={item.qty}
                              onChange={(e) => handleItemFieldChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-full font-mono text-xs px-2 py-1.5 rounded-lg border border-slate-300 text-right"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate}
                              onChange={(e) => handleItemFieldChange(idx, 'rate', parseFloat(e.target.value) || 0)}
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
                              className="w-full font-mono text-xs px-1.5 py-1.5 rounded-lg border border-slate-300 bg-white"
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

              {/* Totals & Payment Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PurchaseStatus })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white mb-2"
                  >
                    <option value="Unpaid">Unpaid (Sundry Creditor)</option>
                    <option value="Paid">Fully Paid (Bank/Cash)</option>
                  </select>
                  <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 resize-none"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable:</span>
                    <span>{formatINR(totals.totalTaxable)}</span>
                  </div>
                  {!formData.isInterState ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Input CGST:</span>
                        <span>{formatINR(totals.cgstTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Input SGST:</span>
                        <span>{formatINR(totals.sgstTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Input IGST:</span>
                      <span>{formatINR(totals.igstTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span className="text-indigo-700 font-black">{formatINR(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                >
                  Save Purchase Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title={`Purchase Bill ${deleteTarget?.vendorBillNumber}`}
        recordIdentifier={deleteTarget?.vendorBillNumber || ''}
        onConfirm={(reason) => {
          if (deleteTarget) {
            onDeletePurchase(deleteTarget.id, reason);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
        language={language}
      />
    </div>
  );
};
