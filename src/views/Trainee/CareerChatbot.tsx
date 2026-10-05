import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  User,
  HelpCircle,
  Briefcase,
  BookOpen,
  Award,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const CareerChatbot: React.FC = () => {
  const { currentUser, currentLanguage, t } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: currentLanguage === 'hi'
        ? `नमस्ते ${currentUser.name}! मैं आपका सहकार सहायक (AI Career & Training Advisor) हूँ। आप मुझसे पैक्स कंप्यूटरीकरण, दुग्ध सहकारी संघ, स्वयं सहायता समूह (SHG) या एनसीसीटी प्रमाणन से जुड़े रोजगार के बारे में कोई भी प्रश्न पूछ सकते हैं।`
        : currentLanguage === 'mr'
        ? `नमस्कार ${currentUser.name}! मी तुमचा सहकार सहायक (AI करिअर सल्लागार) आहे. तुम्ही मला पॅक्स संगणकीकरण, दुग्ध सहकारी संस्था किंवा एनसीसीटी प्रमाणपत्राच्या आधारे मिळणाऱ्या नोकऱ्यांबद्दल विचारू शकता.`
        : `Namaste ${currentUser.name}! I am your Sahakar Sahayak (AI Cooperative Career & Scheme Advisor). Ask me anything about PACS modernization roles, Dairy AMCS qualifications, SHG governance, or NCCT certificate career pathways.`,
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
        return `पैक्स (PACS) प्रबंधक या ई-आरपी ऑपरेटर बनने के लिए निम्नलिखित मुख्य योग्यताएं आवश्यक हैं:\n1. **एनसीसीटी राष्ट्रीय पैक्स ई-आरपी प्रमाणपत्र** (Module 1 & 2 उत्तीर्ण)।\n2. दैनिक रोकड़ बही (Cash Book) एवं केसीसी ऋण खाता संधारण का व्यावहारिक ज्ञान।\n3. सीएससी (CSC) ग्रामीण नागरिक सेवाएं प्रदान करने की दक्षता।\n\nइफको (IFFCO) एवं राज्य सहकारी बैंकों में वर्तमान में पैक्स बिजनेस एसोसिएट के कई पद उपलब्ध हैं।`;
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

    if (query.includes('shg') || query.includes('महिला') || query.includes('बचत') || query.includes('credit')) {
      if (currentLanguage === 'hi') {
        return `स्वयं सहायता समूह (SHG) महासंघों में करियर:\n- **समुदाय संसाधन व्यक्ति (CRP) एवं आजीविका सखी**\n- **पंचसूत्र एवं डिजिटल बुक-कीपिंग विशेषज्ञ**\n- बैंकों से ₹20 लाख तक के ऋण लिंकेज हेतु सूक्ष्म निवेश योजना (MIP) तैयार करना।`;
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
      return `NCCT’s federated network of 20 institutes (VAMNICOM + 5 RICMs + 14 ICMs) offers certified capacity building designed under Ministry of Cooperation guidelines. Upon passing our modular LMS quizzes, your verified digital credentials instantly appear to cooperative employers across India.`;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputText;
    setInputText('');
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
    }, 700);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  return (
    <PageContainer maxWidth="narrow">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-govTeal-600 to-govTeal-800 flex items-center justify-center text-white shadow-md">
            <Bot className="w-6 h-6 text-saffron-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-govText-primary">
                {t.chatbot.title}
              </h2>
              <SimulatedBadge text="Cooperative Domain AI" />
            </div>
            <p className="text-xs text-govText-secondary">
              {t.chatbot.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              ttsEnabled
                ? 'bg-saffron-50 text-saffron-900 border-saffron-300'
                : 'bg-govBg text-govText-secondary border-gray-200 hover:bg-gray-100'
            }`}
            title="Read out responses aloud (Text-to-Speech)"
          >
            {ttsEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-saffron-600" />
                <span>Voice Active</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Voice Off</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-govText-border shadow-sm overflow-hidden flex flex-col h-[520px]">
        
        {/* Messages List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-govBg/50">
          {messages.map(msg => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                  isBot ? 'bg-govTeal-700' : 'bg-saffron-500'
                }`}>
                  {isBot ? <Bot className="w-4 h-4 text-saffron-300" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`p-4 rounded-2xl shadow-sm text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                  isBot
                    ? 'bg-white text-govText-primary border border-govTeal-100'
                    : 'bg-govTeal-600 text-white'
                }`}>
                  <p>{msg.text}</p>
                  <span className={`block text-[10px] mt-1.5 ${isBot ? 'text-govText-muted' : 'text-govTeal-200 text-right'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-govTeal-700 flex items-center justify-center text-white">
                <Bot className="w-4 h-4 text-saffron-300" />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-govTeal-100 text-xs text-govText-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-govTeal-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-govTeal-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-govTeal-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="p-3 bg-govBg border-t border-gray-100 flex gap-2 overflow-x-auto text-xs">
          {t.chatbot.suggestions.map((s, sIdx) => (
            <button
              key={sIdx}
              onClick={() => handleSuggestionClick(s)}
              className="px-3 py-1.5 bg-white hover:bg-govTeal-50 text-govText-secondary hover:text-govTeal-800 rounded-full border border-gray-200 flex-shrink-0 text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-saffron-500" />
              <span>{s}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.chatbot.placeholder}
            className="flex-1 px-4 py-2.5 rounded-xl border border-govText-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-govTeal-600 bg-govBg"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-5 py-2.5 bg-govTeal-600 hover:bg-govTeal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t.chatbot.send}</span>
          </button>
        </form>

      </div>

    </PageContainer>
  );
};
