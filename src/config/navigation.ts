import {
  LayoutDashboard,
  BookOpen,
  Award,
  Briefcase,
  Bot,
  QrCode,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  Edit3,
  Layers,
  BedDouble,
  ShieldCheck,
  GraduationCap,
  FileCheck,
  Settings,
  HelpCircle,
  LogOut,
  FolderKanban,
  FileSpreadsheet,
  Cpu,
  TrendingUp,
  UserCheck,
  User,
  Compass,
  Send,
  Activity,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { UserRole } from '../types';

export interface NavItem {
  id: string;
  labelKey?: string;
  label: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export type TraineeProgrammeStatus =
  | 'NOT_REGISTERED'
  | 'APPLICATION_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'REJECTED'
  | 'APPROVED'
  | 'BATCH_ASSIGNED'
  | 'ACTIVE'
  | 'COMPLETED';

export interface TraineeStatusContext {
  programmeStatus?: string;     // legacy coarse status field
  applicationStatus?: string;   // fine-grained: DRAFT | SUBMITTED | UNDER_REVIEW | ... | REJECTED
  enrollmentStatus?: string;    // fine-grained: NOT_ENROLLED | BATCH_PENDING | BATCH_ASSIGNED | ACTIVE | COMPLETED | ...
  batchId?: string | null;
  timetableStatus?: 'PUBLISHED' | 'DRAFT' | 'NOT_CREATED' | 'CANCELLED' | 'UNAVAILABLE' | string | null;
  firstSessionCompleted?: boolean;
  rejectionReason?: string;
}

/**
 * Resolves the effective enrollment status from the status context.
 * Prefers the fine-grained enrollmentStatus field, falls back to legacy programmeStatus.
 */
export function resolveEnrollmentStatus(ctx?: TraineeStatusContext): string {
  if (ctx?.enrollmentStatus) return ctx.enrollmentStatus.trim().toUpperCase();
  if (ctx?.programmeStatus) return ctx.programmeStatus.trim().toUpperCase();
  return 'NOT_ENROLLED';
}

/**
 * Resolves the effective application status.
 */
export function resolveApplicationStatus(ctx?: TraineeStatusContext): string {
  if (ctx?.applicationStatus) return ctx.applicationStatus.trim().toUpperCase();
  // Derive from legacy programmeStatus
  const ps = (ctx?.programmeStatus || '').trim().toUpperCase();
  if (ps === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  if (ps === 'REJECTED') return 'REJECTED';
  if (ps === 'CORRECTION_REQUIRED') return 'CORRECTION_REQUIRED';
  if (ps === 'APPLICATION_SUBMITTED') return 'SUBMITTED';
  return 'NOT_APPLIED';
}

/**
 * ─── CANONICAL TRAINEE CAPABILITY HELPER ───────────────────────────────────
 *
 * This is the SINGLE source of truth for all trainee nav/access decisions.
 *
 * Rules (spec-aligned):
 *   activeProgramme = programmeStatus strictly equals 'APPROVED'
 *                     AND batchId is present (non-null, non-empty, not the
 *                     literal string "null").
 *
 *   Dashboard          → always
 *   My Programmes      → !activeProgramme
 *   Programme Catalogue→ !activeProgramme
 *   My Courses         → always
 *   Timetable          → activeProgramme
 *   Attendance History → activeProgramme
 *   Certificates       → always
 *   Job Opportunities  → always
 *   Settings           → always
 *   Help & Support     → always
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface TraineeCapabilities {
  activeProgramme: boolean;
  showDashboard: boolean;
  showMyProgrammes: boolean;
  showProgrammeCatalogue: boolean;
  showMyCourses: boolean;
  showTimetable: boolean;
  showAttendance: boolean;
  showCertificates: boolean;
  showJobs: boolean;
  showSettings: boolean;
  showHelp: boolean;
}

/**
 * Derives the canonical trainee capability flags from the status context.
 * Call this once and share everywhere (Sidebar, MobileBottomNav, MoreBottomSheet, App.tsx).
 */
export function resolveTraineeCapabilities(statusContext?: TraineeStatusContext): TraineeCapabilities {
  const ps = (statusContext?.programmeStatus || '').trim().toUpperCase();
  const bid = statusContext?.batchId;

  const isApproved = ps === 'APPROVED';
  const hasBatch = Boolean(bid && String(bid).trim() !== '' && String(bid) !== 'null');
  const activeProgramme = isApproved && hasBatch;

  return {
    activeProgramme,
    showDashboard: true,
    showMyProgrammes: !activeProgramme,
    showProgrammeCatalogue: !activeProgramme,
    showMyCourses: true,
    showTimetable: activeProgramme,
    showAttendance: activeProgramme,
    showCertificates: true,
    showJobs: true,
    showSettings: true,
    showHelp: true,
  };
}

// ─── Legacy helpers kept for backward-compat with any remaining call-sites ───
// They delegate to resolveTraineeCapabilities so logic is never duplicated.

export function isTraineeProgrammeApproved(programmeStatus?: string): boolean {
  if (!programmeStatus) return false;
  const status = programmeStatus.trim().toUpperCase();
  return (
    status === 'APPROVED' ||
    status === 'BATCH_ASSIGNED' ||
    status === 'ACTIVE' ||
    status === 'COMPLETED' ||
    status === 'ACCEPTED'
  );
}

export function isTraineeBatchAssigned(batchId?: string | null, programmeStatus?: string): boolean {
  if (batchId && String(batchId).trim() !== '' && String(batchId) !== 'null') return true;
  if (!programmeStatus) return false;
  const status = programmeStatus.trim().toUpperCase();
  return status === 'BATCH_ASSIGNED' || status === 'ACTIVE';
}

export function isTraineeInActiveStudy(programmeStatus?: string): boolean {
  if (!programmeStatus) return false;
  const status = programmeStatus.trim().toUpperCase();
  return status === 'BATCH_ASSIGNED' || status === 'ACTIVE';
}

export function isTraineeCompleted(programmeStatus?: string): boolean {
  if (!programmeStatus) return false;
  return programmeStatus.trim().toUpperCase() === 'COMPLETED';
}

/**
 * Generates the trainee navigation dynamically based on programme lifecycle.
 *
 * Visibility Rules (spec-aligned; uses resolveTraineeCapabilities internally):
 * ┌──────────────────────────────┬────────────────┬────────────┬───────────┬────────────┬──────────────┐
 * │ Trainee State                │ My Programmes  │ My Courses │ Timetable │ Attendance │ Certificates │
 * ├──────────────────────────────┼────────────────┼────────────┼───────────┼────────────┼──────────────┤
 * │ No application / Rejected    │ Visible        │ ALWAYS     │ Hidden    │ Hidden     │ ALWAYS       │
 * │ Under Review / Approved(NB)  │ Visible        │ ALWAYS     │ Hidden    │ Hidden     │ ALWAYS       │
 * │ APPROVED + batchId present   │ Hidden         │ ALWAYS     │ Visible   │ Visible    │ ALWAYS       │
 * └──────────────────────────────┴────────────────┴────────────┴───────────┴────────────┴──────────────┘
 * NB = no batch assigned yet
 * My Courses is ALWAYS visible (catalogue + enrolled courses).
 * Certificates, Jobs, Settings, Help are ALWAYS visible.
 */
export function getTraineeNavigation(statusContext?: TraineeStatusContext): NavSection[] {
  const cap = resolveTraineeCapabilities(statusContext);

  const academicItems: NavItem[] = [
    { id: 'home', label: 'Dashboard', route: '/trainee/dashboard', icon: LayoutDashboard },
  ];

  if (cap.showMyProgrammes) {
    academicItems.push({ id: 'my_programmes', label: 'My Programmes', route: '/trainee/programmes', icon: Layers });
  }

  // Programme Catalogue follows the same gate as My Programmes
  if (cap.showProgrammeCatalogue) {
    academicItems.push({ id: 'programme_catalogue', label: 'Programme Catalogue', route: '/trainee/catalogue', icon: Compass });
  }

  // My Courses is always visible
  academicItems.push({ id: 'my_courses', label: 'My Courses', route: '/trainee/courses', icon: BookOpen });

  if (cap.showTimetable) {
    academicItems.push({ id: 'timetable', label: 'Timetable', route: '/trainee/timetable', icon: CalendarDays });
  }

  const participationItems: NavItem[] = [];
  if (cap.showAttendance) {
    participationItems.push({
      id: 'attendance_history',
      label: 'Attendance History',
      route: '/trainee/attendance',
      icon: ShieldCheck,
    });
  }
  // Certificates always visible
  participationItems.push({
    id: 'certificates',
    label: 'Certificates',
    route: '/trainee/certificates',
    icon: Award,
  });

  return [
    {
      title: 'ACADEMIC & PROGRAMMES',
      items: academicItems,
    },
    {
      title: 'PARTICIPATION & RECORDS',
      items: participationItems,
    },
    {
      title: 'CAREER',
      items: [
        { id: 'jobs', label: 'Job Opportunities', route: '/trainee/jobs', icon: Briefcase },
      ],
    },
    {
      title: 'PROFILE & SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', route: '/trainee/settings', icon: Settings },
        { id: 'help', label: 'Help & Support', route: '/trainee/help', icon: HelpCircle },
      ],
    },
  ];
}

export const NAVIGATION_BY_ROLE: Record<UserRole, NavSection[]> = {
  trainee: getTraineeNavigation({ programmeStatus: 'APPROVED', batchId: 'batch-pgdm-2026-a' }),

  institute_admin: [
    {
      title: 'MAIN',
      items: [
        { id: 'home', label: 'Dashboard', route: '/institute-admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'ADMISSIONS',
      items: [
        { id: 'programme_requests', label: 'Programme Requests', route: '/institute-admin/programme-requests', icon: FileCheck, badge: 'Approvals' },
        { id: 'nominations', label: 'Nominations', route: '/institute-admin/nominations', icon: Send },
        { id: 'trainee_directory', label: 'Trainees', route: '/institute-admin/trainees', icon: Users },
      ],
    },
    {
      title: 'TRAINING OPERATIONS',
      items: [
        { id: 'programmes_erp', label: 'Programmes', route: '/institute-admin/programmes', icon: Layers },
        { id: 'attendance', label: 'Attendance Devices', route: '/institute-admin/attendance', icon: Cpu },
      ],
    },
    {
      title: 'CAMPUS & LOGISTICS',
      items: [
        { id: 'hostel', label: 'Hostel & Rooms', route: '/institute-admin/hostel', icon: BedDouble },
        { id: 'timetable', label: 'Academic Timetable', route: '/institute-admin/timetable', icon: CalendarDays },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'reports', label: 'Analytics', route: '/institute-admin/analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', route: '/institute-admin/settings', icon: Settings },
      ],
    },
  ],

  super_admin: [
    {
      title: 'MAIN',
      items: [
        { id: 'home', label: 'National Dashboard', route: '/super-admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'FEDERATION & GOVERNANCE',
      items: [
        { id: 'institutes', label: '20 NCCT Institutes', route: '/super-admin/institutes', icon: Building2 },
        { id: 'user_management', label: 'User & Role Management', route: '/super-admin/users', icon: UserCheck },
        { id: 'national_curriculum', label: 'National Curriculum Hub', route: '/super-admin/curriculum', icon: BookOpen },
        { id: 'national_certificates', label: 'National Certificate Registry', route: '/super-admin/certificates', icon: Award },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'analytics', label: 'National Analytics', route: '/super-admin/analytics', icon: TrendingUp },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', route: '/super-admin/settings', icon: Settings },
      ],
    },
  ],

  faculty: [
    {
      title: 'MAIN',
      items: [
        { id: 'home', label: 'Dashboard', route: '/faculty/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'TEACHING & CURRICULUM',
      items: [
        { id: 'courses', label: 'Courses', route: '/faculty/courses', icon: BookOpen },
        { id: 'course_builder', label: 'Course Studio', route: '/faculty/courses/crs-pacs-erp-101/edit', icon: Edit3, badge: 'Studio' },
        { id: 'timetable', label: 'Academic Timetable', route: '/faculty/timetable', icon: CalendarDays },
        { id: 'attendance', label: 'Classroom Attendance', route: '/faculty/attendance', icon: Users },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', route: '/faculty/settings', icon: Settings },
      ],
    },
  ],

  employer: [
    {
      title: 'MAIN',
      items: [
        { id: 'home', label: 'Recruiter Dashboard', route: '/employer/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'TALENT ACQUISITION',
      items: [
        { id: 'trainee_directory', label: 'Candidates', route: '/employer/candidates', icon: Users, badge: 'Verified' },
        { id: 'jobs', label: 'Job Postings', route: '/employer/jobs', icon: Briefcase },
      ],
    },
  ],

  device_operator: [
    {
      title: 'MAIN',
      items: [
        { id: 'home', label: 'Hardware Dashboard', route: '/device/dashboard', icon: LayoutDashboard },
        { id: 'device_monitoring', label: 'Live Monitoring', route: '/device/monitoring', icon: Activity, badge: 'Live' },
      ],
    },
    {
      title: 'HARDWARE & KIOSKS',
      items: [
        { id: 'device_fleet', label: 'Device Fleet', route: '/device/devices', icon: Cpu },
        { id: 'device_test', label: 'Hardware Diagnostics', route: '/device/test', icon: Wrench },
        { id: 'device_sync_queue', label: 'Offline Sync Queue', route: '/device/sync-queue', icon: RefreshCw },
      ],
    },
    {
      title: 'SERVICE & REPAIR',
      items: [
        { id: 'device_incidents', label: 'Incidents & Alerts', route: '/device/incidents', icon: AlertTriangle },
        { id: 'device_maintenance', label: 'Maintenance Logs', route: '/device/maintenance', icon: Wrench },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', route: '/device/settings', icon: Settings },
      ],
    },
  ],

  hostel_admin: [
    {
      title: 'MAIN',
      items: [
        { id: 'home', label: 'Hostel Operations Hub', route: '/hostel-admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'INFRASTRUCTURE & INVENTORY',
      items: [
        { id: 'hostel_blocks', label: 'Hostel Blocks', route: '/hostel-admin/blocks', icon: Building2 },
        { id: 'hostel_rooms', label: 'Rooms & Bed Matrix', route: '/hostel-admin/rooms', icon: BedDouble },
      ],
    },
    {
      title: 'RESIDENTIAL LIFECYCLE',
      items: [
        { id: 'hostel_requests', label: 'Trainee Requests', route: '/hostel-admin/requests', icon: FileCheck, badge: 'Priority' },
        { id: 'hostel_allocations', label: 'Bed Allocations', route: '/hostel-admin/allocations', icon: Users },
        { id: 'hostel_checkin', label: 'Check-In & Gate Verification', route: '/hostel-admin/checkin', icon: ShieldCheck, badge: 'NFC/Pass' },
      ],
    },
    {
      title: 'RESIDENT SERVICES & AUDIT',
      items: [
        { id: 'hostel_complaints', label: 'Complaints & Repairs', route: '/hostel-admin/complaints', icon: AlertTriangle },
        { id: 'hostel_reports', label: 'Occupancy & Mess Audit', route: '/hostel-admin/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', route: '/hostel-admin/settings', icon: Settings },
      ],
    },
  ],
};
