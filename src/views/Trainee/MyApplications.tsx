import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Briefcase,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  IndianRupee,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Calendar,
  BedDouble,
  ShieldCheck,
  FolderKanban,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import api from '../../lib/api';

export const MyApplications: React.FC = () => {
  const { jobs, jobInterests, currentUser, navigate, t } = useApp();
  const [activeTab, setActiveTab] = useState<'programmes' | 'jobs'>('programmes');

  // Programme Applications
  const [programmeApps, setProgrammeApps] = useState<any[]>([]);
  const [progLoading, setProgLoading] = useState<boolean>(true);

  // Job Applications
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [jobLoading, setJobLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load Programme Applications
    api.programmes
      .getMyApplications()
      .then(apps => {
        setProgrammeApps(apps || []);
      })
      .catch(err => {
        console.warn('Failed to load programme applications:', err);
      })
      .finally(() => {
        setProgLoading(false);
      });

    // Load Job Applications
    api.jobs
      .myApplications()
      .then(serverApps => {
        if (Array.isArray(serverApps)) {
          setJobApplications(serverApps);
        }
      })
      .catch(err => {
        console.warn('Falling back to local job interests:', err);
        const localApps = jobInterests
          .filter(i => i.userId === currentUser.id)
          .map(interest => {
            const job = jobs.find(j => j.id === interest.jobPostingId);
            return { ...interest, job };
          })
          .filter(item => item.job !== undefined);
        setJobApplications(localApps);
      })
      .finally(() => {
        setJobLoading(false);
      });
  }, [currentUser.id, jobInterests, jobs]);

  const getStatusBadge = (status: string) => {
    const s = (status || 'APPLIED').toUpperCase();
    switch (s) {
      case 'ENROLLED':
      case 'APPROVED':
      case 'SELECTED':
        return (
          <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{s === 'ENROLLED' ? 'Enrolled & Confirmed' : s}</span>
          </span>
        );
      case 'APPLIED':
      case 'SUBMITTED':
        return (
          <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Submitted</span>
          </span>
        );
      case 'UNDER_REVIEW':
      case 'REVIEWED':
        return (
          <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Under Review</span>
          </span>
        );
      case 'SHORTLISTED':
        return (
          <span className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-300 text-purple-900 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Shortlisted</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
        {/* ─── Hero Header ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] to-[#005B46] text-white p-8 shadow-xl border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-emerald-200">
              <Send className="w-3.5 h-3.5 text-amber-300" /> Application Tracking Center
            </div>
            <h1 className="text-3xl font-black tracking-tight">My Applications</h1>
            <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
              Track your admission status for NCCT institutional programmes and employment applications submitted across state cooperative federations.
            </p>
          </div>
        </div>

        {/* ─── Navigation Tabs ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-slate-200/80">
          <button
            onClick={() => setActiveTab('programmes')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'programmes'
                ? 'border-[#005B46] text-[#005B46]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Programme Admissions</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
              {programmeApps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'jobs'
                ? 'border-[#005B46] text-[#005B46]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Opportunities</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              {jobApplications.length}
            </span>
          </button>
        </div>

        {/* ─── TAB 1: NCCT PROGRAMME ADMISSION APPLICATIONS ─────────────────── */}
        {activeTab === 'programmes' && (
          <div className="space-y-4">
            {progLoading ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading Programme Applications...</p>
              </div>
            ) : programmeApps.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
                <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No programme applications yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Explore our premier diplomas and executive programmes in the Programme Catalogue and apply instantly via your Document Vault.
                </p>
                <button
                  onClick={() => navigate('/trainee/programmes')}
                  className="px-5 py-2.5 rounded-xl bg-[#005B46] text-white text-xs font-bold hover:bg-[#004736] cursor-pointer"
                >
                  Browse Programme Catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {programmeApps.map(app => (
                  <div
                    key={app.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {app.programme?.programmeType?.name || 'NCCT Programme'}
                          </span>
                          <span className="text-xs text-slate-400">
                            Applied {new Date(app.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                          {app.programme?.title}
                        </h3>
                      </div>

                      <div>{getStatusBadge(app.status)}</div>
                    </div>

                    {/* Metadata Ribbon */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Assigned Batch</span>
                        <strong className="text-slate-800">{app.batch?.name || 'Batch 2026-A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Eligibility Verification</span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {app.eligibilityResult || 'ELIGIBLE'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Hostel Accommodation</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-amber-600" />
                          {app.hostelRequired ? `Requested (${app.hostelStatus})` : 'Not Requested'}
                        </span>
                      </div>
                    </div>

                    {/* Consented Documents */}
                    {app.consentedDocs?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5" /> Consented Vault Docs:
                        </span>
                        {app.consentedDocs.map((cd: any) => (
                          <span
                            key={cd.id}
                            className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                          >
                            {cd.document?.documentType?.replace(/_/g, ' ') || 'Document'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/trainee/programmes/${app.programmeId}`)}
                        className="text-xs font-bold text-[#005B46] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        View Programme Details <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {app.status === 'ENROLLED' && (
                        <button
                          onClick={() => navigate('/trainee/timetable')}
                          className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-[#005B46] text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> View Timetable Schedule
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: EMPLOYMENT & JOB APPLICATIONS ─────────────────────────── */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {jobLoading ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading Job Applications...</p>
              </div>
            ) : jobApplications.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
                <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No job applications submitted yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse verified openings posted by Amul, KMF, IFFCO, and State Cooperative Central Banks.
                </p>
                <button
                  onClick={() => navigate('/trainee/jobs')}
                  className="px-5 py-2.5 rounded-xl bg-[#005B46] text-white text-xs font-bold hover:bg-[#004736] cursor-pointer"
                >
                  Browse Job Openings
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobApplications.map(app => (
                  <div
                    key={app.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">
                          {app.job?.employerName || 'Cooperative Federation'}
                        </span>
                        <h3 className="text-base font-black text-slate-900 leading-snug">
                          {app.job?.title || 'Position'}
                        </h3>
                      </div>
                      <div>{getStatusBadge(app.status)}</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {app.job?.location}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> {app.job?.salaryRange}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default MyApplications;
