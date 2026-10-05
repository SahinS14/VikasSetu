import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Award,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';
import api from '../../lib/api';

export interface RegistryCredential {
  id: string;
  courseName: string;
  certificateId: string;
  certificateNumber: string;
  token: string | null;
  status: string;
  grade: string;
  issueDate: string;
}

export interface RegistryEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  status: string;
  enrolledDate: string;
}

export interface RegistryTrainee {
  id: string;
  name: string;
  nameHi?: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  cooperativeOrganization?: string;
  institute: {
    id: string;
    name: string;
  };
  ekyc: {
    status: 'VERIFIED' | 'PENDING' | 'NOT_VERIFIED';
    verified: boolean;
    maskedAadhaar: string;
  };
  credentials: RegistryCredential[];
  enrollmentStatus: string;
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  averageProgress: number;
  enrollments: RegistryEnrollment[];
  publicProfile?: {
    education?: string;
    qualification?: string;
    location?: string;
    experienceYears?: number;
    skills?: any;
    preferredLocation?: string;
  } | null;
}

interface InstituteOption {
  id: string;
  name: string;
}

export const TraineeDirectory: React.FC = () => {
  const { currentUser, navigate } = useApp();

  const [trainees, setTrainees] = useState<RegistryTrainee[]>([]);
  const [institutes, setInstitutes] = useState<InstituteOption[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedInst, setSelectedInst] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<RegistryTrainee | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load institutes list from database
  useEffect(() => {
    let isMounted = true;
    api.institute.getInstitutes()
      .then((data: any[]) => {
        if (isMounted && Array.isArray(data)) {
          setInstitutes(data.map(i => ({ id: i.id, name: i.name })));
        }
      })
      .catch((err) => {
        console.error('Failed to load institutes for dropdown:', err);
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch Trainees from PostgreSQL via Backend API
  const fetchTrainees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.institute.getTrainees({
        search: debouncedSearch || undefined,
        instituteId: selectedInst !== 'all' ? selectedInst : undefined,
        page,
        limit: pageSize,
      });

      if (res && Array.isArray(res.data)) {
        setTrainees(res.data);
        setTotalCount(res.total || 0);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setTrainees([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Error fetching trainees from database:', err);
      setError(err?.message || 'Unable to load trainee registry from server.');
      setTrainees([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedInst, page, pageSize]);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  const handleInstituteChange = (instId: string) => {
    setSelectedInst(instId);
    setPage(1);
  };

  // Helper for e-KYC status badge
  const renderEkycBadge = (ekyc: RegistryTrainee['ekyc']) => {
    if (ekyc.status === 'VERIFIED') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-mono bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold text-[10px] tracking-wider">
            {ekyc.maskedAadhaar || 'XXXX-XXXX-4589'}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Verified
          </span>
        </div>
      );
    }

    if (ekyc.status === 'PENDING') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-mono bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold text-[10px]">
            {ekyc.maskedAadhaar || 'XXXX-XXXX-••••'}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        </div>
      );
    }

    return (
      <span className="font-mono bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded font-medium text-[10px]">
        {ekyc.maskedAadhaar || 'Not Linked'}
      </span>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-16">

        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                National Trainee Registry
              </span>
              <SimulatedBadge text="NCCT Verified Records" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1 leading-snug">
              Cooperative Trainee & PACS Workforce Directory
            </h2>
            <p className="text-xs text-govText-secondary mt-1 leading-relaxed">
              Complete list of enrolled and certified trainees across 20 NCCT institutions.
            </p>
          </div>

          <div className="text-xs font-bold text-govTeal-800 bg-govTeal-50 px-4 py-2 rounded-xl border border-govTeal-200 self-start sm:self-auto flex items-center gap-2">
            <Users className="w-4 h-4 text-govTeal-700" />
            <span>
              {loading && totalCount === 0 ? 'Loading Trainees...' : `${totalCount} Registered Trainees`}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-govText-border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name, email, or primary society..."
              className="w-full px-3.5 py-2 pl-9 rounded-lg border border-govText-border text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 bg-govBg min-h-[40px]"
            />
            <Search className="w-4 h-4 text-govText-muted absolute left-3 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-govTeal-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-govText-secondary whitespace-nowrap">Institute:</span>
            <select
              value={selectedInst}
              onChange={(e) => handleInstituteChange(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600 w-full sm:w-auto min-h-[40px] max-w-[280px] truncate"
            >
              <option value="all">All Institutes</option>
              {institutes.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between gap-3 text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchTrainees()}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Table & Cards Container */}
        <div className="bg-white rounded-2xl border border-govText-border shadow-sm overflow-hidden">
          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-govBg text-govText-secondary uppercase font-semibold border-b border-gray-200">
                  <th className="p-4">Trainee Profile</th>
                  <th className="p-4">Cooperative Society</th>
                  <th className="p-4">Training Institute</th>
                  <th className="p-4">Aadhaar Mock e-KYC</th>
                  <th className="p-4">Credentials</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 bg-gray-200 rounded" />
                            <div className="h-2.5 w-44 bg-gray-100 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><div className="h-3 w-36 bg-gray-200 rounded" /></td>
                      <td className="p-4"><div className="h-3 w-40 bg-gray-200 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
                      <td className="p-4 text-right"><div className="h-6 w-16 bg-gray-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : trainees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-10 h-10 text-gray-300" />
                        <p className="font-semibold text-sm text-govText-primary">No registered trainees found</p>
                        <p className="text-xs text-govText-muted">
                          {searchTerm
                            ? `No records match "${searchTerm}". Try clearing your search.`
                            : 'No trainees are registered under this institute filter yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trainees.map((t) => {
                    const hasCerts = t.credentials && t.credentials.length > 0;
                    return (
                      <tr key={t.id} className="hover:bg-govTeal-50/30 transition-colors">
                        <td className="p-4">
                          <div
                            onClick={() => setSelectedTrainee(t)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <img
                              src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={t.name}
                              className="w-10 h-10 rounded-full object-cover border border-govTeal-600 group-hover:ring-2 group-hover:ring-govTeal-400 transition-all"
                            />
                            <div>
                              <p className="font-bold text-sm text-govText-primary group-hover:text-govTeal-700 transition-colors">
                                {t.name}
                              </p>
                              <p className="text-[11px] text-govText-muted">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-govText-primary">
                          {t.cooperativeOrganization || 'Primary Agricultural Cooperative Society'}
                        </td>
                        <td className="p-4 text-govText-secondary">
                          {t.institute?.name || 'VAMNICOM'}
                        </td>
                        <td className="p-4">
                          {renderEkycBadge(t.ekyc)}
                        </td>
                        <td className="p-4">
                          {hasCerts ? (
                            <div className="flex flex-col gap-1 max-w-[240px]">
                              {t.credentials.map((c) => (
                                <span
                                  key={c.id}
                                  title={`${c.courseName} (Grade: ${c.grade})`}
                                  className="text-[10px] bg-govTeal-50 text-govTeal-900 px-2 py-0.5 rounded font-semibold border border-govTeal-200 truncate inline-block"
                                >
                                  {c.courseName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              {t.enrollmentStatus === 'ENROLLED' || t.enrollmentStatus === 'IN_PROGRESS'
                                ? 'Enrolled'
                                : 'No credentials yet'}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasCerts && (
                              <button
                                onClick={() => navigate('verify_public', { certId: t.credentials[0].certificateId })}
                                className="px-2.5 py-1 bg-saffron-50 hover:bg-saffron-100 text-saffron-900 border border-saffron-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Verify credential on national verification portal"
                              >
                                <Award className="w-3.5 h-3.5 text-saffron-700" />
                                <span>Verify</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTrainee(t)}
                              className="px-2.5 py-1 bg-govBg hover:bg-gray-200 text-govText-primary border border-govText-border rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={`m-skel-${idx}`} className="p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-28 bg-gray-200 rounded" />
                      <div className="h-2.5 w-40 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-16 bg-gray-100 rounded-xl" />
                </div>
              ))
            ) : trainees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-sm">No registered trainees found</p>
                <p className="text-xs text-govText-muted mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              trainees.map((t) => {
                const hasCerts = t.credentials && t.credentials.length > 0;
                return (
                  <div key={t.id} className="p-4 space-y-3">
                    <div
                      onClick={() => setSelectedTrainee(t)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <img
                        src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={t.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-govTeal-600 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-govText-primary truncate">{t.name}</p>
                        <p className="text-xs text-govText-muted truncate mt-0.5">{t.email}</p>
                      </div>
                    </div>

                    <div className="bg-govBg/70 p-3 rounded-xl border border-gray-100 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-govText-muted tracking-wider block">
                          Cooperative Society
                        </span>
                        <span className="font-semibold text-govText-primary">
                          {t.cooperativeOrganization || 'Primary Agricultural Cooperative Society'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-govText-muted tracking-wider block">
                          Training Institute
                        </span>
                        <span className="font-semibold text-govTeal-800">
                          {t.institute?.name || 'VAMNICOM'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-govText-muted tracking-wider block">
                          Aadhaar Mock e-KYC
                        </span>
                        <div className="mt-1">{renderEkycBadge(t.ekyc)}</div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-govText-muted tracking-wider block">
                          Credentials
                        </span>
                        {hasCerts ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {t.credentials.map((c) => (
                              <span
                                key={c.id}
                                className="text-[11px] bg-govTeal-50 text-govTeal-900 px-2 py-0.5 rounded font-semibold border border-govTeal-200"
                              >
                                {c.courseName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            {t.enrollmentStatus === 'ENROLLED' ? 'Enrolled candidate' : 'No credentials yet'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {hasCerts && (
                        <button
                          onClick={() => navigate('verify_public', { certId: t.credentials[0].certificateId })}
                          className="flex-1 py-2.5 bg-saffron-50 hover:bg-saffron-100 text-saffron-900 border border-saffron-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer transition-colors"
                        >
                          <Award className="w-4 h-4 text-saffron-700" />
                          <span>Verify Certificate</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTrainee(t)}
                        className="py-2.5 px-4 bg-govBg hover:bg-gray-200 text-govText-primary border border-govText-border rounded-xl text-xs font-semibold flex items-center justify-center min-h-[44px] cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-govText-secondary">
              <div>
                Showing{' '}
                <span className="font-bold text-govText-primary">
                  {(page - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-govText-primary">
                  {Math.min(page * pageSize, totalCount)}
                </span>{' '}
                of <span className="font-bold text-govText-primary">{totalCount}</span> trainees
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="font-semibold text-xs px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trainee Profile Dossier Modal */}
        {selectedTrainee && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-govText-border animate-slideUp">
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-govTeal-50 border border-govTeal-200 flex items-center justify-center text-govTeal-800">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-govText-primary">Trainee Profile Dossier</h3>
                    <p className="text-xs text-govText-secondary">National Cooperative Trainee Registry Record</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Profile Card Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-govBg border border-gray-200">
                  <img
                    src={selectedTrainee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                    alt={selectedTrainee.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-govTeal-600"
                  />
                  <div className="text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="text-lg font-extrabold text-govText-primary">{selectedTrainee.name}</h4>
                      {renderEkycBadge(selectedTrainee.ekyc)}
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-xs text-govText-secondary">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-govTeal-600" />
                        {selectedTrainee.email}
                      </span>
                      {selectedTrainee.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-govTeal-600" />
                          {selectedTrainee.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cooperative & Institute Affiliation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-govText-muted uppercase">
                      <Briefcase className="w-3.5 h-3.5 text-govTeal-600" />
                      <span>Cooperative Organization</span>
                    </div>
                    <p className="font-semibold text-sm text-govText-primary">
                      {selectedTrainee.cooperativeOrganization}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-govText-muted uppercase">
                      <Building2 className="w-3.5 h-3.5 text-govTeal-600" />
                      <span>Training Institution</span>
                    </div>
                    <p className="font-semibold text-sm text-govTeal-900">
                      {selectedTrainee.institute?.name}
                    </p>
                  </div>
                </div>

                {/* Enrolled Courses & Progress */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-govText-secondary flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-govTeal-600" />
                    <span>Enrolled Programmes & LMS Courses ({selectedTrainee.enrollments?.length || 0})</span>
                  </h5>

                  {selectedTrainee.enrollments && selectedTrainee.enrollments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTrainee.enrollments.map((enr) => (
                        <div
                          key={enr.id}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex-1">
                            <p className="font-bold text-xs text-govText-primary">{enr.courseTitle}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Enrolled on: {enr.enrolledDate}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-govTeal-600 h-2 rounded-full"
                                style={{ width: `${enr.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-govTeal-800 min-w-[36px] text-right">
                              {enr.progressPercent}%
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                enr.status === 'completed' || enr.progressPercent === 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {enr.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg">
                      No active LMS course enrollments recorded for this candidate.
                    </p>
                  )}
                </div>

                {/* Earned Credentials & Certificates */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-govText-secondary flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-saffron-600" />
                    <span>Issued Credentials & Certificates ({selectedTrainee.credentials?.length || 0})</span>
                  </h5>

                  {selectedTrainee.credentials && selectedTrainee.credentials.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTrainee.credentials.map((cert) => (
                        <div
                          key={cert.id}
                          className="p-3 bg-saffron-50/50 border border-saffron-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-bold text-xs text-govText-primary">{cert.courseName}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              ID: <span className="font-mono">{cert.certificateNumber}</span> | Issue Date: {cert.issueDate} | Grade: <span className="font-semibold text-govTeal-800">{cert.grade}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTrainee(null);
                              navigate('verify_public', { certId: cert.certificateId });
                            }}
                            className="px-3 py-1.5 bg-saffron-600 hover:bg-saffron-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify Credential</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg">
                      No certificates issued yet. Certificates are granted upon reaching curriculum completion and passing modular assessments.
                    </p>
                  )}
                </div>

                {/* Skills & Public Profile */}
                {selectedTrainee.publicProfile && (
                  <div className="p-4 bg-govBg rounded-xl border border-gray-200 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-govText-primary">
                      <GraduationCap className="w-4 h-4 text-govTeal-600" />
                      <span>Qualifications & Professional Competencies</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
                      <div>
                        <span className="font-semibold">Education:</span> {selectedTrainee.publicProfile.education || 'Graduate'}
                      </div>
                      <div>
                        <span className="font-semibold">Experience:</span> {selectedTrainee.publicProfile.experienceYears || 1} Years
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                <button
                  onClick={() => setSelectedTrainee(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-govText-primary font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
};
