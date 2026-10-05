import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Circle,
  BookOpen,
  Globe,
  Sparkles,
  FileText,
  Menu,
  X,
  Lock,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language, Lesson, CourseModule } from '../../types';
import { YouTubeLessonPlayer } from '../../components/common/YouTubeLessonPlayer';
import api from '../../lib/api';

export const CoursePlayer: React.FC = () => {
  const {
    courses,
    enrollments,
    currentUser,
    activeViewParams,
    navigate,
    markLessonComplete,
    currentLanguage,
    t
  } = useApp();

  const courseId = activeViewParams?.courseId || courses[0]?.id;
  const course = courses.find(c => c.id === courseId) || courses[0];

  const COURSE_ALIASES: Record<string, string[]> = useMemo(() => ({
    'crs-shg-101': ['crs-shg-101', 'crs-shg-gov-301'],
    'crs-shg-gov-301': ['crs-shg-gov-301', 'crs-shg-101'],
    'crs-dairy-101': ['crs-dairy-101', 'crs-dairy-mgmt-201'],
    'crs-dairy-mgmt-201': ['crs-dairy-mgmt-201', 'crs-dairy-101'],
    'crs-pacs-101': ['crs-pacs-101', 'crs-pacs-erp-101'],
    'crs-pacs-erp-101': ['crs-pacs-erp-101', 'crs-pacs-101'],
  }), []);

  const allowedCourseIds = useMemo(() => {
    return course?.id ? (COURSE_ALIASES[course.id] || [course.id]) : [];
  }, [course?.id, COURSE_ALIASES]);

  const enrollment = useMemo(() => {
    return enrollments.find(e => e.userId === currentUser?.id && allowedCourseIds.includes(e.courseId)) || null;
  }, [enrollments, currentUser?.id, allowedCourseIds]);

  const [activeModIdx, setActiveModIdx] = useState(0);
  const [activeLesIdx, setActiveLesIdx] = useState(0);
  const [contentLang, setContentLang] = useState<Language>(currentLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [liveLearningData, setLiveLearningData] = useState<any>(null);
  const [locallyCompletedLessons, setLocallyCompletedLessons] = useState<string[]>([]);
  const [quizLockNotice, setQuizLockNotice] = useState<string | null>(null);

  useEffect(() => {
    setContentLang(currentLanguage);
  }, [currentLanguage]);

  // ─── Fetch live course learning data from backend ──────────────────────
  const fetchLearningData = useCallback(() => {
    if (currentUser?.id && course?.id) {
      api.learning.getCourse(course.id)
        .then(res => {
          if (res && res.modules) {
            setLiveLearningData(res);
          }
        })
        .catch(err => {
          console.warn('[CoursePlayer] Could not fetch live learning data:', err.message);
        });
    }
  }, [course?.id, currentUser?.id]);

  useEffect(() => {
    fetchLearningData();
  }, [fetchLearningData]);

  // Combine modules: prefer live learning modules with videoUrls & database fields
  const modulesList: (CourseModule & { quizzes?: any[] })[] = useMemo(() => {
    const rawModules =
      liveLearningData?.modules && Array.isArray(liveLearningData.modules) && liveLearningData.modules.length > 0
        ? liveLearningData.modules
        : course?.modules || [];

    return rawModules.map((m: any, idx: number) => {
      const courseMod = course?.modules?.[idx] || course?.modules?.find((cm) => cm.id === m.id);
      const moduleQuizzes =
        Array.isArray(m.quizzes) && m.quizzes.length > 0
          ? m.quizzes
          : m.quiz
          ? [m.quiz]
          : courseMod?.quiz
          ? [courseMod.quiz]
          : [];
      const primaryQuiz = moduleQuizzes.length > 0 ? moduleQuizzes[0] : m.quiz || courseMod?.quiz || null;

      return {
        ...m,
        quiz: primaryQuiz,
        quizzes: moduleQuizzes,
      };
    });
  }, [liveLearningData, course?.modules]);

  const currentModule: (CourseModule & { quizzes?: any[] }) | undefined =
    modulesList[activeModIdx] || modulesList[0];
  const currentModuleQuiz = currentModule?.quiz || (currentModule?.quizzes && currentModule.quizzes[0]) || null;
  const currentLesson:
    | (Lesson & {
        videoUrl?: string;
        completed?: boolean;
        progressPercent?: number;
        progressSeconds?: number;
      })
    | undefined = currentModule?.lessons[activeLesIdx] || currentModule?.lessons[0];

  // Completed lessons set: union of enrollment completed IDs across course and aliases, live database flags, and local completions
  const completedLessons = useMemo(() => {
    const set = new Set<string>();
    enrollments
      .filter((e) => e.userId === currentUser?.id && allowedCourseIds.includes(e.courseId))
      .forEach((e) => {
        if (Array.isArray(e.completedLessonIds)) {
          e.completedLessonIds.forEach((id) => set.add(id));
        }
      });
    if (liveLearningData?.modules) {
      liveLearningData.modules.forEach((m: any) => {
        m.lessons?.forEach((l: any) => {
          if (l.isCompleted || l.completed) set.add(l.id);
        });
      });
    }
    locallyCompletedLessons.forEach((id) => set.add(id));
    return Array.from(set);
  }, [enrollments, allowedCourseIds, currentUser?.id, liveLearningData, locallyCompletedLessons]);

  const totalLessons = useMemo(() => {
    return modulesList.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  }, [modulesList]);

  const completedCount = completedLessons.length;
  const overallProgressPercent =
    totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

  const isCurrentCompleted = currentLesson ? completedLessons.includes(currentLesson.id) : false;

  const isFirstLesson = activeModIdx === 0 && activeLesIdx === 0;
  const isLastLessonInModule = currentModule ? activeLesIdx === currentModule.lessons.length - 1 : false;
  const isLastLessonInCourse = activeModIdx === modulesList.length - 1 && isLastLessonInModule;

  // Module quiz lock calculation: ALL lessons in this module must be completed
  const currentModuleLessonIds = currentModule ? currentModule.lessons.map((l) => l.id) : [];
  const currentModuleCompletedCount = currentModuleLessonIds.filter((id) => completedLessons.includes(id)).length;
  const isCurrentModuleQuizUnlocked =
    currentModuleLessonIds.length > 0 &&
    currentModuleLessonIds.every((id) => completedLessons.includes(id));

  // Handle lesson selection
  const handleSelectLesson = (modIdx: number, lesIdx: number) => {
    setActiveModIdx(modIdx);
    setActiveLesIdx(lesIdx);
    setQuizLockNotice(null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handlePreviousLesson = () => {
    setQuizLockNotice(null);
    if (activeLesIdx > 0) {
      setActiveLesIdx((prev) => prev - 1);
    } else if (activeModIdx > 0) {
      const prevMod = modulesList[activeModIdx - 1];
      setActiveModIdx((prev) => prev - 1);
      setActiveLesIdx(prevMod.lessons.length - 1);
    }
  };

  // Continue to Next: advances playback WITHOUT auto-completing next lesson!
  const handleNextLesson = () => {
    setQuizLockNotice(null);
    if (!isLastLessonInModule) {
      setActiveLesIdx((prev) => prev + 1);
    } else if (currentModuleQuiz) {
      if (isCurrentModuleQuizUnlocked) {
        navigate('quiz', { courseId: course.id, moduleId: currentModule.id, quizId: currentModuleQuiz.id });
      } else {
        setQuizLockNotice('Please finish all lessons in this module before taking the assessment quiz.');
      }
    } else if (activeModIdx < modulesList.length - 1) {
      setActiveModIdx((prev) => prev + 1);
      setActiveLesIdx(0);
    }
  };

  // Callback when YouTube player reaches >= 90% threshold
  const handleLessonCompleted = (completedLessonId: string) => {
    setLocallyCompletedLessons(prev => (prev.includes(completedLessonId) ? prev : [...prev, completedLessonId]));
    markLessonComplete(course.id, completedLessonId);
    // Background sync
    fetchLearningData();
  };

  const lessonTitle = contentLang === 'hi' ? currentLesson?.titleHi : contentLang === 'mr' ? currentLesson?.titleMr : currentLesson?.title || '';
  const lessonContent = currentLesson?.contentByLanguage?.[contentLang]?.text || currentLesson?.contentByLanguage?.en?.text || (currentLesson as any)?.contentEn?.text || '';
  const courseTitle = contentLang === 'hi' ? course?.titleHi : contentLang === 'mr' ? course?.titleMr : course?.title || '';
  const moduleTitle = contentLang === 'hi' ? currentModule?.titleHi : contentLang === 'mr' ? currentModule?.titleMr : currentModule?.title || '';

  // Fallback video URL mapping for lessons
  const defaultLessonVideos: Record<string, string> = {
    'les-dairy-1-1': 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    'les-dairy-1-2': 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'les-pacs-1-1': 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    'les-pacs-1-2': 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'les-pacs-2-1': 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    'les-pacs-2-2': 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'les-shg-1-1': 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    'les-shg-1-2': 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  };

  const lessonDbVideoUrl = currentLesson?.videoUrl || currentLesson?.contentByLanguage?.[contentLang]?.videoUrl || currentLesson?.contentByLanguage?.en?.videoUrl;
  const resolvedVideoUrl =
    (lessonDbVideoUrl && !lessonDbVideoUrl.includes('ysz5S6PUM-U'))
      ? lessonDbVideoUrl
      : (currentLesson?.id ? defaultLessonVideos[currentLesson.id] : null) || 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      
      {/* 1. LMS Top Navbar */}
      <div className="bg-govTeal-950 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-govTeal-900 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('course_detail', { courseId: course.id })}
            className="p-1.5 rounded-lg text-govTeal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to course overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
              {courseTitle}
            </p>
            <p className="text-[10px] text-saffron-300 truncate">
              Module {activeModIdx + 1}: {moduleTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Content Language Switcher */}
          <div className="flex items-center bg-govTeal-900/80 rounded-lg p-0.5 border border-govTeal-800 text-[11px]">
            <button
              onClick={() => setContentLang('en')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                contentLang === 'en' ? 'bg-govTeal-600 text-white shadow-xs' : 'text-govTeal-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setContentLang('hi')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                contentLang === 'hi' ? 'bg-govTeal-600 text-white shadow-xs' : 'text-govTeal-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setContentLang('mr')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                contentLang === 'mr' ? 'bg-govTeal-600 text-white shadow-xs' : 'text-govTeal-300 hover:text-white'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Overall Course Progress */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-govTeal-300 font-semibold">{overallProgressPercent}%</span>
            <div className="w-20 bg-govTeal-900 h-2 rounded-full overflow-hidden border border-govTeal-800">
              <div
                className="bg-saffron-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-govTeal-200 hover:text-white hover:bg-white/10 transition-colors lg:hidden cursor-pointer"
            title="Toggle Curriculum Sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Mobile Backdrop Overlay for Curriculum Drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs animate-fadeIn"
          />
        )}

        {/* Left Lesson Navigation Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:static inset-y-0 left-0 z-40 w-80 max-w-[85vw] bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-7.5rem)] shadow-xl lg:shadow-none`}
        >
          {/* Sidebar Header with Progress Counter */}
          <div className="p-4 border-b border-gray-100 bg-govBg/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-govTeal-700" />
              <span className="text-xs font-bold text-govText-primary uppercase tracking-wider">
                {t.courseDetail?.syllabus || 'Curriculum & Syllabus'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              {completedCount}/{totalLessons} Done
            </span>
          </div>

          {/* Modules and Lessons List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {modulesList.map((module, mIdx) => {
              const mTitle = contentLang === 'hi' ? module.titleHi : contentLang === 'mr' ? module.titleMr : module.title;
              const isModActive = activeModIdx === mIdx;

              // Check if all lessons in this module are completed
              const modLessonIds = module.lessons.map(l => l.id);
              const isModUnlocked = modLessonIds.length > 0 && modLessonIds.every(id => completedLessons.includes(id));

              return (
                <div key={module.id} className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold text-govTeal-900 flex items-center justify-between">
                    <span className="truncate">Module {mIdx + 1}: {mTitle}</span>
                  </div>

                  <div className="space-y-0.5">
                    {module.lessons.map((lesson, lIdx) => {
                      const isLesActive = isModActive && activeLesIdx === lIdx;
                      const isDone = completedLessons.includes(lesson.id);
                      const lTitle = contentLang === 'hi' ? lesson.titleHi : contentLang === 'mr' ? lesson.titleMr : lesson.title;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleSelectLesson(mIdx, lIdx)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                            isLesActive
                              ? 'bg-govTeal-700 text-white font-bold shadow-xs'
                              : isDone
                              ? 'text-emerald-900 bg-emerald-50/60 hover:bg-emerald-100/60 font-medium'
                              : 'text-govText-primary hover:bg-gray-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {/* Required sidebar icon states:
                                ✓ 1.1 The Amul Model (when completed)
                                ▶ 1.1 The Amul Model (when active)
                                ○ 1.2 Milk Quality Testing (when pending)
                            */}
                            {isDone ? (
                              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${isLesActive ? 'text-white' : 'text-emerald-600'}`} />
                            ) : isLesActive ? (
                              <PlayCircle className="w-3.5 h-3.5 flex-shrink-0 text-saffron-300" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" />
                            )}
                            <span className="truncate">{mIdx + 1}.{lIdx + 1} {lTitle}</span>
                          </div>
                          <span className={`text-[10px] flex-shrink-0 ${isLesActive ? 'text-govTeal-100' : 'text-gray-400'}`}>
                            {lesson.durationMinutes}m
                          </span>
                        </button>
                      );
                    })}

                    {/* Module Assessment Quiz Button with Lock Status */}
                    {module.quiz && (
                      <button
                        id={`btn-sidebar-quiz-${mIdx}`}
                        onClick={() => {
                          if (isModUnlocked) {
                            navigate('quiz', { courseId: course.id, moduleId: module.id, quizId: module.quiz.id });
                          } else {
                            setQuizLockNotice(
                              `Module ${mIdx + 1} Quiz is locked. Complete all ${modLessonIds.length} required lessons in this module to unlock.`
                            );
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all mt-1 border ${
                          isModUnlocked
                            ? 'bg-saffron-50 border-saffron-300 text-saffron-900 font-bold hover:bg-saffron-100 cursor-pointer shadow-xs'
                            : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-80'
                        }`}
                        title={isModUnlocked ? 'Take module assessment' : 'Complete all lessons in this module to unlock quiz'}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isModUnlocked ? (
                            <Sparkles className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="truncate">Module {mIdx + 1} Quiz</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isModUnlocked
                              ? 'bg-saffron-200 text-saffron-900'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isModUnlocked ? `${module.quiz.passThreshold || 75}% Pass` : '🔒 Locked'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Main Lesson Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* Mobile In-flow Module Selector */}
            <div className="lg:hidden flex items-center justify-between p-3 bg-govBg rounded-xl border border-gray-200 gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-govTeal-800 uppercase tracking-wider block">
                  Module {activeModIdx + 1} of {modulesList.length}
                </span>
                <p className="text-xs font-bold text-govText-primary truncate">{moduleTitle}</p>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-3 py-1.5 bg-govTeal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-xs min-h-[36px]"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Curriculum ({completedCount}/{totalLessons})</span>
              </button>
            </div>

            {/* Lesson Title Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                  Module {activeModIdx + 1} • Lesson {activeLesIdx + 1}
                </span>
                {isCurrentCompleted && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Completed</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1">
                {lessonTitle}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-govText-secondary">
                <span>Estimated duration: {currentLesson?.durationMinutes || 15} minutes</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-govTeal-600" />
                  <span>Instruction Language: {contentLang.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* Quiz Locked Banner Notice (if student clicked locked quiz) */}
            {quizLockNotice && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{quizLockNotice}</span>
                </div>
                <button
                  onClick={() => setQuizLockNotice(null)}
                  className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* REAL YOUTUBE IFRAME PLAYER WITH TRACKING & COMPLETION */}
            {currentLesson && (
              <YouTubeLessonPlayer
                key={currentLesson.id}
                lessonId={currentLesson.id}
                courseId={course.id}
                userId={currentUser.id}
                videoUrl={resolvedVideoUrl}
                lessonTitle={lessonTitle}
                durationMinutes={currentLesson.durationMinutes || 15}
                initialProgressSeconds={currentLesson.progressSeconds || 0}
                initialProgressPercent={currentLesson.progressPercent || (isCurrentCompleted ? 100 : 0)}
                initialIsCompleted={isCurrentCompleted}
                completionThresholdPercent={90}
                onLessonCompleted={handleLessonCompleted}
              />
            )}

            {/* Lesson Body Content */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-govText-border shadow-sm space-y-4">
              <h2 className="text-base font-bold text-govText-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-govTeal-600" />
                <span>Summary & Key Cooperative Takeaways</span>
              </h2>

              <div className="text-sm text-govText-secondary leading-relaxed space-y-3">
                <p>{lessonContent || 'This lesson covers key principles and operational best practices in cooperative dairy governance and milk procurement.'}</p>
              </div>

              {/* Practical Guidance Callout */}
              <div className="p-4 bg-govTeal-50/60 rounded-xl border border-govTeal-100 text-xs text-govTeal-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-govTeal-800">
                  <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
                  <span>PACS Ground Application Note</span>
                </p>
                <p className="leading-relaxed">
                  Always ensure daily end-of-day register reconciliation matches the Central Federated ERP upload timestamp. Keep physical member receipts filed for statutory NCCT and District Cooperative Auditor inspection.
                </p>
              </div>
            </div>

            {/* 4. DEDICATED MODULE ASSESSMENT SECTION (Requirements 14 & 15) */}
            {currentModuleQuiz && (
              <div
                id="module-assessment-section"
                className={`rounded-2xl p-6 sm:p-7 border transition-all shadow-sm ${
                  isCurrentModuleQuizUnlocked
                    ? 'bg-gradient-to-br from-saffron-50/80 via-white to-amber-50/50 border-saffron-300 ring-1 ring-saffron-300/40'
                    : 'bg-gray-50/90 border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md text-saffron-900 bg-saffron-200/80">
                        Module Assessment
                      </span>
                      {isCurrentModuleQuizUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Lessons Completed • Quiz Unlocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-md">
                          <Lock className="w-3 h-3 text-gray-500" />
                          <span>🔒 Quiz Locked ({currentModuleCompletedCount}/{currentModuleLessonIds.length} lessons done)</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-govText-primary">
                      {currentModuleQuiz.title || `Module ${activeModIdx + 1} Assessment`}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-govText-secondary">
                      <span>
                        Questions: <strong>{currentModuleQuiz.questionCount || currentModuleQuiz.questions?.length || 5}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Passing Score: <strong>{currentModuleQuiz.passThreshold || 75}%</strong>
                      </span>
                      {currentModuleQuiz.passed && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Passed ({currentModuleQuiz.bestScore || 100}%)</span>
                          </span>
                        </>
                      )}
                    </div>

                    {!isCurrentModuleQuizUnlocked && (
                      <p className="text-xs text-amber-800 bg-amber-100/60 rounded-lg p-2.5 mt-1 border border-amber-200">
                        Complete all {currentModuleLessonIds.length} lessons in <strong>Module {activeModIdx + 1}: {moduleTitle}</strong> to unlock this assessment.
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      id="btn-start-module-quiz"
                      disabled={!isCurrentModuleQuizUnlocked}
                      onClick={() => {
                        navigate('quiz', {
                          courseId: course.id,
                          moduleId: currentModule.id,
                          quizId: currentModuleQuiz.id,
                        });
                      }}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                        isCurrentModuleQuizUnlocked
                          ? 'bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-govTeal-950 shadow-saffron-500/20'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isCurrentModuleQuizUnlocked ? (
                        <>
                          <Sparkles className="w-4 h-4 text-govTeal-950" />
                          <span>Start Quiz</span>
                          <ChevronRight className="w-4 h-4 text-govTeal-950" />
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-gray-400" />
                          <span>Locked</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 3. Bottom Navigation Controls */}
          <div className="max-w-4xl mx-auto w-full pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={handlePreviousLesson}
              disabled={isFirstLesson}
              className={`w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                isFirstLesson
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-govText-primary hover:bg-gray-100 border border-govText-border cursor-pointer shadow-xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.player?.previousLesson || 'Previous Lesson'}</span>
            </button>

            <div className="flex items-center gap-3">
              {isCurrentCompleted && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Lesson Completed</span>
                </span>
              )}

              <button
                id="btn-course-next-action"
                onClick={handleNextLesson}
                className={`w-full sm:w-auto px-6 py-2.5 min-h-[44px] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
                  isCurrentCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-govTeal-600 hover:bg-govTeal-700'
                }`}
              >
                <span>
                  {isLastLessonInModule && currentModuleQuiz
                    ? isCurrentModuleQuizUnlocked
                      ? (t.player?.startQuiz || 'Take Module Quiz →')
                      : 'Complete Lessons to Unlock Quiz 🔒'
                    : 'Continue to Next Lesson →'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
