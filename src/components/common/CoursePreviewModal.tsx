import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X } from 'lucide-react';
import { Course } from '../../types';
import { FacultyCourseCard } from './FacultyCourseCard';

export interface CoursePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course;
  title?: string;
  courseId?: string;
  category?: string;
  difficulty?: string;
  durationHours?: number | '';
  description?: string;
  learningObjectives?: string[];
  modules?: Array<{
    id: string;
    title: string;
    description: string;
    durationHours: number;
    lessons: any[];
  }>;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
  isOpen,
  onClose,
  course,
  title = '',
  courseId = '',
  category = 'PACS Digitalization',
  difficulty = 'Beginner',
  durationHours = 30,
  description = '',
  modules = [],
}) => {
  // Body scroll locking and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Derive course object if not passed directly
  const displayCourse: Course = course || {
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
    instituteId: 'inst-vamnicom',
    durationHours: Number(durationHours) || 30,
    level: (difficulty as any) || 'Beginner',
    category: (category as any) || 'PACS Digitalization',
    modules: modules.map((m, idx) => ({
      id: m.id || `mod-${idx + 1}`,
      courseId: courseId.trim() || 'crs-preview-id',
      order: idx + 1,
      title: m.title || `Module ${idx + 1}`,
      titleHi: '',
      titleMr: '',
      description: m.description || '',
      durationHours: m.durationHours || 10,
      lessons: (m.lessons || []).map((lessonItem, lIdx) => {
        const lTitle = typeof lessonItem === 'string' ? lessonItem : lessonItem?.title || `Lesson ${lIdx + 1}`;
        const lTitleHi = typeof lessonItem === 'object' && lessonItem?.titleHi ? lessonItem.titleHi : lTitle;
        const lTitleMr = typeof lessonItem === 'object' && lessonItem?.titleMr ? lessonItem.titleMr : lTitle;
        const lDuration = typeof lessonItem === 'object' && lessonItem?.durationMinutes ? lessonItem.durationMinutes : 30;

        return {
          id: typeof lessonItem === 'object' && lessonItem?.id ? lessonItem.id : `les-${idx + 1}-${lIdx + 1}`,
          moduleId: m.id,
          order: lIdx + 1,
          title: lTitle,
          titleHi: lTitleHi,
          titleMr: lTitleMr,
          durationMinutes: lDuration,
          contentType: 'text' as const,
          contentByLanguage: {
            en: {
              text: `Overview of ${lTitle}`,
              keyTakeaways: ['Accredited training curriculum'],
            },
            hi: {
              text: `विवरण: ${lTitleHi}`,
              keyTakeaways: ['प्रमाणित पाठ्यक्रम'],
            },
            mr: {
              text: `तपशील: ${lTitleMr}`,
              keyTakeaways: ['प्रमाणित अभ्यासक्रम'],
            },
          },
        };
      }),
    })),
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-course-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-[#0f172a]/55 backdrop-blur-[2px] overflow-hidden select-none"
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={onClose}
    >
      <div
        className="bg-white relative flex flex-col overflow-hidden animate-scaleUp text-left"
        style={{
          width: 'min(900px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 48px)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. STICKY MODAL HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 text-emerald-700" />
            </div>
            <h2
              id="preview-course-modal-title"
              className="text-base sm:text-lg font-bold text-govText-primary"
            >
              Preview Course
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 tracking-wider uppercase">
              LIVE PREVIEW
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE BODY (CENTERED COURSE CARD) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-gray-50/60 flex flex-col items-center justify-start">
          <FacultyCourseCard
            course={displayCourse}
            enrolledCount={0}
            completionRate={0}
            lastUpdatedText="Draft Preview"
            previewMode={true}
            className="w-full max-w-[420px] shadow-sm border-gray-200/90"
          />
        </div>

        {/* 3. STICKY FOOTER ACTIONS */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer min-h-[40px]"
          >
            Edit Course
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#0B6E4F] hover:bg-[#085A40] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer min-h-[40px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
