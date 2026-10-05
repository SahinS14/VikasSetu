import { Course, Enrollment } from '../types';

export interface CourseCompletionStatus {
  isEnrolled: boolean;
  isCompleted: boolean;
  hasCertificate: boolean;
  progress: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  passedAssessment: boolean;
}

/**
 * Authoritative course completion & progress calculation.
 * Shared across National Training Course Catalog and My Enrolled Courses
 * to ensure 100% database query consistency.
 */
export function computeCourseStatus(
  course: Course,
  enrollment?: Enrollment | null,
  cert?: any | null
): CourseCompletionStatus {
  const isEnrolled = Boolean(enrollment);
  const hasCertificate = Boolean(cert);

  const modules = course.modules || (course as any).modulesJson || [];
  const totalLessonsCount =
    modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) ||
    (course as any).totalLessons ||
    (course as any).lessonsCount ||
    0;

  if (!enrollment) {
    return {
      isEnrolled: false,
      isCompleted: false,
      hasCertificate: false,
      progress: 0,
      completedLessonsCount: 0,
      totalLessonsCount,
      passedAssessment: false,
    };
  }

  const completedLessonIds = Array.isArray(enrollment.completedLessonIds)
    ? enrollment.completedLessonIds
    : [];

  const relationalCompletedLessons = Array.isArray((enrollment as any).lessonProgress)
    ? (enrollment as any).lessonProgress
        .filter((lp: any) => lp.status === 'COMPLETED' || lp.completed)
        .map((lp: any) => lp.lessonId)
    : [];

  const completedLessonsSet = new Set([...completedLessonIds, ...relationalCompletedLessons]);
  const completedLessonsCount = completedLessonsSet.size;

  const completedQuizIds = Array.isArray(enrollment.completedQuizIds)
    ? enrollment.completedQuizIds
    : [];

  const relationalPassedQuizzes = Array.isArray((enrollment as any).quizAttempts)
    ? (enrollment as any).quizAttempts
        .filter((qa: any) => qa.passed || qa.percentage >= 75)
        .map((qa: any) => qa.quizId)
    : [];

  const passedAssessment = Boolean(
    hasCertificate ||
    completedQuizIds.length > 0 ||
    relationalPassedQuizzes.length > 0
  );

  const allLessonsDone = totalLessonsCount > 0 && completedLessonsCount >= totalLessonsCount;
  const statusLower = (enrollment.status || '').toLowerCase();

  const isCompleted = Boolean(
    hasCertificate ||
    statusLower === 'completed' ||
    (allLessonsDone && passedAssessment) ||
    (enrollment.progressPercent || 0) >= 100
  );

  const calculatedProgress = totalLessonsCount > 0
    ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100))
    : (enrollment.progressPercent || 0);

  const progress = isCompleted ? 100 : calculatedProgress;

  return {
    isEnrolled: true,
    isCompleted,
    hasCertificate,
    progress,
    completedLessonsCount,
    totalLessonsCount: totalLessonsCount > 0 ? totalLessonsCount : Math.max(completedLessonsCount, 1),
    passedAssessment,
  };
}
