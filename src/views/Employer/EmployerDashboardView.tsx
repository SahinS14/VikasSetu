import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Award,
  Send,
  Plus,
  ArrowRight,
  Sparkles,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  PhoneCall,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { PageContainer } from '../../components/layout/PageContainer';
import { GlobalModal } from '../../components/common/GlobalModal';

// ─── Skeleton loading cell ────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─── Types from the API response ─────────────────────────────────────────────
interface CandidateInterest {
  id: string;
  userId: string;
  jobPostingId: string;
  traineeName: string;
  traineeEmail: string;
  cooperativeAffiliation: string | null;
  jobTitle: string;
  matchScore: number;
  eligibilityStatus: string;
  status: string;
  timestamp: string;
  appliedAt: string;
}

interface ActiveJob {
  id: string;
  title: string;
  location: string;
  type: string;
  openingsCount: number;
  interestCount: number;
  postedDate: string;
  status: string;
}

interface TalentPool {
  label: string;
  badge: string;
  count: number;
  category: string;
}

interface DashboardData {
  employer: {
    id: string;
    name: string;
    email: string;
    cooperativeAffiliation: string | null;
  };
  summary: {
    activeJobPostings: number;
    totalCandidateInterests: number;
    certifiedTalentPool: number;
    candidatesContacted: number;
  };
  recentCandidateInterests: CandidateInterest[];
  activeJobs: ActiveJob[];
  talentPools: TalentPool[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export const EmployerDashboardView: React.FC = () => {
  const { currentUser, navigate } = useApp();

  // ─── Data state ────────────────────────────────────────────────────────────
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Contact modal state ────────────────────────────────────────────────────
  const [selectedInterest, setSelectedInterest] = useState<CandidateInterest | null>(null);
  const [contacting, setContacting] = useState(false);
  const [outreachSent, setOutreachSent] = useState(false);

  // ─── Fetch dashboard data ───────────────────────────────────────────────────
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else { setLoading(true); setError(null); }

    try {
      const result = await api.employer.getDashboard();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ─── Contact candidate ──────────────────────────────────────────────────────
  const handleSendOutreach = async () => {
    if (!selectedInterest) return;
    setContacting(true);
    try {
      await api.employer.contactCandidate({
        jobInterestId: selectedInterest.id,
        candidateUserId: selectedInterest.userId,
        jobTitle: selectedInterest.jobTitle,
      });
      setOutreachSent(true);
      // Refresh metrics to reflect candidatesContacted increment
      setTimeout(() => {
        setSelectedInterest(null);
        fetchDashboard(true);
      }, 1600);
    } catch (err: any) {
      alert(err.message || 'Failed to send outreach. Please try again.');
    } finally {
      setContacting(false);
    }
  };

  // ─── Stat cards ─────────────────────────────────────────────────────────────
  const stats = data
    ? [
        {
          label: 'Active Job Postings',
          value: data.summary.activeJobPostings,
          icon: Briefcase,
          color: 'saffron',
          iconBg: 'bg-saffron-50 text-saffron-600',
          subLabel: 'Open cooperative positions',
          action: () => navigate('jobs'),
          actionLabel: 'Manage →',
        },
        {
          label: 'Total Candidate Interests',
          value: data.summary.totalCandidateInterests,
          icon: Send,
          color: 'blue',
          iconBg: 'bg-blue-50 text-blue-600',
          subLabel: 'Direct expressions of interest',
          action: () => navigate('jobs'),
          actionLabel: 'View →',
        },
        {
          label: 'Certified Talent Pool',
          value: data.summary.certifiedTalentPool,
          icon: Award,
          color: 'emerald',
          iconBg: 'bg-emerald-50 text-emerald-600',
          subLabel: 'Verified NCCT graduates',
          action: () => navigate('trainee_directory'),
          actionLabel: 'Browse →',
        },
        {
          label: 'Candidates Contacted',
          value: data.summary.candidatesContacted,
          icon: PhoneCall,
          color: 'purple',
          iconBg: 'bg-purple-50 text-purple-600',
          subLabel: 'Interviews & shortlisted this cycle',
          action: null,
          actionLabel: null,
        },
      ]
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <div className="space-y-5 sm:space-y-6 animate-fadeIn pb-16 min-w-0">

        {/* 1. Welcome Banner */}
        <div className="bg-gradient-to-r from-govTeal-900 via-govTeal-800 to-govTeal-700 text-white p-5 sm:p-8 rounded-2xl shadow-md border border-govTeal-600 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-md text-xs font-bold text-saffron-300">
                Cooperative Recruiter Portal
              </span>
              {data?.employer.cooperativeAffiliation && (
                <span className="px-2 py-0.5 bg-white/10 text-amber-200 border border-white/20 rounded text-[10px] font-bold">
                  {data.employer.cooperativeAffiliation}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-govTeal-100 font-mono">
                Recruitment Cycle 2025–26 • NCCT National Registry
              </span>
              <button
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
                title="Refresh dashboard"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <h1 className="text-[22px] sm:text-3xl font-extrabold tracking-tight leading-tight break-words">
                Welcome, {data?.employer.name || currentUser.name || 'Recruiter'}
              </h1>
              <p className="text-xs sm:text-sm text-govTeal-100 leading-relaxed">
                {data?.employer.cooperativeAffiliation
                  ? `Talent Acquisition · ${data.employer.cooperativeAffiliation}`
                  : 'Manage postings and access certified talent from NCCT institutions.'
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => navigate('jobs_new')}
                className="min-h-[44px] px-4 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Post New Opening</span>
              </button>

              <button
                onClick={() => navigate('trainee_directory')}
                className="min-h-[44px] px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs border border-white/30 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <Users className="w-4 h-4 text-saffron-300 flex-shrink-0" />
                <span>Browse Candidates</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => fetchDashboard()}
              className="text-xs font-bold underline text-red-700 hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="w-9 h-9 rounded-xl" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))
            : stats?.map(stat => (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs space-y-2 hover:border-govTeal-300 transition-all"
                >
                  <div className="flex items-center justify-between text-govText-muted">
                    <span className="text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold text-govText-primary">
                    {stat.value}
                  </p>
                  <p className="text-[11px] font-semibold flex items-center justify-between text-govText-secondary">
                    <span>{stat.subLabel}</span>
                    {stat.action && (
                      <button
                        onClick={stat.action}
                        className="text-xs font-bold text-govTeal-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        {stat.actionLabel}
                      </button>
                    )}
                  </p>
                </div>
              ))
          }
        </div>

        {/* 3. Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">

          {/* Left Column: Recent Candidate Interests */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-govText-border shadow-xs p-5 sm:p-6 space-y-4 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-govTeal-600" />
                <h2 className="font-bold text-base text-govText-primary">
                  Recent Candidate Interests Received
                </h2>
              </div>
              <button
                onClick={() => navigate('jobs')}
                className="text-xs font-bold text-govTeal-600 hover:text-govTeal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({data?.summary.totalCandidateInterests ?? 0})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 bg-govBg space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : !data || data.recentCandidateInterests.length === 0 ? (
              <div className="py-12 text-center text-xs text-govText-muted space-y-2">
                <Users className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-semibold">No candidate expressions of interest received yet.</p>
                <p className="text-[11px]">When trainees apply from the Trainee portal, they will appear here instantly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentCandidateInterests.slice(0, 3).map(interest => (
                  <div
                    key={interest.id}
                    className="p-4 rounded-xl border border-gray-200 bg-govBg hover:border-govTeal-300 transition-all flex flex-col gap-3"
                  >
                    {/* Top row: name + status badge */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-govText-primary break-words">
                            {interest.traineeName}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex-shrink-0 ${
                            interest.status === 'INTERVIEW' ? 'bg-purple-100 text-purple-800' :
                            interest.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                            interest.status === 'SELECTED' ? 'bg-emerald-100 text-emerald-800' :
                            interest.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-govTeal-100 text-govTeal-800'
                          }`}>
                            {interest.status}
                          </span>
                          {interest.matchScore > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 flex items-center gap-0.5 flex-shrink-0">
                              <TrendingUp className="w-2.5 h-2.5" />
                              {interest.matchScore}% match
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-govTeal-700 font-medium flex items-start gap-1">
                          <Briefcase className="w-3 h-3 text-govTeal-600 flex-shrink-0 mt-0.5" />
                          <span>
                            <span className="font-semibold">Applied for: </span>
                            <span className="break-words">{interest.jobTitle}</span>
                          </span>
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-govText-secondary">
                          {interest.cooperativeAffiliation && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span>{interest.cooperativeAffiliation}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span>{interest.timestamp}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact button */}
                    <button
                      onClick={() => {
                        setSelectedInterest(interest);
                        setOutreachSent(false);
                      }}
                      disabled={interest.status === 'INTERVIEW' || interest.status === 'SELECTED'}
                      className="min-h-[44px] w-full sm:w-auto self-start sm:self-center px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>
                        {interest.status === 'INTERVIEW' ? 'Interview Sent' :
                         interest.status === 'SELECTED' ? 'Selected' :
                         'Contact Trainee'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Quick Actions + Talent Pools */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-govText-border shadow-xs p-5 space-y-3">
              <h3 className="font-bold text-sm text-govText-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-saffron-500" />
                <span>Recruiter Quick Actions</span>
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('jobs_new')}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-govTeal-400 bg-govBg hover:bg-govTeal-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-saffron-100 text-saffron-800 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-govText-primary">Post New Opening</div>
                      <div className="text-[10px] text-govText-muted">Publish AMCS or ERP positions</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-govTeal-700 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => navigate('trainee_directory')}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-govTeal-400 bg-govBg hover:bg-govTeal-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-govTeal-100 text-govTeal-800 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-govText-primary">Search Certified Talent</div>
                      <div className="text-[10px] text-govText-muted">Filter by institute & credential</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-govTeal-700 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => navigate('jobs')}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-govTeal-400 bg-govBg hover:bg-govTeal-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-govText-primary">
                        Manage Openings ({loading ? '…' : (data?.summary.activeJobPostings ?? 0)})
                      </div>
                      <div className="text-[10px] text-govText-muted">View applicants & toggle status</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-govTeal-700 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* National Talent Pools */}
            <div className="bg-white rounded-2xl border border-govText-border shadow-xs p-5 space-y-3">
              <h3 className="font-bold text-sm text-govText-primary flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-govTeal-600" />
                <span>National Talent Pools</span>
              </h3>

              <div className="space-y-2 text-xs">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-govBg border border-gray-200 flex items-center justify-between gap-2">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-4 w-20 rounded" />
                      </div>
                    ))
                  : (data?.talentPools ?? []).map(pool => (
                      <div key={pool.label} className="p-2.5 rounded-lg bg-govBg border border-gray-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-govText-primary">{pool.label}</span>
                          {pool.count > 0 && (
                            <div className="text-[10px] text-govText-muted">{pool.count} certified</div>
                          )}
                        </div>
                        <span className="font-bold text-govTeal-800 bg-govTeal-100 px-2 py-0.5 rounded text-[10px] flex-shrink-0">
                          {pool.badge}
                        </span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        <GlobalModal
          isOpen={selectedInterest !== null}
          onClose={() => setSelectedInterest(null)}
          maxWidth="max-w-md"
          ariaLabel="Contact Candidate"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-govText-primary">
                Contact Candidate
              </h3>
              <button
                onClick={() => setSelectedInterest(null)}
                className="text-xs text-govText-muted hover:text-govText-primary"
              >
                Close
              </button>
            </div>

            {outreachSent ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-govText-primary">Outreach Dispatched</p>
                <p className="text-[11px] text-govText-secondary">
                  {selectedInterest?.traineeName} has been invited for an interview.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-govText-secondary">
                  Send direct recruitment outreach to{' '}
                  <span className="font-bold text-govText-primary">{selectedInterest?.traineeName}</span>{' '}
                  regarding the opening{' '}
                  <span className="font-bold text-govTeal-700">{selectedInterest?.jobTitle}</span>.
                </p>

                <div className="bg-govBg p-3 rounded-lg border border-gray-200 space-y-1.5">
                  <div><span className="font-semibold">Candidate:</span> {selectedInterest?.traineeName}</div>
                  <div><span className="font-semibold">Email:</span> {selectedInterest?.traineeEmail}</div>
                  {selectedInterest?.cooperativeAffiliation && (
                    <div><span className="font-semibold">Cooperative:</span> {selectedInterest.cooperativeAffiliation}</div>
                  )}
                  {selectedInterest?.matchScore && selectedInterest.matchScore > 0 && (
                    <div><span className="font-semibold">Match Score:</span> {selectedInterest.matchScore}%</div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedInterest(null)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendOutreach}
                    disabled={contacting}
                    className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 disabled:bg-govTeal-400 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {contacting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>{contacting ? 'Sending…' : 'Send Interview Call'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlobalModal>
      </div>
    </PageContainer>
  );
};
