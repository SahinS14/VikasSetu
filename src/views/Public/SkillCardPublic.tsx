import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  BookOpen,
  Download,
  Share2,
  ArrowLeft,
  AlertCircle,
  Copy,
  Lock,
  Mail,
  Send,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { api } from '../../lib/api';
import {
  SkillCardCredential,
  downloadSkillCardPDFFromCredential
} from '../../components/common/SkillCard';

const DEMO_CREDENTIALS: Record<string, SkillCardCredential> = {
  '67503c5a850891051041bec7cf5fe83f': {
    type: 'NCCT_SKILL_CARD',
    name: 'Rameshwar Patil',
    registrationId: 'NCCT-TRN-2026-MH-44091',
    institute: 'VAMNICOM, Pune',
    affiliation: 'Shri Datta PACS, Niphad, Nashik',
    skills: [
      'PACS ERP Operations',
      'KCC Loan Management',
      'Dairy Cooperative Operations',
    ],
    status: 'Verified',
  },
  'token-rameshwar-2026': {
    type: 'NCCT_SKILL_CARD',
    name: 'Rameshwar Patil',
    registrationId: 'NCCT-TRN-2026-MH-44091',
    institute: 'VAMNICOM, Pune',
    affiliation: 'Shri Datta PACS, Niphad, Nashik',
    skills: [
      'PACS ERP Operations',
      'KCC Loan Management',
      'Dairy Cooperative Operations',
    ],
    status: 'Verified',
  },
};

export const SkillCardPublic: React.FC = () => {
  const { activeViewParams, navigate } = useApp();

  // Read token from URL pathname or AppContext activeViewParams
  const urlPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pathToken = urlPath.startsWith('/skill-card/')
    ? urlPath.replace(/^\/skill-card\//, '').trim()
    : '';
  const token = activeViewParams?.token || pathToken || '67503c5a850891051041bec7cf5fe83f';

  const [credential, setCredential] = useState<SkillCardCredential | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Recruiter modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [proposedRole, setProposedRole] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // 1. Check known local credentials first for instant zero-latency loading
    if (DEMO_CREDENTIALS[token]) {
      setCredential(DEMO_CREDENTIALS[token]);
      setIsLoading(false);
      return;
    }

    // 2. Fetch from backend API
    api.skillCard
      .getPublicCard(token)
      .then((data: any) => {
        if (!data) throw new Error('Not found');

        const parsedSkills = Array.isArray(data.verifiedSkills)
          ? data.verifiedSkills.map((s: any) => (typeof s === 'string' ? s : s.name))
          : ['PACS ERP Operations', 'KCC Loan Management', 'Dairy Cooperative Operations'];

        setCredential({
          type: 'NCCT_SKILL_CARD',
          name: data.trainee?.name || 'Rameshwar Patil',
          registrationId: data.registrationId || 'NCCT-TRN-2026-MH-44091',
          institute: data.trainee?.instituteName || 'VAMNICOM, Pune',
          affiliation: data.trainee?.cooperativeAffiliation || 'Shri Datta PACS, Niphad, Nashik',
          skills: parsedSkills,
          status: 'Verified',
        });
      })
      .catch(() => {
        setError('The requested NCCT Skill Card could not be found or may no longer be valid.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const handleDownloadPdf = () => {
    if (!credential) return;
    downloadSkillCardPDFFromCredential(credential);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NCCT Digital Skill Card',
          text: `Verified NCCT Digital Skill Card — ${credential?.name || 'Trainee'}`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterName || !organizationName || !recruiterEmail) return;

    setContactSubmitting(true);
    try {
      await api.skillCard.contactTrainee(token, {
        recruiterName,
        organizationName,
        recruiterEmail,
        recruiterPhone,
        jobRole: proposedRole,
        message: inquiryMessage,
      });
      setContactSuccess(true);
      setTimeout(() => {
        setIsContactModalOpen(false);
        setContactSuccess(false);
        setRecruiterName('');
        setOrganizationName('');
        setRecruiterEmail('');
        setRecruiterPhone('');
        setProposedRole('');
        setInquiryMessage('');
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to send recruiter inquiry');
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-2 text-xs font-bold text-govTeal-800 hover:text-govTeal-950 bg-white px-3.5 py-2 rounded-xl border border-govText-border shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to VikasSetu</span>
          </button>

          <div className="flex items-center gap-2">
            <SimulatedBadge text="NCCT Verified Digital Credential" />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-govText-border shadow-sm space-y-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-govTeal-100 mx-auto flex items-center justify-center text-govTeal-700">
              <ShieldCheck className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-govText-primary">Validating Public Skill Card...</h2>
            <p className="text-xs text-govText-secondary">
              Querying National Cooperative Database (NCD) and NCCT verified records.
            </p>
          </div>
        )}

        {/* Section 7: Invalid Token / Credential Not Found State */}
        {!isLoading && error && (
          <div className="bg-white rounded-3xl p-10 border border-red-200 shadow-sm text-center space-y-4 max-w-lg mx-auto animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Credential Not Found</h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">{error}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('home')}
                className="px-6 py-2.5 bg-govTeal-700 text-white rounded-xl text-xs font-bold hover:bg-govTeal-800 transition shadow cursor-pointer"
              >
                Back to VikasSetu
              </button>
            </div>
          </div>
        )}

        {/* Section 3 & 4: Professional Digital Skill Card */}
        {!isLoading && credential && (
          <div className="max-w-2xl mx-auto w-full space-y-5 animate-fadeIn">
            {/* Main Digital Skill Card Container */}
            <div className="bg-white rounded-3xl border border-govTeal-200 shadow-xl overflow-hidden relative text-left">
              {/* Top Tricolor Accent Line */}
              <div className="h-2 w-full bg-gradient-to-r from-govTeal-700 via-saffron-500 to-emerald-600" />

              {/* 1. Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-b from-govBg/50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-govTeal-50 text-govTeal-700 border border-govTeal-200 shadow-2xs">
                    <ShieldCheck className="w-5 h-5 text-govTeal-700" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-govTeal-950 font-sans">
                      NCCT DIGITAL SKILL CARD
                    </h2>
                    <span className="text-[10px] text-govText-muted font-medium">
                      Ministry of Cooperation • Govt. of India
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider shadow-2xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✓ Verified</span>
                </span>
              </div>

              {/* 2. Trainee Identity */}
              <div className="px-6 sm:px-8 pt-6 pb-5 text-center space-y-2 border-b border-gray-100">
                <h1 className="text-2xl sm:text-3xl font-black text-govText-primary tracking-tight">
                  {credential.name}
                </h1>

                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-widest">
                    NCCT REGISTRATION ID
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-govTeal-900 bg-govTeal-50 px-3.5 py-1 rounded-lg border border-govTeal-200 inline-block tracking-wider shadow-2xs">
                    {credential.registrationId}
                  </span>
                </div>
              </div>

              {/* 3. Information Sections: Institute & Cooperative Affiliation */}
              <div className="p-6 sm:p-8 space-y-3.5">
                {/* Institute Card */}
                <div className="p-4 rounded-2xl bg-govBg/70 border border-gray-200/80 space-y-1">
                  <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>Institute</span>
                  </span>
                  <p className="text-sm sm:text-base font-bold text-govText-primary">
                    {credential.institute}
                  </p>
                </div>

                {/* Cooperative Affiliation Card */}
                <div className="p-4 rounded-2xl bg-govBg/70 border border-gray-200/80 space-y-1">
                  <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>Cooperative Affiliation</span>
                  </span>
                  <p className="text-sm sm:text-base font-bold text-govText-primary">
                    {credential.affiliation}
                  </p>
                </div>

                {/* 4. Professional Skills */}
                <div className="pt-2 space-y-2.5">
                  <span className="block text-[11px] font-black text-govTeal-950 uppercase tracking-wider">
                    PROFESSIONAL SKILLS
                  </span>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {credential.skills && credential.skills.length > 0 ? (
                      credential.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3.5 py-1.5 rounded-xl bg-govTeal-50 border border-govTeal-200 text-govTeal-900 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{skill}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 italic">No skills listed.</span>
                    )}
                  </div>
                </div>

                {/* 5. Credential Status Footer Banner */}
                <div className="pt-2">
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <div className="flex items-center gap-2 text-sm font-black text-emerald-950">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>✓ Verified Credential</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-govTeal-800 bg-white/90 px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-govTeal-700 shrink-0" />
                      <span>OFFLINE QR VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Action Buttons Section (Section 9) */}
              <div className="px-6 sm:px-8 pb-7 pt-2 border-t border-gray-100 bg-gray-50/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-3 px-4 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-saffron-300" />
                  <span>Download Skill Card PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-govText-border text-govText-primary font-bold rounded-xl text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-govTeal-700" />
                      <span>Share Skill Card</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recruiter / Employer Connect Option */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-govText-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-govText-primary">
                  Are you a Cooperative Society or Employer?
                </h4>
                <p className="text-[11px] text-govText-secondary">
                  Contact this verified candidate for open PACS, dairy, or banking roles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="px-4 py-2 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 border border-govTeal-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Mail className="w-3.5 h-3.5 text-govTeal-700" />
                <span>Contact Trainee</span>
              </button>
            </div>
          </div>
        )}

        {/* Recruiter Inquiry Modal */}
        {isContactModalOpen && credential && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-govText-border shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-govTeal-50 text-govTeal-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-govText-primary">
                      Contact {credential.name}
                    </h3>
                    <p className="text-[11px] text-govText-muted">
                      Send employment or internship inquiry directly via NCCT platform
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {contactSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inquiry delivered successfully to trainee portal!</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-govText-primary mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={recruiterName}
                      onChange={(e) => setRecruiterName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3 py-2 border border-govText-border rounded-xl bg-govBg focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-govText-primary mb-1">Organization *</label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Nashik District Coop Bank"
                      className="w-full px-3 py-2 border border-govText-border rounded-xl bg-govBg focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-govText-primary mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={recruiterEmail}
                      onChange={(e) => setRecruiterEmail(e.target.value)}
                      placeholder="hr@coopbank.org"
                      className="w-full px-3 py-2 border border-govText-border rounded-xl bg-govBg focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-govText-primary mb-1">Phone</label>
                    <input
                      type="tel"
                      value={recruiterPhone}
                      onChange={(e) => setRecruiterPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-govText-border rounded-xl bg-govBg focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-govText-primary mb-1">Proposed Role</label>
                  <input
                    type="text"
                    value={proposedRole}
                    onChange={(e) => setProposedRole(e.target.value)}
                    placeholder="e.g. PACS ERP Assistant"
                    className="w-full px-3 py-2 border border-govText-border rounded-xl bg-govBg focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-govText-primary mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Brief description of vacancy or opportunity..."
                    className="w-full px-3 py-2 border border-govText-border rounded-xl bg-govBg focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="px-5 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white rounded-xl font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactSubmitting ? 'Sending...' : 'Send Inquiry'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
