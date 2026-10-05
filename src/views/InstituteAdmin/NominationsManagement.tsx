import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  CheckSquare,
  Square,
  AlertCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { api } from '../../lib/api';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';

export const NominationsManagement: React.FC = () => {
  // ─── State Management ────────────────────────────────────────────────────────
  const [nominations, setNominations] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [cooperativeOptions, setCooperativeOptions] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalReceived: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedCoop, setSelectedCoop] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalMatching, setTotalMatching] = useState<number>(0);

  // Selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: 'single' | 'bulk'; id?: string; name?: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  // ─── Fetch Programmes for Dropdown ──────────────────────────────────────────
  const fetchProgrammesList = useCallback(async () => {
    try {
      const progs = await api.institute.getProgrammes();
      setProgrammes(progs);
    } catch (err: any) {
      console.warn('Could not fetch programmes for filter:', err.message);
    }
  }, []);

  // ─── Fetch Nominations from Database ────────────────────────────────────────
  const fetchNominationsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await api.institute.getNominations({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        programmeId: selectedProgrammeId !== 'all' ? selectedProgrammeId : undefined,
        cooperative: selectedCoop !== 'all' ? selectedCoop : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });

      if (res?.stats) {
        setStats(res.stats);
      }
      if (Array.isArray(res?.cooperatives)) {
        setCooperativeOptions(res.cooperatives);
      }

      const rows = res?.data || res?.nominations || (Array.isArray(res) ? res : []);
      setNominations(rows);

      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalMatching(res.pagination.total || rows.length);
      } else {
        setTotalPages(1);
        setTotalMatching(rows.length);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load nominations from database.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedProgrammeId, selectedCoop, searchQuery, page]);

  useEffect(() => {
    fetchProgrammesList();
  }, [fetchProgrammesList]);

  useEffect(() => {
    fetchNominationsData();
  }, [fetchNominationsData]);

  // ─── Selection Logic ────────────────────────────────────────────────────────
  const pendingRows = useMemo(() => {
    return nominations.filter(n => n.status === 'pending');
  }, [nominations]);

  const isAllPendingSelected =
    pendingRows.length > 0 && pendingRows.every(n => selectedIds.includes(n.id));

  const handleSelectAll = () => {
    if (isAllPendingSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRows.map(n => n.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // ─── Approve Handler (Single) ───────────────────────────────────────────────
  const handleRowApprove = async (id: string, name: string) => {
    try {
      setActionLoadingId(id);
      await api.institute.approveNomination(id);
      showFeedback('success', `Approved nomination for ${name}. Candidate enrolled in course.`);
      setSelectedIds(prev => prev.filter(item => item !== id));
      await fetchNominationsData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Unable to approve nomination.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Reject Modal Triggers ──────────────────────────────────────────────────
  const openSingleRejectModal = (nom: any) => {
    setRejectTarget({ type: 'single', id: nom.id, name: nom.traineeName });
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const openBulkRejectModal = () => {
    if (selectedIds.length === 0) return;
    setRejectTarget({ type: 'bulk' });
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  // ─── Confirm Reject Handler ─────────────────────────────────────────────────
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;

    try {
      setActionLoadingId('rejecting');
      if (rejectTarget.type === 'single' && rejectTarget.id) {
        await api.institute.rejectNomination(rejectTarget.id, rejectionReason);
        showFeedback('success', `Rejected nomination for ${rejectTarget.name}.`);
        setSelectedIds(prev => prev.filter(item => item !== rejectTarget.id));
      } else if (rejectTarget.type === 'bulk') {
        const res = await api.institute.bulkRejectNominations(selectedIds, rejectionReason);
        showFeedback('success', `Bulk rejected ${res.rejectedCount} candidate nominations.`);
        setSelectedIds([]);
      }

      setIsRejectModalOpen(false);
      setRejectTarget(null);
      await fetchNominationsData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Unable to complete rejection.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Bulk Approve Handler ───────────────────────────────────────────────────
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoadingId('bulk-approve');
      const res = await api.institute.bulkApproveNominations(selectedIds);
      if (res.failedCount > 0) {
        showFeedback('error', `Approved ${res.approvedCount} candidates, but ${res.failedCount} failed (${res.failures[0]?.reason || 'Capacity/Enrolled'}).`);
      } else {
        showFeedback('success', `Successfully approved ${res.approvedCount} candidate nominations.`);
      }
      setSelectedIds([]);
      await fetchNominationsData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Bulk approval failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Candidate Details Dossier ──────────────────────────────────────────────
  const openCandidateDetails = (nom: any) => {
    setSelectedCandidate(nom);
    setIsCandidateModalOpen(true);
  };

  return (
    <PageContainer>
      {/* 1. Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              Centralized Admissions & Approvals
            </span>
            <SimulatedBadge text="All Institute Programmes" />
          </div>
          <h2 className="text-2xl font-extrabold text-govText-primary mt-1">
            Trainee Nominations Management
          </h2>
          <p className="text-xs text-govText-secondary mt-1">
            Aggregated queue of all PACS, dairy, and cooperative society sponsored trainee candidates across all active courses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-govText-secondary">
            Institute: <strong className="text-govText-primary">VAMNICOM Pune</strong>
          </span>
          <button
            onClick={() => fetchNominationsData()}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-govText-secondary rounded-xl border border-gray-200 transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-govTeal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Computed strictly from PostgreSQL) */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-govText-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-govText-secondary">Total Received</span>
            <Users className="w-4 h-4 text-govTeal-600" />
          </div>
          <p className="text-2xl font-extrabold text-govText-primary mt-2">
            {isLoading ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" /> : stats.totalReceived}
          </p>
          <span className="text-[10px] text-govText-muted">Across all programmes</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-2">
            {isLoading ? <span className="inline-block w-8 h-6 bg-amber-200 rounded animate-pulse" /> : stats.pending}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">Requires immediate action</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-900 mt-2">
            {isLoading ? <span className="inline-block w-8 h-6 bg-emerald-200 rounded animate-pulse" /> : stats.approved}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">Hostel & batch ready</span>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">Rejected / Waitlist</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-900 mt-2">
            {isLoading ? <span className="inline-block w-8 h-6 bg-rose-200 rounded animate-pulse" /> : stats.rejected}
          </p>
          <span className="text-[10px] text-rose-700 font-medium">Archived nominations</span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-govText-border shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex bg-govBg p-1 rounded-xl border border-gray-200 text-xs font-semibold overflow-x-auto scrollbar-none">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all whitespace-nowrap cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-govTeal-600 text-white shadow-xs font-bold'
                    : 'text-govText-secondary hover:text-govText-primary'
                }`}
              >
                {st === 'all' ? 'All' : st}
                {st === 'pending' && stats.pending > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-amber-950 font-extrabold">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-auto sm:min-w-[260px] sm:max-w-sm">
            <Search className="w-4 h-4 text-govText-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate, email, or society..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-govBg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-govTeal-500 focus:bg-white min-h-[40px]"
            />
          </div>
        </div>

        {/* Dropdown Filters: Programme & Cooperative */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <span className="text-govText-secondary font-medium whitespace-nowrap">Programme:</span>
            <select
              value={selectedProgrammeId}
              onChange={e => {
                setSelectedProgrammeId(e.target.value);
                setPage(1);
              }}
              className="bg-govBg border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-govText-primary font-medium focus:outline-none focus:ring-1 focus:ring-govTeal-500 w-full sm:w-auto max-w-full truncate min-h-[38px]"
            >
              <option value="all">All Programmes ({stats.totalReceived})</option>
              {programmes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <span className="text-govText-secondary font-medium whitespace-nowrap">Cooperative:</span>
            <select
              value={selectedCoop}
              onChange={e => {
                setSelectedCoop(e.target.value);
                setPage(1);
              }}
              className="bg-govBg border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-govText-primary font-medium focus:outline-none focus:ring-1 focus:ring-govTeal-500 w-full sm:w-auto max-w-full sm:max-w-xs truncate min-h-[38px]"
            >
              <option value="all">All Cooperatives</option>
              {cooperativeOptions.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {(selectedProgrammeId !== 'all' || selectedStatus !== 'all' || selectedCoop !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedProgrammeId('all');
                setSelectedStatus('all');
                setSelectedCoop('all');
                setSearchQuery('');
                setPage(1);
              }}
              className="text-xs text-govTeal-700 hover:text-govTeal-900 font-semibold underline sm:ml-auto self-start sm:self-auto py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Bulk Action Bar (when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-govTeal-900 text-white p-3.5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-saffron-400 text-govTeal-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {selectedIds.length}
            </span>
            <span>Candidates Selected for Batch Review</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={actionLoadingId === 'bulk-approve'}
              className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer disabled:opacity-50"
            >
              {actionLoadingId === 'bulk-approve' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Bulk Approve</span>
            </button>
            <button
              onClick={openBulkRejectModal}
              disabled={Boolean(actionLoadingId)}
              className="flex-1 sm:flex-initial px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Bulk Reject</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-2 bg-govTeal-800 hover:bg-govTeal-700 text-govTeal-100 rounded-lg text-xs font-medium transition-colors min-h-[40px] cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 5. Aggregated Nominations Table */}
      <div className="bg-white rounded-2xl border border-govText-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-govBg/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-govText-primary">
              Showing {totalMatching} Candidate Nominations
            </h3>
            {stats.pending > 0 && (
              <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                {stats.pending} Pending Actions
              </span>
            )}
          </div>

          <span className="text-xs text-govText-muted">
            National Council for Cooperative Training (NCCT)
          </span>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-govTeal-600 mx-auto" />
            <p className="text-xs text-govText-muted">Loading nomination records from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-govText-primary">{error}</p>
            <button
              onClick={() => fetchNominationsData()}
              className="px-4 py-2 bg-govTeal-600 text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : nominations.length === 0 ? (
          <div className="p-10 text-center text-govText-muted space-y-2">
            <Users className="w-8 h-8 text-govText-muted mx-auto opacity-50" />
            <p className="font-semibold text-sm">No nominations matched your filters</p>
            <p className="text-xs">Try selecting "All Programmes" or clear your search keyword.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-govBg text-govText-secondary uppercase font-semibold border-b border-gray-200 select-none">
                    <th className="p-3 w-10 text-center">
                      <button
                        onClick={handleSelectAll}
                        disabled={pendingRows.length === 0}
                        title={isAllPendingSelected ? 'Deselect All Pending' : 'Select All Pending'}
                        className="flex items-center justify-center text-govTeal-700 disabled:opacity-30 cursor-pointer"
                      >
                        {isAllPendingSelected ? (
                          <CheckSquare className="w-4 h-4 text-govTeal-700" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Cooperative Organization</th>
                    <th className="p-3">Programme Applied To</th>
                    <th className="p-3">Nominated Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {nominations.map(nom => {
                    const isSelected = selectedIds.includes(nom.id);
                    const isPending = nom.status === 'pending';
                    const isProcessing = actionLoadingId === nom.id;

                    return (
                      <tr
                        key={nom.id}
                        className={`hover:bg-govTeal-50/30 transition-colors ${
                          isSelected ? 'bg-govTeal-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          {isPending ? (
                            <button
                              onClick={() => handleToggleRow(nom.id)}
                              className="flex items-center justify-center text-govTeal-700 mx-auto cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-govTeal-700" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-300 font-mono text-[10px]">—</span>
                          )}
                        </td>

                        {/* Candidate */}
                        <td className="p-3">
                          <button
                            onClick={() => openCandidateDetails(nom)}
                            className="flex items-center gap-2.5 text-left hover:opacity-80 cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-full bg-govTeal-100 text-govTeal-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {nom.traineeName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-govText-primary truncate group-hover:text-govTeal-700 flex items-center gap-1">
                                <span>{nom.traineeName}</span>
                                <Eye className="w-3 h-3 text-govText-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                              <p className="text-[10px] text-govText-secondary font-mono truncate">
                                {nom.traineeEmail}
                              </p>
                            </div>
                          </button>
                        </td>

                        {/* Cooperative */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-govText-primary font-medium">
                            <Building2 className="w-3.5 h-3.5 text-govTeal-600 flex-shrink-0" />
                            <span className="truncate max-w-[220px]">{nom.cooperativeName}</span>
                          </div>
                        </td>

                        {/* Programme */}
                        <td className="p-3">
                          <span className="inline-block font-semibold text-govTeal-800 bg-govTeal-50/80 px-2 py-0.5 rounded border border-govTeal-200 max-w-[240px] truncate">
                            {nom.programme?.title || nom.programmeId}
                          </span>
                        </td>

                        {/* Nominated Date */}
                        <td className="p-3 text-govText-muted font-mono whitespace-nowrap">
                          {nom.nominatedDate}
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              nom.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : nom.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {nom.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleRowApprove(nom.id, nom.traineeName)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openSingleRejectModal(nom)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`text-[11px] font-semibold flex items-center justify-end gap-1 ${
                                nom.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                              title={nom.rejectionReason || undefined}
                            >
                              {nom.status === 'approved' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Enrolled In Batch</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Archived / Rejected</span>
                                </>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Candidate Card View (< 768px) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {pendingRows.length > 0 && (
                <div className="p-3 bg-govBg/70 border-b border-gray-100 flex items-center justify-between text-xs font-semibold">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-govTeal-800 min-h-[36px]"
                  >
                    {isAllPendingSelected ? (
                      <CheckSquare className="w-4 h-4 text-govTeal-700" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    <span>{isAllPendingSelected ? 'Deselect All Pending' : 'Select All Pending'}</span>
                  </button>
                </div>
              )}

              {nominations.map(nom => {
                const isSelected = selectedIds.includes(nom.id);
                const isPending = nom.status === 'pending';
                const isProcessing = actionLoadingId === nom.id;

                return (
                  <div
                    key={nom.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? 'bg-govTeal-50/50' : 'hover:bg-govBg/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isPending && (
                          <button
                            onClick={() => handleToggleRow(nom.id)}
                            className="flex items-center justify-center text-govTeal-700 flex-shrink-0 p-1"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-govTeal-700" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                        <div className="w-8 h-8 rounded-full bg-govTeal-100 text-govTeal-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {nom.traineeName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => openCandidateDetails(nom)}
                            className="font-bold text-xs text-govText-primary truncate text-left hover:underline"
                          >
                            {nom.traineeName}
                          </button>
                          <p className="text-[10px] text-govText-muted font-mono truncate">{nom.traineeEmail}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                          nom.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : nom.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {nom.status}
                      </span>
                    </div>

                    <div className="text-xs text-govText-secondary space-y-1 pl-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-govTeal-600 flex-shrink-0" />
                        <span className="truncate">{nom.cooperativeName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-govText-muted">
                        <span className="truncate font-semibold text-govTeal-800">
                          {nom.programme?.title || nom.programmeId}
                        </span>
                        <span className="font-mono">{nom.nominatedDate}</span>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleRowApprove(nom.id, nom.traineeName)}
                          disabled={isProcessing}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => openSingleRejectModal(nom)}
                          disabled={isProcessing}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-govText-secondary bg-white">
                <span>
                  Page {page} of {totalPages} ({totalMatching} candidates)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── MODAL 1: Candidate Profile Dossier ────────────────────────────────── */}
      {isCandidateModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-govTeal-200 w-full max-w-lg overflow-hidden">
            <div className="bg-govTeal-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-saffron-300" />
                  <span>Candidate Dossier & Eligibility</span>
                </h3>
                <p className="text-xs text-govTeal-100 mt-0.5">
                  Nomination from {selectedCandidate.cooperativeName}
                </p>
              </div>
              <button onClick={() => setIsCandidateModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-govTeal-100 text-govTeal-800 font-bold flex items-center justify-center text-base flex-shrink-0">
                  {selectedCandidate.traineeName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-govText-primary">{selectedCandidate.traineeName}</h4>
                  <p className="text-govText-secondary font-mono">{selectedCandidate.traineeEmail}</p>
                  <span className="inline-block px-2 py-0.5 mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px]">
                    e-KYC Verified Candidate
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                  <span className="text-govText-muted font-medium">Programme Applied To</span>
                  <p className="font-bold text-govText-primary line-clamp-2">
                    {selectedCandidate.programme?.title || selectedCandidate.programmeId}
                  </p>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                  <span className="text-govText-muted font-medium">Nomination Date</span>
                  <p className="font-bold text-govText-primary font-mono">{selectedCandidate.nominatedDate}</p>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                  <span className="text-govText-muted font-medium">Cooperative Society</span>
                  <p className="font-bold text-govText-primary">{selectedCandidate.cooperativeName}</p>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                  <span className="text-govText-muted font-medium">Current Status</span>
                  <p className="font-bold uppercase text-govTeal-800">{selectedCandidate.status}</p>
                </div>
              </div>

              {selectedCandidate.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-rose-700 font-bold">Rejection Reason:</span>
                  <p className="text-rose-900">{selectedCandidate.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Rejection Reason Confirmation Modal ────────────────────── */}
      {isRejectModalOpen && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden">
            <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-200" />
                  <span>
                    {rejectTarget.type === 'bulk'
                      ? `Bulk Reject ${selectedIds.length} Nominations`
                      : `Reject Nomination: ${rejectTarget.name}`}
                  </span>
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Action will record rejection in PostgreSQL and notify candidates
                </p>
              </div>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Rejection Reason (Visible to applicant)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Society quota exhausted or tenure requirement not satisfied..."
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === 'rejecting'}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === 'rejecting' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
