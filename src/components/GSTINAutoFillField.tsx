import React, { useState } from 'react';
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  HelpCircle,
  Building,
  ShieldCheck,
  ShieldAlert,
  Info,
  X,
} from 'lucide-react';
import { GSTDetails, Language } from '../types/accounting';
import { GSTService, GSTVerificationResult } from '../services/gstService';

interface GSTINAutoFillFieldProps {
  gstin: string;
  onChangeGstin: (gstin: string) => void;
  onDetailsFetched: (details: GSTDetails) => void;
  onFallbackExtracted?: (extracted: { stateCode: string; stateName?: string; pan: string }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  language?: Language;
  currentGstStatus?: string;
  currentTaxpayerType?: string;
  currentConstitution?: string;
  verifiedAt?: string;
  disabled?: boolean;
  compact?: boolean;
}

export const GSTINAutoFillField: React.FC<GSTINAutoFillFieldProps> = ({
  gstin,
  onChangeGstin,
  onDetailsFetched,
  onFallbackExtracted,
  label,
  placeholder = 'e.g. 27AABCS1429B1Z8',
  required = false,
  language = 'en',
  currentGstStatus,
  currentTaxpayerType,
  currentConstitution,
  verifiedAt,
  disabled = false,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<GSTVerificationResult | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const cleanGstin = (gstin || '').trim().toUpperCase();
  const validation = GSTService.validate(cleanGstin);

  const handleFetch = async (targetGstin?: string | unknown) => {
    const raw = typeof targetGstin === 'string' ? targetGstin : cleanGstin;
    const toVerify = (raw || '').trim().toUpperCase();
    if (!toVerify) return;

    const valCheck = GSTService.validate(toVerify);
    if (!valCheck.valid) {
      setFeedback({
        success: false,
        configured: true,
        error: 'INVALID_FORMAT',
        message: valCheck.error || 'Invalid 15-character GSTIN format.',
      });
      return;
    }

    // "gst dalte hi company name aa jaye": Apply instant 0ms company details immediately
    const instant = GSTService.getInstantGSTDetails(toVerify);
    if (instant) {
      onDetailsFetched(instant);
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await GSTService.fetchDetails(toVerify);
      setFeedback(result);

      if (result.success && result.data) {
        onDetailsFetched(result.data);
      } else if (!result.configured && result.extracted && onFallbackExtracted) {
        onFallbackExtracted(result.extracted);
      }
    } catch {
      setFeedback({
        success: false,
        configured: true,
        error: 'EXCEPTION',
        message: 'Unexpected network error while contacting verification service.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    onChangeGstin(val);
    if (feedback) {
      setFeedback(null);
    }

    // "gst dalte hi company name aa jaye": Instantly auto-fill company name the moment 15 digits are entered
    if (val.length === 15) {
      const instant = GSTService.getInstantGSTDetails(val);
      if (instant) {
        onDetailsFetched(instant);
      }
      handleFetch(val);
    }
  };

  // Auto-fill on mount or prop update if 15 chars provided
  React.useEffect(() => {
    if (cleanGstin.length === 15 && !verifiedAt && !feedback) {
      const instant = GSTService.getInstantGSTDetails(cleanGstin);
      if (instant) {
        onDetailsFetched(instant);
      }
    }
  }, [cleanGstin]);

  const isVerifiedActive =
    (feedback?.success && !feedback.isInactive) ||
    (currentGstStatus?.toLowerCase() === 'active' && Boolean(verifiedAt));

  const isVerifiedInactive =
    (feedback?.success && feedback.isInactive) ||
    (currentGstStatus && currentGstStatus.toLowerCase() !== 'active' && Boolean(verifiedAt));

  return (
    <div className="space-y-2">
      {/* Label and State code indicator */}
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-slate-700 text-xs">
          {label || (language === 'hi' ? 'जीएसटी नंबर (GSTIN)' : 'GSTIN (15 Digits)')}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>

        {validation.valid && validation.stateName && (
          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {validation.stateCode} - {validation.stateName} (PAN: {validation.pan})
          </span>
        )}
      </div>

      {/* Input and Fetch Button */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            required={required}
            disabled={disabled || isLoading}
            value={cleanGstin}
            onChange={handleInputChange}
            maxLength={15}
            placeholder={placeholder}
            className={`w-full font-mono text-xs px-3 py-2 rounded-xl border bg-white transition-all uppercase ${
              validation.valid
                ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
                : cleanGstin.length > 0 && cleanGstin.length < 15
                ? 'border-amber-300 focus:ring-2 focus:ring-amber-500/20'
                : 'border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
            }`}
          />
          <span className="absolute right-2.5 top-2.5 text-[10px] font-mono text-slate-400">
            {cleanGstin.length}/15
          </span>
        </div>

        <button
          type="button"
          disabled={disabled || isLoading || cleanGstin.length !== 15}
          onClick={() => handleFetch(cleanGstin)}
          title="Fetch GST Registration Details from Authorized Registry"
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs ${
            cleanGstin.length === 15 && !isLoading
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>{language === 'hi' ? 'जाँच हो रही है...' : 'Fetching...'}</span>
            </>
          ) : verifiedAt ? (
            <>
              <RotateCw className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'पुनः जांचें' : 'Refresh GST'}</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'विवरण लाएं' : 'Fetch GST Details'}</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Banner */}
      {isLoading && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 text-xs text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>
            {language === 'hi'
              ? 'आधिकारिक जीएसटी पोर्टल से पंजीकरण विवरण प्राप्त किया जा रहा है...'
              : 'Contacting authorized GST verification gateway for legal entity details...'}
          </span>
        </div>
      )}

      {/* Feedback: SUCCESS ACTIVE */}
      {isVerifiedActive && (
        <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'hi' ? 'जीएसटी पंजीकरण सत्यापित' : 'GST Registration Verified'}
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 border border-emerald-300">
              Status: {currentGstStatus || feedback?.data?.gstStatus || 'Active'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
            {feedback?.data?.taxpayerType || currentTaxpayerType ? (
              <span className="px-2 py-0.5 rounded bg-white font-medium border border-emerald-200 text-emerald-900">
                Type: {feedback?.data?.taxpayerType || currentTaxpayerType}
              </span>
            ) : null}
            {feedback?.data?.constitutionOfBusiness || currentConstitution ? (
              <span className="px-2 py-0.5 rounded bg-white font-medium border border-emerald-200 text-emerald-900">
                Entity: {feedback?.data?.constitutionOfBusiness || currentConstitution}
              </span>
            ) : null}
            {feedback?.data?.registrationDate && (
              <span className="px-2 py-0.5 rounded bg-white font-medium border border-emerald-200 text-emerald-900">
                Reg Date: {feedback.data.registrationDate}
              </span>
            )}
          </div>

          <p className="text-[11px] text-emerald-800">
            {language === 'hi'
              ? 'व्यापारिक नाम, पता, पिन कोड और राज्य विवरण स्वचालित रूप से भर दिए गए हैं। आप नीचे समीक्षा और संपादन कर सकते हैं।'
              : 'Business details auto-filled. You can review and edit all fields below before saving.'}
          </p>
        </div>
      )}

      {/* Feedback: INACTIVE / CANCELLED WARNING */}
      {isVerifiedInactive && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-amber-900">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {language === 'hi' ? 'चेतावनी: जीएसटी पंजीकरण निष्क्रिय/रद्द' : 'Warning: Inactive / Cancelled GSTIN'}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">
              Status: {feedback?.data?.gstStatus || currentGstStatus}
            </span>
          </div>
          <p className="text-[11px] text-amber-800">
            {language === 'hi'
              ? 'यह जीएसटी पंजीकरण निष्क्रिय या रद्द है। कर चालान जारी करने से पूर्व कानूनी स्थिति सत्यापित करें।'
              : 'This GSTIN registration is cancelled or suspended in official records. Review carefully before issuing tax invoices to prevent ITC disallowance.'}
          </p>
        </div>
      )}

      {/* Feedback: API CREDENTIALS NOT CONFIGURED (Manual Entry Fallback) */}
      {feedback && !feedback.configured && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">
                  {language === 'hi' ? 'जीएसटी एपीआई क्रेडेंशियल्स अनुपलब्ध - मैन्युअल प्रविष्टि सक्रिय' : 'GST API Key Required for Live Lookup - Manual Fallback Active'}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {feedback.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSetupGuide(true)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer shrink-0 ml-2"
            >
              Setup Guide
            </button>
          </div>

          {feedback.extracted && (
            <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
              <span>
                Verified Format: <strong>State {feedback.extracted.stateCode} ({feedback.extracted.stateName || 'India'})</strong> | PAN: <strong>{feedback.extracted.pan}</strong>
              </span>
              <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Pre-filled Below
              </span>
            </div>
          )}
        </div>
      )}

      {/* Feedback: ERROR (Invalid format, 404 Not Found, 429 Rate Limit, Network failure) */}
      {feedback && !feedback.success && feedback.configured && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">
              {feedback.error === 'NOT_FOUND'
                ? 'GSTIN Record Not Found'
                : feedback.error === 'RATE_LIMIT_EXCEEDED'
                ? 'Rate Limit Reached'
                : 'Verification Failed'}
            </span>
            <span className="text-[11px]">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Official GST Verification Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-600">
              <p>
                To fetch live government records directly from the GST Network, configure an authorized GST provider API key in your server environment:
              </p>

              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-1">
                <p className="text-emerald-400"># Set in server environment secrets:</p>
                <p>GST_API_KEY="your_authorized_api_key"</p>
                <p>GST_PROVIDER="sandbox" # Options: sandbox | mastergst | cleartax</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="font-semibold text-slate-800">Supported GSP Providers:</p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                  <li><strong>Sandbox.co.in (Recommended)</strong>: Official GST Public Search endpoint with instant sandbox credentials.</li>
                  <li><strong>MasterGST GSP</strong>: Government approved GST Suvidha Provider API.</li>
                  <li><strong>ClearTax Enterprise</strong>: GSTIN verification API.</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong>Compliance Note:</strong> Per Indian accounting standards, do not invent or fabricate GST registration details. When live lookup credentials are not yet configured, enter the verified details manually into the form fields.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSetupGuide(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
