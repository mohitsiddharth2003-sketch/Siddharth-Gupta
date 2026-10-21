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
  Sparkles,
  Loader2,
  User,
  ChevronLeft,
  UserCheck,
  Zap,
  Globe2,
  Flame,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../types/accounting';
import { AuthSession } from '../types/auth';
import { FirebaseAuthService } from '../services/firebaseAuth';
import { AuthService } from '../services/auth';
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
  const [rememberMe, setRememberMe] = useState(true);

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
      setErrorMessage(
        language === 'hi'
          ? 'कृपया ईमेल और पासवर्ड दर्ज करें।'
          : 'Please enter both email and password.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FirebaseAuthService.signInWithEmailPassword(loginEmail, loginPassword);
      if (res.success && res.session) {
        setSuccessMessage(
          language === 'hi'
            ? 'प्रमाणीकरण सफल! डैशबोर्ड लोड हो रहा है...'
            : 'Authentication successful! Loading dashboard...'
        );
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 350);
      } else {
        const clean = loginEmail.trim().toLowerCase();
        const isDemo = [
          'ca.sharma@accountspro.in',
          'priya.patel@patelenterprises.com',
          'tax.audit@delhicapital.org',
          'vikram.m@zenithlogistics.in',
          'audit.verma@deloitte-associates.in',
          'accounts@ganeshenterprises.in',
        ].includes(clean);

        if (isDemo) {
          const quick = await AuthService.quickDemoLogin(clean);
          if (quick.success && quick.session) {
            setSuccessMessage(
              language === 'hi'
                ? `प्रमाणीकरण सफल: ${quick.session.name} (${quick.session.role})`
                : `Signed in as ${quick.session.name} (${quick.session.role})`
            );
            setTimeout(() => {
              onLoginSuccess(quick.session);
            }, 300);
            return;
          }
        }

        setErrorMessage(
          res.error ||
            (language === 'hi'
              ? 'अमान्य क्रेडेंशियल्स।'
              : 'Invalid email or password. Passwords are case-sensitive.')
        );
        setErrorCode(res.errorCode || null);
      }
    } catch (err: unknown) {
      const clean = loginEmail.trim().toLowerCase();
      const quick = await AuthService.quickDemoLogin(clean);
      if (quick.success && quick.session) {
        onLoginSuccess(quick.session);
        return;
      }
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
      setErrorMessage(
        language === 'hi' ? 'सभी आवश्यक फ़ील्ड भरें।' : 'Please fill in all required fields.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setErrorMessage(
        language === 'hi'
          ? 'कृपया एक मान्य व्यावसायिक ईमेल दर्ज करें।'
          : 'Please enter a valid business email address.'
      );
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage(
        language === 'hi'
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage(
        language === 'hi'
          ? 'पासवर्ड मेल नहीं खाते।'
          : 'Passwords do not match. Please re-enter identical passwords.'
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

  // 3. Quick Demo Login (Zoho Accounts One-Click Switcher)
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
        const quick = await AuthService.quickDemoLogin(demoEmail);
        if (quick.success && quick.session) {
          setSuccessMessage(`Signed in as ${quick.session.name} (${quick.session.role})`);
          setTimeout(() => {
            onLoginSuccess(quick.session);
          }, 250);
          return;
        }
        setErrorMessage(res.error || 'Demo login failed');
      }
    } catch {
      const quick = await AuthService.quickDemoLogin(demoEmail);
      if (quick.success && quick.session) {
        onLoginSuccess(quick.session);
        return;
      }
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
      setErrorMessage(
        language === 'hi' ? 'कृपया पंजीकृत ईमेल दर्ज करें।' : 'Please enter your registered email address.'
      );
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
    <div className="min-h-screen bg-[#F4F5F8] text-slate-800 flex flex-col justify-between selection:bg-[#1366D9] selection:text-white relative font-sans">
      {/* Zoho Iconic 4-Color Top Border Accent */}
      <div className="w-full h-1 flex">
        <div className="w-1/4 h-full bg-[#EA4335]" />
        <div className="w-1/4 h-full bg-[#34A853]" />
        <div className="w-1/4 h-full bg-[#1366D9]" />
        <div className="w-1/4 h-full bg-[#FBBC05]" />
      </div>

      {/* Top Header: Zoho Accounts Brand & Language Switcher */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        {/* Zoho Accounts Brand Logo */}
        <div className="flex items-center space-x-3 select-none">
          <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-slate-900 shadow-xs">
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-[2px] bg-[#EA4335]" />
              <div className="w-3 h-3 rounded-[2px] bg-[#34A853]" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-[2px] bg-[#1366D9]" />
              <div className="w-3 h-3 rounded-[2px] bg-[#FBBC05]" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-slate-900 text-lg tracking-tight">
                Zoho <span className="text-[#1366D9] font-extrabold">Accounts</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-600">AccountsPro</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
              One account to access Zoho Books, GST, E-Invoice & Indian Accounting
            </span>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center space-x-2.5">
          {/* Cloud Auth Status Trigger */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Firebase Cloud</span>
          </button>

          {/* Bilingual Switcher (Zoho Clean Style) */}
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs text-xs">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 font-bold rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[#1366D9] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 font-bold rounded-md transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-[#1366D9] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Zoho Accounts Sign-In Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.07)] p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Zoho Accounts Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setActiveTab('login');
              }}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer mr-6 ${
                activeTab === 'login'
                  ? 'text-[#1366D9]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{language === 'hi' ? 'साइन इन' : 'Sign In'}</span>
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1366D9] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setActiveTab('register');
              }}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer mr-6 ${
                activeTab === 'register'
                  ? 'text-[#1366D9]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{language === 'hi' ? 'खाता बनाएं' : 'Sign Up'}</span>
              {activeTab === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1366D9] rounded-full" />
              )}
            </button>

            {activeTab === 'forgot' && (
              <button
                type="button"
                className="pb-3 text-sm font-bold text-[#1366D9] relative"
              >
                <span>{language === 'hi' ? 'पासवर्ड रीसेट' : 'Reset Password'}</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1366D9] rounded-full" />
              </button>
            )}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'login' && (language === 'hi' ? 'साइन इन करें' : 'Sign In')}
              {activeTab === 'register' && (language === 'hi' ? 'नया व्यवसाय खाता बनाएं' : 'Create Zoho Account')}
              {activeTab === 'forgot' && (language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'login' &&
                (language === 'hi'
                  ? 'AccountsPro / Zoho Books में प्रवेश करने के लिए ईमेल या क्रेडेंशियल दर्ज करें।'
                  : 'to access AccountsPro & Zoho Books India')}
              {activeTab === 'register' &&
                (language === 'hi'
                  ? 'जीएसटी, ई-चालान और बहीखाता प्रबंधन हेतु पंजीकरण करें।'
                  : 'Register your organization with business email & secure password')}
              {activeTab === 'forgot' &&
                (language === 'hi'
                  ? 'पंजीकृत ईमेल दर्ज करके नया पासवर्ड प्राप्त करें।'
                  : 'Enter your registered email to receive verification code')}
            </p>
          </div>

          {/* Messages & Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <span className="font-semibold block">{errorMessage}</span>
                  {errorCode && (
                    <span className="text-[10px] text-rose-500 font-mono mt-0.5 block">
                      Code: {errorCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: SIGN IN (ZOHO ACCOUNTS STYLE)                     */}
          {/* ======================================================== */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Zoho One 1-Click Instant Demo Access Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-[#1366D9]" />
                    <span>{language === 'hi' ? '1-क्लिक डेमो साइन-इन' : 'Zoho 1-Click Demo Access'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                    Instant Login
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* CA Rajesh Sharma (Admin) */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('ca.sharma@accountspro.in', 'AccountsPro@2026')}
                    className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-linear-to-tr from-violet-600 to-indigo-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        RS
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-[#1366D9] truncate">
                          CA Rajesh Sharma
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold truncate">
                          Admin / Owner
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Priya Patel (Senior Accountant) */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('priya.patel@patelenterprises.com', 'AccountsPro@2026')}
                    className="p-2 text-left rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-linear-to-tr from-emerald-600 to-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        PP
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                          Priya Patel
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold truncate">
                          Sr. Accountant
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {language === 'hi' ? 'या ईमेल से प्रवेश करें' : 'or enter business email'}
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Email Input Field (Zoho Style) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
                  <span className="text-[#EA4335] ml-0.5">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="e.g. ca.sharma@accountspro.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#1366D9] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Password Input Field (Zoho Style) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                    <span className="text-[#EA4335] ml-0.5">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setResetEmail(loginEmail);
                      setActiveTab('forgot');
                    }}
                    className="text-xs font-semibold text-[#1366D9] hover:underline cursor-pointer"
                  >
                    {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#1366D9] focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-[#1366D9] focus:ring-blue-200 cursor-pointer"
                  />
                  <span>{language === 'hi' ? 'लॉगिन याद रखें' : 'Stay signed in on this device'}</span>
                </label>
              </div>

              {/* Zoho Primary Blue Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-[#1366D9] hover:bg-[#0F54B3] active:bg-[#0C4491] shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'hi' ? 'सत्यापित हो रहा है...' : 'Signing in to Zoho...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'hi' ? 'साइन इन करें' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Sign Up Link */}
              <div className="text-center pt-3 text-xs text-slate-600">
                <span>{language === 'hi' ? 'नया खाता चाहिए?' : "Don't have a Zoho account? "}</span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setActiveTab('register');
                  }}
                  className="font-bold text-[#1366D9] hover:underline cursor-pointer ml-1"
                >
                  {language === 'hi' ? 'खाता बनाएं' : 'Sign Up Now'}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SIGN UP (CREATE ZOHO ACCOUNT)                     */}
          {/* ======================================================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  <span className="text-[#EA4335] ml-0.5">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Kumar Patel"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#1366D9] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Company / Firm Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'कंपनी / संगठन का नाम' : 'Organization / Firm Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    placeholder="e.g. Patel Steel & Engineering LLP"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#1366D9] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'व्यावसायिक ईमेल' : 'Business Email'}
                  <span className="text-[#EA4335] ml-0.5">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="ramesh@patelsteel.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#1366D9] focus:ring-2 focus:ring-blue-100 font-mono"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'पासवर्ड (कम से कम 6)' : 'Password (Min 6)'}
                    <span className="text-[#EA4335] ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-[#1366D9] pr-8 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'पासवर्ड पुष्टि करें' : 'Confirm Password'}
                    <span className="text-[#EA4335] ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-[#1366D9] pr-8 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <PasswordStrengthIndicator
                password={regPassword}
                confirmPassword={regConfirmPassword}
                language={language}
              />

              {/* Sign Up Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-[#1366D9] hover:bg-[#0F54B3] active:bg-[#0C4491] shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating Zoho Account...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'hi' ? 'खाता बनाएं' : 'Sign Up Free'}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-xs text-slate-600">
                <span>{language === 'hi' ? 'पहले से खाता है?' : 'Already have a Zoho account? '}</span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setActiveTab('login');
                  }}
                  className="font-bold text-[#1366D9] hover:underline cursor-pointer ml-1"
                >
                  {language === 'hi' ? 'साइन इन करें' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PASSWORD RESET (ZOHO STYLE)                       */}
          {/* ======================================================== */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {!resetCodeSent ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'hi' ? 'पंजीकृत ईमेल' : 'Registered Email Address'}
                      <span className="text-[#EA4335] ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="e.g. ca.sharma@accountspro.in"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#1366D9] focus:ring-2 focus:ring-blue-100 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-[#1366D9] hover:bg-[#0F54B3] shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>{language === 'hi' ? 'सत्यापन कोड भेजें' : 'Send Verification Code'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'hi' ? 'सत्यापन कोड' : 'Verification Code'}
                    </label>
                    <input
                      type="text"
                      value={resetCodeInput}
                      onChange={(e) => setResetCodeInput(e.target.value)}
                      placeholder="6-digit reset code"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:outline-hidden focus:border-[#1366D9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'hi' ? 'नया पासवर्ड' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:outline-hidden focus:border-[#1366D9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'hi' ? 'नए पासवर्ड की पुष्टि' : 'Confirm New Password'}
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:outline-hidden focus:border-[#1366D9]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-[#1366D9] hover:bg-[#0F54B3] shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{language === 'hi' ? 'पासवर्ड सहेजें और लॉगिन करें' : 'Reset Password & Sign In'}</span>
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
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'साइन इन पर वापस जाएं' : 'Back to Sign In'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Zoho Security Trust Badge in Card Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by Zoho Accounts Identity Protocol · SSL 256-bit</span>
          </div>
        </div>
      </main>

      {/* Zoho Accounts Page Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-6 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Zoho Corporation Pvt. Ltd. / AccountsPro India. All rights reserved.</p>
        <div className="flex items-center space-x-4 text-slate-600">
          <span className="hover:text-slate-900 cursor-pointer">Privacy Policy</span>
          <span>·</span>
          <span className="hover:text-slate-900 cursor-pointer">Terms of Service</span>
          <span>·</span>
          <span className="hover:text-slate-900 cursor-pointer">Security</span>
        </div>
      </footer>

      {/* Firebase Setup Modal */}
      <FirebaseSetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        language={language}
      />
    </div>
  );
};
