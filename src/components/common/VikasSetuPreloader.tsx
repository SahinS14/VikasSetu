import React, { useEffect, useState } from 'react';

const PRELOADER_KEY = 'vikassetu_intro_seen_v1';

export const VikasSetuPreloader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return sessionStorage.getItem(PRELOADER_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const [hasEntered, setHasEntered] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const finish = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => {
      try { sessionStorage.setItem(PRELOADER_KEY, 'true'); } catch {}
      setIsVisible(false);
    }, 250);
  };

  useEffect(() => {
    if (!isVisible) return;

    const frame = window.requestAnimationFrame(() => setHasEntered(true));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isVisible]);

  return (
    <>
      {children}
      {isVisible && (
        <section
          aria-label="VikasSetu introduction video"
          aria-modal="true"
          role="dialog"
          className={`fixed inset-0 z-[2000] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm transition-opacity duration-[250ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${isLeaving ? 'opacity-0' : 'opacity-100'}`}
          onClick={finish}
        >
          <div
            className={`relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl transition-[opacity,transform] duration-[250ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity ${hasEntered && !isLeaving ? 'scale-100 opacity-100 motion-reduce:transform-none' : 'scale-[0.96] opacity-0 motion-reduce:transform-none'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <video
              className="block aspect-video w-full"
              src="/img/vid.mp4"
              controls
              muted={false}
              playsInline
              preload="metadata"
              onEnded={finish}
              aria-label="VikasSetu introduction"
            />
            <button
              type="button"
              onClick={finish}
              aria-label="Close introduction video"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-xl leading-none text-white transition-colors duration-150 hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ×
            </button>
          </div>
        </section>
      )}
    </>
  );
};
