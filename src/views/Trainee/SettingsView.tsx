import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Bell,
  Lock,
  Wifi,
  WifiOff,
  Shield,
  CheckCircle2,
  Save,
  Download,
  Smartphone,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { Language } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    logout,
    currentLanguage,
    setLanguage,
    isOffline,
    toggleOfflineMode,
    t
  } = useApp();

  const [courseAlerts, setCourseAlerts] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passUpdated, setPassUpdated] = useState(false);
  const [passError, setPassError] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassError('');
    setPassUpdated(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassUpdated(false), 3500);
  };

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              System Preferences
            </span>
            <SimulatedBadge text="Local Device Configuration" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1 leading-tight">
            {t.settings?.title || 'Account Settings & Preferences'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1 leading-relaxed max-w-xl">
            {t.settings?.subtitle || 'Customize your learning language, notification alerts, and security options.'}
          </p>
        </div>

        {/* Quick Sign Out Action Button in Header */}
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer group min-h-[42px]"
          title="Sign out of current account"
        >
          <LogOut className="w-4 h-4 text-rose-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t.nav?.logout || 'Sign Out'}</span>
        </button>
      </div>

      {/* 2. Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Language & Display Settings */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-govText-border shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <Globe className="w-5 h-5 text-govTeal-600 flex-shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-govText-primary">
              {t.settings?.languagePref || 'Interface Language Preference'}
            </h2>
          </div>

          <p className="text-xs text-govText-secondary leading-relaxed">
            Choose your preferred display language across all dashboards, modules, and tests.
          </p>

          <div className="space-y-2.5">
            {[
              { code: 'en', label: 'English', sub: 'National Official' },
              { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { code: 'mr', label: 'मराठी', sub: 'Marathi' },
            ].map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code as Language)}
                  className={`w-full min-h-[50px] p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-govTeal-600 bg-govTeal-50/70 font-bold text-govTeal-950 shadow-2xs'
                      : 'border-gray-200 hover:bg-govBg text-govText-primary font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-semibold">{lang.label}</span>
                    <span className="text-[10px] text-govText-muted">({lang.sub})</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-govTeal-600 bg-govTeal-600' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rural Offline Sync */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-govText-primary flex items-center gap-1.5">
                  {isOffline ? <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" /> : <Wifi className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  <span>Rural Offline Mode</span>
                </p>
                <p className="text-[11px] text-govText-muted mt-0.5 leading-snug">
                  Pre-caches lesson courseware for low-connectivity PACS areas.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleOfflineMode}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 min-h-[38px] ${
                  isOffline
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 border border-govTeal-200'
                }`}
              >
                {isOffline ? 'Active' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <Bell className="w-5 h-5 text-govTeal-600" />
            <h2 className="text-base font-bold text-govText-primary">
              {t.settings?.notificationPref || 'Alerts & Notifications'}
            </h2>
          </div>

          <p className="text-xs text-govText-secondary leading-relaxed">
            Manage how VikasSetu reaches you with course schedules and job alerts.
          </p>

          <div className="space-y-3">
            <label className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-govBg transition-colors">
              <div>
                <p className="text-xs font-bold text-govText-primary">Course Progress Reminders</p>
                <p className="text-[11px] text-govText-muted mt-0.5">Get notified when new lessons or quizzes are pending.</p>
              </div>
              <input
                type="checkbox"
                checked={courseAlerts}
                onChange={() => setCourseAlerts(!courseAlerts)}
                className="w-4 h-4 rounded text-govTeal-600 focus:ring-govTeal-500"
              />
            </label>

            <label className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-govBg transition-colors">
              <div>
                <p className="text-xs font-bold text-govText-primary">Cooperative Recruiter Openings</p>
                <p className="text-[11px] text-govText-muted mt-0.5">Receive alerts when jobs matching your certified skills are posted.</p>
              </div>
              <input
                type="checkbox"
                checked={jobAlerts}
                onChange={() => setJobAlerts(!jobAlerts)}
                className="w-4 h-4 rounded text-govTeal-600 focus:ring-govTeal-500"
              />
            </label>

            <label className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-govBg transition-colors">
              <div>
                <p className="text-xs font-bold text-govText-primary">SMS Alerts to Registered Mobile</p>
                <p className="text-[11px] text-govText-muted mt-0.5">Receive government training circulars via official SMS gateway.</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={() => setSmsAlerts(!smsAlerts)}
                className="w-4 h-4 rounded text-govTeal-600 focus:ring-govTeal-500"
              />
            </label>
          </div>
        </div>

        {/* Security & Password */}
        <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <Lock className="w-5 h-5 text-govTeal-600" />
            <h2 className="text-base font-bold text-govText-primary">
              {t.settings?.changePassword || 'Account Security & Password'}
            </h2>
          </div>

          {passUpdated && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Password updated successfully!</span>
            </div>
          )}

          {passError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 animate-fadeIn">
              {passError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-govText-primary">Current Password</label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-govText-primary">New Password</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-govText-primary">Confirm New Password</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* 4. Active Account & Session Management Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-govText-border shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <UserCheck className="w-5 h-5 text-govTeal-600 flex-shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-govText-primary">
                Active Account & Session
              </h2>
              <p className="text-[11px] text-govText-secondary mt-0.5">
                Manage your authenticated device session or sign out securely.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-govBg border border-govText-border/70">
            <div className="flex items-center gap-3.5 min-w-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-govTeal-100 text-govTeal-800 font-bold text-base flex items-center justify-center border-2 border-white shadow-xs flex-shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-govText-primary truncate">{currentUser.name}</p>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-govTeal-100 text-govTeal-800 border border-govTeal-200">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-govText-secondary mt-0.5 truncate">
                  {currentUser.email} {currentUser.employeeId && `• ID: ${currentUser.employeeId}`}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span>Authenticated on this device • Secure session active</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[42px] rounded-xl border border-rose-300 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer group flex-shrink-0"
            >
              <LogOut className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>{t.nav?.logout || 'Sign Out of Account'}</span>
            </button>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
