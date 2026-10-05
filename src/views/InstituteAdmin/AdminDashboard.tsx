import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Layers,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  BedDouble,
  QrCode,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Building2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  MapPin,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';
import api from '../../lib/api';

interface DashboardData {
  institute: {
    id: string;
    name: string;
    nameHi: string;
    type: string;
    city: string;
    state: string;
    director: string;
    capacity: number;
    contactEmail: string;
    contactPhone: string;
    activeCount: number;
  };
  stats: {
    enrolledTrainees: number;
    capacity: number;
    activeProgrammes: number;
    pendingNominations: number;
    hostelOccupancy: {
      occupied: number;
      capacity: number;
      percentage: number;
    };
  };
  nominations: Array<{
    id: string;
    programmeId: string;
    programmeTitle?: string;
    userId?: string | null;
    traineeName: string;
    traineeEmail: string;
    cooperativeName: string;
    status: 'pending' | 'approved' | 'rejected';
    nominatedDate: string;
    rejectionReason?: string | null;
  }>;
  liveSessions: Array<{
    id: string;
    programmeId: string;
    title: string;
    instructor: string;
    date: string;
    timeSlot: string;
    room: string;
    qrToken: string;
    active: boolean;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
    presentCount: number;
    expectedCount: number;
    attendanceRate: number;
  }>;
  hostel: {
    occupied: number;
    capacity: number;
    percentage: number;
  };
}

export const AdminDashboard: React.FC = () => {
  const { navigate, t, isOffline } = useApp();

  const [data, setData] = useState<DashboardData | null>(() => {
    try {
      const cached = localStorage.getItem('ss_admin_dash_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedNomination, setSelectedNomination] = useState<any | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [rejectingNomination, setRejectingNomination] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // ─── Fetch live data from PostgreSQL / Supabase ───────────────────────────
  const fetchDashboard = useCallback(async () => {
    if (isOffline || !navigator.onLine) {
      try {
        const cached = localStorage.getItem('ss_admin_dash_cache');
        if (cached) {
          setData(JSON.parse(cached));
          setError(null);
          setLoading(false);
          return;
        }
      } catch {}
    }

    try {
      setError(null);
      const res = await api.institute.getDashboard();
      setData(res);
      try {
        localStorage.setItem('ss_admin_dash_cache', JSON.stringify(res));
      } catch {}
    } catch (err: any) {
      console.warn('Failed to load institute dashboard from database, checking cache:', err);
      try {
        const cached = localStorage.getItem('ss_admin_dash_cache');
        if (cached) {
          setData(JSON.parse(cached));
          setError(null);
          return;
        }
      } catch {}
      setError(err.message || 'Unable to load institute dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 45 seconds
    const interval = setInterval(fetchDashboard, 45000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // ─── Nomination Action Handlers (Persistent DB) ───────────────────────────
  const handleUpdateStatus = async (nomId: string, status: 'approved' | 'rejected', reason?: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(nomId);
    try {
      await api.institute.updateNominationStatus(nomId, status, reason);
      // Immediately refresh live dashboard data from PostgreSQL
      await fetchDashboard();
      if (selectedNomination?.id === nomId) {
        setSelectedNomination((prev: any) => prev ? { ...prev, status, rejectionReason: reason || prev.rejectionReason } : null);
      }
      setRejectingNomination(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(`Unable to update nomination: ${err.message || 'Please try again.'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Skeleton Loading State ───────────────────────────────────────────────
  if (loading && !data) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-5">
          <div className="bg-gray-200 h-28 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-200 h-28 rounded-2xl" />
            <div className="bg-gray-200 h-28 rounded-2xl" />
            <div className="bg-gray-200 h-28 rounded-2xl" />
            <div className="bg-gray-200 h-28 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-gray-200 h-96 rounded-2xl" />
            <div className="lg:col-span-5 bg-gray-200 h-96 rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // ─── Error / Retry State ──────────────────────────────────────────────────
  if (error && !data) {
    return (
      <PageContainer>
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Unable to load institute dashboard data</h3>
          <p className="text-xs text-gray-600">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  const { institute, stats, nominations, liveSessions } = data!;

  return (
    <PageContainer>
      
      {/* 1. Institute Information Hero Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              {institute.type} Operations Portal
            </span>
            <SimulatedBadge text="Institute ERP Live Node" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-govText-primary leading-snug break-words">
            {institute.name}
          </h2>
          <p className="text-xs text-govText-secondary leading-relaxed">
            Director: <strong className="text-govText-primary">{institute.director}</strong> • City: {institute.city}, {institute.state}
          </p>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto flex items-center gap-2">
          <button
            onClick={() => navigate('/institute-admin/sessions')}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 min-h-[44px] cursor-pointer transition-colors"
          >
            <QrCode className="w-4 h-4 text-saffron-300" />
            <span>Launch Attendance Kiosk</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Cards Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        
        {/* Enrolled Trainees */}
        <div
          onClick={() => navigate('/institute-admin/trainees')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-govText-border shadow-sm space-y-2 cursor-pointer hover:border-govTeal-500 transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-govText-muted">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-govTeal-700 transition-colors">
              Enrolled Trainees
            </span>
            <div className="w-9 h-9 rounded-xl bg-govTeal-50 flex items-center justify-center text-govTeal-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-govText-primary">
            {stats.enrolledTrainees}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Capacity: {stats.capacity} Seats</span>
          </p>
        </div>

        {/* Active Programmes */}
        <div
          onClick={() => navigate('/institute-admin/programmes')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-govText-border shadow-sm space-y-2 cursor-pointer hover:border-blue-500 transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-govText-muted">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-700 transition-colors">
              Active Programmes
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-govText-primary">
            {stats.activeProgrammes}
          </p>
          <p className="text-[11px] text-govText-secondary">
            Residential & Hybrid Batches
          </p>
        </div>

        {/* Pending Nominations */}
        <div
          onClick={() => navigate('/institute-admin/nominations')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-govText-border shadow-sm space-y-2 cursor-pointer hover:border-amber-500 transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-govText-muted">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-700 transition-colors">
              Pending Nominations
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-900">
            {stats.pendingNominations}
          </p>
          <p className="text-[11px] text-amber-700 font-semibold">
            Requires Admin Action
          </p>
        </div>

        {/* Hostel Occupancy */}
        <div
          onClick={() => navigate('/institute-admin/hostel')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-govText-border shadow-sm space-y-2 cursor-pointer hover:border-purple-500 transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-govText-muted">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-purple-700 transition-colors">
              Hostel Occupancy
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-govText-primary">
            {stats.hostelOccupancy.occupied} / {stats.hostelOccupancy.capacity}
          </p>
          <p className="text-[11px] text-purple-700 font-semibold">
            {stats.hostelOccupancy.percentage}% Beds Allocated
          </p>
        </div>

      </div>

      {/* 3. Grid: Pending Nominations & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Pending Nominations Table (7 cols on desktop, full width on mobile) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 border border-govText-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-govText-primary truncate">
                Trainee Nominations Management
              </h3>
              <p className="text-[11px] sm:text-xs text-govText-secondary truncate">
                PACS & Dairy cooperative candidate applications
              </p>
            </div>
            <button
              onClick={() => navigate('/institute-admin/nominations')}
              className="text-xs font-bold text-govTeal-700 hover:text-govTeal-900 flex items-center gap-1 flex-shrink-0 cursor-pointer min-h-[36px]"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop/Tablet Table View (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            {nominations.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No trainee nominations found in the system.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-govBg text-govText-secondary uppercase font-semibold border-b border-gray-200">
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Cooperative</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {nominations.slice(0, 5).map(nom => (
                    <tr key={nom.id} className="hover:bg-govTeal-50/30 transition-colors">
                      <td
                        onClick={() => setSelectedNomination(nom)}
                        className="p-3 cursor-pointer group"
                      >
                        <p className="font-bold text-govText-primary group-hover:text-govTeal-700 transition-colors">
                          {nom.traineeName}
                        </p>
                        <p className="text-[10px] text-govText-muted">{nom.traineeEmail}</p>
                      </td>
                      <td className="p-3 text-govText-secondary">{nom.cooperativeName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          nom.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : nom.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {nom.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {nom.status === 'pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              disabled={actionLoadingId === nom.id}
                              onClick={() => handleUpdateStatus(nom.id, 'approved')}
                              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                              title="Approve Nomination"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              disabled={actionLoadingId === nom.id}
                              onClick={() => {
                                setRejectionReason('');
                                setRejectingNomination(nom);
                              }}
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                              title="Reject Nomination"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Card List (< 640px) */}
          <div className="block sm:hidden space-y-3">
            {nominations.slice(0, 4).map(nom => (
              <div
                key={nom.id}
                className="bg-govBg/70 p-3.5 rounded-xl border border-gray-200 space-y-2.5"
              >
                <div
                  onClick={() => setSelectedNomination(nom)}
                  className="flex items-start justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-govText-primary truncate">{nom.traineeName}</p>
                    <p className="text-[10px] text-govText-secondary truncate mt-0.5">{nom.cooperativeName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                    nom.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : nom.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {nom.status}
                  </span>
                </div>

                {nom.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                    <button
                      disabled={actionLoadingId === nom.id}
                      onClick={() => handleUpdateStatus(nom.id, 'approved')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      disabled={actionLoadingId === nom.id}
                      onClick={() => {
                        setRejectionReason('');
                        setRejectingNomination(nom);
                      }}
                      className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Scheduled Sessions & Kiosk Link (5 cols on desktop, full width on mobile) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-6 border border-govText-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-govText-primary">
              Today's Live Sessions
            </h3>
            <span className="text-xs font-bold text-saffron-600 bg-saffron-50 px-2.5 py-0.5 rounded">
              {liveSessions.length} Scheduled
            </span>
          </div>

          <div className="space-y-3">
            {liveSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500">
                No sessions scheduled for today.
              </div>
            ) : (
              liveSessions.map(sess => (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className="bg-govBg p-3.5 sm:p-4 rounded-xl border border-govTeal-100 space-y-2 hover:border-govTeal-400 cursor-pointer transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-govTeal-700 uppercase">
                      {sess.timeSlot}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        sess.status === 'LIVE'
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : sess.status === 'COMPLETED'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {sess.status}
                      </span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded font-mono border border-gray-200">
                        {sess.presentCount} Present
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-xs text-govText-primary group-hover:text-govTeal-700 transition-colors">
                    {sess.title}
                  </h4>
                  <p className="text-[11px] text-govText-secondary">{sess.room}</p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate('/institute-admin/timetable')}
            className="w-full py-3 sm:py-2.5 bg-govBg hover:bg-gray-100 text-govText-primary text-xs font-bold rounded-xl border border-govText-border flex items-center justify-center gap-2 min-h-[44px] cursor-pointer transition-colors"
          >
            <Calendar className="w-4 h-4 text-govTeal-600" />
            <span>Manage Weekly Timetable & Hostels</span>
          </button>
        </div>

      </div>

      {/* ─── Nomination Details Modal ────────────────────────────────────── */}
      {selectedNomination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-govTeal-600" />
                <span>Candidate Nomination Details</span>
              </h3>
              <button
                onClick={() => setSelectedNomination(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 block font-semibold">Candidate Name</span>
                  <strong className="text-gray-900 text-sm">{selectedNomination.traineeName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Email</span>
                  <span className="text-gray-800">{selectedNomination.traineeEmail}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block font-semibold">Cooperative Society</span>
                  <span className="text-gray-800 font-medium">{selectedNomination.cooperativeName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Nomination Date</span>
                  <span className="text-gray-800">{selectedNomination.nominatedDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-semibold">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                    selectedNomination.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedNomination.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {selectedNomination.status}
                  </span>
                </div>
              </div>

              {selectedNomination.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                  <strong>Rejection Note:</strong> {selectedNomination.rejectionReason}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedNomination(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              {selectedNomination.status === 'pending' && (
                <>
                  <button
                    disabled={actionLoadingId === selectedNomination.id}
                    onClick={() => {
                      setRejectionReason('');
                      setRejectingNomination(selectedNomination);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer border border-rose-200"
                  >
                    Reject
                  </button>
                  <button
                    disabled={actionLoadingId === selectedNomination.id}
                    onClick={() => handleUpdateStatus(selectedNomination.id, 'approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Approve Candidate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Rejection Reason Modal ────────────────────────────────────── */}
      {rejectingNomination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-slideUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm sm:text-base text-rose-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Trainee Nomination</span>
              </h3>
              <button
                onClick={() => setRejectingNomination(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to reject the nomination for{' '}
              <strong className="text-gray-900">{rejectingNomination.traineeName}</strong> (
              {rejectingNomination.cooperativeName})?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Application criteria not met, incomplete documentation..."
                rows={3}
                className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Application criteria not met',
                  'Incomplete documentation',
                  'Batch quota exceeded',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRejectingNomination(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectingNomination.id}
                onClick={() => handleUpdateStatus(rejectingNomination.id, 'rejected', rejectionReason)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Session Details Modal ────────────────────────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-govTeal-600" />
                <span>Session Inspection & Attendance</span>
              </h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
                <h4 className="font-bold text-sm text-govText-primary">{selectedSession.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Instructor</span>
                    <strong className="text-gray-900">{selectedSession.instructor}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Time Slot</span>
                    <strong className="text-gray-900">{selectedSession.timeSlot}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Venue / Room</span>
                    <strong className="text-gray-900">{selectedSession.room}</strong>
                  </div>
                </div>
              </div>

              {/* Attendance metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Present</span>
                  <strong className="text-lg font-extrabold text-emerald-900">{selectedSession.presentCount}</strong>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Expected</span>
                  <strong className="text-lg font-extrabold text-blue-900">{selectedSession.expectedCount || 30}</strong>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-center">
                  <span className="text-[10px] font-bold text-purple-800 uppercase block">Attendance Rate</span>
                  <strong className="text-lg font-extrabold text-purple-900">
                    {Math.round(((selectedSession.presentCount || 0) / (selectedSession.expectedCount || 30)) * 100)}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedSession(null);
                  navigate('/institute-admin/sessions');
                }}
                className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Open in Kiosk</span>
              </button>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
};
