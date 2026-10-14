import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  CreditCard,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Expense,
  ExpenseCategory,
  PaymentMode,
  GSTRate,
  Language,
} from '../types/accounting';
import { formatINR, GST_RATES } from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface ExpenseModuleProps {
  expenses: Expense[];
  language: Language;
  onSaveExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string, reason: string) => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Office Supplies',
  'Electricity & Utilities',
  'Travel & Conveyance',
  'Professional & Legal Fees',
  'Repairs & Maintenance',
  'Salaries & Wages',
  'Freight & Logistics',
  'Marketing & Advertising',
  'Software & Subscriptions',
  'Bank Charges',
  'Taxes & Licenses',
  'Miscellaneous',
];

const PAYMENT_MODES: PaymentMode[] = [
  'Bank Transfer (NEFT/RTGS)',
  'UPI',
  'Cheque',
  'Cash',
  'Credit/Debit Card',
];

export const ExpenseModule: React.FC<ExpenseModuleProps> = ({
  expenses,
  language,
  onSaveExpense,
  onDeleteExpense,
  isCreateOpen,
  setIsCreateOpen,
}) => {
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Expense>>({
    voucherNo: `EXP/26-27/${String(expenses.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    category: 'Office Supplies',
    description: '',
    amount: 0,
    gstApplicable: false,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 0,
    itcClaimed: false,
    paymentMode: 'Bank Transfer (NEFT/RTGS)',
    referenceNo: '',
    paidTo: '',
    vendorGstin: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Handle calculation when amount or gst changes
  const calculateTotal = (
    baseAmt: number,
    gstApp: boolean,
    gstR: number
  ) => {
    if (!gstApp || gstR === 0) {
      return {
        amount: baseAmt,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalAmount: baseAmt,
      };
    }

    const cgst = Number(((baseAmt * (gstR / 2)) / 100).toFixed(2));
    const sgst = Number(((baseAmt * (gstR / 2)) / 100).toFixed(2));
    const total = Number((baseAmt + cgst + sgst).toFixed(2));

    return {
      amount: baseAmt,
      cgst,
      sgst,
      igst: 0,
      totalAmount: total,
    };
  };

  const handleAmountChange = (amt: number) => {
    const calc = calculateTotal(amt, formData.gstApplicable ?? false, formData.gstRate ?? 18);
    setFormData((prev) => ({
      ...prev,
      ...calc,
    }));
  };

  const handleGstToggle = (app: boolean) => {
    const calc = calculateTotal(formData.amount ?? 0, app, formData.gstRate ?? 18);
    setFormData((prev) => ({
      ...prev,
      gstApplicable: app,
      itcClaimed: app,
      ...calc,
    }));
  };

  const handleGstRateChange = (rate: GSTRate) => {
    const calc = calculateTotal(formData.amount ?? 0, formData.gstApplicable ?? false, rate);
    setFormData((prev) => ({
      ...prev,
      gstRate: rate,
      ...calc,
    }));
  };

  const handleStartEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({ ...exp });
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingExpense(null);
    setFormError('');
    setFormData({
      voucherNo: `EXP/26-27/${String(expenses.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      category: 'Office Supplies',
      description: '',
      amount: 0,
      gstApplicable: false,
      gstRate: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: 0,
      itcClaimed: false,
      paymentMode: 'Bank Transfer (NEFT/RTGS)',
      referenceNo: '',
      paidTo: '',
      vendorGstin: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description?.trim()) {
      setFormError(language === 'hi' ? 'कृपया विवरण दर्ज करें' : 'Please provide description');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setFormError(language === 'hi' ? 'कृपया मान्य राशि दर्ज करें' : 'Please provide valid expense amount');
      return;
    }

    const calc = calculateTotal(
      formData.amount,
      formData.gstApplicable ?? false,
      formData.gstRate ?? 18
    );

    const expenseToSave: Expense = {
      id: editingExpense ? editingExpense.id : `exp_${Date.now()}`,
      voucherNo: formData.voucherNo || `EXP/26-27/001`,
      date: formData.date || new Date().toISOString().split('T')[0],
      category: formData.category as ExpenseCategory || 'Office Supplies',
      description: formData.description.trim(),
      amount: calc.amount,
      gstApplicable: formData.gstApplicable ?? false,
      gstRate: formData.gstRate as GSTRate || 18,
      cgst: calc.cgst,
      sgst: calc.sgst,
      igst: calc.igst,
      totalAmount: calc.totalAmount,
      itcClaimed: formData.itcClaimed ?? false,
      paymentMode: formData.paymentMode as PaymentMode || 'Bank Transfer (NEFT/RTGS)',
      referenceNo: formData.referenceNo?.trim(),
      paidTo: formData.paidTo?.trim(),
      vendorGstin: formData.vendorGstin?.trim(),
      notes: formData.notes?.trim(),
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    onSaveExpense(expenseToSave);
    handleCloseModal();
  };

  // Filtered
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
      const matchMode = modeFilter === 'All' || e.paymentMode === modeFilter;

      return matchSearch && matchCat && matchMode;
    });
  }, [expenses, searchTerm, categoryFilter, modeFilter]);

  const totalExpenseSum = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.expenses.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'hi'
              ? 'कार्यालयीन एवं प्रशासनिक व्यय, जीएसटी इनपुट दावा तथा भुगतान प्रबंधन'
              : 'Record business overheads, track ITC eligibility and cash/bank disbursements'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingExpense(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.expenses.newExpense}</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'hi' ? 'खर्च विवरण, प्राप्तकर्ता, या वाउचर नंबर से खोजें...' : 'Search description, beneficiary, voucher no...'}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Modes</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.expenses.voucherNo}</th>
                <th className="py-3 px-4">{t.common.date}</th>
                <th className="py-3 px-4">{t.expenses.category}</th>
                <th className="py-3 px-4">Description & Beneficiary</th>
                <th className="py-3 px-4">{t.expenses.paymentMode}</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">ITC</th>
                <th className="py-3 px-4 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const gstSum = exp.cgst + exp.sgst + exp.igst;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{exp.voucherNo}</td>
                      <td className="py-3 px-4 text-slate-600">{exp.date}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{exp.description}</div>
                        {exp.paidTo && (
                          <div className="text-[11px] text-slate-500">Paid to: {exp.paidTo}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{exp.paymentMode}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatINR(gstSum)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(exp.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {exp.itcClaimed ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Yes
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(exp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(exp)}
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

        {/* Total Summary Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600">Total Filtered Expenses ({filteredExpenses.length} Vouchers):</span>
          <span className="font-mono text-rose-600 text-sm font-bold">{formatINR(totalExpenseSum)}</span>
        </div>
      </div>

      {/* CREATE / EDIT EXPENSE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingExpense ? 'Edit Expense Voucher' : t.expenses.newExpense}
                </h3>
                <p className="text-xs text-slate-500">Record business operational expenditure</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.expenses.voucherNo}
                  </label>
                  <input
                    type="text"
                    value={formData.voucherNo}
                    onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.common.date} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.expenses.category} *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Broadband, Courier charges, Staff tea..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Base Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.expenses.paymentMode} *
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GST Section */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.gstApplicable}
                    onChange={(e) => handleGstToggle(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>{t.expenses.gstApplicable}</span>
                </label>

                {formData.gstApplicable && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">GST Rate</label>
                      <select
                        value={formData.gstRate}
                        onChange={(e) => handleGstRateChange(parseInt(e.target.value) as GSTRate)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        {GST_RATES.map((r) => (
                          <option key={r} value={r}>
                            {r}%
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Total GST (CGST+SGST)</label>
                      <div className="font-mono text-xs font-semibold py-1.5 px-2 bg-white rounded-lg border border-slate-200">
                        {formatINR((formData.cgst || 0) + (formData.sgst || 0))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.expenses.paidTo}
                  </label>
                  <input
                    type="text"
                    placeholder="Beneficiary / Vendor name"
                    value={formData.paidTo}
                    onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ref / Voucher / UTR
                  </label>
                  <input
                    type="text"
                    placeholder="UPI ref or Cheque no."
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Total Card */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-200 font-bold text-sm text-slate-900">
                <span>Total Disbursement:</span>
                <span className="font-mono text-rose-700">{formatINR(formData.totalAmount)}</span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title={`Expense Voucher ${deleteTarget?.voucherNo}`}
        recordIdentifier={deleteTarget?.voucherNo || ''}
        onConfirm={(reason) => {
          if (deleteTarget) {
            onDeleteExpense(deleteTarget.id, reason);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
        language={language}
      />
    </div>
  );
};
