import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  ShieldCheck,
  Save,
  Settings,
  CheckCircle2,
  Camera,
  Layers,
  Users,
  Award,
  BadgeCheck,
  Globe,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { Language } from '../../types';

export const SuperAdminProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    setLanguage,
    navigate,
    currentLanguage,
    institutes,
    certificates
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+91 11 2686 2151');
  const [langPref, setLangPref] = useState<Language>(currentUser.languagePreference || 'en');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalTrainees = institutes.reduce((acc, i) => acc + i.activeCount, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      phone,
      languagePreference: langPref
    });
    setLanguage(langPref);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              {currentLanguage === 'hi' ? 'राष्ट्रीय शीर्ष प्रशासन' : 'Apex National Secretariat'}
            </span>
            <SimulatedBadge text="Ministry of Cooperation Level 1" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1">
            Super Admin Profile & Executive Credentials
          </h1>
          <p className="text-xs text-govText-secondary mt-1 max-w-2xl leading-relaxed">
            National Council for Cooperative Training (NCCT) Executive Directorate, Ministry of Cooperation, New Delhi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 flex items-center gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Apex Authority Active</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mt-6">
        
        {/* Left Column: Admin Profile Card & Quick Stats (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-purple-700 shadow-sm"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-purple-700 text-white rounded-full hover:bg-purple-800 transition-colors shadow-xs cursor-pointer active:scale-95"
                title="Change official photo"
                aria-label="Change photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-govText-primary leading-snug">
                {currentUser.name}
              </h2>
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-bold">
                <BadgeCheck className="w-3 h-3 text-purple-600" />
                <span>Super Admin (NCCT Secretary)</span>
              </div>
              <p className="text-xs text-govText-secondary font-medium mt-1.5">
                Ministry of Cooperation, New Delhi
              </p>
            </div>

            {/* Quick National Metrics */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <Building2 className="w-4 h-4 text-govTeal-600 mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{institutes.length}</span>
                <span className="text-[10px] text-govText-muted">Institutes</span>
              </div>
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <Users className="w-4 h-4 text-[#E68A2E] mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{certificates.length}</span>
                <span className="text-[10px] text-govText-muted">Certified</span>
              </div>
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <Award className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{certificates.filter(c => c.status === 'ISSUED').length || certificates.length}</span>
                <span className="text-[10px] text-govText-muted">Verifiable</span>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/super-admin/users')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-govTeal-50/70 text-govText-primary hover:text-govTeal-800 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer active:scale-98 min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-govTeal-600" />
                  User & Role Management
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/super-admin/settings')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-govTeal-50/70 text-govText-primary hover:text-govTeal-800 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer active:scale-98 min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  System Preferences & Security
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* National Authority Overview */}
          <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-govTeal-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              Secretariat Jurisdiction
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-govText-muted">Governing Ministry</span>
                <span className="font-bold text-govText-primary text-right">Ministry of Cooperation</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-govText-muted">Autonomous Nodes</span>
                <span className="font-semibold text-govText-primary">20 Institutes Connected</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-govText-muted">National Capacity</span>
                <span className="font-semibold text-govText-primary">4,000+ Sanctioned Seats</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-govText-muted">Central Cloud Hub</span>
                <span className="font-semibold text-emerald-800">Operational • Active Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form & National Governance Capabilities (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          
          {/* Executive Contact & Credentials Form */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-govText-primary">
                  Secretariat Profile & Official Credentials
                </h3>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Update executive contact details and administrative notification preferences.
                </p>
              </div>
              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fadeIn font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1.5">
                    Official Executive Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-[#FBFDFB]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1.5">
                    Executive Role / Designation
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value="Super Admin (Secretary, NCCT)"
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-100/70 text-gray-600 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1.5">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-[#FBFDFB]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-[#FBFDFB]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-govText-primary mb-1.5">
                  Secretariat Central Headquarters
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value="NCCT Central Secretariat, 3 Siri Institutional Area, August Kranti Marg, New Delhi 110016"
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-100/70 text-gray-600 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-govText-primary mb-2">
                  System Language Preference
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLangPref('en')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                      langPref === 'en'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    English (Official)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangPref('hi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold font-devanagari transition-all cursor-pointer min-h-[44px] ${
                      langPref === 'hi'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    हिन्दी (Hindi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangPref('mr')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold font-devanagari transition-all cursor-pointer min-h-[44px] ${
                      langPref === 'mr'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    मराठी (Marathi)
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-95 min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  Save Executive Profile
                </button>
              </div>
            </form>
          </div>

          {/* Central Apex Capabilities */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs">
            <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-3">
              National Council Delegated Powers
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">Node Officer Provisioning</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Authority to provision Institute Admins and assign autonomous node control.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">National Curriculum Accreditation</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Accreditation and statutory audit oversight for national cooperative modules.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">Credential Key Authority</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Cryptographic signature generation and public ledger certification roots.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">Federated Synchronization</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Multi-tier offline buffer and biometric attendance synchronization protocols.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
};
