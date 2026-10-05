import React, { useEffect } from 'react';
import {
  Award,
  QrCode,
  HelpCircle,
  Settings,
  Bell,
  ChevronRight,
  X,
  ShieldCheck,
  UserCheck,
  Users,
  BedDouble,
  CalendarDays,
  BarChart3,
  Building2,
  FileCheck,
  Wrench,
  Utensils,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MoreBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreBottomSheet: React.FC<MoreBottomSheetProps> = ({ isOpen, onClose }) => {
  const { currentUser, navigate, notifications, currentLanguage, t, isProgrammeApproved, isBatchAssigned, isActiveStudy } = useApp();

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  // Close on escape
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

  const handleSelect = (destination: string) => {
    navigate(destination);
    onClose();
  };

  const moreItems = currentUser.role === 'super_admin'
    ? [
        {
          id: 'settings',
          route: '/super-admin/settings',
          label: currentLanguage === 'hi' ? 'सिस्टम सेटिंग्स' : currentLanguage === 'mr' ? 'सिस्टम सेटिंग्ज' : 'Settings',
          sub: 'Central configuration, sync intervals & notifications',
          icon: Settings,
          badge: null,
        },
        {
          id: 'audit_logs',
          route: '/super-admin/settings',
          label: currentLanguage === 'hi' ? 'ऑडिट एवं अनुपालन' : currentLanguage === 'mr' ? 'ऑडिट आणि अनुपालन' : 'Audit & Compliance',
          sub: 'Security audit trails, tamper-proof logs & NIC status',
          icon: ShieldCheck,
          badge: 'Verified',
        },
        {
          id: 'notifications',
          route: '/super-admin/dashboard',
          label: currentLanguage === 'hi' ? 'मंत्रालय परिपत्रक' : currentLanguage === 'mr' ? 'मंत्रालय परिपत्रके' : 'Circulars & Alerts',
          sub: 'Ministry notifications, alerts & apex directives',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? `${unreadNotifsCount} New` : 'Live',
          action: () => {
            navigate('/super-admin/dashboard');
            onClose();
          },
        },
      ]
    : currentUser.role === 'institute_admin'
    ? [
        {
          id: 'trainee_directory',
          route: '/institute-admin/trainees',
          label: currentLanguage === 'hi' ? 'प्रशिक्षु सूची' : currentLanguage === 'mr' ? 'प्रशिक्षणार्थी यादी' : 'Trainees',
          sub: 'Enrolled candidates & Aadhaar mock KYC records',
          icon: Users,
          badge: null,
        },
        {
          id: 'attendance_kiosk',
          route: '/institute-admin/sessions',
          label: currentLanguage === 'hi' ? 'सत्र एवं कियोस्क' : currentLanguage === 'mr' ? 'सत्रे आणि कियोस्क' : 'Sessions & Kiosk',
          sub: 'Live biometric check-in & lecture sessions',
          icon: QrCode,
          badge: 'Hardware',
        },
        {
          id: 'hostel_timetable',
          route: '/institute-admin/hostel',
          label: currentLanguage === 'hi' ? 'छात्रावास एवं कमरे' : currentLanguage === 'mr' ? 'वसतिगृह आणि खोल्या' : 'Hostel & Rooms',
          sub: 'Hostel blocks, occupancy & bed allocation',
          icon: BedDouble,
          badge: null,
        },
        {
          id: 'timetable',
          route: '/institute-admin/timetable',
          label: currentLanguage === 'hi' ? 'अकादमिक समय सारिणी' : currentLanguage === 'mr' ? 'अकादमिक वेळापत्रक' : 'Academic Timetable',
          sub: 'Weekly smart lab & classroom schedule grid',
          icon: CalendarDays,
          badge: null,
        },
        {
          id: 'analytics',
          route: '/institute-admin/analytics',
          label: currentLanguage === 'hi' ? 'संस्थान विश्लेषण' : currentLanguage === 'mr' ? 'संस्था विश्लेषण' : 'Institute Analytics',
          sub: 'Enrolment statistics, completion & metrics',
          icon: BarChart3,
          badge: null,
        },
        {
          id: 'settings',
          route: '/institute-admin/settings',
          label: currentLanguage === 'hi' ? 'सेटिंग्स' : currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings',
          sub: 'Device configuration & security options',
          icon: Settings,
          badge: null,
        },
      ]
    : currentUser.role === 'hostel_admin'
    ? [
        {
          id: 'hostel_blocks',
          route: '/hostel-admin/blocks',
          label: currentLanguage === 'hi' ? 'छात्रावास ब्लॉक' : currentLanguage === 'mr' ? 'वसतिगृह ब्लॉक' : 'Blocks & Floors',
          sub: 'Physical infrastructure, wing capacities & wardens',
          icon: Building2,
          badge: null,
        },
        {
          id: 'hostel_rooms',
          route: '/hostel-admin/rooms',
          label: currentLanguage === 'hi' ? 'कमरे एवं बेड मैट्रिक्स' : currentLanguage === 'mr' ? 'खोल्या व बेड मॅट्रिक्स' : 'Rooms & Bed Matrix',
          sub: 'Live interactive room grid & repair toggles',
          icon: BedDouble,
          badge: null,
        },
        {
          id: 'hostel_requests',
          route: '/hostel-admin/requests',
          label: currentLanguage === 'hi' ? 'प्रशिक्षु आवास अनुरोध' : currentLanguage === 'mr' ? 'प्रशिक्षणार्थी विनंत्या' : 'Trainee Requests',
          sub: 'Algorithmic outstation priority queue & bed allocation',
          icon: FileCheck,
          badge: 'Priority',
        },
        {
          id: 'hostel_allocations',
          route: '/hostel-admin/allocations',
          label: currentLanguage === 'hi' ? 'सक्रिय आवंटन एवं पास' : currentLanguage === 'mr' ? 'सक्रिय वाटप व पास' : 'Active Allocations',
          sub: 'Campus resident directory & digital passes',
          icon: Users,
          badge: null,
        },
        {
          id: 'hostel_checkin',
          route: '/hostel-admin/gate',
          label: currentLanguage === 'hi' ? 'गेट चेक-इन डेस्क' : currentLanguage === 'mr' ? 'गेट पडताळणी डेस्क' : 'Gate Check-In & Out',
          sub: 'Main Gate 1 console: NFC, Aadhaar & ID check',
          icon: QrCode,
          badge: 'NFC/Pass',
        },
        {
          id: 'hostel_complaints',
          route: '/hostel-admin/maintenance',
          label: currentLanguage === 'hi' ? 'शिकायतें एवं रखरखाव' : currentLanguage === 'mr' ? 'तक्रारी व दुरुस्ती' : 'Complaints & Repairs',
          sub: 'Hygiene, plumbing & electrical welfare tickets',
          icon: Wrench,
          badge: null,
        },
        {
          id: 'hostel_reports',
          route: '/hostel-admin/mess',
          label: currentLanguage === 'hi' ? 'मेस एवं उपस्थिति ऑडिट' : currentLanguage === 'mr' ? 'मेस व उपस्थिती ऑडिट' : 'Occupancy & Mess Audit',
          sub: 'Meal headcounts forecast & CSV occupancy export',
          icon: Utensils,
          badge: null,
        },
        {
          id: 'settings',
          route: '/hostel-admin/settings',
          label: currentLanguage === 'hi' ? 'सेटिंग्स' : currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings',
          sub: 'Warden credentials & security preferences',
          icon: Settings,
          badge: null,
        },
      ]
    : [
        ...(isActiveStudy
          ? [
              {
                id: 'timetable',
                route: '/trainee/timetable',
                label: currentLanguage === 'hi' ? 'समय सारणी' : currentLanguage === 'mr' ? 'वेळापत्रक' : 'Timetable',
                sub: 'Batch schedule, lecture halls & session plan',
                icon: CalendarDays,
                badge: 'Live',
              },
              {
                id: 'attendance',
                route: '/trainee/attendance',
                label: currentLanguage === 'hi' ? 'उपस्थिति इतिहास' : currentLanguage === 'mr' ? 'उपस्थिती नोंद' : 'Attendance History',
                sub: 'Physical kiosk & biometric verification log',
                icon: ShieldCheck,
                badge: null,
              },
            ]
          : []),
        ...(!isProgrammeApproved
          ? [
              {
                id: 'courses',
                route: '/trainee/courses',
                label: currentLanguage === 'hi' ? 'पाठ्यक्रम सूची' : currentLanguage === 'mr' ? 'अभ्यासक्रम सूची' : 'My Courses',
                sub: 'Independent course catalogue & self-enrollment',
                icon: BookOpen,
                badge: null,
              },
            ]
          : []),
        {
          id: 'certificates',
          route: '/trainee/certificates',
          label: currentLanguage === 'hi' ? 'प्रमाणपत्र' : currentLanguage === 'mr' ? 'प्रमाणपत्रे' : 'Certificates',
          sub: 'Verifiable credentials & public audit hashes',
          icon: Award,
          badge: null,
        },
        {
          id: 'help',
          route: '/trainee/help',
          label: currentLanguage === 'hi' ? 'सहायता व संपर्क' : currentLanguage === 'mr' ? 'मदत व संपर्क' : 'Help & Support',
          sub: 'PACS FAQs, grievances & helpline',
          icon: HelpCircle,
          badge: null,
        },
        {
          id: 'settings',
          route: '/trainee/settings',
          label: currentLanguage === 'hi' ? 'सेटिंग्स' : currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings',
          sub: 'Language, rural offline cache & security',
          icon: Settings,
          badge: null,
        },
        {
          id: 'notifications',
          route: '/trainee/dashboard',
          label: currentLanguage === 'hi' ? 'सूचनाएं' : currentLanguage === 'mr' ? 'सूचना' : 'Notifications',
          sub: 'Ministry circulars & batch alerts',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? `${unreadNotifsCount} New` : null,
          action: () => {
            navigate('home');
            onClose();
          },
        },
      ];

  return (
    <div className="fixed inset-0 z-[920] flex flex-col justify-end lg:hidden select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Panel */}
      <div
        className="relative bg-white w-full max-w-lg mx-auto rounded-t-3xl border-t border-govText-border shadow-2xl p-5 pb-[calc(1rem+68px+env(safe-area-inset-bottom))] z-10 animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-label="More Navigation Options"
      >
        {/* Pull Indicator Pill */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-govText-primary">
              {currentLanguage === 'hi' ? 'अधिक विकल्प' : currentLanguage === 'mr' ? 'अधिक पर्याय' : 'More Options'}
            </h3>
            <p className="text-[11px] text-govText-muted">
              {currentUser.role === 'super_admin'
                ? 'NCCT Central Secretariat • Ministry Apex Hub'
                : currentUser.role === 'institute_admin'
                ? 'VikasSetu Institute Admin Services'
                : 'VikasSetu Trainee Services'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-govBg hover:bg-gray-200 text-govText-secondary flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="divide-y divide-gray-100 py-1">
          {moreItems.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    handleSelect(item.route || item.id);
                  }
                }}
                className="w-full py-3.5 px-2 flex items-center justify-between hover:bg-govTeal-50/60 rounded-xl transition-colors text-left group min-h-[52px] cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-govBg group-hover:bg-govTeal-100 text-govTeal-700 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-govText-primary group-hover:text-govTeal-800">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800 border border-saffron-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-govText-muted truncate mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-govTeal-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Footer info badge */}
        <div className="mt-3 p-2.5 rounded-xl bg-govBg border border-gray-200 flex items-center justify-between text-[11px] text-govText-secondary">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-govTeal-600" />
            <span>
              {currentUser.role === 'super_admin'
                ? 'NCCT Central Secretariat • Ministry Apex Hub'
                : currentUser.role === 'institute_admin'
                ? 'VAMNICOM Institute Administration • NCCT Apex'
                : 'NCCT National Trainee Portal'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-govTeal-700 font-bold">v2.4.0</span>
        </div>
      </div>
    </div>
  );
};
