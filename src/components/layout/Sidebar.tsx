import React from 'react';
import {
  Building2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LogOut,
  HelpCircle,
  Settings,
  Globe
} from 'lucide-react';
import { useApp, getRolePrefix } from '../../context/AppContext';
import { NAVIGATION_BY_ROLE, NavItem, getTraineeNavigation } from '../../config/navigation';

interface SidebarProps {
  onLogout?: () => void;
  onNavigate?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, onNavigate }) => {
  const {
    currentUser,
    logout,
    activeView,
    navigate,
    currentLanguage,
    t,
    isHostelResident,
    traineeStatus,
  } = useApp();

  // Dynamic Navigation: Generated from trainee's programme status (Before Approval vs After Approval)
  const rawSections = currentUser.role === 'trainee'
    ? getTraineeNavigation(traineeStatus)
    : (NAVIGATION_BY_ROLE[currentUser.role] || []);

  // Security & Role Rule: Only trainees currently staying in the hostel see 'Hostel Accommodation'
  const sections = rawSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.id === 'trainee_hostel' && currentUser.role === 'trainee') {
        return Boolean(isHostelResident);
      }
      return true;
    }),
  }));

  const handleNavClick = (item: NavItem) => {
    navigate(item.route);
    if (onNavigate) {
      onNavigate(item.id);
    }
  };

  const getLocalizedLabel = (item: { id: string; label: string }) => {
    if (currentLanguage === 'hi') {
      if (item.id === 'home') return 'डैशबोर्ड';
      if (item.id === 'my_programmes') return 'मेरे कार्यक्रम';
      if (item.id === 'courses') return 'पाठ्यक्रम सूची';
      if (item.id === 'my_courses') return 'मेरे पाठ्यक्रम';
      if (item.id === 'timetable') return 'समय सारणी';
      if (item.id === 'attendance_history' || item.id === 'attendance_kiosk' || item.id === 'attendance') return 'उपस्थिति इतिहास';
      if (item.id === 'certificates') return 'प्रमाणपत्र';
      if (item.id === 'jobs') return 'रोजगार अवसर';
      if (item.id === 'my_applications') return 'मेरे आवेदन';
      if (item.id === 'career_chat') return 'सहकार सहायक AI';
      if (item.id === 'profile') return 'मेरी प्रोफ़ाइल';
      if (item.id === 'settings') return 'सेटिंग्स';
      if (item.id === 'help') return 'सहायता व संपर्क';
    } else if (currentLanguage === 'mr') {
      if (item.id === 'home') return 'डॅशबोर्ड';
      if (item.id === 'my_programmes') return 'माझे कार्यक्रम';
      if (item.id === 'courses') return 'अभ्यासक्रम सूची';
      if (item.id === 'my_courses') return 'माझे अभ्यासक्रम';
      if (item.id === 'timetable') return 'वेळापत्रक';
      if (item.id === 'attendance_history' || item.id === 'attendance_kiosk' || item.id === 'attendance') return 'हजेरी नोंद';
      if (item.id === 'certificates') return 'प्रमाणपत्रे';
      if (item.id === 'jobs') return 'रोजगार संधी';
      if (item.id === 'my_applications') return 'माझे अर्ज';
      if (item.id === 'career_chat') return 'सहकार सहायक AI';
      if (item.id === 'profile') return 'माझे प्रोफाईल';
      if (item.id === 'settings') return 'सेटिंग्ज';
      if (item.id === 'help') return 'मदत व संपर्क';
    }
    return item.label;
  };

  const getAffiliationText = () => {
    if (currentUser.role === 'trainee') {
      return currentUser.cooperativeAffiliation || 'Primary Agricultural Credit Society (PACS)';
    }
    if (currentUser.instituteId) {
      return 'VAMNICOM, Pune (Apex NCCT)';
    }
    return 'Ministry of Cooperation, New Delhi';
  };

  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 bottom-0 left-0 w-[265px] h-screen overflow-y-auto bg-white border-r border-govText-border z-30 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]"
    >
      {/* 1. Header: Brand Logo & Title */}
      <div
        onClick={() => navigate(`/${getRolePrefix(currentUser.role)}/dashboard`)}
        className="p-3 md:p-3 lg:p-5 border-b border-gray-100 flex items-center md:justify-center lg:justify-start gap-3 cursor-pointer hover:bg-govBg/50 transition-colors"
        title="VikasSetu Portal"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-govTeal-600 to-govTeal-800 flex items-center justify-center text-white shadow-md flex-shrink-0">
          <Building2 className="w-5 h-5 text-saffron-300" />
        </div>
        <div className="min-w-0 hidden lg:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-base text-govTeal-800 font-sans tracking-tight">
              VikasSetu
            </span>
          </div>
          <p className="text-[10px] text-govText-secondary font-medium tracking-tight mt-1 truncate">
            {currentLanguage === 'hi'
              ? 'एनसीसीटी प्रशिक्षण एवं कौशल'
              : currentLanguage === 'mr'
              ? 'एनसीसीटी प्रशिक्षण व रोजगार'
              : 'NCCT Training & Employment'}
          </p>
        </div>
      </div>

      {/* 2. User Profile Card (Below VikasSetu logo - clickable to Profile) */}
      <div className="p-2 md:p-2.5 lg:p-3 border-b border-gray-100 bg-[#FBFDFB]">
        <div
          onClick={() => navigate(currentUser.role === 'trainee' ? '/trainee/profile' : currentUser.role === 'institute_admin' ? '/institute-admin/profile' : currentUser.role === 'super_admin' ? '/super-admin/profile' : currentUser.role === 'faculty' ? '/faculty/profile' : `/${getRolePrefix(currentUser.role)}/settings`)}
          className="bg-white hover:bg-govTeal-50/50 cursor-pointer transition-colors rounded-xl p-1.5 md:p-1.5 lg:p-2.5 border border-gray-200/80 shadow-xs flex items-center md:justify-center lg:justify-start gap-2.5 group"
          title={`${currentUser.name} (${currentUser.role})`}
        >
          {/* Profile Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser.name}
              className="w-9 h-9 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full object-cover border border-[#005B46]"
            />
            <span className="md:block lg:hidden absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          {/* Profile Info (Desktop Only) */}
          <div className="min-w-0 flex-1 hidden lg:block">
            <h3
              className="text-xs font-bold text-gray-900 group-hover:text-govTeal-700 transition-colors leading-snug line-clamp-2 break-words"
              title={currentUser.name}
            >
              {currentUser.name}
            </h3>
            <p className="text-[10px] font-semibold text-emerald-800 capitalize leading-tight mt-0.5">
              {currentUser.role === 'trainee'
                ? currentLanguage === 'hi' ? 'प्रशिक्षु' : currentLanguage === 'mr' ? 'प्रशिक्षणार्थी' : 'Trainee'
                : currentUser.role.replace('_', ' ')}
            </p>
            <p
              className="text-[9.5px] text-gray-500 leading-tight mt-0.5 line-clamp-2 break-words"
              title={getAffiliationText()}
            >
              {getAffiliationText()}
            </p>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-govTeal-600 transition-colors flex-shrink-0 hidden lg:block" />
        </div>
      </div>

      {/* 3. Navigation List (Independent Scroll) */}
      <div className="flex-1 overflow-y-auto p-2 md:p-2 lg:p-3 space-y-3 lg:space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <p className="px-2 lg:px-3 text-[10px] font-bold text-govText-muted uppercase tracking-wider mb-1.5 hidden lg:block">
                {section.title}
              </p>
            )}

            {section.items.map(item => {
              const Icon = item.icon;
              const isCurrentRoute = window.location.pathname === item.route;
              const isActive =
                isCurrentRoute ||
                activeView === item.id ||
                ((item.id === 'home' || item.id === 'hostel_operations') && (activeView === 'home' || activeView === 'hostel_operations')) ||
                (item.id === 'hostel_blocks' && activeView === 'hostel_blocks') ||
                (item.id === 'hostel_rooms' && activeView === 'hostel_rooms') ||
                (item.id === 'hostel_requests' && activeView === 'hostel_requests') ||
                (item.id === 'hostel_allocations' && activeView === 'hostel_allocations') ||
                (item.id === 'hostel_checkin' && (activeView === 'hostel_checkin' || window.location.pathname === '/hostel-admin/gate')) ||
                (item.id === 'hostel_complaints' && (activeView === 'hostel_complaints' || window.location.pathname === '/hostel-admin/maintenance')) ||
                (item.id === 'hostel_reports' && (activeView === 'hostel_reports' || window.location.pathname === '/hostel-admin/mess')) ||
                (item.id === 'my_programmes' && (activeView === 'my_programmes' || activeView === 'programmes' || activeView === 'programme_detail' || activeView === 'catalogue')) ||
                (item.id === 'my_courses' && (activeView === 'my_courses' || activeView === 'course_player' || activeView === 'quiz' || activeView === 'courses' || activeView === 'course_detail')) ||
                (item.id === 'certificates' && (activeView === 'certificates' || activeView === 'verify_public')) ||
                (item.id === 'jobs' && (activeView === 'jobs' || activeView === 'job_detail' || activeView === 'my_applications')) ||
                ((item.id === 'attendance_history' || item.id === 'attendance_kiosk' || item.id === 'attendance') && (activeView === 'attendance_history' || activeView === 'attendance_kiosk' || activeView === 'attendance' || activeView === 'sessions')) ||
                (item.id === 'nominations' && activeView === 'nominations') ||
                (item.id === 'timetable' && activeView === 'timetable') ||
                (item.id === 'hostel_timetable' && activeView === 'hostel_timetable') ||
                (item.id === 'help' && activeView === 'help') ||
                (item.id === 'settings' && activeView === 'settings');

              const label = getLocalizedLabel(item);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={label}
                  className={`w-full flex items-center md:justify-center lg:justify-between px-2.5 lg:px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${isActive
                    ? 'bg-govTeal-600 text-white shadow-sm'
                    : 'text-govText-primary hover:bg-govTeal-50 hover:text-govTeal-800'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 lg:w-4 lg:h-4 flex-shrink-0 ${isActive
                        ? 'text-saffron-300'
                        : 'text-govTeal-600 group-hover:scale-110 transition-transform'
                        }`}
                    />
                    <span className="truncate hidden lg:inline">{label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold hidden lg:inline ${isActive
                        ? 'bg-saffron-400 text-govTeal-950'
                        : 'bg-saffron-100 text-saffron-800'
                        }`}
                    >
                      {item.badge}
                    </span>
                  ) : item.highlight ? (
                    <Sparkles className="w-3.5 h-3.5 text-saffron-400 animate-spin hidden lg:block" />
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 opacity-30 hidden lg:block ${isActive ? 'text-white opacity-80' : ''}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Cooperative Motto Watermark Area (Desktop Only) */}
        <div className="px-3 py-4 text-center select-none opacity-85 mt-auto border-t border-gray-100/80 pt-4 hidden lg:block">
          <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-emerald-50/80 border border-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#005B46]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <p className="text-[11px] font-bold text-[#005B46]">
            {currentLanguage === 'hi' || currentLanguage === 'mr'
              ? 'सहकार से समृद्धि'
              : 'Prosperity through Cooperation'}
          </p>
          <p className="text-[9px] text-gray-500 leading-tight mt-0.5">
            Together for a stronger cooperative India
          </p>
        </div>
      </div>

      {/* 4. Bottom Footer: Help, Language & Logout */}
      <div className="p-2 md:p-2 lg:p-3 border-t border-gray-100 bg-govBg/30 space-y-1">
        <button
          onClick={() => (onLogout ? onLogout() : logout())}
          title="Sign Out"
          className="w-full flex items-center md:justify-center lg:justify-start gap-2.5 px-2 lg:px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>

        <div className="pt-1.5 hidden lg:flex items-center justify-between px-2 text-[10px] text-govText-muted">
          <span>VikasSetu v1.1</span>
          <span className="font-semibold text-govTeal-700">NCCT Central Hub</span>
        </div>
      </div>
    </aside>
  );
};
