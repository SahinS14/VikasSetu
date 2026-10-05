import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  PlayCircle,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';

export const CourseDetail: React.FC = () => {
  const {
    courses,
    enrollments,
    certificates,
    currentUser,
    activeViewParams,
    navigate,
    enrollInCourse,
    currentLanguage,
    t
  } = useApp();

  const courseId = activeViewParams?.courseId || courses[0]?.id;
  const course = courses.find(c => c.id === courseId) || courses[0];
  const enrollment = enrollments.find(e => e.userId === currentUser.id && (e.courseId === course.id || (course.id.includes('shg') && (e.courseId === 'crs-shg-101' || e.courseId === 'crs-shg-gov-301'))));
  const userCert = certificates.find(c => c.userId === currentUser.id && (c.courseId === course.id || (course.id.includes('shg') && (c.courseId === 'crs-shg-101' || c.courseId === 'crs-shg-gov-301'))));

  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });

  const toggleModule = (index: number) => {
    setExpandedModules(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const isEnrolled = !!enrollment;
  const completedLessonsCount = enrollment?.completedLessonIds?.length || 0;
  const totalLessonsCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const isCompleted = enrollment?.status === 'completed' || enrollment?.progressPercent === 100 || !!userCert;
  const progressPercent = isCompleted ? 100 : (totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0);

  const handleStartOrResume = () => {
    if (!isEnrolled) {
      enrollInCourse(course.id);
    }
    navigate('course_player', { courseId: course.id });
  };

  const title = currentLanguage === 'hi' ? course.titleHi : currentLanguage === 'mr' ? course.titleMr : course.title;
  const description = currentLanguage === 'hi' ? course.descriptionHi : currentLanguage === 'mr' ? course.descriptionMr : course.description;

  return (
    <PageContainer>
      {/* 1. Navigation Back Button */}
      <div>
        <button
          onClick={() => navigate('courses')}
          className="inline-flex items-center gap-2 text-xs font-bold text-govTeal-700 hover:text-govTeal-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.courseDetail?.backToCatalog || 'Back to National Catalog'}</span>
        </button>
      </div>

      {/* 2. Hero Course Overview Header */}
      <div className="bg-white rounded-3xl border border-govText-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-8">
          
          {/* Main Info (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-govTeal-50 text-govTeal-800 text-[11px] font-bold uppercase tracking-wider border border-govTeal-200">
                {course.level}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-saffron-50 text-saffron-900 text-[11px] font-bold capitalize border border-saffron-200">
                {course.category}
              </span>
              <SimulatedBadge text="NCCT Verified Courseware" />
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-govText-primary tracking-tight">
              {title}
            </h1>

            <p className="text-xs sm:text-sm text-govText-secondary leading-relaxed">
              {description}
            </p>

            {/* Quick Specs */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs font-semibold text-govText-secondary border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-govTeal-600" />
                <span>{course.durationHours} Hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-govTeal-600" />
                <span>{course.modules.length} {t.courseDetail?.lessonsCount || 'Modules'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-govTeal-600" />
                <span>{totalLessonsCount} Lessons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-govTeal-600" />
                <span>EN • HI • MR Available</span>
              </div>
            </div>
          </div>

          {/* Action & Enrollment Card (4 cols) */}
          <div className="lg:col-span-4 bg-govBg rounded-2xl p-4 sm:p-6 border border-govTeal-100 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="aspect-video rounded-xl overflow-hidden shadow-xs border border-gray-200">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {isEnrolled && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-bold text-govText-primary">
                    <span>{t.myCourses?.progressLabel || 'Your Progress'}</span>
                    <span className="text-govTeal-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-govTeal-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-govText-muted">
                    {completedLessonsCount} of {totalLessonsCount} lessons completed
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {isCompleted ? (
                <div className="space-y-2">
                  <button
                    onClick={handleStartOrResume}
                    className="w-full py-3 sm:py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Course Completed ✓ (Review Lessons)</span>
                  </button>

                  <button
                    onClick={() => navigate('certificates', { certId: userCert?.id })}
                    className="w-full py-3.5 sm:py-3 bg-gradient-to-r from-govTeal-700 to-govTeal-900 hover:from-govTeal-800 hover:to-govTeal-950 text-white font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <Award className="w-4 h-4 text-saffron-300" />
                    <span>View Official NCCT Certificate</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartOrResume}
                  className="w-full py-3.5 sm:py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>
                    {isEnrolled
                      ? (progressPercent > 0 ? (t.courseDetail?.continueLearning || 'Continue Learning') : 'Start Learning')
                      : (t.courseDetail?.enrollBtn || 'Enroll in Course')}
                  </span>
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-govText-muted font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Free for PACS & Cooperative Society Members</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Syllabus & Modules Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Modules List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-govText-primary">
                {t.courseDetail?.syllabus || 'Course Syllabus & Curriculum'}
              </h2>
              <p className="text-xs text-govText-secondary">
                Modular lessons with practical examples and knowledge checks
              </p>
            </div>
            <button
              onClick={() => {
                const allExpanded = course.modules.every((_, i) => expandedModules[i]);
                const nextState: Record<number, boolean> = {};
                course.modules.forEach((_, i) => {
                  nextState[i] = !allExpanded;
                });
                setExpandedModules(nextState);
              }}
              className="text-xs font-bold text-govTeal-700 hover:text-govTeal-900 cursor-pointer"
            >
              Toggle All
            </button>
          </div>

          <div className="space-y-3">
            {course.modules.map((module, modIdx) => {
              const isExpanded = !!expandedModules[modIdx];
              const moduleTitle = currentLanguage === 'hi' ? module.titleHi : currentLanguage === 'mr' ? module.titleMr : module.title;

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-2xl border border-govText-border shadow-xs overflow-hidden transition-all"
                >
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(modIdx)}
                    className="w-full p-4.5 flex items-center justify-between text-left hover:bg-govBg/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-govTeal-100 text-govTeal-800 text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                        {modIdx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-govText-primary">
                          {moduleTitle}
                        </h3>
                        <p className="text-[11px] text-govText-muted mt-0.5">
                          {module.lessons.length} Lessons • {module.quiz ? '1 Knowledge Check Quiz' : 'No Quiz'}
                        </p>
                      </div>
                    </div>

                    <div className="text-govText-muted">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Lessons List */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/40 space-y-2">
                      {module.lessons.map((lesson, lesIdx) => {
                        const isCompleted = enrollment?.completedLessonIds?.includes(lesson.id);
                        const lessonTitle = currentLanguage === 'hi' ? lesson.titleHi : currentLanguage === 'mr' ? lesson.titleMr : lesson.title;

                        return (
                          <div
                            key={lesson.id}
                            className="p-3 bg-white rounded-xl border border-gray-200/80 flex items-center justify-between text-xs hover:border-govTeal-300 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <PlayCircle className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-govText-primary">
                                {modIdx + 1}.{lesIdx + 1} {lessonTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-govText-muted">
                              <span>{lesson.durationMinutes} mins</span>
                            </div>
                          </div>
                        );
                      })}

                      {module.quiz && (
                        <div className="p-3 bg-saffron-50/60 rounded-xl border border-saffron-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-saffron-600 flex-shrink-0" />
                            <span className="font-bold text-saffron-900">
                              {t.quiz?.assessmentTitle || 'Module Assessment Quiz'}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-saffron-800">
                            {module.quiz.passThreshold}% to pass
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Accreditation & Perks (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-govText-primary">
              Certification Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Award className="w-4 h-4 text-govTeal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-govText-primary">Verifiable QR Credential</p>
                  <p className="text-govText-muted text-[11px] mt-0.5">
                    Digitally signed certificate with instant verification link on VikasSetu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-govTeal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-govText-primary">Direct Recruiter Visibility</p>
                  <p className="text-govText-muted text-[11px] mt-0.5">
                    Completion automatically boosts your profile visibility to cooperative recruiters like AMUL & IFFCO.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-govTeal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-govText-primary">NCCT Accredited</p>
                  <p className="text-govText-muted text-[11px] mt-0.5">
                    Recognized under Ministry of Cooperation capacity building framework.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
