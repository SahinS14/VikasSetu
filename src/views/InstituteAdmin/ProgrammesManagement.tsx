import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Sparkles,
  Search,
  Filter,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Building2,
  Check,
  X,
  RefreshCw,
  Eye,
  ShieldCheck,
  Mail,
  Phone,
  BookOpen
} from 'lucide-react';
import { api } from '../../lib/api';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';

export const ProgrammesManagement: React.FC = () => {
  // ─── State Management ────────────────────────────────────────────────────────
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [isLoadingProgrammes, setIsLoadingProgrammes] = useState(true);
  const [programmesError, setProgrammesError] = useState<string | null>(null);

  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');

  const [nominations, setNominations] = useState<any[]>([]);
  const [totalNominations, setTotalNominations] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingNominations, setIsLoadingNominations] = useState(false);

  // Filters
  const [progSearch, setProgSearch] = useState('');
  const [progStatusFilter, setProgStatusFilter] = useState('all');
  const [nomSearch, setNomSearch] = useState('');
  const [nomStatusFilter, setNomStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Mutation states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<any>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectNomTarget, setRejectNomTarget] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // CSV Import State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState(
    `Vikas More, vikas.more@pacs.org, Kolhapur District PACS\nPooja Sharma, pooja.s@dairy.coop, Anand Milk Producers\nSachin Kale, sachin.k@shg.mah.in, Sangli Women Federation`
  );
  const [csvStep, setCsvStep] = useState<'input' | 'preview'>('input');
  const [csvPreview, setCsvPreview] = useState<{ validCount: number; invalidCount: number; validRows: any[]; invalidRows: any[] } | null>(null);
  const [isSubmittingCsv, setIsSubmittingCsv] = useState(false);

  // Create/Edit Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('PACS Digitalization');
  const [formMode, setFormMode] = useState<'residential' | 'online' | 'hybrid'>('residential');
  const [formStartDate, setFormStartDate] = useState('2026-04-01');
  const [formEndDate, setFormEndDate] = useState('2026-04-15');
  const [formCapacity, setFormCapacity] = useState(50);
  const [formCourseId, setFormCourseId] = useState('crs-pacs-erp-101');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // ─── Fetch Programmes from Database ─────────────────────────────────────────
  const fetchProgrammes = useCallback(async (preserveSelection = true) => {
    try {
      setIsLoadingProgrammes(true);
      setProgrammesError(null);
      const data = await api.institute.getProgrammes({
        status: progStatusFilter !== 'all' ? progStatusFilter : undefined,
        search: progSearch.trim() || undefined,
      });

      setProgrammes(data);
      if (data.length > 0) {
        if (!preserveSelection || !selectedProgrammeId || !data.some(p => p.id === selectedProgrammeId)) {
          setSelectedProgrammeId(data[0].id);
        }
      } else {
        setSelectedProgrammeId('');
      }
    } catch (err: any) {
      setProgrammesError(err.message || 'Unable to load programmes from database.');
    } finally {
      setIsLoadingProgrammes(false);
    }
  }, [progStatusFilter, progSearch, selectedProgrammeId]);

  useEffect(() => {
    fetchProgrammes();
  }, [progStatusFilter, progSearch]);

  // ─── Fetch Nominations for Selected Programme ──────────────────────────────
  const fetchNominations = useCallback(async () => {
    if (!selectedProgrammeId) {
      setNominations([]);
      setTotalNominations(0);
      return;
    }

    try {
      setIsLoadingNominations(true);
      const res = await api.institute.getProgrammeNominations(selectedProgrammeId, {
        status: nomStatusFilter !== 'all' ? nomStatusFilter : undefined,
        search: nomSearch.trim() || undefined,
        page,
        limit: 10,
      });

      setNominations(res.nominations || []);
      setTotalNominations(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching nominations:', err);
    } finally {
      setIsLoadingNominations(false);
    }
  }, [selectedProgrammeId, nomStatusFilter, nomSearch, page]);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const selectedProgramme = programmes.find(p => p.id === selectedProgrammeId);

  // ─── Handlers: Approve & Reject ─────────────────────────────────────────────
  const handleApprove = async (nomId: string, traineeName: string) => {
    try {
      setActionLoadingId(nomId);
      await api.institute.approveNomination(nomId);
      showFeedback('success', `Approved nomination for ${traineeName}. Candidate enrolled in course.`);
      // Refresh both programmes (for capacity counts) and nominations table
      await Promise.all([fetchProgrammes(true), fetchNominations()]);
    } catch (err: any) {
      showFeedback('error', err.message || 'Unable to approve nomination.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (nom: any) => {
    setRejectNomTarget(nom);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectNomTarget) return;
    try {
      setActionLoadingId(rejectNomTarget.id);
      await api.institute.rejectNomination(rejectNomTarget.id, rejectionReason);
      showFeedback('success', `Rejected nomination for ${rejectNomTarget.traineeName}.`);
      setIsRejectModalOpen(false);
      setRejectNomTarget(null);
      await Promise.all([fetchProgrammes(true), fetchNominations()]);
    } catch (err: any) {
      showFeedback('error', err.message || 'Unable to reject nomination.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Handlers: Create & Edit Programme ─────────────────────────────────────
  const openCreateModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('PACS Digitalization');
    setFormMode('residential');
    setFormStartDate('2026-04-01');
    setFormEndDate('2026-04-15');
    setFormCapacity(50);
    setFormCourseId('crs-pacs-erp-101');
    setIsCreateModalOpen(true);
  };

  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingForm(true);
      const created = await api.institute.createProgramme({
        title: formTitle,
        description: formDescription,
        category: formCategory,
        mode: formMode,
        startDate: formStartDate,
        endDate: formEndDate,
        capacity: Number(formCapacity),
        courseId: formCourseId || undefined,
        status: 'upcoming',
      });
      showFeedback('success', `Programme "${created.title}" successfully created in database!`);
      setIsCreateModalOpen(false);
      await fetchProgrammes(false);
      setSelectedProgrammeId(created.id);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create programme.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const openEditModal = (prog: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProg(prog);
    setFormTitle(prog.title);
    setFormDescription(prog.description || '');
    setFormCategory(prog.category || 'PACS Digitalization');
    setFormMode(prog.mode || 'residential');
    setFormStartDate(prog.startDate);
    setFormEndDate(prog.endDate);
    setFormCapacity(prog.capacity);
    setFormCourseId(prog.courseId || 'crs-pacs-erp-101');
    setIsEditModalOpen(true);
  };

  const handleUpdateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProg) return;
    try {
      setIsSubmittingForm(true);
      await api.institute.updateProgramme(editingProg.id, {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        mode: formMode,
        startDate: formStartDate,
        endDate: formEndDate,
        capacity: Number(formCapacity),
        courseId: formCourseId || undefined,
      });
      showFeedback('success', `Programme "${formTitle}" updated successfully!`);
      setIsEditModalOpen(false);
      setEditingProg(null);
      await fetchProgrammes(true);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update programme.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // ─── Handlers: Bulk CSV Import ──────────────────────────────────────────────
  const openCsvModal = () => {
    setCsvStep('input');
    setCsvPreview(null);
    setIsCsvModalOpen(true);
  };

  const parseCsvLines = (text: string) => {
    const lines = text.trim().split('\n');
    return lines
      .map(line => {
        const parts = line.split(',').map(s => s?.trim() || '');
        return {
          name: parts[0] || '',
          email: parts[1] || '',
          coop: parts[2] || 'Primary Agricultural Cooperative Society',
        };
      })
      .filter(r => r.name || r.email);
  };

  const handlePreviewCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgrammeId) {
      showFeedback('error', 'Please select a programme first.');
      return;
    }
    const parsed = parseCsvLines(csvText);
    if (parsed.length === 0) {
      showFeedback('error', 'Please enter at least one valid candidate row.');
      return;
    }

    try {
      setIsSubmittingCsv(true);
      const preview = await api.institute.bulkImportNominations(selectedProgrammeId, parsed, true);
      setCsvPreview(preview);
      setCsvStep('preview');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to validate CSV candidates.');
    } finally {
      setIsSubmittingCsv(false);
    }
  };

  const handleConfirmCsvImport = async () => {
    if (!selectedProgrammeId || !csvPreview) return;
    try {
      setIsSubmittingCsv(true);
      const res = await api.institute.bulkImportNominations(selectedProgrammeId, csvPreview.validRows, false);
      showFeedback('success', `Successfully imported ${res.imported} trainee nominations into database!`);
      setIsCsvModalOpen(false);
      setCsvStep('input');
      setCsvPreview(null);
      await Promise.all([fetchProgrammes(true), fetchNominations()]);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to import nominations.');
    } finally {
      setIsSubmittingCsv(false);
    }
  };

  // ─── Candidate Profile Inspection ───────────────────────────────────────────
  const openCandidateDetails = (nom: any) => {
    setSelectedCandidate(nom);
    setIsCandidateModalOpen(true);
  };

  return (
    <PageContainer>
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg border transition-all animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              Training-ERP Module
            </span>
            <SimulatedBadge text="Federated Capacity Planning" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1 leading-snug">
            Programmes & Trainee Nominations
          </h2>
          <p className="text-xs text-govText-secondary mt-1 leading-relaxed">
            Manage residential batches, state quotas, and institutional nominations with live database persistence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fetchProgrammes(true)}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-govText-secondary rounded-xl border border-gray-200 transition-colors"
            title="Refresh from database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingProgrammes ? 'animate-spin text-govTeal-600' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-3.5 py-2.5 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Programme</span>
          </button>

          <button
            onClick={openCsvModal}
            disabled={!selectedProgrammeId}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              selectedProgrammeId
                ? 'bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 border-govTeal-200'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4 text-govTeal-700" />
            <span>Bulk CSV Import</span>
          </button>
        </div>
      </div>

      {/* Programmes Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-govText-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-govText-muted" />
          <input
            type="text"
            placeholder="Search programmes by title or category..."
            value={progSearch}
            onChange={(e) => setProgSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-govTeal-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-govText-secondary" />
          <span className="text-xs font-semibold text-govText-secondary">Status:</span>
          <select
            value={progStatusFilter}
            onChange={(e) => setProgStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white font-medium text-govText-primary focus:outline-none focus:ring-2 focus:ring-govTeal-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Programmes List Grid */}
      {isLoadingProgrammes ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 space-y-3.5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-4/5" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-2 bg-gray-200 rounded w-full pt-4" />
            </div>
          ))}
        </div>
      ) : programmesError ? (
        <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-bold text-govText-primary">{programmesError}</p>
          <button
            onClick={() => fetchProgrammes()}
            className="px-4 py-2 bg-govTeal-600 text-white text-xs font-bold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : programmes.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center space-y-2">
          <Layers className="w-8 h-8 text-govText-muted mx-auto" />
          <p className="text-sm font-bold text-govText-primary">No programmes found</p>
          <p className="text-xs text-govText-secondary">Create a programme or adjust your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {programmes.map(prog => {
            const isSelected = selectedProgrammeId === prog.id;
            const isFull = prog.isFull || prog.enrolledCount >= prog.capacity;

            return (
              <div
                key={prog.id}
                onClick={() => setSelectedProgrammeId(prog.id)}
                className={`bg-white rounded-2xl p-4 sm:p-5 border-2 cursor-pointer transition-all space-y-3.5 shadow-sm hover:shadow-md relative group ${
                  isSelected
                    ? 'border-govTeal-600 ring-2 ring-govTeal-600/20'
                    : 'border-govText-border hover:border-govTeal-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-saffron-700 bg-saffron-50 px-2 py-0.5 rounded border border-saffron-200 uppercase">
                      {prog.mode}
                    </span>
                    {isFull && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase">
                        Capacity Full
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-govText-muted">
                    {prog.startDate} to {prog.endDate}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-govText-primary leading-snug line-clamp-2">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-govTeal-700 mt-1 font-medium line-clamp-1">
                    {prog.instituteName}
                  </p>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-govText-secondary">Enrolled / Capacity</span>
                    <span className={isFull ? 'text-rose-700 font-bold' : 'text-govTeal-800'}>
                      {prog.enrolledCount} / {prog.capacity} ({prog.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : 'bg-govTeal-600'
                      }`}
                      style={{ width: `${Math.min(100, prog.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Footer status & edit trigger */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-govText-muted">
                  <span className="capitalize font-medium">Status: <strong className="text-govText-primary">{prog.status}</strong></span>
                  <button
                    onClick={(e) => openEditModal(prog, e)}
                    className="p-1 hover:bg-govTeal-50 text-govTeal-700 rounded transition-colors"
                    title="Edit Programme"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nominations for Selected Programme */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-govText-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-govText-primary">
              Nominations: <span className="text-govTeal-700">{selectedProgramme?.title || 'Selected Programme'}</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-govText-secondary">
              Review and authorize trainee nominations from primary societies
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-800 bg-govBg px-3 py-1 rounded-lg border border-gray-200">
              {totalNominations} Candidates Nominated
            </span>
          </div>
        </div>

        {/* Nominations Table Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-govText-muted" />
            <input
              type="text"
              placeholder="Search candidates, emails, PACS..."
              value={nomSearch}
              onChange={(e) => {
                setNomSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setNomStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-colors ${
                  nomStatusFilter === tab
                    ? 'bg-govTeal-600 text-white shadow-sm'
                    : 'bg-white text-govText-secondary hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        {isLoadingNominations ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-govTeal-600 mx-auto" />
            <p className="text-xs text-govText-muted">Loading candidate nominations from database...</p>
          </div>
        ) : nominations.length === 0 ? (
          <div className="p-8 text-center space-y-2 border border-dashed border-gray-200 rounded-xl">
            <Users className="w-6 h-6 text-govText-muted mx-auto" />
            <p className="text-sm font-semibold text-govText-primary">No nominations found</p>
            <p className="text-xs text-govText-secondary">
              {nomSearch || nomStatusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'No candidates have been nominated for this programme yet.'}
            </p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-govBg text-govText-secondary uppercase font-semibold border-b border-gray-200">
                  <th className="p-3">Trainee Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Cooperative Organization</th>
                  <th className="p-3">Nominated Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nominations.map(nom => {
                  const isProcessing = actionLoadingId === nom.id;
                  const isFull = selectedProgramme?.isFull || (selectedProgramme?.enrolledCount >= selectedProgramme?.capacity);

                  return (
                    <tr key={nom.id} className="hover:bg-govTeal-50/30 transition-colors">
                      <td className="p-3 font-bold text-govText-primary">
                        <button
                          onClick={() => openCandidateDetails(nom)}
                          className="hover:text-govTeal-700 hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                        >
                          <span>{nom.traineeName}</span>
                          <Eye className="w-3.5 h-3.5 text-govText-muted opacity-60" />
                        </button>
                      </td>
                      <td className="p-3 text-govText-secondary font-mono">{nom.traineeEmail}</td>
                      <td className="p-3 text-govText-primary font-medium">{nom.cooperativeName}</td>
                      <td className="p-3 text-govText-muted font-mono">{nom.nominatedDate}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                      <td className="p-3 text-right">
                        {nom.status === 'pending' ? (
                          <div className="flex justify-end items-center gap-2">
                            {isFull ? (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold" title="Programme capacity is full">
                                Capacity Full
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApprove(nom.id, nom.traineeName)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              onClick={() => openRejectModal(nom)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : nom.status === 'approved' ? (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Enrolled</span>
                          </span>
                        ) : (
                          <span
                            className="text-xs font-semibold text-rose-700 flex items-center justify-end gap-1 cursor-help"
                            title={nom.rejectionReason || 'Nomination rejected'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Candidate Card View (< 768px) */}
        {!isLoadingNominations && nominations.length > 0 && (
          <div className="block md:hidden divide-y divide-gray-100">
            {nominations.map(nom => {
              const isProcessing = actionLoadingId === nom.id;
              const isFull = selectedProgramme?.isFull || (selectedProgramme?.enrolledCount >= selectedProgramme?.capacity);

              return (
                <div key={nom.id} className="py-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        onClick={() => openCandidateDetails(nom)}
                        className="font-bold text-sm text-govText-primary text-left flex items-center gap-1"
                      >
                        <span>{nom.traineeName}</span>
                        <Eye className="w-3.5 h-3.5 text-govText-muted" />
                      </button>
                      <p className="text-[11px] text-govText-muted font-mono">{nom.traineeEmail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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

                  <div className="text-xs text-govText-secondary space-y-0.5">
                    <p><span className="text-govText-muted">Society: </span>{nom.cooperativeName}</p>
                    <p><span className="text-govText-muted">Date: </span>{nom.nominatedDate}</p>
                  </div>

                  {nom.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      {isFull ? (
                        <span className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-semibold text-center">
                          Capacity Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(nom.id, nom.traineeName)}
                          disabled={isProcessing}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>Approve</span>
                        </button>
                      )}
                      <button
                        onClick={() => openRejectModal(nom)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
            <span className="text-govText-secondary">
              Page {page} of {totalPages} ({totalNominations} total candidates)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: Create Programme ────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-govTeal-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-govTeal-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-saffron-300" />
                  <span>Create New Training Programme</span>
                </h3>
                <p className="text-xs text-govTeal-100 mt-0.5">
                  Creates institutional batch with real PostgreSQL persistence
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgramme} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Programme Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Executive Certificate in PACS Digital Operations & Governance"
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-govTeal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Comprehensive on-campus batch details..."
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-govTeal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="PACS Digitalization">PACS Digitalization</option>
                    <option value="Dairy & Livestock">Dairy & Livestock</option>
                    <option value="SHG Governance">SHG Governance</option>
                    <option value="Cooperative Banking">Cooperative Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Delivery Mode</label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="residential">Residential</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value, 10))}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  LMS Course Connection (Auto-enrolled on approval)
                </label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white"
                >
                  <option value="crs-pacs-erp-101">PACS Computerization & ERP Operations (crs-pacs-erp-101)</option>
                  <option value="crs-dairy-mgmt-201">Dairy Cooperative Cold Chain & Quality Testing (crs-dairy-mgmt-201)</option>
                  <option value="crs-shg-101">SHG Governance & Microfinance (crs-shg-101)</option>
                  <option value="crs-dairy-101">Dairy & Livestock Cooperative Management (crs-dairy-101)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  {isSubmittingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Programme</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Edit Programme ──────────────────────────────────────────── */}
      {isEditModalOpen && editingProg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-govTeal-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-govTeal-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-saffron-300" />
                  <span>Edit Programme Details</span>
                </h3>
                <p className="text-xs text-govTeal-100 mt-0.5">
                  Update dates, capacity, or curriculum linkage
                </p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProgramme} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Programme Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-govTeal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Delivery Mode</label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="residential">Residential</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-govText-primary mb-1">Capacity</label>
                  <input
                    type="number"
                    min={editingProg.enrolledCount || 1}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value, 10))}
                    className="w-full p-2 text-xs rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  {isSubmittingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Rejection Reason Modal ──────────────────────────────────── */}
      {isRejectModalOpen && rejectNomTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden">
            <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-200" />
                  <span>Reject Candidate Nomination</span>
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  For {rejectNomTarget.traineeName} ({rejectNomTarget.cooperativeName})
                </p>
              </div>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Reason for Rejection (Visible in Candidate Notification)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Does not meet minimum 3-year PACS tenure or prerequisite training..."
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === rejectNomTarget.id}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  {actionLoadingId === rejectNomTarget.id && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Candidate Details Inspection Modal ──────────────────────── */}
      {isCandidateModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-govTeal-200 w-full max-w-lg overflow-hidden">
            <div className="bg-govTeal-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-saffron-300" />
                  <span>Candidate Profile Dossier</span>
                </h3>
                <p className="text-xs text-govTeal-100 mt-0.5">
                  Nomination record from {selectedCandidate.cooperativeName}
                </p>
              </div>
              <button onClick={() => setIsCandidateModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-govTeal-100 text-govTeal-800 font-bold flex items-center justify-center text-base">
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
                  <span className="text-govText-muted font-medium">Nominated Programme</span>
                  <p className="font-bold text-govText-primary">{selectedProgramme?.title}</p>
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
                  className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: Bulk CSV Import with 2-Step Validation ─────────────────── */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-govTeal-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-govTeal-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-saffron-300" />
                  <span>Bulk CSV Trainee Nominations</span>
                </h3>
                <p className="text-xs text-govTeal-100 mt-0.5">
                  Target Programme: <strong>{selectedProgramme?.title}</strong>
                </p>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {csvStep === 'input' ? (
                <form onSubmit={handlePreviewCsv} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-govText-secondary mb-1">
                      Format: Name, Email, Cooperative Organization (One candidate per line)
                    </label>
                    <textarea
                      rows={6}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="w-full p-3 font-mono text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                      required
                    />
                  </div>

                  <div className="p-3 bg-govTeal-50 border border-govTeal-200 rounded-xl text-[11px] text-govTeal-900 space-y-1">
                    <p className="font-bold">Validation Rules Applied:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Name must be at least 2 characters.</li>
                      <li>Valid email regex pattern check.</li>
                      <li>Deduplication against existing nominations in this batch and programme.</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCsvModalOpen(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCsv}
                      className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
                    >
                      {isSubmittingCsv && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Validate & Preview</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <span className="text-xl font-extrabold text-emerald-700">{csvPreview?.validCount || 0}</span>
                      <p className="text-[11px] font-bold text-emerald-800">Valid Candidates</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                      <span className="text-xl font-extrabold text-rose-700">{csvPreview?.invalidCount || 0}</span>
                      <p className="text-[11px] font-bold text-rose-800">Invalid / Skipped</p>
                    </div>
                  </div>

                  {/* Invalid rows warnings */}
                  {csvPreview && csvPreview.invalidRows.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      <p className="text-xs font-bold text-rose-700">Errors to be skipped:</p>
                      {csvPreview.invalidRows.map((inv, idx) => (
                        <div key={idx} className="p-2 bg-rose-50 rounded-lg text-[11px] text-rose-800 border border-rose-200">
                          <strong>{inv.raw.name || 'Row'} ({inv.raw.email || 'No email'}):</strong> {inv.reason}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Valid rows preview */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50">
                    <p className="text-xs font-bold text-govText-primary">Valid preview ({csvPreview?.validRows.length}):</p>
                    {csvPreview?.validRows.map((v, idx) => (
                      <div key={idx} className="text-[11px] text-govText-secondary py-0.5 border-b border-gray-200 last:border-b-0">
                        • {v.name} &lt;{v.email}&gt; - {v.coop}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCsvStep('input')}
                      className="px-3 py-2 text-xs font-bold text-govTeal-700 hover:underline"
                    >
                      ← Back to Edit
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCsvModalOpen(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCsvImport}
                        disabled={isSubmittingCsv || !csvPreview || csvPreview.validCount === 0}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSubmittingCsv && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Confirm Import ({csvPreview?.validCount})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
