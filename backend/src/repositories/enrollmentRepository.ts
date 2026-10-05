import prisma from '../config/prisma';

export const enrollmentRepository = {
  findByUser: (userId: string) =>
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lessons: { orderBy: { orderIndex: 'asc' } },
                quizzes: true,
              },
            },
          },
        },
        lessonProgress: true,
        quizAttempts: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

  findByUserAndCourse: (userId: string, courseId: string) =>
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { course: true },
    }),

  create: (data: {
    id: string;
    userId: string;
    courseId: string;
    enrolledDate: string;
    status?: string;
    progressPercent?: number;
    completedLessonIds?: any;
    completedQuizIds?: any;
  }) =>
    prisma.enrollment.create({
      data: {
        id: data.id,
        userId: data.userId,
        courseId: data.courseId,
        enrolledDate: data.enrolledDate,
        status: data.status || 'IN_PROGRESS',
        progressPercent: data.progressPercent || 0,
        completedLessonIds: data.completedLessonIds || [],
        completedQuizIds: data.completedQuizIds || [],
      },
      include: { course: true },
    }),

  update: (id: string, data: Record<string, any>) =>
    prisma.enrollment.update({
      where: { id },
      data,
      include: { course: true },
    }),
};
