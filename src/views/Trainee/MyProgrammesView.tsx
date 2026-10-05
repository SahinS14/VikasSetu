import React, { useState, useEffect } from 'react';
import {
  Layers,
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  BedDouble,
  ShieldCheck,
  Send,
  Users,
  Compass,
  ArrowRight,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export const MyProgrammesView: React.FC = () => {
  const { navigate } = useApp();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');

  const tabs = [
    'All',
    'Applied',
    'Under Review',
    'Approved',
    'Upcoming',
    'Active',
    'Completed',
    'Rejected',
  ];

  useEffect(() => {
    loadMyProgrammes();
  }, []);

  const loadMyProgrammes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.programmes.getMyApplications();
      setApplications(data || []);
    } catch (err: any) {
      console.error('Failed to load my programmes:', err);
      setError(err.message || 'Could not retrieve your programme enrollments.');
    } finally {
      setLoading(false);
    }
  };

  // Filter applications by active tab
  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'All') return true;
    const status = (app.status || '').toUpperCase();
    const enrollmentStatus = (app.enrollmentStatus || '').toUpperCase();

    if (activeTab === 'Applied') {
      return status === 'SUBMITTED' || status === 'APPLIED';
    }
    if (activeTab === 'Under Review') {
      return status === 'UNDER_REVIEW' || status === 'DOCUMENT_REVIEW' || status === 'ELIGIBILITY_REVIEW';
    }
    if (activeTab === 'Approved') {
      return status === 'ACCEPTED' || status === 'APPROVED' || enrollmentStatus === 'ADMISSION_CONFIRMED' || enrollmentStatus === 'BATCH_ASSIGNED';
    }
    if (activeTab === 'Upcoming') {
      return (enrollmentStatus === 'BATCH_ASSIGNED' || status === 'APPROVED') && new Date(app.programme?.startDate) > new Date();
    }
    if (activeTab === 'Active') {
      return enrollmentStatus === 'ACTIVE' || (status === 'APPROVED' && enrollmentStatus === 'BATCH_ASSIGNED');
    }
    if (activeTab === 'Completed') {
      return enrollmentStatus === 'COMPLETED';
    }
    if (activeTab === 'Rejected') {
      return status === 'REJECTED' || status === 'WITHDRAWN';
    }
    return true;
  });

  const getStatusBadge = (app: any) => {
    const status = (app.status || '').toUpperCase();
    const enrollmentStatus = (app.enrollmentStatus || '').toUpperCase();

    if (enrollmentStatus === 'BATCH_ASSIGNED') {
      return {
        label: 'Batch Assigned',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-500',
      };
    }
    if (status === 'ACCEPTED' || enrollmentStatus === 'ADMISSION_CONFIRMED') {
      return {
        label: 'Admission Confirmed',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
        dotClass: 'bg-teal-500',
      };
    }
    if (status === 'UNDER_REVIEW' || status === 'DOCUMENT_REVIEW' || status === 'ELIGIBILITY_REVIEW') {
      return {
        label: 'Application Under Review',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        dotClass: 'bg-amber-500',
      };
    }
    if (status === 'REJECTED') {
      return {
        label: 'Application Rejected',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        dotClass: 'bg-rose-500',
      };
    }
    return {
      label: 'Submitted',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      dotClass: 'bg-blue-500',
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-24">
      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] via-[#005B46] to-[#0D7A5F] text-white p-8 md:p-10 shadow-xl border border-emerald-700/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <Layers className="w-3.5 h-3.5 text-amber-300" /> Institutional Programme Manager
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            My Programmes
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
            Manage your relationship with NCCT institutional programme offerings. Track application eligibility, batch assignments, physical contact sessions, college-style timetables, and hostel accommodations.
          </p>

          <div className="pt-2">
            <button
              onClick={() => navigate('/trainee/catalogue')}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4" /> Browse Programme Catalogue
            </button>
          </div>
        </div>
      </div>

      {/* ─── Status Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ─── Programme Cards List ────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Retrieving Programme Relationships...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
          <div className="font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Error loading programmes
          </div>
          <p>{error}</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <Layers className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No programmes found in tab "{activeTab}"</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any applications matching this status. Explore new institutional offerings in the Programme Catalogue.
          </p>
          <button
            onClick={() => navigate('/trainee/catalogue')}
            className="px-5 py-2.5 rounded-xl bg-[#005B46] text-white text-xs font-bold hover:bg-[#004736] cursor-pointer"
          >
            Explore Catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApplications.map((app) => {
            const statusInfo = getStatusBadge(app);
            const isApproved =
              app.status === 'ACCEPTED' ||
              app.enrollmentStatus === 'ADMISSION_CONFIRMED' ||
              app.enrollmentStatus === 'BATCH_ASSIGNED' ||
              app.enrollmentStatus === 'ACTIVE';
            const isBatchAssigned =
              app.enrollmentStatus === 'BATCH_ASSIGNED' || app.enrollmentStatus === 'ACTIVE';
            const programme = app.programme;
            const batch = app.batch;

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
              >
                {/* Header: Programme Type & Status */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                      Type: {programme?.programmeType?.name || 'Institutional Programme'}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${statusInfo.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {programme?.title}
                    </h3>
                    {programme?.titleHi && (
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {programme.titleHi}
                      </p>
                    )}
                  </div>
                </div>

                {/* Key Spec Grid (per PDF specification) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Institution:</span>
                    <strong className="text-slate-800">
                      {programme?.institute?.name?.split('(')[0] || 'VAMNICOM Pune'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <strong className="text-slate-800">
                      {programme?.deliveryMode === 'ON_SITE'
                        ? 'On-site + Offline-supported'
                        : programme?.deliveryMode === 'BLENDED'
                        ? 'Blended / Hybrid'
                        : programme?.deliveryMode}
                    </strong>
                  </div>

                  {/* Batch Info (Visible when approved/assigned) */}
                  {isApproved && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Batch:</span>
                      <strong className="text-emerald-700 font-bold">
                        {batch?.name || 'PACS-DIGITAL-SEP26-A'}
                      </strong>
                    </div>
                  )}

                  {/* Hostel Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Hostel:</span>
                    <strong className="text-slate-800">
                      {app.hostelRequired ? (app.hostelStatus || 'Confirmed') : 'Not Requested'}
                    </strong>
                  </div>

                  {/* Next session teaser if batch assigned */}
                  {isBatchAssigned && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-emerald-800 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Next session:
                      </span>
                      <span>Today, 10:00 AM</span>
                    </div>
                  )}

                  {!isApproved && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-amber-800 font-semibold">
                      <span>Admission:</span>
                      <span>Awaiting institute decision</span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {isBatchAssigned ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Timetable & Courses Unlocked</span>
                    </div>
                  ) : isApproved ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>Batch assignment pending</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FileCheck className="w-4 h-4 text-slate-400" />
                      <span>Documents Verified</span>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/trainee/programmes/${app.programmeId}`)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#005B46] text-white text-xs font-bold transition-all shadow cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{isBatchAssigned ? 'View Programme' : isApproved ? 'View Details' : 'View Application'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProgrammesView;
