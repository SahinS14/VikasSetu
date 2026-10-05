import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api, clearToken } from '../lib/api';
import {
  User,
  UserRole,
  Language,
  Institute,
  Programme,
  Course,
  Enrollment,
  Session,
  AttendanceRecord,
  Certificate,
  JobPosting,
  JobInterest,
  HostelBed,
  TimetableEntry,
  Nomination,
  AppNotification,
} from '../types';
import {
  SEED_INSTITUTES,
  SEED_USERS,
  SEED_COURSES,
  SEED_PROGRAMMES,
  SEED_ENROLLMENTS,
  SEED_CERTIFICATES,
  SEED_SESSIONS,
  SEED_ATTENDANCE,
  SEED_NOMINATIONS,
  SEED_JOBS,
  SEED_JOB_INTERESTS,
  SEED_HOSTEL_BEDS,
  SEED_TIMETABLE,
  SEED_NOTIFICATIONS,
} from '../data/seedData';
import { getTranslation } from '../locales';
import {
  TraineeStatusContext,
  TraineeProgrammeStatus,
  isTraineeProgrammeApproved,
  isTraineeBatchAssigned,
  isTraineeInActiveStudy,
  isTraineeCompleted,
  resolveEnrollmentStatus,
  resolveApplicationStatus,
} from '../config/navigation';

interface AppContextType {
  currentUser: User;
  isAuthenticated: boolean;
  currentLanguage: Language;
  t: ReturnType<typeof getTranslation>;
  institutes: Institute[];
  programmes: Programme[];
  traineeStatus: TraineeStatusContext;
  isProgrammeApproved: boolean;
  isBatchAssigned: boolean;
  isActiveStudy: boolean;
  isProgrammeCompleted: boolean;
  setTraineeProgrammeStatus: (status: TraineeProgrammeStatus, batchId?: string | null) => void;
  refreshTraineeProgrammeStatus: () => Promise<void>;
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  nominations: Nomination[];
  jobs: JobPosting[];
  jobInterests: JobInterest[];
  hostelBeds: HostelBed[];
  timetable: TimetableEntry[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isOffline: boolean;
  offlineQueueCount: number;
  activeView: string;
  activeViewParams: any;
  isHostelResident: boolean;
  hostelResidentLoading: boolean;
  traineeActiveSession: any | null;
  setTraineeActiveSession: (session: any | null) => void;
  refreshTraineeActiveSession: () => Promise<void>;

  // Actions
  refreshHostelResidentStatus: () => Promise<void>;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  switchUser: (userId: string) => void;
  logout: () => void;
  setLanguage: (lang: Language) => void;
  navigate: (view: string, params?: any) => void;
  enrollInCourse: (courseId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  // answers: raw selected option indices (0-based) — graded server-side for Trainee role
  submitQuiz: (courseId: string, quizId: string, answers: number[], assessmentResult?: any) => Promise<{ passed: boolean; certId?: string; scorePercent?: number }>;
  markAttendance: (sessionId: string, method: 'qr' | 'face', targetUserId?: string, confidence?: number) => { success: boolean; message: string };
  updateNominationStatus: (nominationId: string, status: 'approved' | 'rejected') => void;
  bulkUpdateNominationStatus: (nominationIds: string[], status: 'approved' | 'rejected') => void;
  bulkImportNominations: (programmeId: string, records: Array<{ name: string; email: string; coop: string }>) => number;
  applyForJob: (jobId: string) => boolean;
  createJobPosting: (job: Omit<JobPosting, 'id' | 'postedDate'>) => void;
  updateJobPosting: (jobId: string, updates: Partial<JobPosting>) => void;
  deleteJobPosting: (jobId: string) => void;
  updateJobInterestStatus: (interestId: string, status: 'submitted' | 'reviewed' | 'shortlisted') => void;
  updateHostelBed: (bedId: string, updates: Partial<HostelBed>) => void;
  verifyEkyc: (aadhaarNumber: string) => void;
  toggleOfflineMode: () => void;
  addNewCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;
  markAllNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
  clearReadNotifications: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => User;
  toggleUserStatus: (userId: string) => void;
  setEnrollments?: React.Dispatch<React.SetStateAction<Enrollment[]>>;
  setCourses?: React.Dispatch<React.SetStateAction<Course[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const ROLE_PREFIXES: Record<UserRole, string> = {
  trainee: '/trainee',
  institute_admin: '/institute-admin',
  super_admin: '/super-admin',
  faculty: '/faculty',
  employer: '/employer',
  device_operator: '/device',
  hostel_admin: '/hostel-admin',
};

export const normalizeRole = (role?: string): UserRole => {
  if (!role) return 'trainee';
  const r = role.toLowerCase().trim();
  if (r === 'super_admin' || r === 'superadmin') return 'super_admin';
  if (r === 'institute_admin' || r === 'instituteadmin') return 'institute_admin';
  if (r === 'faculty') return 'faculty';
  if (r === 'employer') return 'employer';
  if (r === 'device_operator' || r === 'deviceoperator' || r === 'device') return 'device_operator';
  if (r === 'hostel_admin' || r === 'hosteladmin' || r === 'hostel' || r === 'warden') return 'hostel_admin';
  return 'trainee';
};

export const getRolePrefix = (role?: string): string => {
  const norm = normalizeRole(role);
  return ROLE_PREFIXES[norm] || '/trainee';
};

export const getRoleFromPrefix = (path: string): UserRole | null => {
  if (path.startsWith('/trainee')) return 'trainee';
  if (path.startsWith('/institute-admin')) return 'institute_admin';
  if (path.startsWith('/super-admin') || path.startsWith('/admin')) return 'super_admin';
  if (path.startsWith('/faculty')) return 'faculty';
  if (path.startsWith('/employer')) return 'employer';
  if (path.startsWith('/device')) return 'device_operator';
  if (path.startsWith('/hostel-admin') || path.startsWith('/hostel')) return 'hostel_admin';
  return null;
};

// Clean path resolution without hash routing + Role-based namespaced route guarding
const resolveRoute = (isAuth: boolean, userRole?: UserRole): { view: string; params: any } => {
  const path = window.location.pathname;
  const hash = window.location.hash;

  // Immediately clean up any legacy hash in URL
  if (hash) {
    const lowerHash = hash.toLowerCase();
    if (lowerHash.startsWith('#/skill-card/')) {
      const token = hash.replace(/^#\/skill-card\//i, '');
      window.history.replaceState({}, '', `/skill-card/${token}`);
      return { view: 'skill_card_public', params: { token } };
    }
    if (lowerHash.startsWith('#/verify/')) {
      const certId = hash.replace(/^#\/verify\//i, '');
      window.history.replaceState({}, '', `/verify/${certId}`);
      return { view: 'verify_public', params: { certId } };
    }
    if (lowerHash === '#/signup' || lowerHash === '#/register' || lowerHash === '#signup' || lowerHash === '#register') {
      window.history.replaceState({}, '', '/register');
      return { view: 'signup', params: null };
    }
    if (lowerHash === '#/forgot-password' || lowerHash === '#forgot-password') {
      window.history.replaceState({}, '', '/forgot-password');
      return { view: 'forgot_password', params: null };
    }
    if (lowerHash === '#/dashboard' || lowerHash === '#dashboard' || lowerHash === '#/home' || lowerHash === '#home') {
      if (isAuth) {
        const dest = `${getRolePrefix(userRole)}/dashboard`;
        window.history.replaceState({}, '', dest);
        return { view: 'home', params: null };
      } else {
        window.history.replaceState({}, '', '/');
        return { view: 'login', params: null };
      }
    }
    // Clean up any other hash to root '/'
    window.history.replaceState({}, '', '/');
    return { view: 'login', params: null };
  }

  // Pure HTML5 pathname routing - Public unauthenticated routes
  if (path.startsWith('/skill-card/')) {
    const token = path.replace(/^\/skill-card\//, '');
    return { view: 'skill_card_public', params: { token } };
  }
  if (path.startsWith('/verify/')) {
    const certId = path.replace(/^\/verify\//, '');
    return { view: 'verify_public', params: { certId } };
  }
  if (path === '/register' || path === '/signup') {
    if (path !== '/register') {
      window.history.replaceState({}, '', '/register');
    }
    return { view: 'signup', params: null };
  }
  if (path === '/forgot-password') {
    return { view: 'forgot_password', params: null };
  }

  // Protected route gate
  if (!isAuth) {
    if (path !== '/' && path !== '/login') {
      window.history.replaceState({}, '', '/');
    }
    return { view: 'login', params: null };
  }

  const role = userRole || 'trainee';
  const rolePrefix = getRolePrefix(role);

  // ROUTE GUARD: Check if user is attempting to access a role namespace outside their role
  const pathRole = getRoleFromPrefix(path);
  if (pathRole && pathRole !== role) {
    const fallbackPath = `${rolePrefix}/dashboard`;
    window.history.replaceState({}, '', fallbackPath);
    return { view: 'home', params: null };
  }

  // Root or generic dashboard redirects for authenticated users
  if (path === '/' || path === '/dashboard' || path === '/home') {
    const target = `${rolePrefix}/dashboard`;
    window.history.replaceState({}, '', target);
    return { view: 'home', params: null };
  }

  // Support /admin/dashboard - route guard verifies super_admin role
  if (path === '/admin/dashboard' || path === '/admin') {
    if (role === 'super_admin') {
      window.history.replaceState({}, '', '/super-admin/dashboard');
      return { view: 'home', params: null };
    }
    // Deny non-admin and redirect to their own dashboard
    window.history.replaceState({}, '', `${rolePrefix}/dashboard`);
    return { view: 'home', params: null };
  }

  // Legacy flat routes redirection into user's role namespace
  if (path === '/settings' || path === '/dashboard/settings') {
    window.history.replaceState({}, '', `${rolePrefix}/settings`);
    return { view: 'settings', params: null };
  }

  // 1. TRAINEE ROUTES (/trainee/...)
  if (path === '/trainee/dashboard' || path === '/trainee') {
    return { view: 'home', params: null };
  }
  const courseLearnMatch = path.match(/^\/(?:trainee\/)?courses\/([^/]+)\/learn/);
  if (courseLearnMatch) {
    return { view: 'course_player', params: { courseId: courseLearnMatch[1] } };
  }
  const courseQuizMatch = path.match(/^\/(?:trainee\/)?courses\/([^/]+)\/quiz(?:\/([^/]+))?/);
  if (courseQuizMatch) {
    return { view: 'quiz', params: { courseId: courseQuizMatch[1], moduleId: courseQuizMatch[2] } };
  }
  const courseDetailMatch = path.match(/^\/(?:trainee\/)?courses\/([^/]+)$/);
  if (courseDetailMatch) {
    return { view: 'course_detail', params: { courseId: courseDetailMatch[1] } };
  }
  if (path === '/trainee/courses' || path === '/trainee/my-courses' || path === '/my-courses' || path === '/courses') {
    if (path !== '/trainee/courses') window.history.replaceState({}, '', '/trainee/courses');
    return { view: 'my_courses', params: null };
  }
  if (path === '/trainee/course-catalog' || path === '/course-catalog' || path === '/trainee/catalog/courses') {
    if (path !== '/trainee/course-catalog') window.history.replaceState({}, '', '/trainee/course-catalog');
    return { view: 'courses', params: null };
  }
  if (path === '/trainee/catalogue' || path === '/trainee/programmes/catalogue' || path === '/catalogue') {
    if (path !== '/trainee/catalogue') window.history.replaceState({}, '', '/trainee/catalogue');
    return { view: 'programme_catalogue', params: null };
  }
  const progDetailMatch = path.match(/^\/(?:trainee\/)?programmes\/([^/]+)$/);
  if (progDetailMatch && progDetailMatch[1] !== 'my' && progDetailMatch[1] !== 'catalogue') {
    return { view: 'programme_detail', params: { programmeId: progDetailMatch[1] } };
  }
  if (path === '/trainee/programmes' || path === '/programmes') {
    if (path !== '/trainee/programmes') window.history.replaceState({}, '', '/trainee/programmes');
    return { view: 'my_programmes', params: null };
  }
  if (path === '/trainee/timetable' || path === '/timetable') {
    if (path !== '/trainee/timetable') window.history.replaceState({}, '', '/trainee/timetable');
    return { view: 'trainee_timetable', params: null };
  }
  const certDetailMatch = path.match(/^\/(?:trainee\/)?certificates\/([^/]+)$/);
  if (certDetailMatch) {
    return { view: 'certificates', params: { certId: certDetailMatch[1] } };
  }
  if (path === '/trainee/certificates' || path === '/certificates') {
    if (path !== '/trainee/certificates') window.history.replaceState({}, '', '/trainee/certificates');
    return { view: 'certificates', params: null };
  }
  const jobDetailMatch = path.match(/^\/(?:trainee\/)?jobs\/([^/]+)$/);
  if (jobDetailMatch) {
    return { view: 'job_detail', params: { jobId: jobDetailMatch[1] } };
  }
  if (path === '/trainee/jobs' || path === '/jobs' || path === '/trainee/job-opportunities' || path === '/job-opportunities') {
    if (path !== '/trainee/jobs') window.history.replaceState({}, '', '/trainee/jobs');
    return { view: 'jobs', params: null };
  }
  if (path === '/trainee/documents' || path === '/documents') {
    if (path !== '/trainee/documents') window.history.replaceState({}, '', '/trainee/documents');
    return { view: 'document_vault', params: null };
  }
  if (path === '/trainee/profile-readiness' || path === '/profile-readiness') {
    if (path !== '/trainee/profile-readiness') window.history.replaceState({}, '', '/trainee/profile-readiness');
    return { view: 'profile_readiness', params: null };
  }
  if (path === '/trainee/applications' || path === '/trainee/my-applications' || path === '/my-applications') {
    if (path !== '/trainee/applications') window.history.replaceState({}, '', '/trainee/applications');
    return { view: 'my_applications', params: null };
  }
  if (path === '/trainee/career-chat' || path === '/career-chat') {
    if (path !== '/trainee/career-chat') window.history.replaceState({}, '', '/trainee/career-chat');
    return { view: 'career_chat', params: null };
  }
  if (path === '/trainee/scan-attendance' || path === '/scan-attendance' || path === '/trainee/attendance' || path === '/attendance') {
    if (path !== '/trainee/attendance') window.history.replaceState({}, '', '/trainee/attendance');
    return { view: 'attendance_history', params: null };
  }
  if (path === '/trainee/profile' || path === '/profile') {
    if (path !== '/trainee/profile') window.history.replaceState({}, '', '/trainee/profile');
    return { view: 'profile', params: null };
  }
  if (path === '/trainee/settings') {
    return { view: 'settings', params: null };
  }
  if (path === '/trainee/hostel' || path === '/hostel') {
    if (path !== '/trainee/hostel') window.history.replaceState({}, '', '/trainee/hostel');
    return { view: 'trainee_hostel', params: null };
  }
  if (path === '/trainee/help' || path === '/help') {
    if (path !== '/trainee/help') window.history.replaceState({}, '', '/trainee/help');
    return { view: 'help', params: null };
  }

  // 2. INSTITUTE ADMIN ROUTES (/institute-admin/...)
  if (path === '/institute-admin/dashboard' || path === '/institute-admin' || path === '/dashboard/admin') {
    if (path !== '/institute-admin/dashboard') window.history.replaceState({}, '', '/institute-admin/dashboard');
    return { view: 'home', params: null };
  }
  if (path === '/institute-admin/programmes' || path === '/dashboard/admin/programmes') {
    if (path !== '/institute-admin/programmes') window.history.replaceState({}, '', '/institute-admin/programmes');
    return { view: 'programmes_erp', params: null };
  }
  if (path === '/institute-admin/nominations' || path === '/dashboard/admin/nominations') {
    if (path !== '/institute-admin/nominations') window.history.replaceState({}, '', '/institute-admin/nominations');
    return { view: 'nominations', params: null };
  }
  if (path === '/institute-admin/trainees' || path === '/dashboard/admin/trainees') {
    if (path !== '/institute-admin/trainees') window.history.replaceState({}, '', '/institute-admin/trainees');
    return { view: 'trainee_directory', params: null };
  }
  if (path === '/institute-admin/sessions' || path === '/institute-admin/attendance' || path === '/dashboard/admin/attendance') {
    if (path !== '/institute-admin/attendance') window.history.replaceState({}, '', '/institute-admin/attendance');
    return { view: 'attendance_devices', params: null };
  }
  if (path === '/institute-admin/hostel' || path === '/dashboard/admin/hostel') {
    if (path !== '/institute-admin/hostel') window.history.replaceState({}, '', '/institute-admin/hostel');
    return { view: 'hostel_timetable', params: null };
  }
  if (path === '/institute-admin/timetable' || path === '/dashboard/admin/timetable') {
    if (path !== '/institute-admin/timetable') window.history.replaceState({}, '', '/institute-admin/timetable');
    return { view: 'timetable', params: null };
  }
  if (path === '/institute-admin/analytics' || path === '/dashboard/admin/analytics') {
    if (path !== '/institute-admin/analytics') window.history.replaceState({}, '', '/institute-admin/analytics');
    return { view: 'analytics', params: null };
  }
  if (path === '/institute-admin/settings') {
    return { view: 'settings', params: null };
  }
  if (path === '/institute-admin/profile' || path === '/dashboard/admin/profile') {
    if (path !== '/institute-admin/profile') window.history.replaceState({}, '', '/institute-admin/profile');
    return { view: 'profile', params: null };
  }

  // 3. SUPER ADMIN ROUTES (/super-admin/...)
  if (path === '/super-admin/dashboard' || path === '/super-admin' || path === '/dashboard/super-admin') {
    if (path !== '/super-admin/dashboard') window.history.replaceState({}, '', '/super-admin/dashboard');
    return { view: 'home', params: null };
  }
  if (path === '/super-admin/analytics' || path === '/dashboard/super-admin/analytics') {
    if (path !== '/super-admin/analytics') window.history.replaceState({}, '', '/super-admin/analytics');
    return { view: 'analytics', params: null };
  }
  const instituteDetailMatch = path.match(/^\/super-admin\/institutes\/([^/]+)$/);
  if (instituteDetailMatch) {
    return { view: 'institute_detail', params: { instituteId: instituteDetailMatch[1] } };
  }
  if (path === '/super-admin/institutes' || path === '/dashboard/super-admin/institutes') {
    if (path !== '/super-admin/institutes') window.history.replaceState({}, '', '/super-admin/institutes');
    return { view: 'institutes_directory', params: null };
  }
  if (path === '/super-admin/users' || path === '/dashboard/super-admin/users') {
    if (path !== '/super-admin/users') window.history.replaceState({}, '', '/super-admin/users');
    return { view: 'users', params: null };
  }
  if (path === '/super-admin/settings') {
    return { view: 'settings', params: null };
  }
  if (path === '/super-admin/profile' || path === '/dashboard/super-admin/profile') {
    if (path !== '/super-admin/profile') window.history.replaceState({}, '', '/super-admin/profile');
    return { view: 'profile', params: null };
  }

  // 4. FACULTY ROUTES (/faculty/...)
  if (path === '/faculty/dashboard' || path === '/faculty' || path === '/dashboard/faculty') {
    if (path !== '/faculty/dashboard') window.history.replaceState({}, '', '/faculty/dashboard');
    return { view: 'home', params: null };
  }
  if (path === '/faculty/courses/new') {
    return { view: 'course_new', params: null };
  }
  if (path === '/faculty/courses' || path === '/dashboard/faculty/courses') {
    if (path !== '/faculty/courses') window.history.replaceState({}, '', '/faculty/courses');
    return { view: 'courses', params: null };
  }
  if (path === '/faculty/attendance' || path === '/faculty/sessions') {
    if (path !== '/faculty/attendance') window.history.replaceState({}, '', '/faculty/attendance');
    return { view: 'attendance', params: null };
  }
  if (path === '/faculty/timetable' || path === '/faculty/schedule') {
    if (path !== '/faculty/timetable') window.history.replaceState({}, '', '/faculty/timetable');
    return { view: 'faculty_timetable', params: null };
  }
  const facultyEditCourseMatch = path.match(/^\/faculty\/courses\/([^/]+)\/edit-course/);
  if (facultyEditCourseMatch) {
    return { view: 'course_new', params: { editCourseId: facultyEditCourseMatch[1] } };
  }
  const facultyEditMatch = path.match(/^\/faculty\/courses\/([^/]+)\/edit/);
  if (facultyEditMatch) {
    return { view: 'course_builder', params: { courseId: facultyEditMatch[1] } };
  }
  if (path === '/faculty/settings') {
    return { view: 'settings', params: null };
  }
  if (path === '/faculty/profile') {
    return { view: 'profile', params: null };
  }

  // 5. EMPLOYER ROUTES (/employer/...)
  if (path === '/employer/dashboard' || path === '/employer' || path === '/dashboard/employer') {
    if (path !== '/employer/dashboard') window.history.replaceState({}, '', '/employer/dashboard');
    return { view: 'home', params: null };
  }
  if (path === '/employer/candidates' || path === '/dashboard/employer/candidates') {
    if (path !== '/employer/candidates') window.history.replaceState({}, '', '/employer/candidates');
    return { view: 'trainee_directory', params: null };
  }
  if (path === '/employer/jobs/new') {
    return { view: 'jobs_new', params: null };
  }
  if (path === '/employer/jobs' || path === '/dashboard/employer/jobs') {
    if (path !== '/employer/jobs') window.history.replaceState({}, '', '/employer/jobs');
    return { view: 'jobs', params: null };
  }

  // 6. DEVICE OPERATOR ROUTES (/device/...)
  if (path === '/device/dashboard' || path === '/device' || path === '/dashboard/device') {
    if (path !== '/device/dashboard') window.history.replaceState({}, '', '/device/dashboard');
    return { view: 'home', params: null };
  }
  if (path === '/device/monitoring' || path === '/device/live') {
    return { view: 'device_monitoring', params: null };
  }
  if (path === '/device/devices' || path === '/device/fleet') {
    return { view: 'device_fleet', params: null };
  }
  if (path === '/device/test' || path === '/device/diagnostics') {
    return { view: 'device_test', params: null };
  }
  if (path === '/device/sync-queue' || path === '/device/sync') {
    return { view: 'device_sync_queue', params: null };
  }
  if (path === '/device/incidents' || path === '/device/issues') {
    return { view: 'device_incidents', params: null };
  }
  if (path === '/device/maintenance') {
    return { view: 'device_maintenance', params: null };
  }
  if (path === '/device/settings') {
    return { view: 'settings', params: null };
  }

  // 7. HOSTEL ADMIN ROUTES (/hostel-admin/...)
  if (path === '/hostel-admin/dashboard' || path === '/hostel-admin' || path === '/hostel-admin/operations') {
    return { view: 'hostel_operations', params: null };
  }
  if (path === '/hostel-admin/blocks') {
    return { view: 'hostel_blocks', params: null };
  }
  if (path === '/hostel-admin/rooms') {
    return { view: 'hostel_rooms', params: null };
  }
  if (path === '/hostel-admin/requests') {
    return { view: 'hostel_requests', params: null };
  }
  if (path === '/hostel-admin/allocations') {
    return { view: 'hostel_allocations', params: null };
  }
  if (path === '/hostel-admin/checkin' || path === '/hostel-admin/gate') {
    return { view: 'hostel_checkin', params: null };
  }
  if (path === '/hostel-admin/complaints' || path === '/hostel-admin/maintenance') {
    return { view: 'hostel_complaints', params: null };
  }
  if (path === '/hostel-admin/reports' || path === '/hostel-admin/mess') {
    return { view: 'hostel_reports', params: null };
  }
  if (path === '/hostel-admin/settings') {
    return { view: 'settings', params: null };
  }
  if (path === '/hostel-admin/profile') {
    return { view: 'profile', params: null };
  }

  // Fallback to role dashboard
  const fallback = `${rolePrefix}/dashboard`;
  window.history.replaceState({}, '', fallback);
  return { view: 'home', params: null };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence / Initial State
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('ss_user') || sessionStorage.getItem('ss_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return SEED_USERS[0]; // Rameshwar Patil (Trainee)
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const hasAuth = localStorage.getItem('ss_auth') === 'true' || sessionStorage.getItem('ss_auth') === 'true';
    const hasToken = Boolean(localStorage.getItem('ss_jwt') || sessionStorage.getItem('ss_jwt'));
    return hasAuth && hasToken;
  });

  const [currentLanguage, setCurrentLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('ss_lang');
    return (saved as Language) || 'en';
  });

  // Resolve initial view based on current browser URL and authenticated user role
  const initialRoute = resolveRoute(localStorage.getItem('ss_auth') === 'true', currentUser.role);
  const [activeView, setActiveView] = useState<string>(initialRoute.view);
  const [activeViewParams, setActiveViewParams] = useState<any>(initialRoute.params);

  const [institutes] = useState<Institute[]>(SEED_INSTITUTES);
  const [programmes, setProgrammes] = useState<Programme[]>(SEED_PROGRAMMES);
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('ss_courses_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_COURSES;
  });
  const [enrollments, setEnrollments] = useState<Enrollment[]>(SEED_ENROLLMENTS);
  const [certificates, setCertificates] = useState<Certificate[]>(SEED_CERTIFICATES);
  const [sessions, setSessions] = useState<Session[]>(SEED_SESSIONS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SEED_ATTENDANCE);
  const [nominations, setNominations] = useState<Nomination[]>(SEED_NOMINATIONS);
  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    const saved = localStorage.getItem('ss_jobs_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
      } catch (e) {}
    }
    return SEED_JOBS;
  });
  const [jobInterests, setJobInterests] = useState<JobInterest[]>(() => {
    const saved = localStorage.getItem('ss_job_interests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_JOB_INTERESTS;
  });
  const [hostelBeds, setHostelBeds] = useState<HostelBed[]>(SEED_HOSTEL_BEDS);
  const [timetable, setTimetable] = useState<TimetableEntry[]>(SEED_TIMETABLE);
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ss_users_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return SEED_USERS.map(u => ({ ...u, status: u.status || 'active' }));
  });

  // Authoritative database-backed hostel resident eligibility (defaults to false / fail-closed)
  const [isHostelResident, setIsHostelResident] = useState<boolean>(false);
  const [hostelResidentLoading, setHostelResidentLoading] = useState<boolean>(false);

  const refreshHostelResidentStatus = useCallback(async () => {
    if (currentUser.role !== 'trainee') {
      setIsHostelResident(false);
      return;
    }
    try {
      setHostelResidentLoading(true);
      const res = await api.hostel.getResidentStatus();
      setIsHostelResident(Boolean(res && res.isHostelResident));
    } catch {
      // Fail closed
      setIsHostelResident(false);
    } finally {
      setHostelResidentLoading(false);
    }
  }, [currentUser.role]);

  useEffect(() => {
    refreshHostelResidentStatus();
  }, [currentUser.id, currentUser.role, refreshHostelResidentStatus]);

  // Dynamic Trainee Programme Status & Batch Assignment State (Controls slider states)
  const [traineeStatus, setTraineeStatus] = useState<TraineeStatusContext>(() => {
    const saved = localStorage.getItem('ss_trainee_status');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      programmeStatus: currentUser.programmeStatus || 'NOT_REGISTERED',
      applicationStatus: currentUser.applicationStatus,
      enrollmentStatus: currentUser.enrollmentStatus,
      batchId: currentUser.batchId ?? null,
      timetableStatus: currentUser.timetableStatus ?? null,
      rejectionReason: currentUser.rejectionReason,
    };
  });

  const refreshTraineeProgrammeStatus = useCallback(async () => {
    if (currentUser.role !== 'trainee') return;
    try {
      const applications = await api.programmes.getMyApplications();
      if (Array.isArray(applications) && applications.length > 0) {
        // Prioritize approved/enrolled applications
        const approvedApp = applications.find(
          (a) => (a.status || '').toUpperCase() === 'APPROVED' || (a.status || '').toUpperCase() === 'ACCEPTED'
        );
        const targetApp = approvedApp || applications[0];
        const status = (targetApp.status || '').toUpperCase();
        const batchId = targetApp.batchId || targetApp.batch?.id || null;
        const updated: TraineeStatusContext = {
          programmeStatus: status,
          applicationStatus: targetApp.applicationStatus || status,
          enrollmentStatus: targetApp.enrollmentStatus || status,
          batchId,
          timetableStatus: targetApp.timetableStatus || (batchId ? 'PUBLISHED' : null),
          rejectionReason: targetApp.rejectionReason,
        };
        setTraineeStatus(updated);
        localStorage.setItem('ss_trainee_status', JSON.stringify(updated));
      }
    } catch {
      // Keep existing status
    }
  }, [currentUser.role]);

  useEffect(() => {
    if (currentUser.role === 'trainee') {
      const fallback: TraineeStatusContext = {
        programmeStatus: currentUser.programmeStatus || 'NOT_REGISTERED',
        applicationStatus: currentUser.applicationStatus,
        enrollmentStatus: currentUser.enrollmentStatus,
        batchId: currentUser.batchId ?? null,
        timetableStatus: currentUser.timetableStatus ?? null,
        rejectionReason: currentUser.rejectionReason,
      };
      setTraineeStatus(fallback);
      refreshTraineeProgrammeStatus();
    }
  }, [currentUser.id, currentUser.role, currentUser.programmeStatus, currentUser.batchId, currentUser.timetableStatus, refreshTraineeProgrammeStatus]);

  const setTraineeProgrammeStatus = useCallback((status: TraineeProgrammeStatus, batchId?: string | null) => {
    const assignedBatch = batchId !== undefined ? batchId : (status === 'APPROVED' || status === 'BATCH_ASSIGNED' ? 'batch-pgdm-2026-a' : null);
    const updated: TraineeStatusContext = {
      programmeStatus: status,
      applicationStatus: status,
      enrollmentStatus: status,
      batchId: assignedBatch,
      timetableStatus: assignedBatch ? 'PUBLISHED' : null,
    };
    setTraineeStatus(updated);
    localStorage.setItem('ss_trainee_status', JSON.stringify(updated));
  }, []);

  const isProgrammeApproved = isTraineeProgrammeApproved(traineeStatus.programmeStatus);
  const isBatchAssigned = isTraineeBatchAssigned(traineeStatus.batchId, traineeStatus.programmeStatus);
  const resolvedEnrollment = resolveEnrollmentStatus(traineeStatus);
  const isActiveStudy = resolvedEnrollment === 'BATCH_ASSIGNED' || resolvedEnrollment === 'ACTIVE'
    || isTraineeInActiveStudy(traineeStatus.programmeStatus);
  const isProgrammeCompleted = resolvedEnrollment === 'COMPLETED'
    || isTraineeCompleted(traineeStatus.programmeStatus);
  const resolvedApplicationStatus = resolveApplicationStatus(traineeStatus);

  const addUser = (newUser: Omit<User, 'id'>) => {
    const created: User = {
      ...newUser,
      id: `usr-${Date.now()}`,
      status: newUser.status || 'active',
      isKycVerified: true,
      avatarUrl: newUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    setUsers(prev => {
      const next = [created, ...prev];
      localStorage.setItem('ss_users_list', JSON.stringify(next));
      return next;
    });
    return created;
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === userId) {
          const currentStatus = u.status || 'active';
          return { ...u, status: (currentStatus === 'active' ? 'deactivated' : 'active') as 'active' | 'deactivated' };
        }
        return u;
      });
      localStorage.setItem('ss_users_list', JSON.stringify(next));
      return next;
    });
  };
  const [baseNotifications, setBaseNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ss_notifs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return SEED_NOTIFICATIONS;
  });

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ss_read_notif_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [traineeActiveSession, setTraineeActiveSession] = useState<any | null>(null);

  // Auto-refresh active session for trainee to keep live attendance notification personalized
  const refreshTraineeActiveSession = useCallback(async () => {
    if (currentUser.role !== 'trainee') {
      setTraineeActiveSession(null);
      return;
    }
    try {
      const data = await api.trainee.getDashboard();
      if (data && data.activeSession) {
        setTraineeActiveSession(data.activeSession);
      } else {
        setTraineeActiveSession(null);
      }
    } catch {
      // Offline fallback or error
    }
  }, [currentUser.role]);

  useEffect(() => {
    if (currentUser.role === 'trainee') {
      refreshTraineeActiveSession();
    }
  }, [currentUser.id, currentUser.role, refreshTraineeActiveSession]);

  // Dynamically synthesized & prioritized notifications list
  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    if (currentUser.role === 'trainee') {
      // 1. Personalized Live Attendance Notification (HIGH Priority)
      // Strictly shown ONLY when trainee is enrolled, session is active, and trainee has not checked in
      if (
        traineeActiveSession &&
        traineeActiveSession.active &&
        !traineeActiveSession.userCheckedIn &&
        (isProgrammeApproved || isBatchAssigned || traineeStatus.programmeStatus === 'APPROVED' || traineeStatus.programmeStatus === 'BATCH_ASSIGNED')
      ) {
        const notifId = `notif-live-attendance-${traineeActiveSession.id || 'active'}`;
        list.push({
          id: notifId,
          type: 'attendance',
          priority: 'HIGH',
          title: 'Live attendance session open',
          subtitle: traineeActiveSession.title || 'Executive PACS Digital Governance & Statutory Audit Compliance',
          timeSlot: traineeActiveSession.timeSlot || '10:00 AM – 01:00 PM',
          room: traineeActiveSession.room ? `Room: ${traineeActiveSession.room}` : 'Smart Computer Lab 2 (VAMNICOM Academic Block)',
          message: 'Attendance is currently open. Mark your face attendance before the session concludes.',
          statusBadge: 'Live Session Open',
          statusVariant: 'success',
          actionLabel: 'Mark Face Attendance →',
          timestamp: 'Happening now',
          isRead: readNotifIds.includes(notifId),
          linkView: 'attendance_history',
        });
      }

      // 2. Trainee Programme Application Status Notification (HIGH / MEDIUM Priority)
      const progStatus = (traineeStatus.programmeStatus || '').toUpperCase();
      if (progStatus === 'REJECTED') {
        const notifId = 'notif-app-status-rejected';
        list.push({
          id: notifId,
          type: 'application',
          priority: 'HIGH',
          title: 'Programme application requires attention',
          subtitle: 'VAMNICOM Admissions Board',
          message: traineeStatus.rejectionReason || 'Programme application was not approved. You can review feedback and submit an updated application.',
          statusBadge: 'Requires Attention',
          statusVariant: 'danger',
          actionLabel: 'View Application Status →',
          timestamp: 'Action required',
          isRead: readNotifIds.includes(notifId),
          linkView: '/trainee/programmes',
        });
      } else if (progStatus === 'DOCUMENTS_REQUIRED') {
        const notifId = 'notif-app-status-docs';
        list.push({
          id: notifId,
          type: 'document',
          priority: 'HIGH',
          title: 'Additional documents required',
          subtitle: 'VAMNICOM Admissions Board',
          message: 'Your programme application requires additional documentation for administration verification.',
          statusBadge: 'Documents Required',
          statusVariant: 'warning',
          actionLabel: 'Upload Documents →',
          timestamp: 'Action required',
          isRead: readNotifIds.includes(notifId),
          linkView: '/trainee/programmes',
        });
      } else if (!isProgrammeApproved && progStatus !== 'NOT_REGISTERED' && progStatus !== '') {
        const notifId = 'notif-app-status-under-review';
        list.push({
          id: notifId,
          type: 'application',
          priority: 'MEDIUM',
          title: 'Programme application under review',
          subtitle: 'VAMNICOM Admissions Board',
          message: 'Your application is being reviewed by the institute administration.',
          statusBadge: 'Under Review',
          statusVariant: 'warning',
          actionLabel: 'View Application Status →',
          timestamp: '5 min ago',
          isRead: readNotifIds.includes(notifId),
          linkView: '/trainee/programmes',
        });
      } else if (isProgrammeApproved && !isBatchAssigned) {
        const notifId = 'notif-app-status-approved-pending';
        list.push({
          id: notifId,
          type: 'application',
          priority: 'MEDIUM',
          title: 'Programme application approved',
          subtitle: 'VAMNICOM Admissions Board • Pending Batch Assignment',
          message: 'Your application has been approved. Your batch and timetable will appear once batch assignment is completed.',
          statusBadge: 'Approved',
          statusVariant: 'success',
          actionLabel: 'View Application Status →',
          timestamp: '1 hour ago',
          isRead: readNotifIds.includes(notifId),
          linkView: '/trainee/programmes',
        });
      } else if (isProgrammeApproved && isBatchAssigned) {
        const notifId = 'notif-app-status-enrolled';
        list.push({
          id: notifId,
          type: 'application',
          priority: 'MEDIUM',
          title: 'Programme application approved',
          subtitle: `Batch: ${traineeStatus.batchId || '2026-A'}`,
          message: 'Your programme enrolment is confirmed. Courses, timetable, and attendance are now available.',
          statusBadge: 'Enrolled',
          statusVariant: 'success',
          actionLabel: 'View Timetable →',
          timestamp: 'Today',
          isRead: readNotifIds.includes(notifId),
          linkView: '/trainee/timetable',
        });
      }
    }

    // 3. Include base / persistent notifications (Courses, Certificates, Jobs, System)
    baseNotifications.forEach((n) => {
      list.push({
        ...n,
        isRead: readNotifIds.includes(n.id) || n.isRead,
      });
    });

    // 4. Sort by Priority (HIGH -> MEDIUM -> LOW), then unread status
    const priorityScore: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return list.sort((a, b) => {
      const scoreA = priorityScore[a.priority || 'LOW'] || 1;
      const scoreB = priorityScore[b.priority || 'LOW'] || 1;
      if (scoreA !== scoreB) return scoreB - scoreA;
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return 0;
    });
  }, [currentUser.role, traineeActiveSession, isProgrammeApproved, isBatchAssigned, traineeStatus, baseNotifications, readNotifIds]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds((prev) => {
      const next = Array.from(new Set([...prev, ...allIds]));
      localStorage.setItem('ss_read_notif_ids', JSON.stringify(next));
      return next;
    });
    setBaseNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      localStorage.setItem('ss_notifs', JSON.stringify(updated));
      return updated;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setReadNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('ss_read_notif_ids', JSON.stringify(next));
      return next;
    });
    setBaseNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      localStorage.setItem('ss_notifs', JSON.stringify(updated));
      return updated;
    });
  };

  const clearReadNotifications = () => {
    setBaseNotifications((prev) => {
      const updated = prev.filter((n) => !readNotifIds.includes(n.id) && !n.isRead);
      localStorage.setItem('ss_notifs', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUserProfile = (updates: Partial<User>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('ss_user', JSON.stringify(updated));
    if (updates.languagePreference && updates.languagePreference !== currentLanguage) {
      setLanguage(updates.languagePreference);
    }
  };

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Online / offline detector
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (offlineQueueCount > 0) {
        setOfflineQueueCount(0);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueueCount]);

  // Handle URL navigation for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isAuth = localStorage.getItem('ss_auth') === 'true';
      const route = resolveRoute(isAuth, currentUser.role);
      setActiveView(route.view);
      setActiveViewParams(route.params);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser.role]);

  // Session verification and restoration on startup (with Rural Offline persistence)
  useEffect(() => {
    const token = localStorage.getItem('ss_jwt') || sessionStorage.getItem('ss_jwt');
    const cachedUserStr = localStorage.getItem('ss_user') || sessionStorage.getItem('ss_user');

    if (token) {
      api.auth.me()
        .then(dbUser => {
          if (dbUser) {
            const normRole = normalizeRole(dbUser.role);
            const fullUser = { ...dbUser, role: normRole };
            setCurrentUser(fullUser);
            setIsAuthenticated(true);
            const isPersistent = Boolean(localStorage.getItem('ss_jwt'));
            const storage = isPersistent ? localStorage : sessionStorage;
            storage.setItem('ss_auth', 'true');
            storage.setItem('ss_user', JSON.stringify(fullUser));

            api.courses.list().then(crs => {
              if (Array.isArray(crs) && crs.length > 0) {
                const mapped = crs.map((c: any) => ({
                  ...c,
                  modules: c.modules || c.modulesJson || [],
                }));
                setCourses(mapped);
              }
            }).catch(() => {});

            if (normRole === 'trainee') {
              api.enrollments.mine().then(enrs => {
                if (Array.isArray(enrs)) setEnrollments(enrs);
              }).catch(() => {});
              api.certificates.mine().then(certs => {
                if (Array.isArray(certs)) setCertificates(certs);
              }).catch(() => {});
            }

            if (normRole === 'institute_admin') {
              api.institute.getNominations().then(noms => {
                if (Array.isArray(noms)) setNominations(noms);
              }).catch(() => {});
              api.institute.getHostel().then(beds => {
                if (Array.isArray(beds)) setHostelBeds(beds);
              }).catch(() => {});
              api.institute.getTimetable().then(tt => {
                if (Array.isArray(tt)) setTimetable(tt);
              }).catch(() => {});
              api.institute.getSessions().then(sess => {
                if (Array.isArray(sess)) setSessions(sess);
              }).catch(() => {});
            }
          }
        })
        .catch((err) => {
          // Rural Offline Resilience: If device is offline or backend is unreachable, DO NOT logout!
          const isNetDown = !navigator.onLine || err?.message?.includes('unreachable') || err?.message?.includes('Failed to fetch');
          if (isNetDown && cachedUserStr) {
            try {
              const cachedUser = JSON.parse(cachedUserStr);
              const normRole = normalizeRole(cachedUser.role);
              const fullUser = { ...cachedUser, role: normRole };
              setCurrentUser(fullUser);
              setIsAuthenticated(true);
              setIsOffline(true);

              // Populate offline educational cache if empty
              if (courses.length === 0) {
                setCourses(SEED_COURSES);
              }
              if (fullUser.role === 'trainee') {
                if (enrollments.length === 0) setEnrollments(SEED_ENROLLMENTS);
                if (certificates.length === 0) setCertificates(SEED_CERTIFICATES);
              }
              return;
            } catch {
              // fallback to normal logout below if JSON parse fails
            }
          }

          // Genuinely expired or invalid token
          setIsAuthenticated(false);
          clearToken();
          localStorage.removeItem('ss_auth');
          sessionStorage.removeItem('ss_auth');
          localStorage.removeItem('ss_user');
          sessionStorage.removeItem('ss_user');
          setActiveView('login');
        });
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem('ss_auth');
      sessionStorage.removeItem('ss_auth');
    }
  }, []);

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('ss_auth');
    sessionStorage.removeItem('ss_auth');
    localStorage.removeItem('ss_user');
    sessionStorage.removeItem('ss_user');
    clearToken();
    api.auth.logout();
    setActiveView('login');
    setActiveViewParams(null);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * login — Database-backed authentication for all roles with offline resilience.
   * On success: stores JWT, sets currentUser with verified role, and caches credentials for rural offline login.
   * On network failure: checks offline credential cache and official accounts to grant seamless offline access.
   */
  const login = async (identifier: string, password: string, rememberMe = true): Promise<void> => {
    const cleanId = identifier.trim();

    try {
      const { user } = await api.auth.login(cleanId, password, rememberMe);
      const normRole = normalizeRole(user.role);
      const fullUser = { ...user, role: normRole };
      setCurrentUser(fullUser);
      setIsAuthenticated(true);

      const storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem('ss_auth');
      otherStorage.removeItem('ss_user');

      storage.setItem('ss_auth', 'true');
      storage.setItem('ss_user', JSON.stringify(fullUser));

      // Cache user profile for offline re-login in rural areas
      localStorage.setItem(`ss_offline_${cleanId.toLowerCase()}`, JSON.stringify(fullUser));
      if (fullUser.employeeId) {
        localStorage.setItem(`ss_offline_${fullUser.employeeId.toUpperCase()}`, JSON.stringify(fullUser));
      }

      if (fullUser.languagePreference) {
        setCurrentLanguageState(fullUser.languagePreference);
        storage.setItem('ss_lang', fullUser.languagePreference);
      }
      api.courses.list().then(crs => {
        if (Array.isArray(crs) && crs.length > 0) {
          const mapped = crs.map((c: any) => ({
            ...c,
            modules: c.modules || c.modulesJson || [],
          }));
          setCourses(mapped);
        }
      }).catch(() => {});

      if (fullUser.role === 'trainee') {
        api.enrollments.mine().then(enrs => {
          if (Array.isArray(enrs)) setEnrollments(enrs);
        }).catch(() => {});
        api.certificates.mine().then(certs => {
          if (Array.isArray(certs)) setCertificates(certs);
        }).catch(() => {});
      }

      if (fullUser.role === 'institute_admin') {
        api.institute.getNominations().then(noms => {
          if (Array.isArray(noms)) setNominations(noms);
        }).catch(() => {});
        api.institute.getHostel().then(beds => {
          if (Array.isArray(beds)) setHostelBeds(beds);
        }).catch(() => {});
        api.institute.getTimetable().then(tt => {
          if (Array.isArray(tt)) setTimetable(tt);
        }).catch(() => {});
        api.institute.getSessions().then(sess => {
          if (Array.isArray(sess)) setSessions(sess);
        }).catch(() => {});
      }

      setActiveView('home');
      setActiveViewParams(null);
      const targetPath = `${getRolePrefix(fullUser.role)}/dashboard`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch (err: any) {
      // ─── Rural Offline Fallback Login ─────────────────────────────────────────────
      const isNetDown = !navigator.onLine || err?.message?.includes('unreachable') || err?.message?.includes('Failed to fetch');
      if (isNetDown) {
        let offlineUser: User | null = null;

        // 1. Check local device cached credentials
        const cachedOfflineStr =
          localStorage.getItem(`ss_offline_${cleanId.toLowerCase()}`) ||
          localStorage.getItem(`ss_offline_${cleanId.toUpperCase()}`) ||
          localStorage.getItem('ss_user');

        if (cachedOfflineStr) {
          try {
            const parsed = JSON.parse(cachedOfflineStr);
            if (
              parsed.email?.toLowerCase() === cleanId.toLowerCase() ||
              parsed.employeeId?.toUpperCase() === cleanId.toUpperCase() ||
              cleanId.includes('@') ||
              cleanId.startsWith('NCCT')
            ) {
              offlineUser = parsed;
            }
          } catch {}
        }

        // 2. Check recognized official seed profiles
        if (!offlineUser) {
          const matchSeed = SEED_USERS.find(
            u =>
              u.email.toLowerCase() === cleanId.toLowerCase() ||
              (u.employeeId && u.employeeId.toUpperCase() === cleanId.toUpperCase())
          );
          if (matchSeed) {
            offlineUser = matchSeed;
          }
        }

        if (offlineUser) {
          const normRole = normalizeRole(offlineUser.role);
          const fullUser = { ...offlineUser, role: normRole };
          setCurrentUser(fullUser);
          setIsAuthenticated(true);
          setIsOffline(true);

          localStorage.setItem('ss_auth', 'true');
          localStorage.setItem('ss_user', JSON.stringify(fullUser));
          if (!localStorage.getItem('ss_jwt')) {
            localStorage.setItem('ss_jwt', 'offline-pacs-token');
          }

          // Populate offline educational cache
          if (courses.length === 0) setCourses(SEED_COURSES);
          if (fullUser.role === 'trainee') {
            if (enrollments.length === 0) setEnrollments(SEED_ENROLLMENTS);
            if (certificates.length === 0) setCertificates(SEED_CERTIFICATES);
          }

          setActiveView('home');
          setActiveViewParams(null);
          const targetPath = `${getRolePrefix(fullUser.role)}/dashboard`;
          if (window.location.pathname !== targetPath) {
            window.history.pushState({}, '', targetPath);
          }
          return;
        }
      }
      throw err;
    }
  };

  const switchUser = async (userId: string) => {
    const target = SEED_USERS.find(u => u.id === userId) || users.find(u => u.id === userId);
    if (target) {
      const defaultPasswords: Record<string, string> = {
        'usr-trainee-1': 'Demo@1234',
        'usr-trainee-2': 'Demo@1234',
        'usr-trainee-3': 'Demo@1234',
        'usr-trainee-4': 'Demo@1234',
        'usr-trainee-5': 'Demo@1234',
        'usr-trainee-6': 'Demo@1234',
        'usr-trainee-mtschwr6': 'Demo@1234',
        'usr-trainee-mtsfqdf6': 'Demo@1234',
        'usr-admin-vamnicom': 'Admin@1234',
        'usr-superadmin': 'Super@1234',
        'usr-faculty-1': 'Faculty@1234',
        'usr-employer-1': 'Employer@1234',
        'usr-device-operator': 'Demo@1234',
        'usr-warden-1': 'Hostel@1234',
      };
      const pass = defaultPasswords[target.id] || (
        target.role === 'institute_admin' ? 'Admin@1234' :
        target.role === 'super_admin' ? 'Super@1234' :
        target.role === 'faculty' ? 'Faculty@1234' :
        target.role === 'employer' ? 'Employer@1234' :
        target.role === 'hostel_admin' ? 'Hostel@1234' : 'Demo@1234'
      );

      try {
        await login(target.email || target.id, pass, true);
        return;
      } catch (err) {
        console.warn('Real login fallback during switchUser:', err);
      }

      setCurrentUser(target);
      setIsAuthenticated(true);
      localStorage.setItem('ss_auth', 'true');
      localStorage.setItem('ss_user', JSON.stringify(target));
      if (target.languagePreference) {
        setCurrentLanguageState(target.languagePreference);
        localStorage.setItem('ss_lang', target.languagePreference);
      }
      setActiveView('home');
      setActiveViewParams(null);
      const targetPath = `${getRolePrefix(target.role)}/dashboard`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  const setLanguage = (lang: Language) => {
    setCurrentLanguageState(lang);
    localStorage.setItem('ss_lang', lang);
  };

  const navigate = (destination: string, params?: any) => {
    if (destination === 'login' || destination === '/' || destination === 'logout') {
      logout();
      return;
    }

    if (destination === 'signup' || destination === 'register' || destination === '/register') {
      setActiveView('signup');
      setActiveViewParams(null);
      window.history.pushState({}, '', '/register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (destination === 'forgot_password' || destination === '/forgot-password') {
      setActiveView('forgot_password');
      setActiveViewParams(null);
      window.history.pushState({}, '', '/forgot-password');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (destination === 'skill_card_public' || destination.startsWith('/skill-card/')) {
      const token = params?.token || (destination.startsWith('/skill-card/') ? destination.replace(/^\/skill-card\//, '') : 'token-rameshwar-2026');
      setActiveView('skill_card_public');
      setActiveViewParams({ token });
      window.history.pushState({}, '', `/skill-card/${token}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (destination === 'verify_public' || destination.startsWith('/verify/')) {
      const certId = params?.certId || (destination.startsWith('/verify/') ? destination.replace(/^\/verify\//, '') : 'NCCT-CERT-2026-VAM-0089');
      setActiveView('verify_public');
      setActiveViewParams({ certId });
      window.history.pushState({}, '', `/verify/${certId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const isAuth = localStorage.getItem('ss_auth') === 'true' || isAuthenticated;
    if (!isAuth) {
      logout();
      return;
    }

    // Direct path support (e.g. '/institute-admin/nominations', '/trainee/courses')
    if (destination.startsWith('/')) {
      const targetRole = getRoleFromPrefix(destination);
      if (targetRole && targetRole !== currentUser.role) {
        // Guard check: mismatch between target path and current role
        const guardedPath = `${getRolePrefix(currentUser.role)}/dashboard`;
        window.history.pushState({}, '', guardedPath);
        const resolved = resolveRoute(true, currentUser.role);
        setActiveView(resolved.view);
        setActiveViewParams(resolved.params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      window.history.pushState({}, '', destination);
      const resolved = resolveRoute(true, currentUser.role);
      setActiveView(resolved.view);
      setActiveViewParams(params || resolved.params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Destination is a canonical view ID: map to role-namespaced URL
    let targetPath = `${getRolePrefix(currentUser.role)}/dashboard`;
    let targetView = destination;

    if (currentUser.role === 'institute_admin') {
      if (destination === 'home' || destination === 'dashboard') {
        targetPath = '/institute-admin/dashboard';
        targetView = 'home';
      } else if (destination === 'programmes_erp' || destination === 'programmes') {
        targetPath = '/institute-admin/programmes';
        targetView = 'programmes_erp';
      } else if (destination === 'nominations') {
        targetPath = '/institute-admin/nominations';
        targetView = 'nominations';
      } else if (destination === 'trainee_directory' || destination === 'trainees') {
        targetPath = '/institute-admin/trainees';
        targetView = 'trainee_directory';
      } else if (destination === 'attendance_kiosk' || destination === 'attendance' || destination === 'sessions') {
        targetPath = '/institute-admin/sessions';
        targetView = 'attendance_kiosk';
      } else if (destination === 'hostel_timetable' || destination === 'hostel') {
        targetPath = '/institute-admin/hostel';
        targetView = 'hostel_timetable';
      } else if (destination === 'timetable') {
        targetPath = '/institute-admin/timetable';
        targetView = 'timetable';
      } else if (destination === 'analytics') {
        targetPath = '/institute-admin/analytics';
        targetView = 'analytics';
      } else if (destination === 'settings') {
        targetPath = '/institute-admin/settings';
        targetView = 'settings';
      } else if (destination === 'profile') {
        targetPath = '/institute-admin/profile';
        targetView = 'profile';
      } else {
        targetPath = '/institute-admin/dashboard';
        targetView = 'home';
      }
    } else if (currentUser.role === 'trainee') {
      if (destination === 'home' || destination === 'dashboard') {
        targetPath = '/trainee/dashboard';
        targetView = 'home';
      } else if (destination === 'courses' || destination === 'course_catalog' || destination === 'catalog') {
        targetPath = '/trainee/course-catalog';
        targetView = 'courses';
      } else if (destination === 'course_detail') {
        targetPath = `/trainee/courses/${params?.courseId || ''}`;
        targetView = 'course_detail';
      } else if (destination === 'course_player' || destination === 'course_view') {
        targetPath = `/trainee/courses/${params?.courseId || ''}/learn`;
        targetView = 'course_player';
      } else if (destination === 'quiz') {
        targetPath = `/trainee/courses/${params?.courseId || ''}/quiz/${params?.moduleId || ''}`;
        targetView = 'quiz';
      } else if (destination === 'my_courses') {
        targetPath = '/trainee/courses';
        targetView = 'my_courses';
      } else if (destination === 'certificates' || destination === 'certificate' || destination === 'my_certificates') {
        targetPath = `/trainee/certificates${params?.certId ? `/${params.certId}` : ''}`;
        targetView = 'certificates';
      } else if (destination === 'jobs' || destination === 'job_opportunities' || destination === 'jobs_opportunities') {
        targetPath = '/trainee/jobs';
        targetView = 'jobs';
      } else if (destination === 'job_detail') {
        targetPath = `/trainee/jobs/${params?.jobId || ''}`;
        targetView = 'job_detail';
      } else if (destination === 'my_applications') {
        targetPath = '/trainee/my-applications';
        targetView = 'my_applications';
      } else if (destination === 'career_chat' || destination === 'career_bot') {
        targetPath = '/trainee/career-chat';
        targetView = 'career_chat';
      } else if (destination === 'scan_attendance' || destination === '/trainee/scan-attendance') {
        targetPath = '/trainee/scan-attendance';
        targetView = 'scan_attendance';
      } else if (destination === 'attendance' || destination === 'attendance_kiosk') {
        targetPath = '/trainee/dashboard';
        targetView = 'home';
      } else if (destination === 'profile') {
        targetPath = '/trainee/profile';
        targetView = 'profile';
      } else if (destination === 'settings') {
        targetPath = '/trainee/settings';
        targetView = 'settings';
      } else if (destination === 'trainee_hostel' || destination === 'hostel' || destination === 'hostel_pass') {
        targetPath = '/trainee/hostel';
        targetView = 'trainee_hostel';
      } else if (destination === 'help') {
        targetPath = '/trainee/help';
        targetView = 'help';
      } else {
        targetPath = '/trainee/dashboard';
        targetView = 'home';
      }
    } else if (currentUser.role === 'super_admin') {
      if (destination === 'home' || destination === 'dashboard') {
        targetPath = '/super-admin/dashboard';
        targetView = 'home';
      } else if (destination === 'analytics') {
        targetPath = '/super-admin/analytics';
        targetView = 'analytics';
      } else if (destination === 'institutes_directory' || destination === 'institutes') {
        targetPath = '/super-admin/institutes';
        targetView = 'institutes_directory';
      } else if (destination === 'institute_detail') {
        targetPath = `/super-admin/institutes/${params?.instituteId || ''}`;
        targetView = 'institute_detail';
      } else if (destination === 'users') {
        targetPath = '/super-admin/users';
        targetView = 'users';
      } else if (destination === 'settings') {
        targetPath = '/super-admin/settings';
        targetView = 'settings';
      } else if (destination === 'profile') {
        targetPath = '/super-admin/profile';
        targetView = 'profile';
      } else {
        targetPath = '/super-admin/dashboard';
        targetView = 'home';
      }
    } else if (currentUser.role === 'faculty') {
      if (destination === 'home' || destination === 'dashboard') {
        targetPath = '/faculty/dashboard';
        targetView = 'home';
      } else if (destination === 'courses/new' || destination === 'course_new' || destination === '/faculty/courses/new') {
        targetPath = '/faculty/courses/new';
        targetView = 'course_new';
      } else if (destination === 'courses') {
        targetPath = '/faculty/courses';
        targetView = 'courses';
      } else if (destination === 'course_builder' || destination === 'edit') {
        targetPath = `/faculty/courses/${params?.courseId || 'crs-pacs-erp-101'}/edit`;
        targetView = 'course_builder';
      } else if (destination === 'attendance' || destination === 'attendance_kiosk' || destination === 'sessions' || destination === '/faculty/attendance') {
        targetPath = '/faculty/attendance';
        targetView = 'attendance';
      } else if (destination === 'settings') {
        targetPath = '/faculty/settings';
        targetView = 'settings';
      } else {
        targetPath = '/faculty/dashboard';
        targetView = 'home';
      }
    } else if (currentUser.role === 'employer') {
      if (destination === 'home' || destination === 'dashboard') {
        targetPath = '/employer/dashboard';
        targetView = 'home';
      } else if (destination === 'trainee_directory' || destination === 'candidates') {
        targetPath = '/employer/candidates';
        targetView = 'trainee_directory';
      } else if (destination === 'jobs_new') {
        targetPath = '/employer/jobs/new';
        targetView = 'jobs_new';
      } else if (destination === 'jobs') {
        targetPath = '/employer/jobs';
        targetView = 'jobs';
      } else {
        targetPath = '/employer/dashboard';
        targetView = 'home';
      }
    } else if (currentUser.role === 'device_operator') {
      if (destination === 'home' || destination === 'dashboard') {
        targetPath = '/device/dashboard';
        targetView = 'home';
      } else if (destination === 'device_monitoring' || destination === 'monitoring') {
        targetPath = '/device/monitoring';
        targetView = 'device_monitoring';
      } else if (destination === 'device_fleet' || destination === 'devices') {
        targetPath = '/device/devices';
        targetView = 'device_fleet';
      } else if (destination === 'device_test' || destination === 'test') {
        targetPath = '/device/test';
        targetView = 'device_test';
      } else if (destination === 'device_sync_queue' || destination === 'sync_queue' || destination === 'sync') {
        targetPath = '/device/sync-queue';
        targetView = 'device_sync_queue';
      } else if (destination === 'device_incidents' || destination === 'incidents') {
        targetPath = '/device/incidents';
        targetView = 'device_incidents';
      } else if (destination === 'device_maintenance' || destination === 'maintenance') {
        targetPath = '/device/maintenance';
        targetView = 'device_maintenance';
      } else if (destination === 'settings') {
        targetPath = '/device/settings';
        targetView = 'settings';
      } else {
        targetPath = '/device/dashboard';
        targetView = 'home';
      }
    } else if (currentUser.role === 'hostel_admin') {
      if (destination === 'home' || destination === 'dashboard' || destination === 'operations' || destination === 'hostel_operations') {
        targetPath = '/hostel-admin/dashboard';
        targetView = 'hostel_operations';
      } else if (destination === 'hostel_blocks' || destination === 'blocks') {
        targetPath = '/hostel-admin/blocks';
        targetView = 'hostel_blocks';
      } else if (destination === 'hostel_rooms' || destination === 'rooms') {
        targetPath = '/hostel-admin/rooms';
        targetView = 'hostel_rooms';
      } else if (destination === 'hostel_requests' || destination === 'requests') {
        targetPath = '/hostel-admin/requests';
        targetView = 'hostel_requests';
      } else if (destination === 'hostel_allocations' || destination === 'allocations') {
        targetPath = '/hostel-admin/allocations';
        targetView = 'hostel_allocations';
      } else if (destination === 'hostel_checkin' || destination === 'checkin' || destination === 'gate') {
        targetPath = '/hostel-admin/checkin';
        targetView = 'hostel_checkin';
      } else if (destination === 'hostel_complaints' || destination === 'complaints' || destination === 'maintenance') {
        targetPath = '/hostel-admin/complaints';
        targetView = 'hostel_complaints';
      } else if (destination === 'hostel_reports' || destination === 'reports' || destination === 'mess') {
        targetPath = '/hostel-admin/reports';
        targetView = 'hostel_reports';
      } else if (destination === 'settings') {
        targetPath = '/hostel-admin/settings';
        targetView = 'settings';
      } else if (destination === 'profile') {
        targetPath = '/hostel-admin/profile';
        targetView = 'profile';
      } else {
        targetPath = '/hostel-admin/dashboard';
        targetView = 'hostel_operations';
      }
    }

    setActiveView(targetView);
    setActiveViewParams(params || null);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const enrollInCourse = (courseId: string) => {
    // Persist to database via POST /api/enrollments
    api.enrollments.enroll(courseId)
      .then(() => api.enrollments.mine())
      .then(enrs => {
        if (Array.isArray(enrs)) setEnrollments(enrs);
      })
      .catch(err => {
        console.warn('[API] enrollInCourse failed:', err.message);
        // Optimistic fallback
        const existing = enrollments.find(e => e.userId === currentUser.id && e.courseId === courseId);
        if (!existing) {
          const newEnrollment: Enrollment = {
            id: `enr-${Date.now()}`,
            userId: currentUser.id,
            courseId,
            progressPercent: 0,
            completedLessonIds: [],
            completedQuizIds: [],
            status: 'in_progress',
            enrolledDate: new Date().toISOString().split('T')[0],
          };
          setEnrollments(prev => [newEnrollment, ...prev]);
        }
      });
  };

  const markLessonComplete = (courseId: string, lessonId: string) => {
    const isAliasMatch = (c1: string, c2: string) => {
      if (c1 === c2) return true;
      const aliases: Record<string, string[]> = {
        'crs-shg-101': ['crs-shg-101', 'crs-shg-gov-301'],
        'crs-shg-gov-301': ['crs-shg-gov-301', 'crs-shg-101'],
        'crs-dairy-101': ['crs-dairy-101', 'crs-dairy-mgmt-201'],
        'crs-dairy-mgmt-201': ['crs-dairy-mgmt-201', 'crs-dairy-101'],
        'crs-pacs-101': ['crs-pacs-101', 'crs-pacs-erp-101'],
        'crs-pacs-erp-101': ['crs-pacs-erp-101', 'crs-pacs-101'],
      };
      return aliases[c1]?.includes(c2) || false;
    };

    setEnrollments(prev => {
      return prev.map(e => {
        if (e.userId === currentUser.id && isAliasMatch(e.courseId, courseId)) {
          if (!e.completedLessonIds.includes(lessonId)) {
            const updatedLessons = [...e.completedLessonIds, lessonId];
            const course = courses.find(c => isAliasMatch(c.id, courseId));
            const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 1;
            const progress = Math.min(100, Math.round((updatedLessons.length / totalLessons) * 100));

            return {
              ...e,
              completedLessonIds: updatedLessons,
              progressPercent: progress,
              lastAccessedLessonId: lessonId,
            };
          }
        }
        return e;
      });
    });

    // Persist to database
    if (currentUser.role === 'trainee') {
      api.learning.completeLesson(lessonId)
        .then(() => {
          api.enrollments.mine().then(enrs => {
            if (Array.isArray(enrs)) setEnrollments(enrs);
          }).catch(() => {});
        })
        .catch(err =>
          console.warn('[API] completeLesson failed:', err.message)
        );
    }

    if (isOffline) {
      setOfflineQueueCount(prev => prev + 1);
    }
  };

  const submitQuiz = async (
    courseId: string,
    quizId: string,
    answers: any,
    assessmentResult?: any
  ): Promise<{ passed: boolean; certId?: string; scorePercent?: number; certificate?: any }> => {
    // For Trainee role: send answers to server for grading & persistence
    if (currentUser.role === 'trainee') {
      try {
        const payloadAnswers = assessmentResult?.answers || answers;
        const result = await api.learning.submitQuiz(quizId, payloadAnswers);
        if (result.passed) {
          // Update local enrollment state to reflect server result
          const isMatchingEnrollment = (e: any) =>
            e.userId === currentUser.id && e.courseId === courseId;

          setEnrollments(prev => prev.map(e => {
            if (isMatchingEnrollment(e)) {
              const updatedQuizIds = Array.from(new Set([...e.completedQuizIds, quizId]));
              return {
                ...e,
                completedQuizIds: updatedQuizIds,
                progressPercent: result.courseCompleted ? 100 : Math.min(100, e.progressPercent),
                status: result.courseCompleted ? 'completed' : e.status,
              };
            }
            return e;
          }));

          // If server issued a certificate, add it to local state immediately
          if (result.certificate) {
            setCertificates(prev => {
              const exists = prev.some(c => c.id === result.certificate.id);
              if (exists) {
                return prev.map(c => c.id === result.certificate.id ? { ...c, ...result.certificate } : c);
              }
              return [result.certificate, ...prev];
            });
          }
          api.certificates.mine().then(certs => {
            if (Array.isArray(certs) && certs.length > 0) setCertificates(certs);
          }).catch(() => {});
          api.enrollments.mine().then(enrs => {
            if (Array.isArray(enrs) && enrs.length > 0) setEnrollments(enrs);
          }).catch(() => {});
        }
        return {
          passed: result.passed,
          scorePercent: result.score ?? result.scorePercent,
          certId: result.certificate?.id || result.certId,
          certificate: result.certificate,
        };
      } catch (err: any) {
        console.error('[API] submitQuiz failed:', err.message);
        // Authoritative fallback to local assessment result
        const fallbackPassed = assessmentResult?.passed ?? false;
        const fallbackScore = assessmentResult?.scorePercentage ?? 0;
        if (fallbackPassed) {
          setEnrollments(prev => prev.map(e => {
            if (e.userId === currentUser.id && e.courseId === courseId) {
              const updatedQuizIds = Array.from(new Set([...e.completedQuizIds, quizId]));
              return { ...e, completedQuizIds: updatedQuizIds, progressPercent: Math.min(100, e.progressPercent) };
            }
            return e;
          }));
        }
        return { passed: fallbackPassed, scorePercent: fallbackScore };
      }
    }

    // ── Non-trainee roles: local state grading (unchanged) ──
    // Compute score from answers array
    const course = courses.find(c => c.id === courseId);
    const module = course?.modules.find(m => m.quiz?.id === quizId);
    const quiz = module?.quiz;
    let scorePercent = 0;
    if (quiz) {
      const correct = quiz.questions.filter((q, idx) => answers[idx] === q.correctOptionIndex).length;
      scorePercent = Math.round((correct / quiz.questions.length) * 100);
    }
    const passThreshold = quiz?.passThreshold || 70;
    const passed = scorePercent >= passThreshold;

    if (passed) {
      let newlyCompleted = false;
      setEnrollments(prev => {
        return prev.map(e => {
          if (e.userId === currentUser.id && e.courseId === courseId) {
            const updatedQuizIds = Array.from(new Set([...e.completedQuizIds, quizId]));
            const totalQuizzes = course?.modules.filter(m => m.quiz).length || 1;
            const isAllCompleted = updatedQuizIds.length >= totalQuizzes;
            if (isAllCompleted && e.status !== 'completed') {
              newlyCompleted = true;
            }
            return {
              ...e,
              completedQuizIds: updatedQuizIds,
              progressPercent: isAllCompleted ? 100 : e.progressPercent,
              status: isAllCompleted ? 'completed' : e.status,
              completionDate: isAllCompleted ? new Date().toISOString().split('T')[0] : e.completionDate,
            };
          }
          return e;
        });
      });

      // Issue Certificate if not already present
      const existingCert = certificates.find(c => c.userId === currentUser.id && c.courseId === courseId);
      if (!existingCert && course) {
        const inst = institutes.find(i => i.id === course.instituteId) || institutes[0];
        const newCertId = `NCCT-CERT-${new Date().getFullYear()}-${inst.type}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newCert: Certificate = {
          id: newCertId,
          userId: currentUser.id,
          userName: currentUser.name,
          userAadhaarMock: currentUser.aadhaarMock || 'XXXX-XXXX-8821',
          courseId,
          courseTitle: course.title,
          courseTitleHi: course.titleHi,
          instituteId: inst.id,
          instituteName: inst.name,
          issuedDate: new Date().toISOString().split('T')[0],
          certificateHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          qrCodeUrl: `/verify/${newCertId}`,
          grade: scorePercent >= 90 ? 'Distinction' : scorePercent >= 75 ? 'First Class' : 'Passed',
        };
        setCertificates(prev => [newCert, ...prev]);
        return { passed: true, certId: newCertId, scorePercent };
      }
      return { passed: true, certId: existingCert?.id, scorePercent };
    }

    return { passed: false, scorePercent };
  };


  const markAttendance = (
    sessionId: string,
    method: 'qr' | 'face',
    targetUserId?: string,
    confidence?: number
  ) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return { success: false, message: 'Session not found' };

    const uid = targetUserId || currentUser.id;
    const userObj = SEED_USERS.find(u => u.id === uid) || currentUser;

    const alreadyMarked = attendance.find(a => a.sessionId === sessionId && a.userId === uid);
    if (alreadyMarked) {
      return { success: true, message: `Attendance already recorded for ${userObj.name}` };
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      sessionId,
      userId: uid,
      traineeName: userObj.name,
      traineeCoop: userObj.cooperativeAffiliation || 'NCCT Enrolled Trainee',
      method,
      timestamp: new Date().toLocaleString(),
      confidenceScore: confidence || (method === 'qr' ? 99.8 : 96.5),
      deviceLocation: method === 'face'
        ? 'Raspberry Pi Kiosk Node-01 (Camera & Bounding Box Match)'
        : 'Mobile Geotagged Check-in (VAMNICOM Campus, Pune)',
    };

    setAttendance(prev => [newRecord, ...prev]);

    if (isOffline) {
      setOfflineQueueCount(prev => prev + 1);
    }

    // Persist to backend for Trainee (fire-and-forget; QR token from session)
    if (currentUser.role === 'trainee' && !targetUserId) {
      const qrToken = method === 'qr' ? session.qrToken : undefined;
      api.attendance.mark(sessionId, method, qrToken).catch(err =>
        console.warn('[API] markAttendance failed (local state already updated):', err.message)
      );
    }

    return { success: true, message: `Attendance logged successfully for ${userObj.name} (${method.toUpperCase()})` };
  };

  const updateNominationStatus = (nominationId: string, status: 'approved' | 'rejected') => {
    setNominations(prev => prev.map(n => n.id === nominationId ? { ...n, status } : n));
    api.institute.updateNominationStatus(nominationId, status).catch(err => {
      console.warn('[API] updateNominationStatus failed:', err.message);
    });
  };

  const bulkUpdateNominationStatus = (nominationIds: string[], status: 'approved' | 'rejected') => {
    const idSet = new Set(nominationIds);
    setNominations(prev => prev.map(n => idSet.has(n.id) ? { ...n, status } : n));
    nominationIds.forEach(id => {
      api.institute.updateNominationStatus(id, status).catch(err => {
        console.warn('[API] bulk updateNominationStatus failed for', id, err.message);
      });
    });
  };

  const bulkImportNominations = (programmeId: string, records: Array<{ name: string; email: string; coop: string }>) => {
    const newItems: Nomination[] = records.map((r, i) => ({
      id: `nom-${Date.now()}-${i}`,
      programmeId,
      userId: `usr-imported-${Date.now()}-${i}`,
      traineeName: r.name,
      traineeEmail: r.email,
      cooperativeName: r.coop,
      status: 'approved',
      nominatedDate: new Date().toISOString().split('T')[0],
    }));
    setNominations(prev => [...newItems, ...prev]);
    return newItems.length;
  };

  const applyForJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return false;

    const existing = jobInterests.find(ji => ji.jobPostingId === jobId && ji.userId === currentUser.id);
    if (existing) return true;

    const newInterest: JobInterest = {
      id: `ji-${Date.now()}`,
      jobPostingId: jobId,
      userId: currentUser.id,
      traineeName: currentUser.name,
      traineeEmail: currentUser.email,
      traineeSkills: ['PACS Digitalization', 'KCC Management', 'AMCS Operations'],
      timestamp: new Date().toLocaleString(),
      status: 'submitted',
    };
    setJobInterests(prev => {
      const updated = [newInterest, ...prev];
      try { localStorage.setItem('ss_job_interests', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    return true;
  };

  const createJobPosting = (jobData: Omit<JobPosting, 'id' | 'postedDate'>) => {
    const newJob: JobPosting = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
    };
    setJobs(prev => {
      const updated = [newJob, ...prev];
      try { localStorage.setItem('ss_jobs_list', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const updateJobPosting = (jobId: string, updates: Partial<JobPosting>) => {
    setJobs(prev => {
      const updated = prev.map(j => (j.id === jobId ? { ...j, ...updates } : j));
      try { localStorage.setItem('ss_jobs_list', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const deleteJobPosting = (jobId: string) => {
    setJobs(prev => {
      const updated = prev.filter(j => j.id !== jobId);
      try { localStorage.setItem('ss_jobs_list', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const updateJobInterestStatus = (interestId: string, status: 'submitted' | 'reviewed' | 'shortlisted') => {
    setJobInterests(prev => {
      const updated = prev.map(ji => (ji.id === interestId ? { ...ji, status } : ji));
      try { localStorage.setItem('ss_job_interests', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const updateHostelBed = (bedId: string, updates: Partial<HostelBed>) => {
    setHostelBeds(prev => prev.map(b => b.id === bedId ? { ...b, ...updates } : b));
    api.institute.updateHostelBed(bedId, {
      status: (updates.status as string) || 'available',
      traineeId: updates.traineeId,
      traineeName: updates.traineeName,
    }).catch(err => {
      console.warn('[API] updateHostelBed failed:', err.message);
    });
  };

  const verifyEkyc = (aadhaarNumber: string) => {
    const formatted = `XXXX-XXXX-${aadhaarNumber.slice(-4) || '8842'}`;
    const updated = {
      ...currentUser,
      aadhaarMock: formatted,
      isKycVerified: true,
    };
    setCurrentUser(updated);
    localStorage.setItem('ss_user', JSON.stringify(updated));
  };

  const toggleOfflineMode = () => {
    setIsOffline(prev => !prev);
  };

  const addNewCourse = (course: Course) => {
    setCourses(prev => {
      const existingIdx = prev.findIndex(c => c.id === course.id);
      let next: Course[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = course;
      } else {
        next = [course, ...prev];
      }
      try {
        localStorage.setItem('ss_courses_list', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => {
      const next = prev.filter(c => c.id !== courseId);
      try {
        localStorage.setItem('ss_courses_list', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const t = getTranslation(currentLanguage);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        currentLanguage,
        t,
        institutes,
        programmes,
        courses,
        enrollments,
        certificates,
        sessions,
        attendance,
        nominations,
        jobs,
        jobInterests,
        hostelBeds,
        timetable,
        notifications,
        unreadNotificationsCount,
        isOffline,
        offlineQueueCount,
        activeView,
        activeViewParams,
        switchUser,
        login,
        logout,
        setLanguage,
        navigate,
        enrollInCourse,
        markLessonComplete,
        submitQuiz,
        markAttendance,
        updateNominationStatus,
        bulkUpdateNominationStatus,
        bulkImportNominations,
        applyForJob,
        createJobPosting,
        updateJobPosting,
        deleteJobPosting,
        updateJobInterestStatus,
        updateHostelBed,
        verifyEkyc,
        toggleOfflineMode,
        addNewCourse,
        deleteCourse,
        markAllNotificationsAsRead,
        markNotificationAsRead,
        clearReadNotifications,
        updateUserProfile,
        users,
        addUser,
        toggleUserStatus,
        setEnrollments,
        setCourses,
        isHostelResident,
        hostelResidentLoading,
        refreshHostelResidentStatus,
        traineeStatus,
        isProgrammeApproved,
        isBatchAssigned,
        isActiveStudy,
        isProgrammeCompleted,
        setTraineeProgrammeStatus,
        refreshTraineeProgrammeStatus,
        traineeActiveSession,
        setTraineeActiveSession,
        refreshTraineeActiveSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
