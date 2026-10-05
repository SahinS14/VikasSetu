import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Grid3X3,
  UserRound,
  Layers,
  FileCheck,
  Building2,
  Users,
  TrendingUp,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMore, isMoreOpen = false }) => {
  const { currentUser, activeView, navigate, isProgrammeApproved, isActiveStudy, isProgrammeCompleted } = useApp();

  // Bottom navigation is shown on mobile/tablet (< 1024px) for Trainee, Institute Admin, Super Admin, Faculty.
  // Employer gets its own mobile-only bottom nav (< 768px) defined below.
  if (
    currentUser.role !== 'trainee' &&
    currentUser.role !== 'institute_admin' &&
    currentUser.role !== 'super_admin' &&
    currentUser.role !== 'faculty' &&
    currentUser.role !== 'employer' &&
    currentUser.role !== 'hostel_admin'
  ) {
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMPLOYER: 4-tab bottom nav — visible ONLY on mobile (< 768px / md breakpoint)
  // On tablet (768-1023px) the hamburger drawer handles navigation instead.
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentUser.role === 'employer') {
    const employerNavItems = [
      {
        id: 'employer_dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        isActive: activeView === 'home',
        action: () => navigate('/employer/dashboard'),
      },
      {
        id: 'employer_candidates',
        label: 'Candidates',
        icon: Users,
        isActive: activeView === 'trainee_directory',
        action: () => navigate('/employer/candidates'),
      },
      {
        id: 'employer_jobs',
        label: 'Jobs',
        icon: Briefcase,
        isActive: activeView === 'jobs' || activeView === 'jobs_new',
        action: () => navigate('/employer/jobs'),
      },
      {
        id: 'employer_profile',
        label: 'Profile',
        icon: UserRound,
        isActive: activeView === 'settings',
        action: () => navigate('/employer/settings'),
      },
    ];

    return (
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-govText-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-stretch justify-around select-none pb-[env(safe-area-inset-bottom,0px)] h-[calc(64px+env(safe-area-inset-bottom,0px))]"
        aria-label="Employer Mobile Bottom Navigation"
      >
        {employerNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.action}
              aria-label={item.label}
              className={`relative flex-1 flex flex-col items-center justify-center min-w-0 py-2 px-1 gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-[#0B6E4F]' : 'text-gray-500'
              }`}
            >
              {/* Active pill at top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#0B6E4F] rounded-full" />
              )}

              {/* Icon with subtle green background when active */}
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                isActive ? 'bg-govTeal-50' : ''
              }`}>
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#0B6E4F] stroke-[2.2]' : 'text-gray-500 stroke-[1.8]'
                  }`}
                />
              </div>

              <span
                className={`text-[11px] leading-none whitespace-nowrap ${
                  isActive ? 'font-bold text-[#0B6E4F]' : 'font-semibold text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Hostel Admin Navigation (5 items: Dashboard, Hostel, Requests, More, Profile) — mobile view only (< lg)
  if (currentUser.role === 'hostel_admin') {
    const isMoreActive =
      isMoreOpen ||
      activeView === 'hostel_blocks' ||
      activeView === 'hostel_allocations' ||
      activeView === 'hostel_checkin' ||
      activeView === 'hostel_complaints' ||
      activeView === 'hostel_reports' ||
      activeView === 'settings';

    const hostelNavItems = [
      {
        id: 'hostel_dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        isActive: activeView === 'home' || activeView === 'hostel_operations',
        action: () => navigate('/hostel-admin/operations'),
      },
      {
        id: 'hostel_rooms',
        label: 'Hostel',
        icon: Building2,
        isActive: activeView === 'hostel_rooms',
        action: () => navigate('/hostel-admin/rooms'),
      },
      {
        id: 'hostel_requests',
        label: 'Requests',
        icon: FileCheck,
        isActive: activeView === 'hostel_requests',
        action: () => navigate('/hostel-admin/requests'),
      },
      {
        id: 'hostel_more',
        label: 'More',
        icon: Grid3X3,
        isActive: isMoreActive,
        action: onOpenMore,
      },
      {
        id: 'hostel_profile',
        label: 'Profile',
        icon: UserRound,
        isActive: activeView === 'profile',
        action: () => navigate('/hostel-admin/profile'),
      },
    ];

    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-govText-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-1 sm:px-2 flex items-center justify-around select-none pb-[calc(0.5rem+env(safe-area-inset-bottom))] h-[72px] sm:h-[76px]"
        aria-label="Hostel Admin Mobile Bottom Navigation"
      >
        {hostelNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.action}
              aria-label={item.label}
              className={`relative flex-1 flex flex-col items-center justify-center min-w-0 min-h-[48px] py-1 px-0.5 sm:px-1 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-[#0B6E4F]' : 'text-gray-500 hover:text-[#0B6E4F]'
              }`}
            >
              {/* Active indicator pill bar at top */}
              {isActive && (
                <span className="absolute top-0 w-6 sm:w-10 h-1 bg-[#0B6E4F] rounded-full" />
              )}

              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                  isActive ? 'text-[#0B6E4F] stroke-[2.2]' : 'text-gray-500 stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[10px] min-[360px]:text-[11px] sm:text-xs tracking-tight mt-1 leading-tight truncate max-w-full ${
                  isActive ? 'font-bold text-[#0B6E4F]' : 'font-semibold text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Faculty Navigation (5 items: Dashboard, Courses, Studio, Chat, Profile)
  if (currentUser.role === 'faculty') {
    const facultyNavItems = [
      {
        id: 'faculty_dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        isActive: activeView === 'home',
        action: () => navigate('/faculty/dashboard'),
      },
      {
        id: 'faculty_courses',
        label: 'Courses',
        icon: BookOpen,
        isActive: activeView === 'courses' || activeView === 'course_new',
        action: () => navigate('/faculty/courses'),
      },
      {
        id: 'faculty_studio',
        label: 'Studio',
        icon: Edit3,
        isActive: activeView === 'course_builder',
        action: () => navigate('/faculty/courses/crs-pacs-erp-101/edit'),
      },
      {
        id: 'faculty_chat',
        label: 'Chat',
        icon: MessageSquare,
        isActive: false,
        action: () => window.dispatchEvent(new CustomEvent('open-career-bot')),
      },
      {
        id: 'faculty_profile',
        label: 'Profile',
        icon: UserRound,
        isActive: activeView === 'profile',
        action: () => navigate('/faculty/profile'),
      },
    ];

    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-govText-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-1 sm:px-2 flex items-center justify-around select-none pb-[calc(0.5rem+env(safe-area-inset-bottom))] h-[72px] sm:h-[76px]"
        aria-label="Faculty Mobile Bottom Navigation"
      >
        {facultyNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.action}
              aria-label={item.label}
              className={`relative flex-1 flex flex-col items-center justify-center min-w-0 min-h-[48px] py-1 px-0.5 sm:px-1 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0B6E4F]'
                  : 'text-gray-500 hover:text-[#0B6E4F]'
              }`}
            >
              {/* Active indicator pill bar at top */}
              {isActive && (
                <span className="absolute top-0 w-6 sm:w-10 h-1 bg-[#0B6E4F] rounded-full" />
              )}

              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                  isActive ? 'text-[#0B6E4F] stroke-[2.2]' : 'text-gray-500 stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[10px] min-[360px]:text-[11px] sm:text-xs tracking-tight mt-1 leading-tight truncate max-w-full ${
                  isActive ? 'font-bold text-[#0B6E4F]' : 'font-semibold text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Institute Admin Navigation (4 items: Dashboard, Programmes, Nominations, More)
  if (currentUser.role === 'institute_admin') {
    const isMoreActive =
      isMoreOpen ||
      activeView === 'trainee_directory' ||
      activeView === 'attendance_kiosk' ||
      activeView === 'attendance' ||
      activeView === 'sessions' ||
      activeView === 'hostel_timetable' ||
      activeView === 'hostel' ||
      activeView === 'timetable' ||
      activeView === 'analytics' ||
      activeView === 'settings';

    const adminNavItems = [
      {
        id: 'admin_dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        isActive: activeView === 'home',
        action: () => navigate('/institute-admin/dashboard'),
      },
      {
        id: 'admin_programmes',
        label: 'Programmes',
        icon: Layers,
        isActive: activeView === 'programmes_erp',
        action: () => navigate('/institute-admin/programmes'),
      },
      {
        id: 'admin_nominations',
        label: 'Nominations',
        icon: FileCheck,
        isActive: activeView === 'nominations',
        action: () => navigate('/institute-admin/nominations'),
      },
      {
        id: 'admin_more',
        label: 'More',
        icon: Grid3X3,
        isActive: isMoreActive,
        action: onOpenMore,
      },
      {
        id: 'admin_profile',
        label: 'Profile',
        icon: UserRound,
        isActive: activeView === 'profile',
        action: () => navigate('/institute-admin/profile'),
      },
    ];

    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-govText-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-1 sm:px-2 flex items-center justify-around select-none pb-[calc(0.5rem+env(safe-area-inset-bottom))] h-[72px] sm:h-[76px]"
        aria-label="Institute Admin Mobile Bottom Navigation"
      >
        {adminNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.action}
              aria-label={item.label}
              className={`relative flex-1 flex flex-col items-center justify-center min-w-0 min-h-[48px] py-1 px-0.5 sm:px-1 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0B6E4F]'
                  : 'text-gray-500 hover:text-[#0B6E4F]'
              }`}
            >
              {/* Active indicator pill bar at top */}
              {isActive && (
                <span className="absolute top-0 w-6 sm:w-10 h-1 bg-[#0B6E4F] rounded-full" />
              )}

              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                  isActive ? 'text-[#0B6E4F] stroke-[2.2]' : 'text-gray-500 stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[10px] min-[360px]:text-[11px] sm:text-xs tracking-tight mt-1 leading-tight truncate max-w-full ${
                  isActive ? 'font-bold text-[#0B6E4F]' : 'font-semibold text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Super Admin Navigation (6 items: Dashboard, Institutes, Users, Analytics, More, Profile)
  if (currentUser.role === 'super_admin') {
    const isMoreActive = isMoreOpen || activeView === 'settings';

    const superAdminNavItems = [
      {
        id: 'super_dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        isActive: activeView === 'home',
        action: () => navigate('/super-admin/dashboard'),
      },
      {
        id: 'super_institutes',
        label: 'Institutes',
        icon: Building2,
        isActive: activeView === 'institutes_directory' || activeView === 'institute_detail',
        action: () => navigate('/super-admin/institutes'),
      },
      {
        id: 'super_users',
        label: 'Users',
        icon: Users,
        isActive: activeView === 'users',
        action: () => navigate('/super-admin/users'),
      },
      {
        id: 'super_analytics',
        label: 'Analytics',
        icon: TrendingUp,
        isActive: activeView === 'analytics',
        action: () => navigate('/super-admin/analytics'),
      },
      {
        id: 'super_more',
        label: 'More',
        icon: Grid3X3,
        isActive: isMoreActive,
        action: onOpenMore,
      },
      {
        id: 'super_profile',
        label: 'Profile',
        icon: UserRound,
        isActive: activeView === 'profile',
        action: () => navigate('/super-admin/profile'),
      },
    ];

    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-govText-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-0.5 sm:px-2 flex items-center justify-around select-none pb-[calc(0.5rem+env(safe-area-inset-bottom))] h-[72px] sm:h-[76px]"
        aria-label="Super Admin Mobile Bottom Navigation"
      >
        {superAdminNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.action}
              aria-label={item.label}
              className={`relative flex-1 flex flex-col items-center justify-center min-w-0 min-h-[48px] py-1 px-0.5 rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0B6E4F]'
                  : 'text-gray-500 hover:text-[#0B6E4F]'
              }`}
            >
              {/* Active indicator pill bar at top */}
              {isActive && (
                <span className="absolute top-0 w-6 sm:w-8 h-1 bg-[#0B6E4F] rounded-full" />
              )}

              <Icon
                className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform ${
                  isActive ? 'text-[#0B6E4F] stroke-[2.2]' : 'text-gray-500 stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[9.5px] min-[360px]:text-[10px] sm:text-xs tracking-tight mt-1 leading-tight truncate max-w-full ${
                  isActive ? 'font-bold text-[#0B6E4F]' : 'font-semibold text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Trainee Navigation (5 items: Dashboard, Courses, Jobs, More, Profile)
  const isMoreActive =
    isMoreOpen ||
    activeView === 'certificates' ||
    activeView === 'verify_public' ||
    activeView === 'attendance' ||
    activeView === 'attendance_kiosk' ||
    activeView === 'help' ||
    activeView === 'settings';

  const navItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: activeView === 'home',
      action: () => navigate('home'),
    },
    isProgrammeApproved
      ? {
          id: 'courses',
          label: 'Courses',
          icon: BookOpen,
          isActive:
            activeView === 'courses' ||
            activeView === 'course_detail' ||
            activeView === 'my_courses' ||
            activeView === 'course_player' ||
            activeView === 'quiz',
          action: () => navigate('courses'),
        }
      : {
          id: 'programmes',
          label: 'Programmes',
          icon: Layers,
          isActive:
            activeView === 'my_programmes' ||
            activeView === 'programmes' ||
            activeView === 'catalogue' ||
            activeView === 'programme_detail',
          action: () => navigate('my_programmes'),
        },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Briefcase,
      isActive: activeView === 'jobs' || activeView === 'job_detail' || activeView === 'my_applications',
      action: () => navigate('jobs'),
    },
    {
      id: 'more',
      label: 'More',
      icon: Grid3X3,
      isActive: isMoreActive,
      action: onOpenMore,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserRound,
      isActive: activeView === 'profile',
      action: () => navigate('profile'),
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-govText-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-1 sm:px-2 flex items-center justify-around select-none pb-[calc(0.5rem+env(safe-area-inset-bottom))] h-[72px] sm:h-[76px]"
      aria-label="Mobile Bottom Navigation"
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = item.isActive;

        return (
          <button
            key={item.id}
            onClick={item.action}
            aria-label={item.label}
            className={`relative flex-1 flex flex-col items-center justify-center min-w-0 min-h-[48px] py-1 px-0.5 rounded-xl transition-colors cursor-pointer ${
              isActive
                ? 'text-[#0B6E4F]'
                : 'text-gray-500 hover:text-[#0B6E4F]'
            }`}
          >
            {/* Clear active indicator bar at top of button */}
            {isActive && (
              <span className="absolute top-0 w-8 sm:w-10 h-1 bg-[#0B6E4F] rounded-full" />
            )}

            <Icon
              className={`w-6 h-6 sm:w-[26px] sm:h-[26px] transition-transform ${
                isActive ? 'text-[#0B6E4F] stroke-[2.2]' : 'text-gray-500 stroke-[1.8]'
              }`}
            />
            <span
              className={`text-[11px] sm:text-xs tracking-tight mt-1 leading-tight truncate max-w-full ${
                isActive ? 'font-bold text-[#0B6E4F]' : 'font-semibold text-gray-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
