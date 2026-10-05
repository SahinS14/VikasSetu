import crypto from 'crypto';
import prisma from '../config/prisma';
import { learningRepository } from '../repositories/learningRepository';
import { courseRepository } from '../repositories/courseRepository';
import { userRepository } from '../repositories/userRepository';
import { certificateRepository } from '../repositories/certificateRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { createError } from '../middleware/errorHandler';
import { generateCertId, generateCertHash } from '../utils/generateCertId';

const COURSE_ALIASES: Record<string, string[]> = {
  'crs-shg-101': ['crs-shg-101', 'crs-shg-gov-301'],
  'crs-shg-gov-301': ['crs-shg-gov-301', 'crs-shg-101'],
  'crs-dairy-101': ['crs-dairy-101', 'crs-dairy-mgmt-201'],
  'crs-dairy-mgmt-201': ['crs-dairy-mgmt-201', 'crs-dairy-101'],
  'crs-pacs-101': ['crs-pacs-101', 'crs-pacs-erp-101'],
  'crs-pacs-erp-101': ['crs-pacs-erp-101', 'crs-pacs-101'],
};

export const learningService = {
  /**
   * Enroll a learner in a course
   */
  enroll: async (userId: string, courseId: string) => {
    // 1. Resolve course
    let course = await courseRepository.findById(courseId);
    if (!course && COURSE_ALIASES[courseId]) {
      for (const alias of COURSE_ALIASES[courseId]) {
        course = await courseRepository.findById(alias);
        if (course) break;
      }
    }
    if (!course) throw createError(404, `Course ${courseId} not found`);

    // 2. Check existing enrollment under primary or alias ID
    let existingEnrollment = await learningRepository.findEnrollment(userId, course.id);
    if (!existingEnrollment && courseId !== course.id) {
      existingEnrollment = await learningRepository.findEnrollment(userId, courseId);
    }
    if (existingEnrollment) {
      return {
        alreadyEnrolled: true,
        enrollment: existingEnrollment,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const enrollmentId = `enr-${userId}-${course.id}`;

    const newEnrollment = await learningRepository.createEnrollment({
      id: enrollmentId,
      userId,
      courseId: course.id,
      enrolledDate: today,
      status: 'ENROLLED',
    });

    // Notify learner
    await notificationRepository.create({
      id: `notif-enr-${Date.now()}`,
      userId,
      title: 'Enrolled in Course! 📚',
      message: `You have successfully enrolled in "${course.title}". Start learning now!`,
      timestamp: new Date().toISOString(),
      type: 'course',
      linkView: 'course-detail',
    }).catch(() => {});

    return {
      alreadyEnrolled: false,
      enrollment: newEnrollment,
    };
  },

  /**
   * Get learning status, curriculum, lessons, quiz status, and progress for a course
   */
  getCourseLearning: async (userId: string, courseId: string) => {
    let course = await courseRepository.findById(courseId);
    if (!course && COURSE_ALIASES[courseId]) {
      for (const alias of COURSE_ALIASES[courseId]) {
        course = await courseRepository.findById(alias);
        if (course) {
          courseId = course.id;
          break;
        }
      }
    }
    if (!course) throw createError(404, `Course ${courseId} not found`);

    const targetCourseIds = Array.from(new Set([course.id, ...(COURSE_ALIASES[course.id] || []), ...(COURSE_ALIASES[courseId] || [])]));
    const curriculum = await learningRepository.getCourseCurriculum(targetCourseIds);
    const allLessonIds = curriculum.flatMap((m) => m.lessons.map((l) => l.id));

    // 1. Fetch ALL enrollments for this user across targetCourseIds
    const userEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        courseId: { in: targetCourseIds },
      },
      include: {
        lessonProgress: true,
        quizAttempts: { orderBy: { createdAt: 'desc' } },
      },
    });

    // 2. Fetch ALL LessonProgress records for this user across the curriculum lessons
    const userLessonProgressRecords = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: allLessonIds },
      },
    });

    let enrollment = userEnrollments.find((e) => e.courseId === course.id) || userEnrollments[0] || null;
    if (!enrollment) {
      enrollment = await learningRepository.findEnrollment(userId, course.id);
    }

    // Build completed map & progress map
    const completedLessonSet = new Set<string>();
    const lessonProgressMap = new Map<string, {
      status: string;
      progressSeconds: number;
      progressPercent: number;
      completed: boolean;
      lastWatchedAt: Date | null;
    }>();

    // Populate from all user LessonProgress records
    userLessonProgressRecords.forEach((lp) => {
      const isDone = Boolean(lp.completed || lp.status === 'COMPLETED' || (lp.progressPercent && lp.progressPercent >= 90));
      if (isDone) completedLessonSet.add(lp.lessonId);
      lessonProgressMap.set(lp.lessonId, {
        status: isDone ? 'COMPLETED' : lp.status,
        progressSeconds: lp.progressSeconds || 0,
        progressPercent: lp.progressPercent || (isDone ? 100 : 0),
        completed: isDone,
        lastWatchedAt: lp.lastWatchedAt || null,
      });
    });

    // Populate from all user enrollments (merging across aliases)
    userEnrollments.forEach((enr) => {
      if (Array.isArray(enr.completedLessonIds)) {
        (enr.completedLessonIds as string[]).forEach((id) => {
          if (allLessonIds.includes(id)) completedLessonSet.add(id);
        });
      }
      if (enr.lessonProgress) {
        enr.lessonProgress.forEach((lp: any) => {
          const isDone = Boolean(lp.completed || lp.status === 'COMPLETED' || (lp.progressPercent && lp.progressPercent >= 90));
          if (isDone && allLessonIds.includes(lp.lessonId)) completedLessonSet.add(lp.lessonId);
          if (!lessonProgressMap.has(lp.lessonId)) {
            lessonProgressMap.set(lp.lessonId, {
              status: isDone ? 'COMPLETED' : lp.status,
              progressSeconds: lp.progressSeconds || 0,
              progressPercent: lp.progressPercent || (isDone ? 100 : 0),
              completed: isDone,
              lastWatchedAt: lp.lastWatchedAt || null,
            });
          }
        });
      }
    });

    // Build quiz attempts map & passed status across all enrollments
    const quizPassedMap = new Map<string, { passed: boolean; bestScore: number; attempts: number }>();
    userEnrollments.forEach((enr) => {
      if (enr.quizAttempts) {
        enr.quizAttempts.forEach((attempt) => {
          const current = quizPassedMap.get(attempt.quizId) || { passed: false, bestScore: 0, attempts: 0 };
          current.attempts += 1;
          if (attempt.passed) current.passed = true;
          if (attempt.percentage > current.bestScore) current.bestScore = attempt.percentage;
          quizPassedMap.set(attempt.quizId, current);
        });
      }
      if (Array.isArray(enr.completedQuizIds)) {
        (enr.completedQuizIds as string[]).forEach((qid) => {
          const current = quizPassedMap.get(qid) || { passed: true, bestScore: 100, attempts: 1 };
          current.passed = true;
          quizPassedMap.set(qid, current);
        });
      }
    });

    // Synchronize enrollment if progress is out of date
    const totalLessons = allLessonIds.length;
    const computedCompletedCount = completedLessonSet.size;
    const computedProgressPercent = totalLessons > 0
      ? Math.min(100, Math.round((computedCompletedCount / totalLessons) * 100))
      : 0;

    if (enrollment) {
      const currentIds = Array.isArray(enrollment.completedLessonIds) ? (enrollment.completedLessonIds as string[]) : [];
      const isMissingLessons = Array.from(completedLessonSet).some(id => !currentIds.includes(id));
      if (isMissingLessons || enrollment.progressPercent !== computedProgressPercent) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            completedLessonIds: Array.from(completedLessonSet),
            progressPercent: computedProgressPercent,
          },
        }).catch(() => {});
        enrollment.completedLessonIds = Array.from(completedLessonSet);
        enrollment.progressPercent = computedProgressPercent;
      }
    }

    // Process modules and strip sensitive quiz answers from this overview
    const processedModules = curriculum.map((mod) => {
      const moduleLessonIds = mod.lessons.map((l) => l.id);
      const allLessonsCompleted =
        moduleLessonIds.length > 0 &&
        moduleLessonIds.every((id) => completedLessonSet.has(id));

      const moduleQuizzes = mod.quizzes.map((q) => {
        const quizStat = quizPassedMap.get(q.id) || { passed: false, bestScore: 0, attempts: 0 };
        return {
          id: q.id,
          title: q.title,
          titleHi: q.titleHi,
          titleMr: q.titleMr,
          passThreshold: q.passThreshold,
          questionCount: q.questions.length,
          passed: quizStat.passed,
          bestScore: quizStat.bestScore,
          attemptsCount: quizStat.attempts,
        };
      });

      const allQuizzesPassed =
        moduleQuizzes.length === 0 || moduleQuizzes.every((q) => q.passed);

      return {
        id: mod.id,
        orderIndex: mod.orderIndex,
        title: mod.title,
        titleHi: mod.titleHi,
        titleMr: mod.titleMr,
        description: mod.description,
        isCompleted: allLessonsCompleted && allQuizzesPassed,
        lessons: mod.lessons.map((l) => {
          const lp = lessonProgressMap.get(l.id);
          const isDone = completedLessonSet.has(l.id) || Boolean(lp?.completed);
          return {
            ...l,
            isCompleted: isDone,
            completed: isDone,
            progressSeconds: lp?.progressSeconds || 0,
            progressPercent: lp?.progressPercent || (isDone ? 100 : 0),
            lastWatchedAt: lp?.lastWatchedAt || null,
          };
        }),
        quizzes: moduleQuizzes,
      };
    });

    let certificate = await certificateRepository.findByUserAndCourse(userId, course.id);
    if (!certificate && COURSE_ALIASES[course.id]) {
      for (const alias of COURSE_ALIASES[course.id]) {
        certificate = await certificateRepository.findByUserAndCourse(userId, alias);
        if (certificate) break;
      }
    }

    return {
      course: {
        id: course.id,
        title: course.title,
        titleHi: course.titleHi,
        titleMr: course.titleMr,
        description: course.description,
        thumbnail: course.thumbnail,
        durationHours: course.durationHours,
        category: course.category,
        level: course.level,
      },
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            progressPercent: enrollment.progressPercent,
            enrolledDate: enrollment.enrolledDate,
            completedAt: enrollment.completedAt,
            completionDate: enrollment.completionDate,
            lastAccessedLessonId: enrollment.lastAccessedLessonId,
          }
        : null,
      modules: processedModules,
      certificate: certificate
        ? {
            id: certificate.id,
            certificateNumber: certificate.certificateNumber || certificate.id,
            verificationToken: certificate.verificationToken,
            issuedDate: certificate.issueDate || certificate.issuedDate,
            grade: certificate.grade,
          }
        : null,
    };
  },

  /**
   * Complete a lesson and update course progress
   */
  completeLesson: async (userId: string, lessonId: string) => {
    const lesson = await learningRepository.findLesson(lessonId);
    if (!lesson) throw createError(404, `Lesson ${lessonId} not found`);

    const courseId = lesson.courseId;
    let enrollment = await learningRepository.findEnrollment(userId, courseId);
    if (!enrollment) {
      const today = new Date().toISOString().split('T')[0];
      enrollment = await learningRepository.createEnrollment({
        id: `enr-${userId}-${courseId}`,
        userId,
        courseId,
        enrolledDate: today,
        status: 'IN_PROGRESS',
      });
    }

    // Upsert LessonProgress
    const progressId = `lp-${enrollment.id}-${lessonId}`;
    await learningRepository.upsertLessonProgress({
      id: progressId,
      enrollmentId: enrollment.id,
      courseId,
      moduleId: lesson.moduleId,
      lessonId,
      userId,
      status: 'COMPLETED',
      progressPercent: 100,
      completed: true,
      completedAt: new Date(),
    });

    // Update completedLessonIds list
    const currentCompleted = new Set<string>(
      Array.isArray(enrollment.completedLessonIds)
        ? (enrollment.completedLessonIds as string[])
        : []
    );
    currentCompleted.add(lessonId);
    const updatedLessonIds = Array.from(currentCompleted);

    // Calculate overall course progress based on required lessons
    const targetCourseIds = Array.from(new Set([courseId, ...(COURSE_ALIASES[courseId] || [])]));
    const curriculum = await learningRepository.getCourseCurriculum(targetCourseIds);
    let totalLessons = 0;
    curriculum.forEach((mod) => {
      totalLessons += mod.lessons.length;
    });

    const passedQuizzes = new Set<string>(
      Array.isArray(enrollment.completedQuizIds)
        ? (enrollment.completedQuizIds as string[])
        : []
    );

    const allLessonsCompleted = totalLessons > 0 ? updatedLessonIds.length >= totalLessons : true;
    const progressPercent = allLessonsCompleted
      ? 100
      : totalLessons > 0
      ? Math.min(100, Math.round((updatedLessonIds.length / totalLessons) * 100))
      : 100;

    const courseCompleted = allLessonsCompleted && passedQuizzes.size > 0;
    const newStatus = courseCompleted
      ? 'COMPLETED'
      : progressPercent > 0
      ? 'IN_PROGRESS'
      : enrollment.status;

      // Update all user enrollments for targetCourseIds so aliases stay in sync
      const allUserEnrs = await prisma.enrollment.findMany({
        where: { userId, courseId: { in: targetCourseIds } },
      });
      for (const enr of allUserEnrs) {
        const enrLessons = new Set<string>(
          Array.isArray(enr.completedLessonIds) ? (enr.completedLessonIds as string[]) : []
        );
        enrLessons.add(lessonId);
        const enrDone = Array.from(enrLessons);
        const enrProgress = totalLessons > 0 ? Math.min(100, Math.round((enrDone.length / totalLessons) * 100)) : 100;
        await learningRepository.updateEnrollment(enr.id, {
          completedLessonIds: enrDone,
          progressPercent: enrProgress,
          lastAccessedLessonId: lessonId,
          status: newStatus,
          ...(courseCompleted && !enr.completedAt
            ? {
                completedAt: new Date(),
                completionDate: new Date().toISOString().split('T')[0],
              }
            : {}),
        }).catch(() => {});
      }

    return {
      success: true,
      lessonId,
      progressPercent,
      status: newStatus,
      allCompleted: allLessonsCompleted,
    };
  },

  /**
   * Save real-time video progress and calculate completion
   */
  saveLessonProgress: async (
    userId: string,
    lessonId: string,
    data: { progressSeconds?: number; progressPercent?: number; completed?: boolean }
  ) => {
    const lesson = await learningRepository.findLesson(lessonId);
    if (!lesson) throw createError(404, `Lesson ${lessonId} not found`);

    const courseId = lesson.courseId;
    let enrollment = await learningRepository.findEnrollment(userId, courseId);
    if (!enrollment && COURSE_ALIASES[courseId]) {
      for (const alias of COURSE_ALIASES[courseId]) {
        enrollment = await learningRepository.findEnrollment(userId, alias);
        if (enrollment) break;
      }
    }
    if (!enrollment) {
      const today = new Date().toISOString().split('T')[0];
      enrollment = await learningRepository.createEnrollment({
        id: `enr-${userId}-${courseId}`,
        userId,
        courseId,
        enrolledDate: today,
        status: 'IN_PROGRESS',
      });
    }

    // Input validation & sanitization
    const rawPercent = Number(data.progressPercent);
    const progressPercent = Number.isFinite(rawPercent)
      ? Math.max(0, Math.min(100, Math.round(rawPercent)))
      : 0;

    const rawSeconds = Number(data.progressSeconds);
    const progressSeconds = Number.isFinite(rawSeconds)
      ? Math.max(0, Math.round(rawSeconds))
      : 0;

    // Security: Check existing progress
    const existing = await learningRepository.findLessonProgressByUser(userId, lessonId);
    const wasAlreadyCompleted = Boolean(existing?.completed || existing?.status === 'COMPLETED');

    // Rule: Reaching completion threshold (>= 90%) marks completed
    // Security check: cannot set completed: true if progressPercent < 90 unless was already completed
    const meetsThreshold = progressPercent >= 90;
    const isCompleted = wasAlreadyCompleted || meetsThreshold;

    const newStatus = isCompleted ? 'COMPLETED' : progressPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    const completedAt = wasAlreadyCompleted
      ? existing?.completedAt || new Date()
      : isCompleted
      ? new Date()
      : undefined;

    const progressId = existing?.id || `lp-${enrollment.id}-${lessonId}`;

    const savedRecord = await learningRepository.upsertLessonProgress({
      id: progressId,
      enrollmentId: enrollment.id,
      courseId,
      moduleId: lesson.moduleId,
      lessonId,
      userId,
      status: newStatus,
      progressSeconds,
      progressPercent: wasAlreadyCompleted ? Math.max(progressPercent, existing?.progressPercent || 100) : progressPercent,
      completed: isCompleted,
      completedAt,
      lastWatchedAt: new Date(),
    });

    // If completed, update course enrollment progress
    let enrollmentProgressPercent = enrollment.progressPercent;
    let enrollmentStatus = enrollment.status;
    let allCompleted = false;

    if (isCompleted) {
      const currentCompleted = new Set<string>(
        Array.isArray(enrollment.completedLessonIds)
          ? (enrollment.completedLessonIds as string[])
          : []
      );
      currentCompleted.add(lessonId);
      const updatedLessonIds = Array.from(currentCompleted);

      const targetCourseIds = Array.from(new Set([courseId, ...(COURSE_ALIASES[courseId] || [])]));
      const curriculum = await learningRepository.getCourseCurriculum(targetCourseIds);
      let totalLessons = 0;
      curriculum.forEach((mod) => {
        totalLessons += mod.lessons.length;
      });

      const passedQuizzes = new Set<string>(
        Array.isArray(enrollment.completedQuizIds)
          ? (enrollment.completedQuizIds as string[])
          : []
      );

      allCompleted = totalLessons > 0 ? updatedLessonIds.length >= totalLessons : true;
      enrollmentProgressPercent = allCompleted
        ? 100
        : totalLessons > 0
        ? Math.min(100, Math.round((updatedLessonIds.length / totalLessons) * 100))
        : 100;

      const courseCompleted = allCompleted && passedQuizzes.size > 0;
      enrollmentStatus = courseCompleted
        ? 'COMPLETED'
        : enrollmentProgressPercent > 0
        ? 'IN_PROGRESS'
        : enrollment.status;

      // Update all user enrollments for targetCourseIds so aliases stay in sync
      const allUserEnrs = await prisma.enrollment.findMany({
        where: { userId, courseId: { in: targetCourseIds } },
      });
      for (const enr of allUserEnrs) {
        const enrLessons = new Set<string>(
          Array.isArray(enr.completedLessonIds) ? (enr.completedLessonIds as string[]) : []
        );
        enrLessons.add(lessonId);
        const enrDone = Array.from(enrLessons);
        const enrProgress = totalLessons > 0 ? Math.min(100, Math.round((enrDone.length / totalLessons) * 100)) : 100;
        await learningRepository.updateEnrollment(enr.id, {
          completedLessonIds: enrDone,
          progressPercent: enrProgress,
          lastAccessedLessonId: lessonId,
          status: enrollmentStatus,
          ...(courseCompleted && !enr.completedAt
            ? {
                completedAt: new Date(),
                completionDate: new Date().toISOString().split('T')[0],
              }
            : {}),
        }).catch(() => {});
      }
    }

    return {
      success: true,
      lessonId,
      progressSeconds: savedRecord.progressSeconds,
      progressPercent: savedRecord.progressPercent,
      completed: savedRecord.completed || isCompleted,
      completedAt: savedRecord.completedAt,
      lastWatchedAt: savedRecord.lastWatchedAt,
      courseProgressPercent: enrollmentProgressPercent,
      courseStatus: enrollmentStatus,
      allCompleted,
    };
  },

  /**
   * Get student's lesson progress
   */
  getLessonProgress: async (userId: string, lessonId: string) => {
    const existing = await learningRepository.findLessonProgressByUser(userId, lessonId);
    const isDone = Boolean(existing?.completed || existing?.status === 'COMPLETED');
    return {
      lessonId,
      progressSeconds: existing?.progressSeconds || 0,
      progressPercent: existing?.progressPercent || (isDone ? 100 : 0),
      completed: isDone,
      completedAt: existing?.completedAt || null,
      lastWatchedAt: existing?.lastWatchedAt || null,
    };
  },

  /**
   * Get quiz for learner — SERVER-SIDE SECURITY: strip isCorrect from options!
   */
  getModuleQuiz: async (userId: string, quizOrModuleId: string) => {
    let quiz = await learningRepository.findQuizById(quizOrModuleId);
    if (!quiz) {
      quiz = await learningRepository.findQuizByModuleId(quizOrModuleId);
    }
    if (!quiz) throw createError(404, `Quiz not found for identifier ${quizOrModuleId}`);

    const attemptsCount = await learningRepository.getQuizAttemptsCount(userId, quiz.id);

    // Filter sensitive fields: NEVER send isCorrect to client
    const safeQuestions = quiz.questions.map((q) => ({
      id: q.id,
      orderIndex: q.orderIndex,
      question: q.questionText,
      questionText: q.questionText,
      questionHi: q.questionTextHi,
      questionTextHi: q.questionTextHi,
      questionMr: q.questionTextMr,
      questionTextMr: q.questionTextMr,
      // Include correctOptionIndex so frontend can do per-question immediate feedback
      // Derive from the option marked isCorrect — using its position in ordered options array
      correctOptionIndex: (() => {
        const correctOpt = q.options.find((o) => o.isCorrect);
        if (!correctOpt) return null;
        // optionIndex is the 0-based position stored in the DB
        return correctOpt.optionIndex;
      })(),
      explanation: {
        en: q.explanationEn || '',
        hi: q.explanationHi || '',
        mr: q.explanationMr || '',
      },
      explanationEn: q.explanationEn,
      explanationHi: q.explanationHi,
      explanationMr: q.explanationMr,
      options: q.options.map((opt) => ({
        id: opt.id,
        optionIndex: opt.optionIndex,
        text: opt.optionText,
        optionText: opt.optionText,
        textHi: opt.optionTextHi,
        optionTextHi: opt.optionTextHi,
        textMr: opt.optionTextMr,
        optionTextMr: opt.optionTextMr,
        en: opt.optionText,
        hi: opt.optionTextHi,
        mr: opt.optionTextMr,
      })),
    }));

    const targetCourseIds = Array.from(new Set([quiz.courseId, ...(COURSE_ALIASES[quiz.courseId] || [])]));
    let existingCert = null;
    for (const cId of targetCourseIds) {
      existingCert = await certificateRepository.findByUserAndCourse(userId, cId);
      if (existingCert) break;
    }

    const enrollment = await learningRepository.findEnrollment(userId, quiz.courseId);
    let allLessonsCompleted = true;
    let totalLessons = 0;
    let completedLessonsCount = 0;
    if (enrollment) {
      const curriculum = await learningRepository.getCourseCurriculum(targetCourseIds);
      curriculum.forEach((mod) => {
        totalLessons += mod.lessons.length;
      });
      const completedLessonIds = Array.isArray(enrollment.completedLessonIds)
        ? (enrollment.completedLessonIds as string[])
        : [];
      completedLessonsCount = completedLessonIds.length;
      allLessonsCompleted = totalLessons > 0 ? completedLessonsCount >= totalLessons : true;
    }

    const latestAttempt = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: quiz.id },
      orderBy: { createdAt: 'desc' },
      include: {
        answers: {
          include: {
            option: true,
          },
        },
      },
    });

    const PASSING_SCORE = 75;
    const isLatestPassed = Boolean(latestAttempt && (latestAttempt.percentage >= PASSING_SCORE || latestAttempt.passed));
    const certificateEligible = Boolean(allLessonsCompleted && isLatestPassed);

    // If eligible but certificate record not yet created in DB, create it now
    if (certificateEligible && !existingCert) {
      const course = await courseRepository.findById(quiz.courseId);
      if (course) {
        const user = await userRepository.findById(userId);
        const percentage = latestAttempt ? latestAttempt.percentage : 100;
        const grade =
          percentage >= 90 ? 'Distinction' : percentage >= 75 ? 'First Class' : 'Passed';
        const instTag = (course.category || 'NCCT').replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase() || 'NCT';
        const certId = generateCertId(instTag);
        const certNum = `NCCT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const verificationToken = crypto.randomBytes(24).toString('hex');
        const today = new Date().toISOString().split('T')[0];

        try {
          existingCert = await certificateRepository.create({
            id: certId,
            certificateNumber: certNum,
            userId,
            userName: user ? user.name : 'Trainee',
            userAadhaarMock: user?.aadhaarMock || undefined,
            courseId: quiz.courseId,
            enrollmentId: enrollment?.id,
            courseTitle: course.title,
            courseTitleHi: course.titleHi,
            instituteId: course.instituteId,
            instituteName: 'NCCT National Institute of Cooperative Management',
            issuedDate: today,
            issueDate: today,
            completionDate: today,
            certificateHash: generateCertHash(),
            verificationToken,
            qrCodeData: `/verify/certificate/${verificationToken}`,
            grade,
            status: 'ISSUED',
          });

          if (enrollment) {
            await learningRepository.updateEnrollment(enrollment.id, {
              status: 'COMPLETED',
              progressPercent: 100,
              certificateId: certId,
              ...(enrollment.completedAt ? {} : { completedAt: new Date(), completionDate: today })
            }).catch(() => {});
          }
        } catch {
          // If already exists concurrently, load it
          for (const cId of targetCourseIds) {
            existingCert = await certificateRepository.findByUserAndCourse(userId, cId);
            if (existingCert) break;
          }
        }
      }
    }

    if (enrollment && (certificateEligible || Boolean(existingCert)) && allLessonsCompleted) {
      if (enrollment.status !== 'COMPLETED' || enrollment.progressPercent < 100 || (!enrollment.certificateId && existingCert)) {
        await learningRepository.updateEnrollment(enrollment.id, {
          status: 'COMPLETED',
          progressPercent: 100,
          certificateId: existingCert ? existingCert.id : enrollment.certificateId || undefined,
          ...(enrollment.completedAt ? {} : { completedAt: new Date(), completionDate: new Date().toISOString().split('T')[0] })
        }).catch(() => {});
      }
    }

    return {
      id: quiz.id,
      moduleId: quiz.moduleId,
      courseId: quiz.courseId,
      title: quiz.title,
      titleHi: quiz.titleHi,
      titleMr: quiz.titleMr,
      description: quiz.description,
      passThreshold: quiz.passThreshold || 75,
      totalQuestions: safeQuestions.length,
      totalLessons,
      completedLessonsCount,
      allLessonsCompleted,
      certificateEligible,
      attemptsCount,
      questions: safeQuestions,
      latestAttempt: latestAttempt
        ? {
            id: latestAttempt.id,
            score: latestAttempt.score,
            percentage: latestAttempt.percentage,
            correctAnswers: latestAttempt.correctAnswers,
            totalQuestions: latestAttempt.totalQuestions,
            passed: latestAttempt.passed,
            submittedAt: latestAttempt.submittedAt,
            answers: latestAttempt.answers.map((a) => ({
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              selectedOptionIndex: a.option?.optionIndex ?? -1,
              isCorrect: a.isCorrect,
            })),
          }
        : null,
      certificate: (certificateEligible && existingCert)
        ? {
            id: existingCert.id,
            certificateNumber: existingCert.certificateNumber || existingCert.id,
            userId: existingCert.userId,
            userName: existingCert.userName,
            userAadhaarMock: existingCert.userAadhaarMock,
            courseId: existingCert.courseId,
            courseTitle: existingCert.courseTitle,
            courseTitleHi: existingCert.courseTitleHi,
            instituteId: existingCert.instituteId,
            instituteName: existingCert.instituteName,
            issuedDate: existingCert.issuedDate || existingCert.issueDate,
            issueDate: existingCert.issueDate || existingCert.issuedDate,
            completionDate: existingCert.completionDate,
            certificateHash: existingCert.certificateHash,
            verificationToken: existingCert.verificationToken,
            qrCodeUrl: existingCert.qrCodeData || `/verify/certificate/${existingCert.verificationToken}`,
            grade: existingCert.grade,
            status: existingCert.status,
          }
        : null,
    };
  },

  /**
   * Submit quiz, grade against DB, record attempt, update progress, and issue certificate if course complete
   */
  submitQuiz: async (
    userId: string,
    quizId: string,
    submittedAnswers: Record<string, string> | Array<{ questionId: string; selectedOptionId: string }>
  ) => {
    // 1. Fetch full quiz from DB (including isCorrect)
    let quiz = await learningRepository.findQuizById(quizId);
    if (!quiz) {
      quiz = await learningRepository.findQuizByModuleId(quizId);
    }
    if (!quiz) throw createError(404, `Quiz ${quizId} not found`);

    const course = await courseRepository.findById(quiz.courseId);
    if (!course) throw createError(404, `Course ${quiz.courseId} not found`);

    let enrollment = await learningRepository.findEnrollment(userId, quiz.courseId);
    if (!enrollment) {
      const today = new Date().toISOString().split('T')[0];
      enrollment = await learningRepository.createEnrollment({
        id: `enr-${userId}-${quiz.courseId}`,
        userId,
        courseId: quiz.courseId,
        enrolledDate: today,
        status: 'IN_PROGRESS',
      });
    }

    // Standardize answers format: questionId -> selectedOptionId
    const answerMap: Record<string, string> = {};
    if (Array.isArray(submittedAnswers)) {
      submittedAnswers.forEach((item: any, idx: number) => {
        if (typeof item === 'object' && item !== null && item.questionId && item.selectedOptionId) {
          answerMap[item.questionId] = item.selectedOptionId;
        } else if (typeof item === 'number' && quiz.questions[idx]) {
          const q = quiz.questions[idx];
          const opt = q.options[item] || q.options.find((o) => o.optionIndex === item);
          if (opt) answerMap[q.id] = opt.id;
        }
      });
    } else if (typeof submittedAnswers === 'object' && submittedAnswers !== null) {
      Object.entries(submittedAnswers).forEach(([qId, optId]) => {
        if (typeof optId === 'string') {
          answerMap[qId] = optId;
        }
      });
    }

    // 2. Grade each question
    let correctCount = 0;
    const attemptAnswersData: Array<{
      id: string;
      questionId: string;
      selectedOptionId: string;
      isCorrect: boolean;
      correctOptionId: string;
    }> = [];

    quiz.questions.forEach((q) => {
      const selectedOptionId = answerMap[q.id] || '';
      const correctOption = q.options.find((opt) => opt.isCorrect);
      const matchingSelected = q.options.find((opt) => opt.id === selectedOptionId);
      const isCorrect = !!correctOption && selectedOptionId === correctOption.id;

      if (isCorrect) correctCount++;

      attemptAnswersData.push({
        id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        questionId: q.id,
        // Use empty string for unanswered questions — do NOT fall back to options[0]
        selectedOptionId: matchingSelected ? matchingSelected.id : '',
        isCorrect,
        correctOptionId: correctOption ? correctOption.id : '',
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const PASSING_SCORE = 75;
    const passed = percentage >= PASSING_SCORE;

    const previousAttempts = await learningRepository.getQuizAttemptsCount(userId, quiz.id);
    const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 3. Record attempt in Supabase
    await learningRepository.createQuizAttempt({
      id: attemptId,
      quizId: quiz.id,
      courseId: quiz.courseId,
      moduleId: quiz.moduleId,
      userId,
      enrollmentId: enrollment.id,
      score: percentage,
      totalQuestions,
      correctAnswers: correctCount,
      percentage,
      passed,
      attemptNumber: previousAttempts + 1,
      answers: attemptAnswersData,
    });

    // 4. Update enrollment progress
    const currentPassedQuizzes = new Set<string>(
      Array.isArray(enrollment.completedQuizIds)
        ? (enrollment.completedQuizIds as string[])
        : []
    );
    if (passed) {
      currentPassedQuizzes.add(quiz.id);
    }
    const updatedCompletedQuizIds = Array.from(currentPassedQuizzes);

    const targetCourseIds = Array.from(new Set([quiz.courseId, ...(COURSE_ALIASES[quiz.courseId] || [])]));
    const curriculum = await learningRepository.getCourseCurriculum(targetCourseIds);
    let totalLessons = 0;
    curriculum.forEach((mod) => {
      totalLessons += mod.lessons.length;
    });

    const completedLessonIds = Array.isArray(enrollment.completedLessonIds)
      ? (enrollment.completedLessonIds as string[])
      : [];

    const allLessonsCompleted = totalLessons > 0 ? completedLessonIds.length >= totalLessons : true;
    const progressPercent = allLessonsCompleted
      ? 100
      : totalLessons > 0
      ? Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100))
      : 100;

    const courseCompleted = allLessonsCompleted && passed;
    const newStatus = courseCompleted
      ? 'COMPLETED'
      : progressPercent > 0
      ? 'IN_PROGRESS'
      : enrollment.status;

    // 5. Dual Eligibility Condition for Certificate:
    // 1) All required lessons completed (allLessonsCompleted === true)
    // 2) Assessment score >= 75% (percentage >= PASSING_SCORE && passed === true)
    const certificateEligible = passed && allLessonsCompleted;

    let certificate: any = null;
    if (certificateEligible) {
      for (const cId of targetCourseIds) {
        certificate = await certificateRepository.findByUserAndCourse(userId, cId);
        if (certificate) break;
      }

      if (!certificate) {
        const user = await userRepository.findById(userId);
        const grade =
          percentage >= 90 ? 'Distinction' : percentage >= 75 ? 'First Class' : 'Passed';
        const instTag = (course.category || 'NCCT').replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase() || 'NCT';
        const certId = generateCertId(instTag);
        const certNum = `NCCT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const verificationToken = crypto.randomBytes(24).toString('hex');
        const today = new Date().toISOString().split('T')[0];

        certificate = await certificateRepository.create({
          id: certId,
          certificateNumber: certNum,
          userId,
          userName: user ? user.name : 'Trainee',
          userAadhaarMock: user?.aadhaarMock || undefined,
          courseId: quiz.courseId,
          enrollmentId: enrollment.id,
          courseTitle: course.title,
          courseTitleHi: course.titleHi,
          instituteId: course.instituteId,
          instituteName: 'NCCT National Institute of Cooperative Management',
          issuedDate: today,
          issueDate: today,
          completionDate: today,
          certificateHash: generateCertHash(),
          verificationToken,
          qrCodeData: `/verify/certificate/${verificationToken}`,
          grade,
          status: 'ISSUED',
        });

        // Send Certificate Notification
        await notificationRepository.create({
          id: `notif-cert-${certId}`,
          userId,
          title: 'Assessment Passed & Certificate Issued! 🎓',
          message: `Congratulations! You scored ${percentage}% on "${quiz.title}". Your official NCCT certificate is ready.`,
          timestamp: new Date().toISOString(),
          type: 'certificate',
          linkView: 'certificates',
        }).catch(() => {});
      }
    }

    await learningRepository.updateEnrollment(enrollment.id, {
      completedQuizIds: updatedCompletedQuizIds,
      progressPercent: allLessonsCompleted ? 100 : progressPercent,
      status: newStatus,
      certificateId: certificate?.id || enrollment.certificateId || undefined,
      ...(courseCompleted && !enrollment.completedAt
        ? {
            completedAt: new Date(),
            completionDate: new Date().toISOString().split('T')[0],
          }
        : {}),
    });

    const resultMessage = !passed
      ? 'Assessment Score Below Threshold'
      : !allLessonsCompleted
      ? 'Complete all required lessons to earn your certificate.'
      : 'Congratulations! You Passed the Assessment';

    return {
      passed,
      score: percentage,
      scorePercent: percentage,
      correctAnswers: correctCount,
      totalQuestions,
      passThreshold: quiz.passThreshold || 75,
      totalLessons,
      completedLessonsCount: completedLessonIds.length,
      allLessonsCompleted,
      certificateEligible,
      courseCompleted,
      progressPercent: allLessonsCompleted ? 100 : progressPercent,
      attemptNumber: previousAttempts + 1,
      message: resultMessage,
      certificate: (certificateEligible && certificate)
        ? {
            id: certificate.id,
            certificateNumber: certificate.certificateNumber || certificate.id,
            userId: certificate.userId,
            userName: certificate.userName,
            userAadhaarMock: certificate.userAadhaarMock,
            courseId: certificate.courseId,
            courseTitle: certificate.courseTitle,
            courseTitleHi: certificate.courseTitleHi,
            instituteId: certificate.instituteId,
            instituteName: certificate.instituteName,
            issuedDate: certificate.issuedDate || certificate.issueDate,
            issueDate: certificate.issueDate || certificate.issuedDate,
            completionDate: certificate.completionDate,
            certificateHash: certificate.certificateHash,
            verificationToken: certificate.verificationToken,
            qrCodeData: certificate.qrCodeData,
            qrCodeUrl: certificate.qrCodeData || `/verify/certificate/${certificate.verificationToken}`,
            grade: certificate.grade,
            status: certificate.status,
          }
        : null,
      questionResults: attemptAnswersData.map((a) => ({
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        isCorrect: a.isCorrect,
        correctOptionId: a.correctOptionId,
      })),
    };
  },

  /**
   * Verify certificate by token (Public endpoint)
   */
  verifyCertificate: async (token: string) => {
    let cert = await learningRepository.findCertificateByToken(token);
    if (!cert) {
      // Try by ID as fallback
      cert = await learningRepository.findCertificateById(token);
    }
    if (!cert) throw createError(404, 'Certificate not found or invalid token');

    return {
      valid: cert.status !== 'REVOKED',
      status: cert.status,
      certificateNumber: cert.certificateNumber || cert.id,
      candidateName: cert.userName,
      courseTitle: cert.courseTitle,
      courseTitleHi: cert.courseTitleHi,
      instituteName: cert.instituteName,
      issuedDate: cert.issueDate || cert.issuedDate,
      completionDate: cert.completionDate,
      grade: cert.grade,
      verificationToken: cert.verificationToken,
      qrCodeData: cert.qrCodeData || `/verify/certificate/${cert.verificationToken || cert.id}`,
      certificateHash: cert.certificateHash,
      cooperative: cert.user?.cooperativeAffiliation || 'Indian Cooperative Movement',
      state: 'India',
    };
  },
};
