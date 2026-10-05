import { PrismaClient } from '@prisma/client';

// Singleton Prisma base client (avoids multiple connections in dev hot-reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = `${err.message || ''} ${err.cause?.message || ''} ${err.stack || ''}`;
  return (
    err.code === 'P1001' ||
    err.code === 'P1017' ||
    err.code === '10054' ||
    msg.includes('10054') ||
    msg.includes('ConnectionReset') ||
    msg.includes('Server has closed the connection') ||
    msg.includes('forcibly closed by the remote host') ||
    msg.includes('Connection terminated') ||
    msg.includes('kind: Io') ||
    msg.includes('Broken pipe') ||
    msg.includes('connection closed')
  );
}

// Extended client with automatic reconnection and query retry
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        try {
          return await query(args);
        } catch (err: any) {
          if (isConnectionError(err)) {
            console.warn(
              `[Prisma Auto-Reconnect] Stale connection on ${String(model)}.${String(operation)}. Reconnecting and retrying...`
            );
            try {
              await basePrisma.$disconnect().catch(() => {});
              await new Promise((r) => setTimeout(r, 150));
              await basePrisma.$connect().catch(() => {});
            } catch (reconnErr: any) {
              console.warn('[Prisma Auto-Reconnect] Reconnect attempt warning:', reconnErr.message);
            }
            return await query(args);
          }
          throw err;
        }
      },
    },
  },
});

export default prisma;
