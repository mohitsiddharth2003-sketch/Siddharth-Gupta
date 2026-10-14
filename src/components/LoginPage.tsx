import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Flame,
  Globe2,
  FileCheck2,
  Sparkles,
  Loader2,
  User,
  ChevronLeft,
  UserCheck,
} from 'lucide-react';
import { Language } from '../types/accounting';
import { AuthSession } from '../types/auth';
import { FirebaseAuthService } from '../services/firebaseAuth';
import { FirebaseSetupGuideModal } from './FirebaseSetupGuideModal';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface LoginPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
}) => {
  // Primary views: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up form state
  const [regFullName, setRegFullName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot password & reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);

  // UI status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const clearMessages = () => {
    setErrorMessage(null);
    setErrorCode(null);
    setSuccessMessage(null);
  };

  // 1. Handle Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage(language === 'hi' ? 'कृपया ईमेल और पासवर्ड दर्ज करें।' : 'Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FirebaseAuthService.signInWithEmailPassword(loginEmail, loginPassword);
      if (res.success && res.session) {
        setSuccessMessage(
          language === 'hi' ? 'प्रमाणीकरण सफल! डैशबोर्ड लोड हो रहा है...' : 'Authentication successful! Loading dashboard...'
        );
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 350);
      } else {
        setErrorMessage(
          res.error || (language === 'hi' ? 'अमान्य क्रेडेंशियल्स।' : 'Invalid email or password. Passwords are case-sensitive.')
        );
        setErrorCode(res.errorCode || null);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e.message || 'Network error occurred during authentication. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage(language === 'hi' ? 'सभी आवश्यक फ़ील्ड भरें।' : 'Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setErrorMessage(
        language === 'hi' ? 'कृपया एक मान्य व्यावसायिक ईमेल दर्ज करें।' : 'Please enter a valid business email address.'
      );
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage(
        language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage(
        language === 'hi' ? 'पासवर्ड मेल नहीं खाते।' : 'Passwords do not match. Please re-enter identical passwords.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FirebaseAuthService.signUpWithEmailPassword({
        fullName: regFullName,
        companyName: regCompanyName,
        email: regEmail,
        password: regPassword,
      });

      if (res.success && res.session) {
        setSuccessMessage(
          language === 'hi'
            ? 'खाता सफलतापूर्वक बनाया गया! डैशबोर्ड लोड हो रहा है...'
            : 'Account created successfully! Redirecting to AccountsPro Dashboard...'
        );
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 350);
      } else {
        setErrorMessage(
          res.error || (language === 'hi' ? 'साइन अप विफल हुआ।' : 'Failed to create account. Please check details.')
        );
        setErrorCode(res.errorCode || null);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e.message || 'Network error occurred during registration. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Quick Demo Login (Preserves existing testing roles)
  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    clearMessages();
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setIsSubmitting(true);

    try {
      const res = await FirebaseAuthService.signInWithEmailPassword(demoEmail, demoPass);
      if (res.success && res.session) {
        setSuccessMessage(`Signed in as ${res.session.name} (${res.session.role})`);
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 250);
      } else {
        setErrorMessage(res.error || 'Demo login failed');
      }
    } catch {
      setErrorMessage('Network error during demo login');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Request Password Reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!resetEmail.trim()) {
      setErrorMessage(language === 'hi' ? 'कृपया पंजीकृत ईमेल दर्ज करें।' : 'Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FirebaseAuthService.requestPasswordReset(resetEmail);
      if (res.success) {
        setResetCodeSent(true);
        if (res.resetCode) {
          setResetCodeInput(res.resetCode);
        }
        setSuccessMessage(
          res.message ||
            (language === 'hi'
              ? 'पासवर्ड रीसेट लिंक/कोड भेजा गया है।'
              : 'Password reset request dispatched. You can now set your new password below.')
        );
      } else {
        setErrorMessage(res.error || 'Email address not found in registered accounts.');
      }
    } catch {
      setErrorMessage('Failed to send password reset request. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Confirm Password Reset
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FirebaseAuthService.confirmPasswordReset(resetEmail, resetCodeInput, newPassword);
      if (res.success) {
        setSuccessMessage('Password reset successful! You can now log in with your new password.');
        setActiveTab('login');
        setLoginEmail(resetEmail);
        setLoginPassword('');
        setResetCodeSent(false);
      } else {
        setErrorMessage(res.error || 'Password reset failed. Invalid or expired token.');
      }
    } catch {
      setErrorMessage('Network error while resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Brand, Badge & Language Switch */}
      <header className="relative z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-500 via-teal-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-xl">
            ₹
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-lg tracking-tight">
                AccountsPro India
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                Secure Auth
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {language === 'hi'
                ? 'भारतीय व्यवसायों हेतु संपूर्ण लेखा, जीएसटी व टीडीएस सॉफ्टवेयर'
                : 'Enterprise Accounting, GST, TDS & Bank Reconciliation Software'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Cloud Auth Status Guide Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Firebase Status</span>
            <span className="md:hidden">Cloud</span>
          </button>

          {/* Bilingual Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'hi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md sm:max-w-lg bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          
          {/* Top Visible Sign In / Create Account Navigation Tabs */}
          <div className="flex items-center p-1 bg-slate-800/90 rounded-2xl mb-6 border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setActiveTab('login');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'login'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setActiveTab('register');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'खाता बनाएं' : 'Create Account'}</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {activeTab === 'login' && (language === 'hi' ? 'लेखांकन पोर्टल में प्रवेश' : 'Welcome to AccountsPro')}
              {activeTab === 'register' && (language === 'hi' ? 'नया व्यवसाय खाता बनाएं' : 'Create Your Accounting Account')}
              {activeTab === 'forgot' && (language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Account Password')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'login' &&
                (language === 'hi'
                  ? 'सुरक्षित ईमेल और पासवर्ड से लॉगिन करें'
                  : 'Sign in with your secure email and password to access financial records')}
              {activeTab === 'register' &&
                (language === 'hi'
                  ? 'जीएसटी और बहीखाता प्रबंधन शुरू करने के लिए पंजीकरण करें'
                  : 'Register with Name, Email and Password for instant dashboard access')}
              {activeTab === 'forgot' &&
                (language === 'hi'
                  ? 'अपने पंजीकृत ईमेल के माध्यम से नया पासवर्ड सेट करें'
                  : 'Enter your registered email to set a new secure password')}
            </p>
          </div>

          {/* Error & Success Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-semibold block">{errorMessage}</span>
                {errorCode && <span className="text-[10px] text-rose-400/80 font-mono mt-0.5 block">Error code: {errorCode}</span>}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 1: LOGIN PAGE (EMAIL + PASSWORD)       */}
          {/* ========================================== */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {language === 'hi' ? 'व्यावसायिक ईमेल' : 'Business Email'}
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. ca.sharma@accountspro.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                    <span className="text-rose-400 ml-1">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setResetEmail(loginEmail);
                      setActiveTab('forgot');
                    }}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'hi' ? 'सत्यापित हो रहा है...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'hi' ? 'डैशबोर्ड में प्रवेश करें' : 'Sign In to Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Visible "Create Account" option */}
              <div className="text-center pt-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 mr-1.5">
                  {language === 'hi' ? 'नया खाता चाहिए?' : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setActiveTab('register');
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  {language === 'hi' ? 'नया खाता बनाएं / Create Account →' : 'Create Account / Sign Up →'}
                </button>
              </div>
            </form>
          )}

          {/* ========================================== */}
          {/* TAB 2: SIGN UP PAGE (NAME, EMAIL, PASS)    */}
          {/* ========================================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Kumar Patel"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 2. Company / Firm Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {language === 'hi' ? 'कंपनी / फर्म का नाम (वैकल्पिक)' : 'Company / Firm Name (Optional)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    placeholder="e.g. Patel Steel & Engineering LLP"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 3. Business Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {language === 'hi' ? 'व्यावसायिक ईमेल' : 'Business Email'}
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="ramesh@patelsteel.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 4 & 5. Password and Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'hi' ? 'पासवर्ड (न्यूनतम 6)' : 'Password (Min 6)'}
                    <span className="text-rose-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'hi' ? 'पासवर्ड पुष्टि करें' : 'Confirm Password'}
                    <span className="text-rose-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-Time Password Strength & Security Guide */}
              <PasswordStrengthIndicator
                password={regPassword}
                confirmPassword={regConfirmPassword}
                language={language}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'hi' ? 'खाता बनाएं व डैशबोर्ड खोलें' : 'Create Account & Open Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400 mr-1.5">
                  {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setActiveTab('login');
                  }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  {language === 'hi' ? 'साइन इन करें →' : 'Sign In →'}
                </button>
              </div>
            </form>
          )}

          {/* ========================================== */}
          {/* TAB 3: PASSWORD RESET                      */}
          {/* ========================================== */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {!resetCodeSent ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {language === 'hi' ? 'पंजीकृत ईमेल दर्ज करें' : 'Registered Business Email'}
                      <span className="text-rose-400 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="e.g. ca.sharma@accountspro.in"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>{language === 'hi' ? 'पासवर्ड रीसेट लिंक/कोड प्राप्त करें' : 'Request Password Reset'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {language === 'hi' ? 'सुरक्षा सत्यापन कोड' : 'Reset Verification Code (if applicable)'}
                    </label>
                    <input
                      type="text"
                      value={resetCodeInput}
                      onChange={(e) => setResetCodeInput(e.target.value)}
                      placeholder="e.g. 6-digit code"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {language === 'hi' ? 'नया पासवर्ड' : 'New Password (Min 6 chars)'}
                      <span className="text-rose-400 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {language === 'hi' ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'}
                      <span className="text-rose-400 ml-1">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{language === 'hi' ? 'नया पासवर्ड सहेजें' : 'Save New Password & Sign In'}</span>
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setActiveTab('login');
                  }}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'लॉगिन पर वापस जाएं' : 'Back to Sign In'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* DEMO PROFILES SECTION                      */}
          {/* ========================================== */}
          <div className="mt-8 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                {language === 'hi' ? 'डेमो प्रोफाइल (त्वरित भूमिका परीक्षण)' : 'Demo Profiles (Instant Role Testing)'}
              </span>
              <span className="text-[10px] text-slate-500">AccountsPro@2026</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ca.sharma@accountspro.in', 'AccountsPro@2026')}
                className="p-2 text-left bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200 truncate">
                  CA Rajesh Sharma
                </div>
                <div className="text-[10px] text-slate-400">Admin / Owner</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('priya.patel@patelenterprises.com', 'AccountsPro@2026')}
                className="p-2 text-left bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-teal-300 group-hover:text-teal-200 truncate">
                  Priya Patel
                </div>
                <div className="text-[10px] text-slate-400">Senior Accountant</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('tax.audit@delhicapital.org', 'Auditor@2026')}
                className="p-2 text-left bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200 truncate">
                  Amit Verma
                </div>
                <div className="text-[10px] text-slate-400">Tax Auditor</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('vikram.m@zenithlogistics.in', 'AccountsPro@2026')}
                className="p-2 text-left bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-sky-300 group-hover:text-sky-200 truncate">
                  Vikram Malhotra
                </div>
                <div className="text-[10px] text-slate-400">Accountant</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-3 px-4 text-center text-xs text-slate-500">
        <p>
          AccountsPro India • Built for Indian Accounting Standards, GSTIN Verification & Section 194 TDS Compliance
        </p>
      </footer>

      {/* Firebase Setup & Cloud Architecture Guide Modal */}
      <FirebaseSetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        language={language}
      />
    </div>
  );
};
