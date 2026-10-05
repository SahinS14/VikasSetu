import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export const traineeService = {
  getDashboard: async (userId: string) => {
    // 1. Fetch authenticated user with publicProfile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { publicProfile: true },
    });
    if (!user) throw createError(404, 'User not found');

    // Resolve Institute name if user belongs to an institute
    let instituteName = 'NCCT National Institute of Cooperative Management';
    if (user.instituteId) {
      const inst = await prisma.institute.findUnique({ where: { id: user.instituteId } });
      if (inst) instituteName = inst.name;
    }

    const profile = {
      name: user.name,
      registrationId:
        user.publicProfile?.registrationId ||
        user.employeeId ||
        `NCCT-TRN-2026-${user.id.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase()}`,
      role: (user.role || 'trainee').toUpperCase(),
      institute: instituteName,
      affiliation: user.cooperativeAffiliation || 'Primary Agricultural Credit Society (PACS) Member',
      eKycStatus: user.eKycStatus || (user.isKycVerified ? 'VERIFIED' : 'NOT_VERIFIED'),
    };

    // 2. Fetch authenticated user's real enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: true,
        lessonProgress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const coursesEnrolled = enrollments.length;
    const coursesCompleted = enrollments.filter(
      (e) => e.status.toUpperCase() === 'COMPLETED' || e.progressPercent >= 100
    ).length;

    // Build enrolled course items with strictly clamped 0-100% progress
    const enrolledCourses = enrollments.map((e) => {
      const clampedProgress = Math.min(100, Math.max(0, e.progressPercent || 0));
      const completedLessonCount = Array.isArray(e.completedLessonIds)
        ? (e.completedLessonIds as string[]).length
        : 0;

      let totalLessonsCount = 0;
      if (Array.isArray(e.course.modulesJson)) {
        (e.course.modulesJson as any[]).forEach((m) => {
          if (Array.isArray(m.lessons)) totalLessonsCount += m.lessons.length;
        });
      }
      if (totalLessonsCount === 0) {
        totalLessonsCount = Math.max(completedLessonCount, 2);
      }

      const isCompleted = e.status.toUpperCase() === 'COMPLETED' || clampedProgress >= 100;

      return {
        id: e.course.id,
        courseId: e.course.id,
        title: e.course.title,
        titleHi: e.course.titleHi,
        titleMr: e.course.titleMr,
        thumbnail: e.course.thumbnail,
        durationHours: e.course.durationHours,
        category: e.course.category,
        level: e.course.level,
        status: isCompleted ? 'COMPLETED' : (clampedProgress > 0 ? 'IN_PROGRESS' : 'ENROLLED'),
        progressPercent: isCompleted ? 100 : clampedProgress,
        completedLessonsCount: completedLessonCount,
        totalLessonsCount,
        enrolledDate: e.enrolledDate,
        completionDate: e.completionDate,
      };
    });

    const totalProgressSum = enrolledCourses.reduce((acc, c) => acc + c.progressPercent, 0);
    const averageProgress = coursesEnrolled > 0 ? Math.round(totalProgressSum / coursesEnrolled) : 0;

    // 3. Certificates belonging to authenticated user
    const certificates = await prisma.certificate.findMany({
      where: {
        userId,
        status: { in: ['ISSUED', 'VALID'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    const certificatesEarned = certificates.length;

    // 4. Real Quiz attempts from QuizAttempt table
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const attempted = quizAttempts.length;
    const passed = quizAttempts.filter((q) => q.passed).length;
    const failed = attempted - passed;
    const totalQuizScore = quizAttempts.reduce((acc, q) => acc + (q.score || q.percentage || 0), 0);
    const averageQuizScore = attempted > 0 ? Math.round(totalQuizScore / attempted) : 0;

    // 5. Real Attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { userId },
    });
    const attendedSessions = attendanceRecords.length;
    const totalSessions = await prisma.session.count();
    const hasAttendanceRecords = attendedSessions > 0;
    const attendancePercentage =
      hasAttendanceRecords && totalSessions > 0
        ? Math.min(100, Math.round((attendedSessions / totalSessions) * 100))
        : null;

    // 6. Active Class Session (Strictly personalized: only show if trainee is enrolled in relevant programme/batch/course)
    const approvedApplications = await prisma.programmeApplication.findMany({
      where: {
        userId,
        status: { in: ['APPROVED', 'ENROLLED', 'ACCEPTED', 'BATCH_ASSIGNED'] },
      },
    });

    const userBatchIds = approvedApplications.map((a) => a.batchId).filter(Boolean) as string[];
    const userProgrammeIds = approvedApplications.map((a) => a.programmeId).filter(Boolean) as string[];
    const enrolledCourseIds = enrollments.map((e) => e.courseId).filter(Boolean) as string[];

    let activeDbSession = null;
    const hasEnrollmentAccess = userBatchIds.length > 0 || userProgrammeIds.length > 0 || enrolledCourseIds.length > 0;

    if (hasEnrollmentAccess) {
      const orConditions: any[] = [];
      if (userBatchIds.length > 0) orConditions.push({ batchId: { in: userBatchIds } });
      if (userProgrammeIds.length > 0) orConditions.push({ programmeId: { in: userProgrammeIds } });
      if (enrolledCourseIds.length > 0) orConditions.push({ courseId: { in: enrolledCourseIds } });

      activeDbSession = await prisma.session.findFirst({
        where: {
          active: true,
          OR: orConditions,
        },
      });
    }

    let activeSession = null;
    if (activeDbSession) {
      const hasCheckedIn = attendanceRecords.some((a) => a.sessionId === activeDbSession.id);
      activeSession = {
        id: activeDbSession.id,
        title: activeDbSession.title,
        instructor: activeDbSession.instructor,
        date: activeDbSession.date,
        timeSlot: activeDbSession.timeSlot,
        room: activeDbSession.room,
        active: activeDbSession.active,
        userCheckedIn: hasCheckedIn,
      };
    }

    // 7. Learning Activity Timeline (strictly real events, never fabricated)
    const learningActivity: Array<{
      id: string;
      date: string;
      title: string;
      type: 'lesson' | 'quiz' | 'certificate';
      score?: number;
      progress?: number;
    }> = [];

    // Real lesson progress
    const lessonProgressRecords = await prisma.lessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { lesson: true },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });
    lessonProgressRecords.forEach((lp) => {
      if (lp.completedAt) {
        learningActivity.push({
          id: lp.id,
          date: lp.completedAt.toISOString().split('T')[0],
          title: `Completed lesson: ${lp.lesson?.title || 'Course Lesson'}`,
          type: 'lesson',
        });
      }
    });

    // Real quiz attempts
    quizAttempts.slice(0, 10).forEach((qa) => {
      const ts = qa.submittedAt || qa.createdAt;
      learningActivity.push({
        id: qa.id,
        date: ts.toISOString().split('T')[0],
        title: `Assessment: ${qa.passed ? 'Passed' : 'Completed'} with ${qa.score}%`,
        type: 'quiz',
        score: qa.score,
      });
    });

    // Real certificates
    certificates.forEach((c) => {
      learningActivity.push({
        id: c.id,
        date: c.issuedDate || c.issueDate || c.createdAt.toISOString().split('T')[0],
        title: `Official Credential Earned: ${c.courseTitle}`,
        type: 'certificate',
      });
    });

    learningActivity.sort((a, b) => b.date.localeCompare(a.date));

    return {
      profile,
      stats: {
        coursesEnrolled,
        coursesCompleted,
        averageProgress,
        certificatesEarned,
        averageQuizScore: attempted > 0 ? averageQuizScore : 0,
        attendancePercentage: attendancePercentage !== null ? attendancePercentage : null,
      },
      courses: enrolledCourses,
      quizPerformance: {
        attempted,
        passed,
        failed,
        averageScore: averageQuizScore,
      },
      attendance: {
        attended: attendedSessions,
        total: totalSessions,
        percentage: attendancePercentage,
        hasRecords: hasAttendanceRecords,
      },
      activeSession,
      learningActivity: learningActivity.slice(0, 10),
    };
  },
};
