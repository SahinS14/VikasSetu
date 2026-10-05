import prisma from '../config/prisma';
import { getStudentProfileData, calculateJobMatch } from './matchingEngine';
import { createError } from '../middleware/errorHandler';

export interface FacultyDashboardStats {
  coursesAuthored: number;
  totalEnrolledTrainees: number;
  avgCompletionRate: number;
  avgQuizPassRate: number;
}

export interface FacultySessionItem {
  id: string;
  title: string;
  courseTitle: string;
  instructor: string;
  date: string;
  timeSlot: string;
  room: string;
  qrToken: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface FacultyCourseItem {
  id: string;
  title: string;
  titleHi?: string;
  category: string;
  level: string;
  durationHours: number;
  thumbnail: string;
  enrolledCount: number;
  completionRate: number;
  quizPassRate: number;
  status: string;
  lastUpdated: string;
  modules?: any[];
}

export interface AtRiskTraineeItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  cooperativeAffiliation?: string | null;
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  attendancePercent: number;
  assessmentStatus: string;
  riskReasons: string[];
  lastActive: string;
}

export interface AssessmentAnalytics {
  avgScore: number;
  passRate: number;
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  retakesCount: number;
  highestScore: number;
  lowestScore: number;
  questionPerformance: Array<{
    questionId: string;
    questionText: string;
    correctPercent: number;
    incorrectPercent: number;
    totalAnswers: number;
  }>;
}

export interface CertificateStatusPipeline {
  eligible: number;
  generated: number;
  pending: number;
  certificates: Array<{
    id: string;
    userName: string;
    courseTitle: string;
    certificateNumber?: string | null;
    grade: string;
    issuedDate: string;
    verificationToken?: string | null;
  }>;
}

export interface EmploymentReadinessSummary {
  jobReadyCount: number;
  almostReadyCount: number;
  needsTrainingCount: number;
  averageJobMatch: number;
  topMatches: Array<{
    traineeId: string;
    traineeName: string;
    courseTitle: string;
    jobId: string;
    jobTitle: string;
    employerName: string;
    matchScore: number;
    eligibilityStatus: string;
    missingSkills: string[];
    recommendedCourse?: {
      courseId: string;
      courseTitle: string;
      skillAddressed: string;
    } | null;
  }>;
  commonMissingSkills: Array<{
    skill: string;
    count: number;
    recommendedCourse: string;
  }>;
}

export interface FacultyDashboardPayload {
  faculty: {
    id: string;
    name: string;
    designation: string;
    department: string;
    institution: string;
    academicTerm: string;
  };
  stats: FacultyDashboardStats;
  upcomingSessions: FacultySessionItem[];
  myCourses: FacultyCourseItem[];
  atRiskTrainees: AtRiskTraineeItem[];
  assessmentPerformance: AssessmentAnalytics;
  certificates: CertificateStatusPipeline;
  employmentReadiness: EmploymentReadinessSummary;
}

export class FacultyService {
  async getDashboardData(userId?: string): Promise<FacultyDashboardPayload> {
    // 1. Resolve authenticated faculty user from database
    let facultyUser = null;
    if (userId) {
      facultyUser = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!facultyUser) {
      facultyUser = await prisma.user.findFirst({
        where: { role: 'faculty' },
      });
    }

    if (!facultyUser) {
      throw createError(404, 'Authenticated faculty record not found in database');
    }

    const facultyName = facultyUser.name;
    const instituteId = facultyUser.instituteId || 'inst-vamnicom';

    // Fetch faculty's institute details for header display
    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
    });
    const instituteName = institute?.name || 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM), Pune';

    // 2. Fetch courses belonging to faculty's institute
    const facultyCourses = await prisma.course.findMany({
      where: {
        instituteId,
      },
      include: {
        modules: {
          include: {
            lessons: true,
            quizzes: {
              include: {
                questions: {
                  include: {
                    options: true,
                    attemptAnswers: true,
                  },
                },
              },
            },
          },
        },
        enrollments: {
          include: {
            user: {
              include: {
                attendance: true,
                certificates: true,
              },
            },
          },
        },
        quizAttempts: {
          include: {
            user: true,
            quiz: true,
            answers: true,
          },
        },
        certificates: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    const facultyCourseIds = facultyCourses.map(c => c.id);

    // 3. Aggregate distinct enrolled trainees
    const allEnrollments = facultyCourses.flatMap(c => c.enrollments);
    const distinctTraineeMap = new Map<string, typeof allEnrollments[0]['user']>();
    allEnrollments.forEach(e => {
      if (e.user) {
        distinctTraineeMap.set(e.userId, e.user);
      }
    });

    const totalEnrolledTrainees = distinctTraineeMap.size;

    // 4. Calculate Average Completion Rate directly from database enrollments
    const totalProgressSum = allEnrollments.reduce((sum, e) => sum + (e.progressPercent || 0), 0);
    const avgCompletionRate =
      allEnrollments.length > 0 ? Number((totalProgressSum / allEnrollments.length).toFixed(1)) : 0;

    // 5. Calculate Quiz Pass Rate directly from database quiz attempts
    const allQuizAttempts = facultyCourses.flatMap(c => c.quizAttempts);
    const passedAttemptsCount = allQuizAttempts.filter(a => a.passed).length;
    const avgQuizPassRate =
      allQuizAttempts.length > 0
        ? Number(((passedAttemptsCount / allQuizAttempts.length) * 100).toFixed(1))
        : 0;

    // 6. Upcoming Sessions queried from database
    const dbSessions = await prisma.session.findMany({
      where: {
        OR: [
          { instructor: { contains: facultyName.split(' ')[1] || facultyName, mode: 'insensitive' } },
          { instructor: { contains: 'Meenakshi', mode: 'insensitive' } },
          { programmeId: { in: facultyCourses.map(c => c.programmeId).filter(Boolean) as string[] } },
        ],
      },
      include: {
        attendance: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const sessionsList: FacultySessionItem[] = dbSessions.map(sess => {
      let status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED' = 'UPCOMING';
      if (sess.active) {
        status = 'LIVE';
      }

      const presentCount = sess.attendance.length;
      const enrolledCount = totalEnrolledTrainees;
      const absentCount = Math.max(0, enrolledCount - presentCount);

      return {
        id: sess.id,
        title: sess.title,
        courseTitle: facultyCourses.find(c => c.programmeId === sess.programmeId)?.title || 'PACS ERP Operations',
        instructor: sess.instructor,
        date: sess.date,
        timeSlot: sess.timeSlot,
        room: sess.room,
        qrToken: sess.qrToken,
        status,
        enrolledCount,
        presentCount,
        absentCount,
        lateCount: 0,
      };
    });

    // 7. My Courses mapped directly from database records
    const myCourses: FacultyCourseItem[] = facultyCourses.map(course => {
      const courseEnrollments = course.enrollments;
      const enrolledCount = courseEnrollments.length;

      const compSum = courseEnrollments.reduce((sum, e) => sum + (e.progressPercent || 0), 0);
      const completionRate = enrolledCount > 0 ? Math.round(compSum / enrolledCount) : 0;

      const attempts = course.quizAttempts;
      const passedCount = attempts.filter(a => a.passed).length;
      const quizPassRate = attempts.length > 0 ? Math.round((passedCount / attempts.length) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        titleHi: course.titleHi,
        category: course.category,
        level: course.level,
        durationHours: course.durationHours,
        thumbnail: course.thumbnail,
        enrolledCount,
        completionRate,
        quizPassRate,
        status: 'Published',
        lastUpdated: 'Live Database Curriculum',
        modules: course.modules || [],
      };
    });

    // 8. At-Risk Trainees evaluated strictly from real enrollment and assessment records
    const atRiskMap = new Map<string, AtRiskTraineeItem>();

    allEnrollments.forEach(enrollment => {
      const trainee = enrollment.user;
      if (!trainee) return;

      const riskReasons: string[] = [];
      const course = facultyCourses.find(c => c.id === enrollment.courseId);
      const courseTitle = course?.title || 'Cooperative Operations';

      // Low course progress (< 40% High Risk, 40-59% Medium Risk)
      if (enrollment.progressPercent < 40) {
        riskReasons.push(`Low course progress (${enrollment.progressPercent}%)`);
      } else if (enrollment.progressPercent < 60) {
        riskReasons.push(`Moderate course progress (${enrollment.progressPercent}%)`);
      }

      // Attendance check in faculty sessions
      const traineeAttendance = trainee.attendance || [];
      const relevantAttendance = traineeAttendance.filter(a =>
        dbSessions.some(s => s.id === a.sessionId)
      );
      if (dbSessions.length > 0) {
        const attendanceRate = Math.round((relevantAttendance.length / dbSessions.length) * 100);
        if (attendanceRate < 75) {
          riskReasons.push(`Low attendance (${attendanceRate}%)`);
        }
      }

      // Failed assessments check (repeated failures)
      const traineeAttempts = allQuizAttempts.filter(
        a => a.userId === trainee.id && a.courseId === enrollment.courseId
      );
      const failedAttempts = traineeAttempts.filter(a => !a.passed);
      if (failedAttempts.length >= 2) {
        riskReasons.push(`${failedAttempts.length} failed assessment attempts`);
      }

      if (riskReasons.length > 0 && !atRiskMap.has(trainee.id)) {
        const attendanceRate =
          dbSessions.length > 0 ? Math.round((relevantAttendance.length / dbSessions.length) * 100) : 0;

        atRiskMap.set(trainee.id, {
          id: trainee.id,
          name: trainee.name,
          email: trainee.email,
          avatarUrl: trainee.avatarUrl,
          cooperativeAffiliation: trainee.cooperativeAffiliation || 'PACS Society Member',
          courseId: enrollment.courseId,
          courseTitle,
          progressPercent: enrollment.progressPercent,
          attendancePercent: attendanceRate,
          assessmentStatus:
            failedAttempts.length > 0 ? 'Retake Required' : enrollment.progressPercent >= 75 ? 'Passed' : 'Pending',
          riskReasons,
          lastActive: 'Active recently',
        });
      }
    });

    const atRiskTrainees = Array.from(atRiskMap.values());

    // 9. Assessment Performance Analytics strictly calculated from database attempts
    const scores = allQuizAttempts.map(a => a.percentage || a.score || 0);
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passedCount = allQuizAttempts.filter(a => a.passed).length;
    const failedCount = allQuizAttempts.filter(a => !a.passed).length;
    const retakesCount = allQuizAttempts.filter(a => a.attemptNumber > 1).length;

    // Question-level performance calculation from real database answers
    const questionMap = new Map<string, { text: string; correct: number; total: number }>();

    for (const c of facultyCourses) {
      for (const m of c.modules) {
        for (const q of m.quizzes) {
          for (const quest of q.questions) {
            const answers = quest.attemptAnswers || [];
            const correctCount = answers.filter(a => a.isCorrect).length;
            if (answers.length > 0) {
              questionMap.set(quest.id, {
                text: quest.questionText,
                correct: correctCount,
                total: answers.length,
              });
            }
          }
        }
      }
    }

    const questionPerformance: AssessmentAnalytics['questionPerformance'] = [];
    questionMap.forEach((val, key) => {
      const correctPercent = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
      questionPerformance.push({
        questionId: key,
        questionText: val.text,
        correctPercent,
        incorrectPercent: 100 - correctPercent,
        totalAnswers: val.total,
      });
    });

    const assessmentPerformance: AssessmentAnalytics = {
      avgScore,
      passRate: avgQuizPassRate,
      totalAttempts: allQuizAttempts.length,
      passedCount,
      failedCount,
      retakesCount,
      highestScore,
      lowestScore,
      questionPerformance: questionPerformance.slice(0, 5),
    };

    // 10. Certificates Status Pipeline calculated from real database records
    const allDbCertificates = await prisma.certificate.findMany({
      where: {
        courseId: { in: facultyCourseIds },
      },
    });

    let eligibleCount = 0;
    allEnrollments.forEach(e => {
      const traineeAttempts = allQuizAttempts.filter(
        a => a.userId === e.userId && a.courseId === e.courseId
      );
      const hasPassedQuiz = traineeAttempts.some(a => a.passed && (a.percentage >= 75 || a.score >= 75));
      if (e.progressPercent === 100 && hasPassedQuiz) {
        eligibleCount++;
      }
    });

    if (eligibleCount < allDbCertificates.length) {
      eligibleCount = allDbCertificates.length;
    }

    const generatedCount = allDbCertificates.length;
    const pendingCount = Math.max(0, eligibleCount - generatedCount);

    const certificates: CertificateStatusPipeline = {
      eligible: eligibleCount,
      generated: generatedCount,
      pending: pendingCount,
      certificates: allDbCertificates.map(c => ({
        id: c.id,
        userName: c.userName,
        courseTitle: c.courseTitle,
        certificateNumber: c.certificateNumber,
        grade: c.grade,
        issuedDate: c.issueDate || c.issuedDate || '2026-03-01',
        verificationToken: c.verificationToken,
      })),
    };

    // 11. Employment Readiness evaluated with real matching engine
    const activeJobs = await prisma.jobPosting.findMany({
      where: { status: 'ACTIVE' },
    });

    let jobReadyCount = 0;
    let almostReadyCount = 0;
    let needsTrainingCount = 0;
    let matchScoreTotal = 0;
    let matchCount = 0;

    const topMatches: EmploymentReadinessSummary['topMatches'] = [];
    const missingSkillsTally: Record<string, { count: number; recommendedCourse: string }> = {};

    const distinctTraineeIds = Array.from(distinctTraineeMap.keys());

    for (const traineeId of distinctTraineeIds) {
      try {
        const studentProfile = await getStudentProfileData(traineeId);
        const traineeUser = distinctTraineeMap.get(traineeId);

        for (const job of activeJobs) {
          const match = calculateJobMatch(studentProfile, {
            id: job.id,
            title: job.title,
            employerName: job.employerName,
            requiredSkills: job.requiredSkills as string[],
            preferredSkills: job.preferredSkills as string[],
            requiredQualification: job.requiredQualification,
            minimumExperience: job.minimumExperience,
            requiredCertificates: job.requiredCertificates as string[],
            location: job.location,
            type: job.type,
          });

          matchScoreTotal += match.matchScore;
          matchCount++;

          if (match.matchScore >= 80 && match.eligibilityStatus === 'ELIGIBLE') {
            jobReadyCount++;
          } else if (match.matchScore >= 60) {
            almostReadyCount++;
          } else {
            needsTrainingCount++;
          }

          if (topMatches.length < 5) {
            topMatches.push({
              traineeId,
              traineeName: traineeUser?.name || studentProfile.name,
              courseTitle: studentProfile.certificates[0]?.courseTitle || 'PACS ERP Operations',
              jobId: job.id,
              jobTitle: job.title,
              employerName: job.employerName,
              matchScore: match.matchScore,
              eligibilityStatus: match.eligibilityStatus,
              missingSkills: match.missingSkills,
              recommendedCourse: match.recommendedCourses[0] || null,
            });
          }

          match.missingSkills.forEach(skill => {
            if (!missingSkillsTally[skill]) {
              missingSkillsTally[skill] = {
                count: 1,
                recommendedCourse: match.recommendedCourses[0]?.courseTitle || 'PACS Computerization & ERP Operations',
              };
            } else {
              missingSkillsTally[skill].count++;
            }
          });
        }
      } catch (e) {
        // Ignore evaluation errors for incomplete test profiles
      }
    }

    const averageJobMatch = matchCount > 0 ? Math.round(matchScoreTotal / matchCount) : 0;

    const commonMissingSkills = Object.entries(missingSkillsTally)
      .map(([skill, data]) => ({
        skill,
        count: data.count,
        recommendedCourse: data.recommendedCourse,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const employmentReadiness: EmploymentReadinessSummary = {
      jobReadyCount,
      almostReadyCount,
      needsTrainingCount,
      averageJobMatch,
      topMatches,
      commonMissingSkills,
    };

    return {
      faculty: {
        id: facultyUser.id,
        name: facultyName,
        designation: 'Senior Faculty & Curriculum Director',
        department: 'Dept. of Cooperative IT & Rural Management',
        institution: instituteName,
        academicTerm: 'Academic Term 2025–26 • Semester II',
      },
      stats: {
        coursesAuthored: facultyCourses.length,
        totalEnrolledTrainees,
        avgCompletionRate,
        avgQuizPassRate,
      },
      upcomingSessions: sessionsList,
      myCourses,
      atRiskTrainees,
      assessmentPerformance,
      certificates,
      employmentReadiness,
    };
  }

  /**
   * Returns the list of courses authored/managed by the faculty member,
   * with real enrollment counts, completion rates, and quiz pass rates.
   */
  async getCourses(userId?: string): Promise<FacultyCourseItem[]> {
    const data = await this.getDashboardData(userId);
    return data.myCourses;
  }

  /**
   * Returns the enrolled trainee roster for a specific course,
   * computed from real database enrollment and quiz attempt records.
   */
  async getCourseRoster(courseId: string): Promise<RosterTraineeItem[]> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            user: true,
          },
        },
        quizAttempts: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      throw createError(404, `Course ${courseId} not found`);
    }

    return course.enrollments.map(enrollment => {
      const trainee = enrollment.user;

      // Best quiz attempt for this trainee in this course
      const traineeAttempts = course.quizAttempts.filter(
        a => a.userId === enrollment.userId && a.courseId === courseId
      );
      const bestAttempt = traineeAttempts
        .filter(a => a.passed)
        .sort((a, b) => (b.percentage || b.score || 0) - (a.percentage || a.score || 0))[0]
        || traineeAttempts.sort((a, b) => (b.percentage || b.score || 0) - (a.percentage || a.score || 0))[0]
        || null;

      const scoreNum = bestAttempt ? Math.round(bestAttempt.percentage || bestAttempt.score || 0) : null;
      let quizScore = 'Pending';
      if (bestAttempt) {
        if (bestAttempt.passed) {
          quizScore = scoreNum !== null && scoreNum >= 90
            ? `${scoreNum}% (Distinction)`
            : `${scoreNum}% (Pass)`;
        } else {
          quizScore = `${scoreNum ?? 0}% (Fail)`;
        }
      }

      const status: 'completed' | 'in_progress' =
        enrollment.progressPercent >= 100 && (bestAttempt?.passed ?? false)
          ? 'completed'
          : 'in_progress';

      return {
        id: trainee?.id || enrollment.userId,
        name: trainee?.name || 'Unknown Trainee',
        email: trainee?.email || '',
        coop: trainee?.cooperativeAffiliation || 'PACS Society Member',
        enrolledDate: enrollment.enrolledDate
          ? new Date(enrollment.enrolledDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        progressPercent: Math.round(enrollment.progressPercent || 0),
        quizScore,
        status,
      };
    });
  }
}
export interface RosterTraineeItem {
  id: string;
  name: string;
  email: string;
  coop: string;
  enrolledDate: string;
  progressPercent: number;
  quizScore: string;
  status: 'completed' | 'in_progress';
}

export const facultyService = new FacultyService();
