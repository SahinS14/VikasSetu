import { enrollmentRepository } from '../repositories/enrollmentRepository';
import { courseRepository } from '../repositories/courseRepository';
import { certificateRepository } from '../repositories/certificateRepository';
import { userRepository } from '../repositories/userRepository';
import { createError } from '../middleware/errorHandler';

// Helper to calculate progress given completed lesson IDs vs total lessons in course
const calcProgress = (completedLessonIds: string[], modulesJson: any[]): number => {
  const totalLessons = (modulesJson as any[]).reduce(
    (acc: number, m: any) => acc + (m.lessons?.length || 0),
    0
  );
  if (totalLessons === 0) return 0;
  return Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100));
};

export const courseService = {
  getAllCourses: async () => {
    const courses = await courseRepository.findAll();
    return courses.map((c: any) => {
      const dbModules = c.modules && c.modules.length > 0
        ? c.modules.map((m: any) => ({
            id: m.id,
            courseId: m.courseId,
            order: m.orderIndex,
            title: m.title,
            titleHi: m.titleHi || m.title,
            titleMr: m.titleMr || m.title,
            description: m.description,
            lessons: (m.lessons || []).map((l: any) => ({
              id: l.id,
              moduleId: l.moduleId,
              order: l.orderIndex,
              title: l.title,
              titleHi: l.titleHi || l.title,
              titleMr: l.titleMr || l.title,
              durationMinutes: l.durationMinutes,
              contentType: l.contentType,
            })),
            quiz: m.quizzes && m.quizzes[0] ? m.quizzes[0] : undefined,
          }))
        : (c.modulesJson || []);

      const isPublic = c.id.includes('shg') || c.category === 'SHG Governance';
      const defaultAccessType = isPublic ? 'PUBLIC' : 'SELF_ENROLLMENT';
      const accessType = c.accessType || defaultAccessType;
      const enrollmentType = accessType === 'PUBLIC' ? 'PUBLIC' : (accessType === 'REQUEST_APPROVAL' ? 'REQUEST' : 'SELF_ENROLL');

      return {
        ...c,
        modules: dbModules,
        accessType,
        enrollmentType,
        requiresProgrammeApproval: Boolean(c.requiresProgrammeApproval || false),
        requiresBatchAssignment: Boolean(c.requiresBatchAssignment || false),
        deliveryMode: c.deliveryMode || 'Online',
        certificateAvailable: c.certificateAvailable !== false,
        tags: c.tags || [c.category?.toLowerCase() || 'cooperative'],
      };
    });
  },

  getCourseById: async (id: string) => {
    try {
      const { curriculumService } = await import('./curriculumService');
      return await curriculumService.getCourseCurriculum(id);
    } catch {
      const course = await courseRepository.findById(id);
      if (!course) throw createError(404, 'Course not found');
      return {
        ...course,
        modules: (course as any).modulesJson || [],
      };
    }
  },

  getEnrollments: async (userId: string) => {
    const enrollments = await enrollmentRepository.findByUser(userId);
    return enrollments.map((e: any) => {
      const course = e.course
        ? {
            ...e.course,
            modules: (e.course.modules && e.course.modules.length > 0)
              ? e.course.modules
              : (e.course.modulesJson || []),
          }
        : undefined;

      const completedLessonsCount = (e.lessonProgress || []).filter((lp: any) => lp.completed || lp.status === 'COMPLETED').length || (e.completedLessonIds?.length || 0);
      const totalLessonsCount = (course?.modules || []).reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || course?.totalLessons || completedLessonsCount || 0;
      const passedQuizzesCount = (e.quizAttempts || []).filter((qa: any) => qa.passed || qa.percentage >= 75).length || (e.completedQuizIds?.length || 0);

      return {
        ...e,
        course,
        completedLessonsCount,
        totalLessonsCount,
        passedQuizzesCount,
      };
    });
  },

  getEnrollmentById: async (enrollmentId: string, userId: string) => {
    const list = await enrollmentRepository.findByUser(userId);
    const enrollment = list.find((e) => e.id === enrollmentId || e.courseId === enrollmentId);
    if (!enrollment) throw createError(404, 'Enrollment not found');
    return {
      ...enrollment,
      course: (enrollment as any).course
        ? {
            ...(enrollment as any).course,
            modules: (enrollment as any).course.modulesJson || [],
          }
        : undefined,
    };
  },

  enrollInCourse: async (userId: string, courseId: string) => {
    const user = await userRepository.findById(userId);
    if (!user) throw createError(404, 'User not found');
    const roleLower = (user.role || '').toLowerCase();
    if (roleLower !== 'trainee' && roleLower !== 'learner') {
      throw createError(403, 'Only registered trainees can enroll in national curriculum courses');
    }

    const course = await courseRepository.findById(courseId);
    if (!course) throw createError(404, 'Course not found');

    const existing = await enrollmentRepository.findByUserAndCourse(userId, course.id);
    if (existing) return existing; // idempotent duplicate prevention

    return enrollmentRepository.create({
      id: `enr-${userId}-${course.id}`,
      userId,
      courseId: course.id,
      enrolledDate: new Date().toISOString().split('T')[0],
      status: 'IN_PROGRESS',
      progressPercent: 0,
      completedLessonIds: [],
      completedQuizIds: [],
    });
  },

  markLessonComplete: async (userId: string, enrollmentIdOrCourseId: string, lessonId: string) => {
    const list = await enrollmentRepository.findByUser(userId);
    const enrollment = list.find(
      (e) => e.id === enrollmentIdOrCourseId || e.courseId === enrollmentIdOrCourseId
    );

    if (!enrollment) throw createError(404, 'Enrollment not found');
    if (enrollment.userId !== userId) throw createError(403, 'Forbidden');

    const completed = (enrollment.completedLessonIds as string[]) || [];
    if (completed.includes(lessonId)) return enrollment; // already done

    const updatedCompleted = [...completed, lessonId];
    const modules = (enrollment.course?.modulesJson as any[]) || [];
    const totalLessons = (modules as any[]).reduce(
      (acc: number, m: any) => acc + (m.lessons?.length || 0),
      0
    );
    const totalQuizzes = modules.filter((m: any) => m.quiz).length;
    const completedQuizzes = (enrollment.completedQuizIds as string[]) || [];

    const totalTrackableItems = totalLessons + totalQuizzes;
    const completedItems = updatedCompleted.length + completedQuizzes.length;
    const progress = totalTrackableItems > 0
      ? Math.min(100, Math.round((completedItems / totalTrackableItems) * 100))
      : 100;

    const isFullyDone =
      updatedCompleted.length >= totalLessons &&
      (totalQuizzes === 0 || completedQuizzes.length >= totalQuizzes) &&
      totalTrackableItems > 0;

    const updated = await enrollmentRepository.update(enrollment.id, {
      completedLessonIds: updatedCompleted,
      progressPercent: isFullyDone ? 100 : progress,
      lastAccessedLessonId: lessonId,
      ...(isFullyDone && enrollment.status.toLowerCase() !== 'completed'
        ? { status: 'COMPLETED', completionDate: new Date().toISOString().split('T')[0], completedAt: new Date() }
        : progress > 0 && enrollment.status !== 'COMPLETED' ? { status: 'IN_PROGRESS' } : {}),
    });

    // If fully complete and certificate not yet created, create it
    if (isFullyDone) {
      const existingCert = await certificateRepository.findByUserAndCourse(userId, enrollment.courseId);
      if (!existingCert) {
        const user = await userRepository.findById(userId);
        const certId = `NCCT-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await certificateRepository.create({
          id: certId,
          userId,
          userName: user?.name || 'Trainee',
          userAadhaarMock: user?.aadhaarMock || undefined,
          courseId: enrollment.courseId,
          courseTitle: enrollment.course.title,
          courseTitleHi: enrollment.course.titleHi,
          instituteId: enrollment.course.instituteId,
          instituteName: 'NCCT National Training Institute',
          issuedDate: new Date().toISOString().split('T')[0],
          certificateHash:
            '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          grade: 'Passed',
          status: 'ISSUED',
        }).catch(() => {});
      }
    }

    return updated;
  },
};
