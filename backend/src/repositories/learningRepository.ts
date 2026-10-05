import prisma from '../config/prisma';

export const learningRepository = {
  getCourseCurriculum: async (courseIdOrIds: string | string[]) => {
    const ids = Array.isArray(courseIdOrIds) ? courseIdOrIds : [courseIdOrIds];
    return prisma.module.findMany({
      where: { courseId: { in: ids } },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: {
                  orderBy: { optionIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  },

  findEnrollment: async (userId: string, courseId: string) => {
    let enr = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        lessonProgress: true,
        quizAttempts: {
          orderBy: { createdAt: 'desc' },
        },
        course: true,
      },
    });
    return enr;
  },

  createEnrollment: async (data: {
    id: string;
    userId: string;
    courseId: string;
    enrolledDate: string;
    status?: string;
  }) => {
    return prisma.enrollment.create({
      data: {
        id: data.id,
        userId: data.userId,
        courseId: data.courseId,
        enrolledDate: data.enrolledDate,
        status: data.status || 'ENROLLED',
        progressPercent: 0,
        completedLessonIds: [],
        completedQuizIds: [],
      },
      include: {
        course: true,
        lessonProgress: true,
        quizAttempts: true,
      },
    });
  },

  updateEnrollment: async (id: string, data: Record<string, any>) => {
    return prisma.enrollment.update({
      where: { id },
      data,
      include: {
        course: true,
      },
    });
  },

  findLesson: async (lessonId: string) => {
    return prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
        course: true,
      },
    });
  },

  findLessonProgress: async (enrollmentId: string, lessonId: string) => {
    return prisma.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
    });
  },

  findLessonProgressByUser: async (userId: string, lessonId: string) => {
    return prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });
  },

  upsertLessonProgress: async (data: {
    id: string;
    enrollmentId: string;
    courseId: string;
    moduleId: string;
    lessonId: string;
    userId: string;
    status: string;
    progressSeconds?: number;
    progressPercent?: number;
    completed?: boolean;
    completedAt?: Date;
    startedAt?: Date;
    lastWatchedAt?: Date;
  }) => {
    return prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: data.userId,
          lessonId: data.lessonId,
        },
      },
      create: {
        id: data.id,
        enrollmentId: data.enrollmentId,
        courseId: data.courseId,
        moduleId: data.moduleId,
        lessonId: data.lessonId,
        userId: data.userId,
        status: data.status,
        progressSeconds: data.progressSeconds ?? 0,
        progressPercent: data.progressPercent ?? 0,
        completed: data.completed ?? false,
        startedAt: data.startedAt || new Date(),
        completedAt: data.completedAt,
        lastWatchedAt: data.lastWatchedAt || new Date(),
      },
      update: {
        status: data.status,
        ...(data.progressSeconds !== undefined ? { progressSeconds: data.progressSeconds } : {}),
        ...(data.progressPercent !== undefined ? { progressPercent: data.progressPercent } : {}),
        ...(data.completed !== undefined ? { completed: data.completed } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        lastWatchedAt: data.lastWatchedAt || new Date(),
      },
    });
  },

  findQuizById: async (quizId: string) => {
    let q = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: true,
        course: true,
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              orderBy: { optionIndex: 'asc' },
            },
          },
        },
      },
    });

    const aliasMap: Record<string, string> = {
      'quiz-dairy-1': 'quiz-dairy-m1',
      'quiz-pacs-1': 'quiz-pacs-m1',
      'quiz-shg-1': 'quiz-shg-m1',
    };

    const targetAlias = aliasMap[quizId];
    if ((!q || q.questions.length < 5) && targetAlias) {
      const aliasQ = await prisma.quiz.findUnique({
        where: { id: targetAlias },
        include: {
          module: true,
          course: true,
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: {
              options: {
                orderBy: { optionIndex: 'asc' },
              },
            },
          },
        },
      });
      if (aliasQ && (!q || aliasQ.questions.length > q.questions.length)) {
        return aliasQ;
      }
    }
    return q;
  },

  findQuizByModuleId: async (moduleId: string) => {
    const quizzes = await prisma.quiz.findMany({
      where: { moduleId },
      include: {
        module: true,
        course: true,
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              orderBy: { optionIndex: 'asc' },
            },
          },
        },
      },
    });
    if (quizzes.length === 0) return null;
    quizzes.sort((a, b) => b.questions.length - a.questions.length);
    return quizzes[0];
  },

  createQuizAttempt: async (data: {
    id: string;
    quizId: string;
    courseId: string;
    moduleId: string;
    userId: string;
    enrollmentId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
    answers: Array<{
      id: string;
      questionId: string;
      selectedOptionId: string;
      isCorrect: boolean;
    }>;
  }) => {
    return prisma.quizAttempt.create({
      data: {
        id: data.id,
        quizId: data.quizId,
        courseId: data.courseId,
        moduleId: data.moduleId,
        userId: data.userId,
        enrollmentId: data.enrollmentId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        percentage: data.percentage,
        passed: data.passed,
        attemptNumber: data.attemptNumber,
        submittedAt: new Date(),
        answers: {
          create: data.answers.map((a) => ({
            id: a.id,
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            isCorrect: a.isCorrect,
          })),
        },
      },
      include: {
        answers: true,
      },
    });
  },

  getQuizAttemptsCount: async (userId: string, quizId: string) => {
    return prisma.quizAttempt.count({
      where: { userId, quizId },
    });
  },

  findCertificateByToken: async (verificationToken: string) => {
    return prisma.certificate.findUnique({
      where: { verificationToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cooperativeAffiliation: true,
            instituteId: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            titleHi: true,
            durationHours: true,
            category: true,
          },
        },
      },
    });
  },

  findCertificateById: async (id: string) => {
    return prisma.certificate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cooperativeAffiliation: true,
            instituteId: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            titleHi: true,
            durationHours: true,
            category: true,
          },
        },
      },
    });
  },
};
