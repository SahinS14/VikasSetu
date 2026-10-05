import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import enrollmentRoutes from './routes/enrollments';
import quizRoutes from './routes/quizzes';
import attendanceRoutes from './routes/attendance';
import certificateRoutes from './routes/certificates';
import jobRoutes from './routes/jobs';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import chatRoutes from './routes/chat';
import learningRoutes from './routes/learning';
import skillCardRoutes from './routes/skillCard';
import traineeRoutes from './routes/trainee';
import facultyRoutes from './routes/faculty';
import curriculumRoutes from './routes/curriculum';
import instituteRoutes from './routes/institute';
import nationalRoutes from './routes/national';
import employerRoutes from './routes/employer';
import deviceRoutes from './routes/device';
import hostelRoutes from './routes/hostel';
import programmeRoutes from './routes/programme';
import vaultRoutes from './routes/vault';
import { learningController } from './controllers/learningController';
import { attendanceService } from './services/attendanceService';
import { requireAuth } from './middleware/auth';

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
//
// RFC-1918 private address ranges allowed for local development:
//   10.0.0.0/8        → 10.x.x.x
//   172.16.0.0/12     → 172.16.x.x – 172.31.x.x   ← includes 172.28.x.x
//   192.168.0.0/16    → 192.168.x.x
//
// For production: set FRONTEND_URL or CORS_ORIGIN in the environment.
// Never use origin: '*' — credentials (JWT cookies) require a specific origin.

const allowedOriginsEnv = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'https://vikassetu-self.vercel.app',
].filter(Boolean) as string[];

/** Returns true if the origin is from a private RFC-1918 LAN address. */
function isPrivateLanOrigin(origin: string): boolean {
  // Match http(s)://<host>:<port> — only http on LAN, https on Vercel
  const match = origin.match(/^https?:\/\/([^/:]+)(:\d+)?/);
  if (!match) return false;
  const host = match[1];

  // IPv4 private ranges — using simple prefix checks (no regex edge-case risk)
  if (host === 'localhost' || host === '127.0.0.1') return true;

  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;

  // 172.16.0.0/12  →  172.(16–31).x.x
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // No-origin requests: curl, Postman, server-to-server — always allow
    if (!origin) return callback(null, true);

    // Explicitly listed production origins
    if (allowedOriginsEnv.includes(origin)) return callback(null, true);

    // Any *.vercel.app preview / production deploy
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // All RFC-1918 LAN origins (covers 10.x, 172.16-31.x, 192.168.x on any port)
    if (isPrivateLanOrigin(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked: Origin "${origin}" is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VikasSetu API', ts: new Date().toISOString() });
});

/**
 * Diagnostic health check verifying Node.js Express -> Python Face Service connectivity.
 * Safe endpoint: does not leak internal secrets or URLs to client.
 */
app.get('/api/health/face', async (_req, res) => {
  const result = await attendanceService.checkFaceHealth();
  const httpStatus = result.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(result);
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/learning', learningRoutes);
app.post('/api/lessons/:lessonId/progress', requireAuth, learningController.saveProgress);
app.get('/api/lessons/:lessonId/progress', requireAuth, learningController.getProgress);
app.use('/api/trainee', traineeRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api', curriculumRoutes);
app.use('/api', skillCardRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/national', nationalRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/vault', vaultRoutes);
app.get('/api/institutes', async (_req, res, next) => {
  try {
    const { instituteService } = await import('./services/instituteService');
    res.json(await instituteService.getInstitutes());
  } catch (err) {
    next(err);
  }
});

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export { app };

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Vercel imports the Express app as a serverless function. Starting a listener
// there causes the invocation to fail; a listener is only needed for local and
// container-based hosting.
if (process.env.VERCEL !== '1' && (require.main === module || process.env.NODE_ENV !== 'test')) {
  app.listen(PORT, HOST, () => {
    console.log(`\n🌿 VikasSetu API running → http://${HOST}:${PORT}\n`);
  });
}

export default app;
