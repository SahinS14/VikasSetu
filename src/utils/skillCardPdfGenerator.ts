import jsPDF from 'jspdf';

export interface SkillCardPdfData {
  traineeName: string;
  registrationId: string;
  affiliation: string;
  institute: string;
  districtState: string;
  isKycVerified: boolean;
  publicToken: string;
  summary: {
    coursesCompleted: number;
    certificatesCount: number;
    trainingHours: number;
    verifiedSkillsCount: number;
  };
  skills: Array<{ name: string; category?: string }>;
  courses: Array<{ title: string; durationHours: number; status: string; completionDate?: string }>;
  certificates: Array<{ id: string; courseTitle: string; issuedDate: string; grade: string }>;
  roles: string[];
}

export function downloadSkillCardPdf(data: SkillCardPdfData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Background tint
  doc.setFillColor(252, 252, 251);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Tricolor stripe
  doc.setFillColor(255, 153, 51); // Saffron
  doc.rect(0, 0, pageWidth / 3, 3.5, 'F');
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 0, pageWidth / 3, 3.5, 'F');
  doc.setFillColor(19, 136, 8); // Green
  doc.rect((pageWidth * 2) / 3, 0, pageWidth / 3, 3.5, 'F');

  // Outer Border (NCCT Teal)
  doc.setDrawColor(11, 110, 79);
  doc.setLineWidth(1.5);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  // Inner Subtle Border
  doc.setDrawColor(220, 235, 228);
  doc.setLineWidth(0.5);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, pageHeight - margin * 2 - 4);

  let y = margin + 10;

  // Header Banner
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
  doc.setTextColor(90, 100, 95);
  doc.text('National Cooperative Database (NCD) • Official Verified Trainee Identity', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setDrawColor(210, 225, 218);
  doc.line(margin + 6, y, pageWidth - margin - 6, y);

  // Skill Card Title Badge
  y += 7;
  doc.setFillColor(11, 110, 79);
  doc.roundedRect(pageWidth / 2 - 45, y - 4, 90, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NCCT DIGITAL SKILL CARD', pageWidth / 2, y + 1.5, { align: 'center' });

  // Trainee Identity Block
  y += 12;
  doc.setFillColor(245, 250, 247);
  doc.setDrawColor(180, 215, 200);
  doc.roundedRect(margin + 6, y, contentWidth - 12, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 110, 79);
  doc.text(data.traineeName, margin + 12, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 75, 70);
  doc.text(`NCCT Reg ID: ${data.registrationId}`, margin + 12, y + 14);
  doc.text(`Primary Affiliation: ${data.affiliation}`, margin + 12, y + 19);
  doc.text(`Training Institute: ${data.institute}`, margin + 12, y + 24);
  doc.text(`Region / District: ${data.districtState || 'Nashik, Maharashtra'}`, margin + 12, y + 29);

  // Verification Pills on right of block
  const pillX = pageWidth - margin - 55;
  doc.setFillColor(230, 245, 235);
  doc.setDrawColor(80, 175, 120);
  doc.roundedRect(pillX, y + 5, 45, 6, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(11, 110, 79);
  doc.text(data.isKycVerified ? '✓ Aadhaar e-KYC Verified' : '✓ Trainee Verified', pillX + 22.5, y + 9, { align: 'center' });

  doc.roundedRect(pillX, y + 13, 45, 6, 1.5, 1.5, 'FD');
  doc.text('✓ Accredited NCCT Record', pillX + 22.5, y + 17, { align: 'center' });

  doc.roundedRect(pillX, y + 21, 45, 6, 1.5, 1.5, 'FD');
  doc.text('✓ Employment Ready', pillX + 22.5, y + 25, { align: 'center' });

  // Summary Metrics Grid (4 items)
  y += 39;
  const colW = (contentWidth - 12) / 4;
  const metrics = [
    { label: 'COURSES DONE', val: `${data.summary.coursesCompleted}` },
    { label: 'CERTIFICATES', val: `${data.summary.certificatesCount}` },
    { label: 'TRAINING HRS', val: `${data.summary.trainingHours}` },
    { label: 'VERIFIED SKILLS', val: `${data.summary.verifiedSkillsCount}` },
  ];

  metrics.forEach((m, idx) => {
    const mx = margin + 6 + idx * colW;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(210, 225, 218);
    doc.roundedRect(mx, y, colW - 2, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 110, 79);
    doc.text(m.val, mx + (colW - 2) / 2, y + 6.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 115, 110);
    doc.text(m.label, mx + (colW - 2) / 2, y + 11, { align: 'center' });
  });

  // Section: Verified Competencies / Skills
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 110, 79);
  doc.text('ACCREDITED & VERIFIED SKILLS', margin + 6, y);

  y += 3;
  doc.setDrawColor(220, 235, 228);
  doc.line(margin + 6, y, pageWidth - margin - 6, y);

  y += 4;
  let curX = margin + 6;
  const rowH = 6;
  const maxSkillW = contentWidth - 12;

  data.skills.slice(0, 8).forEach((sk) => {
    const text = `✓ ${sk.name}`;
    const tw = doc.getTextWidth(text) + 8;
    if (curX + tw > margin + 6 + maxSkillW) {
      curX = margin + 6;
      y += rowH + 2;
    }
    doc.setFillColor(242, 248, 244);
    doc.setDrawColor(180, 215, 200);
    doc.roundedRect(curX, y, tw, rowH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(20, 90, 60);
    doc.text(text, curX + 4, y + 4.2);
    curX += tw + 3;
  });

  // Section: Completed Courses
  y += rowH + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 110, 79);
  doc.text('COMPLETED TRAINING CURRICULUM', margin + 6, y);

  y += 3;
  doc.setDrawColor(220, 235, 228);
  doc.line(margin + 6, y, pageWidth - margin - 6, y);

  y += 3.5;
  data.courses.slice(0, 3).forEach((crs) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 230, 225);
    doc.roundedRect(margin + 6, y, contentWidth - 12, 11, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 40, 35);
    doc.text(crs.title, margin + 10, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 115, 110);
    doc.text(`Duration: ${crs.durationHours} Hours • Institute: ${data.institute}`, margin + 10, y + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 110, 79);
    doc.text('✓ Completed', pageWidth - margin - 26, y + 6.5);

    y += 13;
  });

  // Section: Official Certifications
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 110, 79);
  doc.text('NCCT OFFICIAL CERTIFICATIONS', margin + 6, y);

  y += 3;
  doc.setDrawColor(220, 235, 228);
  doc.line(margin + 6, y, pageWidth - margin - 6, y);

  y += 3.5;
  data.certificates.slice(0, 2).forEach((c) => {
    doc.setFillColor(248, 252, 250);
    doc.setDrawColor(180, 215, 200);
    doc.roundedRect(margin + 6, y, contentWidth - 12, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(11, 110, 79);
    doc.text(`🏆 ${c.courseTitle}`, margin + 10, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(90, 105, 100);
    doc.text(`Certificate ID: ${c.id} • Issued: ${c.issuedDate} • Grade: ${c.grade}`, margin + 10, y + 9.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 110, 79);
    doc.text('✓ Verified', pageWidth - margin - 22, y + 7.5);

    y += 15;
  });

  // Section: Employment Readiness
  y += 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 110, 79);
  doc.text('EMPLOYMENT READINESS & MATCHED ROLES', margin + 6, y);

  y += 3;
  doc.setDrawColor(220, 235, 228);
  doc.line(margin + 6, y, pageWidth - margin - 6, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 55, 50);
  const rolesText = data.roles.length > 0
    ? data.roles.slice(0, 5).join('  •  ')
    : 'PACS ERP Assistant  •  Cooperative Banking Assistant  •  KCC Credit Assistant';
  doc.text(rolesText, margin + 6, y);

  // Footer: Public Scan & Security Notice
  const footerY = pageHeight - margin - 15;
  doc.setDrawColor(210, 225, 218);
  doc.line(margin + 6, footerY - 3, pageWidth - margin - 6, footerY - 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(11, 110, 79);
  doc.text('SCAN TO VERIFY LIVE PROFILE:', margin + 6, footerY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 95, 90);
  const verifyUrl = `${window.location.origin}/skill-card/${data.publicToken}`;
  doc.text(verifyUrl, margin + 6, footerY + 6);
  doc.text('Tamper-evident credential backed by the National Cooperative Database (NCD) Ministry of Cooperation.', margin + 6, footerY + 10);

  // Save the document
  const filename = `NCCT_SkillCard_${data.registrationId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
