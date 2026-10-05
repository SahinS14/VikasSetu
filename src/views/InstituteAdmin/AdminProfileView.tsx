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
  FileCheck,
  BadgeCheck,
  Globe,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { Language } from '../../types';

export const AdminProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    setLanguage,
    navigate,
    currentLanguage,
    nominations,
    programmes
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+91 20 2553 7970');
  const [langPref, setLangPref] = useState<Language>(currentUser.languagePreference || 'en');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const pendingCount = nominations.filter(n => n.status === 'pending').length;
  const activeProgsCount = programmes.length;

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
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              {currentLanguage === 'hi' ? 'संस्थान प्रशासन' : currentLanguage === 'mr' ? 'संस्था प्रशासन' : 'Apex Administration'}
            </span>
            <SimulatedBadge text="NCCT Institute Official" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1">
            {currentLanguage === 'hi' ? 'संस्थान प्रशासक प्रोफाईल' : currentLanguage === 'mr' ? 'संस्था प्रशासक प्रोफाईल' : 'Institute Admin Profile'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1 max-w-2xl leading-relaxed">
            {currentLanguage === 'hi'
              ? 'वैकुंठ मेहता राष्ट्रीय सहकारी प्रबंध संस्थान (VAMNICOM), पुणे - प्रशासनिक विवरण एवं प्रणाली प्रबंधन।'
              : 'Institutional operations credentials, official contact records, and system administration preferences.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ministry Apex Verified</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mt-6">
        
        {/* Left Column: Admin Profile Card & Quick Shortcuts (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-govTeal-600 shadow-sm"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-govTeal-700 text-white rounded-full hover:bg-govTeal-800 transition-colors shadow-xs cursor-pointer active:scale-95"
                title="Change official photo"
                aria-label="Change photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-govText-primary leading-snug">{currentUser.name}</h2>
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <BadgeCheck className="w-3 h-3 text-emerald-600" />
                <span>Institute Admin</span>
              </div>
              <p className="text-xs text-govText-secondary font-medium mt-1.5">
                VAMNICOM, Pune (Apex NCCT)
              </p>
            </div>

            {/* Quick Operational Metrics */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <Layers className="w-4 h-4 text-govTeal-600 mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{activeProgsCount || 1}</span>
                <span className="text-[10px] text-govText-muted">Programs</span>
              </div>
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <Users className="w-4 h-4 text-[#E68A2E] mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">382</span>
                <span className="text-[10px] text-govText-muted">Trainees</span>
              </div>
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <FileCheck className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{pendingCount || 6}</span>
                <span className="text-[10px] text-govText-muted">Pending</span>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/institute-admin/settings')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-govTeal-50/70 text-govText-primary hover:text-govTeal-800 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer active:scale-98 min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  Account & System Settings
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Institutional Jurisdiction Summary */}
          <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-govTeal-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-govTeal-600" />
              Institutional Authority
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-govText-muted">Institute</span>
                <span className="font-bold text-govText-primary text-right">VAMNICOM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-govText-muted">Campus</span>
                <span className="font-semibold text-govText-primary">Pune, Maharashtra</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-govText-muted">Capacity</span>
                <span className="font-semibold text-govText-primary">450 Seats (Residential)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-govText-muted">Director</span>
                <span className="font-semibold text-govText-primary">Dr. H. K. Mishra</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-govText-muted">Governing Council</span>
                <span className="font-semibold text-emerald-800">NCCT Central Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Edit Form & Operational Governance (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          
          {/* Administrator Profile Details Form */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-govText-primary">
                  Official Contact & System Records
                </h3>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Update administrative credentials and notification preferences.
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
                    Official Administrator Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#FBFDFB]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-primary mb-1.5">
                    Designation / Role
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value="Institute Admin (Apex NCCT)"
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#FBFDFB]"
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#FBFDFB]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-govText-primary mb-1.5">
                  Institutional Campus Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value="Ganeshkhind Road, Near Pune University, Pune, Maharashtra 411007"
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
                        ? 'border-[#0B6E4F] bg-emerald-50 text-[#0B6E4F] shadow-xs'
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
                        ? 'border-[#0B6E4F] bg-emerald-50 text-[#0B6E4F] shadow-xs'
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
                        ? 'border-[#0B6E4F] bg-emerald-50 text-[#0B6E4F] shadow-xs'
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
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-95 min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Delegated Administrative Modules */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs">
            <h3 className="text-xs font-bold text-govTeal-800 uppercase tracking-wider mb-3">
              Delegated System Authorities
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">Trainee Nominations</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Authority to approve, review, and reject PACS & cooperative candidate nominations.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">Campus Timetable & Labs</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Manage weekly lab schedules, lecture halls, and faculty allocations.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">Biometric Attendance Hardware</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Control campus QR and optical biometric kiosk stations.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-govText-primary">Hostel & Accommodation</h4>
                  <p className="text-[11px] text-govText-secondary mt-0.5">
                    Assign beds and manage residential capacity for visiting trainees.
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
