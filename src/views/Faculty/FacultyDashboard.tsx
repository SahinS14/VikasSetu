import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Edit3,
  Users,
  Award,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  QrCode,
  Layers,
  GraduationCap,
  AlertTriangle,
  FileText,
  Briefcase,
  Search,
  X,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Plus,
  Filter,
  Check,
  Percent,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { GlobalModal } from '../../components/common/GlobalModal';
import { api } from '../../lib/api';

interface FacultyStats {
  coursesAuthored: number;
  totalEnrolledTrainees: number;
  avgCompletionRate: number;
  avgQuizPassRate: number;
}

interface FacultySession {
  id: string;
  title: string;
  courseTitle: string;
  instructor: string;
  date: string;
  timeSlot: string;
  room: string;
  qrToken: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

interface FacultyCourse {
  id: string;
  title: string;
  titleHi?: string;
  category: string;
  level: string;
  durationHours: number;
  thumbnail: string;
  enrolledCount: number;
  completionRate: number;
  quizPassRate: number;
  status: string;
  lastUpdated: string;
}

interface AtRiskTrainee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  cooperativeAffiliation?: string | null;
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  attendancePercent: number;
  assessmentStatus: string;
  riskReasons: string[];
  lastActive: string;
}

interface AssessmentPerformance {
  avgScore: number;
  passRate: number;
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  retakesCount: number;
  highestScore: number;
  lowestScore: number;
  questionPerformance: Array<{
    questionId: string;
    questionText: string;
    correctPercent: number;
    incorrectPercent: number;
    totalAnswers: number;
  }>;
}

interface CertificatePipeline {
  eligible: number;
  generated: number;
  pending: number;
  certificates: Array<{
    id: string;
    userName: string;
    courseTitle: string;
    certificateNumber?: string | null;
    grade: string;
    issuedDate: string;
    verificationToken?: string | null;
  }>;
}

interface EmploymentReadiness {
  jobReadyCount: number;
  almostReadyCount: number;
  needsTrainingCount: number;
  averageJobMatch: number;
  topMatches: Array<{
    traineeId: string;
    traineeName: string;
    courseTitle: string;
    jobId: string;
    jobTitle: string;
    employerName: string;
    matchScore: number;
    eligibilityStatus: string;
    missingSkills: string[];
    recommendedCourse?: {
      courseId: string;
      courseTitle: string;
      skillAddressed: string;
    } | null;
  }>;
  commonMissingSkills: Array<{
    skill: string;
    count: number;
    recommendedCourse: string;
  }>;
}

export const FacultyDashboard: React.FC = () => {
  const { currentUser, courses, sessions, timetable, navigate, currentLanguage } = useApp();

  // State management for API data & UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Dashboard Data (Strictly database driven)
  const [stats, setStats] = useState<FacultyStats>({
    coursesAuthored: 0,
    totalEnrolledTrainees: 0,
    avgCompletionRate: 0,
    avgQuizPassRate: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<FacultySession[]>([]);
  const [facultyCourses, setFacultyCourses] = useState<FacultyCourse[]>([]);
  const [atRiskTrainees, setAtRiskTrainees] = useState<AtRiskTrainee[]>([]);
  const [assessmentPerf, setAssessmentPerf] = useState<AssessmentPerformance | null>(null);
  const [certPipeline, setCertPipeline] = useState<CertificatePipeline | null>(null);
  const [employmentReadiness, setEmploymentReadiness] = useState<EmploymentReadiness | null>(null);

  // Modals state
  const [selectedSession, setSelectedSession] = useState<FacultySession | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrSession, setActiveQrSession] = useState<FacultySession | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<AtRiskTrainee | null>(null);
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    title: '',
    courseId: courses[0]?.id || 'crs-pacs-erp-101',
    date: 'Today',
    timeSlot: '10:00 AM – 12:00 PM',
    room: 'Smart Computer Lab 2',
  });
  const [sessionSuccessToast, setSessionSuccessToast] = useState<string | null>(null);

  const facultyName = currentUser?.name || 'Prof. Meenakshi Sundaram';

  const applyDashboardData = (data: any) => {
    if (!data) return;
    if (data.stats) setStats(data.stats);
    if (data.upcomingSessions) setUpcomingSessions(data.upcomingSessions);
    if (data.myCourses) setFacultyCourses(data.myCourses);
    if (data.atRiskTrainees) setAtRiskTrainees(data.atRiskTrainees);
    if (data.assessmentPerformance) setAssessmentPerf(data.assessmentPerformance);
    if (data.certificates) setCertPipeline(data.certificates);
    if (data.employmentReadiness) setEmploymentReadiness(data.employmentReadiness);
  };

  // Load authoritative data from backend
  const fetchDashboardData = async () => {
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem('ss_faculty_dash_cache');
        if (cached) {
          applyDashboardData(JSON.parse(cached));
          setError(null);
          setLoading(false);
          return;
        }
      } catch {}
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.faculty.getDashboard();
      if (data) {
        applyDashboardData(data);
        try {
          localStorage.setItem('ss_faculty_dash_cache', JSON.stringify(data));
        } catch {}
      }
    } catch (err: any) {
      console.warn('Failed to load faculty dashboard data from backend, checking cache:', err);
      try {
        const cached = localStorage.getItem('ss_faculty_dash_cache');
        if (cached) {
          applyDashboardData(JSON.parse(cached));
          setError(null);
          return;
        }
      } catch {}
      setError('Unable to load faculty dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser?.id]);

  // Handle Session actions
  const handleOpenSessionModal = (session: FacultySession) => {
    setSelectedSession(session);
  };

  const handleOpenQrModal = (session: FacultySession) => {
    setActiveQrSession(session);
    setShowQrModal(true);
  };

  const handleStartSession = async (session: FacultySession) => {
    try {
      await api.attendance.activateSession(session.id, true);
      setSessionSuccessToast(`Session "${session.title}" activated and marked LIVE.`);
      setTimeout(() => setSessionSuccessToast(null), 4000);
      await fetchDashboardData();
      setActiveQrSession({ ...session, status: 'LIVE' });
      setShowQrModal(true);
    } catch (err: any) {
      console.error('Failed to activate session:', err);
      setSessionSuccessToast(`Failed to activate session: ${err.message || 'Error'}`);
      setTimeout(() => setSessionSuccessToast(null), 4000);
    }
  };

  const handleContinueSession = (session: FacultySession) => {
    setActiveQrSession(session);
    setShowQrModal(true);
  };

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.attendance.createSession({
        title: newSessionForm.title.trim() || 'Live Interactive Lab Session',
        courseId: newSessionForm.courseId,
        date: newSessionForm.date,
        timeSlot: newSessionForm.timeSlot,
        room: newSessionForm.room,
        instructor: facultyName,
      });
      setShowCreateSessionModal(false);
      setSessionSuccessToast(`Session "${newSessionForm.title}" scheduled successfully!`);
      setTimeout(() => setSessionSuccessToast(null), 4000);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to schedule session:', err);
      setSessionSuccessToast(`Failed to schedule session: ${err.message || 'Error'}`);
      setTimeout(() => setSessionSuccessToast(null), 4000);
    }
  };

  // Primary Course Studio navigation target
  const defaultStudioCourseId = facultyCourses[0]?.id || courses[0]?.id || 'crs-pacs-erp-101';

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-24 sm:pb-28 lg:pb-16 text-govText-primary">
        {/* Toast Notification */}
        {sessionSuccessToast && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-fadeIn border border-emerald-500">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{sessionSuccessToast}</span>
          </div>
        )}

        {/* 1. Header: Welcome Banner (Deep Teal Government Visual Language) */}
        <header
          id="faculty-header"
          aria-label="Faculty Profile Welcome Banner"
          className="bg-gradient-to-r from-govTeal-900 via-govTeal-800 to-govTeal-700 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-govTeal-600 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-md text-xs font-bold text-saffron-300 tracking-wide uppercase">
                NCCT Faculty & Curriculum Directorate
              </span>
              <SimulatedBadge text="VAMNICOM Apex Academic Node" className="bg-white/10 text-amber-200 border-white/20" />
            </div>
            <span className="text-xs text-govTeal-100 font-mono">
              Academic Term 2025–26 • Semester II
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome, {facultyName}
              </h1>
              <p className="text-sm text-govTeal-100 flex items-center gap-2 flex-wrap">
                <GraduationCap className="w-4 h-4 text-saffron-300 flex-shrink-0" />
                <span>Senior Faculty, Dept. of Cooperative IT & Rural Management</span>
                <span className="text-govTeal-300 hidden sm:inline">•</span>
                <span className="text-amber-200 font-medium">VAMNICOM, Pune</span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                id="btn-refresh-dashboard"
                type="button"
                onClick={fetchDashboardData}
                disabled={loading}
                title="Refresh Live Statistics"
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white border border-white/20 transition-all cursor-pointer disabled:opacity-50"
                aria-label="Refresh Dashboard"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                id="btn-go-course-studio"
                type="button"
                onClick={() => navigate(`/faculty/courses/${defaultStudioCourseId}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-govTeal-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-govTeal-950" />
                <span>Go to Course Studio</span>
              </button>
            </div>
          </div>
        </header>

        {/* Error Banner with Retry */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3 text-red-800 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Quick Statistics Cards (Calculated from real application data) */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Key Performance Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Courses Authored */}
            <div
              id="card-courses-authored"
              onClick={() => navigate('/faculty/courses')}
              className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-2 hover:shadow-md transition-all cursor-pointer group"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider group-hover:text-govTeal-700 transition-colors">
                  Courses Authored
                </span>
                <div className="w-9 h-9 rounded-xl bg-govTeal-50 flex items-center justify-center text-govTeal-700 group-hover:bg-govTeal-100 transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-extrabold text-govText-primary">
                  {stats.coursesAuthored}
                </p>
              )}
              <p className="text-[11px] text-govTeal-800 font-semibold flex items-center justify-between">
                <span>{stats.coursesAuthored === 0 ? 'No courses authored yet' : 'National Accredited Modules'}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>

            {/* Card 2: Total Enrolled Trainees */}
            <div
              id="card-enrolled-trainees"
              onClick={() => navigate('/institute-admin/trainees')}
              className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-2 hover:shadow-md transition-all cursor-pointer group"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-700 transition-colors">
                  Enrolled Trainees
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 group-hover:bg-blue-100 transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-extrabold text-govText-primary">
                  {stats.totalEnrolledTrainees.toLocaleString()}
                </p>
              )}
              <p className="text-[11px] text-blue-800 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>{stats.totalEnrolledTrainees === 0 ? 'No trainees enrolled yet' : 'Verified Candidate Profiles'}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>

            {/* Card 3: Average Completion Rate */}
            <div
              id="card-avg-completion"
              onClick={() => {
                const el = document.getElementById('my-courses-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-2 hover:shadow-md transition-all cursor-pointer group"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                  Avg. Completion Rate
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-100 transition-colors">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-extrabold text-govText-primary">
                  {stats.avgCompletionRate}%
                </p>
              )}
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
                <span>Calculated from real lesson progress</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>

            {/* Card 4: Quiz Pass Rate */}
            <div
              id="card-quiz-pass-rate"
              onClick={() => setShowAssessmentModal(true)}
              className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-2 hover:shadow-md transition-all cursor-pointer group"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                  Quiz Pass Rate
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:bg-amber-100 transition-colors">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-extrabold text-govText-primary">
                  {stats.avgQuizPassRate}%
                </p>
              )}
              <p className="text-[11px] text-amber-700 font-semibold flex items-center justify-between">
                <span>75% Minimum Passing Benchmark</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </div>
          </div>
        </section>

        {/* 3. Quick Actions Bar */}
        <section aria-label="Faculty Quick Actions" className="bg-white rounded-2xl p-4 sm:p-5 border border-govText-border shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-govText-secondary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-saffron-600" />
              Faculty Command & Quick Actions
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              id="btn-quick-create-course"
              type="button"
              onClick={() => navigate('/faculty/courses/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-900 border border-govTeal-200 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5 text-govTeal-700" />
              <span>Create Course</span>
            </button>

            <button
              id="btn-quick-create-session"
              type="button"
              onClick={() => setShowCreateSessionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-900 border border-govTeal-200 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[38px]"
            >
              <Calendar className="w-3.5 h-3.5 text-govTeal-700" />
              <span>Create Session</span>
            </button>

            <button
              id="btn-quick-create-quiz"
              type="button"
              onClick={() => navigate(`/faculty/courses/${defaultStudioCourseId}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[38px]"
            >
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>Create / Edit Quiz</span>
            </button>

            <button
              id="btn-quick-generate-qr"
              type="button"
              onClick={() => navigate('/faculty/attendance')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[38px]"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>Generate Attendance QR</span>
            </button>

            <button
              id="btn-quick-upload-material"
              type="button"
              onClick={() => navigate(`/faculty/courses/${defaultStudioCourseId}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[38px]"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>Upload Materials</span>
            </button>

            <button
              id="btn-quick-view-trainees"
              type="button"
              onClick={() => navigate('/institute-admin/trainees')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[38px]"
            >
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span>View All Trainees</span>
            </button>
          </div>
        </section>

        {/* 4. Upcoming Sessions */}
        <section id="upcoming-sessions-section" className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-govText-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-govTeal-600" />
                Upcoming Sessions & Practical Labs
              </h2>
              <p className="text-xs text-govText-secondary mt-0.5">
                Live practical lab lectures, ERP sessions, and weekly scheduled classes assigned to {facultyName}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-govTeal-50 text-govTeal-900 border border-govTeal-200">
                {upcomingSessions.length} Sessions Scheduled
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="p-8 text-center bg-govBg rounded-xl border border-dashed border-gray-300 space-y-2">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-semibold text-gray-600">No upcoming sessions.</p>
              <p className="text-xs text-gray-500">Create a session using the quick action button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingSessions.map(session => {
                const isLive = session.status === 'LIVE';
                const isCompleted = session.status === 'COMPLETED';

                return (
                  <div
                    key={session.id}
                    id={`session-card-${session.id}`}
                    className={`rounded-xl p-4 border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                      isLive
                        ? 'bg-[#FBFDFB] border-emerald-400 shadow-sm'
                        : 'bg-white border-govText-border hover:border-govTeal-400'
                    }`}
                  >
                    {isLive && <div className="absolute top-0 right-0 w-2.5 h-full bg-emerald-600" />}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isLive
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isCompleted
                              ? 'bg-gray-100 text-gray-700 border border-gray-200'
                              : 'bg-blue-50 text-blue-900 border border-blue-200'
                          }`}
                        >
                          {isLive && <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />}
                          {session.status}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-govTeal-900">
                          {session.date}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-govText-primary leading-snug line-clamp-2">
                        {session.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-govText-secondary pt-1">
                        <div className="flex items-center gap-2 text-govTeal-900 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-govTeal-600 flex-shrink-0" />
                          <span>{session.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-govTeal-600 flex-shrink-0" />
                          <span className="truncate">{session.room}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSessionModal(session)}
                        className="text-[11px] font-bold text-govTeal-700 hover:text-govTeal-950 underline cursor-pointer"
                      >
                        Session Details
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenQrModal(session)}
                          title="Generate Attendance QR Kiosk"
                          className="p-1.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 rounded-lg border border-govTeal-200 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {isLive ? (
                          <button
                            type="button"
                            onClick={() => handleContinueSession(session)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                          >
                            Continue Session
                          </button>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSessionModal(session)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer"
                          >
                            View Session
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartSession(session)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-govTeal-600 hover:bg-govTeal-700 text-white cursor-pointer"
                          >
                            Start Session
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. Two-Column Row: My Courses & At-Risk Trainees */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: My Courses (7 Cols) */}
          <section id="my-courses-section" className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-govText-primary flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-govTeal-600" />
                  My Authored Courses
                </h2>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Curriculum modules authored and maintained by your faculty credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/faculty/courses')}
                className="inline-flex items-center gap-1 text-xs font-bold text-govTeal-700 hover:text-govTeal-900 hover:underline cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : facultyCourses.length === 0 ? (
              <div className="p-8 text-center bg-govBg rounded-xl border border-dashed border-gray-300 space-y-2">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-600">No courses authored yet.</p>
                <p className="text-xs text-gray-500">Create a new course in Course Studio to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {facultyCourses.slice(0, 4).map(course => (
                  <div
                    key={course.id}
                    id={`course-item-${course.id}`}
                    className="p-3.5 rounded-xl border border-govText-border hover:border-govTeal-400 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-16 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-govTeal-50 text-govTeal-800 border border-govTeal-200">
                            {course.category}
                          </span>
                          <span className="text-[10px] text-govText-muted">
                            {course.durationHours} Hours
                          </span>
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-govText-primary truncate">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-govText-secondary">
                          <span><strong>{course.enrolledCount}</strong> Trainees</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{course.completionRate}% Completion</span>
                          <span>•</span>
                          <span className="text-amber-700 font-semibold">{course.quizPassRate}% Quiz Pass</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/faculty/courses/${course.id}/edit`)}
                        className="px-3 py-1.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-900 border border-govTeal-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Manage in Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: At-Risk Trainees (5 Cols) */}
          <section id="at-risk-section" className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-red-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  At-Risk Trainees
                </h2>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Dynamic flags: progress &lt; 40%, attendance &lt; 75%, or failed tests.
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                {atRiskTrainees.length} Flagged
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : atRiskTrainees.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50/50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-emerald-900">No trainees currently at risk.</p>
                <p className="text-[11px] text-emerald-700">All enrolled trainees are meeting academic and attendance benchmarks.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {atRiskTrainees.map(trainee => (
                  <div
                    key={trainee.id}
                    id={`at-risk-card-${trainee.id}`}
                    className="p-3.5 rounded-xl border border-red-200 bg-red-50/30 hover:bg-red-50/60 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-govText-primary">
                          {trainee.name}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-900 px-2 py-0.5 rounded font-bold">
                          {trainee.progressPercent}% Progress
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-600 space-y-0.5">
                        <p className="truncate">Course: <strong className="text-gray-800">{trainee.courseTitle}</strong></p>
                        <p className="text-red-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{trainee.riskReasons.join(' • ')}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTrainee(trainee)}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-govText-primary rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 shadow-2xs"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 6. Two-Column Row: Assessment Performance & Certificate Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Assessment Performance (6 Cols) */}
          <section id="assessment-section" className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-govText-primary flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-govTeal-600" />
                  Assessment Performance
                </h2>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Aggregate quiz scoring & question difficulty across authored courses.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAssessmentModal(true)}
                className="text-xs font-bold text-govTeal-700 hover:underline cursor-pointer"
              >
                Analytics
              </button>
            </div>

            {loading ? (
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-govBg rounded-xl border border-gray-100">
                    <span className="text-[10px] text-govText-muted uppercase block font-bold">Avg Score</span>
                    <span className="text-xl font-extrabold text-govTeal-800">{assessmentPerf?.avgScore ?? 0}%</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 uppercase block font-bold">Pass Rate</span>
                    <span className="text-xl font-extrabold text-emerald-700">{assessmentPerf?.passRate ?? 0}%</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-800 uppercase block font-bold">Failed Count</span>
                    <span className="text-xl font-extrabold text-amber-700">{assessmentPerf?.failedCount ?? 0}</span>
                  </div>
                </div>

                {/* Sample Question Difficulty Row */}
                {(!assessmentPerf || assessmentPerf.questionPerformance.length === 0) ? (
                  <div className="p-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs font-semibold text-gray-500">No assessment question attempts recorded yet.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <span className="font-bold text-[11px] text-govText-secondary uppercase">Question Diagnostic Snapshot</span>
                    {assessmentPerf.questionPerformance.slice(0, 2).map(q => (
                      <div key={q.questionId} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="truncate pr-2 font-medium">{q.questionText}</span>
                          <span className="font-bold text-emerald-700 flex-shrink-0">{q.correctPercent}% Correct</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full" style={{ width: `${q.correctPercent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right Column: Certificates Pipeline (6 Cols) */}
          <section id="certificates-section" className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-govText-primary flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Certificates Pipeline
                </h2>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Dual rule: 100% curriculum completion AND assessment score &ge; 75%.
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {certPipeline?.generated || 0} Issued
              </span>
            </div>

            {loading ? (
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-800 uppercase block font-bold">Eligible</span>
                    <span className="text-xl font-extrabold text-blue-700">{certPipeline?.eligible || 0}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 uppercase block font-bold">Generated</span>
                    <span className="text-xl font-extrabold text-emerald-700">{certPipeline?.generated || 0}</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-800 uppercase block font-bold">Pending</span>
                    <span className="text-xl font-extrabold text-amber-700">{certPipeline?.pending || 0}</span>
                  </div>
                </div>

                {(!certPipeline || certPipeline.certificates.length === 0) ? (
                  <div className="p-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs font-semibold text-gray-500">No certificate activity yet.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <span className="font-bold text-[11px] text-govText-secondary uppercase">Recent Verified Credentials</span>
                    {certPipeline.certificates.slice(0, 2).map(c => (
                      <div key={c.id} className="flex items-center justify-between text-[11px] py-0.5">
                        <div className="truncate pr-2">
                          <span className="font-bold text-govText-primary">{c.userName}</span>
                          <span className="text-govText-muted"> — {c.courseTitle}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                          {c.certificateNumber || 'VERIFIED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* 7. Employment Readiness (Powered by Matching Engine) */}
        <section id="employment-readiness-section" className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-govText-primary flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-govTeal-600" />
                  Employment Readiness & Cooperative Job Matching
                </h2>
                <SimulatedBadge text="NCCT Matching Engine" />
              </div>
              <p className="text-xs text-govText-secondary mt-0.5">
                Evaluates trainee skills, verified certificates, and coursework against active cooperative job postings.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowEmploymentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-900 border border-govTeal-200 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>View Skill & Employment Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-4">
              {/* Readiness Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">Job Ready</span>
                  <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                    {employmentReadiness?.jobReadyCount ?? 0}
                  </p>
                  <span className="text-[10px] text-emerald-700">Match Score &ge; 80% • Fully Eligible</span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] font-bold text-blue-800 uppercase block">Almost Ready</span>
                  <p className="text-2xl font-extrabold text-blue-900 mt-1">
                    {employmentReadiness?.almostReadyCount ?? 0}
                  </p>
                  <span className="text-[10px] text-blue-700">Match 60% – 79% • 1 Minor Skill Gap</span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">Needs Training</span>
                  <p className="text-2xl font-extrabold text-amber-900 mt-1">
                    {employmentReadiness?.needsTrainingCount ?? 0}
                  </p>
                  <span className="text-[10px] text-amber-700">In Progress Curriculum</span>
                </div>

                <div className="p-4 rounded-xl bg-govBg border border-govTeal-200">
                  <span className="text-[11px] font-bold text-govTeal-900 uppercase block">Average Job Match</span>
                  <p className="text-2xl font-extrabold text-govTeal-950 mt-1">
                    {employmentReadiness?.averageJobMatch ?? 0}%
                  </p>
                  <span className="text-[10px] text-govTeal-700">Across active cooperative postings</span>
                </div>
              </div>

              {/* Sample Top Matches */}
              {(!employmentReadiness || employmentReadiness.topMatches.length === 0) ? (
                <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-1">
                  <Briefcase className="w-6 h-6 text-gray-400 mx-auto" />
                  <p className="text-xs font-semibold text-gray-600">No employment matching data available yet.</p>
                </div>
              ) : (
                <div className="pt-2">
                  <span className="text-xs font-bold text-govText-secondary uppercase block mb-2">
                    Top Matched Candidate Recommendations
                  </span>
                  <div className="space-y-2">
                    {employmentReadiness.topMatches.slice(0, 3).map((match, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FBFDFB] border border-govText-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-govText-primary text-sm">{match.traineeName}</strong>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-bold text-[10px]">
                              {match.matchScore}% Match
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold">{match.eligibilityStatus}</span>
                          </div>
                          <p className="text-gray-600">
                            Target Role: <strong className="text-govText-primary">{match.jobTitle}</strong> ({match.employerName})
                          </p>
                          {match.missingSkills.length > 0 && (
                            <p className="text-amber-800 font-semibold flex items-center gap-1">
                              <span>Missing Skill:</span>
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">
                                {match.missingSkills.join(', ')}
                              </span>
                              {match.recommendedCourse && (
                                <span className="text-govTeal-700 ml-1">
                                  &rarr; Recommended: {match.recommendedCourse.courseTitle}
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/institute-admin/trainees')}
                          className="px-3 py-1.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-900 border border-govTeal-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 self-end sm:self-center"
                        >
                          View Career Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* MODAL 1: Session Details Modal */}
        {/* ========================================================================= */}
        <GlobalModal
          isOpen={Boolean(selectedSession)}
          onClose={() => setSelectedSession(null)}
          maxWidth="max-w-xl"
          ariaLabel="Session Details"
        >
          {selectedSession && (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-govTeal-700 uppercase tracking-wider">
                    Laboratory & Lecture Session
                  </span>
                  <h2 className="text-lg font-extrabold text-govText-primary mt-0.5">
                    {selectedSession.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-govBg p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-500 block">Course / Programme</span>
                  <span className="font-bold text-govText-primary">{selectedSession.courseTitle}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Lead Instructor</span>
                  <span className="font-bold text-govText-primary">{selectedSession.instructor}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Scheduled Date & Time</span>
                  <span className="font-bold text-govText-primary">{selectedSession.date} • {selectedSession.timeSlot}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Venue / Lab</span>
                  <span className="font-bold text-govText-primary">{selectedSession.room}</span>
                </div>
              </div>

              {/* Attendance Statistics */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-govText-secondary uppercase">Attendance Live Roster</span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 uppercase block font-bold">Present</span>
                    <span className="text-xl font-extrabold text-emerald-700">{selectedSession.presentCount}</span>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <span className="text-[10px] text-red-800 uppercase block font-bold">Absent</span>
                    <span className="text-xl font-extrabold text-red-700">{selectedSession.absentCount}</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-800 uppercase block font-bold">Late</span>
                    <span className="text-xl font-extrabold text-amber-700">{selectedSession.lateCount}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrModal(true);
                      setActiveQrSession(selectedSession);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generate Attendance QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      navigate('/institute-admin/attendance');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-900 border border-govTeal-200 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>View Attendance Kiosk</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      navigate(`/faculty/courses/${defaultStudioCourseId}/edit`);
                    }}
                    className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 cursor-pointer"
                  >
                    Upload Materials
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      setSessionSuccessToast('Session updated.');
                    }}
                    className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 cursor-pointer"
                  >
                    Edit Session
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpcomingSessions(prev => prev.filter(s => s.id !== selectedSession.id));
                      setSelectedSession(null);
                      setSessionSuccessToast('Session cancelled.');
                    }}
                    className="py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 cursor-pointer"
                  >
                    Cancel Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlobalModal>

        {/* ========================================================================= */}
        {/* MODAL 2: Live Attendance QR Kiosk Modal */}
        {/* ========================================================================= */}
        <GlobalModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          maxWidth="max-w-md"
          ariaLabel="Attendance QR Code"
        >
          {activeQrSession && (
            <div className="p-6 text-center space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-govTeal-700 uppercase">
                  NCCT Verified Kiosk Session
                </span>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-govText-primary">
                  {activeQrSession.title}
                </h3>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Scan via Trainee Mobile PWA to log verified attendance.
                </p>
              </div>

              {/* QR Display */}
              <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-md inline-block mx-auto">
                <div className="w-56 h-56 bg-gray-50 rounded-xl flex flex-col items-center justify-center p-3 border border-gray-200 space-y-2">
                  <QrCode className="w-40 h-40 text-govTeal-900" />
                  <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                    {activeQrSession.qrToken}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-emerald-700">● Live Dynamic Token • Refreshing Every 30s</p>
                <p>Location: {activeQrSession.room} • Instructor: {activeQrSession.instructor}</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    navigate('/institute-admin/attendance');
                  }}
                  className="w-full py-2.5 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Open Full Screen Kiosk
                </button>
              </div>
            </div>
          )}
        </GlobalModal>

        {/* ========================================================================= */}
        {/* MODAL 3: At-Risk Trainee Detailed Profile Modal */}
        {/* ========================================================================= */}
        <GlobalModal
          isOpen={Boolean(selectedTrainee)}
          onClose={() => setSelectedTrainee(null)}
          maxWidth="max-w-xl"
          ariaLabel="Trainee Academic Profile"
        >
          {selectedTrainee && (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-govTeal-100 text-govTeal-800 flex items-center justify-center font-bold text-base">
                    {selectedTrainee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-govText-primary">{selectedTrainee.name}</h3>
                    <p className="text-xs text-govText-secondary">{selectedTrainee.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTrainee(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-[10px] text-red-800 uppercase block font-bold">Course Progress</span>
                  <span className="text-xl font-extrabold text-red-700">{selectedTrainee.progressPercent}%</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-800 uppercase block font-bold">Attendance</span>
                  <span className="text-xl font-extrabold text-amber-700">{selectedTrainee.attendancePercent}%</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-800 uppercase block font-bold">Assessment</span>
                  <span className="text-sm font-extrabold text-blue-900 mt-1 block">{selectedTrainee.assessmentStatus}</span>
                </div>
              </div>

              {/* Identified Risk Factors */}
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-1.5 text-xs">
                <span className="font-bold text-red-900 uppercase text-[10px]">Identified Diagnostic Risk Criteria</span>
                <ul className="list-disc pl-4 space-y-1 text-red-800">
                  {selectedTrainee.riskReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Academic Affiliation */}
              <div className="space-y-2 text-xs bg-govBg p-3.5 rounded-xl border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Enrolled Course:</span>
                  <span className="font-bold text-gray-800">{selectedTrainee.courseTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cooperative Society:</span>
                  <span className="font-bold text-gray-800">{selectedTrainee.cooperativeAffiliation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Active Learning Event:</span>
                  <span className="font-bold text-gray-800">{selectedTrainee.lastActive}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrainee(null);
                    navigate('/institute-admin/trainees');
                  }}
                  className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  View Full Trainee Record
                </button>
              </div>
            </div>
          )}
        </GlobalModal>

        {/* ========================================================================= */}
        {/* MODAL 4: Create Session Modal */}
        {/* ========================================================================= */}
        <GlobalModal
          isOpen={showCreateSessionModal}
          onClose={() => setShowCreateSessionModal(false)}
          maxWidth="max-w-lg"
          ariaLabel="Create New Session"
        >
          <form onSubmit={handleCreateSessionSubmit} className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-govText-primary">Schedule New Faculty Session</h3>
              <button
                type="button"
                onClick={() => setShowCreateSessionModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Session Topic / Title</label>
                <input
                  type="text"
                  required
                  value={newSessionForm.title}
                  onChange={e => setNewSessionForm({ ...newSessionForm, title: e.target.value })}
                  placeholder="e.g. Hands-on ERP Ledger Reconciliation & KCC Posting"
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Course Module</label>
                <select
                  value={newSessionForm.courseId}
                  onChange={e => setNewSessionForm({ ...newSessionForm, courseId: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 font-medium"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Date / Day</label>
                  <input
                    type="text"
                    required
                    value={newSessionForm.date}
                    onChange={e => setNewSessionForm({ ...newSessionForm, date: e.target.value })}
                    placeholder="e.g. Wednesday"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={newSessionForm.timeSlot}
                    onChange={e => setNewSessionForm({ ...newSessionForm, timeSlot: e.target.value })}
                    placeholder="e.g. 11:30 AM – 01:00 PM"
                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Venue / Computer Lab</label>
                <input
                  type="text"
                  required
                  value={newSessionForm.room}
                  onChange={e => setNewSessionForm({ ...newSessionForm, room: e.target.value })}
                  placeholder="e.g. Smart Computer Lab 2"
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCreateSessionModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm & Schedule Session
              </button>
            </div>
          </form>
        </GlobalModal>

        {/* ========================================================================= */}
        {/* MODAL 5: Employment Analytics Modal */}
        {/* ========================================================================= */}
        <GlobalModal
          isOpen={showEmploymentModal}
          onClose={() => setShowEmploymentModal(false)}
          maxWidth="max-w-2xl"
          ariaLabel="Employment & Skill Analytics"
        >
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-govTeal-700 uppercase">Employment Analytics</span>
                <h3 className="text-lg font-extrabold text-govText-primary">
                  Skill Match & Placement Diagnostics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmploymentModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Trainees</span>
                <span className="text-xl font-extrabold text-gray-900">{stats.totalEnrolledTrainees}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Job Ready</span>
                <span className="text-xl font-extrabold text-emerald-700">{employmentReadiness?.jobReadyCount ?? 0}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-800 uppercase font-bold block">Almost Ready</span>
                <span className="text-xl font-extrabold text-blue-700">{employmentReadiness?.almostReadyCount ?? 0}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 uppercase font-bold block">Needs Training</span>
                <span className="text-xl font-extrabold text-amber-700">{employmentReadiness?.needsTrainingCount ?? 0}</span>
              </div>
            </div>

            {/* Top Skill Gaps in Cohort */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-govText-secondary uppercase">
                Most Prevalent Curriculum Skill Gaps in Current Cohort
              </span>
              <div className="space-y-2">
                {(!employmentReadiness?.commonMissingSkills || employmentReadiness.commonMissingSkills.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                    No prevailing curriculum skill gaps identified.
                  </p>
                ) : (
                  employmentReadiness.commonMissingSkills.map((item, i) => (
                    <div key={i} className="p-3 bg-govBg rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-govText-primary">{item.skill}</span>
                        <p className="text-[11px] text-govText-muted">
                          Curriculum Bridge: <strong className="text-govTeal-700">{item.recommendedCourse}</strong>
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-900 font-bold rounded-md text-[10px]">
                        {item.count} Trainees Impacted
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmploymentModal(false);
                  navigate('/trainee/jobs');
                }}
                className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Browse All National Job Postings
              </button>
            </div>
          </div>
        </GlobalModal>

        {/* ========================================================================= */}
        {/* MODAL 6: Assessment Detailed Analytics Modal */}
        {/* ========================================================================= */}
        <GlobalModal
          isOpen={showAssessmentModal}
          onClose={() => setShowAssessmentModal(false)}
          maxWidth="max-w-2xl"
          ariaLabel="Assessment Analytics"
        >
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-govTeal-700 uppercase">Assessment Analytics</span>
                <h3 className="text-lg font-extrabold text-govText-primary">
                  Question-Level Performance & Difficulty Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Attempts</span>
                <span className="text-xl font-extrabold text-gray-900">{assessmentPerf?.totalAttempts ?? 0}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Passed</span>
                <span className="text-xl font-extrabold text-emerald-700">{assessmentPerf?.passedCount ?? 0}</span>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <span className="text-[10px] text-red-800 uppercase font-bold block">Failed</span>
                <span className="text-xl font-extrabold text-red-700">{assessmentPerf?.failedCount ?? 0}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 uppercase font-bold block">Retakes</span>
                <span className="text-xl font-extrabold text-amber-700">{assessmentPerf?.retakesCount ?? 0}</span>
              </div>
            </div>

            {/* Questions Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-govText-secondary uppercase">
                Question Difficulty Diagnostic
              </span>
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-govBg text-govText-secondary uppercase text-[10px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-3">Question Text</th>
                      <th className="p-3 text-center">Correct %</th>
                      <th className="p-3 text-center">Incorrect %</th>
                      <th className="p-3 text-right">Answers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(!assessmentPerf?.questionPerformance || assessmentPerf.questionPerformance.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500 italic">
                          No question attempt records available yet.
                        </td>
                      </tr>
                    ) : (
                      assessmentPerf.questionPerformance.map(q => (
                        <tr key={q.questionId} className="hover:bg-gray-50">
                          <td className="p-3 font-medium text-govText-primary max-w-[280px]">
                            {q.questionText}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-700">
                            {q.correctPercent}%
                          </td>
                          <td className="p-3 text-center font-bold text-red-600">
                            {q.incorrectPercent}%
                          </td>
                          <td className="p-3 text-right text-gray-500 font-mono">
                            {q.totalAnswers}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAssessmentModal(false);
                  navigate(`/faculty/courses/${defaultStudioCourseId}/edit`);
                }}
                className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Edit Questions in Course Studio
              </button>
            </div>
          </div>
        </GlobalModal>
      </div>
    </PageContainer>
  );
};

export default FacultyDashboard;
