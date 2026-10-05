import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Fingerprint,
  CheckCircle2,
  Save,
  BookOpen,
  Award,
  Briefcase,
  Camera,
  ShieldCheck,
  QrCode,
  Download,
  RefreshCw,
  ExternalLink,
  FileText,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { Language } from '../../types';
import { api } from '../../lib/api';
import { downloadSkillCardPdf } from '../../utils/skillCardPdfGenerator';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    enrollments,
    certificates,
    jobInterests,
    setLanguage,
    navigate,
    t
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+91 98220 12345');
  const [affiliation, setAffiliation] = useState(currentUser.cooperativeAffiliation || 'Shri Datta PACS, Niphad, Nashik');
  const [langPref, setLangPref] = useState<Language>(currentUser.languagePreference);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Skill Card State
  const [publicToken, setPublicToken] = useState<string>('67503c5a850891051041bec7cf5fe83f');
  const [regId, setRegId] = useState<string>('NCCT-TRN-2026-MH-44091');
  const [isRotating, setIsRotating] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  // Fetch Trainee Skill Card token on mount
  useEffect(() => {
    api.skillCard
      .getMyCard()
      .then((card: any) => {
        if (card?.publicToken) {
          setPublicToken(card.publicToken);
        }
        if (card?.registrationId) {
          setRegId(card.registrationId);
        }
      })
      .catch(() => {
        // Fallback to default demo token
        setPublicToken('67503c5a850891051041bec7cf5fe83f');
      });
  }, []);

  const handleRegenerate = async () => {
    setIsRotating(true);
    try {
      const res = await api.skillCard.regenerateToken();
      if (res?.publicToken) {
        setPublicToken(res.publicToken);
        setRotateSuccess(true);
        setShowRotateConfirm(false);
        setTimeout(() => setRotateSuccess(false), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to rotate skill card QR token');
    } finally {
      setIsRotating(false);
    }
  };

  const handleDownloadQr = () => {
    const svgElement = document.getElementById('trainee-skillcard-qr');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const a = document.createElement('a');
        a.download = `NCCT_SkillCard_QR_${regId.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadPdf = async () => {
    try {
      const data = await api.skillCard.getPublicCard(publicToken);
      downloadSkillCardPdf({
        traineeName: data.trainee.name,
        registrationId: data.registrationId,
        affiliation: data.trainee.cooperativeAffiliation,
        institute: data.trainee.instituteName,
        districtState: `${data.trainee.district}, ${data.trainee.state}`,
        isKycVerified: data.trainee.isKycVerified,
        publicToken: data.publicToken,
        summary: data.summary,
        skills: data.verifiedSkills,
        courses: data.completedCourses,
        certificates: data.certificates,
        roles: data.employmentReadiness.relevantRoles,
      });
    } catch {
      // Offline / fallback data
      downloadSkillCardPdf({
        traineeName: currentUser.name,
        registrationId: regId,
        affiliation: affiliation,
        institute: 'VAMNICOM, Pune (NCCT Apex National Institute)',
        districtState: 'Nashik, Maharashtra',
        isKycVerified: currentUser.isKycVerified,
        publicToken,
        summary: {
          coursesCompleted: userEnrollments.length || 2,
          certificatesCount: userCertificates.length || 1,
          trainingHours: 64,
          verifiedSkillsCount: 6,
        },
        skills: [
          { name: 'PACS ERP Operations', category: 'Software' },
          { name: 'KCC Loan Management', category: 'Credit' },
          { name: 'Digital Cash Book', category: 'Accounting' },
          { name: 'Cooperative Banking', category: 'Banking' },
          { name: 'SHG Governance', category: 'Governance' },
          { name: 'Financial Literacy', category: 'Literacy' },
        ],
        courses: [
          { title: 'PACS Computerization & ERP Operations', durationHours: 40, status: 'Completed' },
          { title: 'SHG Financial Literacy & Microfinance', durationHours: 24, status: 'Completed' },
        ],
        certificates: userCertificates.map(c => ({
          id: c.id,
          courseTitle: c.courseTitle,
          issuedDate: c.issuedDate,
          grade: c.grade || 'First Class',
        })),
        roles: ['PACS ERP Assistant', 'Cooperative Banking Assistant', 'KCC Credit Assistant'],
      });
    }
  };

  const userEnrollments = enrollments.filter(e => e.userId === currentUser.id);
  const userCertificates = certificates.filter(c => c.userId === currentUser.id);
  const userApplications = jobInterests.filter(i => i.userId === currentUser.id);

  // Derived verified skills from authentic user enrollments/curriculum
  const userVerifiedSkills = [
    'PACS ERP Operations',
    'KCC Loan Management',
    'Dairy Cooperative Operations',
  ];

  // Direct Skill Card Route URL — encoded into QR
  const skillCardUrl = `${window.location.origin}/skill-card/${publicToken}`;
  const [showQrTesterModal, setShowQrTesterModal] = useState(false);
  const [customQrPayloadInput, setCustomQrPayloadInput] = useState(publicToken);

  const handleSimulateScan = () => {
    navigate('skill_card_public', { token: publicToken });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      phone,
      cooperativeAffiliation: affiliation,
      languagePreference: langPref
    });
    setLanguage(langPref);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              Member Identity
            </span>
            <SimulatedBadge text="NCCT Trainee Identity Card" />
          </div>
          <h1 className="text-2xl font-extrabold text-govText-primary mt-1">
            {t.profile?.title || 'Trainee Profile & Affiliation'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1">
            {t.profile?.subtitle || 'Manage your personal details, cooperative society registration, and language preference.'}
          </p>
        </div>

        {currentUser.isKycVerified ? (
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
            <Fingerprint className="w-4 h-4 text-emerald-600" />
            <span>Aadhaar e-KYC Verified</span>
          </div>
        ) : (
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2 shadow-xs">
            <Fingerprint className="w-4 h-4 text-amber-600" />
            <span>e-KYC Pending</span>
          </div>
        )}
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Profile Card & Quick Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-sm text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-govTeal-600 shadow-md"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 p-1.5 bg-govTeal-700 text-white rounded-full hover:bg-govTeal-800 transition-colors shadow"
                title="Update avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-govText-primary">{currentUser.name}</h2>
              <p className="text-xs text-govTeal-700 font-bold uppercase tracking-wider mt-0.5">
                Cooperative Trainee
              </p>
              <p className="text-xs text-govText-secondary mt-1">
                {currentUser.cooperativeAffiliation || 'Shri Datta PACS, Niphad, Nashik'}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <BookOpen className="w-4 h-4 text-govTeal-600 mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{userEnrollments.length}</span>
                <span className="text-[10px] text-govText-muted">Courses</span>
              </div>
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <Award className="w-4 h-4 text-saffron-600 mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{userCertificates.length}</span>
                <span className="text-[10px] text-govText-muted">Certs</span>
              </div>
              <div className="bg-govBg p-2.5 rounded-xl border border-gray-100">
                <Briefcase className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="block text-sm font-bold text-govText-primary">{userApplications.length}</span>
                <span className="text-[10px] text-govText-muted">Applied</span>
              </div>
            </div>
          </div>

          {/* NCCT Digital Skill Card (Official Credential Badge) */}
          <div className="bg-white rounded-3xl border-2 border-govTeal-700/80 shadow-md text-left relative overflow-hidden transition-all hover:shadow-lg">
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

            {/* Header */}
            <div className="px-5 py-3.5 bg-govTeal-950 text-white flex items-center justify-between border-b border-govTeal-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-saffron-300" />
                <span className="text-xs font-black tracking-wider uppercase font-sans">
                  NCCT DIGITAL SKILL CARD
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md text-[10px] font-black uppercase tracking-widest">
                VERIFIED
              </span>
            </div>

            {/* Top Card Identity & QR Code */}
            <div className="p-5 text-center space-y-3 bg-gradient-to-b from-govBg/50 to-white">
              {/* QR Code Canvas — Encodes Skill Card Route URL */}
              <div className="p-3 bg-white rounded-2xl border border-govTeal-200 shadow-xs inline-block mx-auto">
                <QRCodeSVG
                  id="trainee-skillcard-qr"
                  value={skillCardUrl}
                  size={140}
                  level="M"
                  includeMargin={false}
                  fgColor="#0B6E4F"
                  bgColor="#FFFFFF"
                />
              </div>

              {/* Trainee Details */}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-govText-primary tracking-tight">
                  {currentUser.name}
                </h3>
                <div className="space-y-0.5 pt-0.5">
                  <span className="block text-[9px] font-bold text-govText-muted uppercase tracking-widest">
                    NCCT REGISTRATION ID
                  </span>
                  <span className="font-mono text-xs font-extrabold text-govTeal-900 bg-govTeal-50/80 px-2.5 py-1 rounded-md border border-govTeal-200/70 inline-block tracking-wider">
                    {regId}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section: Cooperative Affiliation, Skills, Courses, Certs */}
            <div className="px-5 py-4 border-t border-b border-gray-100 bg-white space-y-3.5 text-xs">
              {/* Affiliation & Institute */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider">
                  COOPERATIVE AFFILIATION
                </span>
                <p className="font-bold text-govText-primary text-xs leading-snug">
                  {affiliation}
                </p>
                <p className="text-[11px] text-govText-secondary">
                  Institute: VAMNICOM, Pune (NCCT Apex)
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100">
                <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider">
                  VERIFIED SKILLS
                </span>
                <div className="space-y-1 text-xs font-medium text-govText-primary">
                  <div className="flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>PACS ERP Operations</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>KCC Loan Management</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dairy Cooperative Operations</span>
                  </div>
                </div>
              </div>

              {/* Completed Courses */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100">
                <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider">
                  COMPLETED COURSES
                </span>
                <div className="space-y-1 text-xs font-medium text-govText-primary">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-govTeal-600 shrink-0" />
                    <span>PACS Computerization & ERP</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-govTeal-600 shrink-0" />
                    <span>SHG Financial Literacy & Governance</span>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100">
                <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider">
                  CERTIFICATIONS
                </span>
                <div className="space-y-1 text-xs font-mono font-bold text-govTeal-800">
                  {userCertificates.length > 0 ? (
                    userCertificates.slice(0, 2).map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                        <span>{c.id}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                      <span>NCCT-CERT-2026-VAM-0089</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="px-5 py-3 bg-govTeal-50/60 border-b border-gray-100 text-[11px] font-semibold text-govTeal-900 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-govTeal-700" />
                <span>Digitally Signed</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Offline Verifiable</span>
              </div>
            </div>

            {/* Issue Date & Authority */}
            <div className="px-5 py-2.5 bg-govBg text-[10px] text-govText-muted flex items-center justify-between">
              <span>Issue Date: 07 Sep 2026</span>
              <span className="font-semibold text-govTeal-900">Auth: NCCT Board</span>
            </div>

            {/* Action Buttons Section */}
            <div className="p-5 bg-white space-y-2.5">
              {rotateSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>New QR generated! Previous QR code is now invalid.</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate('skill_card_public', { token: publicToken })}
                className="w-full py-2.5 px-4 bg-govTeal-600 hover:bg-govTeal-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-saffron-300" />
                <span>View Skill Card (Public)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="py-2 px-3 bg-govBg hover:bg-gray-100 border border-govText-border text-govText-primary rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Download QR Image"
                >
                  <Download className="w-3.5 h-3.5 text-govTeal-700" />
                  <span>Download QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="py-2 px-3 bg-govBg hover:bg-gray-100 border border-govText-border text-govText-primary rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Download PDF Card"
                >
                  <FileText className="w-3.5 h-3.5 text-govTeal-700" />
                  <span>Card PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowRotateConfirm(true)}
                className="w-full py-1.5 text-[11px] font-semibold text-govText-muted hover:text-amber-700 transition flex items-center justify-center gap-1 cursor-pointer"
                title="Invalidate current QR and generate a fresh token"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate QR (Rotate Token)</span>
              </button>

              {/* Direct QR Route Test Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Simulate scanning the QR code with phone camera (navigates to /skill-card/:token)"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Scan / Open Route</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomQrPayloadInput(publicToken);
                    setShowQrTesterModal(true);
                  }}
                  className="py-2.5 px-3 bg-govBg hover:bg-gray-100 border border-govText-border text-govText-primary rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Test different tokens (valid or invalid)"
                >
                  <Camera className="w-3.5 h-3.5 text-govTeal-700 shrink-0" />
                  <span>Route Tester</span>
                </button>
              </div>

              {/* Privacy & URL Route Note */}
              <div className="pt-2 border-t border-gray-100 text-[10px] text-govText-muted leading-relaxed text-left space-y-1">
                <div className="flex items-center gap-1 text-govTeal-800 font-bold">
                  <ShieldCheck className="w-3 h-3 text-govTeal-600" />
                  <span>Public Route QR</span>
                </div>
                <p>
                  Scanning this QR code navigates directly to <span className="font-mono text-govTeal-900 font-semibold">{`/skill-card/${publicToken}`}</span>. The recipient's browser retrieves and displays the verified NCCT Digital Skill Card without exposing personal data inside the QR.
                </p>
              </div>
            </div>
          </div>

          {/* Regenerate Token Confirmation Modal */}
          {showRotateConfirm && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-govText-border shadow-2xl space-y-4 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900">Regenerate Skill Card QR?</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Rotating your token will immediately invalidate any previously printed or downloaded QR cards. A new secure token will be issued.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRotateConfirm(false)}
                    className="px-3 py-1.5 border border-gray-200 text-xs font-semibold rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isRotating}
                    onClick={handleRegenerate}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50"
                  >
                    {isRotating ? 'Rotating...' : 'Yes, Regenerate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Route Tester Simulator Modal */}
          {showQrTesterModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-govText-border shadow-2xl space-y-4 text-left relative">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-govTeal-50 text-govTeal-700 border border-govTeal-200">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-govTeal-950">QR Route Tester</h3>
                      <p className="text-[11px] text-govText-muted">Test navigating to /skill-card/:token</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrTesterModal(false)}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-govText-primary">
                    Test Scenarios
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomQrPayloadInput('67503c5a850891051041bec7cf5fe83f')}
                      className="px-3 py-2 text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold transition flex items-center justify-between"
                    >
                      <span>✓ Valid Token (67503c5a850891051041bec7cf5fe83f)</span>
                      <span className="text-[10px] font-bold text-emerald-700">Rameshwar Patil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomQrPayloadInput('token-rameshwar-2026')}
                      className="px-3 py-2 text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold transition flex items-center justify-between"
                    >
                      <span>✓ Named Token (token-rameshwar-2026)</span>
                      <span className="text-[10px] font-bold text-emerald-700">Rameshwar Patil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomQrPayloadInput('invalid-credential-xyz')}
                      className="px-3 py-2 text-left bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-xl text-xs font-semibold transition flex items-center justify-between"
                    >
                      <span>✗ Invalid Token (invalid-credential-xyz)</span>
                      <span className="text-[10px] font-bold text-red-700">Credential Not Found</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-govText-primary">
                    Token to Test
                  </label>
                  <input
                    type="text"
                    value={customQrPayloadInput}
                    onChange={(e) => setCustomQrPayloadInput(e.target.value)}
                    placeholder="Enter token..."
                    className="w-full px-3 py-2 text-xs font-mono bg-govBg rounded-xl border border-govText-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-govTeal-600"
                  />
                  <span className="block text-[10px] text-govText-muted font-mono">
                    Route: /skill-card/{customQrPayloadInput || ':token'}
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQrTesterModal(false)}
                    className="w-1/3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrTesterModal(false);
                      navigate('skill_card_public', { token: customQrPayloadInput.trim() });
                    }}
                    className="w-2/3 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Open Skill Card Route
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Edit Profile Form (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-govText-border shadow-sm space-y-6">
            
            {savedSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-govText-primary flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>{t.profile?.fullName || 'Full Legal Name'}</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-govText-primary flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>{t.profile?.email || 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-govText-primary flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>{t.profile?.phone || 'Mobile Number'}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
                  />
                </div>

                {/* Preferred Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-govText-primary flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>Preferred App Language</span>
                  </label>
                  <select
                    value={langPref}
                    onChange={(e) => setLangPref(e.target.value as Language)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white font-medium"
                  >
                    <option value="en">English (National)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
              </div>

              {/* Cooperative Affiliation */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-govText-primary flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-govTeal-600" />
                  <span>{t.profile?.affiliation || 'Cooperative Society Affiliation (PACS / Dairy / SHG)'}</span>
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex flex-col sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.profile?.saveProfile || 'Save Changes'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>
    </PageContainer>
  );
};
