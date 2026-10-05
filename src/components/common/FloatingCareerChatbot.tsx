import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Volume2,
  VolumeX,
  User,
  X,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const FloatingCareerChatbot: React.FC = () => {
  const { currentUser, currentLanguage, activeView } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Automatically close chatbot if user navigates to another page
  useEffect(() => {
    setIsOpen(false);
  }, [activeView]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const isInstituteAdmin = currentUser.role === 'institute_admin';
    const welcomeText = isInstituteAdmin
      ? currentLanguage === 'hi'
        ? `नमस्ते ${currentUser.name}! मैं आपका सहकार सहायक (AI Advisor) हूँ। आप मुझसे पैक्स प्रशिक्षण पाठ्यक्रम, अभ्यर्थी नामांकन, छात्रावास क्षमता, समय-सारिणी या एनसीसीटी दिशानिर्देशों के बारे में पूछ सकते हैं।`
        : currentLanguage === 'mr'
        ? `नमस्कार ${currentUser.name}! मी तुमचा सहकार सहायक (AI सल्लागार) आहे. तुम्ही मला प्रशिक्षण अभ्यासक्रम, उमेदवार नामांकन, वसतिगृह क्षमता किंवा वेळापत्रकाबद्दल विचारू शकता.`
        : `Namaste ${currentUser.name}! I am your Sahakar Sahayak AI Advisor. Ask me anything about PACS training curriculum, candidate nominations, hostel capacity, timetable scheduling, or NCCT guidelines.`
      : currentLanguage === 'hi'
      ? `नमस्ते ${currentUser.name}! मैं आपका सहकार सहायक (AI Career & Training Advisor) हूँ। आप मुझसे पैक्स कंप्यूटरीकरण, दुग्ध सहकारी संघ, स्वयं सहायता समूह (SHG) या एनसीसीटी प्रमाणन से जुड़े रोजगार के बारे में कोई भी प्रश्न पूछ सकते हैं।`
      : currentLanguage === 'mr'
      ? `नमस्कार ${currentUser.name}! मी तुमचा सहकार सहायक (AI करिअर सल्लागार) आहे. तुम्ही मला पॅक्स संगणकीकरण, दुग्ध सहकारी संस्था किंवा एनसीसीटी प्रमाणपत्राच्या आधारे मिळणाऱ्या नोकऱ्यांबद्दल विचारू शकता.`
      : `Namaste ${currentUser.name}! I am your Sahakar Sahayak (AI Cooperative Career & Scheme Advisor). Ask me anything about PACS modernization roles, Dairy AMCS qualifications, SHG governance, or NCCT certificate career pathways.`;

    return [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Listen for custom event or navigation to open bot
  useEffect(() => {
    const handleOpenBot = () => setIsOpen(true);
    window.addEventListener('open-career-bot', handleOpenBot);
    return () => window.removeEventListener('open-career-bot', handleOpenBot);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'mr' ? 'mr-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const generateBotResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();

    // Institute Admin specific queries
    if (currentUser.role === 'institute_admin') {
      if (query.includes('nomination') || query.includes('approve') || query.includes('नामांकन')) {
        return currentLanguage === 'hi'
          ? `अभ्यर्थी नामांकन प्रक्रिया:\n1. 'Nominations' टैब में जाकर लंबित अभ्यर्थियों की सूची देखें।\n2. अभ्यर्थी के पैक्स/सहकारी संस्था का विवरण और आधार ई-केवाईसी सत्यापित करें।\n3. 'Approve' बटन दबाकर छात्रावास एवं बैच में स्थान आवंटित करें।\n\nस्वीकृत अभ्यर्थियों को एसएमएस द्वारा सूचना भेजी जाती है।`
          : `Nomination Review Protocol:\n1. Navigate to the 'Nominations' tab to inspect pending trainees.\n2. Verify the sponsoring PACS credentials and Aadhaar e-KYC status.\n3. Tap 'Approve' to allocate batch seat & hostel accommodation. Approved candidates immediately receive SMS joining circulars.`;
      }
      if (query.includes('hostel') || query.includes('room') || query.includes('bed') || query.includes('छात्रावास')) {
        return currentLanguage === 'hi'
          ? `छात्रावास आवंटन दिशानिर्देश:\n- वाम्निकॉम परिसर में 8 ब्लॉक और 450 आवासीय बिस्तर उपलब्ध हैं।\n- 'Hostel & Rooms' में जाकर रिक्त कमरों की जांच करें और एक क्लिक में बिस्तर असाइन करें।`
          : `Hostel Allocation Guide:\n- VAMNICOM campus features 8 residential blocks with 450 bed capacity.\n- Go to 'Hostel & Rooms' to monitor real-time block occupancy and assign beds to approved residential trainees.`;
      }
      if (query.includes('timetable') || query.includes('lab') || query.includes('समय') || query.includes('वेळापत्रक')) {
        return `Academic Timetable Schedule:\n- Manage weekly schedules for Smart Computer Lab 2, Auditorium B, and Lecture Hall 1.\n- On mobile screens, use the single-day view with Next/Previous buttons to view daily sessions.`;
      }
      if (query.includes('kiosk') || query.includes('attendance') || query.includes('बायोमेट्रिक')) {
        return `Attendance Kiosk Operations:\n- The optical fingerprint and QR check-in kiosk runs under 'Sessions & Kiosk'.\n- Data syncs in real-time to the NCCT Central Cloud Hub with offline buffering support.`;
      }
    }

    // Trainee / Common queries
    if (query.includes('pacs') || query.includes('पैक्स') || query.includes('पॅक्स') || query.includes('manager')) {
      if (currentLanguage === 'hi') {
        return `पैक्स (PACS) प्रबंधक या ई-आरपी ऑपरेटर बनने के लिए मुख्य योग्यताएं:\n1. **एनसीसीटी राष्ट्रीय पैक्स ई-आरपी प्रमाणपत्र** (Module 1 & 2 उत्तीर्ण)।\n2. दैनिक रोकड़ बही (Cash Book) एवं केसीसी ऋण खाता संधारण का व्यावहारिक ज्ञान।\n3. सीएससी (CSC) ग्रामीण नागरिक सेवाएं प्रदान करने की दक्षता।\n\nइफको (IFFCO) एवं जिला सहकारी बैंकों में वर्तमान में पैक्स बिजनेस एसोसिएट के कई पद उपलब्ध हैं।`;
      } else if (currentLanguage === 'mr') {
        return `पॅक्स (PACS) व्यवस्थापक किंवा ऑपरेटरसाठी मुख्य कौशल्ये:\n१. **एनसीसीटी पॅक्स ई-आरपी प्रमाणपत्र**.\n२. दैनंदिन रोख नोंद आणि पीक कर्ज (KCC) वाटप प्रणाली.\n३. सीएससी डिजिटल नागरिक सेवा हाताळणी.\n\nतुम्ही 'Job Opportunities' विभागात जाऊन थेट अर्ज करू शकता.`;
      } else {
        return `To become a certified PACS Manager or ERP Operator:\n1. Complete NCCT's "PACS Computerization & ERP Operations" course with ≥75% score.\n2. Master Day-Open/Day-Close cash book posting & KCC credit limits under DLTC.\n3. Understand CSC e-governance service delivery.\n\nCheck out the IFFCO posting in your Job Opportunities tab!`;
      }
    }

    if (query.includes('dairy') || query.includes('milk') || query.includes('amul') || query.includes('दूध') || query.includes('डेयरी')) {
      if (currentLanguage === 'hi') {
        return `दुग्ध सहकारी क्षेत्र (जैसे अमूल, मदर डेयरी) में रोजगार के मुख्य अवसर:\n- **एएमसीएस (AMCS) एवं गुणवत्ता परीक्षक:** स्वचालित मिल्क एनालाइजर पर फैट/एसएनएफ परीक्षण एवं किसान डीबीटी भुगतान।\n- **बीएमसी (BMC) कोल्ड चेन ऑपरेटर:** बल्क मिल्क कूलर का 4°C पर रख-रखाव।\n\nएनसीसीटी का 'Dairy Cold Chain' कोर्स पूरा करने वाले उम्मीदवारों को प्राथमिकता दी जाती है।`;
      } else if (currentLanguage === 'mr') {
        return `दुग्ध व्यवसाय आणि अमूल/महानंद सारख्या सहकारी संघांमध्ये:\n- **AMCS गुणवत्ता निरीक्षक:** फॅट व एसएनएफ तपासणी आणि शेतकरी बिल वाटप.\n- **बीएमसी शीत साखळी तंत्रज्ञ:** दूध ४ अंश तापमानावर टिकवणे.`;
      } else {
        return `Opportunities in Dairy Cooperatives (AMUL / State Dairy Federations):\n- **AMCS Quality Testing Officer:** Operating ultrasonic milk analyzers, measuring FAT/SNF, and handling direct farmer bank settlements.\n- **Bulk Milk Cooler (BMC) Technician:** Maintaining chilling temperatures at 4°C.\n\nCheck out the AMUL posting in the Job Opportunities tab!`;
      }
    }

    if (query.includes('certificate') || query.includes('प्रमाणपत्र') || query.includes('degree') || query.includes('verify')) {
      if (currentLanguage === 'hi') {
        return `VikasSetu पर मिलने वाले सभी डिजिटल प्रमाणपत्र राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) द्वारा अधिकृत एवं सत्यापित होते हैं। प्रत्येक प्रमाणपत्र पर एक अद्वितीय क्यूआर कोड होता है जिसे कोई भी बैंक या नियोक्ता तुरंत सत्यापित कर सकता है।`;
      } else if (currentLanguage === 'mr') {
        return `VikasSetu वरील सर्व डिजिटल प्रमाणपत्रे NCCT द्वारे प्रमाणित आहेत. या प्रमाणपत्रांवर डिजिटल क्यूआर कोड असतो, ज्यामुळे लगेच पडताळणी करता येते.`;
      } else {
        return `All digital credentials issued on VikasSetu are accredited by the National Council for Cooperative Training (NCCT), Ministry of Cooperation. Each certificate contains a tamper-proof QR code verifiable in real time.`;
      }
    }

    if (query.includes('shg') || query.includes('महिला') || query.includes('बचत') || query.includes('credit')) {
      if (currentLanguage === 'hi') {
        return `स्वयं सहायता समूह (SHG) महासंघों में करियर:\n- **समुदाय संसाधन व्यक्ति (CRP) एवं बैंक सखी**\n- **पंचसूत्र एवं डिजिटल बुक-कीपिंग विशेषज्ञ**\n- बैंकों से ₹20 लाख तक के ऋण लिंकेज हेतु सूक्ष्म निवेश योजना (MIP) तैयार करना।`;
      } else {
        return `SHG Federation Leadership & Linkage Roles:\n- **Community Resource Person (CRP) & Bank Sakhi**\n- **Digital Bookkeeping & Panchasutra Compliance**\n- Facilitating bank credit linkage up to ₹20 Lakhs collateral-free for rural women.`;
      }
    }

    // Default Fallback
    if (currentLanguage === 'hi') {
      return `आपका प्रश्न सहकारी विकास की दृष्टि से बहुत महत्वपूर्ण है। एनसीसीटी के 20 संस्थान (वाम्निकॉम, 5 आरआईसीएम एवं 14 आईसीएम) ग्रामीण युवाओं एवं पैक्स कर्मियों को व्यावहारिक प्रशिक्षण प्रदान करते हैं। आप इस पोर्टल पर कोई भी कोर्स पूरा करके सीधे सरकारी एवं सहकारी नियोक्ताओं से जुड़ सकते हैं।`;
    } else if (currentLanguage === 'mr') {
      return `हा प्रश्न अतिशय महत्त्वाचा आहे. एनसीसीटीच्या २० संस्थांमधून प्रशिक्षण पूर्ण करून तुम्ही राष्ट्रीय स्तरावर मान्यताप्राप्त प्रमाणपत्र मिळवू शकता आणि सहकार क्षेत्रातील नामांकित संस्थांमध्ये नोकरी मिळवू शकता.`;
    } else {
      return `NCCT’s federated network of 20 institutes offers certified capacity building under Ministry of Cooperation guidelines. Upon passing our modular LMS quizzes, your verified digital credentials instantly appear to cooperative employers across India.`;
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const responseText = generateBotResponse(query);
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);

      if (ttsEnabled) {
        speakText(responseText);
      }
    }, 500);
  };

  const quickChips = currentUser.role === 'institute_admin'
    ? [
        { label: 'Nominations SOP', query: 'How to review and approve candidate nominations?' },
        { label: 'Hostel Allocation', query: 'How does hostel bed allocation work?' },
        { label: 'PACS Syllabus', query: 'What modules are covered under PACS ERP?' },
        { label: 'Kiosk Attendance', query: 'How does biometric attendance kiosk sync?' },
      ]
    : [
        { label: 'PACS Jobs', query: 'What skills do I need for PACS Jobs?' },
        { label: 'Dairy Careers', query: 'Tell me about Dairy Cooperative Careers' },
        { label: 'Certificates', query: 'Explain NCCT certificate validity' },
        { label: 'SHG Governance', query: 'How does SHG credit linkage work?' },
        { label: 'Courses', query: 'What NCCT courses are available?' },
      ];

  const isCourseNew = activeView === 'course_new';

  return (
    <>
      {/* 1. Floating AI Chatbot Circular Button (Fixed bottom-right, 56px diameter, above bottom nav / sticky bar on mobile) */}
      {!isOpen && (
        <div
          className={`fixed ${
            isCourseNew
              ? 'bottom-[calc(136px+env(safe-area-inset-bottom,0px))]'
              : 'bottom-[calc(84px+env(safe-area-inset-bottom,0px))]'
          } right-3.5 sm:right-5 lg:bottom-6 lg:right-6 z-[850] select-none transition-all duration-300`}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_8px_24px_rgba(11,110,79,0.35)] hover:shadow-[0_12px_32px_rgba(11,110,79,0.45)] hover:scale-105 active:scale-95 cursor-pointer bg-[#0B6E4F] hover:bg-[#085A40] text-white min-w-[56px] min-h-[56px]"
            aria-label="Open AI Assistant"
            title="Ask Sahakar Sahayak (AI Advisor)"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
              {/* Status pulse dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E68A2E] border-2 border-[#0B6E4F] animate-pulse" />
            </div>
          </button>
        </div>
      )}

      {/* 2. Semi-transparent Backdrop Overlay (z-[880], leaves bottom navigation bar uncovered & clickable on mobile) */}
      {isOpen && (
        <div
          className="fixed inset-x-0 top-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] lg:inset-0 bg-black/40 backdrop-blur-[1px] z-[880] transition-opacity animate-fadeIn"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. Floating AI Chat Panel (z-[890], sits above bottom nav on mobile, desktop corner popup) */}
      {isOpen && (
        <div
          className="fixed z-[890] bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-2 right-2 sm:left-4 sm:right-4 h-[75vh] max-h-[calc(100vh-90px-env(safe-area-inset-bottom,0px))] rounded-2xl border border-[#D8E3DC] shadow-[0_10px_35px_rgba(0,0,0,0.2)] lg:bottom-6 lg:right-6 lg:left-auto lg:w-[420px] lg:h-[600px] lg:max-h-[calc(100vh-48px)] lg:rounded-[24px] lg:border lg:shadow-[0_20px_50px_rgba(7,61,50,0.28)] bg-white flex flex-col overflow-hidden animate-slideUp lg:animate-fadeIn select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Sahakar Sahayak AI Advisor"
        >
          {/* Compact Header (approx 64px) */}
          <div className="bg-[#0B6E4F] text-white px-4 py-3 flex items-center justify-between shadow-xs h-[64px] flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-amber-300 shadow-2xs flex-shrink-0">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="font-extrabold text-sm text-white font-devanagari truncate">
                    सहकार सहायक AI
                  </h3>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse flex-shrink-0" />
                  <p className="text-[10px] text-emerald-100 font-medium truncate">
                    NCCT Cooperative Domain Advisor
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  ttsEnabled ? 'bg-amber-400 text-[#005B46]' : 'text-emerald-100 hover:bg-white/10'
                }`}
                title={ttsEnabled ? 'Voice read-out is active' : 'Turn on voice read-out'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-emerald-100 hover:bg-white/10 transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area - scrollable independently */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-[#F8FAF8]">
            {messages.map(msg => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 max-w-[88%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-2xs text-xs ${
                      isBot ? 'bg-[#0B6E4F]' : 'bg-[#E68A2E]'
                    }`}
                  >
                    {isBot ? <Bot className="w-3.5 h-3.5 text-amber-300" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs whitespace-pre-line leading-relaxed shadow-2xs ${
                      isBot
                        ? 'bg-white text-gray-800 border border-gray-100 max-w-[85%]'
                        : 'bg-[#0B6E4F] text-white max-w-[80%]'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isBot ? 'text-gray-400' : 'text-emerald-200'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2 mr-auto max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-[#0B6E4F] flex items-center justify-center text-white flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="bg-white p-2.5 rounded-2xl border border-gray-100 text-xs text-gray-500 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B6E4F] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B6E4F] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B6E4F] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chip Row - Horizontal scrollable without scrollbar */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none flex-shrink-0">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-govTeal-50 hover:text-govTeal-800 text-[11px] font-semibold text-govText-secondary rounded-full border border-gray-200 transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer shadow-2xs active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Sticky Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 sm:p-3 bg-white border-t border-gray-200 flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                currentUser.role === 'institute_admin'
                  ? 'Ask about Nominations, Hostels, Timetable, Kiosk...'
                  : 'Ask about PACS, Dairy, SHGs, Jobs...'
              }
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#FBFDFB]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-[#0B6E4F] hover:bg-govTeal-800 disabled:opacity-40 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer flex-shrink-0 active:scale-95"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
