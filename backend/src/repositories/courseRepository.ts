import prisma from '../config/prisma';

export const courseRepository = {
  findAll: () =>
    prisma.course.findMany({
      orderBy: { title: 'asc' },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: { orderBy: { orderIndex: 'asc' } },
            quizzes: true,
          },
        },
      },
    }),

  findById: async (id: string) => {
    const course = await prisma.course.findUnique({ where: { id } });
    if (course) return course;
    const aliasMap: Record<string, string> = {
      'crs-dairy-mgmt-201': 'crs-dairy-101',
      'crs-dairy-101': 'crs-dairy-mgmt-201',
      'crs-pacs-101': 'crs-pacs-erp-101',
      'crs-pacs-erp-101': 'crs-pacs-101',
      'crs-shg-gov-301': 'crs-shg-101',
      'crs-shg-101': 'crs-shg-gov-301',
    };
    const target = aliasMap[id];
    return target ? prisma.course.findUnique({ where: { id: target } }) : null;
  },
};
