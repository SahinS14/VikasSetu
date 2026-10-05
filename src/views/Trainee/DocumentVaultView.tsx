import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  UploadCloud,
  FileCheck,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Plus,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export const DocumentVaultView: React.FC = () => {
  const { navigate } = useApp();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documentType, setDocumentType] = useState('GRADUATION_DEGREE');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.vault.getDocuments();
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Failed to load vault documents:', err);
      setError(err.message || 'Could not retrieve documents from vault.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      alert('Please specify a valid file name.');
      return;
    }

    try {
      setUploading(true);
      await api.vault.uploadDocument({
        documentType,
        fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        filePath: `/uploads/documents/usr-trainee-1/${fileName}.pdf`,
        fileSize: 340000,
        mimeType: 'application/pdf',
        metadata: {
          uploadedAt: new Date().toISOString(),
          systemVerified: true,
        },
      });
      setIsUploadOpen(false);
      setFileName('');
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to register document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this document from your vault?')) return;
    try {
      await api.vault.deleteDocument(docId);
      await loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to remove document.');
    }
  };

  const docTypeLabels: Record<string, string> = {
    AADHAAR: 'Aadhaar Card (UIDAI / e-KYC)',
    PAN: 'Permanent Account Number (PAN)',
    '10TH_MARKSHEET': 'Class 10th / SSC Certificate',
    '12TH_MARKSHEET': 'Class 12th / HSC Certificate',
    GRADUATION_DEGREE: 'Graduation Degree / Diploma',
    POST_GRADUATION: 'Post-Graduation / Master Degree',
    COOP_SPONSOR_LETTER: 'Cooperative Society Sponsorship / Nomination Letter',
    EXPERIENCE_CERT: 'Work Experience Certificate',
    COMMUNITY_CERT: 'Community / Category Certificate',
    OTHER: 'Other Supporting Document',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24">
      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B2B] to-[#005B46] text-white p-8 shadow-xl border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Reusable Credential Vault
          </div>
          <h1 className="text-3xl font-black tracking-tight">Trainee Document Vault</h1>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
            Upload your academic marksheets, degree certificates, and cooperative nomination letters once. Consent and reuse them instantly across any NCCT programme admission!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate('/trainee/profile-readiness')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Check Profile Readiness <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Document to Vault
          </button>
        </div>
      </div>

      {/* ─── Vault Explainer Ribbon ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900">Upload Once</div>
            <div className="text-slate-500">Stored securely in your encrypted personal locker.</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900">Institutional Verification</div>
            <div className="text-slate-500">Verified by VAMNICOM and state cooperative admins.</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900">1-Click Consent</div>
            <div className="text-slate-500">Reuse in HDCM, PGDM, and MDP applications instantly.</div>
          </div>
        </div>
      </div>

      {/* ─── Document List Table / Grid ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-600" /> Vault Inventory ({documents.length} Files)
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Verified items auto-qualify you in the Eligibility Engine
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Retrieving Vault Dossier...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Error loading vault
            </div>
            <p>{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
            <FolderKanban className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Your Document Vault is empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your Aadhaar card and Graduation degree to achieve instant eligibility on all NCCT programmes.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#005B46] text-white text-xs font-bold hover:bg-[#004736] cursor-pointer"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const typeLabel = docTypeLabels[doc.documentType] || doc.documentType;
              const isVerified = doc.verificationStatus === 'VERIFIED';
              const applicationsCount = doc.applicationDocs?.length || 0;

              return (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          {doc.documentType.replace(/_/g, ' ')}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="truncate max-w-[240px]">{doc.fileName}</span>
                        </h4>
                      </div>

                      {isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-amber-600" /> PENDING
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{typeLabel}</p>
                  </div>

                  {/* Metadata & Applications linked */}
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      {applicationsCount > 0 ? (
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Attached to {applicationsCount} application(s)
                        </span>
                      ) : (
                        <span className="text-slate-400">Available for consent</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Upload Modal ─────────────────────────────────────────────────────── */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" /> Add to Document Vault
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Document Type:</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {Object.entries(docTypeLabels).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">File Name / Label:</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Pune_University_Degree_2020.pdf"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Instant Institutional Verification
                </div>
                <p>
                  Documents registered here are digitally signed and available across all NCCT admission drives.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-[#005B46] hover:bg-[#004736] text-white text-xs font-bold shadow cursor-pointer"
                >
                  {uploading ? 'Saving to Vault...' : 'Save & Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVaultView;
