import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  ChevronDown,
  Wifi,
  WifiOff,
  Menu,
  QrCode,
  Fingerprint,
  Building2,
  Bell,
  Search,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Award,
  Clock,
  CheckCheck,
  ArrowRight,
  XCircle,
  FileText,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useApp, getRolePrefix } from '../../context/AppContext';
import { Language, AppNotification } from '../../types';
import { EkycModal } from '../common/EkycModal';

interface DashboardHeaderProps {
  onOpenMobileDrawer?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onOpenMobileDrawer }) => {
  const {
    currentUser,
    currentLanguage,
    setLanguage,
    navigate,
    isOffline,
    toggleOfflineMode,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    markNotificationAsRead
  } = useApp();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isEkycOpen, setIsEkycOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const languages: { code: Language; label: string; sub: string }[] = [
    { code: 'en', label: 'English', sub: 'National' },
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { code: 'mr', label: 'मराठी', sub: 'Marathi' },
  ];

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    setIsNotificationsOpen(false);
    if (notif.linkView) {
      navigate(notif.linkView, notif.linkParams);
    }
  };

  const getNotifIcon = (notif: AppNotification) => {
    const type = notif.type;
    switch (type) {
      case 'attendance':
        return (
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping absolute opacity-75" />
            <span className="relative w-2 h-2 rounded-full bg-emerald-600 inline-block" />
          </div>
        );
      case 'application':
        if (notif.statusVariant === 'danger') {
          return <XCircle className="w-4 h-4 text-rose-600" />;
        }
        if (notif.statusVariant === 'success') {
          return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
        }
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-govTeal-600" />;
      case 'programme':
        return <Layers className="w-4 h-4 text-govTeal-700" />;
      case 'job':
        return <Briefcase className="w-4 h-4 text-saffron-600" />;
      case 'certificate':
      case ('cert' as any):
        return <Award className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-govTeal-600" />;
    }
  };

  return (
    <>
      {/* Fixed / Sticky Header Container: Keeps Civic Top Bar + Main Header pinned at top */}
      <div className="sticky top-0 z-40 w-full bg-white shadow-xs flex-shrink-0">
        {/* 1. Subtle Government Civic Top Bar */}
        <div className="bg-govTeal-950 text-govTeal-100 text-[10px] sm:text-[11px] py-1 px-2.5 sm:px-4 border-b border-govTeal-900 select-none">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 font-medium truncate min-w-0">
              {currentLanguage !== 'en' ? (
                <>
                  <span className="font-devanagari truncate">{currentLanguage === 'mr' ? 'महाराष्ट्र / भारत सरकार' : 'भारत सरकार'}</span>
                  <span className="opacity-40 hidden min-[360px]:inline">|</span>
                  <span className="hidden min-[360px]:inline truncate">Govt. of India</span>
                  <span className="text-govTeal-400 hidden sm:inline">•</span>
                  <span className="text-saffron-300 hidden sm:inline truncate">
                    {currentLanguage === 'mr' ? 'सहकारिता मंत्रालय' : 'सहकारिता मंत्रालय (Ministry of Cooperation)'}
                  </span>
                </>
              ) : (
                <>
                  <span className="truncate">Government of India</span>
                  <span className="text-govTeal-400 hidden min-[400px]:inline">•</span>
                  <span className="text-saffron-300 hidden min-[400px]:inline truncate">Ministry of Cooperation</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] flex-shrink-0">
              <span className="hidden md:inline opacity-75">
                {currentLanguage === 'en'
                  ? 'National Council for Cooperative Training (NCCT)'
                  : 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)'}
              </span>
              <button
                onClick={() => navigate('verify_public', { certId: 'NCCT-CERT-2026-VAM-0089' })}
                className="hover:text-white underline flex items-center gap-1 text-saffron-300 font-semibold cursor-pointer"
              >
                <QrCode className="w-3 h-3 flex-shrink-0" />
                <span className="hidden min-[340px]:inline">Verify Certificate</span>
                <span className="min-[340px]:hidden">Verify</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Dashboard Application Header */}
        <header className="bg-white border-b border-govText-border">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2">

              {/* Left: Hamburger (mobile/tablet) + Brand Logo + Search (desktop) */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">

                {/* Hamburger Menu Button — tablet only (768–1023px): opens sidebar drawer.
                    Hidden on mobile (<768px) where the fixed bottom nav handles Employer navigation.
                    Hidden on desktop (≥1024px) where the sidebar is always visible. */}
                {onOpenMobileDrawer && (
                  <button
                    onClick={onOpenMobileDrawer}
                    className="hidden md:flex lg:hidden items-center justify-center w-9 h-9 rounded-xl border border-govText-border bg-govBg hover:bg-govTeal-50 text-govTeal-800 transition-colors flex-shrink-0 cursor-pointer"
                    aria-label="Open navigation menu"
                    title="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                )}

                {/* Mobile/Tablet Brand indicator (when sidebar is hidden on < 1024px) - Compact mobile header */}
                <div
                  className="lg:hidden flex items-center gap-2 cursor-pointer flex-shrink-0"
                  onClick={() => navigate(`/${getRolePrefix(currentUser.role)}/dashboard`)}
                  title="VikasSetu"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-govTeal-700 to-govTeal-900 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                    <Building2 className="w-4 h-4 text-saffron-300" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-govTeal-900 tracking-tight whitespace-nowrap">
                    VikasSetu
                  </span>
                </div>

                {/* Desktop Global Search Input (>= 1024px) */}
                <div className="hidden lg:flex items-center relative w-72 lg:w-80">
                  <input
                    type="text"
                    placeholder="Search programmes, courses, circulars..."
                    className="w-full text-xs py-2 pl-8 pr-3 rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-govText-muted absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Right: Actions, Language, e-KYC, Notifications */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">

                {/* Offline Status Toggle (Desktop only >= 1024px) */}
                <button
                  onClick={toggleOfflineMode}
                  className={`hidden lg:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] ${isOffline
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  title="Click to toggle offline mode simulation"
                >
                  {isOffline ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                      <span>Offline Mode</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Online Sync</span>
                    </>
                  )}
                </button>

                {/* Language Switcher Dropdown (Visible on all viewports) */}
                <div className="relative">
                  <button
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-govText-border bg-govBg hover:bg-white text-xs font-semibold text-govText-primary flex items-center gap-1 shadow-sm cursor-pointer min-h-[36px]"
                  >
                    <Globe className="w-3.5 h-3.5 text-govTeal-600" />
                    <span className="text-[11px] sm:text-xs">{languages.find(l => l.code === currentLanguage)?.label}</span>
                    <ChevronDown className="w-3 h-3 text-govText-muted" />
                  </button>

                  {isLangDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-36 sm:w-40 bg-white border border-govTeal-100 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
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
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-govTeal-50 transition-colors ${currentLanguage === lang.code ? 'font-bold text-govTeal-700 bg-govTeal-50/60' : 'text-govText-primary'
                            }`}
                        >
                          <span>{lang.label}</span>
                          <span className="text-[10px] text-govText-muted">{lang.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trainee Simulated e-KYC Modal Trigger (Desktop only >= 1024px, Trainees only) */}
                {currentUser.role === 'trainee' && (
                  <button
                    onClick={() => setIsEkycOpen(true)}
                    className={`hidden lg:flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition-all cursor-pointer min-h-[36px] ${currentUser.isKycVerified
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                    title="Aadhaar e-KYC Verification Status"
                  >
                    <Fingerprint className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>{currentUser.isKycVerified ? 'e-KYC Verified' : 'Verify e-KYC'}</span>
                  </button>
                )}

                {/* Interactive Notification Bell with Dropdown Panel */}
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 rounded-xl text-govTeal-900 hover:bg-govBg transition-colors flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px]"
                    title="Notifications"
                    aria-label={`View ${unreadNotificationsCount} notifications`}
                  >
                    <Bell className="w-4 h-4 text-govTeal-800" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="fixed inset-x-2.5 top-16 sm:top-auto sm:inset-x-auto sm:right-0 sm:absolute sm:mt-2 w-[calc(100vw-20px)] sm:w-[420px] max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl py-0 z-50 animate-fadeIn overflow-hidden">
                      {/* Dropdown Header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-govBg/70">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-govText-primary">
                            {currentLanguage === 'hi' ? 'सूचनाएं' : currentLanguage === 'mr' ? 'सूचना' : 'Notifications'}
                          </span>
                          {unreadNotificationsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                              {unreadNotificationsCount} new
                            </span>
                          )}
                        </div>
                        {unreadNotificationsCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-[11px] font-bold text-govTeal-700 hover:text-govTeal-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-govTeal-600" />
                            <span>Mark all as read</span>
                          </button>
                        )}
                      </div>

                      {/* Dropdown List */}
                      <div className="max-h-[75vh] sm:max-h-[460px] overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-2">
                              <Bell className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold text-govText-secondary">No notifications yet</p>
                            <p className="text-[11px] text-govText-muted mt-0.5">Updates on your programmes, courses, and sessions will appear here.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isLiveAttendance = notif.type === 'attendance' && notif.priority === 'HIGH';
                            const isDanger = notif.statusVariant === 'danger';
                            const isWarning = notif.statusVariant === 'warning';
                            const isSuccess = notif.statusVariant === 'success';

                            return (
                              <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 flex items-start gap-3.5 hover:bg-govTeal-50/50 cursor-pointer transition-all ${
                                  !notif.isRead
                                    ? isLiveAttendance
                                      ? 'bg-emerald-50/30'
                                      : isDanger
                                      ? 'bg-rose-50/30'
                                      : isWarning
                                      ? 'bg-amber-50/30'
                                      : 'bg-govTeal-50/25'
                                    : 'bg-white'
                                }`}
                              >
                                {/* Left Icon Badge */}
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs border ${
                                    isLiveAttendance
                                      ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                                      : isDanger
                                      ? 'bg-rose-100 border-rose-200 text-rose-700'
                                      : isWarning
                                      ? 'bg-amber-100 border-amber-200 text-amber-800'
                                      : isSuccess
                                      ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                      : 'bg-gray-100 border-gray-200 text-govTeal-700'
                                  }`}
                                >
                                  {getNotifIcon(notif)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Badges & Meta Row */}
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {notif.statusBadge && (
                                        <span
                                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                            isLiveAttendance
                                              ? 'bg-emerald-600 text-white animate-pulse'
                                              : isDanger
                                              ? 'bg-rose-100 text-rose-800'
                                              : isWarning
                                              ? 'bg-amber-100 text-amber-900'
                                              : isSuccess
                                              ? 'bg-emerald-100 text-emerald-900'
                                              : 'bg-govTeal-100 text-govTeal-900'
                                          }`}
                                        >
                                          {notif.statusBadge}
                                        </span>
                                      )}
                                      {notif.timeSlot && (
                                        <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5 text-gray-500" />
                                          {notif.timeSlot}
                                        </span>
                                      )}
                                    </div>

                                    {!notif.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" title="Unread" />
                                    )}
                                  </div>

                                  {/* Title */}
                                  <h4
                                    className={`text-xs leading-snug ${
                                      !notif.isRead ? 'font-black text-gray-950' : 'font-bold text-gray-800'
                                    }`}
                                  >
                                    {notif.title}
                                  </h4>

                                  {/* Subtitle / Institute / Session */}
                                  {notif.subtitle && (
                                    <p className="text-[11px] font-semibold text-gray-700 mt-0.5 line-clamp-1">
                                      {notif.subtitle}
                                    </p>
                                  )}

                                  {/* Room info */}
                                  {notif.room && (
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                      {notif.room}
                                    </p>
                                  )}

                                  {/* Message Body */}
                                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed line-clamp-2">
                                    {notif.message}
                                  </p>

                                  {/* Footer Action Row */}
                                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-gray-100/70">
                                    <span className="text-[10px] font-medium text-gray-400">
                                      {notif.timestamp}
                                    </span>
                                    {notif.actionLabel ? (
                                      <span className="text-[11px] font-bold text-govTeal-700 hover:text-govTeal-900 inline-flex items-center gap-1 group">
                                        <span>{notif.actionLabel.replace('→', '').trim()}</span>
                                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                      </span>
                                    ) : (
                                      <ArrowRight className="w-3 h-3 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-center">
                        <button
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            if (currentUser.role === 'trainee') {
                              navigate('/trainee/programmes');
                            }
                          }}
                          className="text-xs font-bold text-govTeal-700 hover:text-govTeal-900 transition-colors cursor-pointer"
                        >
                          View all notifications & applications →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </header>
      </div>

      {/* Simulated e-KYC Modal */}
      <EkycModal isOpen={isEkycOpen} onClose={() => setIsEkycOpen(false)} />
    </>
  );
};

