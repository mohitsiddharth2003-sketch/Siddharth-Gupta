import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { Language } from '../types/accounting';

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: 'empty' | 'weak' | 'fair' | 'good' | 'strong';
  labelEn: string;
  labelHi: string;
  colorClass: string;
  barColorClass: string;
  textColorClass: string;
  criteria: {
    minSixChars: boolean;
    eightPlusChars: boolean;
    hasLower: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  suggestionEn: string;
  suggestionHi: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const minSixChars = password.length >= 6;
  const eightPlusChars = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!password || password.length === 0) {
    return {
      score: 0,
      level: 'empty',
      labelEn: 'Enter password',
      labelHi: 'पासवर्ड दर्ज करें',
      colorClass: 'text-slate-500 bg-slate-500/10 border-slate-700/50',
      barColorClass: 'bg-slate-700',
      textColorClass: 'text-slate-400',
      criteria: {
        minSixChars: false,
        eightPlusChars: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        hasSpecial: false,
      },
      suggestionEn: 'Use 8+ characters with mixed uppercase, numbers, and symbols.',
      suggestionHi: '8+ अक्षर, बड़े अक्षर, अंक और प्रतीकों का प्रयोग करें।',
    };
  }

  // Calculate points based on complexity
  let points = 0;
  if (minSixChars) points += 1;
  if (eightPlusChars) points += 1;
  if (hasLower && hasUpper) points += 1;
  if (hasNumber) points += 1;
  if (hasSpecial) points += 1;

  // Compute final score 1 to 4
  let score = 1;
  let level: PasswordStrengthResult['level'] = 'weak';
  let labelEn = 'Weak';
  let labelHi = 'कमजोर';
  let colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  let barColorClass = 'bg-rose-500';
  let textColorClass = 'text-rose-400';
  let suggestionEn = 'Add numbers or special characters to strengthen.';
  let suggestionHi = 'मजबूत बनाने के लिए अंक या विशेष वर्ण जोड़ें।';

  if (!minSixChars || points <= 1) {
    score = 1;
    level = 'weak';
    labelEn = 'Too Weak';
    labelHi = 'अति कमजोर';
    colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    barColorClass = 'bg-rose-500';
    textColorClass = 'text-rose-400';
    suggestionEn = 'Needs at least 6 characters (8+ recommended).';
    suggestionHi: 'कम से कम 6 अक्षरों की आवश्यकता है (8+ अनुशंसित)।';
  } else if (points === 2) {
    score = 2;
    level = 'fair';
    labelEn = 'Fair';
    labelHi = 'सामान्य';
    colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    barColorClass = 'bg-amber-500';
    textColorClass = 'text-amber-400';
    suggestionEn = 'Mix uppercase letters and special symbols.';
    suggestionHi = 'बड़े अक्षर और विशेष प्रतीक शामिल करें।';
  } else if (points === 3 || points === 4) {
    score = 3;
    level = 'good';
    labelEn = 'Good';
    labelHi = 'अच्छा';
    colorClass = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    barColorClass = 'bg-sky-500';
    textColorClass = 'text-sky-400';
    suggestionEn = 'Almost there! Add a symbol or more characters for top security.';
    suggestionHi = 'लगभग तैयार! उच्चतम सुरक्षा के लिए एक प्रतीक या अधिक अक्षर जोड़ें।';
  } else {
    // points >= 5
    score = 4;
    level = 'strong';
    labelEn = 'Strong & Secure';
    labelHi = 'मजबूत व सुरक्षित';
    colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    barColorClass = 'bg-emerald-500';
    textColorClass = 'text-emerald-400';
    suggestionEn = 'Great password! Well-protected against brute-force attacks.';
    suggestionHi = 'शानदार पासवर्ड! अनधिकृत पहुंच से भली-भांति सुरक्षित।';
  }

  return {
    score,
    level,
    labelEn,
    labelHi,
    colorClass,
    barColorClass,
    textColorClass,
    criteria: {
      minSixChars,
      eightPlusChars,
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial,
    },
    suggestionEn,
    suggestionHi,
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  language?: Language;
  compact?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword,
  language = 'en',
  compact = false,
}) => {
  const evaluation = evaluatePasswordStrength(password);
  const isHi = language === 'hi';

  const hasConfirm = typeof confirmPassword === 'string' && confirmPassword.length > 0;
  const isMatch = hasConfirm && confirmPassword === password;
  const isMismatch = hasConfirm && !isMatch;

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-inner space-y-2.5 transition-all text-xs">
      {/* Top Header: Title, Strength Badge & Segmented Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            {evaluation.score >= 3 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : evaluation.score > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="text-[11px] text-slate-300">
              {isHi ? 'पासवर्ड सुरक्षा स्तर' : 'Password Security Strength'}
            </span>
          </div>

          {/* Strength Pill */}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${evaluation.colorClass}`}
          >
            {isHi ? evaluation.labelHi : evaluation.labelEn}
          </span>
        </div>

        {/* 4 Segmented Progress Meter */}
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = evaluation.score >= step;
            let stepColor = 'bg-slate-700/60';
            if (isFilled) {
              if (evaluation.score === 1) stepColor = 'bg-rose-500';
              else if (evaluation.score === 2) stepColor = 'bg-amber-500';
              else if (evaluation.score === 3) stepColor = 'bg-sky-500';
              else stepColor = 'bg-emerald-500';
            }

            return (
              <div
                key={step}
                className={`h-full rounded-full transition-all duration-300 ${stepColor}`}
              />
            );
          })}
        </div>
      </div>

      {/* Real-time Checklist Criteria */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-slate-800 text-[11px]">
          {/* Criteria 1: 6+ chars */}
          <div className="flex items-center space-x-1.5">
            {evaluation.criteria.minSixChars ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-slate-500" />
              </div>
            )}
            <span className={evaluation.criteria.minSixChars ? 'text-emerald-300' : 'text-slate-400'}>
              {isHi ? 'कम से कम 6 अक्षर' : 'At least 6 characters'}
            </span>
          </div>

          {/* Criteria 2: 8+ chars (Recommended) */}
          <div className="flex items-center space-x-1.5">
            {evaluation.criteria.eightPlusChars ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-slate-500" />
              </div>
            )}
            <span className={evaluation.criteria.eightPlusChars ? 'text-emerald-300' : 'text-slate-400'}>
              {isHi ? '8+ अक्षर (अनुशंसित)' : '8+ characters (recommended)'}
            </span>
          </div>

          {/* Criteria 3: Mixed Case */}
          <div className="flex items-center space-x-1.5">
            {evaluation.criteria.hasLower && evaluation.criteria.hasUpper ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-slate-500" />
              </div>
            )}
            <span
              className={
                evaluation.criteria.hasLower && evaluation.criteria.hasUpper
                  ? 'text-emerald-300'
                  : 'text-slate-400'
              }
            >
              {isHi ? 'बड़े व छोटे अक्षर (A-Z, a-z)' : 'Uppercase & lowercase (A-Z, a-z)'}
            </span>
          </div>

          {/* Criteria 4: Numbers & Symbols */}
          <div className="flex items-center space-x-1.5">
            {evaluation.criteria.hasNumber && evaluation.criteria.hasSpecial ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-slate-500" />
              </div>
            )}
            <span
              className={
                evaluation.criteria.hasNumber && evaluation.criteria.hasSpecial
                  ? 'text-emerald-300'
                  : 'text-slate-400'
              }
            >
              {isHi ? 'अंक (0-9) व प्रतीक (@#$)' : 'Number (0-9) & symbol (@#$)'}
            </span>
          </div>
        </div>
      )}

      {/* Confirmation match feedback if user started typing confirmation password */}
      {hasConfirm && (
        <div
          className={`pt-1.5 flex items-center justify-between border-t border-slate-800 text-[11px] ${
            isMatch ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            {isMatch ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="font-medium">
              {isMatch
                ? isHi
                  ? 'पासवर्ड मेल खा रहे हैं'
                  : 'Passwords match perfectly'
                : isHi
                ? 'पासवर्ड अभी मेल नहीं खाते'
                : 'Passwords do not match yet'}
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              isMatch
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isMatch ? (isHi ? 'सत्यापित' : 'Matched') : isHi ? 'असमरूप' : 'Mismatch'}
          </span>
        </div>
      )}

      {/* Helpful Smart Suggestion */}
      {evaluation.score < 4 && password.length > 0 && (
        <p className="text-[10px] text-slate-400 italic pt-0.5">
          💡 {isHi ? evaluation.suggestionHi : evaluation.suggestionEn}
        </p>
      )}
    </div>
  );
};
