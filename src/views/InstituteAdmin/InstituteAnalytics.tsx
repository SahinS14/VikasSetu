import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Layers,
  Calendar,
  CheckCircle2,
  Building2,
  RefreshCw,
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import api from '../../lib/api';

interface AnalyticsPayload {
  institute: {
    id: string;
    name: string;
    city: string;
    state: string;
    capacity: number;
  };
  stats: {
    totalTrainees: number;
    activeProgrammes: number;
    totalProgrammes: number;
    completedCourses: number;
    averageProgress: number;
    certificatesIssued: number;
    attendanceRate: number;
    totalSessions: number;
  };
  programmes: Array<{
    id: string;
    title: string;
    status: string;
    capacity: number;
    enrolledCount: number;
    nominationsCount: number;
  }>;
  cooperativesCount: number;
}

export const InstituteAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.institute.getAnalytics();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load institute analytics:', err);
      setError(err.message || 'Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-pulse pb-16">
          <div className="bg-gray-200 h-28 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-200 h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-gray-200 h-80 rounded-2xl" />
            <div className="bg-gray-200 h-80 rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error && !data) {
    return (
      <PageContainer>
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Unable to load analytics</h3>
          <p className="text-xs text-gray-600">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  const { institute, stats, programmes, cooperativesCount } = data!;

  const programmeChartData = programmes.map(p => ({
    name: p.title.length > 25 ? p.title.substring(0, 23) + '...' : p.title,
    fullName: p.title,
    Enrolled: p.enrolledCount,
    Capacity: p.capacity,
    Nominations: p.nominationsCount,
  }));

  const COLORS = ['#007769', '#FF9933', '#138808', '#2563EB', '#7C3AED'];

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">

        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                Institutional Intelligence
              </span>
              <SimulatedBadge text="NCCT Database Analytics" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1 leading-snug">
              {institute.name} — Analytics
            </h2>
            <p className="text-xs text-govText-secondary mt-1 leading-relaxed">
              Performance metrics, enrollment distribution, and certification intelligence from Supabase PostgreSQL.
            </p>
          </div>

          <button
            onClick={() => fetchAnalytics()}
            className="px-3 py-2 bg-govBg hover:bg-gray-200 text-govText-primary border border-govText-border rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-govText-muted">
              <span className="text-xs font-bold uppercase tracking-wider">Active Trainees</span>
              <div className="w-8 h-8 rounded-lg bg-govTeal-50 text-govTeal-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-govText-primary">{stats.totalTrainees}</p>
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Campus Capacity: {institute.capacity}</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-govText-muted">
              <span className="text-xs font-bold uppercase tracking-wider">Active Programmes</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-govText-primary">
              {stats.activeProgrammes} <span className="text-xs font-normal text-gray-500">/ {stats.totalProgrammes} total</span>
            </p>
            <p className="text-[11px] text-blue-700 font-semibold">
              Live & Residential Batches
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-govText-muted">
              <span className="text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-govText-primary">{stats.attendanceRate}%</p>
            <p className="text-[11px] text-purple-700 font-semibold">
              Across {stats.totalSessions} sessions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-govText-muted">
              <span className="text-xs font-bold uppercase tracking-wider">Certificates Issued</span>
              <div className="w-8 h-8 rounded-lg bg-saffron-50 text-saffron-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-saffron-900">{stats.certificatesIssued}</p>
            <p className="text-[11px] text-saffron-700 font-semibold">
              {cooperativesCount} Cooperative Societies Linkage
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Programme Capacity vs Enrolled */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-govText-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-govText-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-govTeal-600" />
                <span>Programme Capacity & Enrollment Distribution</span>
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">Real-Time Database</span>
            </div>

            <div className="h-64 sm:h-72 w-full">
              {programmeChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No programmes recorded for this institute.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={programmeChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200 text-xs space-y-1">
                              <p className="font-bold text-gray-900">{item.fullName}</p>
                              <p className="text-emerald-700">Enrolled: {item.Enrolled}</p>
                              <p className="text-gray-600">Capacity: {item.Capacity}</p>
                              <p className="text-blue-600">Nominations: {item.Nominations}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Enrolled" fill="#007769" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Capacity" fill="#D1D5DB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Academic Completion Breakdown */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-govText-border shadow-sm space-y-4 flex flex-col justify-between">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-govText-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Curriculum Progress & Completion</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Average modular milestone completion</p>
            </div>

            <div className="space-y-4 py-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Overall Curriculum Progress</span>
                  <span className="text-govTeal-700 font-bold">{stats.averageProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-govTeal-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.averageProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Attendance Reliability</span>
                  <span className="text-purple-700 font-bold">{stats.attendanceRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-govBg rounded-xl border border-gray-200 text-xs space-y-1.5">
                <span className="font-bold text-gray-900 block">PACS Workforce Impact</span>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Trainees from over <strong className="text-gray-900">{cooperativesCount} primary cooperative societies</strong> have participated in training at this node.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
              Source: VAMNICOM ERP Supabase Instance
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
