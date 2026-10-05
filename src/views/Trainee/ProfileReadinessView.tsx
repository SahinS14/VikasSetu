import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  FolderKanban,
  UserCheck,
  Sparkles,
  Camera,
  GraduationCap,
  Building2,
  FileSpreadsheet,
  Award,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export const ProfileReadinessView: React.FC = () => {
  const { navigate } = useApp();
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReadiness();
  }, []);

  const loadReadiness = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.vault.getReadiness();
      setReadiness(data);
    } catch (err: any) {
      console.error('Failed to load profile readiness:', err);
      setError(err.message || 'Could not load readiness score.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Evaluating Profile Readiness & Document Health...</p>
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3 bg-rose-50 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-xs text-rose-800">{error || 'Unable to compute readiness.'}</p>
        <button
          onClick={loadReadiness}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const score = readiness.readinessScore || 0;
  const isHigh = score >= 80;
  const isModerate = score >= 50 && score < 80;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-24">
      {/* ─── Hero Readiness Score Gauge ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] via-[#005B46] to-[#0D7A5F] text-white p-8 md:p-10 shadow-xl border border-emerald-700/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> NCCT Admission Readiness Index
            </span>
            <h1 className="text-3xl font-black tracking-tight">Trainee Profile Readiness</h1>
            <p className="text-xs md:text-sm text-emerald-100 leading-relaxed">
              Higher readiness guarantees automated instant eligibility approval across all NCCT Postgraduate Diplomas, HDCM, and Sectoral Training Programmes without manual administrative hold-ups.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <button
                onClick={() => navigate('/trainee/programmes')}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                Browse Eligible Programmes <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/trainee/documents')}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FolderKanban className="w-3.5 h-3.5" /> Document Vault
              </button>
            </div>
          </div>

          {/* Circular Score Visualizer */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner w-52 h-52 shrink-0">
            <div className="text-5xl font-black tracking-tighter text-white">
              {score}%
            </div>
            <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isHigh ? 'bg-emerald-400 text-emerald-950' : isModerate ? 'bg-amber-400 text-amber-950' : 'bg-rose-400 text-rose-950'
            }`}>
              {isHigh ? 'High Readiness' : isModerate ? 'Moderate Readiness' : 'Action Required'}
            </div>
            <span className="text-[10px] text-emerald-200 mt-2 text-center">
              {readiness.verifiedDocumentsCount} of {readiness.totalDocuments} Vault Files Verified
            </span>
          </div>
        </div>
      </div>

      {/* ─── Itemized Checklist ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" /> Verification & Compliance Checklist
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete the pending checklist items below to achieve 100% eligibility score.
          </p>
        </div>

        <div className="space-y-3">
          {readiness.checklist?.map((item: any) => {
            const isVerified = item.status === 'VERIFIED';
            const isPending = item.status === 'PENDING';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isVerified
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isPending
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {isVerified ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : isPending ? (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : isPending
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.status}
                  </span>

                  {!isVerified && (
                    <button
                      onClick={() => navigate(item.actionUrl || '/trainee/documents')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#005B46] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      Complete <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileReadinessView;
