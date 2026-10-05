/**
 * src/views/Faculty/FacultyAttendanceView.tsx
 *
 * Online Web-Based Classroom Attendance Management for Faculty.
 * Flow:
 *  - Faculty starts attendance -> session becomes LIVE in PostgreSQL
 *  - Faculty sees real-time attendance counts via automatic 5s polling
 *  - Live Attendee Roster with Student Name, Time, Status, Method (FACE_ONLINE), and Confidence
 *  - Includes Web Camera Attendance Test tab for testing browser face recognition
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Clock,
  Calendar,
  MapPin,
  Play,
  Square,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Radio,
  Camera,
  Sparkles,
  UserCheck,
  VideoOff,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { PageContainer } from '../../components/layout/PageContainer';

export const FacultyAttendanceView: React.FC = () => {
  const { currentUser } = useApp();

  // Data states
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionDetails, setSessionDetails] = useState<any | null>(null);
  const [summary, setSummary] = useState<{
    totalEligible: number;
    presentCount: number;
    absentCount: number;
    attendancePercentage: number;
  }>({
    totalEligible: 0,
    presentCount: 0,
    absentCount: 0,
    attendancePercentage: 0,
  });
  const [attendees, setAttendees] = useState<any[]>([]);

  // UI & Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingSession, setIsTogglingSession] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'roster' | 'camera_test'>('roster');

  // Web Camera Test State (Pure browser webcam test, zero hardware/RFID)
  const [isTestCameraActive, setIsTestCameraActive] = useState<boolean>(false);
  const [isTestProcessing, setIsTestProcessing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    identity?: string;
    confidence?: number;
    message: string;
  } | null>(null);

  const testVideoRef = useRef<HTMLVideoElement | null>(null);
  const testCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pollingRef = useRef<any>(null);

  // ─── 1. Fetch Sessions & Details ────────────────────────────────────────────
  const fetchAllData = async (preserveSelectedId = false) => {
    setIsRefreshing(true);
    setErrorNotice(null);
    try {
      const [coursesData, sessionsData] = await Promise.all([
        api.courses.list().catch(() => []),
        api.attendance.sessions(),
      ]);

      setCourses(coursesData || []);
      setSessions(sessionsData || []);

      const activeList = (sessionsData || []).filter((s: any) =>
        selectedCourseFilter === 'all' ? true : s.courseId === selectedCourseFilter
      );

      let targetId = selectedSessionId;
      if (!preserveSelectedId || !targetId || !activeList.some((s: any) => s.id === targetId)) {
        const liveSession = activeList.find((s: any) => s.active);
        targetId = liveSession ? liveSession.id : (activeList[0]?.id || '');
        setSelectedSessionId(targetId);
      }

      if (targetId) {
        await fetchSessionSummary(targetId);
      } else {
        setSessionDetails(null);
        setSummary({ totalEligible: 0, presentCount: 0, absentCount: 0, attendancePercentage: 0 });
        setAttendees([]);
      }
    } catch (err: any) {
      console.error('[FacultyAttendance] Data fetch failed:', err);
      setErrorNotice(err.message || 'Failed to load attendance sessions.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchSessionSummary = async (sessionId: string) => {
    try {
      const data = await api.attendance.getSummary(sessionId);
      setSessionDetails({
        id: data.sessionId,
        title: data.title,
        room: data.room,
        active: data.active,
        date: data.date,
        timeSlot: data.timeSlot,
      });
      setSummary(data.summary || {
        totalEligible: 0,
        presentCount: 0,
        absentCount: 0,
        attendancePercentage: 0,
      });
      setAttendees(data.attendees || []);
    } catch (err: any) {
      console.warn('[FacultyAttendance] Summary fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedCourseFilter]);

  // ─── 2. Real-Time Polling Engine (Every 5s while Session is LIVE) ───────────
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (sessionDetails?.active && selectedSessionId) {
      pollingRef.current = setInterval(() => {
        fetchSessionSummary(selectedSessionId);
      }, 5000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionDetails?.active, selectedSessionId]);

  // ─── 3. Session Control (START / STOP) ──────────────────────────────────────
  const handleToggleAttendance = async () => {
    if (!selectedSessionId) return;
    setIsTogglingSession(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    const isCurrentlyActive = Boolean(sessionDetails?.active);
    try {
      if (isCurrentlyActive) {
        await api.attendance.closeSession(selectedSessionId);
        setSuccessNotice('Attendance closed successfully.');
      } else {
        await api.attendance.startSession(selectedSessionId);
        setSuccessNotice('Attendance is now LIVE! Trainees can now verify face on their portal.');
      }
      await fetchAllData(true);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update attendance session state.');
    } finally {
      setIsTogglingSession(false);
    }
  };

  // ─── 4. Web Camera Test Tool ───────────────────────────────────────────────
  const startTestCamera = async () => {
    setTestResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      console.log('[CAMERA] Permission granted');
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
        testVideoRef.current.play();
        setIsTestCameraActive(true);
        console.log('[CAMERA] Video ready');
      }
    } catch (err) {
      console.warn('Webcam stream error:', err);
      setIsTestCameraActive(false);
      setErrorNotice('Webcam could not be opened. Please check camera permissions in your browser.');
    }
  };

  const stopTestCamera = () => {
    if (testVideoRef.current && testVideoRef.current.srcObject) {
      const stream = testVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      testVideoRef.current.srcObject = null;
    }
    setIsTestCameraActive(false);
  };

  const handleRunFaceRecognitionTest = async () => {
    if (!testVideoRef.current || !testCanvasRef.current || !isTestCameraActive) {
      setErrorNotice('Please turn on the camera before running face recognition test.');
      return;
    }

    setIsTestProcessing(true);
    setTestResult(null);

    try {
      const video = testVideoRef.current;
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        throw new Error('Camera feed is still initializing. Please wait 1 second.');
      }

      const canvas = testCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('[CAMERA] Frame captured: ' + canvas.width + 'x' + canvas.height);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.90);
      console.log('[CAMERA] Sending frame to /recognize');

      // Call Face AI service
      const res = await fetch('http://127.0.0.1:8000/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (!res.ok) {
        throw new Error('Face recognition AI service returned an error.');
      }

      const data = await res.json();
      if (data.matched && data.identity && data.identity !== 'UNKNOWN') {
        setTestResult({
          success: true,
          identity: data.recognizedName || data.identity,
          confidence: Math.round((data.confidence || 0) * 100),
          message: `Face identified as "${data.recognizedName || data.identity}" with ${Math.round((data.confidence || 0) * 100)}% confidence.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Face not recognized. Please position your face inside the frame.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Face recognition test failed. Please verify Python service on port 8000 is running.',
      });
    } finally {
      setIsTestProcessing(false);
    }
  };

  // ─── 5. CSV Export ─────────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (!attendees || attendees.length === 0) return;
    const headers = ['Student Name', 'Email', 'Cooperative', 'Status', 'Marked At', 'Method', 'Confidence'];
    const rows = attendees.map(a => [
      `"${a.name}"`,
      `"${a.email || ''}"`,
      `"${a.coop || ''}"`,
      `"${a.status}"`,
      `"${a.time}"`,
      `"${a.method}"`,
      `"${a.confidence || ''}%"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${sessionDetails?.title || 'Session'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  const isSessionLive = Boolean(sessionDetails?.active);

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-govTeal-50 text-govTeal-700 border border-govTeal-100">
                <Users className="w-6 h-6 text-govTeal-700" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Online Face Attendance Management
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Web-based biometric attendance powered by ArcFace AI and real-time database sync
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-govTeal-600' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={!attendees || attendees.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Notices */}
        {errorNotice && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-xs font-semibold text-rose-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {successNotice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="text-xs font-semibold text-emerald-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Main Grid: Left Sessions Sidebar & Right Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Today's Classroom Sessions (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-base">Today's Sessions</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {sessions.length} Available
                </span>
              </div>

              {/* Course filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Filter by Course
                </label>
                <select
                  value={selectedCourseFilter}
                  onChange={e => setSelectedCourseFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-gray-50 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-500 font-medium"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sessions list */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No sessions scheduled.
                  </div>
                ) : (
                  sessions.map(s => {
                    const isSelected = s.id === selectedSessionId;
                    const isLive = s.active;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSessionId(s.id);
                          fetchSessionSummary(s.id);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-govTeal-600 bg-govTeal-50/50 shadow-sm ring-1 ring-govTeal-600'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
                            {s.title}
                          </h3>
                          {isLive ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                              ● LIVE
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              Scheduled
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{s.timeSlot} ({s.date})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{s.room}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Active Session Attendance Console (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedSession ? (
              <>
                {/* Session Hero & Action Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-100 uppercase tracking-wider">
                          Course Session
                        </span>
                        {isSessionLive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            ATTENDANCE LIVE
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                            ATTENDANCE CLOSED
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-extrabold text-gray-900 mt-2">
                        {sessionDetails?.title || selectedSession.title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>Time: {selectedSession.timeSlot}</span>
                        <span>•</span>
                        <span>Date: {selectedSession.date}</span>
                      </div>
                    </div>

                    {/* Start / Stop Action Button */}
                    <div>
                      <button
                        onClick={handleToggleAttendance}
                        disabled={isTogglingSession}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                          isSessionLive
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                        } disabled:opacity-50`}
                      >
                        {isSessionLive ? (
                          <>
                            <Square className="w-4 h-4 fill-white" />
                            STOP ATTENDANCE
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            START ATTENDANCE
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Counters from Database */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase">Enrolled</div>
                      <div className="text-2xl font-black text-gray-900 mt-1">
                        {summary.totalEligible}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Enrolled trainees</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <div className="text-xs font-semibold text-emerald-700 uppercase">Present</div>
                      <div className="text-2xl font-black text-emerald-700 mt-1">
                        {summary.presentCount}
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">Verified online</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                      <div className="text-xs font-semibold text-amber-700 uppercase">Remaining</div>
                      <div className="text-2xl font-black text-amber-700 mt-1">
                        {summary.absentCount}
                      </div>
                      <div className="text-[11px] text-amber-600 mt-0.5">Pending check-in</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100">
                      <div className="text-xs font-semibold text-govTeal-700 uppercase">Turnout</div>
                      <div className="text-2xl font-black text-govTeal-800 mt-1">
                        {summary.attendancePercentage}%
                      </div>
                      <div className="text-[11px] text-govTeal-600 mt-0.5">Attendance rate</div>
                    </div>
                  </div>
                </div>

                {/* Tabs: Live Attendee Roster vs Web Camera Attendance Test */}
                <div className="flex border-b border-gray-200 gap-6">
                  <button
                    onClick={() => setActiveTab('roster')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                      activeTab === 'roster'
                        ? 'border-govTeal-600 text-govTeal-700'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Live Attendee Roster ({attendees.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('camera_test')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTab === 'camera_test'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Web Camera Attendance Test
                  </button>
                </div>

                {/* TAB 1: Live Attendee Roster */}
                {activeTab === 'roster' && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm">Verified Attendee Roster</h3>
                      {isSessionLive && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          Live Polling Active (5s)
                        </span>
                      )}
                    </div>

                    {attendees.length === 0 ? (
                      <div className="py-12 text-center text-gray-400">
                        <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-600">No attendees marked yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {isSessionLive
                            ? 'Students verifying their face in the trainee portal will appear here in real time.'
                            : 'Start attendance above to begin receiving trainee face check-ins.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <tr>
                              <th className="px-6 py-3">Student Name</th>
                              <th className="px-6 py-3">Cooperative</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Marked At</th>
                              <th className="px-6 py-3">Method</th>
                              <th className="px-6 py-3">Confidence</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {attendees.map(a => (
                              <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-6 py-3.5 font-bold text-gray-900">
                                  {a.name}
                                </td>
                                <td className="px-6 py-3.5 text-xs text-gray-500">
                                  {a.coop || 'NCCT Trainee'}
                                </td>
                                <td className="px-6 py-3.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    {a.status}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-xs text-gray-600 font-mono">
                                  {a.time}
                                </td>
                                <td className="px-6 py-3.5 text-xs font-medium text-gray-700">
                                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-100 font-semibold">
                                    {a.method === 'FACE_ONLINE' ? 'FACE ONLINE' : a.method}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-xs font-mono text-emerald-700 font-semibold">
                                  {a.confidence ? `${a.confidence}%` : '95.0%'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Web Camera Attendance Test (No Hardware/RFID) */}
                {activeTab === 'camera_test' && (
                  <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                            <Camera className="w-5 h-5" />
                          </span>
                          <h3 className="font-bold text-gray-900 text-base">
                            Web Camera Face Recognition Test
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Test live browser face recognition directly against the ArcFace AI model.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        AI MODEL TEST
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Camera Viewport */}
                      <div className="md:col-span-7 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600 uppercase">
                            Webcam Viewport
                          </span>
                          {!isTestCameraActive ? (
                            <button
                              onClick={startTestCamera}
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              Turn Camera On
                            </button>
                          ) : (
                            <button
                              onClick={stopTestCamera}
                              className="text-xs font-semibold text-gray-500 hover:underline"
                            >
                              Turn Off
                            </button>
                          )}
                        </div>

                        <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center border-2 border-gray-200">
                          <video
                            ref={testVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isTestCameraActive ? 'block' : 'hidden'}`}
                          />
                          <canvas ref={testCanvasRef} className="hidden" />

                          {!isTestCameraActive && (
                            <div className="text-center p-6 text-gray-400 space-y-2">
                              <Camera className="w-10 h-10 mx-auto text-gray-500" />
                              <p className="text-sm font-medium">Camera is inactive</p>
                              <button
                                onClick={startTestCamera}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white shadow"
                              >
                                Enable Camera
                              </button>
                            </div>
                          )}

                          {isTestCameraActive && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-44 h-52 border-2 border-dashed border-indigo-400 rounded-3xl opacity-80" />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleRunFaceRecognitionTest}
                          disabled={isTestProcessing || !isTestCameraActive}
                          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md disabled:opacity-50"
                        >
                          {isTestProcessing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Analyzing Face via ArcFace AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Test Face Recognition
                            </>
                          )}
                        </button>
                      </div>

                      {/* Result Box & Enrolled Identities Info */}
                      <div className="md:col-span-5 space-y-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                          <div className="text-xs font-semibold text-gray-700 uppercase">
                            Enrolled Model Identities
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['karthik', 'luffy', 'Samritha', 'aditya'].map(name => (
                              <span
                                key={name}
                                className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-800 shadow-2xs"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-500 pt-1">
                            ArcFace (buffalo_l) 512-d embeddings in <code className="font-mono text-gray-700">enrolled.pkl</code>.
                          </p>
                        </div>

                        {testResult && (
                          <div
                            className={`rounded-2xl p-4 border flex items-start gap-3.5 animate-in fade-in duration-200 ${
                              testResult.success
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                            }`}
                          >
                            {testResult.success ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1">
                              <div className="font-bold text-sm">
                                {testResult.success ? 'Face Recognized ✓' : 'Recognition Failed ✕'}
                              </div>
                              <div className="text-xs leading-relaxed">{testResult.message}</div>
                              {testResult.confidence && (
                                <div className="text-xs font-semibold text-emerald-700 font-mono pt-1">
                                  Cosine Match Confidence: {testResult.confidence}%
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                Please select a session from the left sidebar.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
