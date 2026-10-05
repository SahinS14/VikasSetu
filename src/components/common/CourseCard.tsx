import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ArrowRight, Clock, Award, Sparkles, Loader2, Layers } from 'lucide-react';
import { Course, Enrollment, Language } from '../../types';
import { computeCourseStatus } from '../../utils/courseStatus';

export interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  certificate?: any;
  currentLanguage: Language;
  onSelect: (courseId: string) => void;
  onEnroll?: (courseId: string) => Promise<void> | void;
  isEnrolling?: boolean;
  continueLabel?: string;
  startLabel?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  enrollment,
  certificate,
  currentLanguage,
  onSelect,
  onEnroll,
  isEnrolling = false,
  continueLabel = 'Continue Course',
  startLabel = 'Register / Enroll',
}) => {
  const [imageError, setImageError] = useState(false);

  const status = computeCourseStatus(course, enrollment, certificate);
  const isCompleted = status.isCompleted;
  const progress = status.progress;
  const isEnrolled = status.isEnrolled;

  const modulesCount = course.modules?.length || 0;
  const lessonsCount = status.totalLessonsCount || course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  const title =
    currentLanguage === 'hi'
      ? course.titleHi
      : currentLanguage === 'mr'
      ? course.titleMr
      : course.title;

  const description =
    currentLanguage === 'hi'
      ? course.descriptionHi
      : currentLanguage === 'mr'
      ? course.descriptionMr
      : course.description;

  return (
    <div className="bg-white rounded-2xl border border-govText-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Fixed 16:9 Media Aspect Ratio Container with Fallback */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-govTeal-800 to-govTeal-950 flex items-center justify-center">
          {!imageError && course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="p-4 text-center text-white/90 space-y-1">
              <BookOpen className="w-8 h-8 text-saffron-300 mx-auto" />
              <span className="text-xs font-bold tracking-wide uppercase font-sans text-govTeal-200">
                {course.category}
              </span>
            </div>
          )}

          {/* Top Badges: Level & Enrollment Status */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase">
              {course.level}
            </span>
            {isCompleted ? (
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </span>
            ) : isEnrolled ? (
              <span className="px-2 py-0.5 rounded bg-govTeal-700 text-white text-[10px] font-bold shadow">
                Enrolled
              </span>
            ) : null}
          </div>

          {/* Duration Badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-govTeal-900 shadow-sm flex items-center gap-1">
            <Clock className="w-3 h-3 text-govTeal-600" />
            <span>{course.durationHours} Hours</span>
          </div>

          {/* Category Tag */}
          <div className="absolute bottom-3 left-3 bg-govTeal-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
            {course.category}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          {/* Lessons / Modules info */}
          <div className="flex items-center justify-between text-[11px] text-govText-muted">
            <div className="flex items-center gap-1.5 font-medium text-govText-secondary">
              <Layers className="w-3.5 h-3.5 text-govTeal-600" />
              <span>{modulesCount > 0 ? `${modulesCount} Modules` : 'Modular Course'}</span>
              {lessonsCount > 0 && <span>• {lessonsCount} Lessons</span>}
            </div>
            <span className="font-semibold text-govTeal-700">
              {isEnrolled ? (isCompleted ? 'Finished' : `${progress}% Done`) : 'Not Enrolled'}
            </span>
          </div>

          <h4
            onClick={() => onSelect(course.id)}
            className="font-bold text-base text-govText-primary line-clamp-2 leading-snug group-hover:text-govTeal-700 transition-colors cursor-pointer"
          >
            {title}
          </h4>

          <p className="text-xs text-govText-secondary line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Progress Bar (Visible when enrolled) */}
          {isEnrolled && (
            <div className="pt-1 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-govText-secondary">Course Progress</span>
                <span className={isCompleted ? 'text-emerald-700' : 'text-govTeal-700'}>
                  {progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isCompleted ? 'bg-emerald-600' : 'bg-govTeal-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-5 pt-0">
        {!isEnrolled ? (
          <button
            onClick={() => {
              if (onEnroll) {
                onEnroll(course.id);
              } else {
                onSelect(course.id);
              }
            }}
            disabled={isEnrolling}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isEnrolling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Register / Enroll</span>
              </>
            )}
          </button>
        ) : isCompleted ? (
          <button
            onClick={() => onSelect(course.id)}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Review Content</span>
          </button>
        ) : (
          <button
            onClick={() => onSelect(course.id)}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-govTeal-600 hover:bg-govTeal-700 active:scale-[0.98] text-white shadow cursor-pointer"
          >
            <span>Continue Course</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
