import jsPDF from 'jspdf';
import { Certificate } from '../types';

export function downloadCertificatePdf(cert: Certificate) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background tint
  doc.setFillColor(247, 245, 240); // #F7F5F0
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Border (Gov Teal)
  doc.setDrawColor(11, 110, 79); // #0B6E4F
  doc.setLineWidth(3);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner Border (Warm Saffron)
  doc.setDrawColor(230, 138, 46); // #E68A2E
  doc.setLineWidth(1);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Top Emblem / Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 110, 79);
  doc.text('GOVERNMENT OF INDIA • MINISTRY OF COOPERATION', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(30, 37, 35);
  doc.text('NATIONAL COUNCIL FOR COOPERATIVE TRAINING (NCCT)', pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(91, 102, 96);
  doc.text('An Autonomous Body under Ministry of Cooperation, New Delhi', pageWidth / 2, 36, { align: 'center' });

  // Divider line
  doc.setDrawColor(220, 228, 223);
  doc.line(40, 40, pageWidth - 40, 40);

  // Certificate Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(11, 110, 79);
  doc.text('DIGITAL CERTIFICATE OF COMPLETION', pageWidth / 2, 52, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(91, 102, 96);
  doc.text('This is to certify that', pageWidth / 2, 62, { align: 'center' });

  // Trainee Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 37, 35);
  doc.text(cert.userName.toUpperCase(), pageWidth / 2, 74, { align: 'center' });

  if (cert.userAadhaarMock) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(138, 151, 145);
    doc.text(`[ Aadhaar Verified: ${cert.userAadhaarMock} ]`, pageWidth / 2, 80, { align: 'center' });
  }

  // Course completion text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(91, 102, 96);
  doc.text('has successfully completed the specialized capacity-building programme on', pageWidth / 2, 92, { align: 'center' });

  // Course Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(11, 110, 79);
  doc.text(`"${cert.courseTitle}"`, pageWidth / 2, 104, { align: 'center' });

  // Institute Name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 37, 35);
  doc.text(`Conducted and Examined by: ${cert.instituteName}`, pageWidth / 2, 116, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(91, 102, 96);
  doc.text(`Performance Grade: ${cert.grade || 'First Class'} • Date of Issue: ${cert.issuedDate}`, pageWidth / 2, 124, { align: 'center' });

  // Footer Metadata Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 228, 223);
  doc.roundedRect(24, 138, pageWidth - 48, 48, 3, 3, 'FD');

  // Certificate ID & Hash
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 110, 79);
  doc.text('NATIONAL COOPERATIVE REGISTRY RECORD:', 30, 146);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 37, 35);
  doc.text(`Certificate No : ${cert.id}`, 30, 154);
  doc.text(`Digital Hash   : ${cert.certificateHash}`, 30, 161);
  doc.text(`Verification   : https://ncct.gov.in/verify/${cert.id}`, 30, 168);
  doc.text(`DigiLocker Ref : SIMULATED PROTOTYPE (NAD/DigiLocker Compliant)`, 30, 175);

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 37, 35);
  doc.text('Dr. Vivek Swaroop', 215, 162, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(91, 102, 96);
  doc.text('Secretary, NCCT', 215, 168, { align: 'center' });
  doc.text('(Government of India)', 215, 173, { align: 'center' });

  // Save the PDF
  doc.save(`${cert.id}_VikasSetu.pdf`);
}
