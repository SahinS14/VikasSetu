import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  FileText,
  ListPlus,
  X,
  GraduationCap,
  Edit3,
  Check,
  ExternalLink,
  Zap,
  Video,
  Paperclip,
  Image as ImageIcon,
  Link2,
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { Course, CourseModule, Lesson, ContentBlock } from '../../types';
import { FacultyCourseCard } from '../../components/common/FacultyCourseCard';
import { CoursePreviewModal } from '../../components/common/CoursePreviewModal';
import { GlobalModal } from '../../components/common/GlobalModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LessonEditor, LessonPreviewModal } from './LessonEditor';

export interface ModuleFormItem {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  lessons: Lesson[];
}

const createDefaultLesson = (
  moduleId: string,
  order: number,
  titleEn: string,
  titleHi: string,
  titleMr: string,
  durationMinutes: number = 25
): Lesson => ({
  id: `les-${moduleId}-${order}`,
  moduleId,
  order,
  title: titleEn,
  titleHi,
  titleMr,
  durationMinutes,
  contentType: 'Interactive Reading / Theory',
  status: 'Published',
  blocks: [
    {
      id: `blk-${moduleId}-${order}-1`,
      type: 'text',
      text: {
        en: {
          heading: 'Foundational Knowledge & Mandates',
          body:
            'This training unit outlines standard operational workflows sanctioned by the National Council for Cooperative Training (NCCT).\n\n### Core Competencies\n- Accurate ledger posting\n- Statutory bye-law adherence\n- Transparent member accounting.',
        },
        hi: {
          heading: 'मूलभूत ज्ञान एवं विनियामक मानक',
          body:
            'यह प्रशिक्षण इकाई राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT) द्वारा अनुमोदित मानक संचालन प्रक्रियाओं को समाहित करती है।\n\n### मुख्य उद्देश्य\n- सटीक बही-खाता संधारण\n- उप-नियमों का अनुपालन\n- पारदर्शी लेखांकन।',
        },
        mr: {
          heading: 'मूलभूत माहिती आणि नियम',
          body:
            'हा प्रशिक्षण विभाग राष्ट्रीय सहकारी प्रशिक्षण परिषदेने (NCCT) निर्धारित केलेल्या मानकांची माहिती देतो.\n\n### प्रमुख उद्दिष्टे\n- अचूक हिशोब नोंदणी\n- पोटनियमांचे पालन\n- पारदर्शक ताळेबंद.',
        },
      },
    },
    {
      id: `blk-${moduleId}-${order}-2`,
      type: 'attachment',
      attachment: {
        fileName: 'PACS_ERP_Standard_Manual.pdf',
        fileType: 'pdf',
        fileSize: '2.4 MB',
        fileUrl: 'https://cooperation.gov.in/pacs-manual.pdf',
      },
    },
    {
      id: `blk-${moduleId}-${order}-3`,
      type: 'link',
      link: {
        en: {
          title: 'Official Ministry of Cooperation Circular',
          url: 'https://cooperation.gov.in',
          description: 'Accredited national standard guidelines and circulars.',
          openInNewTab: true,
        },
        hi: {
          title: 'सहकारिता मंत्रालय आधिकारिक परिपत्र',
          url: 'https://cooperation.gov.in',
          description: 'मान्यता प्राप्त राष्ट्रीय मानक दिशानिर्देश।',
          openInNewTab: true,
        },
        mr: {
          title: 'सहकार मंत्रालय अधिकृत परिपत्रक',
          url: 'https://cooperation.gov.in',
          description: 'अधिकृत मार्गदर्शक सूचना आणि नियमावली.',
          openInNewTab: true,
        },
      },
    },
  ],
  contentByLanguage: {
    en: {
      text: 'Comprehensive modular learning syllabus.',
      overview: 'Overview of core operational topics covered in this lesson.',
      keyTakeaways: ['Accredited standard curriculum under Ministry of Cooperation'],
    },
    hi: {
      text: 'व्यापक मॉड्यूलर अध्ययन पाठ्यक्रम।',
      overview: 'इस पाठ में शामिल मुख्य परिचालन विषयों का अवलोकन।',
      keyTakeaways: ['सहकारिता मंत्रालय के अंतर्गत मान्यता प्राप्त पाठ्यक्रम'],
    },
    mr: {
      text: 'सर्वसमावेशक अभ्यासक्रम.',
      overview: 'या धड्यातील महत्त्वाच्या मुद्द्यांचा आढावा.',
      keyTakeaways: ['अधिकृत राष्ट्रीय अभ्यासक्रम'],
    },
  },
});

export const CreateCourseView: React.FC = () => {
  const { courses, addNewCourse, navigate, currentUser, activeViewParams } = useApp();

  const editCourseId = activeViewParams?.editCourseId;
  const courseToEdit = editCourseId ? courses.find(c => c.id === editCourseId) : null;
  const isEditMode = Boolean(courseToEdit);

  // Active Lesson Context for opening full Lesson Editor
  const [activeLessonContext, setActiveLessonContext] = useState<{
    moduleIndex: number;
    lesson: Lesson;
  } | null>(null);

  // Active Lesson for Quick Learner Preview Modal
  const [previewLesson, setPreviewLesson] = useState<{
    lesson: Lesson;
    moduleTitle: string;
  } | null>(null);
  const [previewLang, setPreviewLang] = useState<'en' | 'hi' | 'mr'>('en');

  // Basic Information Form State
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [hasManuallyEditedId, setHasManuallyEditedId] = useState(false);
  const [category, setCategory] = useState('PACS Digitalization');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [durationHours, setDurationHours] = useState<number | ''>(30);
  const [description, setDescription] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>([
    'Understand fundamental cooperative principles and legal compliance standards.',
    'Execute day-to-day accounting transactions on the National PACS ERP software.',
  ]);
  const [newObjectiveInput, setNewObjectiveInput] = useState('');

  // Course Modules State with Rich Structured Lessons
  const [modules, setModules] = useState<ModuleFormItem[]>([
    {
      id: 'mod-init-1',
      title: 'Module 01: Foundations & Legal Framework',
      description: 'Cooperative legislation, state bye-laws, and National MoC policy architecture.',
      durationHours: 12,
      lessons: [
        createDefaultLesson(
          'mod-init-1',
          1,
          '1.1 Overview of MoC PACS Digitalization Mandate',
          '1.1 सहकारिता मंत्रालय का पैक्स डिजिटलीकरण विजन',
          '1.1 सहकार मंत्रालयाचे पॅक्स संगणकीकरण धोरण',
          25
        ),
        createDefaultLesson(
          'mod-init-1',
          2,
          '1.2 Daily Cash & Ledger Book Entry Workflow',
          '1.2 दैनिक रोकड़ बही एवं खाता प्रविष्टि कार्यप्रणाली',
          '1.2 दैनिक रोख वही आणि खाते नोंद प्रक्रिया',
          30
        ),
      ],
    },
    {
      id: 'mod-init-2',
      title: 'Module 02: Digital Operations & Day-End Balancing',
      description: 'Transaction entry, double-entry ledger balancing, and KCC loan disbursement.',
      durationHours: 18,
      lessons: [
        createDefaultLesson(
          'mod-init-2',
          1,
          '2.1 Digital Cash Book Posting & Day-Open Controls',
          '2.1 दैनिक रोकड़ बही प्रविष्टि एवं डे-ओपन नियंत्रण',
          '2.1 दैनिक रोख नोंद आणि दिवस प्रारंभ नियंत्रण',
          30
        ),
        createDefaultLesson(
          'mod-init-2',
          2,
          '2.2 NABARD Interest Subvention & Direct Benefit Audits',
          '2.2 नाबार्ड ब्याज अनुदान एवं डीबीटी ऑडिट',
          '2.2 नाबार्ड व्याज अनुदान आणि थेट लाभ तपासणी',
          35
        ),
      ],
    },
  ]);

  // Pre-fill fields when opening in Edit Mode
  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.title);
      setCourseId(courseToEdit.id);
      setHasManuallyEditedId(true);
      setCategory(courseToEdit.category || 'PACS Digitalization');
      setDifficulty(courseToEdit.level || 'Beginner');
      setDurationHours(courseToEdit.durationHours || 30);
      setDescription(courseToEdit.description || '');
      if (courseToEdit.modules && courseToEdit.modules.length > 0) {
        setModules(
          courseToEdit.modules.map(m => ({
            id: m.id,
            title: m.title,
            description:
              m.lessons?.[0]?.contentByLanguage?.en?.overview ||
              m.lessons?.[0]?.contentByLanguage?.en?.text?.slice(0, 120) ||
              'Comprehensive modular syllabus.',
            durationHours:
              Math.round(
                m.lessons?.reduce((acc, l) => acc + (l.durationMinutes || 30), 0) / 60
              ) || 12,
            lessons: m.lessons?.length
              ? m.lessons.map(l => ({
                  ...l,
                  blocks: l.blocks || [
                    {
                      id: `blk-${l.id}-1`,
                      type: 'text',
                      text: {
                        en: {
                          heading: 'Lesson Overview',
                          body: l.contentByLanguage?.en?.richContent || l.contentByLanguage?.en?.text || 'Course content...',
                        },
                        hi: {
                          heading: 'पाठ सारांश',
                          body: l.contentByLanguage?.hi?.richContent || l.contentByLanguage?.hi?.text || 'पाठ सामग्री...',
                        },
                        mr: {
                          heading: 'धडा सारांश',
                          body: l.contentByLanguage?.mr?.richContent || l.contentByLanguage?.mr?.text || 'अभ्यासक्रम सामग्री...',
                        },
                      },
                    },
                  ],
                }))
              : [
                  createDefaultLesson(
                    m.id,
                    1,
                    '1.1 Introduction & Overview',
                    '1.1 परिचय एवं अवलोकन',
                    '1.1 परिचय आणि विहंगावलोकन',
                    25
                  ),
                ],
          }))
        );
      }
    }
  }, [courseToEdit?.id]);

  // Temporary input for adding a lesson inside a specific module
  const [lessonInputs, setLessonInputs] = useState<Record<string, string>>({});

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedCourseTitle, setPublishedCourseTitle] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<{ id: string; title: string } | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<{ moduleId: string; lessonIndex: number; title: string } | null>(null);

  // Auto-generate Course ID from Title if not manually edited
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!hasManuallyEditedId && !isEditMode) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 30);
      setCourseId(slug ? `crs-${slug}` : '');
    }
  };

  const handleIdChange = (val: string) => {
    setCourseId(val);
    setHasManuallyEditedId(true);
  };

  // Learning Objectives Handlers
  const handleAddObjective = () => {
    if (!newObjectiveInput.trim()) return;
    setLearningObjectives(prev => [...prev, newObjectiveInput.trim()]);
    setNewObjectiveInput('');
  };

  const handleRemoveObjective = (index: number) => {
    setLearningObjectives(prev => prev.filter((_, i) => i !== index));
  };

  // Modules Handlers
  const handleAddModule = () => {
    const newModNumber = modules.length + 1;
    const newModId = `mod-${Date.now()}`;
    const newMod: ModuleFormItem = {
      id: newModId,
      title: `Module ${String(newModNumber).padStart(2, '0')}: New Curriculum Section`,
      description: 'Provide an overview of key operational topics covered in this module.',
      durationHours: 10,
      lessons: [
        createDefaultLesson(
          newModId,
          1,
          `${newModNumber}.1 Foundation Topics & Principles`,
          `${newModNumber}.1 मूलभूत विषय एवं सिद्धांत`,
          `${newModNumber}.1 मूलभूत घटक आणि तत्त्वे`,
          25
        ),
      ],
    };
    setModules(prev => [...prev, newMod]);
  };

  const handleUpdateModule = (id: string, field: keyof ModuleFormItem, value: any) => {
    setModules(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleDeleteModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === modules.length - 1)
    ) {
      return;
    }
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setModules(prev => {
      const copy = [...prev];
      const item = copy.splice(index, 1)[0];
      copy.splice(newIndex, 0, item);
      return copy;
    });
  };

  // Add Lesson: creates the lesson and immediately opens the dedicated Lesson Editor interface!
  const handleAddLesson = (moduleId: string) => {
    const modIdx = modules.findIndex(m => m.id === moduleId);
    if (modIdx < 0) return;
    const currentMod = modules[modIdx];
    const lessonNum = `${modIdx + 1}.${currentMod.lessons.length + 1}`;
    const newLesson: Lesson = {
      id: `les-${moduleId}-${Date.now()}`,
      moduleId: currentMod.id,
      order: currentMod.lessons.length + 1,
      title: `${lessonNum} New Lesson Title`,
      titleHi: `${lessonNum} नया पाठ शीर्षक`,
      titleMr: `${lessonNum} नवीन धडा शीर्षक`,
      durationMinutes: 25,
      contentType: 'Interactive Reading / Theory',
      status: 'Draft',
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          type: 'text',
          text: {
            en: {
              heading: 'Learning Unit Overview',
              body: 'Enter structured lesson theory, regulatory guidelines, and standard operating procedures...',
            },
            hi: {
              heading: 'पाठ परिचय एवं उद्देश्य',
              body: 'यहाँ पाठ की विस्तृत सामग्री एवं मानक प्रक्रियाएं दर्ज करें...',
            },
            mr: {
              heading: 'धडा विहंगावलोकन आणि उद्दिष्टे',
              body: 'येथे धड्याची सविस्तर माहिती आणि कार्यपद्धती नोंदवा...',
            },
          },
        },
      ],
      attachments: [],
      contentByLanguage: {
        en: {
          text: 'Comprehensive modular learning syllabus.',
          overview: 'Overview of core operational topics covered in this lesson.',
          keyTakeaways: ['Accredited standard curriculum under Ministry of Cooperation'],
        },
        hi: {
          text: 'व्यापक मॉड्यूलर अध्ययन पाठ्यक्रम।',
          overview: 'इस पाठ में शामिल मुख्य परिचालन विषयों का अवलोकन।',
          keyTakeaways: ['सहकारिता मंत्रालय के अंतर्गत मान्यता प्राप्त पाठ्यक्रम'],
        },
        mr: {
          text: 'सर्वसमावेशक अभ्यासक्रम.',
          overview: 'या धड्यातील महत्त्वाच्या मुद्द्यांचा आढावा.',
          keyTakeaways: ['अधिकृत राष्ट्रीय अभ्यासक्रम'],
        },
      },
    };

    setActiveLessonContext({
      moduleIndex: modIdx,
      lesson: newLesson,
    });
  };

  const handleEditLesson = (moduleIndex: number, lesson: Lesson) => {
    setActiveLessonContext({
      moduleIndex,
      lesson: JSON.parse(JSON.stringify(lesson)),
    });
  };

  const handleRemoveLesson = (moduleId: string, lessonIdx: number) => {
    setModules(prev =>
      prev.map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: m.lessons.filter((_, idx) => idx !== lessonIdx) };
        }
        return m;
      })
    );
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Course title is required.';
    }

    if (!courseId.trim()) {
      newErrors.courseId = 'Course ID is required.';
    } else {
      // Check for duplicate course IDs in existing courses list
      const isDuplicate = courses.some(c => c.id.toLowerCase() === courseId.trim().toLowerCase());
      if (isDuplicate) {
        newErrors.courseId = `Course ID "${courseId}" already exists. Please choose a unique identifier.`;
      }
    }

    if (!category) {
      newErrors.category = 'Please select a course category.';
    }

    if (!durationHours || Number(durationHours) <= 0) {
      newErrors.durationHours = 'Please enter a valid course duration in hours.';
    }

    if (!description.trim() || description.trim().length < 20) {
      newErrors.description = 'Course description must be at least 20 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Publish Course Action
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // Construct full Course object compatible with existing Course Studio & catalog
    const newCourseObj: Course = {
      id: courseId.trim(),
      title: title.trim(),
      titleHi: title.trim(),
      titleMr: title.trim(),
      description: description.trim(),
      descriptionHi: description.trim(),
      descriptionMr: description.trim(),
      thumbnail: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80',
      instituteId: currentUser.instituteId || 'inst-vamnicom',
      durationHours: Number(durationHours),
      level: difficulty,
      category: category as any,
      modules: modules.map((m, idx) => ({
        id: m.id,
        courseId: courseId.trim(),
        order: idx + 1,
        title: m.title,
        titleHi: m.title,
        titleMr: m.title,
        lessons: m.lessons.map((lesson, lIdx) => ({
          ...lesson,
          moduleId: m.id,
          order: lIdx + 1,
        })),
        quiz: {
          id: `quiz-${m.id}`,
          moduleId: m.id,
          title: `${m.title} Assessment Quiz`,
          titleHi: `${m.title} मूल्यांकन परीक्षा`,
          titleMr: `${m.title} मूल्यांकन चाचणी`,
          passThreshold: 75,
          questions: [
            {
              id: `q-${m.id}-1`,
              question: 'What is the primary governing objective of standard cooperative bookkeeping?',
              questionHi: 'सहकारी बही-खाता संधारण का प्राथमिक उद्देश्य क्या है?',
              questionMr: 'सहकारी हिशोब तपासणीचे मुख्य उद्दिष्ट काय आहे?',
              options: {
                en: ['Transparent member dividend audit', 'Tax evasion', 'Manual secrecy', 'Unrecorded credits'],
                hi: ['पारदर्शी सदस्य लाभांश ऑडिट', 'कर अपवंचन', 'गोपनीयता', 'अनाधिकृत ऋण'],
                mr: ['पारदर्शक सभासद लाभांश ऑडिट', 'कर चुकवेगिरी', 'गोपनीयता', 'अनधिकृत कर्ज'],
              },
              correctOptionIndex: 0,
              explanation: {
                en: 'Double-entry cooperative accounting mandates total audit transparency for members and regulatory authorities.',
                hi: 'दोहरी प्रविष्टि सहकारी लेखांकन सदस्यों और नियामक प्राधिकरणों के लिए पूर्ण ऑडिट पारदर्शिता अनिवार्य करता है।',
                mr: 'द्विनोंद पद्धत सभासद व नियामक संस्थांसाठी पूर्ण पारदर्शकता निश्चित करते.',
              },
            },
          ],
        },
      })),
    };

    // Add to shared AppContext courses state (persisted to localStorage)
    addNewCourse(newCourseObj);

    setPublishedCourseTitle(title.trim());
    setShowSuccessModal(true);
  };

  // Save as Draft Action
  const handleSaveDraft = () => {
    if (!title.trim() || !courseId.trim()) {
      setErrors({
        title: !title.trim() ? 'Course title is required to save a draft.' : '',
        courseId: !courseId.trim() ? 'Course ID is required.' : '',
      });
      return;
    }

    const draftCourse: Course = {
      id: courseId.trim(),
      title: `${title.trim()} (Draft)`,
      titleHi: `${title.trim()} (Draft)`,
      titleMr: `${title.trim()} (Draft)`,
      description: description.trim() || 'Curriculum draft in preparation.',
      descriptionHi: description.trim() || 'Curriculum draft in preparation.',
      descriptionMr: description.trim() || 'Curriculum draft in preparation.',
      thumbnail: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80',
      instituteId: currentUser.instituteId || 'inst-vamnicom',
      durationHours: Number(durationHours) || 10,
      level: difficulty,
      category: category as any,
      modules: [],
    };

    addNewCourse(draftCourse);
    navigate('/faculty/courses');
  };

  // Construct dynamic live preview course from current form state
  const previewCourse: Course = {
    id: courseId.trim() || 'crs-preview-id',
    title: title.trim() || 'Untitled Course',
    titleHi: '',
    titleMr: '',
    description:
      description.trim() ||
      'Course description will appear here once entered in the curriculum authoring form.',
    descriptionHi: '',
    descriptionMr: '',
    thumbnail:
      'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80',
    instituteId: currentUser?.instituteId || 'inst-vamnicom',
    durationHours: Number(durationHours) || 30,
    level: difficulty,
    category: category as any,
    modules: modules.map((m, idx) => ({
      id: m.id || `mod-${idx + 1}`,
      courseId: courseId.trim() || 'crs-preview-id',
      order: idx + 1,
      title: m.title || `Module ${idx + 1}`,
      titleHi: '',
      titleMr: '',
      description: m.description || '',
      durationHours: m.durationHours || 10,
      lessons: m.lessons.map((lesson, lIdx) => ({
        ...lesson,
        id: lesson.id || `les-${idx + 1}-${lIdx + 1}`,
        moduleId: m.id,
        order: lIdx + 1,
      })),
    })),
  };

  // If a lesson is being edited or created, render the full dedicated Lesson Editor interface
  if (activeLessonContext) {
    const currentMod = modules[activeLessonContext.moduleIndex];
    return (
      <PageContainer>
        <LessonEditor
          initialLesson={activeLessonContext.lesson}
          moduleTitle={currentMod?.title || 'Module'}
          moduleNumber={activeLessonContext.moduleIndex + 1}
          courseTitle={title || 'Untitled Course'}
          onSave={(updatedLesson, publish) => {
            setModules(prev => {
              const next = [...prev];
              const mod = { ...next[activeLessonContext.moduleIndex] };
              const existingIdx = mod.lessons.findIndex(l => l.id === updatedLesson.id);
              if (existingIdx >= 0) {
                mod.lessons[existingIdx] = updatedLesson;
              } else {
                mod.lessons.push(updatedLesson);
              }
              next[activeLessonContext.moduleIndex] = mod;
              return next;
            });
            setActiveLessonContext(null);
          }}
          onBackToCourse={() => setActiveLessonContext(null)}
          onBackToModule={() => setActiveLessonContext(null)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-44 sm:pb-48 lg:pb-16">
        {/* 1. Header & Breadcrumbs */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/faculty/courses')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-govTeal-700 hover:text-govTeal-900 hover:underline cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to My Courses</span>
              </button>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
                Curriculum Authoring
              </span>
              <SimulatedBadge text={isEditMode ? "Course Studio • Edit Mode" : "Course Studio v2.4"} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-govText-primary tracking-tight">
              {isEditMode ? 'Edit Course' : 'Create New Course'}
            </h1>
            <p className="text-xs text-govText-secondary">
              {isEditMode
                ? `Update training syllabus, lesson topics, and module architecture for "${courseToEdit?.title || 'this course'}".`
                : 'Design a new training programme for cooperative-sector learners.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-govBg hover:bg-govTeal-50 text-govTeal-900 border border-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px]"
            >
              <Eye className="w-4 h-4 text-govTeal-700" />
              <span>Preview Course</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px]"
            >
              <Save className="w-4 h-4 text-gray-600" />
              <span>Save as Draft</span>
            </button>
          </div>
        </div>

        {/* 2. Form Wrapper */}
        <form onSubmit={handlePublish} className="space-y-6">
          {/* Section A: Basic Course Information */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <BookOpen className="w-5 h-5 text-govTeal-600 flex-shrink-0" />
              <div>
                <h2 className="text-base font-bold text-govText-primary">
                  Basic Course Information
                </h2>
                <p className="text-xs text-govText-secondary">
                  Specify the national title, system ID, duration, and classification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* 1. Course Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Course Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. Advanced Cooperative Society Management"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.title
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-200 focus:ring-[#0B6E4F] focus:border-[#0B6E4F]'
                  }`}
                />
                {errors.title && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.title}</span>
                  </p>
                )}
              </div>

              {/* 2. Course ID */}
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Course Identifier (ID) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={courseId}
                    disabled={isEditMode}
                    onChange={e => handleIdChange(e.target.value)}
                    placeholder="crs-coop-mgmt-401"
                    className={`w-full px-3.5 py-2.5 font-mono text-xs rounded-xl border transition-all ${
                      isEditMode
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200 opacity-80 select-none'
                        : errors.courseId
                        ? 'border-rose-400 focus:ring-rose-300 bg-[#FBFDFB]'
                        : 'border-gray-200 focus:ring-[#0B6E4F] focus:border-[#0B6E4F] bg-[#FBFDFB]'
                    }`}
                  />
                </div>
                {errors.courseId ? (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.courseId}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-govText-muted mt-1">
                    {isEditMode
                      ? 'Course Identifier is locked in edit mode to preserve LMS database relations and certificates.'
                      : 'Auto-generated from title. Must be unique across all 20 NCCT institutes.'}
                  </p>
                )}
              </div>

              {/* 3. Category */}
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Domain Category <span className="text-rose-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] transition-all cursor-pointer"
                >
                  <option value="PACS Digitalization">PACS Digitalization</option>
                  <option value="Dairy Management">Dairy Management</option>
                  <option value="Women & SHGs">Women & SHGs</option>
                  <option value="Cooperative Governance">Cooperative Governance</option>
                  <option value="Financial Literacy">Financial Literacy</option>
                  <option value="Agriculture & Rural Development">Agriculture & Rural Development</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* 4. Difficulty */}
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Difficulty Level <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`min-h-[44px] py-2 px-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center text-center ${
                        difficulty === lvl
                          ? 'bg-govTeal-600 text-white border-govTeal-600 shadow-2xs'
                          : 'bg-govBg hover:bg-gray-100 text-govText-primary border-gray-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Duration */}
              <div>
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Total Course Duration (Hours) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={durationHours}
                    onChange={e => setDurationHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="30"
                    className={`w-full px-3.5 py-2.5 min-h-[44px] text-xs rounded-xl border bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.durationHours
                        ? 'border-rose-400 focus:ring-rose-300'
                        : 'border-gray-200 focus:ring-[#0B6E4F]'
                    }`}
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-govText-muted font-medium pointer-events-none">
                    Hours
                  </span>
                </div>
                {errors.durationHours && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.durationHours}</span>
                  </p>
                )}
              </div>

              {/* 6. Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-govText-primary mb-1">
                  Course Overview & Description <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the training objectives, target cooperative functionaries, and key practical outcomes..."
                  className={`w-full p-3.5 text-xs rounded-xl border bg-[#FBFDFB] focus:bg-white focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                    errors.description
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-200 focus:ring-[#0B6E4F]'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              {/* 7. Learning Objectives */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-govText-primary">
                  Learning Objectives & Key Takeaways
                </label>
                <div className="space-y-2">
                  {learningObjectives.map((obj, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2.5 p-3 bg-govBg rounded-xl border border-gray-100 text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-govTeal-600 flex-shrink-0 mt-0.5" />
                        <span className="text-govText-primary break-words leading-relaxed">{obj}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(idx)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-rose-50"
                        title="Remove objective"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newObjectiveInput}
                    onChange={e => setNewObjectiveInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddObjective();
                      }
                    }}
                    placeholder="Type an objective and tap '+ Add'..."
                    className="w-full sm:flex-1 px-3.5 py-2.5 min-h-[44px] text-xs rounded-xl border border-gray-200 bg-[#FBFDFB] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                  />
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 text-xs font-bold rounded-xl border border-govTeal-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Learning Objective</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Module Builder (Part 3) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-govText-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-100 gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-govText-primary flex items-center gap-2">
                  <Layers className="w-5 h-5 text-govTeal-600 shrink-0" />
                  <span>Course Modules & Curriculum Architecture</span>
                </h2>
                <p className="text-xs text-govText-secondary mt-0.5">
                  Organize your course syllabus into logical modules and lesson topics.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddModule}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 rounded-xl text-xs font-bold border border-govTeal-200 transition-colors cursor-pointer w-full sm:w-auto min-h-[44px] shrink-0"
              >
                <Plus className="w-4 h-4 text-govTeal-700" />
                <span>+ Add Module</span>
              </button>
            </div>

            {/* Empty State */}
            {modules.length === 0 ? (
              <div className="text-center py-10 px-4 bg-govBg rounded-2xl border border-dashed border-gray-300 space-y-3">
                <Layers className="w-10 h-10 text-gray-400 mx-auto" />
                <h3 className="font-bold text-sm text-govText-primary">
                  No modules added yet
                </h3>
                <p className="text-xs text-govText-secondary max-w-sm mx-auto">
                  Every training programme requires at least one curriculum module. Tap the button below to add your first module.
                </p>
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="px-4 py-2.5 bg-[#0B6E4F] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#085A40] transition-colors cursor-pointer inline-flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Module</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="bg-[#FBFDFB] rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-2xs hover:border-govTeal-400 transition-colors"
                  >
                    {/* Module Header Bar with Re-order & Delete */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-govTeal-700 text-white uppercase shrink-0">
                          Module {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-mono text-govText-muted truncate">{module.id}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveModule(index, 'up')}
                          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === modules.length - 1}
                          onClick={() => handleMoveModule(index, 'down')}
                          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModuleToDelete({ id: module.id, title: module.title || `Module ${index + 1}` })}
                          className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer ml-1"
                          title="Delete Module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Module Title & Duration Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-govText-primary mb-1">
                          Module Title
                        </label>
                        <input
                          type="text"
                          value={module.title}
                          onChange={e => handleUpdateModule(module.id, 'title', e.target.value)}
                          placeholder="e.g. Module 01: Introduction to Cooperative Governance"
                          className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-govText-primary mb-1">
                          Est. Duration (Hrs)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={module.durationHours}
                          onChange={e => handleUpdateModule(module.id, 'durationHours', Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-govText-primary mb-1">
                        Module Description
                      </label>
                      <input
                        type="text"
                        value={module.description}
                        onChange={e => handleUpdateModule(module.id, 'description', e.target.value)}
                        placeholder="Brief summary of topics covered in this module..."
                        className="w-full px-3.5 py-2.5 min-h-[42px] text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]"
                      />
                    </div>

                    {/* Lessons Section under this module */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-govText-primary flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#0B6E4F]" />
                          <span>Lessons in this Module ({module.lessons.length})</span>
                        </span>
                        <span className="text-[11px] text-govText-muted hidden sm:inline">
                          Full structured learning units with multimedia blocks
                        </span>
                      </div>

                      {module.lessons.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-[#FBFDFB] text-center text-xs text-govText-muted">
                          No lessons added yet in this module. Click "+ Add Lesson" below to author a comprehensive learning unit.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {module.lessons.map((lesson, lIdx) => {
                            const isTrilingual = Boolean(
                              lesson.title?.trim() &&
                              lesson.titleHi?.trim() &&
                              lesson.titleMr?.trim() &&
                              lesson.titleHi !== lesson.title
                            );
                            const blockCount = lesson.blocks?.length ?? 2;
                            const duration = lesson.durationMinutes || 25;

                            return (
                              <div
                                key={lesson.id || lIdx}
                                className="p-3 sm:p-3.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                              >
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-govText-primary break-words">
                                      {lIdx + 1}. {lesson.title}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                        lesson.status === 'Published'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : lesson.status === 'Ready'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {lesson.status || 'Draft'}
                                    </span>
                                  </div>

                                  {/* Metadata row */}
                                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] text-govText-muted">
                                    <span className="inline-flex items-center gap-1 font-medium text-govText-secondary">
                                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      <span>{duration} mins</span>
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 font-medium text-govText-secondary">
                                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                                      <span>{blockCount} Content Block{blockCount !== 1 ? 's' : ''}</span>
                                    </span>
                                    <span>•</span>
                                    {isTrilingual ? (
                                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Trilingual Verified</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                                        <span>Translation Pending</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => handleEditLesson(index, lesson)}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-[#0B6E4F] hover:text-[#085A40] text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    title="Open Lesson Editor"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Lesson</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setPreviewLesson({ lesson, moduleTitle: module.title })}
                                    className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-govText-secondary hover:text-govText-primary text-xs font-semibold rounded-lg border border-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Preview Learner View"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                                    <span>Preview</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLessonToDelete({
                                        moduleId: module.id,
                                        lessonIndex: lIdx,
                                        title: lesson.title || `Lesson ${lIdx + 1}`,
                                      })
                                    }
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* + Add Lesson Button */}
                      <button
                        type="button"
                        onClick={() => handleAddLesson(module.id)}
                        className="w-full py-2.5 px-4 bg-emerald-50/60 hover:bg-emerald-100/70 text-[#0B6E4F] text-xs font-bold rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
                      >
                        <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span>+ Add Lesson</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section C: Sticky / Fixed Action Buttons (Part 4) */}
          <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-35 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg px-3 py-2.5 sm:px-4 sm:py-3 lg:static lg:bg-white lg:rounded-2xl lg:border lg:border-govText-border lg:shadow-md lg:p-5 lg:z-auto lg:flex lg:flex-row lg:items-center lg:justify-between lg:gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-govText-secondary">
              <Sparkles className="w-4 h-4 text-saffron-500 flex-shrink-0" />
              <span>
                {isEditMode
                  ? <>Saving updates will immediately update this course across <strong>My Authored Courses</strong> and Course Studio.</>
                  : <>Publishing makes this course immediately accessible in <strong>My Authored Courses</strong> and Course Studio.</>
                }
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full lg:flex lg:w-auto lg:items-center lg:gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/faculty/courses')}
                className="px-3 sm:px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3 sm:px-4 py-2.5 bg-govBg hover:bg-govTeal-50 text-govTeal-900 border border-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 text-center"
              >
                <Eye className="w-4 h-4 text-govTeal-700 shrink-0" />
                <span>Preview</span>
              </button>

              <button
                type="submit"
                className="px-3 sm:px-5 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 text-center active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-saffron-300 shrink-0" />
                <span className="truncate">{isEditMode ? 'Save Changes' : 'Publish Course'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* 3. Course Preview Modal (Student-Facing Production Preview) */}
        <CoursePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={title}
          courseId={courseId}
          category={category}
          difficulty={difficulty}
          durationHours={durationHours}
          description={description}
          learningObjectives={learningObjectives}
          modules={modules}
        />

        {/* 3.1 Dedicated Lesson Preview Modal */}
        {previewLesson && (
          <LessonPreviewModal
            isOpen={Boolean(previewLesson)}
            onClose={() => setPreviewLesson(null)}
            lesson={{
              title: previewLesson.lesson.title,
              titleHi: previewLesson.lesson.titleHi,
              titleMr: previewLesson.lesson.titleMr,
              contentType: previewLesson.lesson.contentType,
              durationMinutes: previewLesson.lesson.durationMinutes,
              overview:
                previewLesson.lesson.overview ||
                previewLesson.lesson.contentByLanguage?.en?.overview ||
                previewLesson.lesson.contentByLanguage?.en?.text,
              overviewHi:
                previewLesson.lesson.overviewHi ||
                previewLesson.lesson.contentByLanguage?.hi?.overview ||
                previewLesson.lesson.contentByLanguage?.hi?.text,
              overviewMr:
                previewLesson.lesson.overviewMr ||
                previewLesson.lesson.contentByLanguage?.mr?.overview ||
                previewLesson.lesson.contentByLanguage?.mr?.text,
              blocks: previewLesson.lesson.blocks,
            }}
            moduleTitle={previewLesson.moduleTitle}
          />
        )}

        {/* 4. Success Modal Experience (Global Viewport Centered via Portal) */}
        <GlobalModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/faculty/courses');
          }}
          maxWidth="max-w-md"
          ariaLabel="Course Published Successfully"
        >
          {showSuccessModal && (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-govText-primary">
                  {isEditMode ? 'Course Changes Saved Successfully!' : 'Course Published Successfully!'}
                </h3>
                <p className="text-xs text-govText-secondary mt-1 leading-relaxed">
                  {isEditMode
                    ? <><strong>"{publishedCourseTitle}"</strong> has been updated and your changes are now active in the national catalogue.</>
                    : <><strong>"{publishedCourseTitle}"</strong> has been accredited and added to your authored courses catalogue.</>
                  }
                </p>
              </div>

              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 text-left font-medium space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Immediate Availability:</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Visible in "My Authored Courses" and ready for editing in Course Studio.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/faculty/courses');
                }}
                className="w-full py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Back to My Courses
              </button>
            </div>
          )}
        </GlobalModal>

        {/* 5. Delete Module Confirmation Dialog (Global Viewport Centered via Portal) */}
        <ConfirmDialog
          isOpen={Boolean(moduleToDelete)}
          onClose={() => setModuleToDelete(null)}
          onConfirm={() => {
            if (moduleToDelete) {
              handleDeleteModule(moduleToDelete.id);
              setModuleToDelete(null);
            }
          }}
          title="Delete Module?"
          message={
            <>
              Are you sure you want to remove{' '}
              <strong className="text-govText-primary font-bold">"{moduleToDelete?.title}"</strong>?
              This will remove all lessons authored under this module.
            </>
          }
          confirmLabel="Confirm Delete"
          cancelLabel="Cancel"
          variant="danger"
        />

        {/* 6. Delete Lesson Confirmation Dialog (Global Viewport Centered via Portal) */}
        <ConfirmDialog
          isOpen={Boolean(lessonToDelete)}
          onClose={() => setLessonToDelete(null)}
          onConfirm={() => {
            if (lessonToDelete) {
              handleRemoveLesson(lessonToDelete.moduleId, lessonToDelete.lessonIndex);
              setLessonToDelete(null);
            }
          }}
          title="Delete Lesson?"
          message={
            <>
              Are you sure you want to remove{' '}
              <strong className="text-govText-primary font-bold">"{lessonToDelete?.title}"</strong>?
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
