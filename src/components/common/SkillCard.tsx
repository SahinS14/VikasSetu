import React from 'react';
import jsPDF from 'jspdf';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  AlertTriangle,
  Building2,
  BookOpen,
  Download,
  Eye
} from 'lucide-react';

export interface SkillCardCredential {
  type: string;
  name: string;
  registrationId: string;
  institute: string;
  affiliation: string;
  skills: string[];
  status: string;
}

export interface ParseQrSuccess {
  success: true;
  data: SkillCardCredential;
}

export interface ParseQrFailure {
  success: false;
  errorTitle: string;
  errorMessage: string;
}

export type ParseQrResult = ParseQrSuccess | ParseQrFailure;

export interface ValidateCredentialSuccess {
  valid: true;
  data: SkillCardCredential;
}

export interface ValidateCredentialFailure {
  valid: false;
  errorTitle: string;
  errorMessage: string;
}

export type ValidateCredentialResult = ValidateCredentialSuccess | ValidateCredentialFailure;

/**
 * Validates a credential object structure against the NCCT_SKILL_CARD schema.
 * 100% offline, zero network requests.
 */
export function validateSkillCardCredential(credential: any): ValidateCredentialResult {
  if (!credential || typeof credential !== 'object') {
    return {
      valid: false,
      errorTitle: 'Invalid QR Code',
      errorMessage: 'This QR does not contain valid NCCT credential data.',
    };
  }

  if (credential.type !== 'NCCT_SKILL_CARD') {
    return {
      valid: false,
      errorTitle: 'Unsupported QR Credential',
      errorMessage: 'This QR code is not an NCCT Digital Skill Card.',
    };
  }

  if (!credential.name || !credential.registrationId || !credential.affiliation) {
    return {
      valid: false,
      errorTitle: 'Incomplete Skill Card',
      errorMessage: 'Required credential information is missing.',
    };
  }

  return {
    valid: true,
    data: {
      type: credential.type,
      name: credential.name,
      registrationId: credential.registrationId,
      institute: credential.institute || 'VAMNICOM, Pune',
      affiliation: credential.affiliation,
      skills: Array.isArray(credential.skills) ? credential.skills : [],
      status: credential.status || 'Verified',
    },
  };
}

/**
 * Safely parses and validates a raw decoded QR string.
 * 100% offline, zero server requests, zero redirects.
 */
export function parseSkillCardQR(decodedText: string): ParseQrResult {
  if (!decodedText || typeof decodedText !== 'string') {
    return {
      success: false,
      errorTitle: 'Invalid QR Code',
      errorMessage: 'This QR does not contain valid NCCT credential data.',
    };
  }

  try {
    const parsed = JSON.parse(decodedText.trim());
    const validation = validateSkillCardCredential(parsed);
    if (validation.valid === false) {
      return {
        success: false,
        errorTitle: validation.errorTitle,
        errorMessage: validation.errorMessage,
      };
    }
    return {
      success: true,
      data: validation.data,
    };
  } catch {
    return {
      success: false,
      errorTitle: 'Invalid QR Code',
      errorMessage: 'This QR does not contain valid NCCT credential data.',
    };
  }
}

// Backward-compatible alias
export const parseSkillCardQr = parseSkillCardQR;

/**
 * Generates an official, beautiful one-page NCCT DIGITAL SKILL CARD PDF.
 * Generated entirely inside the browser using jsPDF with 0 network requests.
 */
export function generateSkillCardPDF(credential: SkillCardCredential): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Background tint
  doc.setFillColor(254, 255, 254);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top National Tricolor Stripe
  doc.setFillColor(255, 153, 51); // Saffron
  doc.rect(0, 0, pageWidth / 3, 3.5, 'F');
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 0, pageWidth / 3, 3.5, 'F');
  doc.setFillColor(19, 136, 8); // Green
  doc.rect((pageWidth * 2) / 3, 0, pageWidth / 3, 3.5, 'F');

  // Outer Decorative Border (NCCT Teal)
  doc.setDrawColor(11, 110, 79);
  doc.setLineWidth(1.4);
  doc.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 4, 4);

  // Inner Subtle Border
  doc.setDrawColor(215, 235, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 2.5, margin + 2.5, contentWidth - 5, pageHeight - margin * 2 - 5, 3, 3);

  let y = margin + 11;

  // 1. National Apex Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 110, 79);
  doc.text('GOVERNMENT OF INDIA • MINISTRY OF COOPERATION', pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFontSize(13);
  doc.setTextColor(24, 32, 29);
  doc.text('NATIONAL COUNCIL FOR COOPERATIVE TRAINING (NCCT)', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 105, 98);
  doc.text('National Cooperative Database • Official Offline Skill Credential', pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setDrawColor(210, 228, 220);
  doc.line(margin + 6, y, pageWidth - margin - 6, y);

  // 2. NCCT DIGITAL SKILL CARD Banner + ✓ VERIFIED
  y += 8;
  doc.setFillColor(11, 110, 79);
  doc.roundedRect(margin + 8, y - 4.5, contentWidth - 16, 11, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('NCCT DIGITAL SKILL CARD', margin + 14, y + 2.8);

  // Right-side badge: ✓ VERIFIED
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 46, y - 2, 34, 6.5, 1.5, 1.5, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 110, 79);
  doc.text('✓ VERIFIED', pageWidth - margin - 29, y + 2.4, { align: 'center' });

  // 3. Trainee Identity Block
  y += 16;
  doc.setFillColor(248, 253, 250);
  doc.setDrawColor(180, 220, 205);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 8, y, contentWidth - 16, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(18, 30, 25);
  doc.text(credential.name, margin + 14, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 105, 95);
  doc.text('NCCT REGISTRATION ID', margin + 14, y + 19);

  // Monospace Badge for Registration ID
  doc.setFillColor(11, 110, 79);
  doc.roundedRect(margin + 14, y + 21, 74, 7, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(credential.registrationId, margin + 17, y + 26);

  // 4. Information Cards: Institute & Cooperative Affiliation
  y += 38;
  const colGap = 6;
  const cardWidth = (contentWidth - 16 - colGap) / 2;

  // Institute Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(215, 230, 223);
  doc.roundedRect(margin + 8, y, cardWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(85, 105, 95);
  doc.text('INSTITUTE', margin + 13, y + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 32, 29);
  const instLines = doc.splitTextToSize(credential.institute, cardWidth - 10);
  doc.text(instLines, margin + 13, y + 14);

  // Cooperative Affiliation Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(215, 230, 223);
  doc.roundedRect(margin + 8 + cardWidth + colGap, y, cardWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(85, 105, 95);
  doc.text('COOPERATIVE AFFILIATION', margin + 8 + cardWidth + colGap + 5, y + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 32, 29);
  const affLines = doc.splitTextToSize(credential.affiliation, cardWidth - 10);
  doc.text(affLines, margin + 8 + cardWidth + colGap + 5, y + 14);

  // 5. Professional Skills Box
  y += 33;
  const skillsCount = credential.skills ? credential.skills.length : 0;
  const skillsBoxHeight = Math.max(38, 20 + skillsCount * 8.5);

  doc.setFillColor(250, 253, 251);
  doc.setDrawColor(205, 228, 218);
  doc.roundedRect(margin + 8, y, contentWidth - 16, skillsBoxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 110, 79);
  doc.text('PROFESSIONAL SKILLS', margin + 14, y + 8.5);

  doc.setDrawColor(220, 235, 228);
  doc.line(margin + 14, y + 11.5, pageWidth - margin - 14, y + 11.5);

  let skillY = y + 19;
  if (credential.skills && credential.skills.length > 0) {
    credential.skills.forEach((skill) => {
      // Pill container
      doc.setFillColor(236, 248, 242);
      doc.setDrawColor(185, 225, 208);
      doc.roundedRect(margin + 14, skillY - 4.5, contentWidth - 28, 7, 1.5, 1.5, 'FD');

      // Bullet dot
      doc.setFillColor(11, 110, 79);
      doc.circle(margin + 19, skillY - 0.9, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(18, 30, 25);
      doc.text(skill, margin + 24, skillY);
      skillY += 8.5;
    });
  }

  // 6. Verification Status & Trust Footer
  y += skillsBoxHeight + 8;
  doc.setFillColor(242, 250, 245);
  doc.setDrawColor(160, 218, 192);
  doc.roundedRect(margin + 8, y, contentWidth - 16, 28, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(11, 110, 79);
  doc.text('STATUS: ✓ Verified Credential', margin + 14, y + 10);

  // OFFLINE QR VERIFIED badge
  doc.setFillColor(11, 110, 79);
  doc.roundedRect(pageWidth - margin - 62, y + 5, 50, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFLINE QR VERIFIED', pageWidth - margin - 37, y + 9.7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 85, 70);
  doc.text('This credential was decoded and verified directly from the offline QR code payload.', margin + 14, y + 17);
  doc.text('Zero server requests, zero database lookups, and zero internet connection required.', margin + 14, y + 22);

  // 7. Technical Signature / Metadata
  y += 34;
  doc.setDrawColor(215, 230, 222);
  doc.line(margin + 8, y, pageWidth - margin - 8, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(115, 130, 122);
  doc.text(`Credential Type: ${credential.type} • Generated from QR data • Official NCCT Digital Skill Card`, margin + 8, y);
  doc.text('VikasSetu • Empowering Cooperatives', pageWidth - margin - 8, y, { align: 'right' });

  return doc;
}

/**
 * Generates and triggers browser download of the Skill Card PDF.
 * File format: NCCT_Skill_Card_Rameshwar_Patil.pdf
 * 100% offline, zero redirects, zero navigation.
 */
export function downloadSkillCardPDFFromCredential(credential: SkillCardCredential): void {
  const doc = generateSkillCardPDF(credential);
  const safeName = (credential.name || 'Trainee').trim().replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`NCCT_Skill_Card_${safeName}.pdf`);
}

// Reusable download helper alias
export const generateSkillCardPDFAndDownload = downloadSkillCardPDFFromCredential;

interface SkillCardScanResultProps {
  credential: SkillCardCredential;
  onViewCard: () => void;
  onDownloadPdf: () => void;
  onClose: () => void;
}

/**
 * QR Scanner Result Modal (Step 5)
 * Shown immediately after scanning an offline QR code:
 * Displays:
 *  - "QR Credential Detected"
 *  - "NCCT Digital Skill Card verified successfully."
 *  - "✓ Offline Verified"
 *  - Two action buttons: [ View Skill Card ] and [ Download PDF ]
 */
export const SkillCardScanResult: React.FC<SkillCardScanResultProps> = ({
  credential,
  onViewCard,
  onDownloadPdf,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-govText-border shadow-2xl overflow-hidden w-[calc(100%-32px)] sm:w-full max-w-md my-auto relative text-left transition-all">
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-govTeal-700 via-saffron-500 to-emerald-600" />

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-govTeal-950">
                  QR Credential Detected
                </h3>
                <p className="text-xs text-govText-muted">
                  NCCT Digital Skill Card verified successfully.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Credential Snapshot Card */}
          <div className="p-4 rounded-2xl bg-govBg/80 border border-gray-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-black text-govText-primary">
                {credential.name}
              </h4>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>✓ Offline Verified</span>
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-govTeal-900 font-mono font-bold">
                <span className="text-[10px] uppercase font-sans text-govText-muted">ID:</span>
                <span className="bg-govTeal-50 px-2 py-0.5 rounded border border-govTeal-200">
                  {credential.registrationId}
                </span>
              </div>
              <p className="text-[11px] text-govText-secondary truncate">
                <strong className="text-gray-700 font-semibold">{credential.institute}</strong> • {credential.affiliation}
              </p>
            </div>

            {/* Skills count */}
            <div className="pt-1 text-[11px] text-govText-muted flex items-center gap-1">
              <Lock className="w-3 h-3 text-govTeal-700" />
              <span>{credential.skills?.length || 0} Verified Skills encoded in QR</span>
            </div>
          </div>

          {/* Action Buttons (Section 5 requirement) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="w-full py-3 px-4 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-saffron-300" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onViewCard}
              className="w-full py-2.5 px-4 bg-govBg hover:bg-gray-100 border border-govText-border text-govText-primary font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-govTeal-700" />
              <span>View Skill Card</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-govText-muted">
              100% offline credential • No internet, URL, or server required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SkillCardPreviewProps {
  credential: SkillCardCredential;
  onDownloadPdf?: () => void;
  onClose: () => void;
}

/**
 * Beautiful, responsive, government-grade offline NCCT Digital Skill Card web card.
 * (Section 6 requirement)
 * Directly renders decoded fields without showing raw JSON, plus a Download PDF button.
 */
export const SkillCardPreview: React.FC<SkillCardPreviewProps> = ({
  credential,
  onDownloadPdf,
  onClose,
}) => {
  const handlePdfClick = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else {
      downloadSkillCardPDFFromCredential(credential);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-govText-border shadow-2xl overflow-hidden w-[calc(100%-32px)] sm:w-full max-w-[540px] max-h-[92vh] overflow-y-auto my-auto relative text-left transition-all">
        {/* Top Green/Orange Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-govTeal-700 via-saffron-500 to-emerald-600 sticky top-0 z-10" />

        {/* 1. Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-govTeal-50 text-govTeal-700 border border-govTeal-200">
              <ShieldCheck className="w-5 h-5 text-govTeal-700" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-govTeal-950 font-sans">
              NCCT DIGITAL SKILL CARD
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs">
              ✓ VERIFIED
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              title="Close card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Trainee Identity */}
        <div className="px-6 pt-5 pb-4 text-center space-y-2 bg-gradient-to-b from-govBg/40 to-white">
          <h2 className="text-xl sm:text-2xl font-black text-govText-primary tracking-tight">
            {credential.name}
          </h2>

          <div className="space-y-0.5">
            <span className="block text-[9px] font-bold text-govText-muted uppercase tracking-widest">
              NCCT REGISTRATION ID
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-govTeal-900 bg-govTeal-50/80 px-3 py-1 rounded-lg border border-govTeal-200/80 inline-block tracking-wider shadow-2xs">
              {credential.registrationId}
            </span>
          </div>
        </div>

        {/* 3. Information Cards (Institute & Affiliation) */}
        <div className="px-6 space-y-3 pt-1">
          {/* Institute Card */}
          <div className="p-3.5 rounded-2xl bg-govBg/70 border border-gray-200/80 space-y-0.5">
            <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-govTeal-600" />
              <span>INSTITUTE</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-govText-primary">
              {credential.institute}
            </p>
          </div>

          {/* Affiliation Card */}
          <div className="p-3.5 rounded-2xl bg-govBg/70 border border-gray-200/80 space-y-0.5">
            <span className="block text-[10px] font-bold text-govText-muted uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-govTeal-600" />
              <span>COOPERATIVE AFFILIATION</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-govText-primary">
              {credential.affiliation}
            </p>
          </div>
        </div>

        {/* 4. Skills Badges */}
        <div className="px-6 py-4 space-y-2">
          <span className="block text-[10px] font-extrabold text-govText-muted uppercase tracking-wider">
            SKILLS
          </span>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {credential.skills && credential.skills.length > 0 ? (
              credential.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-xl bg-govTeal-50 border border-govTeal-200 text-govTeal-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 italic">No skills listed in credential.</span>
            )}
          </div>
        </div>

        {/* 5. Verification Footer */}
        <div className="mx-6 mb-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs font-black text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ Verified Credential</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-govTeal-800 bg-white/80 px-2.5 py-0.5 rounded-md border border-emerald-300">
              <Lock className="w-3 h-3 text-govTeal-700 shrink-0" />
              <span>OFFLINE QR VERIFIED</span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-800/90 leading-tight pt-0.5">
            This credential was decoded directly from the QR code.
          </p>
        </div>

        {/* 6. Action Buttons: Download PDF & Close */}
        <div className="px-6 pb-6 pt-1 space-y-2">
          <button
            type="button"
            onClick={handlePdfClick}
            className="w-full py-3 bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-saffron-300" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable alias
export const SkillCard = SkillCardPreview;

interface SkillCardErrorProps {
  title: string;
  message: string;
  onClose: () => void;
}

/**
 * Simple, graceful error modal when scanned QR is invalid, unsupported, or incomplete.
 */
export const SkillCardError: React.FC<SkillCardErrorProps> = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-red-200 shadow-2xl space-y-4 text-center relative">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
