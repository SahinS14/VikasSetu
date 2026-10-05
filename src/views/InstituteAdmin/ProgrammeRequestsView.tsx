import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Building2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Eye,
  Layers,
  BadgeCheck,
  ShieldAlert,
  BedDouble,
  Users,
  Send,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgrammeRequest {
  id: string;
  status: string;
  hostelRequired: boolean;
  hostelStatus?: string;
  rejectionReason?: string;
  correctionNote?: string;
  submittedAt?: string;
  createdAt: string;
  eligibilityStatus?: string;
  documentsVerified?: boolean;
  trainee: {
    id: string;
    name: string;
    email: string;
    registrationId?: string;
    organization?: string;
  };
  programme: {
    id: string;
    title: string;
    programmeType?: { name: string };
    deliveryMode?: string;
    startDate?: string;
    endDate?: string;
    capacity?: number;
    enrolledCount?: number;
  };
  batch?: {
    id: string;
    name: string;
  };
}

type RequestAction = 'approve' | 'reject' | 'waitlist' | 'request_correction';

const TABS = [
  { id: 'all', label: 'New Requests', filterStatuses: ['SUBMITTED', 'APPLIED'] },
  { id: 'under_review', label: 'Documents Under Review', filterStatuses: ['UNDER_REVIEW', 'DOCUMENT_REVIEW', 'ELIGIBILITY_REVIEW'] },
  { id: 'eligible', label: 'Eligible', filterStatuses: ['ELIGIBLE'] },
  { id: 'needs_correction', label: 'Needs Correction', filterStatuses: ['CORRECTION_REQUIRED'] },
  { id: 'approved', label: 'Approved', filterStatuses: ['ACCEPTED', 'APPROVED'] },
  { id: 'waitlisted', label: 'Waitlisted', filterStatuses: ['WAITLISTED'] },
  { id: 'rejected', label: 'Rejected', filterStatuses: ['REJECTED'] },
];

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    SUBMITTED:           { label: 'New Request', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    APPLIED:             { label: 'Applied', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    UNDER_REVIEW:        { label: 'Under Review', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    DOCUMENT_REVIEW:     { label: 'Docs Review', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    ELIGIBILITY_REVIEW:  { label: 'Eligibility Review', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
    ELIGIBLE:            { label: 'Eligible \u2713', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    CORRECTION_REQUIRED: { label: 'Needs Correction', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
    ACCEPTED:            { label: 'Approved \u2713', cls: 'bg-teal-100 text-teal-800 border-teal-200' },
    APPROVED:            { label: 'Approved \u2713', cls: 'bg-teal-100 text-teal-800 border-teal-200' },
    WAITLISTED:          { label: 'Waitlisted', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    REJECTED:            { label: 'Rejected', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
  };
  const info = map[status] || { label: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${info.cls}`}>
      {info.label}
    </span>
  );
};

// ─── ActionModal ──────────────────────────────────────────────────────────────

const ActionModal: React.FC<{
  action: RequestAction;
  applicantName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}> = ({ action, applicantName, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const requiresReason = action === 'reject' || action === 'request_correction';

  const actionMeta: Record<RequestAction, { title: string; btn: string; btnClass: string; placeholder: string }> = {
    approve: {
      title: 'Confirm Approval',
      btn: 'Confirm Approval',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700',
      placeholder: 'Optional: Add a note for the trainee...',
    },
    reject: {
      title: 'Reject Application',
      btn: 'Confirm Rejection',
      btnClass: 'bg-rose-600 hover:bg-rose-700',
      placeholder: 'Required: Provide a clear rejection reason for the applicant...',
    },
    waitlist: {
      title: 'Waitlist Application',
      btn: 'Move to Waitlist',
      btnClass: 'bg-slate-700 hover:bg-slate-800',
      placeholder: 'Optional: Explain the waitlist reason...',
    },
    request_correction: {
      title: 'Request Document Correction',
      btn: 'Send Correction Request',
      btnClass: 'bg-amber-600 hover:bg-amber-700',
      placeholder: 'Required: Specify which documents need to be corrected or resubmitted...',
    },
  };

  const meta = actionMeta[action];
  const isValid = !requiresReason || reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 space-y-5">
        <div>
          <h3 className="text-lg font-black text-slate-900">{meta.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Applicant: <strong className="text-slate-800">{applicantName}</strong>
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            {requiresReason ? 'Reason (required)' : 'Note (optional)'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={meta.placeholder}
            rows={4}
            className="w-full border border-slate-200 rounded-xl p-3 text-xs resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
          {requiresReason && reason.trim().length < 10 && reason.length > 0 && (
            <p className="text-xs text-rose-600 mt-1">Please provide at least 10 characters.</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onConfirm(reason)}
            disabled={!isValid}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-black transition-all cursor-pointer ${meta.btnClass} ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {meta.btn}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RequestCard ──────────────────────────────────────────────────────────────

const RequestCard: React.FC<{
  req: ProgrammeRequest;
  onAction: (reqId: string, action: RequestAction, applicantName: string) => void;
}> = ({ req, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const { navigate } = useApp();

  const seatsLeft = req.programme.capacity
    ? req.programme.capacity - (req.programme.enrolledCount || 0)
    : null;

  const canAct = !['ACCEPTED', 'APPROVED', 'REJECTED'].includes(req.status.toUpperCase());

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={req.status.toUpperCase()} />
              {req.programme.deliveryMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  {req.programme.deliveryMode === 'ON_SITE' ? 'On-site' : req.programme.deliveryMode}
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-slate-900 leading-snug">
              {req.programme.title}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            #{req.id.slice(-8).toUpperCase()}
          </span>
        </div>

        {/* Applicant */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-sm shrink-0">
            {req.trainee.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900 truncate">{req.trainee.name}</div>
            <div className="text-xs text-slate-500 truncate">
              {req.trainee.email}
              {req.trainee.organization && ` \u00b7 ${req.trainee.organization}`}
            </div>
          </div>
        </div>

        {/* 2x2 Fact Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] text-emerald-700 font-semibold uppercase">Eligibility</div>
              <div className="font-bold text-emerald-900 text-[11px]">
                {req.eligibilityStatus === 'ELIGIBLE' ? 'Eligible \u2713' : req.eligibilityStatus || 'Pending Review'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="text-[10px] text-blue-700 font-semibold uppercase">Documents</div>
              <div className="font-bold text-blue-900 text-[11px]">
                {req.documentsVerified ? 'Verified \u2713' : 'Under Review'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
            <BedDouble className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-[10px] text-amber-700 font-semibold uppercase">Hostel</div>
              <div className="font-bold text-amber-900 text-[11px]">
                {req.hostelRequired ? (req.hostelStatus || 'Requested') : 'Not Required'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <Users className="w-4 h-4 text-slate-600 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Seats</div>
              <div className="font-bold text-slate-900 text-[11px]">
                {seatsLeft !== null ? (seatsLeft > 0 ? `${seatsLeft} Available` : 'Full') : 'Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Rejection / Correction Reason */}
        {(req.rejectionReason || req.correctionNote) && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <strong>{req.rejectionReason ? 'Rejection Reason:' : 'Correction Required:'}</strong>{' '}
            {req.rejectionReason || req.correctionNote}
          </div>
        )}

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer pt-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Show less' : 'View full application details'}
        </button>

        {/* Expanded Detail */}
        {expanded && (
          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span>Programme Type:</span>
              <strong className="text-slate-800">{req.programme.programmeType?.name || '\u2014'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Programme Dates:</span>
              <strong className="text-slate-800">
                {req.programme.startDate ? new Date(req.programme.startDate).toLocaleDateString('en-IN') : '\u2014'} \u2192 {req.programme.endDate ? new Date(req.programme.endDate).toLocaleDateString('en-IN') : '\u2014'}
              </strong>
            </div>
            {req.batch && (
              <div className="flex justify-between">
                <span>Assigned Batch:</span>
                <strong className="text-emerald-700">{req.batch.name}</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span>Applied On:</span>
              <strong className="text-slate-800">
                {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : '\u2014'}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-6 pb-6 flex flex-wrap gap-2">
        <button
          onClick={() => navigate(`/trainee/programmes/${req.programme.id}`)}
          className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" /> View Application
        </button>
        {canAct && (
          <>
            <button
              onClick={() => onAction(req.id, 'approve', req.trainee.name)}
              className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Approve
            </button>
            <button
              onClick={() => onAction(req.id, 'waitlist', req.trainee.name)}
              className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Waitlist
            </button>
            <button
              onClick={() => onAction(req.id, 'request_correction', req.trainee.name)}
              className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Request Correction
            </button>
            <button
              onClick={() => onAction(req.id, 'reject', req.trainee.name)}
              className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Demo Data ─────────────────────────────────────────────────────────────────

function generateDemoRequests(): ProgrammeRequest[] {
  return [
    {
      id: 'app-demo-001',
      status: 'SUBMITTED',
      hostelRequired: true,
      hostelStatus: 'Request submitted',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      eligibilityStatus: 'ELIGIBLE',
      documentsVerified: true,
      trainee: {
        id: 'usr-demo-1',
        name: 'Rameshwar Patil',
        email: 'rameshwar.patil@pacs.maharashtra.in',
        registrationId: 'NCCT-2026-TRN-00142',
        organization: 'Shri Datta PACS, Niphad',
      },
      programme: {
        id: 'prog-hdcm-2026',
        title: 'HDCM Regular Batch 2026',
        programmeType: { name: 'HDCM' },
        deliveryMode: 'ON_SITE',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        capacity: 40,
        enrolledCount: 28,
      },
    },
    {
      id: 'app-demo-002',
      status: 'UNDER_REVIEW',
      hostelRequired: false,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      eligibilityStatus: 'UNDER_REVIEW',
      documentsVerified: false,
      trainee: {
        id: 'usr-demo-2',
        name: 'Sunita Kamble',
        email: 'sunita.kamble@cooperative.kar',
        organization: 'Belgaum DCC Bank',
      },
      programme: {
        id: 'prog-pgdm-2026',
        title: 'Post Graduate Diploma in Cooperative Business Management (PGDM-CBM)',
        programmeType: { name: 'PGDM' },
        deliveryMode: 'ON_SITE',
        startDate: '2026-11-15',
        endDate: '2027-05-15',
        capacity: 30,
        enrolledCount: 18,
      },
    },
    {
      id: 'app-demo-003',
      status: 'ACCEPTED',
      hostelRequired: true,
      hostelStatus: 'Allocated (Room A-102)',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      eligibilityStatus: 'ELIGIBLE',
      documentsVerified: true,
      trainee: {
        id: 'usr-demo-3',
        name: 'Arun Joshi',
        email: 'arun.joshi@ncct.gov.in',
        organization: 'VAMNICOM Pune',
      },
      programme: {
        id: 'prog-pgdm-2026',
        title: 'Post Graduate Diploma in Cooperative Business Management (PGDM-CBM)',
        programmeType: { name: 'PGDM' },
        deliveryMode: 'ON_SITE',
        startDate: '2026-11-15',
        endDate: '2027-05-15',
        capacity: 30,
        enrolledCount: 18,
      },
      batch: { id: 'batch-pgdm-2026-a', name: 'Batch 2026-A (Section 1)' },
    },
    {
      id: 'app-demo-004',
      status: 'SUBMITTED',
      hostelRequired: false,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      eligibilityStatus: 'ELIGIBLE',
      documentsVerified: true,
      trainee: {
        id: 'usr-demo-4',
        name: 'Meena Deshpande',
        email: 'meena.deshpande@dcccb.gov.in',
        organization: 'Nashik DCCB',
      },
      programme: {
        id: 'prog-pacs-erp-2026',
        title: 'PACS Computerization & ERP Operations',
        programmeType: { name: 'SHORT_TERM' },
        deliveryMode: 'BLENDED',
        startDate: '2026-10-18',
        endDate: '2026-10-22',
        capacity: 25,
        enrolledCount: 10,
      },
    },
    {
      id: 'app-demo-005',
      status: 'REJECTED',
      hostelRequired: false,
      rejectionReason: 'Applicant does not meet the minimum education qualification requirement (10+2 with 50% marks in relevant subjects).',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      eligibilityStatus: 'NOT_ELIGIBLE',
      documentsVerified: true,
      trainee: {
        id: 'usr-demo-5',
        name: 'Vijay Thorat',
        email: 'vijay.thorat@example.com',
        organization: 'Rural PACS, Satara',
      },
      programme: {
        id: 'prog-pgdm-2026',
        title: 'Post Graduate Diploma in Cooperative Business Management (PGDM-CBM)',
        programmeType: { name: 'PGDM' },
        deliveryMode: 'ON_SITE',
        startDate: '2026-11-15',
        endDate: '2027-05-15',
        capacity: 30,
        enrolledCount: 18,
      },
    },
  ];
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const ProgrammeRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<ProgrammeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: RequestAction;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (api.programmes as any).getApplicationsForAdmin
        ? await (api.programmes as any).getApplicationsForAdmin()
        : [];
      setRequests(data.length > 0 ? data : generateDemoRequests());
    } catch (err: any) {
      console.error('[ProgrammeRequests] Failed to load:', err);
      setRequests(generateDemoRequests());
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reason: string) => {
    if (!pendingAction) return;
    const statusMap: Record<RequestAction, string> = {
      approve: 'ACCEPTED',
      reject: 'REJECTED',
      waitlist: 'WAITLISTED',
      request_correction: 'CORRECTION_REQUIRED',
    };
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== pendingAction.id) return r;
        return {
          ...r,
          status: statusMap[pendingAction.action],
          rejectionReason: pendingAction.action === 'reject' ? reason : r.rejectionReason,
          correctionNote: pendingAction.action === 'request_correction' ? reason : r.correctionNote,
        };
      })
    );
    try {
      if ((api.programmes as any).updateApplicationStatus) {
        await (api.programmes as any).updateApplicationStatus(pendingAction.id, {
          status: statusMap[pendingAction.action],
          reason,
        });
      }
    } catch (err) {
      console.error('[ProgrammeRequests] Backend action failed (local state already updated):', err);
    } finally {
      setPendingAction(null);
    }
  };

  const tabConfig = TABS.find((t) => t.id === activeTab);
  const filtered = requests.filter((req) => {
    const matchesTab = tabConfig?.filterStatuses.includes(req.status.toUpperCase()) ?? false;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      req.trainee.name.toLowerCase().includes(query) ||
      req.programme.title.toLowerCase().includes(query) ||
      req.trainee.email.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  const countByTab = (filterStatuses: string[]) =>
    requests.filter((r) => filterStatuses.includes(r.status.toUpperCase())).length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] via-[#005B46] to-[#0D7A5F] text-white p-8 md:p-10 shadow-xl border border-emerald-700/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <FileCheck className="w-3.5 h-3.5 text-amber-300" /> Institute Admin — Admissions
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Programme Requests
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
            Review, approve, and manage all trainee programme admission applications. You are responsible for document verification, eligibility confirmation, seat allocation, and final admission decisions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          {[
            { label: 'New Requests', count: countByTab(['SUBMITTED', 'APPLIED']), color: 'bg-blue-400/20 text-blue-100' },
            { label: 'Under Review', count: countByTab(['UNDER_REVIEW', 'DOCUMENT_REVIEW', 'ELIGIBILITY_REVIEW']), color: 'bg-amber-400/20 text-amber-100' },
            { label: 'Approved', count: countByTab(['ACCEPTED', 'APPROVED']), color: 'bg-emerald-400/20 text-emerald-100' },
            { label: 'Rejected', count: countByTab(['REJECTED']), color: 'bg-rose-400/20 text-rose-100' },
          ].map((s) => (
            <div key={s.label} className={`px-4 py-2 rounded-xl ${s.color} border border-white/10 text-xs font-bold`}>
              <span className="text-lg font-black mr-1.5">{s.count}</span>{s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by applicant, email, programme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <button
          onClick={loadRequests}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {TABS.map((tab) => {
          const cnt = countByTab(tab.filterStatuses);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
              {cnt > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Approval Responsibility Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Approval Responsibility:</strong> As Institute Admin, you have final authority over admission decisions. The system performs automatic screening (education, age, documents, capacity). Your role is to verify document authenticity and make the final decision.{' '}
            <strong>A reason is mandatory for rejections and correction requests.</strong>
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading programme requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-600">No requests in this category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search ? `No results matching "${search}".` : 'There are no applications in this status.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onAction={(id, action, name) => setPendingAction({ id, action, name })}
            />
          ))}
        </div>
      )}

      {/* Action Modal */}
      {pendingAction && (
        <ActionModal
          action={pendingAction.action}
          applicantName={pendingAction.name}
          onConfirm={handleAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};

export default ProgrammeRequestsView;
