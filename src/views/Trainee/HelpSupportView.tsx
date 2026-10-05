import React, { useState } from 'react';
import {
  HelpCircle,
  Phone,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  Building2,
  FileQuestion,
  Headphones
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';

export const HelpSupportView: React.FC = () => {
  const { currentLanguage, t } = useApp();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [ticketCategory, setTicketCategory] = useState('courses');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const faqs = [
    {
      q: currentLanguage === 'hi' ? 'VikasSetu पर कोर्स में नामांकन कैसे करें?' : currentLanguage === 'mr' ? 'VikasSetu वर कोर्समध्ये प्रवेश कसा घ्यावा?' : 'How do I enroll in a course on VikasSetu?',
      a: currentLanguage === 'hi'
        ? 'राष्ट्रीय कोर्स कैटलॉग (Course Catalog) पर जाएं, अपनी रुचि का कोर्स चुनें और "Enroll & Start Course" पर क्लिक करें। पैक्स और सहकारी समिति के सदस्यों के लिए सभी कोर्स निःशुल्क हैं।'
        : currentLanguage === 'mr'
        ? 'राष्ट्रीय कोर्स कॅटलॉगवर जा, तुमचा आवडीचा कोर्स निवडा आणि "Enroll" वर क्लिक करा. सर्व सहकारी संस्थांच्या सभासदांसाठी हे विनामूल्य आहे.'
        : 'Navigate to the National Course Catalog, select your desired cooperative curriculum (e.g. PACS ERP, Dairy Cold Chain, or Banking), and click "Enroll & Start Course". All courses are fully subsidized for PACS members.'
    },
    {
      q: currentLanguage === 'hi' ? 'डिजिटल प्रमाणपत्र कैसे प्राप्त करें?' : currentLanguage === 'mr' ? 'प्रमाणपत्र कसे मिळवायचे?' : 'How do I earn an official NCCT certificate?',
      a: currentLanguage === 'hi'
        ? 'प्रत्येक कोर्स के सभी मॉड्यूल्स पूरा करने के बाद मूल्यांकन क्विज में कम से कम 75% या 80% अंक प्राप्त करें। उत्तीर्ण होने पर डिजिटल प्रमाणपत्र तुरंत जनरेट होकर आपके "My Certificates" सेक्शन में उपलब्ध हो जाता है।'
        : currentLanguage === 'mr'
        ? 'प्रत्येक मॉड्यूलचे धडे पूर्ण केल्यानंतर परीक्षा द्या आणि किमान ७५% गुण मिळवा. उत्तीर्ण झाल्यावर "My Certificates" मध्ये प्रमाणपत्र लगेच तयार होते.'
        : 'Complete all required lessons in the course curriculum and score at least 75% or 80% on the module assessment quiz. Upon passing, a tamper-proof digital certificate is instantly issued to your "My Certificates" desk.'
    },
    {
      q: currentLanguage === 'hi' ? 'प्रमाणपत्र की प्रामाणिकता कैसे सत्यापित करें?' : currentLanguage === 'mr' ? 'प्रमाणपत्राची सत्यता कशी तपासायची?' : 'How can employers or banks verify my certificate?',
      a: currentLanguage === 'hi'
        ? 'प्रत्येक प्रमाणपत्र पर एक अद्वितीय सत्यापन कोड और क्यूआर कोड होता है। कोई भी बैंक या नियोक्ता "Verify Certificate" पेज पर जाकर प्रमाणपत्र कोड डालकर वास्तविक समय में वैधता जांच सकता है।'
        : currentLanguage === 'mr'
        ? 'प्रमाणपत्रावर दिलेला क्यूआर कोड स्कॅन करून किंवा पोर्टलवरील "Verify Certificate" वर कोड टाकून त्वरित पडताळणी करता येते.'
        : 'Every certificate features a secure cryptographic QR code and unique ID (e.g. NCCT-CERT-2026-VAM-0089). Employers can scan the QR code or enter the ID on our public verification portal to confirm genuine NCCT issuance.'
    },
    {
      q: currentLanguage === 'hi' ? 'नौकरियों के लिए रुचि (Interest) कैसे दर्ज करें?' : currentLanguage === 'mr' ? 'नोकरीसाठी अर्ज कसा करावा?' : 'How do I apply or express interest in cooperative jobs?',
      a: currentLanguage === 'hi'
        ? 'जॉब ऑपर्च्युनिटीज (Job Opportunities) पेज पर जाएं। अमूल, इफको या सहकारी बैंकों के रिक्त पदों पर "Express Interest" बटन पर क्लिक करें। आपका सत्यापित प्रोफाइल सीधे नियोक्ता के भर्ती प्रकोष्ठ को प्रेषित हो जाता है।'
        : currentLanguage === 'mr'
        ? 'जॉब ऑपर्च्युनिटीज विभागात जाऊन अमूल, इफको किंवा जिल्हा बँकांच्या जागांसाठी "Express Interest" बटनावर क्लिक करा.'
        : 'Visit the Job Opportunities section, select any opening from AMUL, IFFCO, or State Apex Banks, and click "Express Interest". Your certified training credentials are shared directly with the cooperative recruiter.'
    },
    {
      q: currentLanguage === 'hi' ? 'ग्रामीण ऑफलाइन मोड कैसे कार्य करता है?' : currentLanguage === 'mr' ? 'ऑफलाइन मोड कसा कार्य करतो?' : 'How does the rural offline mode work?',
      a: currentLanguage === 'hi'
        ? 'कमजोर इंटरनेट वाले ग्रामीण क्षेत्रों में आप हेडर या सेटिंग्स से "Offline Mode" सक्रिय कर सकते हैं। यह आपके डिवाइस में पाठ्य सामग्री को कैश कर लेता है जिससे आप बिना इंटरनेट के भी पढ़ाई जारी रख सकते हैं।'
        : currentLanguage === 'mr'
        ? 'कमी इंटरनेट असलेल्या गावांमध्ये तुम्ही "Offline Mode" सुरू करू शकता. यामुळे इंटरनेट नसतानाही अभ्यास करणे शक्य होते.'
        : 'In remote rural PACS areas with intermittent connectivity, toggle "Rural Offline Mode" in the header or Settings. Course text and diagrams are securely cached on your browser for offline study and automatically sync when connectivity returns.'
    },
    {
      q: currentLanguage === 'hi' ? 'ई-केवाईसी (e-KYC) में समस्या आने पर क्या करें?' : currentLanguage === 'mr' ? 'ई-केवायसी अडचणीसाठी काय करावे?' : 'What should I do if my Aadhaar e-KYC verification is pending?',
      a: currentLanguage === 'hi'
        ? 'सुनिश्चित करें कि आपका आधार कार्ड आपके मोबाइल नंबर से लिंक है ताकि ओटीपी प्राप्त हो सके। यदि समस्या बनी रहती है तो हमारी हेल्पलाइन 1800-11-2026 पर संपर्क करें।'
        : currentLanguage === 'mr'
        ? 'आधार कार्ड मोबाईल नंबरशी जोडलेले असल्याची खात्री करा किंवा आमच्या टोल-फ्री क्रमांकावर संपर्क साधा.'
        : 'Ensure your Aadhaar is linked to your active mobile number to receive the simulated OTP. If verification fails, contact your PACS Secretary or call our national helpdesk toll-free at 1800-11-2026.'
    }
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    const tktId = `NCCT-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedTicketId(tktId);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => setSubmittedTicketId(null), 8000);
  };

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              Trainee Assistance Cell
            </span>
            <SimulatedBadge text="NCCT 24/7 National Desk" />
          </div>
          <h1 className="text-2xl font-extrabold text-govText-primary mt-1">
            {t.help?.title || 'Help & Support Desk'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1">
            {t.help?.subtitle || 'Get answers to common cooperative training questions or reach out to our dedicated NCCT support team.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-saffron-50 border border-saffron-200 px-4 py-2.5 rounded-xl text-xs font-bold text-saffron-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-saffron-600" />
            <span>Toll-Free: 1800-11-2026</span>
          </div>
        </div>
      </div>

      {/* 2. Contact Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-govTeal-100 flex items-center justify-center text-govTeal-700 flex-shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-govText-primary">Toll-Free Support</p>
            <p className="text-xs font-bold text-govTeal-800">1800-11-2026</p>
            <p className="text-[10px] text-govText-muted">Mon–Sat, 9 AM – 6 PM</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center text-saffron-800 flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-govText-primary">Official Email</p>
            <p className="text-xs font-bold text-govTeal-800">support@sarthi.gov.in</p>
            <p className="text-[10px] text-govText-muted">Response within 24 hours</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-govText-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-govText-primary">Headquarters</p>
            <p className="text-xs font-bold text-govTeal-800">NCCT, New Delhi</p>
            <p className="text-[10px] text-govText-muted">Ministry of Cooperation</p>
          </div>
        </div>
      </div>

      {/* 3. FAQs & Ticket Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FAQs Accordion (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-govTeal-600" />
            <h2 className="text-base font-bold text-govText-primary">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-govText-border shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full p-4 sm:p-4.5 min-h-[48px] text-left flex items-center justify-between gap-3 hover:bg-govBg/50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-govText-primary">
                      {faq.q}
                    </span>
                    <span className="text-govText-muted flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4.5 pb-4.5 pt-1 text-xs text-govText-secondary leading-relaxed border-t border-gray-100 bg-gray-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Ticket Submission Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-6 border border-govText-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Headphones className="w-4 h-4 text-govTeal-600" />
              <h2 className="text-base font-bold text-govText-primary">
                Submit Support Inquiry
              </h2>
            </div>

            {submittedTicketId && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 space-y-1 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ticket Logged Successfully!</span>
                </div>
                <p className="text-[11px] font-normal text-emerald-900">
                  Your reference ID is <span className="font-bold">{submittedTicketId}</span>. Our training coordinator will review and reply within 1 business day.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-govText-primary">Inquiry Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 font-medium"
                >
                  <option value="courses">Courseware & Lessons</option>
                  <option value="cert">Certificate & QR Verification</option>
                  <option value="jobs">Job Placement & Recruiter Bridge</option>
                  <option value="attendance">Biometric / QR Attendance Kiosk</option>
                  <option value="technical">Technical & e-KYC Issue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-govText-primary">Subject</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-govText-primary">Detailed Message</label>
                <textarea
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Please describe what you experienced..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 min-h-[44px] bg-govTeal-600 hover:bg-govTeal-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
