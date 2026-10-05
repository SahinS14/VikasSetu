import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Layers,
  GraduationCap,
  Building2,
  Sparkles,
  BedDouble,
  ShieldCheck,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export const ProgrammeCatalogView: React.FC = () => {
  const { navigate } = useApp();
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  useEffect(() => {
    loadData();
  }, [selectedType, selectedMode, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [typeData, progData] = await Promise.all([
        api.programmes.getTypes().catch(() => []),
        api.programmes.getAll({
          search: searchTerm || undefined,
          programmeTypeCode: selectedType !== 'all' ? selectedType : undefined,
          deliveryMode: selectedMode !== 'all' ? selectedMode : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        }),
      ]);
      setTypes(typeData || []);
      setProgrammes(progData?.data || []);
    } catch (err: any) {
      console.error('Failed to load programmes catalogue:', err);
      setError(err.message || 'Could not load programme catalogue. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'ON_SITE':
        return { label: 'Physical On-Site', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'BLENDED':
        return { label: 'Blended / Hybrid', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'CORRESPONDENCE_WITH_CONTACT_CLASSES':
        return { label: 'Contact Classes', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'SHORT_TERM_ON_SITE':
        return { label: 'Short-Term On-Site', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'FULLY_ONLINE':
        return { label: 'Fully Online', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: mode || 'On-Site', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const getTypeColor = (code: string) => {
    switch (code) {
      case 'PGDM':
        return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white';
      case 'HDCM':
        return 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white';
      case 'MDP':
        return 'bg-gradient-to-r from-purple-600 to-violet-700 text-white';
      case 'SECTORAL_DIPLOMA':
        return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white';
      case 'SHORT_TERM':
        return 'bg-gradient-to-r from-cyan-600 to-sky-700 text-white';
      default:
        return 'bg-gradient-to-r from-slate-700 to-slate-800 text-white';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* ─── Hero Banner ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] via-[#005B46] to-[#0D7A5F] text-white p-8 md:p-10 shadow-xl border border-emerald-700/40">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-24 bottom-0 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            National Council for Cooperative Training (NCCT)
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Institutional Programme Catalogue
          </h1>
          <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
            Explore premier postgraduate diplomas, higher diplomas, sectoral certifications, and executive development programmes conducted across VAMNICOM and 19 regional institutes.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-emerald-200">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Automated Eligibility Verification
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
              <Layers className="w-4 h-4 text-cyan-400" /> Reusable Document Vault
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
              <BedDouble className="w-4 h-4 text-amber-400" /> Integrated Hostel Requests
            </span>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search programmes by title, specialization, or keyword..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </form>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold pr-2">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Programme Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Programme Types</option>
            {types.map((t) => (
              <option key={t.id} value={t.code}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>

          {/* Delivery Mode Selector */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Delivery Modes</option>
            <option value="ON_SITE">Physical On-Site</option>
            <option value="BLENDED">Blended / Hybrid</option>
            <option value="CORRESPONDENCE_WITH_CONTACT_CLASSES">Correspondence + Contact Classes</option>
            <option value="SHORT_TERM_ON_SITE">Short-Term On-Site</option>
            <option value="FULLY_ONLINE">Fully Online</option>
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="active">Active & Open</option>
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>

          {(searchTerm || selectedType !== 'all' || selectedMode !== 'all' || selectedStatus !== 'active') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedMode('all');
                setSelectedStatus('active');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ─── Programmes Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Fetching NCCT Institutional Offerings...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600" /> Failed to load programmes
          </div>
          <p>{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : programmes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <Compass className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No programmes found matching your filters</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search criteria or selecting a different programme type.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programmes.map((p) => {
            const modeInfo = getModeBadge(p.deliveryMode);
            const typeCode = p.programmeType?.code || 'NCCT';
            const rule = p.eligibilityRule;

            return (
              <div
                key={p.id}
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Header Strip with Programme Type */}
                <div className={`p-4 ${getTypeColor(typeCode)} flex items-center justify-between`}>
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4" />
                    {p.programmeType?.name || typeCode}
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full uppercase">
                    {p.academicYear || '2026-27'}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col space-y-4">
                  {/* Delivery Mode & Hostel Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${modeInfo.color}`}>
                      {modeInfo.label}
                    </span>
                    {p.hostelStatus && p.hostelStatus !== 'NOT_AVAILABLE' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <BedDouble className="w-3 h-3" /> Hostel {p.hostelStatus === 'MANDATORY' ? 'Mandatory' : 'Available'}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-[#005B46] transition-colors line-clamp-2">
                      {p.title}
                    </h3>
                    {p.titleHi && (
                      <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">
                        {p.titleHi}
                      </p>
                    )}
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed flex-1">
                    {p.description}
                  </p>

                  {/* Key Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.durationValue} {p.durationUnit?.toLowerCase() || 'weeks'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>VAMNICOM / Pune</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">
                        {p.fee > 0 ? `₹${p.fee.toLocaleString('en-IN')}` : 'Sponsored / Free'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Starts {new Date(p.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Eligibility Teaser */}
                  {rule && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Eligibility:
                      </div>
                      <p className="text-slate-600">
                        {rule.minimumQualification || 'Graduation'}
                        {rule.minimumPercentage ? ` (Min ${rule.minimumPercentage}%)` : ''}
                        {rule.experienceRequired ? ` • ${rule.experienceYears} yr(s) exp.` : ''}
                      </p>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/trainee/programmes/${p.id}`)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#005B46] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
                    >
                      <span>View Details & Apply</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgrammeCatalogView;
