import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Building2,
  Users,
  Award,
  Briefcase,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Database,
  CheckCircle2,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';
import { api, NationalDashboardData } from '../../lib/api';

export const SuperAdminDashboard: React.FC = () => {
  const { t } = useApp();

  const [dashboardData, setDashboardData] = useState<NationalDashboardData | null>(() => {
    try {
      const cached = localStorage.getItem('ss_national_dash_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!dashboardData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem('ss_national_dash_cache');
        if (cached) {
          setDashboardData(JSON.parse(cached));
          setError(null);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      } catch {}
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await api.national.getDashboard();
      setDashboardData(res);
      try {
        localStorage.setItem('ss_national_dash_cache', JSON.stringify(res));
      } catch {}
    } catch (err: any) {
      console.warn('Failed to load national dashboard analytics, checking cache:', err);
      try {
        const cached = localStorage.getItem('ss_national_dash_cache');
        if (cached) {
          setDashboardData(JSON.parse(cached));
          setError(null);
          return;
        }
      } catch {}
      setError(err?.message || 'Unable to load national analytics from database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Format timestamp
  const formatSyncTime = (isoString?: string) => {
    if (!isoString) return 'Just Now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Connected';
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">
        
        {/* National Banner */}
        <div className="bg-gradient-to-r from-govTeal-900 via-govTeal-800 to-govTeal-700 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-govTeal-600 space-y-3 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-md text-xs font-bold text-saffron-300">
                National NCCT Central Registry
              </span>
              <SimulatedBadge text="Ministry of Cooperation Analytics" className="bg-white/10 text-amber-200 border-white/20" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-govTeal-100 font-mono flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                <Database className="w-3.5 h-3.5 text-emerald-300" />
                {dashboardData ? (
                  <>Last Sync: {formatSyncTime(dashboardData.summary.lastSync)} ({dashboardData.summary.activeInstitutes} Nodes Connected)</>
                ) : (
                  <>Connecting to PostgreSQL Hub...</>
                )}
              </span>

              <button
                onClick={() => fetchDashboardData(true)}
                disabled={isLoading || isRefreshing}
                title="Refresh from PostgreSQL Database"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-semibold text-white rounded-lg transition-all border border-white/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight relative z-10">
            {t.analytics.title}
          </h2>
          <p className="text-sm text-govTeal-100 max-w-2xl relative z-10">
            {t.analytics.subtitle}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-red-950">Unable to load national analytics</h4>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchDashboardData(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Headline Metric Cards */}
        {isLoading && !dashboardData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-govText-border shadow-sm space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="w-9 h-9 bg-gray-200 rounded-xl" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-36 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : dashboardData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Certified Trainees */}
            <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-sm space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider">{t.analytics.totalTrainees}</span>
                <div className="w-9 h-9 rounded-xl bg-govTeal-50 flex items-center justify-center text-govTeal-700">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-govText-primary">
                {dashboardData.summary.totalCertifiedTrainees.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified in PostgreSQL Database</span>
              </p>
            </div>

            {/* Card 2: Active NCCT Institutes */}
            <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-sm space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider">{t.analytics.activeInstitutes}</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-govText-primary">
                {dashboardData.summary.activeInstitutes} / {dashboardData.summary.totalInstitutes}
              </p>
              <p className="text-[11px] text-govTeal-800 font-semibold">
                {dashboardData.summary.instituteTypeBreakdown}
              </p>
            </div>

            {/* Card 3: Certificates Generated */}
            <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-sm space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider">{t.analytics.certsIssued}</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-govText-primary">
                {dashboardData.summary.certificatesGenerated.toLocaleString()}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold">
                Cryptographically Verifiable
              </p>
            </div>

            {/* Card 4: Employer Placements Initiated */}
            <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-sm space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-govText-muted">
                <span className="text-xs font-bold uppercase tracking-wider">{t.analytics.jobPlacements}</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-govText-primary">
                {dashboardData.summary.employerPlacementsInitiated.toLocaleString()}
              </p>
              <p className="text-[11px] text-purple-700 font-semibold">
                {dashboardData.summary.placementsSubtext}
              </p>
            </div>

          </div>
        ) : null}

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart 1: Trainees by Institute Type (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-govText-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-govText-primary">
                  {t.analytics.trainingsByInstitute}
                </h3>
                <p className="text-xs text-govText-secondary">
                  Capacity utilization across VAMNICOM, RICMs, and ICMs
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              {isLoading && !dashboardData ? (
                <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
                  Loading Institute Data...
                </div>
              ) : dashboardData && dashboardData.instituteTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.instituteTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #DCE4DF', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="count" name="Enrolled Trainees" fill="#0B6E4F" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="capacity" name="Total Sanctioned Capacity" fill="#E68A2E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-govText-secondary">
                  No institute training data available
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Top Skills in Demand (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-govText-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-govText-primary">
                  {t.analytics.employerDemand}
                </h3>
                <p className="text-xs text-govText-secondary">
                  Recruitment focus of cooperative federations
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              {isLoading && !dashboardData ? (
                <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
                  Loading Skills Data...
                </div>
              ) : dashboardData && dashboardData.skillDemandData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.skillDemandData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dashboardData.skillDemandData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val}% (${(item as any)?.payload?.count || 0} Openings)`,
                        'Demand Share'
                      ]}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-govText-secondary">
                  No employment skill data available
                </div>
              )}
            </div>
          </div>

          {/* Chart 3: Monthly Certification Issuance Trend (12 cols) */}
          <div className="lg:col-span-12 bg-white rounded-2xl p-6 border border-govText-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-govText-primary">
                  {t.analytics.monthlyCertTrends}
                </h3>
                <p className="text-xs text-govText-secondary">
                  Verifiable certificates issued & average biometric attendance fidelity (%)
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              {isLoading && !dashboardData ? (
                <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
                  Loading Certification Trend...
                </div>
              ) : dashboardData && dashboardData.monthlyCertData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.monthlyCertData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="certGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0B6E4F" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0B6E4F" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #DCE4DF', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="certs" name="Certificates Issued" stroke="#0B6E4F" strokeWidth={2.5} fillOpacity={1} fill="url(#certGrad)" />
                    {dashboardData.attendance.biometricRate !== null && (
                      <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate (%)" stroke="#E68A2E" strokeWidth={2} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-govText-secondary">
                  No certificates issued yet
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </PageContainer>
  );
};

export default SuperAdminDashboard;
