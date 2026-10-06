import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, Building2, Check, ChevronDown, Eye, EyeOff, Globe2, LockKeyhole, Mail, QrCode, ShieldCheck, Sparkles, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';

const roles = [
  { label: 'Learner', email: 'rameshwar.pacs@gmail.com', password: 'Demo@1234' },
  { label: 'Faculty', email: 'faculty@ncct.gov.in', password: 'Faculty@1234' },
  { label: 'Institute', email: 'admin.vamnicom@ncct.gov.in', password: 'Admin@1234' },
  { label: 'National', email: 'superadmin@ncct.gov.in', password: 'Super@1234' },
  { label: 'Employer', email: 'employer@ncct.gov.in', password: 'Employer@1234' },
  { label: 'Device', email: 'device.demo@example.com', password: 'Demo@1234' },
  { label: 'Hostel', email: 'hostel.warden@ncct.gov.in', password: 'Hostel@1234' },
];

const languages: { code: Language; label: string }[] = [{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी' }, { code: 'mr', label: 'मराठी' }];

export const LoginView: React.FC = () => {
  const { login, navigate, currentLanguage, setLanguage } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Enter your email or employee ID and password.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try { await login(identifier.trim(), password, rememberMe); }
    catch (error: any) { setErrorMessage(error?.message || 'We could not sign you in. Please check your details.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <main className="vs-auth-shell min-h-[100dvh] overflow-hidden bg-[#080d1d] text-white">
      <div className="vs-noise pointer-events-none fixed inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-[18%] h-[620px] w-[620px] rounded-full bg-[#2d5bff]/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-52 right-[-5%] h-[620px] w-[620px] rounded-full bg-[#b7f55a]/10 blur-[150px]" />

      <nav className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-9 lg:px-12">
        <button onClick={() => navigate('/')} className="group flex items-center gap-3 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c7ff6b] text-[#081023] shadow-[0_0_30px_rgba(199,255,107,.22)] transition-transform duration-200 ease-out group-active:scale-95"><Building2 className="h-5 w-5" strokeWidth={2.5} /></span>
          <span><span className="block text-base font-extrabold tracking-[-0.04em] text-white">VikasSetu</span><span className="block text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">Cooperative Network</span></span>
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => navigate('verify_public', { certId: 'NCCT-CERT-2026-VAM-0089' })} className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.09] sm:flex"><QrCode className="h-3.5 w-3.5 text-[#c7ff6b]" />Verify credential</button>
          <div className="relative">
            <button onClick={() => setIsLangOpen(value => !value)} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.09]"><Globe2 className="h-3.5 w-3.5 text-[#c7ff6b]" />{languages.find(language => language.code === currentLanguage)?.label}<ChevronDown className="h-3 w-3 text-slate-400" /></button>
            {isLangOpen && <div className="absolute right-0 top-full z-30 mt-2 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#131b32] p-1 shadow-2xl">{languages.map(language => <button key={language.code} onClick={() => { setLanguage(language.code); setIsLangOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">{language.label}{language.code === currentLanguage && <Check className="h-3.5 w-3.5 text-[#c7ff6b]" />}</button>)}</div>}
          </div>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-10 px-5 pb-12 pt-7 sm:px-9 lg:min-h-[calc(100dvh-86px)] lg:grid-cols-[1.12fr_.88fr] lg:gap-20 lg:px-12 lg:py-12">
        <div className="max-w-3xl lg:pb-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c7ff6b]/20 bg-[#c7ff6b]/[.08] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-[#d7ff9c]"><Sparkles className="h-3.5 w-3.5" />Built for the cooperative economy</div>
          <h1 className="max-w-3xl text-[clamp(2.7rem,6vw,5.7rem)] font-black leading-[.91] tracking-[-.075em] text-white">A clear path<span className="block text-[#c7ff6b]">from learning</span><span className="block text-slate-400">to livelihood.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">A unified operating system for cooperative training, verified credentials, and meaningful employment opportunities.</p>
          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[{ icon: BookOpen, title: 'Learn', detail: 'Multilingual LMS' }, { icon: BadgeCheck, title: 'Verify', detail: 'Trusted records' }, { icon: ShieldCheck, title: 'Attend', detail: 'Offline ready' }, { icon: BriefcaseBusiness, title: 'Grow', detail: 'Career bridge' }].map(({ icon: Icon, title, detail }) => <div key={title} className="rounded-2xl border border-white/[.09] bg-white/[.035] p-4 backdrop-blur-sm"><Icon className="mb-6 h-5 w-5 text-[#c7ff6b]" /><p className="text-sm font-bold text-white">{title}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{detail}</p></div>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-400"><span><strong className="text-white">20</strong> training institutes</span><span><strong className="text-white">3</strong> languages</span><span><strong className="text-white">1</strong> connected journey</span></div>
        </div>

        <div className="w-full max-w-[500px] justify-self-center lg:justify-self-end">
          <div className="relative rounded-[30px] border border-white/[.13] bg-[#111a31]/90 p-1 shadow-[0_30px_100px_rgba(0,0,0,.38)] backdrop-blur-xl">
            <div className="rounded-[26px] bg-gradient-to-b from-white/[.075] to-transparent p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#c7ff6b]">Secure access</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-white">Welcome back.</h2><p className="mt-1 text-sm text-slate-400">Sign in to your VikasSetu workspace.</p></div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#c7ff6b] text-[#071021]"><LockKeyhole className="h-4 w-4" /></span></div>
              <div className="my-6 h-px bg-white/[.09]" />
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Quick access</p>
              <div className="grid grid-cols-4 gap-2">{roles.map(role => <button key={role.label} onClick={() => { setIdentifier(role.email); setPassword(role.password); setErrorMessage(''); }} className="rounded-xl border border-white/[.09] bg-white/[.035] px-2 py-2 text-left text-[10px] font-bold text-slate-300 transition duration-150 ease-out hover:border-[#c7ff6b]/60 hover:bg-[#c7ff6b]/10 hover:text-white active:scale-[.97]">{role.label}</button>)}</div>
              {!navigator.onLine && <div className="mt-4 flex gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[.08] px-3 py-2 text-xs text-amber-100"><WifiOff className="h-4 w-4 shrink-0" />Offline mode: saved account access remains available.</div>}
              {errorMessage && <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[.09] px-3 py-2 text-xs font-medium text-rose-100">{errorMessage}</div>}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">Email or employee ID</span><span className="relative block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="username" placeholder="name@example.com" className="h-12 w-full rounded-xl border border-white/[.1] bg-[#080e20]/80 pl-10 pr-4 text-sm font-medium text-white outline-none placeholder:text-slate-600 transition focus:border-[#c7ff6b]/70 focus:ring-4 focus:ring-[#c7ff6b]/10" /></span></label>
                <label className="block"><span className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">Password<button type="button" onClick={() => navigate('/forgot-password')} className="normal-case tracking-normal text-[#c7ff6b] hover:underline">Forgot password?</button></span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="••••••••" className="h-12 w-full rounded-xl border border-white/[.1] bg-[#080e20]/80 pl-10 pr-11 text-sm font-medium text-white outline-none placeholder:text-slate-600 transition focus:border-[#c7ff6b]/70 focus:ring-4 focus:ring-[#c7ff6b]/10" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} className="h-3.5 w-3.5 accent-[#c7ff6b]" />Remember this device</label>
                <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c7ff6b] text-sm font-extrabold text-[#081023] shadow-[0_8px_28px_rgba(199,255,107,.2)] transition duration-150 ease-out hover:bg-[#d7ff9c] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Signing in…' : 'Enter workspace'}<ArrowRight className="h-4 w-4" /></button>
              </form>
              <p className="mt-5 text-center text-xs text-slate-400">New learner or society member? <button onClick={() => navigate('/register')} className="font-bold text-[#c7ff6b] hover:underline">Create your account</button></p>
            </div>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-[#c7ff6b]" />Your records stay protected and role-aware.</p>
        </div>
      </section>
    </main>
  );
};

export default LoginView;
