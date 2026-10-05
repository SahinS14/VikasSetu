import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  ShieldCheck,
  Save,
  CheckCircle2,
  BookOpen,
  Users,
  Award,
  GraduationCap,
  LogOut,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { Language } from '../../types';

export const FacultyProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    setLanguage,
    navigate,
    currentLanguage,
    courses,
    logout
  } = useApp();

  const [name, setName] = useState(currentUser.name || 'Prof. Meenakshi Sundaram');
  const [email, setEmail] = useState(currentUser.email || 'prof.sundaram@vamnicom.gov.in');
  const [phone, setPhone] = useState(currentUser.phone || '+91 20 2570 1000');
  const [langPref, setLangPref] = useState<Language>(currentUser.languagePreference || 'en');
  const [department, setDepartment] = useState('Dept. of Cooperative IT & Rural Management');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const authoredCoursesCount = courses.length;

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
      <div className="space-y-6 animate-fadeIn pb-24 lg:pb-12 max-w-5xl mx-auto">
        {/* 1. Header Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                Faculty Administration
              </span>
              <SimulatedBadge text="Academic Profile" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-govText-primary mt-1 tracking-tight">
              Faculty Profile
            </h1>
            <p className="text-xs text-govText-secondary mt-1">
              Manage your academic credentials, teaching affiliation, and system preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer min-h-[44px] self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2.5 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Profile credentials and academic preferences updated successfully!</span>
          </div>
        )}

        {/* 2. Top Profile Hero Card */}
        <div className="bg-gradient-to-br from-govTeal-900 via-govTeal-800 to-govTeal-700 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-govTeal-600 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 shadow-md"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-govTeal-900 rounded-full" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate max-w-full">
                {name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-govTeal-950 uppercase tracking-wider">
                Senior Faculty
              </span>
            </div>

            <p className="text-xs sm:text-sm text-govTeal-100 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <GraduationCap className="w-4 h-4 text-saffron-300 flex-shrink-0" />
              <span>{department}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-govTeal-200">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-saffron-300" />
                <span>VAMNICOM (Apex NCCT Institute)</span>
              </span>
              <span className="opacity-40 hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-saffron-300" />
                <span>Pune, Maharashtra</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Academic Metric Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-govText-border shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-govTeal-50 text-govTeal-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-govText-muted uppercase">Authored Courses</p>
              <p className="text-xl font-extrabold text-govText-primary">{authoredCoursesCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-govText-border shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-govText-muted uppercase">Enrolled Trainees</p>
              <p className="text-xl font-extrabold text-govText-primary">1,280</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-govText-border shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-govText-muted uppercase">Avg. Completion Rate</p>
              <p className="text-xl font-extrabold text-emerald-700">88.5%</p>
            </div>
          </div>
        </div>

        {/* 4. Editable Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-govText-border shadow-xs p-5 sm:p-7 space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-base text-govText-primary">
              Personal & Teaching Information
            </h3>
            <span className="text-xs text-govText-muted">NCCT Identity Verification: Verified</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-govText-primary mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                />
                <User className="w-4 h-4 text-govText-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-govText-primary mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                />
                <Mail className="w-4 h-4 text-govText-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-govText-primary mb-1">
                Official Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                />
                <Phone className="w-4 h-4 text-govText-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* Academic Department */}
            <div>
              <label className="block text-xs font-bold text-govText-primary mb-1">
                Academic Department
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                />
                <Building2 className="w-4 h-4 text-govText-muted absolute left-3 top-3" />
              </div>
            </div>

            {/* Language Preference */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-govText-primary mb-1">
                Default Portal Language
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { code: 'en', label: 'English', sub: 'National Official' },
                  { code: 'hi', label: 'हिन्दी', sub: 'राजभाषा' },
                  { code: 'mr', label: 'मराठी', sub: 'प्रादेशिक' },
                ].map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLangPref(item.code as Language)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      langPref === item.code
                        ? 'bg-govTeal-50 border-govTeal-600 text-govTeal-900 shadow-2xs'
                        : 'bg-govBg hover:bg-gray-100 border-gray-200 text-govText-secondary'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">{item.label}</div>
                    <div className="text-[10px] text-govText-muted mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-govText-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ministry of Cooperation, National Faculty Network</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <Save className="w-4 h-4 text-saffron-300" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};
