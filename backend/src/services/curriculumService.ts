import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

// Helper to convert frontend-style quiz to Prisma records and back
function formatQuizToFrontend(quiz: any) {
  if (!quiz) return undefined;
  return {
    id: quiz.id,
    moduleId: quiz.moduleId,
    title: quiz.title,
    titleHi: quiz.titleHi || quiz.title,
    titleMr: quiz.titleMr || quiz.title,
    passThreshold: quiz.passThreshold ?? 75,
    questions: (quiz.questions || []).map((q: any) => {
      const optionsEn: string[] = [];
      const optionsHi: string[] = [];
      const optionsMr: string[] = [];
      let correctIdx = 0;

      const sortedOptions = [...(q.options || [])].sort((a, b) => (a.optionIndex ?? 0) - (b.optionIndex ?? 0));
      sortedOptions.forEach((opt: any, idx: number) => {
        optionsEn.push(opt.optionText || '');
        optionsHi.push(opt.optionTextHi || opt.optionText || '');
        optionsMr.push(opt.optionTextMr || opt.optionText || '');
        if (opt.isCorrect) correctIdx = idx;
      });

      return {
        id: q.id,
        question: q.questionText,
        questionHi: q.questionTextHi || q.questionText,
        questionMr: q.questionTextMr || q.questionText,
        options: {
          en: optionsEn,
          hi: optionsHi,
          mr: optionsMr,
        },
        correctOptionIndex: correctIdx,
        explanation: {
          en: q.explanationEn || '',
          hi: q.explanationHi || q.explanationEn || '',
          mr: q.explanationMr || q.explanationEn || '',
        },
      };
    }),
  };
}

function formatLessonToFrontend(l: any) {
  const contentEn = (l.contentEn as any) || {};
  const contentHi = (l.contentHi as any) || {};
  const contentMr = (l.contentMr as any) || {};

  return {
    id: l.id,
    moduleId: l.moduleId,
    order: l.orderIndex,
    title: l.title,
    titleHi: l.titleHi || l.title,
    titleMr: l.titleMr || l.title,
    durationMinutes: l.durationMinutes || 15,
    contentType: (l.contentType || 'TEXT').toLowerCase(),
    status: l.isPublished ? 'Published' : 'Draft',
    videoUrl: l.videoUrl || contentEn.videoUrl || '',
    documentName: contentEn.documentName || '',
    documentUrl: contentEn.documentUrl || l.attachmentUrl || '',
    presentationName: contentEn.presentationName || '',
    presentationUrl: contentEn.presentationUrl || l.resourceUrl || '',
    externalUrl: contentEn.externalUrl || l.resourceUrl || '',
    attachments: contentEn.attachments || (l.attachmentUrl ? [{ id: 'att-1', name: 'Resource Attachment', url: l.attachmentUrl, type: 'pdf' }] : []),
    contentByLanguage: {
      en: {
        text: contentEn.text || l.description || '',
        overview: contentEn.overview || l.description || '',
        richContent: contentEn.richContent || contentEn.text || l.description || '',
        learningObjectives: contentEn.learningObjectives || [],
        keyTakeaways: contentEn.keyTakeaways || [],
        videoUrl: l.videoUrl || contentEn.videoUrl || '',
        transcript: contentEn.transcript || '',
      },
      hi: {
        text: contentHi.text || l.descriptionHi || '',
        overview: contentHi.overview || l.descriptionHi || '',
        richContent: contentHi.richContent || contentHi.text || l.descriptionHi || '',
        learningObjectives: contentHi.learningObjectives || [],
        keyTakeaways: contentHi.keyTakeaways || [],
        videoUrl: contentHi.videoUrl || l.videoUrl || '',
        transcript: contentHi.transcript || '',
      },
      mr: {
        text: contentMr.text || l.descriptionMr || '',
        overview: contentMr.overview || l.descriptionMr || '',
        richContent: contentMr.richContent || contentMr.text || l.descriptionMr || '',
        learningObjectives: contentMr.learningObjectives || [],
        keyTakeaways: contentMr.keyTakeaways || [],
        videoUrl: contentMr.videoUrl || l.videoUrl || '',
        transcript: contentMr.transcript || '',
      },
    },
  };
}

export class CurriculumService {
  /**
   * Verify course exists and authenticated user has authorization to modify it.
   */
  async verifyCourseOwnership(courseId: string, user: { userId: string; role: string; instituteId?: string | null }) {
    let course = await prisma.course.findUnique({ where: { id: courseId } });

    // Handle course aliases if needed
    if (!course) {
      const aliasMap: Record<string, string> = {
        'crs-dairy-mgmt-201': 'crs-dairy-101',
        'crs-dairy-101': 'crs-dairy-mgmt-201',
        'crs-pacs-101': 'crs-pacs-erp-101',
        'crs-pacs-erp-101': 'crs-pacs-101',
        'crs-shg-gov-301': 'crs-shg-101',
        'crs-shg-101': 'crs-shg-gov-301',
      };
      const targetId = aliasMap[courseId];
      if (targetId) {
        course = await prisma.course.findUnique({ where: { id: targetId } });
      }
    }

    if (!course) {
      throw createError(404, `Course with ID '${courseId}' not found.`);
    }

    // Admins have unrestricted access
    if (user.role === 'super_admin') return course;

    // Faculty or Institute Admins: check institute match
    if (user.role === 'faculty' || user.role === 'institute_admin') {
      if (user.instituteId && course.instituteId && user.instituteId !== course.instituteId) {
        throw createError(403, `Access denied: Course belongs to ${course.instituteId}, but faculty belongs to ${user.instituteId}.`);
      }
      return course;
    }

    throw createError(403, 'Unauthorized: Faculty or Admin role required.');
  }

  /**
   * Synchronize modulesJson snapshot on Course whenever curriculum changes.
   */
  async syncCourseModulesJson(courseId: string) {
    try {
      const fullCurriculum = await this.getCourseCurriculum(courseId);
      await prisma.course.update({
        where: { id: courseId },
        data: {
          modulesJson: fullCurriculum.modules as any,
        },
      });
    } catch (e) {
      console.error(`Warning: Failed to sync modulesJson for course ${courseId}:`, e);
    }
  }

  /**
   * Get full course details + normalized modules, lessons, and quizzes formatted for CourseBuilder.
   */
  async getCourseCurriculum(courseId: string) {
    let course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
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
        },
      },
    });

    if (!course) {
      const aliasMap: Record<string, string> = {
        'crs-dairy-mgmt-201': 'crs-dairy-101',
        'crs-dairy-101': 'crs-dairy-mgmt-201',
        'crs-pacs-101': 'crs-pacs-erp-101',
        'crs-pacs-erp-101': 'crs-pacs-101',
        'crs-shg-gov-301': 'crs-shg-101',
        'crs-shg-101': 'crs-shg-gov-301',
      };
      const targetId = aliasMap[courseId];
      if (targetId) {
        course = await prisma.course.findUnique({
          where: { id: targetId },
          include: {
            modules: {
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
            },
          },
        });
      }
    }

    if (!course) {
      throw createError(404, `Course with ID '${courseId}' not found.`);
    }

    // If normalized modules exist, map them to frontend structure
    if (course.modules && course.modules.length > 0) {
      const formattedModules = course.modules.map(m => {
        const quiz = m.quizzes && m.quizzes.length > 0 ? formatQuizToFrontend(m.quizzes[0]) : undefined;
        return {
          id: m.id,
          courseId: m.courseId,
          order: m.orderIndex,
          title: m.title,
          titleHi: m.titleHi || m.title,
          titleMr: m.titleMr || m.title,
          description: m.description || '',
          descriptionHi: m.descriptionHi || '',
          descriptionMr: m.descriptionMr || '',
          lessons: (m.lessons || []).map(formatLessonToFrontend),
          quiz,
        };
      });

      return {
        ...course,
        modules: formattedModules,
      };
    }

    // Fallback to modulesJson if normalized tables are empty
    return {
      ...course,
      modules: ((course as any).modulesJson as any[]) || [],
    };
  }

  /**
   * Create a new Module in database.
   */
  async createModule(courseId: string, data: any, user: any) {
    const course = await this.verifyCourseOwnership(courseId, user);

    // Calculate next orderIndex
    const lastModule = await prisma.module.findFirst({
      where: { courseId: course.id },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = data.order || (lastModule ? lastModule.orderIndex + 1 : 1);
    const moduleId = data.id && !data.id.startsWith('mod-') ? data.id : `mod-${Date.now()}`;

    const newModule = await prisma.module.create({
      data: {
        id: moduleId,
        courseId: course.id,
        orderIndex,
        title: data.title || `Module ${orderIndex}: New Curriculum Module`,
        titleHi: data.titleHi || data.title || `मॉड्यूल ${orderIndex}: नवीन अभ्यासक्रम विभाग`,
        titleMr: data.titleMr || data.title || `विभाग ${orderIndex}: नवीन अभ्यासक्रम घटक`,
        description: data.description || null,
        descriptionHi: data.descriptionHi || null,
        descriptionMr: data.descriptionMr || null,
      },
    });

    await this.syncCourseModulesJson(course.id);

    return {
      id: newModule.id,
      courseId: newModule.courseId,
      order: newModule.orderIndex,
      title: newModule.title,
      titleHi: newModule.titleHi || newModule.title,
      titleMr: newModule.titleMr || newModule.title,
      description: newModule.description || '',
      descriptionHi: newModule.descriptionHi || '',
      descriptionMr: newModule.descriptionMr || '',
      lessons: [],
    };
  }

  /**
   * Update an existing Module in database.
   */
  async updateModule(moduleId: string, data: any, user: any) {
    const existing = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!existing) {
      throw createError(404, `Module '${moduleId}' not found.`);
    }

    await this.verifyCourseOwnership(existing.courseId, user);

    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        titleHi: data.titleHi !== undefined ? data.titleHi : existing.titleHi,
        titleMr: data.titleMr !== undefined ? data.titleMr : existing.titleMr,
        description: data.description !== undefined ? data.description : existing.description,
        descriptionHi: data.descriptionHi !== undefined ? data.descriptionHi : existing.descriptionHi,
        descriptionMr: data.descriptionMr !== undefined ? data.descriptionMr : existing.descriptionMr,
        orderIndex: data.order !== undefined ? data.order : existing.orderIndex,
      },
    });

    await this.syncCourseModulesJson(existing.courseId);

    return {
      id: updated.id,
      courseId: updated.courseId,
      order: updated.orderIndex,
      title: updated.title,
      titleHi: updated.titleHi || updated.title,
      titleMr: updated.titleMr || updated.title,
      description: updated.description || '',
      descriptionHi: updated.descriptionHi || '',
      descriptionMr: updated.descriptionMr || '',
    };
  }

  /**
   * Delete a Module and all its children (lessons, quizzes) in database.
   */
  async deleteModule(moduleId: string, user: any) {
    const existing = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!existing) {
      throw createError(404, `Module '${moduleId}' not found.`);
    }

    await this.verifyCourseOwnership(existing.courseId, user);

    // Delete module (Prisma handles cascading lessons & quizzes via onDelete: Cascade)
    await prisma.module.delete({
      where: { id: moduleId },
    });

    // Re-index remaining modules for this course
    const remaining = await prisma.module.findMany({
      where: { courseId: existing.courseId },
      orderBy: { orderIndex: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i + 1) {
        await prisma.module.update({
          where: { id: remaining[i].id },
          data: { orderIndex: i + 1 },
        });
      }
    }

    await this.syncCourseModulesJson(existing.courseId);

    return { success: true, deletedModuleId: moduleId };
  }

  /**
   * Reorder Modules in database.
   */
  async reorderModules(courseId: string, orderedModuleIds: string[], user: any) {
    const course = await this.verifyCourseOwnership(courseId, user);

    await prisma.$transaction(
      orderedModuleIds.map((id, index) =>
        prisma.module.update({
          where: { id },
          data: { orderIndex: index + 1 },
        })
      )
    );

    await this.syncCourseModulesJson(course.id);

    return { success: true };
  }

  /**
   * Create a new Lesson in database.
   */
  async createLesson(moduleId: string, data: any, user: any) {
    const moduleItem = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!moduleItem) {
      throw createError(404, `Module '${moduleId}' not found.`);
    }

    await this.verifyCourseOwnership(moduleItem.courseId, user);

    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = data.order || (lastLesson ? lastLesson.orderIndex + 1 : 1);
    const lessonId = data.id && !data.id.startsWith('les-') ? data.id : `les-${Date.now()}`;

    // Extract multilingual contents
    const contentEn = data.contentByLanguage?.en || data.contentEn || {
      text: data.description || '',
      overview: data.description || '',
      richContent: data.richContent || '',
      learningObjectives: data.learningObjectives || [],
      keyTakeaways: data.keyTakeaways || [],
      videoUrl: data.videoUrl || '',
      transcript: data.transcript || '',
      documentName: data.documentName || '',
      documentUrl: data.documentUrl || '',
      presentationName: data.presentationName || '',
      presentationUrl: data.presentationUrl || '',
      externalUrl: data.externalUrl || '',
      attachments: data.attachments || [],
    };

    const contentHi = data.contentByLanguage?.hi || data.contentHi || {
      text: data.descriptionHi || '',
      overview: data.descriptionHi || '',
      richContent: data.richContentHi || '',
      learningObjectives: [],
      keyTakeaways: [],
    };

    const contentMr = data.contentByLanguage?.mr || data.contentMr || {
      text: data.descriptionMr || '',
      overview: data.descriptionMr || '',
      richContent: data.richContentMr || '',
      learningObjectives: [],
      keyTakeaways: [],
    };

    let resolvedVideoUrl: string | null = null;
    if (typeof data.videoUrl === 'string') {
      const trimmed = data.videoUrl.trim();
      resolvedVideoUrl = trimmed.length > 0 ? trimmed : null;
    } else if (typeof data.contentByLanguage?.en?.videoUrl === 'string') {
      const trimmed = data.contentByLanguage.en.videoUrl.trim();
      resolvedVideoUrl = trimmed.length > 0 ? trimmed : null;
    }

    contentEn.videoUrl = resolvedVideoUrl || '';

    const created = await prisma.lesson.create({
      data: {
        id: lessonId,
        courseId: moduleItem.courseId,
        moduleId,
        orderIndex,
        title: data.title || `Lesson ${orderIndex}`,
        titleHi: data.titleHi || data.title || '',
        titleMr: data.titleMr || data.title || '',
        description: contentEn.overview || contentEn.text || data.description || null,
        descriptionHi: contentHi.overview || contentHi.text || data.descriptionHi || null,
        descriptionMr: contentMr.overview || contentMr.text || data.descriptionMr || null,
        contentType: (data.contentType || 'TEXT').toUpperCase(),
        durationMinutes: Number(data.durationMinutes) || 15,
        contentEn: contentEn as any,
        contentHi: contentHi as any,
        contentMr: contentMr as any,
        videoUrl: resolvedVideoUrl,
        videoProvider: resolvedVideoUrl
          ? (resolvedVideoUrl.includes('vimeo') ? 'vimeo' : resolvedVideoUrl.includes('.mp4') ? 'mp4' : 'youtube')
          : null,
        attachmentUrl: data.documentUrl || (data.attachments && data.attachments[0]?.url) || null,
        resourceUrl: data.presentationUrl || data.externalUrl || null,
        isPublished: true,
      },
    });

    await this.syncCourseModulesJson(moduleItem.courseId);

    return formatLessonToFrontend(created);
  }

  /**
   * Get a single Lesson by ID from database.
   */
  async getLesson(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw createError(404, `Lesson '${lessonId}' not found.`);
    }

    return formatLessonToFrontend(lesson);
  }

  /**
   * Update an existing Lesson in database.
   */
  async updateLesson(lessonId: string, data: any, user: any) {
    const existing = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!existing) {
      throw createError(404, `Lesson '${lessonId}' not found.`);
    }

    await this.verifyCourseOwnership(existing.courseId, user);

    const existingContentEn = (existing.contentEn as any) || {};
    const existingContentHi = (existing.contentHi as any) || {};
    const existingContentMr = (existing.contentMr as any) || {};

    // Distinguish between:
    // - undefined: field omitted, keep existing
    // - null or empty/whitespace string: user intentionally cleared the URL -> set NULL
    // - string: user set a new URL -> trim and persist string
    let resolvedVideoUrl: string | null | undefined = undefined;

    if (data.videoUrl !== undefined) {
      if (typeof data.videoUrl === 'string') {
        const trimmed = data.videoUrl.trim();
        resolvedVideoUrl = trimmed.length > 0 ? trimmed : null;
      } else if (data.videoUrl === null) {
        resolvedVideoUrl = null;
      }
    } else if (data.contentByLanguage?.en?.videoUrl !== undefined) {
      const v = data.contentByLanguage.en.videoUrl;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        resolvedVideoUrl = trimmed.length > 0 ? trimmed : null;
      } else if (v === null) {
        resolvedVideoUrl = null;
      }
    }

    const finalVideoUrl = resolvedVideoUrl !== undefined ? resolvedVideoUrl : existing.videoUrl;

    const contentEn = data.contentByLanguage?.en || {
      ...existingContentEn,
      text: data.text || existingContentEn.text || '',
      overview: data.overview || existingContentEn.overview || '',
      richContent: data.richContent || existingContentEn.richContent || '',
      learningObjectives: data.learningObjectives || existingContentEn.learningObjectives || [],
      keyTakeaways: data.keyTakeaways || existingContentEn.keyTakeaways || [],
      transcript: data.transcript !== undefined ? data.transcript : (existingContentEn.transcript || ''),
      documentName: data.documentName ?? existingContentEn.documentName,
      documentUrl: data.documentUrl ?? existingContentEn.documentUrl,
      presentationName: data.presentationName ?? existingContentEn.presentationName,
      presentationUrl: data.presentationUrl ?? existingContentEn.presentationUrl,
      externalUrl: data.externalUrl ?? existingContentEn.externalUrl,
      attachments: data.attachments ?? existingContentEn.attachments,
    };

    // Keep videoUrl and transcript synced in contentEn JSON
    contentEn.videoUrl = finalVideoUrl || '';
    if (data.transcript !== undefined) {
      contentEn.transcript = data.transcript;
    } else if (data.contentByLanguage?.en?.transcript !== undefined) {
      contentEn.transcript = data.contentByLanguage.en.transcript;
    }

    const contentHi = data.contentByLanguage?.hi || {
      ...existingContentHi,
      ...(data.contentHi || {}),
    };

    const contentMr = data.contentByLanguage?.mr || {
      ...existingContentMr,
      ...(data.contentMr || {}),
    };

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        titleHi: data.titleHi !== undefined ? data.titleHi : existing.titleHi,
        titleMr: data.titleMr !== undefined ? data.titleMr : existing.titleMr,
        description: contentEn.overview || contentEn.text || (data.description !== undefined ? data.description : existing.description),
        contentType: data.contentType ? data.contentType.toUpperCase() : existing.contentType,
        durationMinutes: data.durationMinutes !== undefined ? Number(data.durationMinutes) : existing.durationMinutes,
        contentEn: contentEn as any,
        contentHi: contentHi as any,
        contentMr: contentMr as any,
        videoUrl: finalVideoUrl,
        videoProvider: finalVideoUrl
          ? (finalVideoUrl.includes('vimeo') ? 'vimeo' : finalVideoUrl.includes('.mp4') ? 'mp4' : 'youtube')
          : (existing.videoProvider || 'youtube'),
        attachmentUrl: data.documentUrl !== undefined ? data.documentUrl : existing.attachmentUrl,
        resourceUrl: data.presentationUrl !== undefined ? data.presentationUrl : (data.externalUrl !== undefined ? data.externalUrl : existing.resourceUrl),
        orderIndex: data.order !== undefined ? data.order : existing.orderIndex,
      },
    });

    await this.syncCourseModulesJson(existing.courseId);

    return formatLessonToFrontend(updated);
  }

  /**
   * Delete a Lesson in database.
   */
  async deleteLesson(lessonId: string, user: any) {
    const existing = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!existing) {
      throw createError(404, `Lesson '${lessonId}' not found.`);
    }

    await this.verifyCourseOwnership(existing.courseId, user);

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // Re-index remaining lessons in this module
    const remaining = await prisma.lesson.findMany({
      where: { moduleId: existing.moduleId },
      orderBy: { orderIndex: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i + 1) {
        await prisma.lesson.update({
          where: { id: remaining[i].id },
          data: { orderIndex: i + 1 },
        });
      }
    }

    await this.syncCourseModulesJson(existing.courseId);

    return { success: true, deletedLessonId: lessonId };
  }

  /**
   * Reorder Lessons in database.
   */
  async reorderLessons(moduleId: string, orderedLessonIds: string[], user: any) {
    const moduleItem = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!moduleItem) {
      throw createError(404, `Module '${moduleId}' not found.`);
    }

    await this.verifyCourseOwnership(moduleItem.courseId, user);

    await prisma.$transaction(
      orderedLessonIds.map((id, index) =>
        prisma.lesson.update({
          where: { id },
          data: { orderIndex: index + 1 },
        })
      )
    );

    await this.syncCourseModulesJson(moduleItem.courseId);

    return { success: true };
  }

  /**
   * Save (create or replace) an Assessment/Quiz with questions and options in database.
   */
  async saveQuiz(moduleId: string, quizData: any, user: any) {
    const moduleItem = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!moduleItem) {
      throw createError(404, `Module '${moduleId}' not found.`);
    }

    await this.verifyCourseOwnership(moduleItem.courseId, user);

    const quizId = quizData.id && !quizData.id.startsWith('quiz-temp-') ? quizData.id : `quiz-${Date.now()}`;

    // 1. Upsert Quiz
    const quiz = await prisma.quiz.upsert({
      where: { id: quizId },
      update: {
        title: quizData.title || `${moduleItem.title} Assessment`,
        titleHi: quizData.titleHi || quizData.title || `${moduleItem.titleHi || moduleItem.title} मूल्यांकन`,
        titleMr: quizData.titleMr || quizData.title || `${moduleItem.titleMr || moduleItem.title} चाचणी`,
        passThreshold: Number(quizData.passThreshold) || 75,
        isPublished: true,
      },
      create: {
        id: quizId,
        courseId: moduleItem.courseId,
        moduleId: moduleItem.id,
        title: quizData.title || `${moduleItem.title} Assessment`,
        titleHi: quizData.titleHi || quizData.title || `${moduleItem.titleHi || moduleItem.title} मूल्यांकन`,
        titleMr: quizData.titleMr || quizData.title || `${moduleItem.titleMr || moduleItem.title} चाचणी`,
        passThreshold: Number(quizData.passThreshold) || 75,
        isPublished: true,
      },
    });

    // 2. Clear old questions to atomically sync questions and options
    const oldQuestions = await prisma.quizQuestion.findMany({
      where: { quizId: quiz.id },
      select: { id: true },
    });
    if (oldQuestions.length > 0) {
      await prisma.quizOption.deleteMany({
        where: { questionId: { in: oldQuestions.map(q => q.id) } },
      });
      await prisma.quizQuestion.deleteMany({
        where: { quizId: quiz.id },
      });
    }

    // 3. Insert questions and options
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const questions = quizData.questions || [];

    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const q = questions[qIdx];
      const qId = q.id && !q.id.startsWith('q-temp-') ? q.id : `qq-${quiz.id}-${qIdx + 1}`;

      await prisma.quizQuestion.create({
        data: {
          id: qId,
          quizId: quiz.id,
          orderIndex: qIdx + 1,
          questionText: q.question || `Question ${qIdx + 1}`,
          questionTextHi: q.questionHi || q.question || '',
          questionTextMr: q.questionMr || q.question || '',
          explanationEn: q.explanation?.en || null,
          explanationHi: q.explanation?.hi || null,
          explanationMr: q.explanation?.mr || null,
        },
      });

      // Options
      const enOpts: string[] = q.options?.en || [];
      const hiOpts: string[] = q.options?.hi || [];
      const mrOpts: string[] = q.options?.mr || [];
      const optCount = Math.max(enOpts.length, hiOpts.length, mrOpts.length, 4);

      for (let oIdx = 0; oIdx < optCount; oIdx++) {
        const optId = `opt-${qId}-${letters[oIdx] || oIdx}`;
        const isCorrect = oIdx === q.correctOptionIndex;

        await prisma.quizOption.create({
          data: {
            id: optId,
            questionId: qId,
            optionIndex: oIdx,
            optionText: enOpts[oIdx] || `Option ${letters[oIdx]?.toUpperCase() || oIdx + 1}`,
            optionTextHi: hiOpts[oIdx] || enOpts[oIdx] || null,
            optionTextMr: mrOpts[oIdx] || enOpts[oIdx] || null,
            isCorrect,
          },
        });
      }
    }

    await this.syncCourseModulesJson(moduleItem.courseId);

    // Fetch and return formatted quiz
    const fullQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
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
    });

    return formatQuizToFrontend(fullQuiz);
  }

  /**
   * Delete an Assessment/Quiz in database.
   */
  async deleteQuiz(quizId: string, user: any) {
    const existing = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!existing) {
      throw createError(404, `Quiz '${quizId}' not found.`);
    }

    await this.verifyCourseOwnership(existing.courseId, user);

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    await this.syncCourseModulesJson(existing.courseId);

    return { success: true, deletedQuizId: quizId };
  }

  /**
   * Create a new Course record in PostgreSQL with initial module and lesson.
   */
  async createCourse(courseData: any, user: any) {
    if (user.role !== 'faculty' && user.role !== 'institute_admin' && user.role !== 'super_admin') {
      throw createError(403, 'Unauthorized to create courses.');
    }

    const courseId = courseData.id && !courseData.id.startsWith('crs-temp-')
      ? courseData.id
      : `crs-${Date.now()}`;

    const instituteId = courseData.instituteId || user.instituteId || 'inst-vamnicom';

    const course = await prisma.course.create({
      data: {
        id: courseId,
        title: courseData.title || 'New Curriculum Course',
        titleHi: courseData.titleHi || courseData.title || 'नवीन अभ्यासक्रम',
        titleMr: courseData.titleMr || courseData.title || 'नवीन अभ्यासक्रम',
        description: courseData.description || 'Comprehensive cooperative course curriculum.',
        descriptionHi: courseData.descriptionHi || courseData.description || '',
        descriptionMr: courseData.descriptionMr || courseData.description || '',
        thumbnail: courseData.thumbnail || 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80',
        instituteId,
        durationHours: Number(courseData.durationHours) || 36,
        level: courseData.level || 'Intermediate',
        category: courseData.category || 'PACS Digitalization',
        modulesJson: [],
      },
    });

    // Create initial module if provided
    const initialModData = courseData.modules && courseData.modules.length > 0 ? courseData.modules[0] : null;
    const modId = `mod-${courseId}-1`;

    await prisma.module.create({
      data: {
        id: modId,
        courseId: course.id,
        orderIndex: 1,
        title: initialModData?.title || 'Module 1: National PACS Architecture & Navigation',
        titleHi: initialModData?.titleHi || 'मॉड्यूल 1: राष्ट्रीय पैक्स ई-आरपी संरचना एवं नेविगेशन',
        titleMr: initialModData?.titleMr || 'विभाग १: राष्ट्रीय पॅक्स ई-आरपी रचना आणि वापर',
      },
    });

    // Create initial lesson
    await prisma.lesson.create({
      data: {
        id: `les-${courseId}-1-1`,
        courseId: course.id,
        moduleId: modId,
        orderIndex: 1,
        title: '1.1 Overview of Cooperative Digitalization Mandate',
        titleHi: '1.1 सहकारिता मंत्रालय का पैक्स डिजिटलीकरण विजन',
        titleMr: '1.1 सहकार मंत्रालयाचे पॅक्स संगणकीकरण धोरण',
        contentType: 'TEXT',
        durationMinutes: 25,
        contentEn: {
          text: 'Comprehensive module on bylaws, voting rights, and audit trails in cooperative societies.',
          keyTakeaways: ['Democracy in cooperative decision making', 'Audit compliance with NABARD'],
        },
        contentHi: {
          text: 'सहकारी समितियों में उप-नियम, मताधिकार एवं ऑडिट ट्रेल पर व्यापक अध्ययन।',
          keyTakeaways: ['निर्णय लेने में लोकतांत्रिक प्रक्रिया', 'नाबार्ड के साथ ऑडिट अनुपालन'],
        },
        contentMr: {
          text: 'सहकारी संस्थांचे पोटनियम, मतदान हक्क आणि ऑडिट नियमावली.',
          keyTakeaways: ['निर्णय प्रक्रियेत लोकशाही पद्धती', 'नाबार्डचे ऑडिट नियम'],
        },
      },
    });

    await this.syncCourseModulesJson(course.id);

    return this.getCourseCurriculum(course.id);
  }

  /**
   * Update Course details (title, description, metadata) in PostgreSQL.
   */
  async updateCourse(courseId: string, courseData: any, user: any) {
    const course = await this.verifyCourseOwnership(courseId, user);

    const updated = await prisma.course.update({
      where: { id: course.id },
      data: {
        title: courseData.title !== undefined ? courseData.title : course.title,
        titleHi: courseData.titleHi !== undefined ? courseData.titleHi : course.titleHi,
        titleMr: courseData.titleMr !== undefined ? courseData.titleMr : course.titleMr,
        description: courseData.description !== undefined ? courseData.description : course.description,
        descriptionHi: courseData.descriptionHi !== undefined ? courseData.descriptionHi : course.descriptionHi,
        descriptionMr: courseData.descriptionMr !== undefined ? courseData.descriptionMr : course.descriptionMr,
        category: courseData.category !== undefined ? courseData.category : course.category,
        durationHours: courseData.durationHours !== undefined ? Number(courseData.durationHours) : course.durationHours,
        level: courseData.level !== undefined ? courseData.level : course.level,
        thumbnail: courseData.thumbnail !== undefined ? courseData.thumbnail : course.thumbnail,
      },
    });

    await this.syncCourseModulesJson(course.id);

    return this.getCourseCurriculum(updated.id);
  }
}

export const curriculumService = new CurriculumService();
