import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Save,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileText,
  Video,
  Paperclip,
  Image as ImageIcon,
  Link2,
  Zap,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Upload,
  Play,
  X,
  Check,
  ChevronDown,
  Globe
} from 'lucide-react';
import {
  Lesson,
  ContentBlock,
  ContentBlockType,
  LessonAttachment
} from '../../types';
import { GlobalModal } from '../../components/common/GlobalModal';

export interface LessonEditorProps {
  initialLesson: Lesson;
  moduleTitle: string;
  moduleNumber: number;
  courseTitle: string;
  onSave: (updatedLesson: Lesson, publish?: boolean) => void;
  onBackToCourse: () => void;
  onBackToModule: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  initialLesson,
  moduleTitle,
  moduleNumber,
  courseTitle,
  onSave,
  onBackToCourse,
  onBackToModule,
}) => {
  // Multilingual active language view: 'en' | 'hi' | 'mr'
  const [activeLang, setActiveLang] = useState<'en' | 'hi' | 'mr'>('en');

  // Lesson Status
  const [status, setStatus] = useState<'Draft' | 'Ready' | 'Published'>(
    (initialLesson.status as any) || 'Draft'
  );

  // Lesson Basic Info State (Strictly partitioned per language)
  const [titleEn, setTitleEn] = useState(
    initialLesson.title?.replace(/\s*\([\u0900-\u097F\s\d\.\-—:]+\)\s*$/, '').trim() || ''
  );
  const [titleHi, setTitleHi] = useState(initialLesson.titleHi || '');
  const [titleMr, setTitleMr] = useState(initialLesson.titleMr || '');

  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialLesson.durationMinutes || 25
  );
  const [contentType, setContentType] = useState<string>(
    initialLesson.contentType || 'Interactive Reading / Theory'
  );

  const [overviewEn, setOverviewEn] = useState(
    initialLesson.contentByLanguage?.en?.overview ||
      initialLesson.contentByLanguage?.en?.text ||
      ''
  );
  const [overviewHi, setOverviewHi] = useState(
    initialLesson.contentByLanguage?.hi?.overview ||
      initialLesson.contentByLanguage?.hi?.text ||
      ''
  );
  const [overviewMr, setOverviewMr] = useState(
    initialLesson.contentByLanguage?.mr?.overview ||
      initialLesson.contentByLanguage?.mr?.text ||
      ''
  );

  // Content Blocks State
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    if (initialLesson.blocks && initialLesson.blocks.length > 0) {
      return JSON.parse(JSON.stringify(initialLesson.blocks));
    }
    // Default initial blocks if none exist
    return [
      {
        id: `blk-1-${Date.now()}`,
        type: 'text',
        text: {
          en: {
            heading: 'Foundations & Standard Operating Mandate',
            body:
              'The Ministry of Cooperation national directive outlines standardized digitalization workflows across all 63,000 functional Primary Agricultural Credit Societies.\n\n### Key Principles\n- Member equity ledger transparency\n- Direct digital reconciliation with District Central Cooperative Banks (DCCB)\n- Automated daily Day-Open verification before voucher posting.',
          },
          hi: {
            heading: 'बुनियादी नियम एवं मानक संचालन व्यवस्था',
            body:
              'सहकारिता मंत्रालय के राष्ट्रीय विजन के अनुसार सभी 63,000 प्राथमिक कृषि ऋण समितियों (पैक्स) को एकीकृत क्लाउड ई-आरपी पर संचालित किया जा रहा है।\n\n### मुख्य प्रक्रियाएं\n- सदस्य शेयर पंजी में पूर्ण पारदर्शिता\n- जिला केंद्रीय सहकारी बैंक से रीयल-टाइम समाधान\n- वाउचर प्रविष्टि से पूर्व दैनिक डे-ओपन सत्यापन।',
          },
          mr: {
            heading: 'मूलभूत तत्त्वे आणि प्रमाणित कार्यप्रणाली',
            body:
              'सहकार मंत्रालयाच्या धोरणानुसार देशभरातील ६३,००० प्राथमिक कृषी पतसंस्था एकात्मिक संगणकीय प्रणालीवर आणल्या जात आहेत.\n\n### प्रमुख कार्यपद्धती\n- सभासद शेअर नोंदवही पारदर्शकता\n- जिल्हा मध्यवर्ती सहकारी बँकेशी डिजिटल ताळेबंद जुळवणी\n- व्यवहारांपूर्वी दिवस प्रारंभ (Day-Open) नोंदणी.',
          },
        },
      },
      {
        id: `blk-2-${Date.now()}`,
        type: 'attachment',
        attachment: {
          fileName: 'PACS_ERP_Workflow_Guide.pdf',
          fileType: 'pdf',
          fileSize: '2.4 MB',
          fileUrl: 'https://cooperation.gov.in/pacs-guide.pdf',
        },
      },
      {
        id: `blk-3-${Date.now()}`,
        type: 'link',
        link: {
          en: {
            title: 'Ministry of Cooperation PACS Digital Portal',
            url: 'https://cooperation.gov.in',
            description: 'Official national directives, model bye-laws, and regulatory circulars.',
            openInNewTab: true,
          },
          hi: {
            title: 'सहकारिता मंत्रालय पैक्स डिजिटल पोर्टल',
            url: 'https://cooperation.gov.in',
            description: 'आधिकारिक राष्ट्रीय परिपत्र, मॉडल उप-नियम एवं विनियामक दिशानिर्देश।',
            openInNewTab: true,
          },
          mr: {
            title: 'सहकार मंत्रालय पॅक्स डिजिटल पोर्टल',
            url: 'https://cooperation.gov.in',
            description: 'अधिकृत परिपत्रके, आदर्श पोटनियम व राष्ट्रीय मार्गदर्शक सूचना.',
            openInNewTab: true,
          },
        },
      },
    ];
  });

  // Editing Block Index (which block is expanded for editing)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(blocks[0]?.id || null);

  // Dropdown menu state for "+ Add Content"
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLang, setPreviewLang] = useState<'en' | 'hi' | 'mr'>('en');

  // Validation messages state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show transient notification toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper: check completion per language
  const checkLanguageStatus = (lang: 'en' | 'hi' | 'mr') => {
    const t = lang === 'en' ? titleEn : lang === 'hi' ? titleHi : titleMr;
    const o = lang === 'en' ? overviewEn : lang === 'hi' ? overviewHi : overviewMr;
    const hasTitle = Boolean(t.trim());
    const hasOverview = Boolean(o.trim());

    // Check if at least one text block has content in this language
    const hasBlockContent = blocks.some(b => {
      if (b.type === 'text' && b.text?.[lang]?.body?.trim()) return true;
      if (b.type === 'video' && b.video?.[lang]?.title?.trim()) return true;
      if (b.type === 'link' && b.link?.[lang]?.title?.trim()) return true;
      if (b.type === 'activity' && b.activity?.[lang]?.title?.trim()) return true;
      if (b.type === 'attachment') return true;
      if (b.type === 'image') return true;
      return false;
    });

    if (hasTitle && (hasOverview || hasBlockContent)) return 'complete';
    if (hasTitle || hasOverview || hasBlockContent) return 'partial';
    return 'empty';
  };

  // Content Block Management
  const handleAddBlock = (type: ContentBlockType) => {
    const newId = `blk-${Date.now()}`;
    let newBlock: ContentBlock = {
      id: newId,
      type,
    };

    if (type === 'text') {
      newBlock.text = {
        en: { heading: 'Topic Heading', body: 'Enter detailed learning content and guidelines...' },
        hi: { heading: 'विषय शीर्षक', body: 'यहाँ विस्तृत पाठ सामग्री एवं दिशानिर्देश दर्ज करें...' },
        mr: { heading: 'घटक शीर्षक', body: 'येथे सविस्तर अभ्यासक्रम माहिती नोंदवा...' },
      };
    } else if (type === 'video') {
      newBlock.video = {
        en: {
          title: 'Video Lecture Demonstration',
          videoUrl: 'https://www.youtube.com/watch?v=sample-lecture',
          description: 'Step-by-step walkthrough of ERP workflow and ledger verification.',
          duration: '15 mins',
        },
        hi: {
          title: 'वीडियो व्याख्यान एवं सजीव अभ्यास',
          videoUrl: 'https://www.youtube.com/watch?v=sample-lecture',
          description: 'ई-आरपी कार्यप्रणाली एवं लेजर सत्यापन का चरणबद्ध विवरण।',
          duration: '15 मिनट',
        },
        mr: {
          title: 'व्हिडिओ प्रात्यक्षिक व्याख्यान',
          videoUrl: 'https://www.youtube.com/watch?v=sample-lecture',
          description: 'ई-आरपी प्रत्यक्ष कार्यपद्धती आणि ताळेबंद तपासणी.',
          duration: '१५ मिनिटे',
        },
      };
    } else if (type === 'attachment') {
      newBlock.attachment = {
        fileName: 'National_PACS_Circular_2026.pdf',
        fileType: 'pdf',
        fileSize: '3.1 MB',
        fileUrl: 'https://cooperation.gov.in/circulars/pacs.pdf',
      };
    } else if (type === 'image') {
      newBlock.image = {
        en: {
          imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
          caption: 'National PACS ERP Accounting Module - Daily Cash Register Interface',
          altText: 'PACS ERP interface showing ledger debit and credit vouchers',
        },
        hi: {
          imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
          caption: 'राष्ट्रीय पैक्स ई-आरपी लेखांकन मॉड्यूल - दैनिक रोकड़ बही इंटरफेस',
          altText: 'पैक्स ई-आरपी वाउचर प्रविष्टि इंटरफेस',
        },
        mr: {
          imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
          caption: 'राष्ट्रीय पॅक्स ई-आरपी जमा-खर्च नोंदवही इंटरफेस',
          altText: 'पॅक्स संगणकीय प्रणाली व्यवहार नोंद',
        },
      };
    } else if (type === 'link') {
      newBlock.link = {
        en: {
          title: 'National Council for Cooperative Training (NCCT) Guidelines',
          url: 'https://ncct.ac.in',
          description: 'Official repository of apex cooperative syllabus and evaluation rubrics.',
          openInNewTab: true,
        },
        hi: {
          title: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) दिशानिर्देश',
          url: 'https://ncct.ac.in',
          description: 'सहकारी पाठ्यक्रम एवं मूल्यांकन मानदंडों का आधिकारिक पोर्टल।',
          openInNewTab: true,
        },
        mr: {
          title: 'राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) नियमावली',
          url: 'https://ncct.ac.in',
          description: 'अधिकृत अभ्यासक्रम आणि मूल्यमापन मानके.',
          openInNewTab: true,
        },
      };
    } else if (type === 'activity') {
      newBlock.activity = {
        en: {
          title: 'Practical Exercise: Double-Entry Ledger Posting',
          instructions:
            'Access the simulated sandbox environment, open the Day-Open counter, and post 5 member deposit vouchers.',
          expectedOutcome: 'Zero discrepancy between physical cash balance and system trial balance.',
          resourceName: 'Member_Deposit_Voucher_Template.xlsx',
        },
        hi: {
          title: 'व्यावहारिक अभ्यास: दोहरी प्रविष्टि लेजर पोस्टिंग',
          instructions:
            'सैंडबॉक्स वातावरण में लॉगिन करें, डे-ओपन काउंटर खोलें और 5 सदस्य जमा वाउचर प्रविष्ट करें।',
          expectedOutcome: 'दैनिक रोकड़ और सिस्टम ट्रायल बैलेंस में शून्य विसंगति।',
          resourceName: 'Member_Deposit_Voucher_Template.xlsx',
        },
        mr: {
          title: 'प्रात्यक्षिक सराव: द्विनोंद पद्धत ताळेबंद जुळवणी',
          instructions:
            'सराव सिस्टीममध्ये लॉगिन करा, दिवस प्रारंभ करा आणि ५ सभासद ठेव पावत्या नोंदवा.',
          expectedOutcome: 'रोक शिल्लक आणि सिस्टीम नोंदींमध्ये १००% अचूकता.',
          resourceName: 'Member_Deposit_Voucher_Template.xlsx',
        },
      };
    }

    setBlocks(prev => [...prev, newBlock]);
    setEditingBlockId(newId);
    setIsAddMenuOpen(false);
    showToast(`Added ${type.toUpperCase()} block`);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;
    setBlocks(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      alert('A lesson must have at least one content block.');
      return;
    }
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (editingBlockId === id) {
      setEditingBlockId(null);
    }
    showToast('Block removed');
  };

  // Helper for text formatting insertion
  const handleInsertFormat = (blockId: string, prefix: string, suffix: string = '') => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== blockId || !b.text) return b;
        const currentBody = b.text[activeLang]?.body || '';
        const updated = currentBody
          ? `${currentBody}\n${prefix}sample content${suffix}`
          : `${prefix}sample content${suffix}`;
        return {
          ...b,
          text: {
            ...b.text,
            [activeLang]: {
              ...b.text[activeLang],
              body: updated,
            },
          },
        };
      })
    );
  };

  // Validation function before saving / publishing
  const validateLesson = (forPublish: boolean): boolean => {
    const errs: string[] = [];

    const activeTitle = activeLang === 'en' ? titleEn : activeLang === 'hi' ? titleHi : titleMr;
    if (!titleEn.trim() && !activeTitle.trim()) {
      errs.push('English Lesson Title is required.');
    }

    if (!durationMinutes || durationMinutes < 5) {
      errs.push('Lesson duration must be at least 5 minutes.');
    }

    if (blocks.length === 0) {
      errs.push('At least one content block is required.');
    }

    // Validate URLs in link and video blocks
    blocks.forEach((b, idx) => {
      if (b.type === 'link') {
        const url = b.link?.[activeLang]?.url;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          errs.push(`Block ${idx + 1} (Link): URL must start with http:// or https://`);
        }
      }
      if (b.type === 'video') {
        const vUrl = b.video?.[activeLang]?.videoUrl;
        if (vUrl && !vUrl.startsWith('http://') && !vUrl.startsWith('https://')) {
          errs.push(`Block ${idx + 1} (Video): Valid video URL is required`);
        }
      }
    });

    if (forPublish) {
      const enStatus = checkLanguageStatus('en');
      if (enStatus !== 'complete') {
        errs.push('English content is incomplete. Please ensure title and content are completed before publishing.');
      }
    }

    setValidationErrors(errs);
    return errs.length === 0;
  };

  // Build the complete Lesson object
  const buildLessonObject = (finalStatus: 'Draft' | 'Ready' | 'Published'): Lesson => {
    // Extract attachments from attachment blocks
    const dynamicAttachments: LessonAttachment[] = blocks
      .filter(b => b.type === 'attachment' && b.attachment)
      .map((b, i) => ({
        id: `att-${b.id}-${i}`,
        name: b.attachment!.fileName,
        type: (b.attachment!.fileType as any) || 'pdf',
        size: b.attachment!.fileSize,
        url: b.attachment!.fileUrl,
      }));

    // Extract video URL if video blocks exist
    const videoBlock = blocks.find(b => b.type === 'video');
    const extractedVideoUrl = videoBlock?.video?.[activeLang]?.videoUrl || videoBlock?.video?.en?.videoUrl || initialLesson.videoUrl || '';

    return {
      id: initialLesson.id || `les-${Date.now()}`,
      moduleId: initialLesson.moduleId,
      order: initialLesson.order || 1,
      title: titleEn.trim() || 'Untitled Lesson',
      titleHi: titleHi.trim(),
      titleMr: titleMr.trim(),
      durationMinutes,
      contentType: contentType as any,
      status: finalStatus,
      videoUrl: extractedVideoUrl || undefined,
      blocks: JSON.parse(JSON.stringify(blocks)),
      attachments: dynamicAttachments,
      contentByLanguage: {
        en: {
          text: overviewEn.trim() || titleEn,
          overview: overviewEn.trim(),
          videoUrl: extractedVideoUrl || '',
          keyTakeaways: [
            'Standardized operational compliance under Ministry of Cooperation',
            'Verifiable audit trail and digital reconciliation',
          ],
        },
        hi: {
          text: overviewHi.trim() || titleHi,
          overview: overviewHi.trim(),
          keyTakeaways: [
            'सहकारिता मंत्रालय के विनियामक मानकों का अनुपालन',
            'पारदर्शी डिजिटल समाधान एवं लेखापरीक्षा',
          ],
        },
        mr: {
          text: overviewMr.trim() || titleMr,
          overview: overviewMr.trim(),
          keyTakeaways: [
            'सहकार मंत्रालयाच्या मार्गदर्शक सूचनांचे पालन',
            'पारदर्शक डिजिटल ताळेबंद व ऑडिट व्यवस्था',
          ],
        },
      },
    };
  };

  const handleSaveDraft = () => {
    if (!validateLesson(false)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const updated = buildLessonObject('Draft');
    setStatus('Draft');
    onSave(updated, false);
    showToast('Lesson saved as Draft.');
  };

  const handleSavePublish = () => {
    if (!validateLesson(true)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const updated = buildLessonObject('Published');
    setStatus('Published');
    onSave(updated, true);
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B6E4F] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP STICKY HEADER & BREADCRUMBS */}
      <div className="bg-white rounded-2xl border border-govText-border shadow-xs p-4 sm:p-5 space-y-3">
        {/* Navigation & Breadcrumb Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onBackToCourse}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-govText-primary font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Course</span>
            </button>
            <span className="text-gray-300">•</span>
            <button
              type="button"
              onClick={onBackToModule}
              className="inline-flex items-center gap-1 text-govTeal-700 hover:underline font-semibold cursor-pointer"
            >
              <span>Back to Module {String(moduleNumber).padStart(2, '0')}</span>
            </button>
          </div>

          {/* Status Badge Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govText-secondary">Lesson Status:</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                status === 'Published'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : status === 'Ready'
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <option value="Draft">Draft</option>
              <option value="Ready">Ready</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        {/* Title & Action Buttons Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#0B6E4F] text-white uppercase tracking-wider">
                Module {String(moduleNumber).padStart(2, '0')} • Lesson Editor
              </span>
              <span className="text-xs text-govText-muted truncate">
                {courseTitle} › {moduleTitle}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-govText-primary mt-1">
              Edit Lesson: {activeLang === 'en' ? titleEn || 'New Lesson' : activeLang === 'hi' ? titleHi || 'नया पाठ' : titleMr || 'नवीन धडा'}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                setPreviewLang(activeLang);
                setIsPreviewOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-gray-50 text-govText-primary rounded-xl text-xs font-bold border border-gray-200 shadow-2xs transition-colors cursor-pointer min-h-[42px]"
            >
              <Eye className="w-4 h-4 text-govTeal-700" />
              <span>Preview Lesson</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-govText-primary rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[42px]"
            >
              <Save className="w-4 h-4 text-gray-600" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handleSavePublish}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer min-h-[42px]"
            >
              <Check className="w-4 h-4" />
              <span>Save & Publish</span>
            </button>
          </div>
        </div>

        {/* Validation Errors Alert if any */}
        {validationErrors.length > 0 && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Please resolve the following before publishing:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-2">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. MULTILINGUAL LANGUAGE TABS (Strict Language Isolation) */}
      <div className="bg-[#F8FAF9] p-3 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-govText-secondary">
          <Globe className="w-4 h-4 text-[#0B6E4F]" />
          <span>Multilingual Language View:</span>
          <span className="text-[11px] font-normal text-govText-muted">
            (Editing strictly in selected language)
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
          {(['en', 'hi', 'mr'] as const).map(lang => {
            const lStatus = checkLanguageStatus(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeLang === lang
                    ? 'bg-[#0B6E4F] text-white shadow-2xs'
                    : 'text-govText-secondary hover:text-govText-primary hover:bg-gray-100'
                }`}
              >
                <span>{lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    lStatus === 'complete'
                      ? activeLang === lang
                        ? 'bg-emerald-200'
                        : 'bg-emerald-500'
                      : lStatus === 'partial'
                      ? 'bg-amber-400'
                      : 'bg-gray-300'
                  }`}
                  title={`Status: ${lStatus}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID: Content Authoring (Left) + Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Authoring Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: Lesson Basic Information */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-govText-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0B6E4F]" />
                <span>Lesson Basic Information</span>
              </h2>
              <span className="text-[11px] text-govText-muted">
                Language: {activeLang === 'en' ? 'English' : activeLang === 'hi' ? 'हिन्दी' : 'मराठी'}
              </span>
            </div>

            {/* Lesson Title (Strictly Isolated to activeLang) */}
            <div>
              <label className="block text-xs font-bold text-govText-primary mb-1">
                Lesson Title ({activeLang === 'en' ? 'English' : activeLang === 'hi' ? 'हिन्दी' : 'मराठी'}) *
              </label>
              <input
                type="text"
                value={activeLang === 'en' ? titleEn : activeLang === 'hi' ? titleHi : titleMr}
                onChange={e => {
                  const val = e.target.value;
                  if (activeLang === 'en') setTitleEn(val);
                  else if (activeLang === 'hi') setTitleHi(val);
                  else setTitleMr(val);
                }}
                placeholder={
                  activeLang === 'en'
                    ? 'e.g. 1.2 Daily Cash & Ledger Book Entry Workflow'
                    : activeLang === 'hi'
                    ? 'उदा. १.२ दैनिक रोकड़ बही एवं खाता प्रविष्टि कार्यप्रणाली'
                    : 'उदा. १.२ दैनिक रोख वही आणि खाते नोंद प्रक्रिया'
                }
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                  activeLang !== 'en' ? 'font-devanagari' : ''
                }`}
              />
            </div>

            {/* Duration & Content Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Duration (Minutes) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(parseInt(e.target.value) || 20)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                  />
                  <Clock className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Content Format *
                </label>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] cursor-pointer"
                >
                  <option value="Interactive Reading / Theory">Interactive Reading / Theory</option>
                  <option value="Video Lesson">Video Lesson</option>
                  <option value="Document / Reading">Document / Reading</option>
                  <option value="Practical / Activity">Practical / Activity</option>
                  <option value="Mixed Content">Mixed Content</option>
                </select>
              </div>
            </div>

            {/* Overview / Syllabus Text */}
            <div>
              <label className="block text-xs font-bold text-govText-primary mb-1">
                Lesson Overview ({activeLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={activeLang === 'en' ? overviewEn : activeLang === 'hi' ? overviewHi : overviewMr}
                onChange={e => {
                  const val = e.target.value;
                  if (activeLang === 'en') setOverviewEn(val);
                  else if (activeLang === 'hi') setOverviewHi(val);
                  else setOverviewMr(val);
                }}
                placeholder={
                  activeLang === 'en'
                    ? 'Enter concise learning objectives and operational context for this lesson...'
                    : activeLang === 'hi'
                    ? 'इस पाठ के मुख्य अधिगम परिणाम एवं कार्यप्रणाली का संक्षिप्त विवरण दर्ज करें...'
                    : 'या धड्यातील महत्त्वाचे मुद्दे आणि उद्दिष्टांचा थोडक्यात आढावा नोंदवा...'
                }
                className={`w-full p-3 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                  activeLang !== 'en' ? 'font-devanagari' : ''
                }`}
              />
            </div>
          </div>

          {/* Section B: Content Authoring Area (Block-based) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-govText-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0B6E4F]" />
                  <span>Content Blocks ({blocks.length})</span>
                </h2>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Build structured multimedia learning content with reorderable content cards.
                </p>
              </div>

              {/* Add Content Button with Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 transition-all cursor-pointer min-h-[42px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Content</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isAddMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-40 animate-fadeIn text-xs">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('text')}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-govText-primary flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#0B6E4F]" />
                      <span>Text Block</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('video')}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-govText-primary flex items-center gap-2.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-blue-600" />
                      <span>Video Block</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('attachment')}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-govText-primary flex items-center gap-2.5 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4 text-amber-600" />
                      <span>Document / Attachment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('image')}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-govText-primary flex items-center gap-2.5 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <span>Image Block</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('link')}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-govText-primary flex items-center gap-2.5 cursor-pointer"
                    >
                      <Link2 className="w-4 h-4 text-emerald-600" />
                      <span>External Link Block</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('activity')}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-govText-primary flex items-center gap-2.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span>Practical Activity Block</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* List of Content Blocks */}
            <div className="space-y-4">
              {blocks.map((block, bIdx) => {
                const isEditing = editingBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    className={`rounded-2xl border transition-all ${
                      isEditing
                        ? 'border-[#0B6E4F] bg-white shadow-md ring-1 ring-[#0B6E4F]/20'
                        : 'border-gray-200 bg-[#FBFDFB] hover:border-gray-300 shadow-2xs'
                    }`}
                  >
                    {/* Block Header Card Bar */}
                    <div className="p-3.5 sm:px-4 sm:py-3 bg-gray-50/80 rounded-t-2xl border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Type Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            block.type === 'text'
                              ? 'bg-emerald-100 text-emerald-800'
                              : block.type === 'video'
                              ? 'bg-blue-100 text-blue-800'
                              : block.type === 'attachment'
                              ? 'bg-amber-100 text-amber-800'
                              : block.type === 'image'
                              ? 'bg-purple-100 text-purple-800'
                              : block.type === 'link'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {block.type === 'text' && <FileText className="w-3 h-3" />}
                          {block.type === 'video' && <Video className="w-3 h-3" />}
                          {block.type === 'attachment' && <Paperclip className="w-3 h-3" />}
                          {block.type === 'image' && <ImageIcon className="w-3 h-3" />}
                          {block.type === 'link' && <Link2 className="w-3 h-3" />}
                          {block.type === 'activity' && <Zap className="w-3 h-3" />}
                          <span>Block {bIdx + 1}: {block.type.toUpperCase()}</span>
                        </span>

                        <span className="text-xs font-semibold text-govText-primary truncate">
                          {block.type === 'text' && (block.text?.[activeLang]?.heading || 'Text Content')}
                          {block.type === 'video' && (block.video?.[activeLang]?.title || 'Video Content')}
                          {block.type === 'attachment' && (block.attachment?.fileName || 'Attached Document')}
                          {block.type === 'image' && (block.image?.[activeLang]?.caption || 'Image Asset')}
                          {block.type === 'link' && (block.link?.[activeLang]?.title || 'Resource Link')}
                          {block.type === 'activity' && (block.activity?.[activeLang]?.title || 'Practical Activity')}
                        </span>
                      </div>

                      {/* Re-order & Edit/Delete Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={bIdx === 0}
                          onClick={() => handleMoveBlock(bIdx, 'up')}
                          title="Move Block Up"
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-20 cursor-pointer text-gray-600"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={bIdx === blocks.length - 1}
                          onClick={() => handleMoveBlock(bIdx, 'down')}
                          title="Move Block Down"
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-20 cursor-pointer text-gray-600"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                            isEditing
                              ? 'bg-[#0B6E4F] text-white'
                              : 'bg-white border border-gray-200 text-govText-primary hover:bg-gray-100'
                          }`}
                        >
                          {isEditing ? 'Done' : 'Edit'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          title="Delete Block"
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Block Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* 1. TEXT BLOCK */}
                      {block.type === 'text' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                              Section Heading ({activeLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={block.text?.[activeLang]?.heading || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setBlocks(prev =>
                                  prev.map(b =>
                                    b.id === block.id
                                      ? {
                                          ...b,
                                          text: {
                                            ...b.text,
                                            [activeLang]: {
                                              ...b.text?.[activeLang],
                                              heading: val,
                                            },
                                          },
                                        }
                                      : b
                                  )
                                );
                              }}
                              className={`w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                                activeLang !== 'en' ? 'font-devanagari' : ''
                              }`}
                            />
                          </div>

                          {/* Formatting Toolbar */}
                          {isEditing && (
                            <div className="flex flex-wrap items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => handleInsertFormat(block.id, '**', '**')}
                                className="px-2 py-1 text-[11px] font-bold hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                              >
                                Bold
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertFormat(block.id, '*', '*')}
                                className="px-2 py-1 text-[11px] italic hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                              >
                                Italic
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertFormat(block.id, '### ')}
                                className="px-2 py-1 text-[11px] font-bold hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                              >
                                H3 Heading
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertFormat(block.id, '- ')}
                                className="px-2 py-1 text-[11px] hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                              >
                                • Bullet List
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertFormat(block.id, '1. ')}
                                className="px-2 py-1 text-[11px] hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                              >
                                1. Numbered
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertFormat(block.id, '> ')}
                                className="px-2 py-1 text-[11px] hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                              >
                                "Quote"
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleInsertFormat(
                                    block.id,
                                    '| Header 1 | Header 2 |\n|---|---|\n| Value 1 | Value 2 |'
                                  )
                                }
                                className="px-2 py-1 text-[11px] hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                              >
                                Table
                              </button>
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                              Rich Text Body ({activeLang.toUpperCase()})
                            </label>
                            <textarea
                              rows={isEditing ? 6 : 3}
                              disabled={!isEditing}
                              value={block.text?.[activeLang]?.body || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setBlocks(prev =>
                                  prev.map(b =>
                                    b.id === block.id
                                      ? {
                                          ...b,
                                          text: {
                                            ...b.text,
                                            [activeLang]: {
                                              ...b.text?.[activeLang],
                                              body: val,
                                            },
                                          },
                                        }
                                      : b
                                  )
                                );
                              }}
                              className={`w-full p-3 text-xs font-mono rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                                activeLang !== 'en' ? 'font-devanagari' : ''
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* 2. VIDEO BLOCK */}
                      {block.type === 'video' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                                Video Title ({activeLang.toUpperCase()})
                              </label>
                              <input
                                type="text"
                                disabled={!isEditing}
                                value={block.video?.[activeLang]?.title || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setBlocks(prev =>
                                    prev.map(b =>
                                      b.id === block.id
                                        ? {
                                            ...b,
                                            video: {
                                              ...b.video,
                                              [activeLang]: {
                                                ...b.video?.[activeLang],
                                                title: val,
                                              },
                                            },
                                          }
                                        : b
                                    )
                                  );
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                                Video URL (YouTube / Vimeo / MP4)
                              </label>
                              <input
                                type="url"
                                disabled={!isEditing}
                                value={block.video?.[activeLang]?.videoUrl || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setBlocks(prev =>
                                    prev.map(b =>
                                      b.id === block.id
                                        ? {
                                            ...b,
                                            video: {
                                              ...b.video,
                                              [activeLang]: {
                                                ...b.video?.[activeLang],
                                                videoUrl: val,
                                              },
                                            },
                                          }
                                        : b
                                    )
                                  );
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                                Or Upload Video File
                              </label>
                              <label
                                className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-govText-secondary flex items-center justify-center gap-2 ${
                                  isEditing
                                    ? 'hover:border-[#0B6E4F] hover:text-[#0B6E4F] cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Browse MP4 File</span>
                                {isEditing && (
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setBlocks(prev =>
                                          prev.map(b =>
                                            b.id === block.id
                                              ? {
                                                  ...b,
                                                  video: {
                                                    ...b.video,
                                                    [activeLang]: {
                                                      ...b.video?.[activeLang],
                                                      videoUrl: `https://lms-cdn.cooperation.gov.in/videos/${file.name}`,
                                                    },
                                                  },
                                                }
                                              : b
                                          )
                                        );
                                        showToast(`Attached video: ${file.name}`);
                                      }
                                    }}
                                  />
                                )}
                              </label>
                            </div>
                          </div>

                          {/* Video Preview Card */}
                          {block.video?.[activeLang]?.videoUrl && (
                            <div className="bg-black/90 text-white p-3 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-9 rounded-lg bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                                  <Play className="w-4 h-4 fill-current" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs truncate block">
                                    {block.video[activeLang].title || 'Video Lecture Preview'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 truncate block font-mono">
                                    {block.video[activeLang].videoUrl}
                                  </span>
                                </div>
                              </div>

                              <a
                                href={block.video[activeLang].videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Preview</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. DOCUMENT / ATTACHMENT BLOCK */}
                      {block.type === 'attachment' && (
                        <div className="space-y-3">
                          <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-govText-primary truncate block">
                                  📄 {block.attachment?.fileName || 'Document.pdf'}
                                </span>
                                <span className="text-[11px] text-govText-muted">
                                  Size: {block.attachment?.fileSize || '2.4 MB'} • Format: {block.attachment?.fileType?.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="flex items-center gap-2 shrink-0">
                                <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-govText-primary rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Replace</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*"
                                    className="hidden"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setBlocks(prev =>
                                          prev.map(b =>
                                            b.id === block.id
                                              ? {
                                                  ...b,
                                                  attachment: {
                                                    fileName: file.name,
                                                    fileType: file.name.split('.').pop() || 'pdf',
                                                    fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                                                    fileUrl: `https://lms-cdn.cooperation.gov.in/docs/${file.name}`,
                                                  },
                                                }
                                              : b
                                          )
                                        );
                                        showToast(`Replaced with: ${file.name}`);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4. IMAGE BLOCK */}
                      {block.type === 'image' && (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="w-full sm:w-44 h-28 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {block.image?.[activeLang]?.imageUrl ? (
                                <img
                                  src={block.image[activeLang].imageUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              )}
                            </div>

                            <div className="flex-1 space-y-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-govText-secondary mb-0.5">
                                  Image URL
                                </label>
                                <input
                                  type="url"
                                  disabled={!isEditing}
                                  value={block.image?.[activeLang]?.imageUrl || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setBlocks(prev =>
                                      prev.map(b =>
                                        b.id === block.id
                                          ? {
                                              ...b,
                                              image: {
                                                ...b.image,
                                                [activeLang]: {
                                                  ...b.image?.[activeLang],
                                                  imageUrl: val,
                                                },
                                              },
                                            }
                                          : b
                                      )
                                    );
                                  }}
                                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-govText-secondary mb-0.5">
                                  Caption ({activeLang.toUpperCase()})
                                </label>
                                <input
                                  type="text"
                                  disabled={!isEditing}
                                  value={block.image?.[activeLang]?.caption || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setBlocks(prev =>
                                      prev.map(b =>
                                        b.id === block.id
                                          ? {
                                              ...b,
                                              image: {
                                                ...b.image,
                                                [activeLang]: {
                                                  ...b.image?.[activeLang],
                                                  caption: val,
                                                },
                                              },
                                            }
                                          : b
                                      )
                                    );
                                  }}
                                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. LINK BLOCK */}
                      {block.type === 'link' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                                Link Title ({activeLang.toUpperCase()})
                              </label>
                              <input
                                type="text"
                                disabled={!isEditing}
                                value={block.link?.[activeLang]?.title || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setBlocks(prev =>
                                    prev.map(b =>
                                      b.id === block.id
                                        ? {
                                            ...b,
                                            link: {
                                              ...b.link,
                                              [activeLang]: {
                                                ...b.link?.[activeLang],
                                                title: val,
                                              },
                                            },
                                          }
                                        : b
                                    )
                                  );
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                                URL * (http:// or https://)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  disabled={!isEditing}
                                  value={block.link?.[activeLang]?.url || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setBlocks(prev =>
                                      prev.map(b =>
                                        b.id === block.id
                                          ? {
                                              ...b,
                                              link: {
                                                ...b.link,
                                                [activeLang]: {
                                                  ...b.link?.[activeLang],
                                                  url: val,
                                                },
                                              },
                                            }
                                          : b
                                      )
                                    );
                                  }}
                                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                                />
                                {block.link?.[activeLang]?.url && (
                                  <a
                                    href={block.link[activeLang].url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                                  >
                                    <ExternalLink className="w-3 h-3 text-[#0B6E4F]" />
                                    <span>Test</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6. ACTIVITY BLOCK */}
                      {block.type === 'activity' && (
                        <div className="space-y-3 bg-orange-50/40 p-3.5 rounded-xl border border-orange-200">
                          <div>
                            <label className="block text-[11px] font-semibold text-orange-950 mb-1">
                              Activity Title ({activeLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={block.activity?.[activeLang]?.title || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setBlocks(prev =>
                                  prev.map(b =>
                                    b.id === block.id
                                      ? {
                                          ...b,
                                          activity: {
                                            ...b.activity,
                                            [activeLang]: {
                                              ...b.activity?.[activeLang],
                                              title: val,
                                            },
                                          },
                                        }
                                      : b
                                  )
                                );
                              }}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-orange-950 mb-1">
                              Instructions ({activeLang.toUpperCase()})
                            </label>
                            <textarea
                              rows={2}
                              disabled={!isEditing}
                              value={block.activity?.[activeLang]?.instructions || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setBlocks(prev =>
                                  prev.map(b =>
                                    b.id === block.id
                                      ? {
                                          ...b,
                                          activity: {
                                            ...b.activity,
                                            [activeLang]: {
                                              ...b.activity?.[activeLang],
                                              instructions: val,
                                            },
                                          },
                                        }
                                      : b
                                  )
                                );
                              }}
                              className="w-full p-2.5 text-xs rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Content Trigger */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(true)}
                className="w-full py-3 border-2 border-dashed border-[#0B6E4F]/40 hover:border-[#0B6E4F] hover:bg-[#0B6E4F]/5 text-[#0B6E4F] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Content Block</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Compact & Responsive Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Lesson Information */}
          <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-xs space-y-3.5">
            <h3 className="font-bold text-xs text-govText-primary uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Lesson Overview Stats</span>
              <span className="text-[10px] font-mono text-govText-muted">{status}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-govText-secondary">Estimated Duration:</span>
                <span className="font-bold text-govText-primary">{durationMinutes} mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-govText-secondary">Content Format:</span>
                <span className="font-bold text-govText-primary">{contentType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-govText-secondary">Total Content Blocks:</span>
                <span className="font-bold text-[#0B6E4F] bg-emerald-50 px-2 py-0.5 rounded-md">
                  {blocks.length} Blocks
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-govText-secondary">Attached Resources:</span>
                <span className="font-bold text-govText-primary">
                  {blocks.filter(b => b.type === 'attachment').length} Files
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-govText-secondary">Video Included:</span>
                <span className="font-bold text-govText-primary">
                  {blocks.some(b => b.type === 'video') ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Language Completion Status */}
          <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-xs space-y-3.5">
            <h3 className="font-bold text-xs text-govText-primary uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#0B6E4F]" />
              <span>Language Completion</span>
            </h3>

            <div className="space-y-2 text-xs">
              {(['en', 'hi', 'mr'] as const).map(lang => {
                const s = checkLanguageStatus(lang);
                return (
                  <div
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      activeLang === lang
                        ? 'border-[#0B6E4F] bg-emerald-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-bold text-govText-primary">
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
                    </span>
                    <span
                      className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                        s === 'complete'
                          ? 'text-emerald-700'
                          : s === 'partial'
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {s === 'complete' ? '✓ Complete' : s === 'partial' ? '⚠ Incomplete' : '○ Missing'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Trilingual Badge */}
            <div className="pt-1 text-center">
              {checkLanguageStatus('en') === 'complete' &&
              checkLanguageStatus('hi') === 'complete' &&
              checkLanguageStatus('mr') === 'complete' ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Trilingual Verified
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Translation In Progress
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Publishing Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-xs text-govText-primary uppercase tracking-wider pb-2 border-b border-gray-100">
              Publishing Checklist
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className={titleEn.trim() ? 'text-emerald-600 font-bold' : 'text-gray-300'}>
                  {titleEn.trim() ? '✓' : '○'}
                </span>
                <span className={titleEn.trim() ? 'text-govText-primary' : 'text-govText-muted'}>
                  Lesson Title Provided
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={durationMinutes >= 5 ? 'text-emerald-600 font-bold' : 'text-gray-300'}>
                  {durationMinutes >= 5 ? '✓' : '○'}
                </span>
                <span className={durationMinutes >= 5 ? 'text-govText-primary' : 'text-govText-muted'}>
                  Duration Valid (≥5 mins)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={blocks.length > 0 ? 'text-emerald-600 font-bold' : 'text-gray-300'}>
                  {blocks.length > 0 ? '✓' : '○'}
                </span>
                <span className={blocks.length > 0 ? 'text-govText-primary' : 'text-govText-muted'}>
                  At least 1 Content Block
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={checkLanguageStatus('en') === 'complete' ? 'text-emerald-600 font-bold' : 'text-gray-300'}>
                  {checkLanguageStatus('en') === 'complete' ? '✓' : '○'}
                </span>
                <span className={checkLanguageStatus('en') === 'complete' ? 'text-govText-primary' : 'text-govText-muted'}>
                  English Content Ready
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. LEARNER-FACING LESSON PREVIEW MODAL */}
      <LessonPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        lesson={{
          title: titleEn,
          titleHi,
          titleMr,
          contentType,
          durationMinutes,
          overview: overviewEn,
          overviewHi,
          overviewMr,
          blocks,
        }}
        moduleTitle={moduleTitle}
      />
    </div>
  );
};

export interface LessonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    title: string;
    titleHi?: string;
    titleMr?: string;
    contentType?: string;
    durationMinutes?: number;
    overview?: string;
    overviewHi?: string;
    overviewMr?: string;
    blocks?: ContentBlock[];
  };
  moduleTitle?: string;
}

export const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
  isOpen,
  onClose,
  lesson,
  moduleTitle,
}) => {
  const [previewLang, setPreviewLang] = useState<'en' | 'hi' | 'mr'>('en');

  if (!isOpen) return null;

  const currentTitle =
    previewLang === 'en'
      ? lesson.title
      : previewLang === 'hi'
      ? lesson.titleHi || lesson.title
      : lesson.titleMr || lesson.title;

  const currentOverview =
    previewLang === 'en'
      ? lesson.overview
      : previewLang === 'hi'
      ? lesson.overviewHi || lesson.overview
      : lesson.overviewMr || lesson.overview;

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      ariaLabel="Learner-Facing Lesson Preview"
    >
      <div className="w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#0B6E4F] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Learner-Facing Lesson Preview</h3>
              <p className="text-xs text-emerald-100">
                {moduleTitle ? `${moduleTitle} • ` : ''}Simulated Trainee Learning Experience
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Switcher Bar in Preview */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between shrink-0 text-xs">
          <span className="font-bold text-govText-secondary">Select Learner Language:</span>
          <div className="flex gap-2">
            {(['en', 'hi', 'mr'] as const).map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => setPreviewLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewLang === lang
                    ? 'bg-[#0B6E4F] text-white'
                    : 'bg-white text-govText-secondary border border-gray-200'
                }`}
              >
                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Body Preview */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Header Banner */}
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {lesson.contentType || 'Interactive Reading / Theory'}
              </span>
              <span className="text-govText-muted flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{lesson.durationMinutes || 25} mins completion</span>
              </span>
            </div>
            <h1
              className={`text-xl font-bold text-govText-primary ${
                previewLang !== 'en' ? 'font-devanagari' : ''
              }`}
            >
              {currentTitle}
            </h1>
            {currentOverview && (
              <p
                className={`text-xs text-govText-secondary leading-relaxed bg-[#F8FAF9] p-3 rounded-xl border border-gray-200 ${
                  previewLang !== 'en' ? 'font-devanagari' : ''
                }`}
              >
                {currentOverview}
              </p>
            )}
          </div>

          {/* Rendered Content Blocks */}
          <div className="space-y-6">
            {(lesson.blocks || []).length === 0 ? (
              <div className="text-center py-8 text-govText-muted italic">
                No content blocks authored yet for this lesson.
              </div>
            ) : (
              lesson.blocks?.map(b => (
                <div key={b.id} className="space-y-3">
                  {b.type === 'text' && (
                    <div className="space-y-2">
                      {b.text?.[previewLang]?.heading && (
                        <h2
                          className={`text-sm font-bold text-govText-primary ${
                            previewLang !== 'en' ? 'font-devanagari' : ''
                          }`}
                        >
                          {b.text[previewLang].heading}
                        </h2>
                      )}
                      <p
                        className={`text-xs text-govText-primary leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-gray-200 ${
                          previewLang !== 'en' ? 'font-devanagari' : ''
                        }`}
                      >
                        {b.text?.[previewLang]?.body}
                      </p>
                    </div>
                  )}

                  {b.type === 'video' && b.video?.[previewLang]?.videoUrl && (
                    <div className="bg-black/90 text-white rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-400 fill-current" />
                        <span
                          className={`font-bold text-xs ${
                            previewLang !== 'en' ? 'font-devanagari' : ''
                          }`}
                        >
                          {b.video[previewLang].title}
                        </span>
                      </div>
                      <div className="h-44 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800 text-gray-400 font-mono text-xs">
                        [ Interactive Video Stream: {b.video[previewLang].videoUrl} ]
                      </div>
                      <p
                        className={`text-[11px] text-gray-300 ${
                          previewLang !== 'en' ? 'font-devanagari' : ''
                        }`}
                      >
                        {b.video[previewLang].description}
                      </p>
                    </div>
                  )}

                  {b.type === 'attachment' && (
                    <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-600" />
                        <div>
                          <span className="font-bold text-xs text-govText-primary block">
                            📄 {b.attachment?.fileName}
                          </span>
                          <span className="text-[10px] text-govText-muted">
                            {b.attachment?.fileSize} • Official Curriculum Document
                          </span>
                        </div>
                      </div>
                      <a
                        href={b.attachment?.fileUrl || '#'}
                        className="px-3 py-1.5 bg-[#0B6E4F] text-white rounded-lg font-bold text-xs"
                      >
                        Download
                      </a>
                    </div>
                  )}

                  {b.type === 'image' && b.image?.[previewLang]?.imageUrl && (
                    <div className="space-y-1.5">
                      <img
                        src={b.image[previewLang].imageUrl}
                        alt={b.image[previewLang].altText || ''}
                        className="w-full max-h-72 object-cover rounded-xl border border-gray-200"
                      />
                      {b.image[previewLang].caption && (
                        <p
                          className={`text-[11px] text-center text-govText-muted italic ${
                            previewLang !== 'en' ? 'font-devanagari' : ''
                          }`}
                        >
                          {b.image[previewLang].caption}
                        </p>
                      )}
                    </div>
                  )}

                  {b.type === 'link' && b.link?.[previewLang]?.url && (
                    <a
                      href={b.link[previewLang].url}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-3.5 bg-[#F8FAF9] hover:bg-emerald-50/50 rounded-xl border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold text-xs text-govText-primary flex items-center gap-1.5 ${
                            previewLang !== 'en' ? 'font-devanagari' : ''
                          }`}
                        >
                          <Link2 className="w-4 h-4 text-[#0B6E4F]" />
                          <span>{b.link[previewLang].title}</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-govText-muted" />
                      </div>
                      <p
                        className={`text-[11px] text-govText-secondary mt-1 ${
                          previewLang !== 'en' ? 'font-devanagari' : ''
                        }`}
                      >
                        {b.link[previewLang].description}
                      </p>
                    </a>
                  )}

                  {b.type === 'activity' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                      <span
                        className={`font-bold text-xs text-orange-950 flex items-center gap-1.5 ${
                          previewLang !== 'en' ? 'font-devanagari' : ''
                        }`}
                      >
                        <Zap className="w-4 h-4 text-orange-600" />
                        <span>{b.activity?.[previewLang]?.title}</span>
                      </span>
                      <p
                        className={`text-xs text-orange-900 leading-relaxed ${
                          previewLang !== 'en' ? 'font-devanagari' : ''
                        }`}
                      >
                        {b.activity?.[previewLang]?.instructions}
                      </p>
                      <div className="pt-1 text-[11px] font-semibold text-orange-800">
                        Expected Outcome: {b.activity?.[previewLang]?.expectedOutcome}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-govText-primary text-xs font-bold rounded-xl cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};
