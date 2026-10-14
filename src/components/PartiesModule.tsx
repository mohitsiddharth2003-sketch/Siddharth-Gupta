import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  Party,
  PartyType,
  BalanceType,
  SalesInvoice,
  PurchaseBill,
  Language,
  GSTDetails,
} from '../types/accounting';
import {
  formatINR,
  validateGSTIN,
  validatePAN,
  INDIAN_STATES,
} from '../utils/indianFormatters';
import { translations } from '../utils/translations';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { GSTINAutoFillField } from './GSTINAutoFillField';

interface PartiesModuleProps {
  parties: Party[];
  sales: SalesInvoice[];
  purchases: PurchaseBill[];
  language: Language;
  onSaveParty: (party: Party) => void;
  onDeleteParty: (id: string, reason: string) => void;
  onOpenLedger: (partyId: string) => void;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

export const PartiesModule: React.FC<PartiesModuleProps> = ({
  parties,
  sales,
  purchases,
  language,
  onSaveParty,
  onDeleteParty,
  onOpenLedger,
  isCreateOpen,
  setIsCreateOpen,
}) => {
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Customer' | 'Vendor'>('All');
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Party | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Party>>({
    type: 'Customer',
    name: '',
    tradeName: '',
    gstin: '',
    pan: '',
    phone: '',
    email: '',
    billingAddress: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '',
    openingBalance: 0,
    openingBalanceType: 'Dr',
    creditLimit: 0,
    notes: '',
    district: '',
    registrationDate: '',
    constitutionOfBusiness: '',
    gstStatus: '',
    taxpayerType: '',
    gstVerifiedAt: '',
  });

  const [formError, setFormError] = useState('');

  // Handle auto-population when GST details are fetched from authorized API
  const handleGSTDetailsFetched = (details: GSTDetails) => {
    setFormData((prev) => ({
      ...prev,
      gstin: details.gstin,
      name: details.legalName || prev.name,
      tradeName: details.tradeName || prev.tradeName,
      billingAddress: details.address || prev.billingAddress,
      city: details.city || prev.city,
      district: details.district || prev.district,
      state: details.state || prev.state,
      stateCode: details.stateCode || prev.stateCode,
      pincode: details.pincode || prev.pincode,
      pan: details.pan || prev.pan,
      registrationDate: details.registrationDate || prev.registrationDate,
      constitutionOfBusiness: details.constitutionOfBusiness || prev.constitutionOfBusiness,
      gstStatus: details.gstStatus || prev.gstStatus,
      taxpayerType: details.taxpayerType || prev.taxpayerType,
      gstVerifiedAt: details.verifiedAt || new Date().toISOString(),
    }));
  };

  const handleFallbackExtracted = (extracted: { stateCode: string; stateName?: string; pan: string }) => {
    setFormData((prev) => ({
      ...prev,
      stateCode: extracted.stateCode,
      state: extracted.stateName || prev.state,
      pan: extracted.pan,
    }));
  };

  // GSTIN change handler with auto-fill of State & PAN
  const handleGstinChange = (input: string) => {
    const upper = input.toUpperCase().trim();
    setFormData((prev) => {
      const next = { ...prev, gstin: upper };
      if (upper.length === 15) {
        const val = validateGSTIN(upper);
        if (val.valid && val.stateCode && val.pan) {
          const stateObj = INDIAN_STATES.find((s) => s.code === val.stateCode);
          if (stateObj) {
            next.state = stateObj.name;
            next.stateCode = val.stateCode;
          }
          next.pan = val.pan;
        }
      }
      return next;
    });
  };

  const handleStateChange = (stateCode: string) => {
    const s = INDIAN_STATES.find((item) => item.code === stateCode);
    if (!s) return;
    setFormData((prev) => ({
      ...prev,
      state: s.name,
      stateCode: s.code,
    }));
  };

  const handleStartEdit = (p: Party) => {
    setEditingParty(p);
    setFormData({ ...p });
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingParty(null);
    setFormError('');
    setFormData({
      type: 'Customer',
      name: '',
      tradeName: '',
      gstin: '',
      pan: '',
      phone: '',
      email: '',
      billingAddress: '',
      city: '',
      district: '',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '',
      registrationDate: '',
      constitutionOfBusiness: '',
      gstStatus: '',
      taxpayerType: '',
      gstVerifiedAt: '',
      openingBalance: 0,
      openingBalanceType: 'Dr',
      creditLimit: 0,
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setFormError(language === 'hi' ? 'कृपया पार्टी का नाम दर्ज करें' : 'Please provide party legal name');
      return;
    }

    if (formData.gstin?.trim()) {
      const gstinVal = validateGSTIN(formData.gstin.trim());
      if (!gstinVal.valid) {
        setFormError(gstinVal.error || 'Invalid GSTIN format');
        return;
      }
    }

    if (formData.pan?.trim()) {
      const panVal = validatePAN(formData.pan.trim());
      if (!panVal.valid) {
        setFormError(panVal.error || 'Invalid PAN format');
        return;
      }
    }

    const partyToSave: Party = {
      id: editingParty ? editingParty.id : `party_${Date.now()}`,
      type: (formData.type as PartyType) || 'Customer',
      name: formData.name.trim(),
      tradeName: formData.tradeName?.trim(),
      gstin: formData.gstin?.trim().toUpperCase(),
      pan: formData.pan?.trim().toUpperCase(),
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim(),
      billingAddress: formData.billingAddress?.trim() || '',
      city: formData.city?.trim() || '',
      state: formData.state || 'Maharashtra',
      stateCode: formData.stateCode || '27',
      pincode: formData.pincode?.trim(),
      openingBalance: Number(formData.openingBalance) || 0,
      openingBalanceType: (formData.openingBalanceType as BalanceType) || 'Dr',
      creditLimit: Number(formData.creditLimit) || 0,
      notes: formData.notes?.trim(),
      createdAt: editingParty ? editingParty.createdAt : new Date().toISOString(),
    };

    onSaveParty(partyToSave);
    handleCloseModal();
  };

  // Calculate live party balances
  const partyBalances = useMemo(() => {
    const balances: Record<string, { currentBalance: number; balanceType: BalanceType }> = {};

    parties.forEach((p) => {
      let balance = p.openingBalance * (p.openingBalanceType === 'Dr' ? 1 : -1);

      // Invoices issued to this customer increase Dr
      sales
        .filter((s) => s.customerId === p.id && s.status !== 'Cancelled')
        .forEach((s) => {
          balance += s.balanceDue;
        });

      // Purchases from this vendor increase Cr
      purchases
        .filter((b) => b.vendorId === p.id)
        .forEach((b) => {
          balance -= b.balanceDue;
        });

      balances[p.id] = {
        currentBalance: Math.abs(balance),
        balanceType: balance >= 0 ? 'Dr' : 'Cr',
      };
    });

    return balances;
  }, [parties, sales, purchases]);

  // Filtered
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.tradeName && p.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.gstin && p.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.phone.includes(searchTerm);

      const matchType =
        typeFilter === 'All'
          ? true
          : typeFilter === 'Customer'
          ? p.type === 'Customer' || p.type === 'Both'
          : p.type === 'Vendor' || p.type === 'Both';

      return matchSearch && matchType;
    });
  }, [parties, searchTerm, typeFilter]);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.parties.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'hi'
              ? 'ग्राहक एवं आपूर्तिकर्ता मास्टर, जीएसटी नंबर, प्रारंभिक शेष तथा खाता समीक्षा'
              : 'Master directory of customers & suppliers with GSTIN validation, PAN & ledger tracking'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingParty(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.parties.newParty}</span>
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'hi' ? 'नाम, जीएसटी, फोन से खोजें...' : 'Search by legal name, trade name, GSTIN, phone...'}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTypeFilter('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              typeFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.common.all} ({parties.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('Customer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              typeFilter === 'Customer' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.parties.customersOnly}
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('Vendor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              typeFilter === 'Vendor' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.parties.vendorsOnly}
          </button>
        </div>
      </div>

      {/* Grid Cards of Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            {t.common.noData}
          </div>
        ) : (
          filteredParties.map((party) => {
            const bal = partyBalances[party.id] || { currentBalance: 0, balanceType: 'Dr' };
            const isCustomer = party.type === 'Customer' || party.type === 'Both';
            const isVendor = party.type === 'Vendor' || party.type === 'Both';

            return (
              <div
                key={party.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5 ${
                          party.type === 'Customer'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : party.type === 'Vendor'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {party.type}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {party.name}
                      </h3>
                      {party.tradeName && (
                        <div className="text-xs text-slate-500 font-medium">
                          ({party.tradeName})
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(party)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title={t.common.edit}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(party)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-slate-600 my-3 font-medium">
                    <div className="font-mono text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-400">GSTIN:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-800">
                          {party.gstin || 'Unregistered (URP)'}
                        </span>
                        {party.gstStatus && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              party.gstStatus.toLowerCase() === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {party.gstStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {(party.constitutionOfBusiness || party.taxpayerType) && (
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        {party.constitutionOfBusiness && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                            {party.constitutionOfBusiness}
                          </span>
                        )}
                        {party.taxpayerType && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                            {party.taxpayerType}
                          </span>
                        )}
                      </div>
                    )}

                    {party.phone && (
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{party.phone}</span>
                      </div>
                    )}

                    {party.billingAddress && (
                      <div className="flex items-start space-x-2 text-slate-500 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {party.billingAddress}, {party.city} ({party.stateCode})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger Balance Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t.parties.currentOutstanding}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        bal.balanceType === 'Dr' ? 'text-amber-700' : 'text-purple-700'
                      }`}
                    >
                      {formatINR(bal.currentBalance)} {bal.balanceType}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenLedger(party.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Statement</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT PARTY MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingParty ? 'Edit Party Master' : t.parties.newParty}
                </h3>
                <p className="text-xs text-slate-500">
                  Customer, vendor or contractor registration with GST state verification
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.parties.partyType} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PartyType })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Customer">Customer (Debtor)</option>
                    <option value="Vendor">Vendor / Supplier (Creditor)</option>
                    <option value="Both">Both (Customer & Vendor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.parties.phone} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.parties.name} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Legal Registered Entity Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.parties.tradeName}
                  </label>
                  <input
                    type="text"
                    placeholder="Trade or Brand Name"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.parties.email}
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@client.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* GSTIN Verification & Auto-Fill Component */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <GSTINAutoFillField
                  gstin={formData.gstin || ''}
                  onChangeGstin={handleGstinChange}
                  onDetailsFetched={handleGSTDetailsFetched}
                  onFallbackExtracted={handleFallbackExtracted}
                  currentGstStatus={formData.gstStatus}
                  currentTaxpayerType={formData.taxpayerType}
                  currentConstitution={formData.constitutionOfBusiness}
                  verifiedAt={formData.gstVerifiedAt}
                  language={language}
                />

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t.parties.pan} (10 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. AAACA9012K"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Constitution of Business
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Private Limited, Proprietorship, LLP"
                      value={formData.constitutionOfBusiness || ''}
                      onChange={(e) => setFormData({ ...formData, constitutionOfBusiness: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t.parties.state} *
                    </label>
                    <select
                      value={formData.stateCode}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      City / Locality
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Bengaluru"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 400001"
                      value={formData.pincode || ''}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      placeholder="District"
                      value={formData.district || ''}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Taxpayer Type
                    </label>
                    <select
                      value={formData.taxpayerType || 'Regular'}
                      onChange={(e) => setFormData({ ...formData, taxpayerType: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      <option value="Regular">Regular Taxpayer</option>
                      <option value="Composition">Composition Scheme</option>
                      <option value="SEZ Unit">SEZ Unit</option>
                      <option value="SEZ Developer">SEZ Developer</option>
                      <option value="Casual">Casual Taxable Person</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.parties.billingAddress} (Principal Place of Business)
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, building, premises, locality..."
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 resize-none"
                />
              </div>

              {/* Opening Balance */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.parties.openingBalance} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Balance Type (Dr / Cr)
                  </label>
                  <select
                    value={formData.openingBalanceType}
                    onChange={(e) => setFormData({ ...formData, openingBalanceType: e.target.value as BalanceType })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Dr">Debit (Dr - Receivable)</option>
                    <option value="Cr">Credit (Cr - Payable)</option>
                  </select>
                </div>
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
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                >
                  Save Party Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title={`Party ${deleteTarget?.name}`}
        recordIdentifier={deleteTarget?.name || ''}
        onConfirm={(reason) => {
          if (deleteTarget) {
            onDeleteParty(deleteTarget.id, reason);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
        language={language}
      />
    </div>
  );
};
