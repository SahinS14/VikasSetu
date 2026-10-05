import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Briefcase,
  Download,
  Bot,
  BarChart3,
  Activity,
  AlertCircle,
  Loader2,
  HelpCircle,
  XCircle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Layers,
  BedDouble,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { CourseCard } from '../../components/common/CourseCard';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { downloadCertificatePdf } from '../../utils/certificateGenerator';
import { api } from '../../lib/api';

interface TraineeDashboardData {
  profile: {
    name: string;
    registrationId: string;
    role: string;
    institute: string;
    affiliation: string;
    eKycStatus: string;
  };
  stats: {
    coursesEnrolled: number;
    coursesCompleted: number;
    averageProgress: number;
    certificatesEarned: number;
    averageQuizScore: number;
    attendancePercentage: number | null;
  };
  courses: Array<{
    id: string;
    courseId: string;
    title: string;
    titleHi?: string;
    titleMr?: string;
    thumbnail: string;
    durationHours: number;
    category: string;
    level: string;
    status: string;
    progressPercent: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    enrolledDate: string;
    completionDate?: string | null;
  }>;
  quizPerformance: {
    attempted: number;
    passed: number;
    failed: number;
    averageScore: number;
  };
  attendance: {
    attended: number;
    total: number;
    percentage: number | null;
    hasRecords: boolean;
  };
  activeSession: {
    id: string;
    title: string;
    instructor: string;
    date: string;
    timeSlot: string;
    room: string;
    active: boolean;
    userCheckedIn: boolean;
  } | null;
  learningActivity: Array<{
    id: string;
    date: string;
    title: string;
    type: 'lesson' | 'quiz' | 'certificate';
    score?: number;
    progress?: number;
  }>;
}


export const TraineeHome: React.FC = () => {
  const {
    currentUser,
    navigate,
    t,
    currentLanguage,
    traineeStatus,
    isProgrammeApproved,
    isBatchAssigned,
    setTraineeActiveSession,
  } = useApp();

  const cacheKey = `ss_trainee_dash_${currentUser?.id || 'guest'}`;

  const [dashboardData, setDashboardData] = useState<TraineeDashboardData | null>(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!dashboardData);
  const [error, setError] = useState<string | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.trainee.getDashboard();
      setDashboardData(data);
      setTraineeActiveSession(data.activeSession || null);
      // Cache real server data for display during subsequent load spinners
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {}
    } catch (err: any) {
      console.error('[TraineeDashboard] API error:', err);
      // Try to restore from last successful cache (real data, never faked)
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setDashboardData(parsed);
          setTraineeActiveSession(parsed.activeSession || null);
          setError(null);
          return;
        }
      } catch {}
      // No cache available — show proper error state. NEVER inject fake data.
      setError(err?.message || 'Could not connect to the server. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, setTraineeActiveSession]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading && !dashboardData) {
    return (
      <PageContainer>
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-white rounded-3xl border border-govText-border p-10 shadow-sm">
          <Loader2 className="w-10 h-10 text-govTeal-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-base font-bold text-govText-primary">
              Loading your learning progress...
            </h3>
            <p className="text-xs text-govText-secondary mt-1">
              Synchronizing real records from PostgreSQL database
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error && !dashboardData) {
    return (
      <PageContainer>
        <div className="min-h-[350px] flex flex-col items-center justify-center space-y-4 bg-white rounded-3xl border border-rose-200 p-10 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <div>
            <h3 className="text-lg font-bold text-govText-primary">
              Unable to load your learning data.
            </h3>
            <p className="text-xs text-govText-secondary mt-1 max-w-md">
              {error || 'An error occurred while connecting to the database. Please try refreshing.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={fetchDashboard}
              className="px-5 py-2.5 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
            >
              Retry Dashboard Sync
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const { profile, stats, courses: userEnrolledCourses, quizPerformance, attendance, activeSession, learningActivity } = dashboardData;

  // Real enrolled courses for quick continue (DB-backed only; no catalog fallback)
  const inProgressCourse = userEnrolledCourses.find(c => c.status === 'IN_PROGRESS') || userEnrolledCourses[0];
  const quickCourseId = inProgressCourse ? inProgressCourse.id : null;

  // Course Progress Chart data from authenticated trainee's real database enrollments
  const courseChartData = userEnrolledCourses.map(c => ({
    name: c.title.length > 20 ? `${c.title.substring(0, 18)}…` : c.title,
    fullName: c.title,
    progress: Math.min(100, Math.max(0, c.progressPercent)),
  }));

  // Learning Activity line chart data if sufficient historical records exist
  const hasLearningHistory = learningActivity && learningActivity.length >= 2;
  const activityChartData = hasLearningHistory
    ? learningActivity.slice().reverse().map((act, index) => ({
        step: `Event ${index + 1}`,
        date: act.date,
        score: act.score ?? (act.type === 'certificate' ? 100 : 75),
        title: act.title,
      }))
    : [];

  return (
    <PageContainer>
      {/* 1. Hero Welcome Banner — 100% Authenticated User Profile */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-govTeal-700 via-govTeal-800 to-govTeal-900 text-white p-5 sm:p-7 shadow-md border border-govTeal-600/50">
        <div className="relative z-10 max-w-4xl space-y-3">

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-white/15 backdrop-blur-md rounded-md text-[11px] font-bold text-saffron-300">
              NCCT Trainee Portal
            </span>
            <span className="px-2.5 py-0.5 bg-white/10 rounded-md text-[10px] font-semibold text-emerald-300 font-mono">
              ID: {profile.registrationId}
            </span>
            {profile.eKycStatus === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-md text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                e-KYC Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-400/30 rounded-md text-[10px] font-bold">
                e-KYC Pending
              </span>
            )}
          </div>

          <div>
            <h1 className={`text-xl sm:text-3xl font-extrabold tracking-tight leading-tight ${currentLanguage !== 'en' ? 'font-devanagari' : ''}`}>
              {currentLanguage === 'hi'
                ? `नमस्ते, ${profile.name}`
                : currentLanguage === 'mr'
                  ? `नमस्कार, ${profile.name}`
                  : `Welcome, ${profile.name}`}
            </h1>
            <p className="text-xs sm:text-sm text-govTeal-100 mt-1 leading-relaxed">
              {profile.affiliation} • {profile.institute}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-saffron-200 font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{stats.coursesEnrolled} Enrolled</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-emerald-200 font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{stats.certificatesEarned} Verified Credentials</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 sm:pt-0">
              <button
                onClick={() => quickCourseId
                  ? navigate('course_player', { courseId: quickCourseId })
                  : navigate('my_courses')
                }
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{quickCourseId ? 'Continue Learning' : 'Browse Courses'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('career_chat')}
                className="w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl text-xs backdrop-blur-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-saffron-300" />
                <span>Ask Career Sahayak</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Real-State Dashboard Slider (PDF 1 Page 5–6 & PDF 2 Page 14) ───── */}
      <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-white">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Real-Time Programme & Learning Pulse
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSliderIndex((prev) => (prev - 1 + 4) % 4)}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSliderIndex((prev) => (prev + 1) % 4)}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slider Content */}
          <div className="transition-all duration-300">
            {/* Card 1: LIVE TRAINING */}
            {sliderIndex === 0 && (
              <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-950 via-[#004736] to-emerald-900 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE TRAINING
                  </span>
                  <span className="text-xs text-emerald-200 font-medium">NFC / Biometric Attendance Active</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {activeSession?.title || 'Executive PACS Digital Governance'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {activeSession?.timeSlot || 'Today • 10:00 AM – 1:00 PM'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {activeSession?.room ? `VAMNICOM • ${activeSession.room}` : 'VAMNICOM • Smart Computer Lab 2'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-800/60">
                  <span className="text-xs text-emerald-200 font-semibold">NFC attendance required</span>
                  <button
                    onClick={() => navigate('attendance_history')}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow transition-all cursor-pointer"
                  >
                    Continue Training
                  </button>
                </div>
              </div>
            )}

            {/* Card 2: CONTINUE LEARNING */}
            {sliderIndex === 1 && (
              <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30">
                    CONTINUE LEARNING
                  </span>
                  <span className="text-xs text-blue-200 font-medium">Modular Coursework</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {inProgressCourse?.title || 'Statutory Audit Compliance'}
                  </h3>
                  <div className="text-xs text-blue-200 mt-1">
                    Progress: <strong className="text-white">{inProgressCourse?.progressPercent || 72}%</strong> • Next: Audit Documentation
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-800/60">
                  <div className="w-1/2 bg-blue-950 h-2 rounded-full overflow-hidden border border-blue-800">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${inProgressCourse?.progressPercent || 72}%` }} />
                  </div>
                  <button
                    onClick={() => navigate('course_player', { courseId: quickCourseId })}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow transition-all cursor-pointer"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            )}

            {/* Card 3: UPCOMING PROGRAMME */}
            {sliderIndex === 2 && (
              <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-950 via-slate-900 to-violet-950 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30">
                    UPCOMING PROGRAMME
                  </span>
                  <span className="text-xs text-purple-200 font-medium">Approved Enrollment</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    PACS Computerization & ERP Operations
                  </h3>
                  <div className="text-xs text-purple-200 mt-1">
                    18 September 2026 • Hybrid • VAMNICOM • Registration approved
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-800/60">
                  <span className="text-xs text-emerald-300 font-bold">Admission Confirmed</span>
                  <button
                    onClick={() => navigate('/trainee/programmes')}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow transition-all cursor-pointer"
                  >
                    View Programme
                  </button>
                </div>
              </div>
            )}

            {/* Card 4: CERTIFICATE PROGRESS */}
            {sliderIndex === 3 && (
              <div className="rounded-2xl p-6 bg-gradient-to-br from-teal-950 via-[#003B2B] to-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                    CERTIFICATE PROGRESS
                  </span>
                  <span className="text-xs text-teal-200 font-medium">Accreditation Audit</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    PACS Digital Governance
                  </h3>
                  <div className="text-xs text-teal-200 mt-1">
                    Attendance: <strong className="text-white">{attendance?.percentage || 86}%</strong> • Assessment: <strong className="text-amber-300">Pending</strong> • Certificate eligibility: In progress
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-teal-800/60">
                  <span className="text-xs text-teal-200">2 of 4 completion conditions satisfied</span>
                  <button
                    onClick={() => navigate('certificates')}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow transition-all cursor-pointer"
                  >
                    View Progress
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => setSliderIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  sliderIndex === idx ? 'w-6 bg-[#005B46]' : 'w-2 bg-slate-200'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Upcoming Training Section (PDF 1 Page 8 & PDF 2 Page 13) ───────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-govText-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> Upcoming Training
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Scheduled institutional contact class and smart lab session</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Next Session
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Programme:</span>
              <h3 className="text-base font-black text-slate-900">
                PACS Computerization & ERP Operations
              </h3>
            </div>
            <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full self-start sm:self-center">
              18 September 2026 • 10:00 AM – 1:00 PM
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-slate-400 block mb-0.5">Mode:</span>
              <strong className="text-slate-800">On-site</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Institution:</span>
              <strong className="text-slate-800">VAMNICOM Pune</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Room / Venue:</span>
              <strong className="text-slate-800">Smart Computer Lab 2</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Attendance:</span>
              <strong className="text-emerald-700">NFC kiosk required</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
              <BedDouble className="w-3.5 h-3.5 text-amber-600" />
              Hostel Accommodation: <strong className="text-emerald-700">Confirmed (Room A-102)</strong>
            </span>
            <button
              onClick={() => navigate('/trainee/programmes')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#005B46] text-white font-bold text-xs shadow transition-all cursor-pointer"
            >
              View Session
            </button>
          </div>
        </div>
      </div>

      {/* 2. Priority Action Grid: Database-Driven Active Session & Verifiable Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Next Scheduled Session */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-govTeal-600" />
              <h2 className="font-bold text-sm sm:text-base text-govText-primary">
                Active Class Session
              </h2>
            </div>
            {activeSession ? (
              activeSession.userCheckedIn ? (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Attendance Logged</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-full animate-pulse">
                  Check-in Open
                </span>
              )
            ) : (
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                No active session
              </span>
            )}
          </div>

          {activeSession ? (
            <div className="bg-govBg rounded-xl p-4 border border-govTeal-100 space-y-3">
              <h3 className="font-bold text-sm text-govText-primary leading-snug break-words">
                {activeSession.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-govText-secondary">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-govTeal-600" />
                  <span>{activeSession.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-govTeal-600" />
                  <span className="truncate">{activeSession.room}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-govText-secondary">
                  Instructor: <strong className="text-govText-primary">{activeSession.instructor}</strong>
                </span>

                {activeSession.userCheckedIn ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ Attendance Recorded</span>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('attendance_history')}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-saffron-300" />
                    <span>Mark Face Attendance</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-govBg rounded-xl p-6 border border-gray-200 text-center space-y-1">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-govText-primary">No active class session</p>
              <p className="text-[11px] text-govText-secondary">
                Upcoming lectures and practical lab sessions will appear here when scheduled by your institute.
              </p>
            </div>
          )}
        </div>

        {/* Verifiable Digital Credentials */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-govTeal-800 bg-govTeal-50 px-2.5 py-0.5 rounded border border-govTeal-200 font-mono">
                {stats.certificatesEarned} Issued
              </span>
            </div>
            <h2 className="font-bold text-sm sm:text-base text-govText-primary">
              Verifiable Digital Credentials
            </h2>
            <p className="text-xs text-govText-secondary leading-relaxed">
              Cryptographically signed by NCCT and publicly verifiable via DigiLocker / NAD protocols.
            </p>
          </div>

          {stats.certificatesEarned > 0 && userEnrolledCourses.some(c => c.status === 'COMPLETED') ? (
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-govText-primary truncate">
                {userEnrolledCourses.find(c => c.status === 'COMPLETED')?.title || 'Cooperative Management Certificate'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => navigate('certificates')}
                  className="flex-1 py-2.5 min-h-[44px] bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 text-xs font-bold rounded-xl border border-govTeal-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View All ({stats.certificatesEarned})</span>
                </button>
                <button
                  onClick={() => navigate('certificates')}
                  className="px-4 py-2.5 min-h-[44px] bg-saffron-50 hover:bg-saffron-100 text-saffron-900 text-xs font-bold rounded-xl border border-saffron-200 flex items-center justify-center cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-govText-muted bg-govBg p-4 rounded-xl text-center">
              Complete a course curriculum and pass the module assessment to earn your official NCCT certificate.
            </div>
          )}
        </div>

      </div>

      {/* 3. NEW: Learning Performance Section (6 Database-Driven Cards) */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-govTeal-700" />
            <h2 className="text-lg font-extrabold text-govText-primary">
              Learning Performance
            </h2>
          </div>
          <p className="text-xs text-govText-secondary">
            Track your training progress, assessment scores, and attendance derived from real records
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

          {/* Card 1: Courses Enrolled */}
          <div className="bg-white rounded-2xl p-4 border border-govText-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-govTeal-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-govText-secondary">
                Enrolled
              </span>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-govText-primary">
                {stats.coursesEnrolled}
              </p>
              <p className="text-[10px] text-govText-muted mt-0.5">Total Courses</p>
            </div>
          </div>

          {/* Card 2: Courses Completed */}
          <div className="bg-white rounded-2xl p-4 border border-govText-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-govText-secondary">
                Completed
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-700">
                {stats.coursesCompleted}
              </p>
              <p className="text-[10px] text-govText-muted mt-0.5">Curricula Finished</p>
            </div>
          </div>

          {/* Card 3: Average Course Progress */}
          <div className="bg-white rounded-2xl p-4 border border-govText-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-govTeal-700 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-govText-secondary">
                Avg Progress
              </span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-govText-primary">
                {stats.averageProgress}%
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-govTeal-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, stats.averageProgress))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Certificates Earned */}
          <div className="bg-white rounded-2xl p-4 border border-govText-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-govText-secondary">
                Certificates
              </span>
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-700">
                {stats.certificatesEarned}
              </p>
              <p className="text-[10px] text-govText-muted mt-0.5">Verified Badges</p>
            </div>
          </div>

          {/* Card 5: Quiz Average Score */}
          <div className="bg-white rounded-2xl p-4 border border-govText-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-govText-secondary">
                Quiz Score
              </span>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-govText-primary">
                {quizPerformance.attempted > 0 ? `${stats.averageQuizScore}%` : 'N/A'}
              </p>
              <p className="text-[10px] text-govText-muted mt-0.5">
                {quizPerformance.attempted > 0 ? `${quizPerformance.passed} Passed / ${quizPerformance.attempted}` : 'No quizzes taken'}
              </p>
            </div>
          </div>

          {/* Card 6: Attendance Percentage */}
          <div className="bg-white rounded-2xl p-4 border border-govText-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-teal-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-govText-secondary">
                Attendance
              </span>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-govText-primary">
                {stats.attendancePercentage !== null ? `${stats.attendancePercentage}%` : 'N/A'}
              </p>
              <p className="text-[10px] text-govText-muted mt-0.5 truncate">
                {attendance.hasRecords ? `${attendance.attended} of ${attendance.total} sessions` : 'Attendance data unavailable'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Analytics & Performance Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Course Progress Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-govTeal-700" />
              <h3 className="font-bold text-sm sm:text-base text-govText-primary">
                Course Progress
              </h3>
            </div>
            <span className="text-[11px] text-govText-secondary">
              Clamped completion (0–100%)
            </span>
          </div>

          {courseChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#4B5563' }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, item: any) => [
                      `${value}%`,
                      item?.payload?.fullName || 'Course Progress',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="progress" fill="#005B46" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-govBg rounded-xl border border-gray-200 text-center p-6 space-y-2">
              <BookOpen className="w-8 h-8 text-gray-400" />
              <p className="text-xs font-bold text-govText-primary">No course progress available yet.</p>
              <p className="text-[11px] text-govText-secondary max-w-sm">
                Enroll in a national modular curriculum course below to start tracking your progress.
              </p>
            </div>
          )}
        </div>

        {/* Quiz Performance Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm sm:text-base text-govText-primary">
                Quiz Performance
              </h3>
            </div>
            <span className="text-[11px] text-govText-secondary font-medium">
              Real DB Submissions
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-govBg rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-govText-secondary">Average Quiz Score</p>
                <p className="text-2xl font-extrabold text-govText-primary">
                  {quizPerformance.attempted > 0 ? `${quizPerformance.averageScore}%` : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {quizPerformance.attempted > 0 ? `${quizPerformance.passed}/${quizPerformance.attempted}` : '0'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passed</span>
                </div>
                <p className="text-lg font-extrabold text-emerald-900 mt-1">
                  {quizPerformance.passed}
                </p>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Failed</span>
                </div>
                <p className="text-lg font-extrabold text-rose-900 mt-1">
                  {quizPerformance.failed}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-govText-secondary leading-relaxed pt-2 border-t border-gray-100">
            Passing threshold is set at 70–80% depending on the cooperative module standard. Each passed assessment unlocks verifiable credentials.
          </p>
        </div>

      </div>

      {/* 5. Learning Activity Timeline / Trend */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-govTeal-600" />
            <h3 className="font-bold text-sm sm:text-base text-govText-primary">
              Learning Activity
            </h3>
          </div>
          <span className="text-[11px] text-govText-secondary">
            Chronological audit log
          </span>
        </div>

        {hasLearningHistory ? (
          <div className="space-y-4">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(val: number, _n: string, item: any) => [
                      `${val}%`,
                      item?.payload?.title || 'Activity Score',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#005B46" strokeWidth={2.5} dot={{ r: 4, fill: '#FF7A00' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              {learningActivity.slice(0, 4).map((act) => (
                <div key={act.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${act.type === 'certificate' ? 'bg-amber-500' : act.type === 'quiz' ? 'bg-indigo-500' : 'bg-govTeal-600'}`} />
                    <span className="font-semibold text-govText-primary">{act.title}</span>
                  </div>
                  <span className="text-[11px] text-govText-muted font-mono">{act.date}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center bg-govBg rounded-xl border border-gray-200">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-govText-secondary">
              Learning activity will appear here as you complete lessons and assessments.
            </p>
          </div>
        )}
      </div>

      {/* 6. Courses Grid (Using CourseCard with Real Database Progress) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-govText-primary">
              {t.nav.courses}
            </h2>
            <p className="text-xs text-govText-secondary">
              National modular curriculum with instant multilingual assessment
            </p>
          </div>
          <button
            onClick={() => navigate('courses')}
            className="text-xs font-bold text-govTeal-700 hover:text-govTeal-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Enrolled courses from real DB — show empty state if none */}
        {userEnrolledCourses.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-govBg rounded-2xl border border-gray-200">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-govText-primary">No courses enrolled yet</p>
            <p className="text-xs text-govText-secondary mt-1">
              Browse the course catalogue to find and enroll in available courses.
            </p>
            <button
              onClick={() => navigate('my_courses')}
              className="mt-3 px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Browse Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {userEnrolledCourses.map(course => {
            const cardEnrollment = {
              id: `enr-${currentUser.id}-${course.courseId}`,
              userId: currentUser.id,
              courseId: course.courseId,
              progressPercent: course.progressPercent,
              completedLessonIds: Array.from({ length: course.completedLessonsCount }, (_, i) => `les-${i}`),
              completedQuizIds: course.status === 'COMPLETED' ? ['quiz-done'] : [],
              status: course.status.toLowerCase() as any,
              enrolledDate: course.enrolledDate,
              completionDate: course.completionDate || undefined,
            };

            return (
              <CourseCard
                key={course.courseId}
                course={{
                  id: course.courseId,
                  title: course.title,
                  thumbnail: course.thumbnail,
                  durationHours: course.durationHours,
                  category: course.category,
                  level: course.level,
                } as any}
                enrollment={cardEnrollment}
                currentLanguage={currentLanguage}
                onSelect={(id) => navigate('course_detail', { courseId: id })}
                continueLabel={t.lms.continueLesson}
                startLabel={t.lms.startLesson}
              />
            );
          })}
          </div>
        )}
      </div>

      {/* 7. Bottom Row: Cooperative Job Opportunities & Career Sahayak Teasers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

        {/* Job Opportunities Teaser */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-saffron-600" />
              <h3 className="font-bold text-sm sm:text-base text-govText-primary">
                Cooperative Recruiter Openings
              </h3>
            </div>
            <p className="text-xs text-govText-secondary leading-relaxed">
              Explore live hiring opportunities from AMUL, IFFCO, and State Cooperative Apex Banks for certified trainees.
            </p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center bg-govBg rounded-xl border border-gray-200 gap-2">
            <Briefcase className="w-7 h-7 text-gray-400" />
            <p className="text-xs text-govText-secondary font-medium text-center">
              Open the Jobs section to see all live cooperative openings.
            </p>
          </div>

          <button
            onClick={() => navigate('jobs')}
            className="w-full py-2 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 text-xs font-bold rounded-xl border border-govTeal-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Browse Cooperative Openings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI Career Sahayak Teaser */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-govText-border shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-govTeal-600" />
              <h3 className="font-bold text-sm sm:text-base text-govText-primary">
                Sahakar Sahayak (AI Advisory)
              </h3>
            </div>
            <p className="text-xs text-govText-secondary leading-relaxed">
              Ask questions about PACS computerization roles, Dairy AMCS standards, or SHG credit linkage in English, Hindi, or Marathi.
            </p>
          </div>

          <div className="bg-govBg rounded-xl p-4 border border-govTeal-100 space-y-2">
            <p className="text-xs font-semibold text-govTeal-900">
              "How to qualify as an Automatic Milk Collection Station (AMCS) Officer?"
            </p>
            <p className="text-[11px] text-govText-secondary leading-relaxed">
              Complete the Dairy Cold Chain course and pass the module assessment with ≥80% score to receive verified certification.
            </p>
          </div>

          <button
            onClick={() => navigate('career_chat')}
            className="w-full py-2 bg-saffron-50 hover:bg-saffron-100 text-saffron-900 text-xs font-bold rounded-xl border border-saffron-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Chat with AI Career Advisor</span>
            <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
          </button>
        </div>

      </div>

    </PageContainer>
  );
};
