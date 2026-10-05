import React, { useEffect } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NAVIGATION_BY_ROLE } from '../../config/navigation';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentLanguage, activeView, navigate, logout, t } = useApp();

  const sections = NAVIGATION_BY_ROLE[currentUser.role] || NAVIGATION_BY_ROLE.trainee;

  const getLocalizedLabel = (item: { id: string; label: string }) => {
    switch (item.id) {
      case 'home':
        return t.nav?.home || 'Dashboard';
      case 'courses':
        return t.catalog?.title || t.nav?.courses || 'Course Catalog';
      case 'my_courses':
        return t.myCourses?.title || 'My Courses';
      case 'certificates':
        return t.nav?.certificates || 'Certificates';
      case 'jobs':
        return t.nav?.jobs || 'Job Opportunities';
      case 'my_applications':
        return t.myApplications?.title || 'My Applications';
      case 'attendance':
      case 'attendance_kiosk':
        return t.nav?.attendance || 'Attendance';
      case 'career_chat':
      case 'career_bot':
        return t.nav?.careerBot || 'Career Sahayak AI';
      case 'profile':
        return t.profile?.title || 'My Profile';
      case 'settings':
        return t.settings?.title || 'Settings';
      case 'help':
        return t.help?.title || 'Help & Support';
      default:
        return item.label;
    }
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNav = (id: string) => {
    navigate(id);
    onClose();
  };

  return (
    <div className="lg:hidden fixed inset-0 z-[9900] flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel (82–88% max width) */}
      <div className="relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slideRight">
        {/* Top Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-govBg/50">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNav('home')}>
            <div className="w-9 h-9 rounded-xl bg-govTeal-700 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5 text-saffron-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-govTeal-900 leading-none">
                VikasSetu
              </h2>
              <p className="text-[10px] text-govText-secondary mt-0.5">
                NCCT Training Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-govText-secondary hover:bg-gray-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card - Clickable to open Profile */}
        <div className="p-3.5 border-b border-gray-100 bg-[#FBFDFB]">
          <div
            onClick={() => handleNav('profile')}
            className="bg-white rounded-xl p-2.5 border border-gray-200/80 shadow-xs flex items-center gap-2.5 cursor-pointer hover:border-govTeal-500 hover:shadow-sm transition-all"
            role="button"
            title="View full profile"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-[#005B46] flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-govText-primary truncate">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-800 capitalize font-semibold mt-0.5">
                {currentUser.role === 'trainee' ? 'Trainee' : currentUser.role.replace('_', ' ')}
              </p>
              <p className="text-[9.5px] text-gray-500 truncate leading-tight mt-0.5">
                {currentUser.cooperativeAffiliation || 'Shri Datta PACS, Niphad, Nashik'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items (Touch friendly: 48px height) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[10px] font-bold text-govText-muted uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}

              {section.items.map(item => {
                const Icon = item.icon;
                const isParentActive =
                  (item.id === 'courses' && (activeView === 'courses' || activeView === 'course_detail' || activeView === 'course_player' || activeView === 'quiz')) ||
                  (item.id === 'my_courses' && activeView === 'my_courses') ||
                  (item.id === 'jobs' && (activeView === 'jobs' || activeView === 'job_detail')) ||
                  (item.id === 'career_chat' && activeView === 'career_chat') ||
                  activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isParentActive
                        ? 'bg-govTeal-600 text-white shadow'
                        : 'text-govText-primary hover:bg-govTeal-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isParentActive ? 'text-saffron-300' : 'text-govTeal-600'}`} />
                      <span className="truncate">{getLocalizedLabel(item)}</span>
                    </div>

                    {item.badge ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-saffron-100 text-saffron-900 font-mono">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-4 h-4 opacity-40 ${isParentActive ? 'text-white opacity-80' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-govBg/50 space-y-2">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
