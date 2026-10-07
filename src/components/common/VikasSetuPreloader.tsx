import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Building2, Sparkles } from 'lucide-react';

const PRELOADER_KEY = 'vikassetu_intro_seen_v1';

export const VikasSetuPreloader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return sessionStorage.getItem(PRELOADER_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const [isLeaving, setIsLeaving] = useState(false);

  const finish = () => {
    setIsLeaving(true);
    window.setTimeout(() => {
      try { sessionStorage.setItem(PRELOADER_KEY, 'true'); } catch {}
      setIsVisible(false);
    }, 260);
  };

  useEffect(() => {
    if (!isVisible) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(finish, reducedMotion ? 1200 : 4200);
    return () => window.clearTimeout(timeout);
  }, [isVisible]);

  if (!isVisible) return <>{children}</>;

  return (
    <section
      aria-label="Introducing VikasSetu"
      className={`fixed inset-0 z-[2000] overflow-hidden bg-[#201E4D] text-white transition-[opacity,transform] duration-[260ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${isLeaving ? 'translate-y-[-1%] opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-35"
        src="/img/vid.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(32,30,77,.96)_0%,rgba(32,30,77,.76)_50%,rgba(32,30,77,.52)_100%)]" />
      <div className="absolute -right-16 top-12 h-80 w-80 rounded-full bg-[#F76C7D]/25 blur-3xl" />
      <div className="absolute -bottom-20 left-[28%] h-64 w-64 rounded-full bg-[#A7A5FF]/35 blur-3xl" />

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between px-6 py-7 sm:px-10 sm:py-10">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#504CB8] shadow-xl">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-black tracking-[-.04em]">VikasSetu</p>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-violet-200">Cooperative Network</p>
          </div>
        </div>

        <div className="max-w-2xl pb-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-violet-100 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#FFB5BF]" />
            Integrated cooperative platform
          </div>
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[.92] tracking-[-.07em]">
            Learn. Verify.<br />
            <span className="text-[#FFB5BF]">Move forward.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-violet-100 sm:text-lg">
            VikasSetu connects training, trusted credentials and employment pathways for India’s cooperative ecosystem.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              ['Learn', 'Multilingual training'],
              ['Verify', 'Digital credentials'],
              ['Advance', 'Career pathways'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/[.09] p-3 backdrop-blur-sm">
                <BadgeCheck className="mb-3 h-4 w-4 text-[#FFB5BF]" />
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1 text-[10px] leading-tight text-violet-200">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-violet-200">Preparing your workspace…</span>
          <button
            onClick={finish}
            className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-bold text-white backdrop-blur-sm transition-[background-color,transform] duration-[160ms] hover:bg-white/20 active:scale-[.97]"
          >
            Enter VikasSetu
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-[160ms] group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
