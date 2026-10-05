import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Building2,
  Calendar,
  User,
  Hash,
  Award,
  Search,
  ArrowLeft,
  Download,
  Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { downloadCertificatePdf } from '../../utils/certificateGenerator';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { api } from '../../lib/api';

export const CertificateVerify: React.FC = () => {
  const { certificates, activeViewParams, navigate } = useApp();
  const [searchId, setSearchId] = useState(
    activeViewParams?.certId || 'NCCT-CERT-2026-VAM-0089'
  );
  const [apiCert, setApiCert] = useState<any | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch from API (public endpoint — no login required) when searchId is set
  const fetchCert = (query: string) => {
    if (!query.trim()) return;
    setIsFetching(true);
    api.certificates.verify(query.trim())
      .then(c => setApiCert(c))
      .catch(() => {
        api.certificates.get(query.trim())
          .then(c => setApiCert(c))
          .catch(() => setApiCert(null));
      })
      .finally(() => setIsFetching(false));
  };

  useEffect(() => {
    fetchCert(searchId);
  }, []);

  // Merge: prefer API result, fall back to local state
  const cert = apiCert ?? certificates.find(c =>
    c.id.toLowerCase() === searchId.trim().toLowerCase() ||
    c.verificationToken?.toLowerCase() === searchId.trim().toLowerCase() ||
    c.certificateNumber?.toLowerCase() === searchId.trim().toLowerCase()
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCert(searchId);
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 text-xs font-bold text-govTeal-800 hover:text-govTeal-950 bg-white px-3 py-2 rounded-xl border border-govText-border shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </button>
          <SimulatedBadge text="Public DigiLocker Verification Prototype" />
        </div>

        {/* Verification Search Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-govText-border shadow-md space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary">
              National Certificate Verification Service
            </h1>
            <p className="text-xs sm:text-sm text-govText-secondary mt-0.5">
              Verify credentials issued across VAMNICOM, 5 RICMs, and 14 ICMs.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. NCCT-CERT-2026-VAM-0089)..."
                className="w-full h-12 px-4 pl-10 rounded-xl border border-govText-border bg-govBg focus:bg-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-govTeal-600"
              />
              <Search className="w-4 h-4 text-govText-muted absolute left-3.5 top-4" />
            </div>
            <button
              type="submit"
              className="h-12 px-6 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow flex items-center justify-center gap-2"
            >
              <span>Validate Certificate</span>
            </button>
          </form>
        </div>

        {/* Certificate Result */}
        {cert ? (
          <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl overflow-hidden animate-fadeIn">
            {/* Header Status Bar */}
            <div className="bg-gradient-to-r from-emerald-700 via-govTeal-800 to-govTeal-900 text-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>AUTHENTIC & VERIFIED BY NCCT REGISTRY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                  {cert.courseTitle}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100">
                  Issued by {cert.instituteName}
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-lg flex-shrink-0">
                <QRCodeSVG
                  value={`https://ncct.gov.in/verify/${cert.id}`}
                  size={84}
                  level="H"
                  fgColor="#0B6E4F"
                />
              </div>
            </div>

            {/* Information Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-govBg p-4 rounded-2xl border border-govTeal-100 space-y-1">
                  <span className="text-[11px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>Candidate Name</span>
                  </span>
                  <p className="text-base font-bold text-govText-primary">{cert.userName || cert.candidateName}</p>
                  {(cert.userAadhaarMock || cert.cooperative) && (
                    <p className="text-[11px] text-govTeal-800 font-mono">
                      {cert.userAadhaarMock ? `Aadhaar Ref: ${cert.userAadhaarMock}` : `Society: ${cert.cooperative}`}
                    </p>
                  )}
                </div>

                <div className="bg-govBg p-4 rounded-2xl border border-govTeal-100 space-y-1">
                  <span className="text-[11px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>Issue Date & Grade</span>
                  </span>
                  <p className="text-base font-bold text-govText-primary">{cert.issuedDate || cert.issueDate}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold font-mono">Grade: {cert.grade || 'First Class'}</p>
                </div>

                <div className="bg-govBg p-4 rounded-2xl border border-govTeal-100 space-y-1">
                  <span className="text-[11px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>Issuing Institute</span>
                  </span>
                  <p className="text-sm font-bold text-govText-primary">{cert.instituteName}</p>
                  <p className="text-[11px] text-govText-secondary">Ministry of Cooperation</p>
                </div>

                <div className="bg-govBg p-4 rounded-2xl border border-govTeal-100 space-y-1">
                  <span className="text-[11px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-govTeal-600" />
                    <span>Certificate Serial ID</span>
                  </span>
                  <p className="text-sm font-mono font-bold text-govText-primary">{cert.certificateNumber || cert.id}</p>
                  <p className="text-[10px] font-mono text-govTeal-800 truncate">{cert.certificateHash || cert.verificationToken}</p>
                </div>
              </div>

              {/* Cryptographic Guarantee Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cryptographically Immutable Record</p>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                    This digital certification record is cryptographically tied to NCCT’s national registry. Any modification to the course parameters, grades, or issuing authority will invalidate this verification hash.
                  </p>
                </div>
              </div>

              {/* Download Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => downloadCertificatePdf(cert)}
                  className="h-11 px-5 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF Copy</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 border border-rose-200 text-center space-y-3 shadow-md">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-rose-900">Certificate Record Not Found</h3>
            <p className="text-xs text-govText-secondary max-w-md mx-auto">
              No record was found for <strong className="font-mono">{searchId}</strong>. Check for typographical errors or load the sample verified certificate.
            </p>
            <button
              onClick={() => setSearchId('NCCT-CERT-2026-VAM-0089')}
              className="px-4 py-2 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 rounded-xl text-xs font-bold border border-govTeal-200"
            >
              Load Sample Verified Certificate
            </button>
          </div>
        )}

      </div>
    </PublicLayout>
  );
};
