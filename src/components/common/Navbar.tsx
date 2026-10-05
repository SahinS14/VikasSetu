import React, { useState } from 'react';
import {
  Globe,
  UserCheck,
  ChevronDown,
  Shield,
  Fingerprint,
  QrCode,
  Wifi,
  WifiOff,
  Menu,
  X,
  Award,
  Sparkles,
  Building2,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEED_USERS } from '../../data/seedData';
import { Language, UserRole } from '../../types';
import { EkycModal } from './EkycModal';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    setLanguage,
    switchUser,
    activeView,
    navigate,
    isOffline,
    toggleOfflineMode,
    t,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isEkycOpen, setIsEkycOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const languages: { code: Language; label: string; sub: string }[] = [
    { code: 'en', label: 'English', sub: 'National' },
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { code: 'mr', label: 'मराठी', sub: 'Marathi' },
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'institute_admin': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'faculty': return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'employer': return 'bg-amber-100 text-amber-900 border-amber-300';
      default: return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  return (
    <>
      {/* Top Tricolor Accent Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-green-600 shadow-sm" />

      <header className="bg-white border-b border-govText-border sticky top-0 z-40 shadow-sm">
        {/* Ministry Civic Header Band */}
        <div className="bg-govTeal-900 text-govTeal-100 text-[11px] py-1 px-4 border-b border-govTeal-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <span>भारत सरकार | Government of India</span>
              <span className="text-govTeal-400">•</span>
              <span className="text-saffron-300">सहकारिता मंत्रालय (Ministry of Cooperation)</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hidden sm:inline opacity-80">राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)</span>
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

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Emblem & Brand */}
            <div 
              onClick={() => navigate('home')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-govTeal-600 to-govTeal-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
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

            {/* Right: Actions (Language, Demo Switcher, e-KYC, Profile) */}
            <div className="hidden lg:flex items-center gap-3">
              
              {/* Offline Status Toggle */}
              <button
                onClick={toggleOfflineMode}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isOffline
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Click to toggle offline mode simulation"
              >
                {isOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                    <span>Offline PWA Active</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Online Sync</span>
                  </>
                )}
              </button>

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="px-3 py-1.5 rounded-lg border border-govText-border bg-govBg hover:bg-white text-xs font-medium text-govText-primary flex items-center gap-1.5 shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-govTeal-600" />
                  <span>{languages.find(l => l.code === currentLanguage)?.label}</span>
                  <ChevronDown className="w-3 h-3 text-govText-muted" />
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-white border border-govTeal-100 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                    <div className="px-3 py-1 text-[10px] font-bold text-govText-muted uppercase tracking-wider border-b border-gray-100">
                      Select Language
                    </div>
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-govTeal-50 transition-colors ${
                          currentLanguage === lang.code ? 'font-bold text-govTeal-700 bg-govTeal-50/60' : 'text-govText-primary'
                        }`}
                      >
                        <span>{lang.label}</span>
                        <span className="text-[10px] text-govText-muted">{lang.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Demo Role Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="px-3 py-1.5 rounded-lg bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-saffron-300" />
                  <span>Demo Switcher ({currentUser.role.replace('_', ' ').toUpperCase()})</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-80 bg-white border border-govTeal-200 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-govTeal-800 uppercase tracking-wider border-b border-gray-100 mb-1 flex items-center justify-between">
                      <span>Instant Role Switcher</span>
                      <span className="text-[9px] bg-saffron-100 text-saffron-900 px-1.5 py-0.5 rounded font-mono font-semibold">
                        DEMO MODE
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-1">
                      {SEED_USERS.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchUser(user.id);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center gap-2.5 ${
                            currentUser.id === user.id
                              ? 'bg-govTeal-50 border border-govTeal-300 shadow-sm'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-govTeal-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-govText-primary truncate">{user.name}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase truncate ${getRoleBadgeColor(user.role)}`}>
                                {user.role === 'trainee' && user.programmeStatus
                                  ? user.programmeStatus === 'APPROVED'
                                    ? (user.batchId ? 'Approved ✓' : 'Approved (No Batch)')
                                    : user.programmeStatus === 'UNDER_REVIEW'
                                    ? 'Under Review'
                                    : user.programmeStatus === 'REJECTED'
                                    ? 'Rejected'
                                    : user.programmeStatus
                                  : user.role.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[10px] text-govText-muted truncate">
                              {user.cooperativeAffiliation || user.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Trainee e-KYC Badge / Trigger */}
              {currentUser.role === 'trainee' && (
                <button
                  onClick={() => setIsEkycOpen(true)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                    currentUser.isKycVerified
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Simulated Aadhaar e-KYC Status"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-govTeal-600" />
                  <span>{currentUser.isKycVerified ? 'e-KYC Verified' : 'Verify Aadhaar'}</span>
                </button>
              )}

              {/* User Profile Avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-govTeal-600"
                />
                <div className="text-left leading-tight hidden xl:block">
                  <p className="text-xs font-bold text-govText-primary">{currentUser.name}</p>
                  <p className="text-[10px] text-govText-secondary font-medium">
                    {t.roles[currentUser.role]}
                  </p>
                </div>
              </div>

            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="p-1.5 rounded-lg bg-govTeal-600 text-white text-xs font-medium"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-govText-secondary hover:bg-govBg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-govText-border bg-white px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-govTeal-600"
                />
                <div>
                  <p className="font-bold text-sm text-govText-primary">{currentUser.name}</p>
                  <p className="text-xs text-govTeal-700 font-semibold">{t.roles[currentUser.role]}</p>
                </div>
              </div>
              {currentUser.role === 'trainee' && (
                <button
                  onClick={() => setIsEkycOpen(true)}
                  className="px-2 py-1 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <Fingerprint className="w-3 h-3" />
                  <span>e-KYC</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`flex-1 py-1.5 text-xs rounded border ${
                    currentLanguage === l.code ? 'bg-govTeal-600 text-white font-bold' : 'bg-govBg'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Simulated e-KYC Modal */}
      <EkycModal isOpen={isEkycOpen} onClose={() => setIsEkycOpen(false)} />
    </>
  );
};
