import React, { useState } from 'react';
import { Building2, Globe, QrCode, LogIn, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { currentLanguage, setLanguage, navigate } = useApp();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <div className="min-h-screen bg-govBg flex flex-col text-govText-primary">
      {/* Tricolor Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />

      {/* Subtle Civic Band */}
      <div className="bg-govTeal-950 text-govTeal-100 text-[11px] py-1 px-4 border-b border-govTeal-900 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-devanagari">भारत सरकार</span>
            <span className="opacity-40">|</span>
            <span>Government of India</span>
            <span className="text-govTeal-400 hidden sm:inline">•</span>
            <span className="text-saffron-300 hidden sm:inline">सहकारिता मंत्रालय (Ministry of Cooperation)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hidden md:inline opacity-75">राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)</span>
            <button
              onClick={() => navigate('verify_public', { certId: 'NCCT-CERT-2026-VAM-0089' })}
              className="hover:text-white underline flex items-center gap-1 text-saffron-300 font-semibold"
            >
              <QrCode className="w-3 h-3" />
              <span>Verify Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Public Header */}
      <header className="bg-white border-b border-govText-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand */}
            <div
              onClick={() => navigate('home')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-govTeal-600 to-govTeal-800 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5 text-saffron-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-govTeal-800 tracking-tight leading-none font-sans">
                    VikasSetu
                  </h1>
                </div>
                <p className="text-[10px] text-govText-secondary font-medium tracking-tight mt-0.5">
                  NCCT Federated Training-ERP & LMS Platform
                </p>
              </div>
            </div>

            {/* Right: Language & Auth Links */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="px-3 py-1.5 rounded-lg border border-govText-border bg-govBg hover:bg-white text-xs font-semibold text-govText-primary flex items-center gap-1.5 shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-govTeal-600" />
                  <span>{languages.find(l => l.code === currentLanguage)?.label}</span>
                  <ChevronDown className="w-3 h-3 text-govText-muted" />
                </button>

                {isLangOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white border border-govTeal-100 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
                    {languages.map(l => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors ${
                          currentLanguage === l.code
                            ? 'bg-govTeal-50 text-govTeal-800'
                            : 'hover:bg-gray-50 text-govText-primary'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Login CTA */}
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Public Content */}
      <main className="flex-1 w-full flex flex-col justify-center">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-govText-border py-6 text-center text-xs text-govText-muted">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 National Council for Cooperative Training (NCCT), Ministry of Cooperation, Government of India.</p>
          <p className="text-[11px] text-govText-muted">
            VAMNICOM Pune • 5 Regional Institutes (RICMs) • 14 State Institutes (ICMs)
          </p>
        </div>
      </footer>
    </div>
  );
};
