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
    const timeout = window.setTimeout(finish, 11000);
    return () => window.clearTimeout(timeout);
  }, [isVisible]);

  if (!isVisible) return <>{children}</>;

  return (
    <section
      aria-label="VikasSetu introduction video"
      className={`fixed inset-0 z-[2000] overflow-hidden bg-black transition-[opacity,transform] duration-[260ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${isLeaving ? 'scale-[1.01] opacity-0' : 'scale-100 opacity-100'}`}
    >
      <video
        className="h-full w-full object-cover"
        src="/img/vid.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        aria-label="VikasSetu introduction"
      />
    </section>
  );
};
