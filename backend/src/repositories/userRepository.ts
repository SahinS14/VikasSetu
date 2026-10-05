import prisma from '../config/prisma';

export const userRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } }),

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id } }),

  findByIdentifier: async (identifier: string) => {
    const clean = identifier.trim();
    // 1. Search by email
    let user = await prisma.user.findUnique({
      where: { email: clean.toLowerCase() },
    });
    if (user) return user;

    // 2. Search by employeeId
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: clean },
          { employeeId: clean.toUpperCase() },
        ],
      },
    });
    if (user) return user;

    // 3. Search by id
    user = await prisma.user.findUnique({
      where: { id: clean },
    });
    if (user) return user;

    // 4. Search by trainee registrationId
    const profile = await prisma.traineePublicProfile.findFirst({
      where: { registrationId: clean },
      include: { user: true },
    });
    if (profile?.user) return profile.user;

    return null;
  },

  updateById: (id: string, data: Record<string, any>) =>
    prisma.user.update({ where: { id }, data }),
};
