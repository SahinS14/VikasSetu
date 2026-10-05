import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Edit3,
  Edit2,
  Trash2,
  MoreVertical,
  Eye,
  Layers,
  BookOpen
} from 'lucide-react';
import { Course } from '../../types';

export interface FacultyCourseCardProps {
  course: Course;
  enrolledCount?: number;
  completionRate?: number;
  lastUpdatedText?: string;
  previewMode?: boolean;
  onManage?: () => void;
  onViewRoster?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const FacultyCourseCard: React.FC<FacultyCourseCardProps> = ({
  course,
  enrolledCount = 0,
  completionRate = 0,
  lastUpdatedText = 'Updated recently',
  previewMode = false,
  onManage,
  onViewRoster,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const totalModules = course.modules?.length || 0;
  const totalLessons =
    course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  // Fallback image matching standard course thumbnails
  const displayImage =
    course.thumbnail ||
    'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      className={`bg-white rounded-2xl border border-govText-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${className}`}
    >
      <div>
        {/* 1. Thumbnail & Floating Metadata Badges */}
        <div className="relative h-44 w-full overflow-hidden bg-gray-100">
          <img
            src={displayImage}
            alt={course.title || 'Course thumbnail'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Category & Difficulty Badges (Top Left) */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
              {course.category || 'Cooperative Training'}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-govTeal-700 text-white">
              {course.level || 'Beginner'}
            </span>
          </div>

          {/* Top Right: Three-dot More Menu for Edit / Delete */}
          {!previewMode && (onEdit || onDelete) && (
            <div className="absolute top-3 right-3 z-10" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="w-8 h-8 rounded-xl bg-black/60 hover:bg-black/85 text-white backdrop-blur-xs flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                title="More course options"
                aria-label="More course options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 animate-fadeIn text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-govText-muted uppercase tracking-wider border-b border-gray-100">
                    Course Actions
                  </div>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onEdit();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-govTeal-50 text-govText-primary hover:text-govTeal-900 transition-colors cursor-pointer font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-govTeal-700" />
                      <span>Edit Course</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        onDelete();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-rose-50 text-rose-700 hover:text-rose-800 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete Course</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Duration Badge (Bottom Right) */}
          <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/90 text-govText-primary shadow-xs">
            {course.durationHours || 30} Hours Duration
          </div>
        </div>

        {/* 2. Course Header & Body */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-govText-muted mb-1">
              <span>
                Course ID: <strong className="font-mono text-govText-primary">{course.id || 'crs-id'}</strong>
              </span>
              <span className="text-govTeal-700 font-medium">{lastUpdatedText}</span>
            </div>

            <h3 className="font-bold text-base text-govText-primary leading-snug line-clamp-2">
              {course.title || 'Untitled Course'}
            </h3>

            {course.titleHi && course.titleHi !== course.title && (
              <p className="text-xs text-govText-secondary font-devanagari mt-1 line-clamp-1">
                {course.titleHi}
              </p>
            )}

            <p className="text-xs text-govText-secondary mt-2 line-clamp-2 leading-relaxed">
              {course.description || 'Course description will appear here once entered in the curriculum authoring form.'}
            </p>
          </div>

          {/* 3. Course Metrics Bar (Enrolled, Completion Rate, Modules & Lessons) */}
          <div className="bg-govBg rounded-xl p-3 border border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-govTeal-600" />
                <span className="text-govText-muted">Enrolled Trainees:</span>
              </div>
              <span className="font-extrabold text-govText-primary text-sm">
                {enrolledCount}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-govText-muted text-[11px]">Completion Rate:</span>
                <span className="font-bold text-emerald-700 text-xs">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-govText-secondary border-t border-gray-200/60">
              <span>{totalModules} Modules • {totalLessons} Lessons</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Accredited
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Area */}
      <div className="p-5 pt-0 space-y-2.5">
        {previewMode ? (
          <div className="w-full py-2.5 px-3 bg-govTeal-50/70 border border-govTeal-200/80 rounded-xl text-center text-xs font-bold text-govTeal-900 flex items-center justify-center gap-1.5 shadow-2xs">
            <Eye className="w-3.5 h-3.5 text-govTeal-700" />
            <span>Course Card Preview Mode</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onManage}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0B6E4F] hover:bg-[#085A40] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98 min-h-[44px]"
            >
              <Edit3 className="w-4 h-4 text-saffron-300" />
              <span>Manage Course in Studio</span>
            </button>

            <button
              type="button"
              onClick={onViewRoster}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-govBg hover:bg-govTeal-50 text-govTeal-800 text-xs font-semibold rounded-xl border border-gray-200 transition-colors cursor-pointer min-h-[38px]"
            >
              <Users className="w-3.5 h-3.5 text-govTeal-600" />
              <span>View Enrolled Trainee Roster</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
