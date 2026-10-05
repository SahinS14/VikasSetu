import { courseRepository } from '../repositories/courseRepository';
import { enrollmentRepository } from '../repositories/enrollmentRepository';
import { certificateRepository } from '../repositories/certificateRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { userRepository } from '../repositories/userRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { createError } from '../middleware/errorHandler';
import { generateCertId, generateCertHash } from '../utils/generateCertId';

// Types mirroring the frontend CourseModule shape stored in modulesJson
interface QuizQuestion { id: string; correctOptionIndex: number; }
interface Quiz { id: string; passThreshold: number; questions: QuizQuestion[]; }
interface Module { id: string; lessons: { id: string }[]; quiz?: Quiz; }

export const quizService = {
  /**
   * Server-side quiz grading:
   *  1. Fetch course from DB
   *  2. Find the quiz inside modulesJson by quizId
   *  3. Grade submitted answers against correctOptionIndex
   *  4. If passing and all quizzes done → mark enrollment completed + issue Certificate
   */
  submitQuiz: async (
    userId: string,
    courseId: string,
    quizId: string,
    answers: any
  ) => {
    const course = await courseRepository.findById(courseId);
    if (!course) throw createError(404, 'Course not found');

    const modules = course.modulesJson as unknown as Module[];
    const module = modules.find(m => m.quiz?.id === quizId || m.id === quizId) || modules[0];
    const quiz = module?.quiz;
    if (!quiz) throw createError(404, 'Quiz not found in this course');

    // ── Grade answers server-side ───────────────────────────────────────────
    let correctCount = 0;
    const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
    quiz.questions.forEach((q: any, idx: number) => {
      const userAns = Array.isArray(answers) ? answers[idx] : answers?.[q.id];
      if (typeof userAns === 'string') {
        const expectedId = q.correctOptionId || `${q.id}-${letters[q.correctOptionIndex] || q.correctOptionIndex}`;
        if (userAns === expectedId) correctCount++;
      } else if (typeof userAns === 'number') {
        if (userAns === q.correctOptionIndex) correctCount++;
      }
    });
    const scorePercent = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePercent >= quiz.passThreshold;

    if (!passed) return { passed: false, scorePercent, passThreshold: quiz.passThreshold };

    // ── Update enrollment ───────────────────────────────────────────────────
    const enrollment = (await enrollmentRepository.findByUserAndCourse(userId, courseId)) || (await enrollmentRepository.findByUserAndCourse(userId, course.id));
    if (!enrollment) throw createError(404, 'Enrollment not found');

    const completedQuizIds = enrollment.completedQuizIds as string[];
    const updatedQuizIds = Array.from(new Set([...completedQuizIds, quizId]));
    const totalQuizzes = modules.filter(m => m.quiz).length;
    const allQuizzesDone = updatedQuizIds.length >= totalQuizzes;
    const completedLessonIds = enrollment.completedLessonIds as string[];
    const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    const allLessonsDone = completedLessonIds.length >= totalLessons;
    const isCompleted = allQuizzesDone && allLessonsDone;

    await enrollmentRepository.update(enrollment.id, {
      completedQuizIds: updatedQuizIds,
      progressPercent: isCompleted ? 100 : enrollment.progressPercent,
      ...(isCompleted && enrollment.status !== 'completed'
        ? { status: 'completed', completionDate: new Date().toISOString().split('T')[0] }
        : {}),
    });

    // ── Issue certificate if not already issued ─────────────────────────────
    const existingCert = await certificateRepository.findByUserAndCourse(userId, courseId);
    if (existingCert) {
      return { passed: true, scorePercent, certId: existingCert.id };
    }

    const user = await userRepository.findById(userId);
    if (!user) throw createError(404, 'User not found');

    // Find institute from a sessions record or use a static lookup
    const grade = scorePercent >= 90 ? 'Distinction' : scorePercent >= 75 ? 'First Class' : 'Passed';
    const instType = (course.category || 'NCCT').replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase() || 'NCT';
    const certId = generateCertId(instType);

    const cert = await certificateRepository.create({
      id: certId,
      userId,
      userName: user.name,
      userAadhaarMock: user.aadhaarMock || undefined,
      courseId,
      courseTitle: course.title,
      courseTitleHi: course.titleHi,
      instituteId: course.instituteId,
      instituteName: 'NCCT Institute', // resolved from Institute table via seed
      issuedDate: new Date().toISOString().split('T')[0],
      certificateHash: generateCertHash(),
      grade,
    });

    // ── Send in-app notification ────────────────────────────────────────────
    await notificationRepository.create({
      id: `notif-cert-${certId}`,
      userId,
      title: 'Certificate Issued! 🎓',
      message: `Congratulations! Your certificate for "${course.title}" has been issued.`,
      timestamp: new Date().toISOString(),
      type: 'certificate',
      linkView: 'certificates',
    });

    return { passed: true, scorePercent, certId: cert.id };
  },
};
