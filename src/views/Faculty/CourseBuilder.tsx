import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3,
  Plus,
  Save,
  BookOpen,
  Layers,
  HelpCircle,
  Globe,
  Sparkles,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Clock,
  AlertTriangle,
  Eye,
  Check,
  X,
  FileText,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Video,
  FileUp,
  Link2,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Paperclip,
  Upload,
  Play,
  Circle,
  Presentation,
  File,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Course, CourseModule, Lesson, Quiz, QuizQuestion, LessonAttachment, LessonLanguageContent } from '../../types';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { PageContainer } from '../../components/layout/PageContainer';
import { GlobalModal } from '../../components/common/GlobalModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export interface LessonFormState {
  moduleIndex: number;
  lessonIndex?: number;
  isNew: boolean;
  id: string;
  order: number;
  durationMinutes: number;
  contentType: 'text' | 'video' | 'interactive' | 'pdf' | 'presentation' | 'resource';
  videoUrl: string;
  documentName: string;
  documentUrl: string;
  presentationName: string;
  presentationUrl: string;
  externalUrl: string;
  attachments: LessonAttachment[];
  titles: {
    en: string;
    hi: string;
    mr: string;
  };
  contents: {
    en: LessonLanguageContent;
    hi: LessonLanguageContent;
    mr: LessonLanguageContent;
  };
}

export const CourseBuilder: React.FC = () => {
  const { courses, addNewCourse, currentUser, activeViewParams, navigate } = useApp();

  // Active course selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (activeViewParams?.courseId && courses.some(c => c.id === activeViewParams.courseId)) {
      return activeViewParams.courseId;
    }
    return courses[0]?.id || '';
  });

  useEffect(() => {
    if (activeViewParams?.courseId && courses.some(c => c.id === activeViewParams.courseId)) {
      setSelectedCourseId(activeViewParams.courseId);
    }
  }, [activeViewParams?.courseId, courses]);

  // Working copy of course data for editing
  const originalCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const [workingCourse, setWorkingCourse] = useState<Course | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);

  // Fetch live curriculum from PostgreSQL/Supabase database whenever selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;
    let isCancelled = false;
    setIsLoadingCurriculum(true);

    api.curriculum.getCurriculum(selectedCourseId)
      .then(liveData => {
        if (isCancelled) return;
        setWorkingCourse(liveData);
        addNewCourse(liveData);
        setHasUnsavedChanges(false);
      })
      .catch(err => {
        console.warn('Could not load live curriculum from DB, using cached course data:', err);
        if (originalCourse && !isCancelled) {
          setWorkingCourse(JSON.parse(JSON.stringify(originalCourse)));
          setHasUnsavedChanges(false);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingCurriculum(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCourseId]);

  // Expanded modules state (all expanded by default)
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (workingCourse?.modules) {
      const initialExpanded: Record<string, boolean> = {};
      workingCourse.modules.forEach(m => {
        initialExpanded[m.id] = true;
      });
      setExpandedModuleIds(initialExpanded);
    }
  }, [workingCourse?.id]);

  const toggleModuleExpand = (modId: string) => {
    setExpandedModuleIds(prev => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Toast / feedback notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Modal states
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleHi, setNewTitleHi] = useState('');
  const [newTitleMr, setNewTitleMr] = useState('');
  const [newCategory, setNewCategory] = useState('PACS Digitalization');
  const [newDescEn, setNewDescEn] = useState('');

  // Module Edit Modal
  const [curriculumLang, setCurriculumLang] = useState<'en' | 'hi' | 'mr'>('en');

  // Module Edit Modal
  const [editingModule, setEditingModule] = useState<{ index: number; module: CourseModule } | null>(null);

  // Lesson Edit Modal State (Full Isolated Multilingual Form State)
  const [editingLesson, setEditingLesson] = useState<LessonFormState | null>(null);

  // Attachment input state inside Edit Lesson
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentType, setNewAttachmentType] = useState<'pdf' | 'doc' | 'ppt' | 'image' | 'link'>('pdf');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  // Assessment Editor Modal
  const [editingQuiz, setEditingQuiz] = useState<{
    moduleIndex: number;
    quiz: Quiz;
  } | null>(null);

  // Quiz Preview Modal
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, number>>({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  // Delete Confirmation Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'module' | 'lesson' | 'quiz';
    moduleIndex: number;
    lessonIndex?: number;
    title: string;
  } | null>(null);

  // Active language tab in multilingual modals (en / hi / mr)
  const [modalLang, setModalLang] = useState<'en' | 'hi' | 'mr'>('en');

  // Drag and drop state
  const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);
  const [draggedLessonIdx, setDraggedLessonIdx] = useState<{ moduleIdx: number; lessonIdx: number } | null>(null);

  // Helper: Create isolated LessonFormState from Lesson
  const createLessonFormState = (
    moduleIndex: number,
    lesson: Lesson,
    isNew: boolean,
    lessonIndex?: number
  ): LessonFormState => {
    // Sanitize any parenthesized Devanagari from English title
    let cleanTitleEn = lesson.title || '';
    if (cleanTitleEn.includes('(') && /[\u0900-\u097F]/.test(cleanTitleEn)) {
      cleanTitleEn = cleanTitleEn.replace(/\s*\([\u0900-\u097F\s\d\.\-—:]+\)\s*$/, '').trim();
    }
    const cleanTitleHi = lesson.titleHi || '';
    const cleanTitleMr = lesson.titleMr || '';

    const enText = lesson.contentByLanguage?.en?.text || '';
    const hiText = lesson.contentByLanguage?.hi?.text || '';
    const mrText = lesson.contentByLanguage?.mr?.text || '';

    return {
      moduleIndex,
      lessonIndex,
      isNew,
      id: lesson.id || `les-${Date.now()}`,
      order: lesson.order || 1,
      durationMinutes: lesson.durationMinutes || 25,
      contentType: (lesson.contentType as any) || 'text',
      videoUrl: lesson.videoUrl || lesson.contentByLanguage?.en?.videoUrl || '',
      documentName: lesson.documentName || 'PACS_ERP_Training_Guide.pdf',
      documentUrl: lesson.documentUrl || '',
      presentationName: lesson.presentationName || 'National_PACS_Architecture_Slides.pptx',
      presentationUrl: lesson.presentationUrl || '',
      externalUrl: lesson.externalUrl || 'https://cooperation.gov.in',
      attachments: lesson.attachments?.length
        ? [...lesson.attachments]
        : [
            { id: 'att-1', name: 'PACS_ERP_Workflow_Guide.pdf', size: '2.4 MB', type: 'pdf' },
            { id: 'att-2', name: 'MoC PACS Digitalization Guidelines', type: 'link', url: 'https://cooperation.gov.in/pacs' },
          ],
      titles: {
        en: cleanTitleEn,
        hi: cleanTitleHi,
        mr: cleanTitleMr,
      },
      contents: {
        en: {
          text: enText,
          overview:
            lesson.contentByLanguage?.en?.overview ||
            (enText.length > 160 ? enText.slice(0, 160) + '...' : enText) ||
            'Comprehensive lesson overview on national PACS computerization standard operating procedures.',
          richContent:
            lesson.contentByLanguage?.en?.richContent ||
            enText ||
            '### 1. Introduction\nThe Ministry of Cooperation mandate establishes standardized computerization across 63,000 primary agricultural credit societies.\n\n### 2. Operational Procedures\n- All Day-Open vouchers must be authenticated prior to counter postings.\n- Daily cash registers and GL ledgers reconcile automatically with DCCBs.',
          learningObjectives: lesson.contentByLanguage?.en?.learningObjectives?.length
            ? [...lesson.contentByLanguage.en.learningObjectives]
            : [
                'Understand foundational PACS ERP architecture and governance bylaws',
                'Perform daily cash verification and automated Day-Open routines',
              ],
          keyTakeaways: lesson.contentByLanguage?.en?.keyTakeaways?.length
            ? [...lesson.contentByLanguage.en.keyTakeaways]
            : [
                'Over 63,000 PACS digitized on unified national cloud architecture',
                'Real-time automated audit trail prevents cash discrepancy',
              ],
          transcript:
            lesson.contentByLanguage?.en?.transcript ||
            'Welcome to this video lecture. In this lesson, we will demonstrate the national PACS ERP software interface, member ledger navigation, and transaction posting.',
        },
        hi: {
          text: hiText,
          overview:
            lesson.contentByLanguage?.hi?.overview ||
            (hiText.length > 160 ? hiText.slice(0, 160) + '...' : hiText) ||
            'राष्ट्रीय पैक्स कंप्यूटरीकरण मानक संचालन प्रक्रियाओं पर व्यापक पाठ अवलोकन।',
          richContent:
            lesson.contentByLanguage?.hi?.richContent ||
            hiText ||
            '### 1. परिचय\nसहकारिता मंत्रालय के विजन के अंतर्गत 63,000 कार्यशील प्राथमिक कृषि ऋण समितियों (पैक्स) को एकीकृत क्लाउड ई-आरपी पर लाया जा रहा है।\n\n### 2. मुख्य प्रक्रियाएं\n- सुबह लेन-देन शुरू करने से पूर्व डे-ओपन सत्यापन अनिवार्य है।\n- दैनिक रोकड़ बही और लेजर का जिला केंद्रीय सहकारी बैंकों (DCCB) से सीधा मिलान होता है।',
          learningObjectives: lesson.contentByLanguage?.hi?.learningObjectives?.length
            ? [...lesson.contentByLanguage.hi.learningObjectives]
            : [
                'पैक्स ई-आरपी संरचना एवं कानूनी उप-नियमों को समझना',
                'दैनिक नकद सत्यापन एवं डे-ओपन प्रक्रियाओं का निष्पादन',
              ],
          keyTakeaways: lesson.contentByLanguage?.hi?.keyTakeaways?.length
            ? [...lesson.contentByLanguage.hi.keyTakeaways]
            : [
                '63,000 से अधिक पैक्स एकीकृत राष्ट्रीय पोर्टल पर डिजिटाइज किए गए हैं',
                'वास्तविक समय में स्वचालित ऑडिट ट्रेल से पारदर्शिता सुनिश्चित होती है',
              ],
          transcript:
            lesson.contentByLanguage?.hi?.transcript ||
            'इस वीडियो व्याख्यान में आपका स्वागत है। आज हम पैक्स ई-आरपी सॉफ्टवेयर में दैनिक खाता प्रविष्टि और रोकड़ मिलान का सजीव अभ्यास करेंगे।',
        },
        mr: {
          text: mrText,
          overview:
            lesson.contentByLanguage?.mr?.overview ||
            (mrText.length > 160 ? mrText.slice(0, 160) + '...' : mrText) ||
            'राष्ट्रीय पॅक्स संगणकीकरण कार्यपद्धतीचा सविस्तर अभ्यासक्रम आढावा.',
          richContent:
            lesson.contentByLanguage?.mr?.richContent ||
            mrText ||
            '### १. प्रस्तावना\nसहकार मंत्रालयाच्या धोरणानुसार देशभरातील ६३,००० प्राथमिक कृषी पतसंस्थांच्या कामकाजात पारदर्शकता आणण्यासाठी राष्ट्रीय ई-आरपी प्रकल्प राबवला जात आहे.\n\n### २. दैनंदिन कामकाज\n- व्यवहारांपूर्वी दिवस प्रारंभ (Day-Open) अधिकृतता आवश्यक आहे.\n- जिल्हा मध्यवर्ती सहकारी बँकांशी थेट डिजिटल ताळेबंद जुळवणी होते.',
          learningObjectives: lesson.contentByLanguage?.mr?.learningObjectives?.length
            ? [...lesson.contentByLanguage.mr.learningObjectives]
            : [
                'पॅक्स ई-आरपी रचना आणि कायदेशीर नियमावली समजून घेणे',
                'दैनंदिन जमा-खर्च नोंदी व दिवस प्रारंभ प्रक्रियेचा सराव करणे',
              ],
          keyTakeaways: lesson.contentByLanguage?.mr?.keyTakeaways?.length
            ? [...lesson.contentByLanguage.mr.keyTakeaways]
            : [
                'देशभरातील ६३,००० पॅक्स संस्था एकात्मिक राष्ट्रीय क्लाउड प्रणालीवर कार्यरत',
                'डिजिटल नोंदींमुळे ऑडिट पारदर्शकता व अचूकता टिकून राहते',
              ],
          transcript:
            lesson.contentByLanguage?.mr?.transcript ||
            'या प्रशिक्षण सत्रात आपले स्वागत आहे. आज आपण पॅक्स ई-आरपी सॉफ्टवेअरमधील दैनंदिन व्यवहार नोंदींचा सविस्तर सराव करणार आहोत.',
        },
      },
    };
  };

  // Save changes to database and AppContext
  const handleSaveCourse = async () => {
    if (!workingCourse || isSaving) return;
    setIsSaving(true);
    try {
      await api.curriculum.updateCourse(workingCourse.id, workingCourse);
      addNewCourse(workingCourse);
      setHasUnsavedChanges(false);
      showToast(`"${workingCourse.title}" updates saved successfully to NCCT LMS repository!`);
    } catch (err: any) {
      console.error('Failed to save course updates:', err);
      showToast(`Unable to save course: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to mark changes
  const updateWorkingCourse = (updated: Course) => {
    setWorkingCourse(updated);
    setHasUnsavedChanges(true);
  };

  // Module Operations (Database Persistent)
  const handleAddModule = async () => {
    if (!workingCourse || isSaving) return;
    const newModNum = workingCourse.modules.length + 1;
    setIsSaving(true);
    try {
      const created = await api.curriculum.createModule(workingCourse.id, {
        title: `Module ${newModNum}: New Curriculum Module`,
        titleHi: `मॉड्यूल ${newModNum}: नवीन अभ्यासक्रम विभाग`,
        titleMr: `विभाग ${newModNum}: नवीन अभ्यासक्रम घटक`,
        order: newModNum,
      });

      const updated: Course = {
        ...workingCourse,
        modules: [...workingCourse.modules, created],
      };
      setWorkingCourse(updated);
      addNewCourse(updated);
      setExpandedModuleIds(prev => ({ ...prev, [created.id]: true }));
      showToast(`Added Module ${newModNum}`);
    } catch (err: any) {
      console.error('Failed to create module in database:', err);
      showToast(`Unable to save module: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModuleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workingCourse || !editingModule || isSaving) return;
    setIsSaving(true);
    try {
      const updatedMod = await api.curriculum.updateModule(
        editingModule.module.id,
        {
          title: editingModule.module.title,
          titleHi: editingModule.module.titleHi,
          titleMr: editingModule.module.titleMr,
          description: editingModule.module.description,
          order: editingModule.module.order,
        },
        workingCourse.id
      );

      const newModules = [...workingCourse.modules];
      newModules[editingModule.index] = {
        ...editingModule.module,
        ...updatedMod,
      };
      const updatedCourse = { ...workingCourse, modules: newModules };
      setWorkingCourse(updatedCourse);
      addNewCourse(updatedCourse);
      setEditingModule(null);
      showToast('Module details updated.');
    } catch (err: any) {
      console.error('Failed to update module:', err);
      showToast(`Unable to update module: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!workingCourse || !deleteConfirm || isSaving) return;
    setIsSaving(true);
    try {
      if (deleteConfirm.type === 'module') {
        const targetMod = workingCourse.modules[deleteConfirm.moduleIndex];
        await api.curriculum.deleteModule(targetMod.id, workingCourse.id);
        const newModules = workingCourse.modules.filter((_, idx) => idx !== deleteConfirm.moduleIndex);
        newModules.forEach((m, idx) => { m.order = idx + 1; });
        const updated = { ...workingCourse, modules: newModules };
        setWorkingCourse(updated);
        addNewCourse(updated);
        showToast('Module removed.');
      } else if (deleteConfirm.type === 'lesson' && deleteConfirm.lessonIndex !== undefined) {
        const targetMod = workingCourse.modules[deleteConfirm.moduleIndex];
        const targetLesson = targetMod.lessons[deleteConfirm.lessonIndex];
        await api.curriculum.deleteLesson(targetLesson.id, targetMod.id);
        const newModules = [...workingCourse.modules];
        const targetModCopy = { ...newModules[deleteConfirm.moduleIndex] };
        targetModCopy.lessons = targetModCopy.lessons.filter((_, idx) => idx !== deleteConfirm.lessonIndex);
        targetModCopy.lessons.forEach((l, idx) => { l.order = idx + 1; });
        newModules[deleteConfirm.moduleIndex] = targetModCopy;
        const updated = { ...workingCourse, modules: newModules };
        setWorkingCourse(updated);
        addNewCourse(updated);
        showToast('Lesson removed.');
      } else if (deleteConfirm.type === 'quiz') {
        const targetMod = workingCourse.modules[deleteConfirm.moduleIndex];
        if (targetMod.quiz) {
          await api.curriculum.deleteQuiz(targetMod.quiz.id, targetMod.id);
        }
        const newModules = [...workingCourse.modules];
        const targetModCopy = { ...newModules[deleteConfirm.moduleIndex] };
        delete targetModCopy.quiz;
        newModules[deleteConfirm.moduleIndex] = targetModCopy;
        const updated = { ...workingCourse, modules: newModules };
        setWorkingCourse(updated);
        addNewCourse(updated);
        showToast('Assessment removed.');
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      showToast(`Unable to delete item: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  // Move Module Up/Down (Database Persistent)
  const moveModule = async (index: number, direction: 'up' | 'down') => {
    if (!workingCourse || isSaving) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= workingCourse.modules.length) return;

    const newModules = [...workingCourse.modules];
    const temp = newModules[index];
    newModules[index] = newModules[targetIndex];
    newModules[targetIndex] = temp;

    // re-assign order
    newModules.forEach((m, i) => {
      m.order = i + 1;
    });

    const updated = { ...workingCourse, modules: newModules };
    setWorkingCourse(updated);
    addNewCourse(updated);

    try {
      await api.curriculum.reorderModules(workingCourse.id, newModules.map(m => m.id));
    } catch (err) {
      console.error('Failed to persist module reordering:', err);
    }
  };

  // Lesson Operations
  const handleOpenAddLesson = (moduleIndex: number) => {
    if (!workingCourse) return;
    const mod = workingCourse.modules[moduleIndex];
    const lessonNum = `${moduleIndex + 1}.${mod.lessons.length + 1}`;
    const newLesson: Lesson = {
      id: `les-${Date.now()}`,
      moduleId: mod.id,
      order: mod.lessons.length + 1,
      title: `${lessonNum} New Lesson Title`,
      titleHi: `${lessonNum} नया पाठ शीर्षक`,
      titleMr: `${lessonNum} नवीन धडा शीर्षक`,
      durationMinutes: 25,
      contentType: 'text',
      contentByLanguage: {
        en: {
          text: '',
          overview: 'Lesson overview and syllabus objectives in English.',
          richContent: '### Overview\nEnter comprehensive English lesson content and theoretical guidelines here...',
          learningObjectives: ['Objective 1: Understand core PACS digitalization standard'],
          keyTakeaways: ['Key point 1: Real-time ledger synchronization'],
        },
        hi: {
          text: '',
          overview: 'हिन्दी में पाठ अवलोकन एवं पाठ्यक्रम उद्देश्य।',
          richContent: '### विवरण\nयहाँ हिन्दी में विस्तृत पाठ सामग्री एवं सैद्धांतिक दिशानिर्देश दर्ज करें...',
          learningObjectives: ['उद्देश्य १: पैक्स डिजिटलीकरण के मुख्य मानकों को समझना'],
          keyTakeaways: ['मुख्य बिंदु १: वास्तविक समय में बही-खाता समाधान'],
        },
        mr: {
          text: '',
          overview: 'मराठीमध्ये धड्याचे विहंगावलोकन आणि अभ्यासक्रम उद्दिष्टे.',
          richContent: '### तपशील\nयेथे मराठीमध्ये सविस्तर अभ्यासक्रम आणि मार्गदर्शक तत्त्वे नोंदवा...',
          learningObjectives: ['उद्दिष्ट १: पॅक्स संगणकीकरण मानके समजून घेणे'],
          keyTakeaways: ['महत्त्वाचा मुद्दा १: थेट ताळेबंद जुळवणी'],
        },
      },
    };

    setEditingLesson(createLessonFormState(moduleIndex, newLesson, true));
    setModalLang('en');
  };

  const handleOpenEditLesson = (moduleIndex: number, lessonIndex: number, lesson: Lesson) => {
    setEditingLesson(createLessonFormState(moduleIndex, lesson, false, lessonIndex));
    setModalLang('en');
  };

  const handleSaveLessonEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workingCourse || !editingLesson || isSaving) return;

    // Validate External URL if format is resource
    if (editingLesson.contentType === 'resource' && editingLesson.externalUrl) {
      if (!editingLesson.externalUrl.startsWith('http://') && !editingLesson.externalUrl.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
      }
    }

    setIsSaving(true);
    try {
      const targetMod = workingCourse.modules[editingLesson.moduleIndex];
      const payload = {
        id: editingLesson.isNew ? undefined : editingLesson.id,
        title: editingLesson.titles.en.trim() || 'Untitled Lesson',
        titleHi: editingLesson.titles.hi.trim(),
        titleMr: editingLesson.titles.mr.trim(),
        order: editingLesson.order,
        durationMinutes: editingLesson.durationMinutes,
        contentType: editingLesson.contentType,
        videoUrl: editingLesson.videoUrl && editingLesson.videoUrl.trim() ? editingLesson.videoUrl.trim() : null,
        documentName: editingLesson.documentName,
        documentUrl: editingLesson.documentUrl,
        presentationName: editingLesson.presentationName,
        presentationUrl: editingLesson.presentationUrl,
        externalUrl: editingLesson.externalUrl,
        attachments: editingLesson.attachments,
        contentByLanguage: {
          en: {
            ...editingLesson.contents.en,
            videoUrl: editingLesson.videoUrl && editingLesson.videoUrl.trim() ? editingLesson.videoUrl.trim() : '',
            text: editingLesson.contents.en.richContent || editingLesson.contents.en.overview || '',
          },
          hi: {
            ...editingLesson.contents.hi,
            text: editingLesson.contents.hi.richContent || editingLesson.contents.hi.overview || '',
          },
          mr: {
            ...editingLesson.contents.mr,
            text: editingLesson.contents.mr.richContent || editingLesson.contents.mr.overview || '',
          },
        },
      };

      let savedLesson: Lesson;
      if (editingLesson.isNew) {
        savedLesson = await api.curriculum.createLesson(targetMod.id, payload);
      } else {
        savedLesson = await api.curriculum.updateLesson(editingLesson.id, payload, targetMod.id);
      }

      const newModules = [...workingCourse.modules];
      const targetModCopy = { ...newModules[editingLesson.moduleIndex] };
      const newLessons = [...targetModCopy.lessons];

      if (editingLesson.isNew) {
        newLessons.push(savedLesson);
      } else if (editingLesson.lessonIndex !== undefined) {
        newLessons[editingLesson.lessonIndex] = savedLesson;
      }

      targetModCopy.lessons = newLessons;
      newModules[editingLesson.moduleIndex] = targetModCopy;
      const updated = { ...workingCourse, modules: newModules };
      setWorkingCourse(updated);
      addNewCourse(updated);
      setEditingLesson(null);
      showToast(editingLesson.isNew ? 'Lesson created and saved.' : 'Lesson updated successfully.');
    } catch (err: any) {
      console.error('Failed to save lesson:', err);
      showToast(`Unable to save lesson: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Move Lesson Up/Down (Database Persistent)
  const moveLesson = async (moduleIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
    if (!workingCourse || isSaving) return;
    const targetMod = workingCourse.modules[moduleIndex];
    const targetLessonIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (targetLessonIndex < 0 || targetLessonIndex >= targetMod.lessons.length) return;

    const newModules = [...workingCourse.modules];
    const modCopy = { ...targetMod };
    const newLessons = [...modCopy.lessons];

    const temp = newLessons[lessonIndex];
    newLessons[lessonIndex] = newLessons[targetLessonIndex];
    newLessons[targetLessonIndex] = temp;

    newLessons.forEach((l, i) => {
      l.order = i + 1;
    });

    modCopy.lessons = newLessons;
    newModules[moduleIndex] = modCopy;
    const updated = { ...workingCourse, modules: newModules };
    setWorkingCourse(updated);
    addNewCourse(updated);

    try {
      await api.curriculum.reorderLessons(targetMod.id, newLessons.map(l => l.id));
    } catch (err) {
      console.error('Failed to persist lesson reordering:', err);
    }
  };

  // Assessment Operations
  const handleOpenAssessmentEditor = (moduleIndex: number) => {
    if (!workingCourse) return;
    const mod = workingCourse.modules[moduleIndex];
    if (mod.quiz) {
      setEditingQuiz({
        moduleIndex,
        quiz: JSON.parse(JSON.stringify(mod.quiz)),
      });
    } else {
      // Create a default quiz
      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        moduleId: mod.id,
        title: `${mod.title} Assessment`,
        titleHi: `${mod.titleHi} मूल्यांकन`,
        titleMr: `${mod.titleMr} चाचणी`,
        passThreshold: 75,
        questions: [
          {
            id: `q-${Date.now()}-1`,
            question: 'What is the primary objective of this module in PACS operations?',
            questionHi: 'पैक्स संचालन में इस मॉड्यूल का प्राथमिक उद्देश्य क्या है?',
            questionMr: 'पॅक्स कामकाजात या घटकाचा मुख्य उद्देश काय आहे?',
            options: {
              en: [
                'Ensure accurate ledger reconciliation',
                'Manual bahi-khata preservation',
                'Tax evasion assistance',
                'Disregard of audit regulations',
              ],
              hi: [
                'सटीक बही-खाता समाधान सुनिश्चित करना',
                'पारंपरिक बही-खातों का संरक्षण',
                'कर चोरी में सहायता',
                'लेखापरीक्षा नियमों की उपेक्षा',
              ],
              mr: [
                'अचूक ताळेबंद जुळवणी सुनिश्चित करणे',
                'पारंपरिक वहीखात्यांचे जतन',
                'कर चोरीस मदत करणे',
                'ऑडिट नियमांचे उल्लंघन करणे',
              ],
            },
            correctOptionIndex: 0,
            explanation: {
              en: 'Digital reconciliation prevents operational discrepancies and upholds transparency.',
              hi: 'डिजिटल समाधान परिचालन संबंधी विसंगतियों को रोकता है तथा पारदर्शिता बनाए रखता है।',
              mr: 'डिजिटल जुळवणीमुळे व्यवहारातील त्रुटी टळतात आणि पारदर्शकता टिकून राहते.',
            },
          },
        ],
      };
      setEditingQuiz({
        moduleIndex,
        quiz: newQuiz,
      });
    }
    setModalLang('en');
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workingCourse || !editingQuiz || isSaving) return;
    setIsSaving(true);
    try {
      const targetMod = workingCourse.modules[editingQuiz.moduleIndex];
      const savedQuiz = await api.curriculum.saveQuiz(targetMod.id, editingQuiz.quiz);

      const newModules = [...workingCourse.modules];
      const targetModCopy = { ...newModules[editingQuiz.moduleIndex] };
      targetModCopy.quiz = savedQuiz;
      newModules[editingQuiz.moduleIndex] = targetModCopy;
      const updated = { ...workingCourse, modules: newModules };
      setWorkingCourse(updated);
      addNewCourse(updated);
      setEditingQuiz(null);
      showToast('Assessment saved.');
    } catch (err: any) {
      console.error('Failed to save assessment:', err);
      showToast(`Unable to save assessment: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add question to quiz
  const handleAddQuestionToQuiz = () => {
    if (!editingQuiz) return;
    const qNum = editingQuiz.quiz.questions.length + 1;
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}-${qNum}`,
      question: `Question ${qNum}: Enter national standard curriculum question prompt`,
      questionHi: `प्रश्न ${qNum}: राष्ट्रीय मानक पाठ्यक्रम का प्रश्न दर्ज करें`,
      questionMr: `प्रश्न ${qNum}: राष्ट्रीय मानकानुसार प्रश्न नोंदवा`,
      options: {
        en: ['Option A', 'Option B', 'Option C', 'Option D'],
        hi: ['विकल्प क', 'विकल्प ख', 'विकल्प ग', 'विकल्प घ'],
        mr: ['पर्याय अ', 'पर्याय ब', 'पर्याय क', 'पर्याय ड'],
      },
      correctOptionIndex: 0,
      explanation: {
        en: 'Detailed rationale and regulatory reference for the correct answer.',
        hi: 'सही उत्तर का विस्तृत औचित्य एवं विनियामक संदर्भ।',
        mr: 'योग्य उत्तराचे सविस्तर स्पष्टीकरण व संदर्भ.',
      },
    };

    setEditingQuiz({
      ...editingQuiz,
      quiz: {
        ...editingQuiz.quiz,
        questions: [...editingQuiz.quiz.questions, newQ],
      },
    });
  };

  const handleDeleteQuestion = (qIdx: number) => {
    if (!editingQuiz) return;
    if (editingQuiz.quiz.questions.length <= 1) {
      alert('An assessment must contain at least 1 question.');
      return;
    }
    const updatedQuestions = editingQuiz.quiz.questions.filter((_, idx) => idx !== qIdx);
    setEditingQuiz({
      ...editingQuiz,
      quiz: {
        ...editingQuiz.quiz,
        questions: updatedQuestions,
      },
    });
  };

  const moveQuestion = (qIdx: number, direction: 'up' | 'down') => {
    if (!editingQuiz) return;
    const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
    if (targetIdx < 0 || targetIdx >= editingQuiz.quiz.questions.length) return;

    const newQuestions = [...editingQuiz.quiz.questions];
    const temp = newQuestions[qIdx];
    newQuestions[qIdx] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;

    setEditingQuiz({
      ...editingQuiz,
      quiz: {
        ...editingQuiz.quiz,
        questions: newQuestions,
      },
    });
  };

  // Preview assessment handlers
  const handleOpenPreview = (quiz: Quiz) => {
    setPreviewQuiz(quiz);
    setPreviewAnswers({});
    setPreviewSubmitted(false);
  };

  // Trilingual verification checker
  const isTrilingualVerified = (item: {
    title: string;
    titleHi?: string;
    titleMr?: string;
    contentByLanguage?: Record<string, any>;
  }) => {
    const hasTitles = Boolean(item.title?.trim() && item.titleHi?.trim() && item.titleMr?.trim());
    if (!item.contentByLanguage) return hasTitles;
    const hasEn = Boolean(
      item.contentByLanguage.en?.text?.trim() ||
      item.contentByLanguage.en?.richContent?.trim() ||
      item.contentByLanguage.en?.overview?.trim()
    );
    const hasHi = Boolean(
      item.contentByLanguage.hi?.text?.trim() ||
      item.contentByLanguage.hi?.richContent?.trim() ||
      item.contentByLanguage.hi?.overview?.trim()
    );
    const hasMr = Boolean(
      item.contentByLanguage.mr?.text?.trim() ||
      item.contentByLanguage.mr?.richContent?.trim() ||
      item.contentByLanguage.mr?.overview?.trim()
    );
    return hasTitles && hasEn && hasHi && hasMr;
  };

  // Helper: check completion per language
  const getLanguageStatus = (state: LessonFormState, lang: 'en' | 'hi' | 'mr') => {
    const titleFilled = Boolean(state.titles[lang]?.trim());
    const content = state.contents[lang];
    const contentFilled = Boolean(
      content?.richContent?.trim() || content?.overview?.trim() || content?.text?.trim()
    );
    if (titleFilled && contentFilled) return 'complete';
    if (titleFilled || contentFilled) return 'partial';
    return 'empty';
  };

  // Helper: Rich text formatting injection
  const insertFormat = (prefix: string, suffix: string = '') => {
    if (!editingLesson) return;
    const current = editingLesson.contents[modalLang]?.richContent || '';
    const updated = current ? `${current}\n${prefix}sample${suffix}` : `${prefix}sample${suffix}`;
    setEditingLesson({
      ...editingLesson,
      contents: {
        ...editingLesson.contents,
        [modalLang]: {
          ...editingLesson.contents[modalLang],
          richContent: updated,
        },
      },
    });
  };

  // Helper: Objective handlers
  const handleAddObjective = () => {
    if (!editingLesson) return;
    const current = editingLesson.contents[modalLang]?.learningObjectives || [];
    const updated = [
      ...current,
      modalLang === 'hi'
        ? `उद्देश्य ${current.length + 1}: नए अधिगम परिणाम दर्ज करें`
        : modalLang === 'mr'
        ? `उद्दिष्ट ${current.length + 1}: नवीन अध्ययन उद्दिष्ट नोंदवा`
        : `Objective ${current.length + 1}: Enter core learning objective`,
    ];
    setEditingLesson({
      ...editingLesson,
      contents: {
        ...editingLesson.contents,
        [modalLang]: {
          ...editingLesson.contents[modalLang],
          learningObjectives: updated,
        },
      },
    });
  };

  const handleUpdateObjective = (idx: number, val: string) => {
    if (!editingLesson) return;
    const current = [...(editingLesson.contents[modalLang]?.learningObjectives || [])];
    current[idx] = val;
    setEditingLesson({
      ...editingLesson,
      contents: {
        ...editingLesson.contents,
        [modalLang]: {
          ...editingLesson.contents[modalLang],
          learningObjectives: current,
        },
      },
    });
  };

  const handleRemoveObjective = (idx: number) => {
    if (!editingLesson) return;
    const current = (editingLesson.contents[modalLang]?.learningObjectives || []).filter((_, i) => i !== idx);
    setEditingLesson({
      ...editingLesson,
      contents: {
        ...editingLesson.contents,
        [modalLang]: {
          ...editingLesson.contents[modalLang],
          learningObjectives: current,
        },
      },
    });
  };

  // Helper: Key Takeaway handlers
  const handleAddTakeaway = () => {
    if (!editingLesson) return;
    const current = editingLesson.contents[modalLang]?.keyTakeaways || [];
    const updated = [
      ...current,
      modalLang === 'hi'
        ? `मुख्य बिंदु ${current.length + 1}: मुख्य निष्कर्ष दर्ज करें`
        : modalLang === 'mr'
        ? `महत्त्वाचा मुद्दा ${current.length + 1}: महत्त्वाचा निष्कर्ष नोंदवा`
        : `Takeaway ${current.length + 1}: Enter key operational takeaway`,
    ];
    setEditingLesson({
      ...editingLesson,
      contents: {
        ...editingLesson.contents,
        [modalLang]: {
          ...editingLesson.contents[modalLang],
          keyTakeaways: updated,
        },
      },
    });
  };

  const handleUpdateTakeaway = (idx: number, val: string) => {
    if (!editingLesson) return;
    const current = [...(editingLesson.contents[modalLang]?.keyTakeaways || [])];
    current[idx] = val;
    setEditingLesson({
      ...editingLesson,
      contents: {
        ...editingLesson.contents,
        [modalLang]: {
          ...editingLesson.contents[modalLang],
          keyTakeaways: current,
        },
      },
    });
  };

  const handleRemoveTakeaway = (idx: number) => {
    if (!editingLesson) return;
    const current = (editingLesson.contents[modalLang]?.keyTakeaways || []).filter((_, i) => i !== idx);
    setEditingLesson({
      ...editingLesson,
      contents: {
        ...editingLesson.contents,
        [modalLang]: {
          ...editingLesson.contents[modalLang],
          keyTakeaways: current,
        },
      },
    });
  };

  // Helper: Attachment handlers
  const handleAddAttachment = () => {
    if (!editingLesson || !newAttachmentName.trim()) return;
    const newAtt: LessonAttachment = {
      id: `att-${Date.now()}`,
      name: newAttachmentName.trim(),
      type: newAttachmentType,
      url: newAttachmentUrl.trim() || undefined,
      size: newAttachmentType === 'link' ? undefined : '2.1 MB',
    };
    setEditingLesson({
      ...editingLesson,
      attachments: [...(editingLesson.attachments || []), newAtt],
    });
    setNewAttachmentName('');
    setNewAttachmentUrl('');
    showToast('Resource attachment added.');
  };

  const handleRemoveAttachment = (attId: string) => {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      attachments: (editingLesson.attachments || []).filter(a => a.id !== attId),
    });
  };

  // Create new course form submit (Database Persistent)
  const handleSaveNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const created = await api.curriculum.createCourse({
        title: newTitleEn,
        titleHi: newTitleHi || newTitleEn,
        titleMr: newTitleMr || newTitleEn,
        description: newDescEn,
        descriptionHi: newDescEn,
        descriptionMr: newDescEn,
        thumbnail: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80',
        instituteId: currentUser.instituteId || 'inst-vamnicom',
        durationHours: 36,
        level: 'Intermediate',
        category: newCategory,
      });

      addNewCourse(created);
      setSelectedCourseId(created.id);
      setIsNewCourseModalOpen(false);
      showToast(`Course "${created.title}" created successfully in database!`);
    } catch (err: any) {
      console.error('Failed to create course:', err);
      showToast(`Unable to create course: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCourse = workingCourse || originalCourse;

  if (!activeCourse) {
    return (
      <PageContainer>
        <div className="p-8 text-center bg-white rounded-2xl border border-govText-border">
          <p className="text-govText-secondary">No courses found to build. Please author a course first.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-5 animate-fadeIn pb-24 sm:pb-28 lg:pb-12">

        {/* 1. Page Header */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-bold text-govTeal-700 uppercase tracking-wider px-2 py-0.5 rounded bg-govTeal-50 border border-govTeal-200">
                LMS Curriculum Studio
              </span>
              <SimulatedBadge text="Multilingual Course Authoring" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1.5">
              Course, Module & Quiz Builder
            </h1>
            <p className="text-xs text-govText-secondary mt-1 max-w-2xl leading-relaxed">
              Author national curriculum modules in English, Hindi, and Marathi with auto-grading assessments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/faculty/courses/new')}
            className="w-full md:w-auto px-4 sm:px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 min-h-[44px] shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Course</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between gap-2 animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{toastNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Active Course Selector Card */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-govText-border shadow-xs flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <span className="text-xs font-bold text-govText-secondary shrink-0 select-none">
            Select Active Course:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-0.5">
            {courses.map(c => {
              const isActive = selectedCourseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (window.confirm('You have unsaved changes on the current course. Discard and switch?')) {
                        setSelectedCourseId(c.id);
                      }
                    } else {
                      setSelectedCourseId(c.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] shrink-0 transition-all cursor-pointer inline-flex items-center justify-center leading-none ${
                    isActive
                      ? 'bg-[#0B6E4F] text-white font-bold shadow-xs'
                      : 'bg-[#F6F8F6] hover:bg-[#EDF2ED] text-govText-secondary hover:text-govText'
                  }`}
                >
                  {c.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Main Course Studio Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-govText-border shadow-xs space-y-6">

          {/* Course Summary Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider">
                  {activeCourse.category.toUpperCase()} • {activeCourse.durationHours} HOURS
                </span>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1.5">
                {activeCourse.title}
              </h2>
              <p className="text-xs text-govText-secondary mt-1 font-devanagari">
                Hindi: <span className="font-normal text-govText">{activeCourse.titleHi}</span>
                <span className="mx-2 text-gray-300">|</span>
                Marathi: <span className="font-normal text-govText">{activeCourse.titleMr}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveCourse}
                disabled={!hasUnsavedChanges || isSaving}
                className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                  hasUnsavedChanges && !isSaving
                    ? 'bg-[#0B6E4F] hover:bg-[#085A40] text-white shadow-xs cursor-pointer active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Course Updates'}</span>
              </button>
            </div>
          </div>

          {/* Module Count & Expand All Toggle + Display Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-govText-secondary pt-1 border-b border-gray-200/80 pb-3">
            <span className="font-semibold text-govText-primary">
              Course Curriculum Structure ({activeCourse.modules.length} Modules,{' '}
              {activeCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons)
            </span>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Curriculum View Language Switcher */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-govText-border shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-[#0B6E4F]" />
                <span className="text-[11px] font-bold text-govText-secondary">Curriculum Language:</span>
                <div className="flex items-center gap-1">
                  {(['en', 'hi', 'mr'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCurriculumLang(lang)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        curriculumLang === lang
                          ? 'bg-[#0B6E4F] text-white'
                          : 'text-govText-secondary hover:text-govText-primary hover:bg-gray-100'
                      }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOpen: Record<string, boolean> = {};
                    activeCourse.modules.forEach(m => (allOpen[m.id] = true));
                    setExpandedModuleIds(allOpen);
                  }}
                  className="text-govTeal-700 hover:underline font-semibold cursor-pointer"
                >
                  Expand All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setExpandedModuleIds({})}
                  className="text-govTeal-700 hover:underline font-semibold cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* Loading Curriculum State */}
          {isLoadingCurriculum && (
            <div className="flex items-center justify-center py-8 gap-3 text-govText-muted bg-emerald-50/60 rounded-2xl border border-emerald-200 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-[#0B6E4F]" />
              <span className="text-xs font-bold text-emerald-900">Loading curriculum from database...</span>
            </div>
          )}

          {/* 4, 5, 6. Modules & Lessons List */}
          <div className="space-y-4">
            {activeCourse.modules.map((mod, mIdx) => {
              const isExpanded = expandedModuleIds[mod.id] !== false;

              return (
                <div
                  key={mod.id}
                  className="border border-[#A7F3D0]/80 rounded-2xl overflow-hidden shadow-2xs transition-all bg-white"
                >
                  {/* Module Header */}
                  <div
                    className="bg-[#F0FDF4] p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D1FAE5] select-none cursor-pointer"
                    onClick={() => toggleModuleExpand(mod.id)}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Drag / Reorder Controls */}
                      <div
                        className="flex items-center gap-0.5 text-[#047857] hover:text-[#065F46] shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={mIdx === 0}
                          onClick={() => moveModule(mIdx, 'up')}
                          title="Move module up"
                          className="p-1 hover:bg-[#D1FAE5] rounded disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={mIdx === activeCourse.modules.length - 1}
                          onClick={() => moveModule(mIdx, 'down')}
                          title="Move module down"
                          className="p-1 hover:bg-[#D1FAE5] rounded disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-[#065F46] shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-[#065F46] truncate">
                          {mod.title}
                        </h3>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between sm:justify-end gap-3 shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="text-xs text-[#047857] font-semibold font-devanagari max-w-[200px] sm:max-w-[260px] truncate text-right">
                        {mod.titleHi}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingModule({ index: mIdx, module: { ...mod } })}
                          title="Edit Module Title & Details"
                          className="p-1.5 text-[#047857] hover:text-[#065F46] hover:bg-[#D1FAE5] rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'module',
                              moduleIndex: mIdx,
                              title: mod.title,
                            })
                          }
                          title="Delete Module"
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleModuleExpand(mod.id)}
                          aria-label={isExpanded ? 'Collapse Module' : 'Expand Module'}
                          className="p-1.5 text-[#047857] hover:text-[#065F46] hover:bg-[#D1FAE5] rounded-lg transition-colors cursor-pointer ml-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Module Content (Expanded) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 space-y-3 bg-white">
                      {/* Lessons List */}
                      {mod.lessons.map((les, lIdx) => (
                        <div
                          key={les.id}
                          className="p-3 sm:p-3.5 bg-[#F9FAF9] rounded-xl border border-gray-200/80 hover:border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors group"
                        >
                          {/* Left: Drag / Move Controls + Lesson Icon & Titles */}
                          <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                            <div className="flex sm:flex-col items-center gap-0.5 text-gray-400 shrink-0 mt-0.5 sm:mt-0">
                              <button
                                type="button"
                                disabled={lIdx === 0}
                                onClick={() => moveLesson(mIdx, lIdx, 'up')}
                                title="Move lesson up"
                                className="p-0.5 hover:text-govText disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={lIdx === mod.lessons.length - 1}
                                onClick={() => moveLesson(mIdx, lIdx, 'down')}
                                title="Move lesson down"
                                className="p-0.5 hover:text-govText disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="w-6 h-6 rounded-md bg-govTeal-50 text-[#0B6E4F] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              {(() => {
                                let displayTitle = les.title || '';
                                if (curriculumLang === 'hi' && les.titleHi?.trim()) {
                                  displayTitle = les.titleHi;
                                } else if (curriculumLang === 'mr' && les.titleMr?.trim()) {
                                  displayTitle = les.titleMr;
                                } else {
                                  // English view: clean any accidental Devanagari in parentheses
                                  if (displayTitle.includes('(') && /[\u0900-\u097F]/.test(displayTitle)) {
                                    displayTitle = displayTitle.replace(/\s*\([\u0900-\u097F\s\d\.\-—:]+\)\s*$/, '').trim();
                                  }
                                }

                                return (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-bold text-govText-primary ${curriculumLang !== 'en' ? 'font-devanagari' : ''}`}>
                                      {displayTitle}
                                    </span>
                                    {/* Format Badge */}
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-govText-secondary border border-gray-200">
                                      {les.contentType === 'video'
                                        ? '🎥 Video'
                                        : les.contentType === 'pdf'
                                        ? '📄 PDF'
                                        : les.contentType === 'presentation'
                                        ? '📊 Presentation'
                                        : les.contentType === 'resource'
                                        ? '🔗 Link'
                                        : les.contentType === 'interactive'
                                        ? '⚡ Simulation'
                                        : '📖 Theory'}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Right: Duration + Trilingual Verified Badge + Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-8 sm:pl-0">
                            <div className="flex items-center gap-1.5 text-govText-muted font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{les.durationMinutes} mins</span>
                            </div>

                            {isTrilingualVerified(les) ? (
                              <span className="px-2.5 py-1 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-md font-bold text-[10px] sm:text-[11px] inline-flex items-center gap-1 shrink-0">
                                <Check className="w-3 h-3 text-[#059669]" />
                                Trilingual Verified
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 shrink-0">
                                Translation Pending
                              </span>
                            )}

                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEditLesson(mIdx, lIdx, les)}
                                title="Edit Lesson"
                                className="p-1 text-govText-secondary hover:text-govTeal-700 hover:bg-white rounded cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'lesson',
                                    moduleIndex: mIdx,
                                    lessonIndex: lIdx,
                                    title: les.title,
                                  })
                                }
                                title="Delete Lesson"
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 5. Assessment Row (Light-Orange Distinct Styling) */}
                      {mod.quiz ? (
                        <div
                          onClick={() => handleOpenAssessmentEditor(mIdx)}
                          className="p-3.5 sm:p-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#78350F] hover:bg-[#FEF3C7]/70 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[#78350F]">
                                  ○ {mod.quiz.title}
                                </span>
                                <span className="text-[#92400E] font-medium">
                                  ({mod.quiz.questions.length} MCQ Questions)
                                </span>
                              </div>
                              {mod.quiz.titleHi && (
                                <p className="text-[11px] text-[#92400E] font-devanagari mt-0.5">
                                  {mod.quiz.titleHi}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="font-mono font-bold text-[#92400E] bg-white px-2.5 py-1 rounded-md border border-[#FCD34D] shadow-2xs">
                              Pass Threshold: {mod.quiz.passThreshold}%
                            </span>

                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(mod.quiz!)}
                                title="Preview Assessment"
                                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-[#92400E] border border-[#FCD34D] rounded-md font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAssessmentEditor(mIdx)}
                                title="Edit Assessment Questions"
                                className="p-1 text-[#92400E] hover:text-[#78350F] hover:bg-white rounded cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'quiz',
                                    moduleIndex: mIdx,
                                    title: mod.quiz!.title,
                                  })
                                }
                                title="Delete Assessment"
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-dashed border-amber-200 flex items-center justify-between text-xs">
                          <span className="text-amber-800 font-medium">
                            No assessment configured for this module.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAssessmentEditor(mIdx)}
                            className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Assessment</span>
                          </button>
                        </div>
                      )}

                      {/* Add Lesson Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddLesson(mIdx)}
                        className="w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-[#0B6E4F] hover:bg-[#0B6E4F]/5 text-govText-secondary hover:text-[#0B6E4F] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Lesson</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Module Button */}
          <button
            type="button"
            onClick={handleAddModule}
            className="w-full py-3.5 border-2 border-dashed border-[#0B6E4F]/40 hover:border-[#0B6E4F] hover:bg-[#0B6E4F]/5 text-[#0B6E4F] rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Curriculum Module</span>
          </button>
        </div>

        {/* ---------------- MODALS & EDITORS ---------------- */}

        {/* 1. Module Editor Modal */}
        <GlobalModal
          isOpen={Boolean(editingModule)}
          onClose={() => setEditingModule(null)}
          maxWidth="max-w-lg"
          ariaLabel="Edit Module Details"
        >
          {editingModule && (
            <div className="w-full">
              <div className="bg-[#0B6E4F] text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Edit Module Details</h3>
                  <p className="text-xs text-emerald-100">National standard curriculum titles in English, Hindi & Marathi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModuleEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    English Module Title *
                  </label>
                  <input
                    type="text"
                    value={editingModule.module.title}
                    onChange={e =>
                      setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, title: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Hindi Module Title (हिन्दी) *
                  </label>
                  <input
                    type="text"
                    value={editingModule.module.titleHi}
                    onChange={e =>
                      setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, titleHi: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-devanagari rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Marathi Module Title (मराठी) *
                  </label>
                  <input
                    type="text"
                    value={editingModule.module.titleMr || ''}
                    onChange={e =>
                      setEditingModule({
                        ...editingModule,
                        module: { ...editingModule.module, titleMr: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs font-devanagari rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingModule(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-[#0B6E4F] hover:bg-[#085A40] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </GlobalModal>

        {/* 2. Lesson Editor Modal (Full LMS Multilingual Authoring System) */}
        <GlobalModal
          isOpen={Boolean(editingLesson)}
          onClose={() => setEditingLesson(null)}
          maxWidth="max-w-3xl"
          ariaLabel="Lesson Editor"
        >
          {editingLesson && (
            <div className="w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-[#0B6E4F] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">
                      {editingLesson.isNew ? 'Add New Lesson' : 'Edit Lesson'}
                    </h3>
                    <p className="text-xs text-emerald-100">
                      National Cooperative Curriculum LMS Studio • Trilingual Authoring
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Selector Bar */}
              <div className="bg-[#F8FAF9] border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-govText-secondary">
                  <Globe className="w-4 h-4 text-[#0B6E4F]" />
                  <span>Language View:</span>
                  <span className="text-[11px] font-normal text-govText-muted">
                    (Editing strictly in selected language)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                  {(['en', 'hi', 'mr'] as const).map(lang => {
                    const status = getLanguageStatus(editingLesson, lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setModalLang(lang)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          modalLang === lang
                            ? 'bg-[#0B6E4F] text-white shadow-2xs'
                            : 'text-govText-secondary hover:text-govText-primary hover:bg-gray-100'
                        }`}
                      >
                        <span>{lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === 'complete'
                              ? modalLang === lang
                                ? 'bg-emerald-200'
                                : 'bg-emerald-500'
                              : status === 'partial'
                              ? 'bg-amber-400'
                              : 'bg-gray-300'
                          }`}
                          title={`Status: ${status}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveLessonEdit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* 1. Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-sm text-govText-primary flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B6E4F] flex items-center justify-center text-[10px]">
                        1
                      </span>
                      Basic Information
                    </span>
                    <span className="text-[11px] font-medium text-govText-muted">
                      Active: {modalLang === 'en' ? 'English' : modalLang === 'hi' ? 'हिन्दी' : 'मराठी'}
                    </span>
                  </div>

                  {/* Lesson Title (Strictly Isolated to modalLang) */}
                  <div>
                    <label className="block text-xs font-semibold text-govText-secondary mb-1">
                      Lesson Title ({modalLang === 'en' ? 'English' : modalLang === 'hi' ? 'हिन्दी' : 'मराठी'}) *
                    </label>
                    <input
                      type="text"
                      value={editingLesson.titles[modalLang]}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingLesson({
                          ...editingLesson,
                          titles: {
                            ...editingLesson.titles,
                            [modalLang]: val,
                          },
                        });
                      }}
                      placeholder={
                        modalLang === 'en'
                          ? 'e.g., 1.2 Daily Cash & Ledger Book Entry Workflow'
                          : modalLang === 'hi'
                          ? 'उदा. १.२ दैनिक रोकड़ बही एवं खाता प्रविष्टि कार्यप्रणाली'
                          : 'उदा. १.२ दैनिक रोख वही आणि खाते नोंद प्रक्रिया'
                      }
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                        modalLang !== 'en' ? 'font-devanagari' : ''
                      }`}
                      required
                    />
                  </div>

                  {/* Duration & Content Format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-govText-secondary mb-1">
                        Duration (Minutes) *
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={editingLesson.durationMinutes}
                        onChange={e =>
                          setEditingLesson({
                            ...editingLesson,
                            durationMinutes: parseInt(e.target.value) || 20,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-govText-secondary mb-1">
                        Content Format *
                      </label>
                      <select
                        value={editingLesson.contentType}
                        onChange={e =>
                          setEditingLesson({
                            ...editingLesson,
                            contentType: e.target.value as any,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                      >
                        <option value="text">Interactive Reading / Theory</option>
                        <option value="video">Video Lesson</option>
                        <option value="pdf">PDF / Document</option>
                        <option value="presentation">Presentation</option>
                        <option value="resource">External Resource / Link</option>
                        <option value="interactive">Simulation Exercise</option>
                      </select>
                    </div>
                  </div>

                  {/* Short Overview (Strictly Isolated to modalLang) */}
                  <div>
                    <label className="block text-xs font-semibold text-govText-secondary mb-1">
                      Short Overview ({modalLang.toUpperCase()})
                    </label>
                    <textarea
                      rows={2}
                      value={editingLesson.contents[modalLang]?.overview || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingLesson({
                          ...editingLesson,
                          contents: {
                            ...editingLesson.contents,
                            [modalLang]: {
                              ...editingLesson.contents[modalLang],
                              overview: val,
                            },
                          },
                        });
                      }}
                      placeholder={
                        modalLang === 'en'
                          ? 'Provide a concise overview of the core concepts covered in this lesson...'
                          : modalLang === 'hi'
                          ? 'इस पाठ में शामिल मुख्य अवधारणाओं का संक्षिप्त विवरण दर्ज करें...'
                          : 'या धड्यात समाविष्ट असलेल्या मुख्य घटकांचा थोडक्यात आढावा नोंदवा...'
                      }
                      className={`w-full p-3 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                        modalLang !== 'en' ? 'font-devanagari' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* 2. DYNAMIC CONTENT SECTION BASED ON CONTENT FORMAT */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-sm text-govText-primary flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B6E4F] flex items-center justify-center text-[10px]">
                        2
                      </span>
                      Lesson Content: {
                        editingLesson.contentType === 'video'
                          ? 'Video Configuration & Transcript'
                          : editingLesson.contentType === 'pdf'
                          ? 'PDF Document File & Details'
                          : editingLesson.contentType === 'presentation'
                          ? 'Presentation Slides & Overview'
                          : editingLesson.contentType === 'resource'
                          ? 'External Web Resource Link'
                          : 'Rich Text / Theory Curriculum'
                      }
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                      Format: {editingLesson.contentType.toUpperCase()}
                    </span>
                  </div>

                  {/* FORMAT 1: Interactive Reading / Theory */}
                  {(editingLesson.contentType === 'text' || editingLesson.contentType === 'interactive') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-govText-secondary">
                          Rich Text Lesson Content ({modalLang.toUpperCase()})
                        </label>
                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => insertFormat('**', '**')}
                            title="Bold"
                            className="p-1 hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat('*', '*')}
                            title="Italic"
                            className="p-1 hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat('### ')}
                            title="Heading"
                            className="p-1 hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                          >
                            <Heading2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat('- ')}
                            title="Bullet List"
                            className="p-1 hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat('1. ')}
                            title="Numbered List"
                            className="p-1 hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat('> ')}
                            title="Quote"
                            className="p-1 hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                          >
                            <Quote className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormat('[', '](https://example.com)')}
                            title="Link"
                            className="p-1 hover:bg-gray-200 rounded text-govText-secondary cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={8}
                        value={editingLesson.contents[modalLang]?.richContent || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setEditingLesson({
                            ...editingLesson,
                            contents: {
                              ...editingLesson.contents,
                              [modalLang]: {
                                ...editingLesson.contents[modalLang],
                                richContent: val,
                              },
                            },
                          });
                        }}
                        placeholder={
                          modalLang === 'en'
                            ? 'Enter structured lesson theory, regulatory bylaws, and standard operating procedures...'
                            : modalLang === 'hi'
                            ? 'यहाँ पाठ का संरचित सैद्धांतिक विवरण, विनियामक उप-नियम एवं मानक प्रक्रियाएं दर्ज करें...'
                            : 'येथे धड्याची सविस्तर सैद्धांतिक माहिती, नियमावली आणि कार्यपद्धती नोंदवा...'
                        }
                        className={`w-full p-3 text-xs font-mono rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                          modalLang !== 'en' ? 'font-devanagari' : ''
                        }`}
                      />
                      <p className="text-[11px] text-govText-muted flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#0B6E4F]" />
                        <span>Supports markdown formatting: bold, italic, headings, bullet points, quotes, and links.</span>
                      </p>
                    </div>
                  )}

                  {/* FORMAT 2: Video Lesson */}
                  {editingLesson.contentType === 'video' && (
                    <div className="space-y-3.5 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-govText-secondary mb-1">
                            Video Lecture Title
                          </label>
                          <input
                            type="text"
                            value={editingLesson.titles[modalLang]}
                            onChange={e =>
                              setEditingLesson({
                                ...editingLesson,
                                titles: { ...editingLesson.titles, [modalLang]: e.target.value },
                              })
                            }
                            placeholder="e.g., PACS ERP Video Demonstration"
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-govText-secondary mb-1">
                            Video URL (YouTube, Vimeo, or MP4)
                          </label>
                          <input
                            type="url"
                            value={editingLesson.videoUrl}
                            onChange={e =>
                              setEditingLesson({
                                ...editingLesson,
                                videoUrl: e.target.value,
                              })
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-govText-secondary mb-1">
                            Or Upload MP4 Video
                          </label>
                          <label className="w-full px-3.5 py-2 bg-white border border-gray-200 hover:border-[#0B6E4F] rounded-xl text-xs font-bold text-govText-secondary hover:text-[#0B6E4F] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Browse MP4 File</span>
                            <input
                              type="file"
                              accept="video/mp4,video/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setEditingLesson({
                                    ...editingLesson,
                                    videoUrl: `https://lms-cdn.cooperation.gov.in/videos/${file.name}`,
                                  });
                                  showToast(`Selected video: ${file.name}`);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Small Video Preview */}
                      {editingLesson.videoUrl && (
                        <div className="bg-black/90 rounded-xl overflow-hidden p-3 border border-gray-800 text-white flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Play className="w-5 h-5 fill-current" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate">Video Preview</span>
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] uppercase tracking-wider font-bold">
                                {editingLesson.videoUrl.includes('youtube') || editingLesson.videoUrl.includes('youtu.be')
                                  ? 'YouTube'
                                  : editingLesson.videoUrl.includes('vimeo')
                                  ? 'Vimeo'
                                  : 'MP4 Stream'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 truncate font-mono mt-0.5">
                              {editingLesson.videoUrl}
                            </p>
                          </div>
                          <a
                            href={editingLesson.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </a>
                        </div>
                      )}

                      {/* Video Transcript in selected language */}
                      <div>
                        <label className="block text-xs font-semibold text-govText-secondary mb-1">
                          Synchronized Video Transcript ({modalLang.toUpperCase()})
                        </label>
                        <textarea
                          rows={3}
                          value={editingLesson.contents[modalLang]?.transcript || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setEditingLesson({
                              ...editingLesson,
                              contents: {
                                ...editingLesson.contents,
                                [modalLang]: {
                                  ...editingLesson.contents[modalLang],
                                  transcript: val,
                                },
                              },
                            });
                          }}
                          placeholder="Provide the audio lecture transcript for accessibility and multingual subtitling..."
                          className={`w-full p-2.5 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                            modalLang !== 'en' ? 'font-devanagari' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* FORMAT 3: PDF / Document */}
                  {editingLesson.contentType === 'pdf' && (
                    <div className="space-y-3.5 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-xs font-semibold text-govText-secondary mb-1">
                          Document Title
                        </label>
                        <input
                          type="text"
                          value={editingLesson.titles[modalLang]}
                          onChange={e =>
                            setEditingLesson({
                              ...editingLesson,
                              titles: { ...editingLesson.titles, [modalLang]: e.target.value },
                            })
                          }
                          placeholder="e.g., National PACS ERP Standard Operating Manual.pdf"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                        />
                      </div>

                      {/* Upload Document Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-govText-primary truncate block">
                              📄 {editingLesson.documentName || 'PACS_ERP_Training_Guide.pdf'}
                            </span>
                            <span className="text-[11px] text-govText-muted">
                              File Size: 2.4 MB • Format: Official PDF Document
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-govText-primary rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setEditingLesson({
                                    ...editingLesson,
                                    documentName: file.name,
                                    documentUrl: `https://lms-cdn.cooperation.gov.in/docs/${file.name}`,
                                  });
                                  showToast(`Uploaded PDF: ${file.name}`);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingLesson({
                                ...editingLesson,
                                documentName: '',
                                documentUrl: '',
                              })
                            }
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-govText-secondary mb-1">
                          Optional External Document URL
                        </label>
                        <input
                          type="url"
                          value={editingLesson.documentUrl}
                          onChange={e =>
                            setEditingLesson({
                              ...editingLesson,
                              documentUrl: e.target.value,
                            })
                          }
                          placeholder="https://cooperation.gov.in/circulars/pacs-erp.pdf"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                        />
                      </div>
                    </div>
                  )}

                  {/* FORMAT 4: Presentation */}
                  {editingLesson.contentType === 'presentation' && (
                    <div className="space-y-3.5 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-xs font-semibold text-govText-secondary mb-1">
                          Presentation Title
                        </label>
                        <input
                          type="text"
                          value={editingLesson.titles[modalLang]}
                          onChange={e =>
                            setEditingLesson({
                              ...editingLesson,
                              titles: { ...editingLesson.titles, [modalLang]: e.target.value },
                            })
                          }
                          placeholder="e.g., National PACS Architecture Slides"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                        />
                      </div>

                      {/* Presentation Upload Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Presentation className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-govText-primary truncate block">
                              📊 {editingLesson.presentationName || 'National_PACS_Architecture_Slides.pptx'}
                            </span>
                            <span className="text-[11px] text-govText-muted">
                              File Size: 5.1 MB • Type: Microsoft PowerPoint (PPTX)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-govText-primary rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept=".ppt,.pptx,.pdf"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setEditingLesson({
                                    ...editingLesson,
                                    presentationName: file.name,
                                    presentationUrl: `https://lms-cdn.cooperation.gov.in/slides/${file.name}`,
                                  });
                                  showToast(`Uploaded slides: ${file.name}`);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingLesson({
                                ...editingLesson,
                                presentationName: '',
                                presentationUrl: '',
                              })
                            }
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORMAT 5: External Resource / Link */}
                  {editingLesson.contentType === 'resource' && (
                    <div className="space-y-3.5 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-xs font-semibold text-govText-secondary mb-1">
                          Resource Title
                        </label>
                        <input
                          type="text"
                          value={editingLesson.titles[modalLang]}
                          onChange={e =>
                            setEditingLesson({
                              ...editingLesson,
                              titles: { ...editingLesson.titles, [modalLang]: e.target.value },
                            })
                          }
                          placeholder="e.g., Ministry of Cooperation PACS Digital Portal"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-govText-secondary mb-1">
                          Resource URL * (Must start with http:// or https://)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={editingLesson.externalUrl}
                            onChange={e =>
                              setEditingLesson({
                                ...editingLesson,
                                externalUrl: e.target.value,
                              })
                            }
                            placeholder="https://cooperation.gov.in"
                            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                            required
                          />
                          {editingLesson.externalUrl && (
                            <a
                              href={editingLesson.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-white hover:bg-gray-100 text-govText-primary border border-gray-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#0B6E4F]" />
                              <span>Test Link</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. LEARNING OBJECTIVES & KEY TAKEAWAYS (Multilingual Isolated) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-sm text-govText-primary flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B6E4F] flex items-center justify-center text-[10px]">
                        3
                      </span>
                      Pedagogical Outcomes ({modalLang.toUpperCase()})
                    </span>
                    <span className="text-[11px] text-govText-muted">
                      Specific to {modalLang === 'en' ? 'English' : modalLang === 'hi' ? 'हिन्दी' : 'मराठी'}
                    </span>
                  </div>

                  {/* Learning Objectives List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-govText-secondary">
                        Learning Objectives ({modalLang.toUpperCase()})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddObjective}
                        className="text-[11px] font-bold text-[#0B6E4F] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Objective</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingLesson.contents[modalLang]?.learningObjectives || []).map((obj, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {oIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={obj}
                            onChange={e => handleUpdateObjective(oIdx, e.target.value)}
                            className={`flex-1 px-3 py-2 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                              modalLang !== 'en' ? 'font-devanagari' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveObjective(oIdx)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Takeaways List */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-govText-secondary">
                        Key Takeaways ({modalLang.toUpperCase()})
                      </label>
                      <button
                        type="button"
                        onClick={handleAddTakeaway}
                        className="text-[11px] font-bold text-[#0B6E4F] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Takeaway</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingLesson.contents[modalLang]?.keyTakeaways || []).map((tak, tIdx) => (
                        <div key={tIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            ✓
                          </span>
                          <input
                            type="text"
                            value={tak}
                            onChange={e => handleUpdateTakeaway(tIdx, e.target.value)}
                            className={`flex-1 px-3 py-2 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                              modalLang !== 'en' ? 'font-devanagari' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTakeaway(tIdx)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. OPTIONAL RESOURCES & ATTACHMENTS */}
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div>
                      <span className="font-bold text-sm text-govText-primary flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B6E4F] flex items-center justify-center text-[10px]">
                          4
                        </span>
                        Resources & Attachments
                        <span className="text-[11px] font-normal text-govText-muted">(Optional)</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-govText-muted">Supporting reference materials</span>
                  </div>

                  {/* Existing Attachments Cards */}
                  <div className="space-y-2">
                    {(editingLesson.attachments || []).map(att => (
                      <div
                        key={att.id}
                        className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0B6E4F] flex items-center justify-center shrink-0">
                            {att.type === 'link' ? (
                              <Link2 className="w-4 h-4" />
                            ) : att.type === 'ppt' ? (
                              <Presentation className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-govText-primary truncate block">
                              {att.name}
                            </span>
                            <span className="text-[11px] text-govText-muted font-mono">
                              {att.type === 'link' ? 'External Web Link' : att.size || '1.8 MB'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {att.url ? (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-govText-primary rounded-md text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{att.type === 'link' ? 'Open' : 'Preview'}</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => showToast(`Previewing ${att.name}`)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-govText-primary rounded-md text-[11px] font-bold"
                            >
                              Preview
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Attachment Form */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                    <span className="font-bold text-[11px] text-govText-secondary block">
                      + Attach New File or External Link
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Resource title / filename"
                        value={newAttachmentName}
                        onChange={e => setNewAttachmentName(e.target.value)}
                        className="sm:col-span-2 px-3 py-1.5 text-xs rounded-lg border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                      />
                      <select
                        value={newAttachmentType}
                        onChange={e => setNewAttachmentType(e.target.value as any)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="doc">Word DOC/DOCX</option>
                        <option value="ppt">PowerPoint Slides</option>
                        <option value="image">Image Asset</option>
                        <option value="link">External Web Link</option>
                      </select>
                    </div>

                    {newAttachmentType === 'link' && (
                      <input
                        type="url"
                        placeholder="https://example.com/guideline"
                        value={newAttachmentUrl}
                        onChange={e => setNewAttachmentUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                      />
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddAttachment}
                        disabled={!newAttachmentName.trim()}
                        className="px-3 py-1.5 bg-[#0B6E4F] hover:bg-[#085A40] disabled:opacity-40 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Attach Resource</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. LANGUAGE STATUS BAR */}
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-govText-secondary">Language Completion:</span>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      {/* English Status */}
                      {(() => {
                        const s = getLanguageStatus(editingLesson, 'en');
                        return (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              s === 'complete' ? 'text-emerald-700' : s === 'partial' ? 'text-amber-600' : 'text-gray-400'
                            }`}
                          >
                            {s === 'complete' ? '✓' : s === 'partial' ? '⚠' : '○'} English
                          </span>
                        );
                      })()}

                      {/* Hindi Status */}
                      {(() => {
                        const s = getLanguageStatus(editingLesson, 'hi');
                        return (
                          <span
                            className={`inline-flex items-center gap-1 font-devanagari ${
                              s === 'complete' ? 'text-emerald-700' : s === 'partial' ? 'text-amber-600' : 'text-gray-400'
                            }`}
                          >
                            {s === 'complete' ? '✓' : s === 'partial' ? '⚠' : '○'} हिन्दी
                          </span>
                        );
                      })()}

                      {/* Marathi Status */}
                      {(() => {
                        const s = getLanguageStatus(editingLesson, 'mr');
                        return (
                          <span
                            className={`inline-flex items-center gap-1 font-devanagari ${
                              s === 'complete' ? 'text-emerald-700' : s === 'partial' ? 'text-amber-600' : 'text-gray-400'
                            }`}
                          >
                            {s === 'complete' ? '✓' : s === 'partial' ? '⚠' : '○'} मराठी
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    {getLanguageStatus(editingLesson, 'en') === 'complete' &&
                    getLanguageStatus(editingLesson, 'hi') === 'complete' &&
                    getLanguageStatus(editingLesson, 'mr') === 'complete' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-bold text-[11px] inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Trilingual Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-md font-bold text-[11px] inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Translation Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditingLesson(null)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Saving Lesson...' : 'Save Lesson'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </GlobalModal>

        {/* 3. Assessment / Quiz Editor Modal */}
        <GlobalModal
          isOpen={Boolean(editingQuiz)}
          onClose={() => setEditingQuiz(null)}
          maxWidth="max-w-2xl"
          ariaLabel="Assessment & Quiz Editor"
        >
          {editingQuiz && (
            <div className="w-full max-h-[90vh] flex flex-col">
              <div className="bg-[#EA580C] text-white p-5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    <span>Assessment & Quiz Editor</span>
                  </h3>
                  <p className="text-xs text-amber-100">
                    Configure auto-grading questions, pass threshold, and multilingual prompts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Assessment Meta Bar */}
              <div className="bg-amber-50/70 border-b border-amber-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#78350F]">Pass Threshold:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={editingQuiz.quiz.passThreshold}
                      onChange={e =>
                        setEditingQuiz({
                          ...editingQuiz,
                          quiz: {
                            ...editingQuiz.quiz,
                            passThreshold: parseInt(e.target.value) || 75,
                          },
                        })
                      }
                      className="w-16 px-2 py-1 text-xs font-bold font-mono rounded-lg border border-amber-300 bg-white text-center"
                    />
                    <span className="text-xs font-bold text-[#78350F]">%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#78350F]">Language View:</span>
                  {(['en', 'hi', 'mr'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setModalLang(lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        modalLang === lang
                          ? 'bg-[#EA580C] text-white'
                          : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {lang === 'en' ? 'EN' : lang === 'hi' ? 'HI' : 'MR'}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSaveQuiz} className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Quiz Title */}
                <div>
                  <label className="block text-xs font-semibold text-govText-secondary mb-1">
                    Assessment Title ({modalLang.toUpperCase()}) *
                  </label>
                  <input
                    type="text"
                    value={
                      modalLang === 'en'
                        ? editingQuiz.quiz.title
                        : modalLang === 'hi'
                        ? editingQuiz.quiz.titleHi || ''
                        : editingQuiz.quiz.titleMr || ''
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (modalLang === 'en') {
                        setEditingQuiz({
                          ...editingQuiz,
                          quiz: { ...editingQuiz.quiz, title: val },
                        });
                      } else if (modalLang === 'hi') {
                        setEditingQuiz({
                          ...editingQuiz,
                          quiz: { ...editingQuiz.quiz, titleHi: val },
                        });
                      } else {
                        setEditingQuiz({
                          ...editingQuiz,
                          quiz: { ...editingQuiz.quiz, titleMr: val },
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-govText-border bg-govBg focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                    required
                  />
                </div>

                {/* Questions Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-govText-primary uppercase tracking-wider">
                      Assessment Questions ({editingQuiz.quiz.questions.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddQuestionToQuiz}
                      className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {editingQuiz.quiz.questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-govText-primary">
                            Question {qIdx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={qIdx === 0}
                            onClick={() => moveQuestion(qIdx, 'up')}
                            className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={qIdx === editingQuiz.quiz.questions.length - 1}
                            onClick={() => moveQuestion(qIdx, 'down')}
                            className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(qIdx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Prompt */}
                      <div>
                        <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                          Question Prompt ({modalLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={
                            modalLang === 'en'
                              ? q.question
                              : modalLang === 'hi'
                              ? q.questionHi || ''
                              : q.questionMr || ''
                          }
                          onChange={e => {
                            const val = e.target.value;
                            const newQs = [...editingQuiz.quiz.questions];
                            const currentQ = { ...newQs[qIdx] };
                            if (modalLang === 'en') {
                              currentQ.question = val;
                            } else if (modalLang === 'hi') {
                              currentQ.questionHi = val;
                            } else {
                              currentQ.questionMr = val;
                            }
                            newQs[qIdx] = currentQ;
                            setEditingQuiz({
                              ...editingQuiz,
                              quiz: { ...editingQuiz.quiz, questions: newQs },
                            });
                          }}
                          className={`w-full px-3 py-2 text-xs rounded-lg border border-govText-border bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] ${
                            modalLang !== 'en' ? 'font-devanagari' : ''
                          }`}
                          required
                        />
                      </div>

                      {/* Multiple Choice Options */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-govText-secondary">
                          Options & Correct Answer (Click radio button to mark correct option):
                        </label>
                        {(q.options[modalLang] || ['A', 'B', 'C', 'D']).map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctOptionIndex === oIdx}
                              onChange={() => {
                                const newQs = [...editingQuiz.quiz.questions];
                                newQs[qIdx] = {
                                  ...newQs[qIdx],
                                  correctOptionIndex: oIdx,
                                };
                                setEditingQuiz({
                                  ...editingQuiz,
                                  quiz: { ...editingQuiz.quiz, questions: newQs },
                                });
                              }}
                              className="w-4 h-4 text-[#EA580C] focus:ring-[#EA580C] cursor-pointer"
                            />
                            <span className="text-xs font-bold text-govText-secondary w-5">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const val = e.target.value;
                                const newQs = [...editingQuiz.quiz.questions];
                                const currentOpts = [...(newQs[qIdx].options[modalLang] || [])];
                                currentOpts[oIdx] = val;
                                newQs[qIdx] = {
                                  ...newQs[qIdx],
                                  options: {
                                    ...newQs[qIdx].options,
                                    [modalLang]: currentOpts,
                                  },
                                };
                                setEditingQuiz({
                                  ...editingQuiz,
                                  quiz: { ...editingQuiz.quiz, questions: newQs },
                                });
                              }}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] ${
                                modalLang !== 'en' ? 'font-devanagari' : ''
                              }`}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-[11px] font-semibold text-govText-secondary mb-1">
                          Explanation & Rationale ({modalLang.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation[modalLang] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            const newQs = [...editingQuiz.quiz.questions];
                            newQs[qIdx] = {
                              ...newQs[qIdx],
                              explanation: { ...newQs[qIdx].explanation, [modalLang]: val },
                            };
                            setEditingQuiz({
                              ...editingQuiz,
                              quiz: { ...editingQuiz.quiz, questions: newQs },
                            });
                          }}
                          className={`w-full p-2.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] ${
                            modalLang !== 'en' ? 'font-devanagari' : ''
                          }`}
                          placeholder="Provide explanation shown upon assessment completion..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingQuiz(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-govText-primary text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSaving ? 'Saving Assessment...' : 'Save Assessment'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </GlobalModal>

        {/* 4. Assessment Preview Modal */}
        <GlobalModal
          isOpen={Boolean(previewQuiz)}
          onClose={() => setPreviewQuiz(null)}
          maxWidth="max-w-xl"
          ariaLabel="Assessment Preview Mode"
        >
          {previewQuiz && (
            <div className="w-full max-h-[90vh] flex flex-col">
              <div className="bg-[#0B6E4F] text-white p-5 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-200" />
                    <h3 className="font-bold text-base">Assessment Preview Mode</h3>
                  </div>
                  <p className="text-xs text-emerald-100">
                    {previewQuiz.title} • Pass Threshold: {previewQuiz.passThreshold}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewQuiz(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {previewQuiz.questions.map((q, qIdx) => {
                  const selectedAns = previewAnswers[qIdx];
                  const isCorrect = selectedAns === q.correctOptionIndex;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border transition-all ${
                        previewSubmitted
                          ? isCorrect
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-rose-50/60 border-rose-300'
                          : 'bg-[#F9FAF9] border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <span className="font-bold text-govText-primary">
                          Question {qIdx + 1}. {q.question}
                        </span>
                        {previewSubmitted && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {q.options.en.map((opt, oIdx) => {
                          const isSelected = selectedAns === oIdx;
                          let optClass =
                            'p-2.5 rounded-lg border text-xs flex items-center gap-2 transition-all cursor-pointer';

                          if (!previewSubmitted) {
                            optClass += isSelected
                              ? ' bg-[#0B6E4F]/10 border-[#0B6E4F] text-[#0B6E4F] font-bold'
                              : ' bg-white border-gray-200 hover:bg-gray-50 text-govText';
                          } else {
                            if (oIdx === q.correctOptionIndex) {
                              optClass += ' bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            } else if (isSelected && !isCorrect) {
                              optClass += ' bg-red-50 border-red-400 text-red-800';
                            } else {
                              optClass += ' bg-white border-gray-200 text-gray-400';
                            }
                          }

                          return (
                            <div
                              key={oIdx}
                              onClick={() => {
                                if (!previewSubmitted) {
                                  setPreviewAnswers({ ...previewAnswers, [qIdx]: oIdx });
                                }
                              }}
                              className={optClass}
                            >
                              <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {previewSubmitted && oIdx === q.correctOptionIndex && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {previewSubmitted && (
                        <div
                          className={`p-3 rounded-lg text-xs mt-3 ${
                            isCorrect ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
                          }`}
                        >
                          <p className="font-bold">
                            {isCorrect ? '✓ Correct Answer!' : '✗ Incorrect'}
                          </p>
                          <p className="text-[11px] mt-1 text-govText-secondary">
                            {q.explanation.en}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
                {previewSubmitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewAnswers({});
                      setPreviewSubmitted(false);
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-govText-primary text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Assessment</span>
                  </button>
                ) : (
                  <span className="text-xs text-govText-secondary">
                    {Object.keys(previewAnswers).length} of {previewQuiz.questions.length} answered
                  </span>
                )}

                {!previewSubmitted && (
                  <button
                    type="button"
                    disabled={Object.keys(previewAnswers).length === 0}
                    onClick={() => setPreviewSubmitted(true)}
                    className="px-5 py-2 bg-[#0B6E4F] hover:bg-[#085A40] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Submit & Grade Assessment
                  </button>
                )}
              </div>
            </div>
          )}
        </GlobalModal>

        {/* 5. Delete Confirmation Modal (Global Viewport Centered via Portal) */}
        <ConfirmDialog
          isOpen={Boolean(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deleteConfirm?.type === 'module' ? 'Module' : deleteConfirm?.type === 'lesson' ? 'Lesson' : 'Assessment'}?`}
          message={
            <>
              Are you sure you want to remove{' '}
              <strong className="text-govText-primary font-bold">"{deleteConfirm?.title}"</strong>?
              This action cannot be undone.
            </>
          }
          confirmLabel="Confirm Delete"
          cancelLabel="Cancel"
          variant="danger"
        />

      </div>
    </PageContainer>
  );
};

