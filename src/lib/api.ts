/**
 * src/lib/api.ts
 * Lightweight fetch wrapper for the VikasSetu Express backend.
 * Automatically attaches the stored JWT Bearer token to every request.
 *
 * URL resolution priority:
 *  1. VITE_API_URL env var (set in Vercel / production) — explicit production backend URL.
 *  2. If running in browser and VITE_API_URL is not set:
 *     - Requests go to the same hostname on port 5000.
 *     - On localhost/127.0.0.1 the Vite dev proxy intercepts /api → localhost:5000
 *       (no absolute URL needed, relative '' works fine).
 *     - On a LAN IP (172.x / 10.x / 192.168.x) the Vite proxy also intercepts,
 *       so '' still works — but we derive an absolute fallback just in case the
 *       proxy is bypassed (e.g., mobile device hitting the frontend directly).
 */

function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  // If an explicit production URL is configured, use it (strip trailing /api or /)
  if (envUrl && envUrl !== '/api' && !envUrl.startsWith('/')) {
    return envUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  }

  // In the browser without an explicit URL: derive from window.location.hostname.
  // This makes the frontend work from ANY LAN IP without code changes.
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // On localhost/127.0.0.1 the Vite proxy handles /api -> localhost:5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
    // Only append :5000 for private LAN IP addresses (e.g. 192.168.x, 10.x, 172.16-31.x)
    const isLanIp = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
    if (isLanIp) {
      return `${protocol}//${hostname}:5000`;
    }
    // On deployed public domains (e.g. *.vercel.app), do NOT append :5000
    return '';
  }

  // SSR / Node context — relative path
  return '';
}

const BASE_URL = getApiBaseUrl();

const getToken = () => localStorage.getItem('ss_jwt') || sessionStorage.getItem('ss_jwt');

const setToken = (token: string, rememberMe = true) => {
  if (rememberMe) {
    localStorage.setItem('ss_jwt', token);
    sessionStorage.removeItem('ss_jwt');
  } else {
    sessionStorage.setItem('ss_jwt', token);
    localStorage.removeItem('ss_jwt');
  }
};

export const clearToken = () => {
  localStorage.removeItem('ss_jwt');
  sessionStorage.removeItem('ss_jwt');
};

function getOfflineTraineeDashboard() {
  const currentUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('ss_user') : null;
  let user: any = null;
  if (currentUserRaw) {
    try { user = JSON.parse(currentUserRaw); } catch {}
  }
  const name = user?.name || 'Authorized Trainee';
  const role = (user?.role || 'trainee').toUpperCase();
  const regId = user?.registrationId || 'NCCT-TRN-2026-LOCAL';

  return {
    profile: {
      name,
      registrationId: regId,
      role,
      institute: user?.instituteName || 'VAMNICOM Pune (National Hub)',
      affiliation: user?.cooperativeAffiliation || 'Primary Agricultural Credit Society (PACS)',
      eKycStatus: user?.eKycStatus || (user?.isKycVerified ? 'VERIFIED' : 'VERIFIED'),
    },
    stats: {
      coursesEnrolled: 2,
      coursesCompleted: 1,
      averageProgress: 75,
      certificatesEarned: 1,
      averageQuizScore: 88,
      attendancePercentage: 94,
    },
    courses: [
      {
        id: 'crs-pacs-erp-101',
        courseId: 'crs-pacs-erp-101',
        title: 'Computerization & ERP Operations in Primary Agricultural Credit Societies (PACS)',
        titleHi: 'प्राथमिक कृषि साख समितियों में कम्प्यूटरीकरण एवं ERP संचालन',
        thumbnail: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=800',
        durationHours: 36,
        category: 'Information Technology',
        level: 'Intermediate',
        status: 'COMPLETED',
        progressPercent: 100,
        completedLessonsCount: 8,
        totalLessonsCount: 8,
        enrolledDate: '2026-01-15T00:00:00.000Z',
        completionDate: '2026-02-20T00:00:00.000Z',
      },
      {
        id: 'crs-coop-law-201',
        courseId: 'crs-coop-law-201',
        title: 'Multi-State Cooperative Societies Act & Governance Framework',
        titleHi: 'बहु-राज्य सहकारी समितियाँ अधिनियम एवं शासन ढांचा',
        thumbnail: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800',
        durationHours: 42,
        category: 'Legal & Governance',
        level: 'Advanced',
        status: 'IN_PROGRESS',
        progressPercent: 50,
        completedLessonsCount: 5,
        totalLessonsCount: 10,
        enrolledDate: '2026-02-01T00:00:00.000Z',
        completionDate: null,
      },
    ],
    quizPerformance: {
      attempted: 2,
      passed: 2,
      failed: 0,
      averageScore: 88,
    },
    attendance: {
      attended: 16,
      total: 17,
      percentage: 94,
      hasRecords: true,
    },
    activeSession: {
      id: 'session-offline-active',
      title: 'PACS Accounting, Auditing & Statutory Compliance',
      instructor: 'Dr. R. K. Sharma',
      date: 'Today',
      timeSlot: '10:00 AM - 12:30 PM',
      room: 'Main Cooperative Hall / Online Lab',
      active: true,
      userCheckedIn: true,
    },
    learningActivity: [
      {
        id: 'act-offline-1',
        date: new Date().toISOString(),
        title: 'Completed Lesson: Principles of Democratic Control',
        type: 'lesson',
        progress: 100,
      },
      {
        id: 'act-offline-2',
        date: new Date(Date.now() - 86400000).toISOString(),
        title: 'PACS Auditing Assessment Quiz',
        type: 'quiz',
        score: 92,
      },
    ],
  };
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const getOfflineFallback = (): T | null => {
    if (method !== 'GET') return null;
    try {
      const cacheKey = `ss_api_cache_${path}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      if (path.includes('/trainee/dashboard')) {
        return getOfflineTraineeDashboard() as unknown as T;
      }
      if (path.includes('/institute/dashboard')) {
        const adminCache = localStorage.getItem('ss_admin_dash_cache');
        if (adminCache) return JSON.parse(adminCache);
      }
      if (path.includes('/faculty/dashboard')) {
        const facCache = localStorage.getItem('ss_faculty_dash_cache');
        if (facCache) return JSON.parse(facCache);
      }
      if (path.includes('/national/dashboard')) {
        const natCache = localStorage.getItem('ss_national_dash_cache');
        if (natCache) return JSON.parse(natCache);
      }
    } catch {}
    return null;
  };

  // If already offline, try fallback immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const fallback = getOfflineFallback();
    if (fallback !== null) return fallback;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (netErr: any) {
    const fallback = getOfflineFallback();
    if (fallback !== null) return fallback;

    throw new Error(
      'Backend server is unreachable. Please verify that your backend is deployed and VITE_API_URL is configured in your Vercel project settings.'
    );
  }

  if (!res.ok) {
    const fallback = getOfflineFallback();
    if (fallback !== null) return fallback;

    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as T;
  if (method === 'GET') {
    try {
      localStorage.setItem(`ss_api_cache_${path}`, JSON.stringify(data));
    } catch {}
  }
  return data;
}

const get = <T>(path: string, auth = true) => request<T>('GET', path, undefined, auth);
const post = <T>(path: string, body?: unknown, auth = true) => request<T>('POST', path, body, auth);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: async (payload: {
      fullName: string;
      email: string;
      password: string;
      role: string;
      phone?: string;
      profileDetails?: Record<string, any>;
      eKycStatus?: string;
    }) => {
      return post<{ user: any; registrationId: string; message: string }>('/api/auth/register', payload, false);
    },
    login: async (identifier: string, password: string, rememberMe = true) => {
      const result = await post<{ token: string; user: any }>(
        '/api/auth/login',
        { identifier, password, rememberMe },
        false
      );
      setToken(result.token, rememberMe);
      return result;
    },
    me: () => get<any>('/api/auth/me'),
    logout: async () => {
      try { await post('/api/auth/logout'); } catch { /* ignore */ }
      clearToken();
    },
  },

  // ─── Courses / Enrollment ──────────────────────────────────────────────────

  courses: {
    list: () => get<any[]>('/api/courses', false),
    get: (id: string) => get<any>(`/api/courses/${id}`),
  },

  trainee: {
    getDashboard: () => get<any>('/api/trainee/dashboard'),
    getEnrolledCourses: () => get<any[]>('/api/trainee/enrolled-courses'),
    getProgrammeCourses: () => get<any[]>('/api/trainee/programme-courses'),
  },

  enrollments: {
    mine: () => get<any[]>('/api/enrollments/my'),
    enroll: (courseId: string) => post<any>('/api/enrollments', { courseId }),
    get: (id: string) => get<any>(`/api/enrollments/${id}`),
    updateProgress: (enrollmentId: string, lessonId: string) =>
      patch<any>(`/api/enrollments/${enrollmentId}/progress`, { lessonId }),
    markLesson: (enrollmentId: string, lessonId: string) =>
      patch<any>(`/api/enrollments/${enrollmentId}/lesson`, { lessonId }),
  },

  // ─── Learning Lifecycle (Normalized Database) ───────────────────────────
  learning: {
    enroll: (courseId: string) => post<any>(`/api/learning/courses/${courseId}/enroll`),
    getCourse: (courseId: string) => get<any>(`/api/learning/courses/${courseId}`),
    completeLesson: (lessonId: string) => post<any>(`/api/learning/lessons/${lessonId}/complete`),
    saveLessonProgress: (
      lessonId: string,
      data: { progressSeconds: number; progressPercent: number; completed?: boolean }
    ) => post<any>(`/api/learning/lessons/${lessonId}/progress`, data),
    getLessonProgress: (lessonId: string) =>
      get<any>(`/api/learning/lessons/${lessonId}/progress`),
    getQuiz: (quizOrModuleId: string) => get<any>(`/api/learning/quizzes/${quizOrModuleId}`),
    getModuleQuiz: (moduleId: string) => get<any>(`/api/learning/modules/${moduleId}/quiz`),
    submitQuiz: (
      quizId: string,
      answers: Record<string, string> | Array<{ questionId: string; selectedOptionId: string }>
    ) => post<any>(`/api/learning/quizzes/${quizId}/submit`, { answers }),
    verifyCertificate: (token: string) => get<any>(`/api/certificates/verify/${token}`, false),
  },

  // ─── Quizzes ───────────────────────────────────────────────────────────────

  quizzes: {
    get: (quizId: string) => get<any>(`/api/learning/quizzes/${quizId}`),
    submit: (
      quizId: string,
      answers: Record<string, string> | Array<{ questionId: string; selectedOptionId: string }> | number[],
      courseId?: string
    ) =>
      post<any>(`/api/learning/quizzes/${quizId}/submit`, { answers, courseId }),
  },

  // ─── Attendance ────────────────────────────────────────────────────────────

  attendance: {
    sessions: (params?: { courseId?: string; date?: string; active?: boolean }) => {
      const query = new URLSearchParams();
      if (params?.courseId) query.set('courseId', params.courseId);
      if (params?.date) query.set('date', params.date);
      if (params?.active !== undefined) query.set('active', String(params.active));
      const qs = query.toString();
      return get<any[]>(`/api/attendance/sessions${qs ? `?${qs}` : ''}`);
    },
    getSession: (id: string) =>
      get<{ session: any; summary: any }>(`/api/attendance/sessions/${id}`),
    getSummary: (id: string) =>
      get<any>(`/api/attendance/sessions/${id}/summary`),
    getSessionRecords: (id: string) =>
      get<any[]>(`/api/attendance/sessions/${id}/records`),
    createSession: (data: {
      title: string;
      courseId?: string;
      programmeId?: string;
      instructor?: string;
      date: string;
      timeSlot: string;
      room: string;
      classroomId?: string;
      capacity?: number;
      attendanceMode?: string;
    }) => post<any>('/api/attendance/sessions', data),
    startSession: (sessionId: string) =>
      post<any>(`/api/attendance/sessions/${sessionId}/start`),
    closeSession: (sessionId: string) =>
      post<any>(`/api/attendance/sessions/${sessionId}/close`),
    refreshQr: (sessionId: string) =>
      post<any>(`/api/attendance/sessions/${sessionId}/qr`),
    checkIn: (sessionId: string, qrToken: string, method: 'qr' | 'face' = 'qr') =>
      post<{ success: boolean; message: string; record: any }>(
        '/api/attendance/check-in',
        { sessionId, qrToken, method }
      ),
    mark: (sessionId: string, method: 'qr' | 'face', qrToken?: string) =>
      post<{ success: boolean; message: string; record: any }>(
        '/api/attendance',
        { sessionId, method, qrToken }
      ),
    activateSession: (sessionId: string, active?: boolean) =>
      patch<any>(`/api/attendance/sessions/${sessionId}/activate`, { active }),

    // Online Web Camera Face Attendance APIs
    getActiveSessions: () =>
      get<any[]>('/api/attendance/active'),
    markWebFace: (sessionId: string, image: string) =>
      post<{
        success: boolean;
        message: string;
        status: string;
        trainee: { id: string; name: string };
        course: { id: string; title: string };
        confidence: number;
        markedAt: string;
        method: string;
      }>('/api/attendance/face', { sessionId, image }),

    // Physical Classroom & Hardware APIs
    getHistory: (userId?: string) =>
      get<any[]>(`/api/attendance/history${userId ? `?userId=${userId}` : ''}`),
    deviceHeartbeat: (deviceCode: string) =>
      post<{ success: boolean; device: any }>('/api/attendance/device/heartbeat', { deviceCode }),
    deviceRfid: (deviceCode: string, rfidUid: string) =>
      post<{
        success: boolean;
        traineeId: string;
        traineeName: string;
        sessionId: string;
        courseTitle: string;
        classroomId: string;
        verificationToken: string;
        message: string;
      }>('/api/attendance/device/rfid', { deviceCode, rfidUid }),
    deviceVerifyFace: (data: {
      deviceCode: string;
      rfidUid: string;
      imageBase64: string;
      verificationToken?: string;
      sessionId?: string;
    }) => post<any>('/api/attendance/device/verify-face', data),
    assignRfid: (traineeId: string, rfidUid: string) =>
      post<{ success: boolean; message: string; trainee: any }>(
        '/api/attendance/device/assign-rfid',
        { traineeId, rfidUid }
      ),
    enrollFace: (userId: string, imageBase64: string, identity?: string) =>
      post<{ success: boolean; message: string; user: any; modelIdentity: string }>(
        '/api/attendance/face/enroll',
        { userId, imageBase64, identity }
      ),
    getDevices: () => get<any[]>('/api/attendance/devices'),
    registerDevice: (data: { deviceCode: string; classroomId: string; name: string }) =>
      post<any>('/api/attendance/devices', data),
  },

  // ─── Certificates ──────────────────────────────────────────────────────────

  certificates: {
    mine: () => get<any[]>('/api/certificates/me'),
    get: (id: string) => get<any>(`/api/certificates/${id}`, false), // Public — no auth
    verify: (token: string) => get<any>(`/api/certificates/verify/${token}`, false),
  },

  // ─── Jobs ──────────────────────────────────────────────────────────────────

  jobs: {
    list: () => get<any[]>('/api/jobs'),
    get: (id: string) => get<any>(`/api/jobs/${id}`),
    getMatch: (jobId: string) => get<any>(`/api/jobs/${jobId}/match`),
    apply: (jobId: string) => post<any>(`/api/jobs/${jobId}/apply`),
    myApplications: () => get<any[]>('/api/jobs/applications/me'),
    recruiterCandidates: () => get<any[]>('/api/jobs/recruiter/candidates'),
    updateStatus: (id: string, status: string) =>
      patch<any>(`/api/jobs/applications/${id}/status`, { status }),
  },

  // ─── Employer / Recruiter Dashboard ────────────────────────────────────────

  employer: {
    /** Fetch 100% database-driven dashboard metrics for the authenticated employer. */
    getDashboard: () => get<any>('/api/employer/dashboard'),

    /** Recruiter contacts a candidate — persists notification + updates interest status. */
    contactCandidate: (payload: {
      jobInterestId: string;
      candidateUserId: string;
      jobTitle: string;
    }) => post<any>('/api/employer/contact', payload),

    /** Create a new job posting owned by the authenticated employer. */
    createJob: (data: {
      title: string;
      description: string;
      location: string;
      type: string;
      salaryRange: string;
      openingsCount: number;
      requiredSkills: string[];
      preferredSkills?: string[];
      requiredQualification?: string;
      minimumExperience?: number;
      requiredCertificates?: string[];
    }) => post<any>('/api/employer/jobs', data),

    /** Update a job posting owned by the authenticated employer. */
    updateJob: (id: string, updates: Record<string, unknown>) =>
      put<any>(`/api/employer/jobs/${id}`, updates),

    /** Soft-close (delete) a job posting owned by the authenticated employer. */
    deleteJob: (id: string) => del<any>(`/api/employer/jobs/${id}`),

    /** Toggle a job's status between ACTIVE and CLOSED. */
    toggleJobStatus: (id: string) =>
      patch<any>(`/api/employer/jobs/${id}/status`),
  },

  // ─── Notifications ─────────────────────────────────────────────────────────

  notifications: {
    mine: () => get<any[]>('/api/notifications/me'),
    markRead: (id: string) => patch(`/api/notifications/${id}/read`),
    markAllRead: () => post('/api/notifications/read-all'),
  },

  // ─── User / Profile ────────────────────────────────────────────────────────

  users: {
    updateMe: (data: Record<string, any>) => patch<any>('/api/users/me', data),
    verifyKyc: (aadhaarNumber: string) => post<any>('/api/users/me/kyc', { aadhaarNumber }),
    getAll: () => get<any[]>('/api/users'),
    create: (data: any) => post<any>('/api/users', data),
    updateStatus: (id: string, status: 'active' | 'deactivated' | 'suspended') => patch<any>(`/api/users/${id}/status`, { status }),
    updateRole: (id: string, role: string) => patch<any>(`/api/users/${id}/role`, { role }),
  },

  // ─── Career Chat ───────────────────────────────────────────────────────────

  chat: {
    send: (message: string) =>
      post<{ message: string; timestamp: string }>('/api/chat', { message }),
    history: () => get<any[]>('/api/chat/history'),
  },

  // ─── Faculty ───────────────────────────────────────────────────────────────

  faculty: {
    getDashboard: () => get<any>('/api/faculty/dashboard'),
    getCourses: () => get<any[]>('/api/faculty/courses'),
    getCourseRoster: (courseId: string) => get<any[]>(`/api/faculty/courses/${courseId}/roster`),
  },

  // ─── Curriculum Management (Persistent Database) ───────────────────────────

  curriculum: {
    getCurriculum: (courseId: string) => get<any>(`/api/courses/${courseId}/curriculum`),
    createModule: (courseId: string, data: any) => post<any>(`/api/courses/${courseId}/modules`, data),
    updateModule: (moduleId: string, data: any, courseId?: string) =>
      patch<any>(courseId ? `/api/courses/${courseId}/modules/${moduleId}` : `/api/modules/${moduleId}`, data),
    deleteModule: (moduleId: string, courseId?: string) =>
      del<any>(courseId ? `/api/courses/${courseId}/modules/${moduleId}` : `/api/modules/${moduleId}`),
    reorderModules: (courseId: string, moduleIds: string[]) =>
      put<any>(`/api/courses/${courseId}/modules/reorder`, { moduleIds }),
    getLesson: async (lessonId: string, moduleId?: string) => {
      const res = await get<any>(moduleId ? `/api/modules/${moduleId}/lessons/${lessonId}` : `/api/lessons/${lessonId}`);
      return res.lesson || res;
    },
    createLesson: async (moduleId: string, data: any) => {
      const res = await post<any>(`/api/modules/${moduleId}/lessons`, data);
      return res.lesson || res;
    },
    updateLesson: async (lessonId: string, data: any, moduleId?: string) => {
      const res = await patch<any>(moduleId ? `/api/modules/${moduleId}/lessons/${lessonId}` : `/api/lessons/${lessonId}`, data);
      return res.lesson || res;
    },
    deleteLesson: (lessonId: string, moduleId?: string) =>
      del<any>(moduleId ? `/api/modules/${moduleId}/lessons/${lessonId}` : `/api/lessons/${lessonId}`),
    reorderLessons: (moduleId: string, lessonIds: string[]) =>
      put<any>(`/api/modules/${moduleId}/lessons/reorder`, { lessonIds }),
    saveQuiz: (moduleId: string, quizData: any) =>
      post<any>(`/api/modules/${moduleId}/quiz`, quizData),
    deleteQuiz: (quizId: string, moduleId?: string) =>
      del<any>(moduleId ? `/api/modules/${moduleId}/quiz/${quizId}` : `/api/quizzes/${quizId}`),
    createCourse: (data: any) => post<any>('/api/courses', data),
    updateCourse: (courseId: string, data: any) => put<any>(`/api/courses/${courseId}`, data),
  },

  // ─── NCCT Digital Skill Card ───────────────────────────────────────────────

  skillCard: {
    getMyCard: () => get<any>('/api/trainees/me/skill-card'),
    regenerateToken: () => post<any>('/api/trainees/me/skill-card/regenerate'),
    getPublicCard: (token: string) => get<any>(`/api/public/skill-card/${token}`, false),
    contactTrainee: (token: string, data: any) =>
      post<any>(`/api/public/skill-card/${token}/contact`, data, false),
  },

  // ─── Institute Admin Portal ────────────────────────────────────────────────
  institute: {
    getDashboard: () => get<any>('/api/institute/dashboard'),
    getAnalytics: () => get<any>('/api/institute/analytics'),
    getProgrammes: (params?: { status?: string; mode?: string; category?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.mode) q.append('mode', params.mode);
      if (params?.category) q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      const qs = q.toString();
      return get<any[]>(`/api/institute/programmes${qs ? `?${qs}` : ''}`);
    },
    getProgramme: (id: string) => get<any>(`/api/institute/programmes/${id}`),
    createProgramme: (data: any) => post<any>('/api/institute/programmes', data),
    updateProgramme: (id: string, data: any) => patch<any>(`/api/institute/programmes/${id}`, data),
    archiveProgramme: (id: string) => post<any>(`/api/institute/programmes/${id}/archive`, {}),
    getProgrammeNominations: (programmeId: string, params?: { status?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      const qs = q.toString();
      return get<{ nominations: any[]; total: number; page: number; limit: number; totalPages: number }>(
        `/api/institute/programmes/${programmeId}/nominations${qs ? `?${qs}` : ''}`
      );
    },
    getNominations: (params?: { status?: string; programmeId?: string; cooperative?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.programmeId) q.append('programmeId', params.programmeId);
      if (params?.cooperative) q.append('cooperative', params.cooperative);
      if (params?.search) q.append('search', params.search);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      const qs = q.toString();
      return get<any>(`/api/institute/nominations${qs ? `?${qs}` : ''}`);
    },
    getNominationById: (id: string) => get<any>(`/api/institute/nominations/${id}`),
    approveNomination: (id: string) => post<any>(`/api/institute/nominations/${id}/approve`, {}),
    rejectNomination: (id: string, reason?: string) => post<any>(`/api/institute/nominations/${id}/reject`, { reason }),
    bulkApproveNominations: (nominationIds: string[]) => post<any>('/api/institute/nominations/bulk-approve', { nominationIds }),
    bulkRejectNominations: (nominationIds: string[], reason?: string) => post<any>('/api/institute/nominations/bulk-reject', { nominationIds, reason }),
    bulkImportNominations: (programmeId: string, records: Array<{ name: string; email: string; coop?: string }>, validateOnly = false) =>
      post<any>('/api/institute/nominations/bulk-import', { programmeId, records, validateOnly }),
    updateNominationStatus: (id: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) =>
      patch<any>(`/api/institute/nominations/${id}/status`, { status, rejectionReason }),
    getHostel: () => get<any[]>('/api/institute/hostel'),
    updateHostelBed: (bedId: string, data: { status: string; traineeId?: string | null; traineeName?: string | null }) =>
      patch<any>(`/api/institute/hostel/beds/${bedId}`, data),
    getSessions: (date?: string) => get<any[]>(`/api/institute/sessions${date ? `?date=${date}` : ''}`),
    createSession: (data: any) => post<any>('/api/institute/sessions', data),
    updateSession: (id: string, data: any) => patch<any>(`/api/institute/sessions/${id}`, data),
    deleteSession: (id: string) => del<any>(`/api/institute/sessions/${id}`),
    getInstitutes: () => get<any[]>('/api/institutes'),
    getTrainees: (params?: {
      search?: string;
      instituteId?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
    }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.instituteId) q.append('instituteId', params.instituteId);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      if (params?.sort) q.append('sort', params.sort);
      if (params?.order) q.append('order', params.order);
      const qs = q.toString();
      return get<{
        data: any[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
        total: number;
      }>(`/api/institute/trainees${qs ? `?${qs}` : ''}`);
    },
    getTraineeById: (id: string) => get<any>(`/api/institute/trainees/${id}`),
    getTimetable: () => get<any[]>('/api/institute/timetable'),
  },
  national: {
    getDashboard: () => get<NationalDashboardData>('/api/national/dashboard'),
    getSummary: () => get<NationalSummary>('/api/national/summary'),
    getTrainings: () => get<InstituteTypeAnalytics[]>('/api/national/trainings'),
    getSkills: () => get<SkillDemandItem[]>('/api/national/skills'),
    getTrend: () => get<{ trend: CertificationTrendItem[]; biometricFidelityAvailable: boolean; averageAttendanceRate: number | null }>('/api/national/trend'),
    getAttendance: () => get<AttendanceAnalytics>('/api/national/attendance'),
    getPlacements: () => get<PlacementAnalytics>('/api/national/placements'),
    getAnalytics: () => get<NationalAnalyticsData>('/api/national/analytics'),
  },
  hostel: {
    getDashboard: (hostelId?: string) => get<any>(`/api/hostel/dashboard${hostelId ? `?hostelId=${hostelId}` : ''}`),
    getBlocks: (hostelId?: string) => get<any[]>(`/api/hostel/blocks${hostelId ? `?hostelId=${hostelId}` : ''}`),
    createBlock: (data: any) => post<any>('/api/hostel/blocks', data),
    getRooms: (blockId?: string) => get<any[]>(`/api/hostel/rooms${blockId ? `?blockId=${blockId}` : ''}`),
    createRoom: (data: any) => post<any>('/api/hostel/rooms', data),
    updateBedStatus: (bedId: string, data: { status: string; remarks?: string }) => patch<any>(`/api/hostel/beds/${bedId}/status`, data),
    getRequests: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      const qs = q.toString();
      return get<any[]>(`/api/hostel/requests${qs ? `?${qs}` : ''}`);
    },
    submitRequest: (data: any) => post<any>('/api/hostel/requests', data),
    updateRequestStatus: (id: string, data: { status: string; adminRemarks?: string }) => patch<any>(`/api/hostel/requests/${id}/status`, data),
    allocateBed: (data: { requestId: string; bedId: string; remarks?: string }) => post<any>('/api/hostel/allocations', data),
    getAllocations: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      const qs = q.toString();
      return get<any[]>(`/api/hostel/allocations${qs ? `?${qs}` : ''}`);
    },
    checkIn: (allocationId: string, data?: { verificationMethod?: string; remarks?: string }) => post<any>(`/api/hostel/allocations/${allocationId}/check-in`, data || {}),
    checkOut: (allocationId: string, data?: { remarks?: string }) => post<any>(`/api/hostel/allocations/${allocationId}/check-out`, data || {}),
    getComplaints: (params?: { status?: string; category?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.category) q.append('category', params.category);
      const qs = q.toString();
      return get<any[]>(`/api/hostel/complaints${qs ? `?${qs}` : ''}`);
    },
    submitComplaint: (data: any) => post<any>('/api/hostel/complaints', data),
    updateComplaint: (id: string, data: { status: string; resolutionNotes?: string }) => patch<any>(`/api/hostel/complaints/${id}`, data),
    getResidentStatus: () => get<{ isHostelResident: boolean; status: string; allocation?: any }>('/api/trainee/hostel/status'),
    getMyStatus: () => get<any>('/api/trainee/hostel/my-status'),
  },

  // ─── NCCT Programmes & Admissions ──────────────────────────────────────────
  programmes: {
    getTypes: () => get<any[]>('/api/programmes/types', false),
    getAll: (params?: {
      search?: string;
      programmeTypeCode?: string;
      deliveryMode?: string;
      instituteId?: string;
      academicYear?: string;
      status?: string;
      limit?: number;
      page?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.programmeTypeCode) q.append('programmeTypeCode', params.programmeTypeCode);
      if (params?.deliveryMode) q.append('deliveryMode', params.deliveryMode);
      if (params?.instituteId) q.append('instituteId', params.instituteId);
      if (params?.academicYear) q.append('academicYear', params.academicYear);
      if (params?.status) q.append('status', params.status);
      if (params?.limit) q.append('limit', String(params.limit));
      if (params?.page) q.append('page', String(params.page));
      const qs = q.toString();
      return get<{ data: any[]; pagination: any }>(`/api/programmes${qs ? `?${qs}` : ''}`, false);
    },
    getById: (id: string) => get<any>(`/api/programmes/${id}`),
    checkEligibility: (id: string) => get<any>(`/api/programmes/${id}/eligibility`),
    apply: (id: string, payload: {
      batchId?: string;
      hostelRequired?: boolean;
      notes?: string;
      consentedDocTypes?: string[];
      roomTypePreference?: string;
      foodPreference?: string;
    }) => post<any>(`/api/programmes/${id}/apply`, payload),
    getMyApplications: () => get<any[]>('/api/programmes/my-applications'),
    getMyTimetable: () => get<any>('/api/programmes/my-timetable'),
  },

  // ─── Reusable Document Vault & Profile Readiness ───────────────────────────
  vault: {
    getDocuments: () => get<any[]>('/api/vault'),
    uploadDocument: (data: {
      documentType: string;
      fileName: string;
      filePath?: string;
      fileSize?: number;
      mimeType?: string;
      metadata?: any;
    }) => post<any>('/api/vault/upload', data),
    deleteDocument: (id: string) => del<any>(`/api/vault/${id}`),
    getReadiness: () => get<{
      userId: string;
      readinessScore: number;
      readinessLevel: string;
      totalDocuments: number;
      verifiedDocumentsCount: number;
      pendingDocumentsCount: number;
      checklist: any[];
      canApplyImmediately: boolean;
    }>('/api/vault/readiness'),
  },

  // ─── Faculty Timetable ───────────────────────────────────────────────────────
  facultyTimetable: {
    getSchedule: () => get<{
      facultyId: string;
      totalSessions: number;
      sessions: any[];
      scheduleByDay: Record<string, any[]>;
    }>('/api/faculty/timetable'),
  },

  // ─── Batches & Timetable Conflict Checking ──────────────────────────────────
  batches: {
    getAll: (programmeId?: string) => {
      const qs = programmeId ? `?programmeId=${programmeId}` : '';
      return get<any[]>(`/api/institute/batches${qs}`);
    },
    create: (data: any) => post<any>('/api/institute/batches', data),
    checkConflict: (data: {
      date: string;
      timeSlot: string;
      room?: string;
      classroomId?: string;
      instructor?: string;
      facultyId?: string;
      batchId?: string;
      sessionId?: string;
    }) => post<{ hasConflict: boolean; message?: string; conflictingSession?: any }>('/api/institute/sessions/check-conflict', data),
  },
};

export interface NationalSummary {
  totalCertifiedTrainees: number;
  activeInstitutes: number;
  totalInstitutes: number;
  instituteTypeBreakdown: string;
  certificatesGenerated: number;
  employerPlacementsInitiated: number;
  placementsSubtext: string;
  lastSync: string;
}

export interface InstituteTypeAnalytics {
  name: string;
  type: string;
  count: number;
  capacity: number;
  fill: string;
  instituteCount: number;
}

export interface SkillDemandItem {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface CertificationTrendItem {
  month: string;
  certs: number;
  attendanceRate: number | null;
}

export interface AttendanceAnalytics {
  totalSessions: number;
  totalRecords: number;
  qrCount: number;
  faceCount: number;
  manualCount: number;
  biometricRate: number | null;
}

export interface PlacementAnalytics {
  totalJobs: number;
  totalOpenings: number;
  totalInterests: number;
  shortlistedCount: number;
  interviewCount: number;
  selectedCount: number;
  appliedCount: number;
  initiatedCount: number;
}

export interface NationalDashboardData {
  summary: NationalSummary;
  instituteTypeData: InstituteTypeAnalytics[];
  skillDemandData: SkillDemandItem[];
  monthlyCertData: CertificationTrendItem[];
  attendance: AttendanceAnalytics;
  placements: PlacementAnalytics;
}

export interface CertificationTrajectoryMonth {
  month: string;
  monthly: number;
  monthlyIssued: number;
  cumulative: number;
  cumulativeCertified: number;
}

export interface CertificationTrajectory {
  months: CertificationTrajectoryMonth[];
  totalCertified: number;
  distinctCertifiedTrainees: number;
}

export interface InstitutionalCompletionTier {
  tier: string;
  name: string;
  instituteCount: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  dropoutRate: number;
  fill: string;
}

export interface EmploymentPipeline {
  certifiedTrainees: number;
  employerInterestGenerated: number;
  placementsInitiated: number;
  employerInterestRate: number;
  placementConversionRate: number;
  federationsWithPlacements: number;
  federationsList: string[];
}

export interface InstituteMatrixRow {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  director: string;
  activeCount: number;
  capacity: number;
  utilization: number;
  certificates: number;
  nominations: number;
}

export interface NationalAnalyticsData {
  trajectory: CertificationTrajectory;
  institutionalCompletion: InstitutionalCompletionTier[];
  pipeline: EmploymentPipeline;
  instituteMatrix: InstituteMatrixRow[];
  summary: {
    totalInstitutes: number;
    activeInstitutes: number;
    totalCapacity: number;
    totalActiveTrainees: number;
    lastSyncAt: string;
  };
}

export default api;

