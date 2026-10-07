import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  BadgeCheck,
  UsersRound,
  BriefcaseBusiness,
  Globe,
  QrCode,
  ChevronDown,
  Quote,
  Wheat,
  Users,
  TreePine,
  Check,
  WifiOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';
import TextType from '../../components/TextType/TextType';

// =========================================================================
// 1. TOP GOVERNMENT BAR (Height 28-30px, Background #005B46, Centered ~1200px)
// =========================================================================
export const GovernmentBar: React.FC<{ onVerifyClick: () => void }> = ({ onVerifyClick }) => (
  <div className="bg-[#504CB8] text-white text-[11px] sm:text-[12px] min-h-[30px] select-none z-30 flex items-center w-full border-b border-[#403C95] py-1 sm:py-0">
    <div className="w-full max-w-[1220px] px-3 sm:px-4 mx-auto flex items-center justify-between gap-x-2 gap-y-1 flex-wrap">
      {/* Left: Ashoka Emblem + Government of India & Ministry */}
      <div className="flex items-center gap-1.5 sm:gap-2 font-medium tracking-wide flex-wrap">
        <svg
          className="w-3.5 h-3.5 text-amber-200 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C10.9 2 10 2.9 10 4v1.1C8.2 5.6 7 7.2 7 9.1v3.9c0 .6.4 1 1 1h1v4H8c-.6 0-1 .4-1 1s.4 1 1 1h8c.6 0 1-.4 1-1s-.4-1-1-1h-1v-4h1c.6 0 1-.4 1-1V9.1c0-1.9-1.2-3.5-3-4V4c0-1.1-.9-2-2-2zm-2 5c.6 0 1 .4 1 1v4H9V9c0-1.1.9-2 1-2zm4 0c.1 0 1 .9 1 2v3h-2V8c0-.6.4-1 1-1zm-2 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
        </svg>
        <span className="font-devanagari font-semibold text-[10.5px] sm:text-[12px] whitespace-nowrap">भारत सरकार</span>
        <span className="opacity-40">|</span>
        <span className="text-[10.5px] sm:text-[12px] whitespace-nowrap">Government of India</span>
        <span className="opacity-40 hidden md:inline">|</span>
        <span className="font-devanagari font-semibold text-amber-200 hidden md:inline whitespace-nowrap">
          सहकारिता मंत्रालय
        </span>
        <span className="opacity-40 hidden md:inline">|</span>
        <span className="hidden md:inline whitespace-nowrap">Ministry of Cooperation</span>
      </div>

      {/* Right: NCCT & Verify Certificate */}
      <div className="flex items-center gap-2 sm:gap-3 text-[10.5px] sm:text-[12px] flex-shrink-0">
        <span className="hidden lg:inline font-devanagari text-emerald-100 font-medium">
          राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)
        </span>
        <span className="opacity-40 hidden lg:inline">|</span>
        <button
          onClick={onVerifyClick}
          className="text-amber-300 hover:text-white font-semibold flex items-center gap-1 transition-colors group cursor-pointer text-[10.5px] sm:text-[12px]"
        >
          <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:scale-110 transition-transform text-amber-300 flex-shrink-0" />
          <span className="underline underline-offset-2 whitespace-nowrap">Verify Certificate</span>
        </button>
      </div>
    </div>
  </div>
);

// =========================================================================
// 2. BRAND HEADER (Height 64-68px, Background #FFFFFF, Centered ~1200px)
// =========================================================================
export const BrandHeader: React.FC<{
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onHomeClick: () => void;
}> = ({ currentLanguage, onLanguageChange, onHomeClick }) => {
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'hi', label: 'हिन्दी' },
    { code: 'en', label: 'English' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <header className="bg-white border-b border-[#E5EAE7] min-h-[58px] sm:h-[66px] flex items-center w-full select-none z-20 py-2 sm:py-0">
      <div className="w-full max-w-[1220px] px-3 sm:px-4 mx-auto flex items-center justify-between gap-2">
        {/* Left: Green rounded-square logo icon + VikasSetu branding */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
        >
          <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-[44px] sm:h-[44px] rounded-xl bg-[#504CB8] flex items-center justify-center text-white shadow-xs group-hover:bg-[#403C95] transition-colors flex-shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 sm:gap-2 leading-none flex-wrap">
              <span className="text-[15px] xs:text-[17px] sm:text-[20px] font-black text-[#005B46] font-sans tracking-wide whitespace-nowrap">
                VikasSetu
              </span>
            </div>
            <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] text-[#536A65] font-medium tracking-tight mt-0.5 sm:mt-1 leading-none truncate max-w-[180px] xs:max-w-[260px] sm:max-w-none">
              NCCT Federated Training-ERP & LMS Platform
            </p>
          </div>
        </div>

        {/* Right: Rounded language selector (Hindi / English dropdown) */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-full border border-[#DCE4DE] bg-white hover:bg-gray-50 text-[11px] sm:text-xs font-semibold text-[#1E2523] flex items-center gap-1.5 sm:gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#005B46] flex-shrink-0" />
            <span>{languages.find(l => l.code === currentLanguage)?.label}</span>
            <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-1 w-32 sm:w-36 bg-white border border-[#DCE4DE] rounded-xl shadow-lg py-1 z-50 animate-fadeIn">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    onLanguageChange(l.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${currentLanguage === l.code
                    ? 'bg-emerald-50 text-[#005B46]'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span>{l.label}</span>
                  {currentLanguage === l.code && <Check className="w-3.5 h-3.5 text-[#005B46]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// =========================================================================
// 3. RIGHT LOGIN CARD (Width 440-470px, Height ~570-600px, Padding 30-34px)
// =========================================================================
interface LoginCardProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isSubmitting: boolean;
  errorMessage: string;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onSignup: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  showPassword,
  setShowPassword,
  isSubmitting,
  errorMessage,
  onSubmit,
  onForgotPassword,
  onSignup,
}) => (
  <div className="w-full max-w-[500px] md:max-w-[420px] mx-auto md:ml-auto md:mr-0 bg-white rounded-[20px] sm:rounded-[22px] border border-[#E0E6E2] p-5 sm:p-7 shadow-[0_14px_35px_rgba(7,61,50,0.08)] select-none">
    {/* Card Header: Welcome Back + Subtitle + Badge */}
    <div className="flex items-start justify-between gap-2">
      <div>
        <h2 className="text-[24px] xs:text-[26px] sm:text-[28px] font-[800] text-[#073D32] tracking-tight leading-tight">
          Welcome Back
        </h2>
        <p className="text-[12.5px] sm:text-[13px] text-[#536A65] mt-0.5 font-normal">
          Sign in to your VikasSetu account
        </p>
      </div>

      {/* Top-Right Small Green Pill with India motif */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F4EA] border border-[#C2E7CD] text-[#0B6E4F] flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-[#005B46]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <span className="text-[10px] font-bold font-devanagari whitespace-nowrap">
          सहकार से समृद्धि
        </span>
      </div>
    </div>

    {/* Horizontal Divider */}
    <div className="h-[1px] bg-[#E9EEEB] my-3" />

    {/* 7 Core Demo Role Switcher (from PDF Specification) */}
    <div className="mb-3.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#536A65] mb-1.5">
        <span>7 Portal Roles (1-Click Fill)</span>
        <span className="text-emerald-700 font-semibold font-mono">PDF Spec</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Trainee', code: 'NCCT-TRN-2026-MH-44091', email: 'rameshwar.pacs@gmail.com', pass: 'Demo@1234' },
          { label: 'Faculty', code: 'NCCT-FAC-2026-MH-101', email: 'faculty@ncct.gov.in', pass: 'Faculty@1234' },
          { label: 'Inst Admin', code: 'NCCT-ADM-2026-MH-001', email: 'admin.vamnicom@ncct.gov.in', pass: 'Admin@1234' },
          { label: 'Super Admin', code: 'NCCT-HQ-2026-DL-001', email: 'superadmin@ncct.gov.in', pass: 'Super@1234' },
          { label: 'Employer', code: 'NCCT-EMP-2026-KA-501', email: 'employer@ncct.gov.in', pass: 'Employer@1234' },
          { label: 'Device Op', code: 'NCCT-DEV-2026-MH-001', email: 'device.demo@example.com', pass: 'Demo@1234' },
          { label: 'Hostel Admin', code: 'NCCT-HST-2026-MH-001', email: 'hostel.warden@ncct.gov.in', pass: 'Hostel@1234' },
        ].map(r => (
          <button
            key={r.label}
            type="button"
            onClick={() => {
              setEmail(r.email);
              setPassword(r.pass);
            }}
            className="py-1 px-1.5 rounded-lg border border-[#DCE4DE] bg-[#F7F9F7] hover:bg-[#E6F4EA] hover:border-[#005B46] text-left transition-all text-[10px] font-bold text-gray-800 cursor-pointer group"
            title={`${r.label}: ${r.code} (${r.email})`}
          >
            <div className="truncate group-hover:text-[#005B46]">{r.label}</div>
            <div className="text-[8.5px] text-gray-400 font-mono truncate">{r.code.split('-')[1]}</div>
          </button>
        ))}
      </div>
    </div>

    {/* Rural Offline Alert */}
    {!navigator.onLine && (
      <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
        <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>Rural Offline Mode: You can log in using saved credentials or demo accounts without internet.</span>
      </div>
    )}

    {/* Error Alert */}
    {errorMessage && (
      <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
        {errorMessage}
      </div>
    )}

    {/* Form */}
    <form onSubmit={onSubmit} className="space-y-3.5">
      {/* Email / Employee ID (height 46-50px) */}
      <div>
        <label className="block text-[11px] font-bold tracking-wider text-[#073D32] uppercase mb-1">
          EMAIL ADDRESS OR EMPLOYEE ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com or Employee ID"
            autoComplete="username"
            className="w-full h-[46px] pl-10 pr-3.5 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs font-semibold text-[#1E2523] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all"
          />
        </div>
      </div>

      {/* Password (height 46-50px) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold tracking-wider text-[#073D32] uppercase">
            PASSWORD
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[11px] font-semibold text-[#005B46] hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="w-full h-[46px] pl-10 pr-10 rounded-xl border border-[#DCE4DE] bg-[#FBFCFA] focus:bg-white text-xs font-semibold text-[#1E2523] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005B46]/20 focus:border-[#005B46] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Remember Me */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-[#005B46] focus:ring-[#005B46] border-gray-300 cursor-pointer accent-[#005B46]"
          />
          <span className="text-[12px] text-[#536A65] font-medium leading-normal">
            Remember this device for 30 days
          </span>
        </label>
      </div>

      {/* Primary Sign In Button (48px height, #087A5B) */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-[48px] rounded-xl bg-[#087A5B] hover:bg-[#00664F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group mt-2"
      >
        <span>{isSubmitting ? 'Signing In...' : 'Sign In to VikasSetu'}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </form>

    {/* Create Account Link */}
    <div className="text-center mt-5 pt-1 border-t border-[#E9EEEB]">
      <p className="text-[12px] sm:text-[13px] text-[#536A65]">
        New candidate or society member?{' '}
        <button
          onClick={onSignup}
          className="font-bold text-[#087A5B] hover:underline cursor-pointer"
        >
          Create an Account →
        </button>
      </p>
    </div>

    {/* Security Message */}
    <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 text-center mt-3.5">
      <ShieldCheck className="w-3.5 h-3.5 text-[#087A5B]" />
      <span>Your learning records and credentials are securely managed.</span>
    </div>
  </div>
);

// =========================================================================
// 4. DARK GREEN QUOTE SECTION (Height 95-105px, Background #005B46)
// =========================================================================
export const GreenQuoteBand: React.FC = () => (
  <div className="relative bg-[#005B46] text-white select-none w-full mt-auto">
    {/* Smooth Organic Wave on Top Edge */}
    <div className="w-full overflow-hidden leading-none -mt-4 sm:-mt-6">
      <svg
        viewBox="0 0 1440 32"
        fill="none"
        preserveAspectRatio="none"
        className="w-full h-[18px] sm:h-[28px] block"
      >
        <path
          d="M0,32 C260,8 520,2 780,18 C1040,32 1260,12 1440,28 L1440,32 L0,32 Z"
          fill="#005B46"
        />
      </svg>
    </div>

    <div className="relative overflow-hidden min-h-[90px] flex items-center py-4 sm:py-3.5">
      {/* Subtle Agricultural Line Art on Right (Low Opacity) */}
      <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none hidden lg:block w-[420px]">
        <svg viewBox="0 0 500 120" fill="none" className="w-full h-auto">
          <path d="M0 100 C 150 85, 300 110, 500 95" stroke="white" strokeWidth="2" />
          <path d="M50 110 C 200 95, 350 115, 500 105" stroke="white" strokeWidth="1.5" />
          <rect x="420" y="45" width="28" height="55" rx="3" stroke="white" strokeWidth="1.8" />
          <path d="M420 45 C 420 28, 448 28, 448 45 Z" stroke="white" strokeWidth="1.8" />
          <circle cx="360" cy="85" r="15" stroke="white" strokeWidth="2" />
          <circle cx="320" cy="92" r="8" stroke="white" strokeWidth="2" />
          <path d="M320 90 L 340 90 L 345 72 L 365 72 L 365 85" stroke="white" strokeWidth="1.8" />
        </svg>
      </div>

      {/* Subtle Indian Tricolor Curved Accent */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 hidden xl:block w-[420px] h-[90px]">
        <svg viewBox="0 0 420 90" fill="none" className="w-full h-full">
          <path d="M0,75 C120,50 250,25 420,15" stroke="#E98A28" strokeWidth="3" strokeLinecap="round" />
          <path d="M0,80 C120,55 250,30 420,20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M0,85 C120,60 250,35 420,25" stroke="#138808" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="w-[calc(100%-32px)] max-w-[1220px] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Ministry Quote */}
          <div className="flex items-start gap-2.5 max-w-lg text-center lg:text-left">
            <Quote className="w-5 h-5 text-amber-300 flex-shrink-0 opacity-80 rotate-180 hidden sm:block mt-0.5" />
            <div>
              <p className="text-xs sm:text-[13px] font-serif italic font-medium text-emerald-50 leading-snug">
                “Together through cooperatives, we build a stronger, more inclusive India.”
              </p>
              <p className="text-[10.5px] sm:text-[11px] text-amber-200/90 font-medium mt-0.5">
                — Ministry of Cooperation, Government of India
              </p>
            </div>
          </div>

          {/* Right: 3 Concept Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-300 flex-shrink-0">
                <Wheat className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-none">Sahakar</p>
                <p className="text-[9px] text-emerald-200 mt-0.5 leading-none">Se Samriddhi</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-300 flex-shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-none">People</p>
                <p className="text-[9px] text-emerald-200 mt-0.5 leading-none">Prosperity</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-300 flex-shrink-0">
                <TreePine className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-none">Rural Growth</p>
                <p className="text-[9px] text-emerald-200 mt-0.5 leading-none">Stronger India</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// =========================================================================
// 5. COPYRIGHT FOOTER (Height 55-65px, White Background)
// =========================================================================
export const Footer: React.FC = () => (
  <footer className="bg-white border-t border-[#E8ECE9] min-h-[58px] h-auto py-3 sm:py-0 flex items-center text-[11px] text-[#536A65] w-full select-none">
    <div className="w-[calc(100%-32px)] max-w-[1220px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left py-1 sm:py-0">
      <div>
        <p className="font-semibold text-gray-700 leading-tight">
          © 2026 National Council for Cooperative Training (NCCT), Ministry of Cooperation, Government of India.
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
          VAMNICOM Pune • 5 Regional Institutes (RICMs) • 14 State Institutes (ICMs)
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-gray-600">
        <span className="hover:text-[#005B46] cursor-pointer">Privacy Policy</span>
        <span className="opacity-40">|</span>
        <span className="hover:text-[#005B46] cursor-pointer">Terms of Use</span>
        <span className="opacity-40">|</span>
        <span className="hover:text-[#005B46] cursor-pointer">Help & Support</span>
      </div>
    </div>
  </footer>
);

// =========================================================================
// MASTER AUTHENTICATION PAGE (Main Hero Height 640-660px, Two-Column, Background Visual)
// =========================================================================
export const AuthPage: React.FC = () => {
  const { login, navigate, currentLanguage, setLanguage } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanIdentifier = email.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Enter your email or employee ID.');
      return;
    }
    if (!password) {
      setErrorMessage('Enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanIdentifier, password, rememberMe);
    } catch (apiErr: any) {
      const msg = apiErr?.message || 'Invalid email/employee ID or password.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#F7F6FF] text-[#23213B] flex flex-col antialiased selection:bg-violet-100 selection:text-violet-900 font-sans">
      {/* 1. TOP GOVERNMENT BAR (28-30px, #005B46) */}
      <GovernmentBar
        onVerifyClick={() => navigate('verify_public', { certId: 'NCCT-CERT-2026-VAM-0089' })}
      />

      {/* 2. BRAND HEADER (64-68px, #FFFFFF) */}
      <BrandHeader
        currentLanguage={currentLanguage}
        onLanguageChange={setLanguage}
        onHomeClick={() => navigate('/')}
      />

      {/* 3. MAIN HERO SECTION (Responsive height, centered on mobile, 2-col on md+) */}
      <div className="relative flex-1 min-h-0 max-h-none lg:min-h-[580px] lg:max-h-[760px] flex items-center justify-center overflow-x-hidden py-6 sm:py-8 lg:py-6 select-none">

        {/* =================================================================
            HERO BACKGROUND VISUAL LAYER (Spans broadly behind hero & center)
            Layer 0: Background Image (z-0)
            Layer 1: Soft Ivory Multi-Stop Gradient Mask (z-1)
           ================================================================= */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Saffron halo glow behind the elderly farmer */}
          <div className="absolute top-[20px] sm:top-[30px] left-[50%] md:left-[52%] xl:left-[50%] -translate-x-1/2 w-[260px] sm:w-[320px] h-[260px] sm:h-[320px] rounded-full bg-gradient-to-tr from-[#E98A28]/25 via-[#F59E0B]/15 to-transparent blur-2xl -z-10" />

          {/* Contemporary learning photograph from the VikasSetu image library */}
          <img
            src="/img/coaching.webp"
            alt="Cooperative learners participating in a training programme"
            className="w-full h-full object-cover object-[62%_50%] opacity-20 sm:opacity-35 md:opacity-95 filter contrast-[1.03]"
          />

          {/* Desktop Soft White/Cream Gradient Overlay from LEFT -> CENTER */}
          <div
            className="hidden md:block absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(
                90deg,
                rgba(247,246,241,0.98) 0%,
                rgba(247,246,241,0.88) 28%,
                rgba(247,246,241,0.45) 48%,
                rgba(247,246,241,0.05) 72%,
                rgba(247,246,241,0.15) 86%,
                rgba(247,246,241,0.45) 100%
              )`
            }}
          />

          {/* Mobile Soft Cream Gradient Overlay (Ensures perfect text readability while showing people) */}
          <div
            className="md:hidden absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(
                180deg,
                rgba(247,246,241,0.95) 0%,
                rgba(247,246,241,0.86) 35%,
                rgba(247,246,241,0.93) 70%,
                rgba(247,246,241,0.98) 100%
              )`
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F7F6F1] via-[#F7F6F1]/75 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#F7F6F1] to-transparent pointer-events-none opacity-80" />

          {/* Slogan floating above farmer head, to the left of login card so it never gets covered */}
          <div className="absolute top-[22px] left-[42%] xl:left-[45%] text-left z-10 pointer-events-none hidden lg:block">
            <p className="font-serif italic text-[18px] lg:text-[20px] font-bold text-[#073D32] leading-[1.12] drop-shadow-xs whitespace-nowrap">
              Stronger Cooperatives<br />
              <span className="text-[#005B46]">Brighter Tomorrow</span>
            </p>
            <div className="w-20 h-[3px] bg-[#E98A28] rounded-full mt-1" />
          </div>

          {/* Small Sahakar se Samriddhi floating chip */}
          <div className="absolute bottom-[36px] left-[42%] lg:left-[45%] bg-white/95 backdrop-blur-xs border border-[#DDE6DF] px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5 z-10 hidden xl:flex">
            <span className="w-2 h-2 rounded-full bg-[#005B46]" />
            <span className="text-[10px] font-bold text-[#005B46] font-devanagari">
              सहकार से समृद्धि
            </span>
          </div>
        </div>

        {/* =================================================================
            HERO CONTENT CONTAINER (Max Width 1220px, Centered, Responsive Grid)
            Mobile: 1 column, centered, Login Card below hero/statistics
            Tablet: 2 columns (56% 44%), balanced, reduced spacing
            Desktop: 2 columns (58% 42%), exact spacing & positioning
           ================================================================= */}
        <div className="relative z-10 w-[calc(100%-32px)] max-w-[1220px] mx-auto grid grid-cols-1 md:grid-cols-[56%_44%] lg:grid-cols-[58%_42%] items-center gap-8 lg:gap-8">

          {/* ---------------------------------------------------------------
              LEFT COLUMN (max-w 620px, responsive alignment)
             --------------------------------------------------------------- */}
          <div className="w-full max-w-[620px] mx-auto md:mx-0 flex flex-col items-center md:items-start text-center md:text-left lg:-translate-x-[10px] transition-transform">

            {/* Top Badge: small white pill */}
            <div className="inline-flex items-center h-[28px] px-3 rounded-full bg-white border border-[#DDE6DF] shadow-2xs mb-3 max-w-full">
              <span className="w-3.5 h-1 rounded-full bg-[#E98A28] mr-2 flex-shrink-0" />
              <span className="text-[10.5px] xs:text-[11px] sm:text-[12px] font-bold text-[#005B46] tracking-wider uppercase truncate">
                COOPERATIVES BUILD A STRONGER INDIA
              </span>
            </div>

            {/* Main Headline with TextType Animation: Responsive size, natural wrap, no cutoffs */}
            <div className="hero-heading min-h-[70px] xs:min-h-[82px] sm:min-h-[105px] lg:min-h-[115px] flex items-center md:items-start justify-center md:justify-start w-full">
              <h1 className="text-[28px] xs:text-[32px] sm:text-[40px] md:text-[36px] lg:text-[48px] xl:text-[52px] font-[800] text-[#073D32] tracking-tight leading-[1.08] sm:leading-[1.02] text-center md:text-left break-words">
                <TextType
                  text={"Empowering India's\nसहकारी Workforce"}
                  typingSpeed={55}
                  deletingSpeed={25}
                  pauseDuration={1800}
                  showCursor={true}
                  cursorCharacter="|"
                  cursorBlinkDuration={0.5}
                  loop={true}
                  cursorClassName="text-[#E98A28] font-light"
                />
              </h1>
            </div>

            {/* Description: full width, readable, responsive padding */}
            <p className="mt-[12px] sm:mt-[14px] text-[14px] sm:text-[15px] md:text-[14px] lg:text-[16px] text-[#536A65] leading-[1.45] max-w-[560px] text-center md:text-left px-1 sm:px-0">
              A unified digital platform connecting 20 NCCT institutions, 63,000+ digitized PACS,
              and national cooperative employers for training, certification and better opportunities.
            </p>

            {/* Feature Cards: 2x2 Grid on Mobile & Tablet, 4-col single row on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-3.5 mt-[16px] sm:mt-[18px] w-full max-w-[580px]">
              <div className="flex items-center gap-2 bg-white/70 md:bg-transparent p-2 sm:p-0 rounded-xl md:rounded-none border border-[#E0E6E2]/70 md:border-0 shadow-2xs md:shadow-none">
                <div className="w-7 h-7 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#005B46] flex-shrink-0 shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] sm:text-[12px] font-bold text-[#073D32] uppercase leading-none">LEARN</p>
                  <p className="text-[10px] text-[#536A65] mt-0.5 leading-tight truncate">Multilingual training</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/70 md:bg-transparent p-2 sm:p-0 rounded-xl md:rounded-none border border-[#E0E6E2]/70 md:border-0 shadow-2xs md:shadow-none">
                <div className="w-7 h-7 rounded-full bg-[#FEF3E2] flex items-center justify-center text-[#E98A28] flex-shrink-0 shadow-2xs">
                  <BadgeCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] sm:text-[12px] font-bold text-[#073D32] uppercase leading-none">GET CERTIFIED</p>
                  <p className="text-[10px] text-[#536A65] mt-0.5 leading-tight truncate">Verifiable credentials</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/70 md:bg-transparent p-2 sm:p-0 rounded-xl md:rounded-none border border-[#E0E6E2]/70 md:border-0 shadow-2xs md:shadow-none">
                <div className="w-7 h-7 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0284C7] flex-shrink-0 shadow-2xs">
                  <UsersRound className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] sm:text-[12px] font-bold text-[#073D32] uppercase leading-none">GROW</p>
                  <p className="text-[10px] text-[#536A65] mt-0.5 leading-tight truncate">Skills for future</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/70 md:bg-transparent p-2 sm:p-0 rounded-xl md:rounded-none border border-[#E0E6E2]/70 md:border-0 shadow-2xs md:shadow-none">
                <div className="w-7 h-7 rounded-full bg-[#FFF1E6] flex items-center justify-center text-[#F97316] flex-shrink-0 shadow-2xs">
                  <BriefcaseBusiness className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] sm:text-[12px] font-bold text-[#073D32] uppercase leading-none">GET HIRED</p>
                  <p className="text-[10px] text-[#536A65] mt-0.5 leading-tight truncate">Direct opportunities</p>
                </div>
              </div>
            </div>

            {/* Statistics Section: 2x2 Grid on Mobile (<640px), Divided Single Bar on Tablet/Desktop (>=640px) */}
            {/* Mobile 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 sm:hidden w-full max-w-[590px] mt-[16px]">
              <div className="bg-white border border-[#E0E6E2] rounded-[14px] p-2.5 text-center shadow-2xs">
                <p className="text-[18px] font-extrabold text-[#073D32] leading-none">20</p>
                <p className="text-[10.5px] text-gray-500 font-medium mt-1 leading-none">Institutions</p>
              </div>
              <div className="bg-white border border-[#E0E6E2] rounded-[14px] p-2.5 text-center shadow-2xs">
                <p className="text-[18px] font-extrabold text-[#073D32] leading-none">63,000+</p>
                <p className="text-[10.5px] text-gray-500 font-medium mt-1 leading-none">Digitized PACS</p>
              </div>
              <div className="bg-white border border-[#E0E6E2] rounded-[14px] p-2.5 text-center shadow-2xs">
                <p className="text-[18px] font-extrabold text-[#073D32] leading-none">1M+</p>
                <p className="text-[10.5px] text-gray-500 font-medium mt-1 leading-none">Trained Members</p>
              </div>
              <div className="bg-white border border-[#E0E6E2] rounded-[14px] p-2.5 text-center shadow-2xs">
                <p className="text-[18px] font-extrabold text-[#073D32] leading-none">500+</p>
                <p className="text-[10.5px] text-gray-500 font-medium mt-1 leading-none">Employer Partners</p>
              </div>
            </div>

            {/* Tablet & Desktop Divided Bar */}
            <div className="hidden sm:flex w-full max-w-[590px] h-[64px] bg-white border border-[#E0E6E2] rounded-[16px] shadow-xs px-3 mt-[20px] items-center justify-between divide-x divide-gray-200">
              <div className="px-2 md:px-1.5 lg:px-2.5 text-center flex-1 first:pl-0">
                <p className="text-[18px] md:text-[18px] lg:text-[20px] font-extrabold text-[#073D32] leading-none">20</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 leading-none">Institutions</p>
              </div>

              <div className="px-2 md:px-1.5 lg:px-2.5 text-center flex-1">
                <p className="text-[18px] md:text-[18px] lg:text-[20px] font-extrabold text-[#073D32] leading-none">63,000+</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 leading-none truncate">Digitized PACS</p>
              </div>

              <div className="px-2 md:px-1.5 lg:px-2.5 text-center flex-1">
                <p className="text-[18px] md:text-[18px] lg:text-[20px] font-extrabold text-[#073D32] leading-none">1M+</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 leading-none truncate">Trained Members</p>
              </div>

              <div className="px-2 md:px-1.5 lg:px-2.5 text-center flex-1 last:pr-0">
                <p className="text-[18px] md:text-[18px] lg:text-[20px] font-extrabold text-[#073D32] leading-none">500+</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 leading-none truncate">Employer Partners</p>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------
              RIGHT COLUMN (Login Card cleanly positioned, centered on mobile)
             --------------------------------------------------------------- */}
          <div className="w-full flex justify-center md:justify-end lg:translate-x-[60px]">
            <LoginCard
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
              onSubmit={handleSubmit}
              onForgotPassword={() => navigate('/forgot-password')}
              onSignup={() => navigate('/register')}
            />
          </div>

        </div>
      </div>

      {/* 4. DARK GREEN QUOTE SECTION (Height 95-105px, #005B46, Organic Wave Top) */}
      <GreenQuoteBand />

      {/* 5. COPYRIGHT FOOTER (Height 55-65px, White Background) */}
      <Footer />
    </div>
  );
};

export const LoginView = AuthPage;
export default AuthPage;
