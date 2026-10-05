import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  PlayCircle,
  Award,
  Clock,
  Compass,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { api } from '../../lib/api';
import { Enrollment } from '../../types';
import { computeCourseStatus } from '../../utils/courseStatus';

export const MyCourses: React.FC = () => {
  const {
    courses,
    enrollments: contextEnrollments,
    currentUser,
    currentLanguage,
    navigate,
    setEnrollments: setContextEnrollments,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [dbEnrollments, setDbEnrollments] = useState<Enrollment[]>([]);
  const [dbCerts, setDbCerts] = useState<any[]>([]);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch real enrollments, certificates, and courses from PostgreSQL via backend API on mount
  const fetchMyEnrollments = async () => {
    try {
      setLoading(true);
      const [enrRes, certRes, coursesRes] = await Promise.allSettled([
        api.enrollments.mine(),
        api.certificates.mine(),
        api.courses.list(),
      ]);
      if (enrRes.status === 'fulfilled' && Array.isArray(enrRes.value)) {
        setDbEnrollments(enrRes.value);
        if (setContextEnrollments) {
          setContextEnrollments(enrRes.value);
        }
      }
      if (certRes.status === 'fulfilled' && Array.isArray(certRes.value)) {
        setDbCerts(certRes.value);
      }
      if (coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value)) {
        setDbCourses(coursesRes.value);
      }
    } catch (err) {
      console.warn('[MyCourses] Failed to fetch enrollments or certificates from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEnrollments();
  }, [currentUser.id]);

  // Use database enrollments or context enrollments filtered for currentUser
  const sourceEnrollments = dbEnrollments.length > 0
    ? dbEnrollments
    : contextEnrollments.filter(e => e.userId === currentUser.id);

  const availableCourses = dbCourses.length > 0 ? dbCourses : courses;

  const enrolledCourseData = sourceEnrollments.map(enrollment => {
    // Course resolution: prioritize joined enrollment.course, then context courses strictly by id
    const backendCourse = (enrollment as any).course;
    const course = backendCourse || availableCourses.find(
      (c: any) => c.id === enrollment.courseId
    ) || {
      id: enrollment.courseId,
      title: 'NCCT Cooperative Training Course',
      thumbnail: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=800&auto=format&fit=crop&q=80',
      durationHours: 24,
      level: 'Intermediate',
      category: 'Cooperative Training',
      description: 'Comprehensive modular curriculum accredited by NCCT.',
      modules: [],
    };

    const cert = dbCerts.find((c: any) => c.courseId === enrollment.courseId);
    const status = computeCourseStatus(course, enrollment, cert);

    return {
      enrollment,
      course,
      totalLessons: status.totalLessonsCount,
      completedCount: status.completedLessonsCount,
      lessonProgress: status.progress,
      allLessonsDone: status.totalLessonsCount > 0 && status.completedLessonsCount >= status.totalLessonsCount,
      hasPassedAssessment: status.passedAssessment,
      hasCertificate: status.hasCertificate,
      cert,
      progress: status.progress,
      isCompleted: status.isCompleted,
    };
  });

  const allCount = enrolledCourseData.length;
  const inProgressCount = enrolledCourseData.filter(i => !i.isCompleted).length;
  const completedCount = enrolledCourseData.filter(i => i.isCompleted).length;

  const filteredData = enrolledCourseData.filter(item => {
    if (activeTab === 'in_progress') return !item.isCompleted;
    if (activeTab === 'completed') return item.isCompleted;
    return true;
  });

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              Trainee Learning Desk
            </span>
            <SimulatedBadge text="Progress Synchronized" />
          </div>
          <h1 className="text-2xl font-extrabold text-govText-primary mt-1">
            {t.myCourses?.title || 'My Enrolled Courses'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1">
            {t.myCourses?.subtitle || 'Track your active learning journey, resume interactive lessons, and complete assessments'}
          </p>
        </div>

        <button
          onClick={() => navigate('courses')}
          className="px-4 py-2.5 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Compass className="w-4 h-4 text-saffron-300" />
          <span>{t.catalog?.title || 'National Training Course Catalog'}</span>
        </button>
      </div>

      {/* 2. Tabs Filter with Real Database Counts */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 min-h-[40px] text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-govTeal-700 text-white shadow-xs'
              : 'text-govText-secondary hover:bg-govBg'
          }`}
        >
          {t.myCourses?.tabs?.all || 'All Enrolled'} ({allCount})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 min-h-[40px] text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'in_progress'
              ? 'bg-govTeal-700 text-white shadow-xs'
              : 'text-govText-secondary hover:bg-govBg'
          }`}
        >
          {t.myCourses?.tabs?.inProgress || 'In Progress'} ({inProgressCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 min-h-[40px] text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-govTeal-700 text-white shadow-xs'
              : 'text-govText-secondary hover:bg-govBg'
          }`}
        >
          {t.myCourses?.tabs?.completed || 'Completed'} ({completedCount})
        </button>
      </div>

      {/* 3. Loading State */}
      {loading && enrolledCourseData.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-govText-border space-y-4 shadow-sm">
          <Loader2 className="w-8 h-8 text-govTeal-600 animate-spin mx-auto" />
          <p className="text-xs text-govText-secondary">Synchronizing your enrolled courses from database...</p>
        </div>
      ) : allCount === 0 ? (
        /* 4. Global Empty State (Only when user has zero enrollments in DB) */
        <div className="bg-white rounded-2xl p-12 text-center border border-govText-border space-y-4 shadow-sm">
          <BookOpen className="w-12 h-12 text-govTeal-600 mx-auto" />
          <h3 className="text-base font-bold text-govText-primary">
            No Enrolled Courses Found
          </h3>
          <p className="text-xs text-govText-secondary max-w-sm mx-auto">
            Explore national curriculum courses designed for Primary Agricultural Credit Societies and Dairy cooperatives.
          </p>
          <button
            onClick={() => navigate('courses')}
            className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Browse National Catalog</span>
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        /* 5. Tab-Specific Empty State (e.g. user has enrolled courses, but none completed yet) */
        <div className="bg-white rounded-2xl p-10 text-center border border-govText-border space-y-3">
          <CheckCircle2 className="w-10 h-10 text-govTeal-500 mx-auto" />
          <h3 className="text-sm font-bold text-govText-primary">
            {activeTab === 'completed' ? 'No Completed Courses Yet' : 'No Courses in this Category'}
          </h3>
          <p className="text-xs text-govText-secondary max-w-sm mx-auto">
            {activeTab === 'completed'
              ? 'Complete all modular lessons and assessments to earn your official NCCT certification.'
              : 'Continue your learning modules to make steady progress.'}
          </p>
          {activeTab === 'completed' && (
            <button
              onClick={() => setActiveTab('in_progress')}
              className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              View In Progress Courses
            </button>
          )}
        </div>
      ) : (
        /* 6. Course Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredData.map(({ course, completedCount, totalLessons, progress, isCompleted, allLessonsDone, hasPassedAssessment, hasCertificate, cert, lessonProgress }) => {
            const title = currentLanguage === 'hi' ? course.titleHi || course.title : currentLanguage === 'mr' ? course.titleMr || course.title : course.title;
            const description = currentLanguage === 'hi' ? course.descriptionHi || course.description : currentLanguage === 'mr' ? course.descriptionMr || course.description : course.description;

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-govText-border shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-all"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                        {course.level}
                      </span>
                    </div>
                    {isCompleted ? (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed ✓</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-govTeal-700 text-white text-[10px] font-bold shadow">
                        In Progress
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-govText-muted">
                      <span className="font-bold text-govTeal-700 uppercase">{course.category}</span>
                      <span>{course.durationHours} Hours</span>
                    </div>

                    <h3 className="font-bold text-sm text-govText-primary line-clamp-1">
                      {title}
                    </h3>

                    <p className="text-xs text-govText-secondary line-clamp-2 leading-relaxed">
                      {description}
                    </p>

                    {/* Progress Bar & Status */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-govText-secondary font-medium">
                          Lessons: {completedCount} of {totalLessons} completed
                        </span>
                        <span className="font-bold text-govTeal-800">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted || allLessonsDone ? 'bg-emerald-600' : 'bg-govTeal-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {isCompleted ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Course Completed
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" /> Assessment Passed
                          </span>
                          {hasCertificate && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-saffron-100 text-saffron-900">
                              <Award className="w-3 h-3 text-saffron-600" /> Certificate Earned
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-govText-muted pt-0.5">
                          <span>Assessment:</span>
                          {hasPassedAssessment ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed (≥75%)
                            </span>
                          ) : (
                            <span className="text-govText-secondary font-medium">Pending Assessment</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 border-t border-gray-100 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => navigate('course_player', { courseId: course.id })}
                    className="flex-1 py-2.5 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{isCompleted ? 'Review Content' : (t.myCourses?.resume || 'Resume Learning')}</span>
                  </button>

                  {hasCertificate && (
                    <button
                      onClick={() => navigate('certificates', { certId: cert?.id })}
                      className="px-3 py-2.5 bg-saffron-50 hover:bg-saffron-100 text-saffron-900 border border-saffron-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      title="View Official Certificate"
                    >
                      <Award className="w-4 h-4 text-saffron-600" />
                      <span className="text-xs font-bold">Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
