import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  User,
  RotateCcw,
  Briefcase,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const CareerChatView: React.FC = () => {
  const { currentUser, currentLanguage, navigate, t } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: currentLanguage === 'hi'
        ? `नमस्ते ${currentUser.name}! मैं आपका सहकार सहायक (AI Career & Training Advisor) हूँ। आप मुझसे पैक्स कंप्यूटरीकरण, दुग्ध सहकारी संघ, स्वयं सहायता समूह (SHG) या एनसीसीटी प्रमाणन से जुड़े रोजगार के बारे में कोई भी प्रश्न पूछ सकते हैं।`
        : currentLanguage === 'mr'
        ? `नमस्कार ${currentUser.name}! मी तुमचा सहकार सहायक (AI करिअर सल्लागार) आहे. तुम्ही मला पॅक्स संगणकीकरण, दुग्ध सहकारी संस्था किंवा एनसीसीटी प्रमाणपत्राच्या आधारे मिळणाऱ्या नोकऱ्यांबद्दल विचारू शकता.`
        : `Welcome ${currentUser.name}! I am your Sahakar Sahayak (AI Cooperative Career & Training Advisor). Ask me anything about PACS modernization roles, Dairy AMCS qualifications, SHG governance, or NCCT certificate career pathways.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'mr' ? 'mr-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const generateBotResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();

    if (query.includes('pacs') || query.includes('पैक्स') || query.includes('पॅक्स') || query.includes('manager')) {
      if (currentLanguage === 'hi') {
        return `पैक्स (PACS) प्रबंधक या ई-आरपी ऑपरेटर बनने के लिए मुख्य आवश्यकताएं:\n1. **एनसीसीटी राष्ट्रीय पैक्स ई-आरपी प्रमाणपत्र** (Module 1 & 2 उत्तीर्ण)।\n2. दैनिक रोकड़ बही (Cash Book) एवं केसीसी ऋण खाता संधारण का व्यावहारिक ज्ञान।\n3. सीएससी (CSC) ग्रामीण नागरिक सेवाएं प्रदान करने की दक्षता।\n\nइफको (IFFCO) एवं राज्य सहकारी बैंकों में वर्तमान में पैक्स बिजनेस एसोसिएट के कई पद उपलब्ध हैं।`;
      } else if (currentLanguage === 'mr') {
        return `पॅक्स (PACS) व्यवस्थापक किंवा ऑपरेटरसाठी मुख्य कौशल्ये:\n१. **एनसीसीटी पॅक्स ई-आरपी प्रमाणपत्र**.\n२. दैनंदिन रोख नोंद आणि पीक कर्ज (KCC) वाटप प्रणाली.\n३. सीएससी डिजिटल नागरिक सेवा हाताळणी.\n\nतुम्ही 'Job Opportunities' विभागात जाऊन थेट अर्ज करू शकता.`;
      } else {
        return `To become a certified PACS Manager or ERP Operator:\n1. Complete NCCT's "PACS Computerization & ERP Operations" course with ≥75% score.\n2. Master Day-Open/Day-Close cash book posting & KCC credit limits under DLTC.\n3. Understand CSC e-governance service delivery.\n\nEmployers like IFFCO and District Central Cooperative Banks (DCCBs) are hiring now on our recruiter bridge!`;
      }
    }

    if (query.includes('dairy') || query.includes('milk') || query.includes('amul') || query.includes('दूध') || query.includes('डेयरी')) {
      if (currentLanguage === 'hi') {
        return `दुग्ध सहकारी क्षेत्र (जैसे अमूल, मदर डेयरी, पराग) में रोजगार के मुख्य अवसर:\n- **एएमसीएस (AMCS) एवं गुणवत्ता परीक्षक:** स्वचालित मिल्क एनालाइजर पर फैट/एसएनएफ परीक्षण एवं किसान डीबीटी भुगतान।\n- **बीएमसी (BMC) कोल्ड चेन ऑपरेटर:** बल्क मिल्क कूलर का 4°C पर रख-रखाव।\n\nएनसीसीटी का 'Dairy Cold Chain & Quality Testing' कोर्स पूरा करने वाले उम्मीदवारों को प्राथमिकता दी जाती है।`;
      } else if (currentLanguage === 'mr') {
        return `दुग्ध व्यवसाय आणि अमूल/महानंद सारख्या सहकारी संघांमध्ये:\n- **AMCS गुणवत्ता निरीक्षक:** फॅट व एसएनएफ तपासणी आणि शेतकरी बिल वाटप.\n- **बीएमसी शीत साखळी तंत्रज्ञ:** दूध ४ अंश तापमानावर टिकवणे.\n\nआमचा 'Dairy Cold Chain' अभ्यासक्रम पूर्ण केल्यास थेट नोकरीची संधी उपलब्ध आहे.`;
      } else {
        return `Opportunities in Dairy Cooperatives (AMUL / State Dairy Federations):\n- **AMCS Quality Testing Officer:** Operating ultrasonic milk analyzers, measuring FAT/SNF, and handling direct farmer bank settlements.\n- **Bulk Milk Cooler (BMC) Technician:** Maintaining chilling temperatures at 4°C.\n\nCheck out the AMUL posting in the Job Opportunities tab!`;
      }
    }

    if (query.includes('certificate') || query.includes('प्रमाणपत्र') || query.includes('degree') || query.includes('verify')) {
      if (currentLanguage === 'hi') {
        return `VikasSetu पर मिलने वाले सभी डिजिटल प्रमाणपत्र राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) द्वारा अधिकृत एवं सत्यापित होते हैं। प्रत्येक प्रमाणपत्र पर एक अद्वितीय क्यूआर कोड होता है जिसे कोई भी बैंक या नियोक्ता तुरंत सत्यापित कर सकता है।`;
      } else if (currentLanguage === 'mr') {
        return `VikasSetu वरील सर्व डिजिटल प्रमाणपत्रे NCCT द्वारे प्रमाणित आहेत. या प्रमाणपत्रांवर डिजिटल क्यूआर कोड असतो, ज्यामुळे कोणत्याही सहकारी बँकेत किंवा संस्थेत लगेच पडताळणी करता येते.`;
      } else {
        return `All digital credentials issued on VikasSetu are accredited by the National Council for Cooperative Training (NCCT), Ministry of Cooperation. Each certificate contains a tamper-proof QR code that allows banks and cooperatives to verify authenticity in real time.`;
      }
    }

    // Default Fallback
    if (currentLanguage === 'hi') {
      return `आपका प्रश्न सहकारी विकास की दृष्टि से बहुत महत्वपूर्ण है। एनसीसीटी के 20 संस्थान (वाम्निकॉम, 5 आरआईसीएम एवं 14 आईसीएम) ग्रामीण युवाओं एवं पैक्स कर्मियों को व्यावहारिक प्रशिक्षण प्रदान करते हैं। आप इस पोर्टल पर कोई भी कोर्स पूरा करके सीधे सरकारी एवं सहकारी नियोक्ताओं से जुड़ सकते हैं।`;
    } else if (currentLanguage === 'mr') {
      return `हा प्रश्न अतिशय महत्त्वाचा आहे. एनसीसीटीच्या २० संस्थांमधून प्रशिक्षण पूर्ण करून तुम्ही राष्ट्रीय स्तरावर मान्यताप्राप्त प्रमाणपत्र मिळवू शकता आणि सहकार क्षेत्रातील नामांकित संस्थांमध्ये नोकरी मिळवू शकता.`;
    } else {
      return `NCCT’s federated network of 20 institutes (VAMNICOM + 5 RICMs + 14 ICMs) offers certified capacity building designed under Ministry of Cooperation guidelines. Upon passing our modular LMS quizzes, your verified digital credentials instantly appear to cooperative employers across India.`;
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = generateBotResponse(query);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (ttsEnabled) {
        speakText(responseText);
      }
    }, 700);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: currentLanguage === 'hi'
          ? `नमस्ते ${currentUser.name}! बातचीत रीसेट कर दी गई है। आप कोई भी नया प्रश्न पूछ सकते हैं।`
          : currentLanguage === 'mr'
          ? `संभाषण रीसेट केले गेले आहे. तुम्ही नवीन प्रश्न विचारू शकता.`
          : `Conversation reset. Feel free to ask another career or training question!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    {
      label: currentLanguage === 'hi' ? 'पैक्स ERP मैनेजर कैसे बनें?' : currentLanguage === 'mr' ? 'पॅक्स मॅनेजर कसे व्हावे?' : 'How to become a PACS ERP Manager?',
      query: 'How to become a PACS Manager?',
    },
    {
      label: currentLanguage === 'hi' ? 'अमूल में एएमसीएस जॉब्स' : currentLanguage === 'mr' ? 'अमूलमधील नोकऱ्या' : 'AMUL Dairy AMCS qualifications',
      query: 'AMUL dairy qualifications',
    },
    {
      label: currentLanguage === 'hi' ? 'प्रमाणपत्र कैसे सत्यापित करें?' : currentLanguage === 'mr' ? 'प्रमाणपत्र पडताळणी' : 'How does QR Certificate verification work?',
      query: 'How to verify certificates',
    },
  ];

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              AI Advisory Engine
            </span>
            <SimulatedBadge text="NCCT Career Knowledgebase Active" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1">
            {t.chatbot?.title || 'Sahakar Sahayak (AI Career Advisor)'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1">
            {t.chatbot?.subtitle || 'Get instant cooperative career guidance, eligibility criteria, and training suggestions.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* TTS Audio Toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px] ${
              ttsEnabled
                ? 'bg-govTeal-50 border-govTeal-300 text-govTeal-800'
                : 'bg-govBg border-gray-200 text-govText-secondary hover:bg-gray-100'
            }`}
            title="Toggle Text-to-Speech audio readout"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-govTeal-600" /> : <VolumeX className="w-4 h-4" />}
            <span>Read Aloud</span>
          </button>

          {/* Reset Chat */}
          <button
            onClick={handleClearHistory}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-govBg hover:bg-gray-100 text-govText-secondary text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Main Chat Workspace */}
      <div className="bg-white rounded-2xl border border-govText-border shadow-sm flex flex-col h-[500px] sm:h-[580px] overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/40">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-xs ${
                    isBot ? 'bg-govTeal-700' : 'bg-saffron-500'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4 text-saffron-300" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-1 ${isBot ? 'items-start' : 'items-end text-right'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                      isBot
                        ? 'bg-white border border-gray-200 text-govText-primary'
                        : 'bg-govTeal-600 text-white font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-govText-muted px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 max-w-xl mr-auto items-center">
              <div className="w-8 h-8 rounded-xl bg-govTeal-700 flex items-center justify-center text-white flex-shrink-0">
                <Bot className="w-4 h-4 text-saffron-300" />
              </div>
              <div className="p-3.5 bg-white border border-gray-200 rounded-2xl flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 bg-govTeal-600 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-govTeal-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-govTeal-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
          <Sparkles className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0" />
          <div className="flex gap-1.5 flex-nowrap">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt.query)}
                className="px-3 py-1 bg-govBg hover:bg-govTeal-50 hover:text-govTeal-800 text-[11px] font-semibold text-govText-secondary rounded-lg border border-gray-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.chatbot?.placeholder || 'Type your career question in English, Hindi, or Marathi...'}
              className="flex-1 px-3.5 sm:px-4 py-3 rounded-xl border border-govText-border bg-govBg text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 focus:bg-white transition-all min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 sm:px-5 py-3 bg-govTeal-600 hover:bg-govTeal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </PageContainer>
  );
};
