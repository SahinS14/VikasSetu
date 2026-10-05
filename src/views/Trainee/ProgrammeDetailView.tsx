import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  GraduationCap,
  Layers,
  BedDouble,
  ShieldCheck,
  Tag,
  Users,
  FileText,
  Lock,
  Sparkles,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  FolderKanban,
  Check,
  BookOpen,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export const ProgrammeDetailView: React.FC = () => {
  const { navigate, activeViewParams } = useApp();
  // Extract programmeId from activeViewParams or URL
  const programmeId = activeViewParams?.programmeId || window.location.pathname.split('/').pop() || 'prog-pgdm-2026';

  const [programme, setProgramme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [hostelRequired, setHostelRequired] = useState(false);
  const [roomTypePreference, setRoomTypePreference] = useState('Double');
  const [foodPreference, setFoodPreference] = useState('Veg');
  const [notes, setNotes] = useState('');
  const [consentedDocs, setConsentedDocs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState<any | null>(null);

  useEffect(() => {
    loadProgramme();
  }, [programmeId]);

  const loadProgramme = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.programmes.getById(programmeId);
      setProgramme(data);
      if (data.batches?.length > 0) {
        setSelectedBatchId(data.batches[0].id);
      }
      // Pre-consent to all required documents
      const reqDocs: string[] = Array.isArray(data.eligibilityRule?.requiredDocuments)
        ? data.eligibilityRule.requiredDocuments
        : ['AADHAAR', 'GRADUATION_DEGREE'];
      setConsentedDocs(reqDocs);
    } catch (err: any) {
      console.error('Failed to load programme detail:', err);
      setError(err.message || 'Failed to retrieve programme details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const result = await api.programmes.apply(programmeId, {
        batchId: selectedBatchId || undefined,
        hostelRequired,
        roomTypePreference: hostelRequired ? roomTypePreference : undefined,
        foodPreference: hostelRequired ? foodPreference : undefined,
        consentedDocTypes: consentedDocs,
        notes: notes || undefined,
      });
      setApplicationSuccess(result);
      // Reload programme to update state
      await loadProgramme();
    } catch (err: any) {
      alert(err.message || 'Application failed to submit. Please verify requirements.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDocConsent = (docCode: string) => {
    setConsentedDocs(prev =>
      prev.includes(docCode) ? prev.filter(c => c !== docCode) : [...prev, docCode]
    );
  };

  if (loading) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading Programme Dossier & Verification Engine...</p>
      </div>
    );
  }

  if (error || !programme) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 my-10 bg-rose-50 rounded-3xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Programme Not Found</h3>
        <p className="text-xs text-rose-700">{error || 'Unable to load specified programme.'}</p>
        <button
          onClick={() => navigate('/trainee/programmes')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
        >
          Return to Programme Catalogue
        </button>
      </div>
    );
  }

  const eligibility = programme.eligibility;
  const userApplication = programme.userApplication;
  const rule = programme.eligibilityRule;
  const batches = programme.batches || [];
  const sessions = programme.sessions || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24">
      {/* ─── Breadcrumbs & Back ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/trainee/programmes')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalogue
        </button>
        <span className="text-xs font-medium text-slate-400">
          NCCT Code: <span className="font-bold text-slate-700">{programme.id}</span>
        </span>
      </div>

      {/* ─── SECTION 1: Header / Hero Summary ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#005B46] text-white">
              {programme.programmeType?.name || 'NCCT Diploma'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {programme.deliveryMode === 'ON_SITE' ? 'Physical On-Site' : programme.deliveryMode}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              Academic Year {programme.academicYear || '2026-2027'}
            </span>
          </div>

          {/* Existing Application Pill */}
          {userApplication && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
              Applied ({userApplication.status})
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
            {programme.title}
          </h1>
          {programme.titleHi && (
            <p className="text-sm font-semibold text-slate-500 mt-1">{programme.titleHi}</p>
          )}
        </div>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div className="space-y-1">
            <div className="text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Duration
            </div>
            <div className="text-sm font-bold text-slate-800">
              {programme.durationValue} {programme.durationUnit?.toLowerCase() || 'weeks'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 font-medium flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Programme Fee
            </div>
            <div className="text-sm font-bold text-slate-800">
              {programme.fee > 0 ? `₹${programme.fee.toLocaleString('en-IN')}` : 'Sponsored / Fully Funded'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 font-medium flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Institute
            </div>
            <div className="text-sm font-bold text-slate-800 truncate">
              {programme.institute?.name?.split('(')[0] || 'VAMNICOM, Pune'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Commencement
            </div>
            <div className="text-sm font-bold text-slate-800">
              {new Date(programme.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Seats: <strong className="text-slate-700">{programme.enrolledCount}</strong> / {programme.capacity} enrolled</span>
          </div>

          {userApplication ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/trainee/applications')}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow"
              >
                View My Application
              </button>
              <button
                onClick={() => navigate('/trainee/timetable')}
                className="px-6 py-2.5 rounded-xl bg-[#005B46] text-white text-xs font-bold hover:bg-[#004736] transition-all cursor-pointer shadow"
              >
                View Batch Timetable
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-8 py-3 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Apply via Document Vault
            </button>
          )}
        </div>
      </div>

      {/* ─── SECTION 7: Automated Eligibility Verification (Prominent) ──────── */}
      {eligibility && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" /> Automated Eligibility Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time rule engine matches your profile and Document Vault credentials against NCCT admission criteria.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {eligibility.status === 'ELIGIBLE' ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> ELIGIBLE TO ENROLL
                </span>
              ) : eligibility.status === 'CONDITIONALLY_ELIGIBLE' ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700" /> CONDITIONALLY ELIGIBLE
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-sm">
                  <XCircle className="w-4 h-4 text-rose-700" /> INELIGIBLE
                </span>
              )}
            </div>
          </div>

          {/* Criteria Evaluation Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eligibility.criteria.map((c: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  c.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                {c.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800">{c.name}</div>
                  <div className="text-slate-500">Required: <span className="font-semibold text-slate-700">{c.required}</span></div>
                  <div className="text-slate-600">Your Credential: <span className="font-semibold text-slate-900">{c.actual}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Missing Documents notice */}
          {eligibility.missingDocuments?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" /> Action Required: Missing Vault Documents
              </div>
              <p className="text-amber-800">
                Please upload the following credentials to your Document Vault to complete full eligibility verification:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {eligibility.missingDocuments.map((doc: string) => (
                  <span key={doc} className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-bold text-amber-900">
                    {doc}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate('/trainee/documents')}
                className="mt-2 text-xs font-bold text-emerald-800 underline hover:text-emerald-950 inline-flex items-center gap-1"
              >
                Go to Document Vault <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── SECTION 2: Overview & Description ────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" /> Programme Overview & Objectives
        </h2>
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3">
          <p>{programme.description}</p>
        </div>
      </div>

      {/* ─── SECTION 4: Target Audience & Learning Outcomes ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" /> Target Audience
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {rule?.targetGroup || 'Officers of State Cooperative Departments, PACS secretaries, cooperative bank staff, and aspiring managers in agricultural cooperatives.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Key Learning Outcomes
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            {Array.isArray(programme.learningOutcomes) && programme.learningOutcomes.length > 0 ? (
              programme.learningOutcomes.map((item: string, idx: number) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))
            ) : (
              <>
                <li>Mastery of national cooperative banking and multi-state credit systems</li>
                <li>Digital ERP administration, day-balancing, and AMCS hardware integration</li>
                <li>Statutory audit compliance and Board governance acumen</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* ─── SECTION 5: Batches & Scheduled Physical Sessions (College-Style Timetable) ── */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Academic Timetable & Batch Roster
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              College-style structured weekly timetable scheduled across smart labs and lecture halls.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Physical & Blended Sessions
          </span>
        </div>

        {/* Timetable Visibility Rule check (PDF 2 Page 6) */}
        {!userApplication ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Timetable Access Controlled</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Submit your application to have your batch allocated and access your personalized classroom schedule.
            </p>
          </div>
        ) : userApplication.status === 'UNDER_REVIEW' || userApplication.status === 'SUBMITTED' ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
            <Clock className="w-8 h-8 text-amber-600 mx-auto" />
            <h4 className="text-xs font-bold text-amber-900">Application Under Review</h4>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              Your credentials are under institutional review. Timetable and batch hall assignment will appear once admission is confirmed.
            </p>
          </div>
        ) : (
          /* College-Style Timetable Table (PDF 2 Page 8) */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pb-2 border-b border-slate-100">
              <div>Institution: <strong className="text-slate-800">VAMNICOM Pune</strong></div>
              <div>Batch: <strong className="text-emerald-700 font-bold">{userApplication.batch?.name || 'Batch 2026-A'}</strong></div>
              <div>Term: <strong className="text-slate-800">Semester I</strong></div>
              <div>Mode: <strong className="text-slate-800">On-campus Physical</strong></div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                    <th className="p-3 font-bold text-slate-800 w-28">Time</th>
                    <th className="p-3 font-bold">Monday</th>
                    <th className="p-3 font-bold">Tuesday</th>
                    <th className="p-3 font-bold">Wednesday</th>
                    <th className="p-3 font-bold">Thursday</th>
                    <th className="p-3 font-bold">Friday</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Slot 1 */}
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">09:30 – 10:30</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Cooperative Environment</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi Sundaram</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Lecture Hall 1 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Cooperative Law</div>
                        <div className="text-[10px] text-slate-500">Dr. Rajesh Deshmukh</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Lecture Hall 1 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Accounts & Audit</div>
                        <div className="text-[10px] text-slate-500">Shri Arvind Mehta</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Smart Lab 2 • Face/RFID</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Banking Principles</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Lecture Hall 1 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Agricultural Marketing</div>
                        <div className="text-[10px] text-slate-500">Dr. Rajesh Deshmukh</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Seminar Room • Physical</div>
                      </div>
                    </td>
                  </tr>

                  {/* Slot 2 */}
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">10:45 – 11:45</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Cooperative Environment</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Lecture Hall 1 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Cooperative Law</div>
                        <div className="text-[10px] text-slate-500">Dr. Rajesh Deshmukh</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Lecture Hall 1 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Accounts & Audit</div>
                        <div className="text-[10px] text-slate-500">Shri Arvind Mehta</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Smart Lab 2 • Face/RFID</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Banking Principles</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Lecture Hall 1 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Agricultural Marketing</div>
                        <div className="text-[10px] text-slate-500">Dr. Rajesh Deshmukh</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Seminar Room • Physical</div>
                      </div>
                    </td>
                  </tr>

                  {/* Break */}
                  <tr className="bg-amber-50/40 text-amber-900 font-bold text-center">
                    <td className="p-2 font-bold bg-amber-100/50">12:00 – 01:00</td>
                    <td colSpan={5} className="p-2 text-center text-amber-900/80 tracking-widest text-[11px] uppercase">
                      Campus Lunch & Break
                    </td>
                  </tr>

                  {/* Slot 3 */}
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">02:00 – 03:00</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">MIS Applications</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Computer Lab 2 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Research Methods</div>
                        <div className="text-[10px] text-slate-500">Dr. Rajesh Deshmukh</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Hall 1 • Physical</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">MIS Applications</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Computer Lab 2 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">HR Management</div>
                        <div className="text-[10px] text-slate-500">Shri Arvind Mehta</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Seminar Room • Physical</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Project Work Clinic</div>
                        <div className="text-[10px] text-slate-500">Faculty Guide</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Smart Lab 2 • Face/RFID</div>
                      </div>
                    </td>
                  </tr>

                  {/* Slot 4 */}
                  <tr>
                    <td className="p-3 font-bold text-slate-700 bg-slate-50/50">03:15 – 04:15</td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Practical ERP Lab</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Computer Lab 2 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Case Study Workshop</div>
                        <div className="text-[10px] text-slate-500">Dr. Rajesh Deshmukh</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Hall 1 • Physical</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Practical ERP Lab</div>
                        <div className="text-[10px] text-slate-500">Prof. Meenakshi</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Computer Lab 2 • NFC</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Group Discussion</div>
                        <div className="text-[10px] text-slate-500">Shri Arvind Mehta</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Seminar Room • Physical</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Project Work Clinic</div>
                        <div className="text-[10px] text-slate-500">Faculty Guide</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Smart Lab 2 • Face/RFID</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── SECTION 6: Hostel Accommodation & Residential Policy ────────────── */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BedDouble className="w-5 h-5 text-amber-600" /> Hostel Accommodation & Residential Amenities
        </h2>
        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Residential Status: {programme.hostelStatus === 'MANDATORY' ? 'Mandatory Residential' : 'Optional On-Campus Accommodation'}
            </span>
            <span className="text-xs font-extrabold text-amber-950">
              Fee: ₹{programme.hostelFee?.toLocaleString('en-IN') || '0'} / term
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Comfortable twin-sharing residential rooms with attached bathrooms, study desks, high-speed Wi-Fi, and nutritious vegetarian mess catering are provided within the VAMNICOM residential campus for enrolled trainees.
          </p>
        </div>
      </div>

      {/* ─── SECTION 8: Application Modal with Vault Consent ─────────────────── */}
      {isApplyModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Application & Vault Consent</h3>
                <p className="text-xs text-slate-500">Apply to {programme.title}</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-6">
              {/* Batch Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Select Batch Preference:</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {batches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.room}) — Capacity: {b.capacity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reusable Document Vault Consent */}
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <FolderKanban className="w-4 h-4 text-emerald-700" /> Reusable Document Vault Consent
                </div>
                <p className="text-[11px] text-emerald-800">
                  Select which verified credentials from your Document Vault will be securely attached to this application:
                </p>

                <div className="space-y-2">
                  {['AADHAAR', 'GRADUATION_DEGREE', '10TH_MARKSHEET', '12TH_MARKSHEET', 'COOP_SPONSOR_LETTER', 'EXPERIENCE_CERT'].map(docCode => (
                    <label
                      key={docCode}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-emerald-100 text-xs text-slate-700 cursor-pointer hover:bg-emerald-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={consentedDocs.includes(docCode)}
                        onChange={() => toggleDocConsent(docCode)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold">{docCode.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-emerald-700 font-bold ml-auto">Vault Verified</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hostel Accommodation Toggle */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hostelRequired}
                    onChange={(e) => setHostelRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Request On-Campus Hostel Accommodation</div>
                    <div className="text-[11px] text-slate-500">Automatically creates an allocation request in the Hostel Module</div>
                  </div>
                </label>

                {hostelRequired && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Room Preference</label>
                      <select
                        value={roomTypePreference}
                        onChange={(e) => setRoomTypePreference(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        <option value="Double">Double Sharing</option>
                        <option value="Single">Single Occupancy</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Food Preference</label>
                      <select
                        value={foodPreference}
                        onChange={(e) => setFoodPreference(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        <option value="Veg">Vegetarian</option>
                        <option value="Jain">Jain Pure Veg</option>
                        <option value="Non-Veg">Non-Vegetarian</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks / Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Remarks / Cooperative Background:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes or cooperative federation sponsorship details..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProgrammeDetailView;
