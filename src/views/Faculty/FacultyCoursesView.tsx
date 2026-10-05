import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Edit3,
  Users,
  Search,
  Plus,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { Course } from '../../types';
import { FacultyCourseCard } from '../../components/common/FacultyCourseCard';
import { GlobalModal } from '../../components/common/GlobalModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { api } from '../../lib/api';

// â”€â”€â”€ Types from backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface FacultyCourseItem {
  id: string;
  title: string;
  titleHi?: string;
  category: string;
  level: string;
  durationHours: number;
  thumbnail: string;
  enrolledCount: number;
  completionRate: number;
  quizPassRate: number;
  status: string;
  lastUpdated: string;
  modules?: any[];
}

interface RosterTraineeItem {
  id: string;
  name: string;
  email: string;
  coop: string;
  enrolledDate: string;
  progressPercent: number;
  quizScore: string;
  status: 'completed' | 'in_progress';
}

// ─── Helper: adapt FacultyCourseItem → Course (for FacultyCourseCard) ────────

function adaptToCourse(item: FacultyCourseItem): Course {
  return {
    id: item.id,
    title: item.title,
    titleHi: item.titleHi || '',
    titleMr: '',
    description: '',
    descriptionHi: '',
    descriptionMr: '',
    thumbnail: item.thumbnail,
    instituteId: '',
    durationHours: item.durationHours,
    level: (item.level as Course['level']) || 'Beginner',
    category: (item.category as Course['category']) || 'PACS Digitalization',
    modules: item.modules || [],
  };
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const FacultyCoursesView: React.FC = () => {
  const { navigate, currentUser, deleteCourse } = useApp();

  // â”€â”€ Courses State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [dbCourses, setDbCourses] = useState<FacultyCourseItem[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // â”€â”€ Roster Modal State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeRosterCourse, setActiveRosterCourse] = useState<FacultyCourseItem | null>(null);
  const [rosterData, setRosterData] = useState<RosterTraineeItem[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // â”€â”€ Filter / Search State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  // â”€â”€ Delete State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [courseToDelete, setCourseToDelete] = useState<{ course: FacultyCourseItem; enrolledCount: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAuthor = currentUser?.role === 'faculty';

  // â”€â”€ Fetch Courses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    setCoursesError(null);
    try {
      const data = await api.faculty.getCourses();
      setDbCourses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load courses';
      setCoursesError(message);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // â”€â”€ Fetch Roster when modal opens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!activeRosterCourse) {
      setRosterData([]);
      setRosterError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingRoster(true);
    setRosterError(null);

    api.faculty.getCourseRoster(activeRosterCourse.id)
      .then(data => {
        if (!cancelled) setRosterData(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!cancelled) setRosterError(err instanceof Error ? err.message : 'Failed to load roster');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoster(false);
      });

    return () => { cancelled = true; };
  }, [activeRosterCourse]);

  // â”€â”€ Delete Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 350));
    deleteCourse(courseToDelete.course.id);
    setDbCourses(prev => prev.filter(c => c.id !== courseToDelete.course.id));
    setIsDeleting(false);
    setCourseToDelete(null);
    setToastMessage('Course deleted successfully.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // â”€â”€ Filtering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredCourses = dbCourses.filter(course => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      course.title.toLowerCase().includes(q) ||
      course.category.toLowerCase().includes(q);
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    'all',
    'PACS Digitalization',
    'Dairy Management',
    'Women & SHGs',
    'Cooperative Governance',
    'Financial Literacy',
    'Agriculture & Rural Development',
  ];

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <PageContainer>
      <div className="space-y-6 animate-fadeIn pb-24 sm:pb-28 lg:pb-12">

        {/* 1. Header Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-bold text-govTeal-700 uppercase tracking-wider px-2 py-0.5 rounded bg-govTeal-50 border border-govTeal-200">
                Curriculum Governance
              </span>
              <SimulatedBadge text="Faculty Course Management" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1.5">
              My Authored Courses
            </h1>
            <p className="text-xs text-govText-secondary mt-1 max-w-2xl leading-relaxed">
              Curriculum authoring, lesson modules, quiz assessments, and trainee performance analytics for your authored courses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/faculty/courses/new')}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#085A40] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95 min-h-[44px] flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Author New Course / Module</span>
          </button>
        </div>

        {/* 2. Filter & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-govText-border shadow-xs p-3.5 sm:p-4 lg:px-6 lg:py-0 lg:h-[88px] flex flex-col md:flex-row md:items-center gap-3 lg:gap-4 w-full">
          {/* Mobile Search Row (< md) */}
          <div className="md:hidden relative w-full flex items-center">
            <Search className="w-4 h-4 text-govText-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your authored courses..."
              className="w-full h-[48px] pl-10 pr-9 rounded-xl border border-govText-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] bg-[#F6F8F6] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop & Tablet Search Control (>= md) */}
          <div className="hidden md:flex items-center shrink-0">
            {isSearchExpanded || searchQuery ? (
              <div className="relative flex items-center h-[56px] w-64 lg:w-72 transition-all duration-200">
                <Search className="w-5 h-5 text-[#0B6E4F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={desktopSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                      setIsSearchExpanded(false);
                    }
                  }}
                  placeholder="Search authored courses..."
                  className="w-full h-[56px] pl-11 pr-10 rounded-[16px] border border-[#0B6E4F] text-xs font-semibold text-govText focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20 bg-white shadow-xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchExpanded(false);
                  }}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSearchExpanded(true);
                  setTimeout(() => desktopSearchInputRef.current?.focus(), 50);
                }}
                title="Search authored courses"
                aria-label="Search authored courses"
                className="w-[56px] h-[56px] rounded-[16px] border border-[#0B6E4F] bg-white hover:bg-[#0B6E4F]/5 text-[#0B6E4F] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 group focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40"
              >
                <Search className="w-5 h-5 text-gray-600 group-hover:text-[#0B6E4F] transition-colors" />
              </button>
            )}
          </div>

          {/* Category Label + Horizontally Scrollable Chips */}
          <div className="flex items-center gap-3 flex-1 min-w-0 w-full md:w-auto">
            <span className="text-xs sm:text-[13px] font-semibold text-govText-secondary shrink-0 select-none leading-none inline-flex items-center">
              Category:
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-[50px] min-h-[50px] max-h-[50px] px-4 sm:px-5 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer whitespace-nowrap inline-flex items-center justify-center shrink-0 leading-none select-none ${
                    selectedCategory === cat
                      ? 'bg-[#0B6E4F] text-white font-bold shadow-xs'
                      : 'bg-[#F6F8F6] hover:bg-[#EDF2ED] text-govText-secondary hover:text-govText font-semibold'
                  }`}
                >
                  {cat === 'all' ? `All Authored (${dbCourses.length})` : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Loading State */}
        {isLoadingCourses && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-govText-muted">
            <Loader2 className="w-10 h-10 animate-spin text-govTeal-600" />
            <p className="text-sm font-medium">Loading your courses from the databaseâ€¦</p>
          </div>
        )}

        {/* 4. Error State */}
        {!isLoadingCourses && coursesError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-start gap-3 max-w-lg w-full">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Could not load courses</p>
                <p className="text-xs text-rose-700">{coursesError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchCourses}
              className="flex items-center gap-2 px-4 py-2 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 rounded-xl text-xs font-bold border border-govTeal-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* 5. Course Cards Grid */}
        {!isLoadingCourses && !coursesError && (
          <>
            {filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-govText-muted">
                <BookOpen className="w-12 h-12 text-gray-300" />
                <p className="font-semibold text-govText-secondary">
                  {dbCourses.length === 0
                    ? 'No courses found in the database. Author your first course!'
                    : 'No courses match your current search or filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredCourses.map(item => (
                  <FacultyCourseCard
                    key={item.id}
                    course={adaptToCourse(item)}
                    enrolledCount={item.enrolledCount}
                    completionRate={item.completionRate}
                    lastUpdatedText={item.lastUpdated || 'Live Database Data'}
                    onManage={() => navigate(`/faculty/courses/${item.id}/edit`)}
                    onViewRoster={() => setActiveRosterCourse(item)}
                    onEdit={isAuthor ? () => navigate(`/faculty/courses/${item.id}/edit-course`, { editCourseId: item.id }) : undefined}
                    onDelete={isAuthor ? () => setCourseToDelete({ course: item, enrolledCount: item.enrolledCount }) : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 6. Enrolled Trainee Roster Modal (Global Viewport Centered via Portal) */}
        <GlobalModal
          isOpen={Boolean(activeRosterCourse)}
          onClose={() => setActiveRosterCourse(null)}
          maxWidth="max-w-3xl"
          ariaLabel="Enrolled Trainee Roster"
        >
          {activeRosterCourse && (
            <div className="p-4 sm:p-6 flex flex-col space-y-4 max-h-[90vh]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-shrink-0 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-govTeal-50 text-govTeal-800 border border-govTeal-200">
                      Enrolled Roster
                    </span>
                    <span className="text-xs text-govText-muted font-mono">{activeRosterCourse.id}</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-govText-primary mt-1 truncate">
                    {activeRosterCourse.title}
                  </h3>
                </div>

                <button
                  onClick={() => setActiveRosterCourse(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Close roster"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Roster Loading */}
              {isLoadingRoster && (
                <div className="flex items-center justify-center py-12 gap-3 text-govText-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-govTeal-600" />
                  <span className="text-sm font-medium">Loading trainee rosterâ€¦</span>
                </div>
              )}

              {/* Roster Error */}
              {!isLoadingRoster && rosterError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{rosterError}</span>
                </div>
              )}

              {/* Roster Table */}
              {!isLoadingRoster && !rosterError && (
                <>
                  {rosterData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-govText-muted">
                      <Users className="w-10 h-10 text-gray-300" />
                      <p className="text-sm font-medium">No trainees enrolled in this course yet.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full min-w-[560px] text-left text-xs text-govText-primary">
                        <thead className="bg-[#F8FAF8] border-b border-gray-200 text-[11px] font-bold text-govText-secondary uppercase sticky top-0">
                          <tr>
                            <th className="p-3">Trainee Candidate</th>
                            <th className="p-3">Sponsoring Society</th>
                            <th className="p-3 text-right">LMS Progress</th>
                            <th className="p-3 text-right">Quiz Assessment</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rosterData.map(trainee => (
                            <tr key={trainee.id} className="hover:bg-gray-50/50">
                              <td className="p-3">
                                <div className="font-bold text-govText-primary">{trainee.name}</div>
                                <div className="text-[10px] text-govText-muted font-mono">{trainee.id}</div>
                              </td>
                              <td className="p-3 text-govText-secondary">
                                {trainee.coop}
                              </td>
                              <td className="p-3 text-right">
                                <div className="font-bold text-govText-primary">{trainee.progressPercent}%</div>
                                <div className="w-20 bg-gray-200 h-1.5 rounded-full overflow-hidden ml-auto mt-1">
                                  <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: `${trainee.progressPercent}%` }}
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-right font-semibold text-emerald-800">
                                {trainee.quizScore}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    trainee.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {trainee.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                                  {trainee.status === 'completed' ? 'Completed' : 'In Progress'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Roster Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs flex-shrink-0">
                    <span className="text-govText-muted">
                      {rosterData.length} trainee{rosterData.length !== 1 ? 's' : ''} enrolled Â· Live database data
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/faculty/courses/${activeRosterCourse.id}/edit`);
                        setActiveRosterCourse(null);
                      }}
                      className="px-3.5 py-1.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Open in Course Studio
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </GlobalModal>

        {/* 7. Delete Course Confirmation Modal */}
        <ConfirmDialog
          isOpen={Boolean(courseToDelete)}
          onClose={() => setCourseToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Course?"
          message={
            <>
              Are you sure you want to delete <strong className="text-govText-primary font-bold">'{courseToDelete?.course.title}'</strong>? This action cannot be undone.
            </>
          }
          warningNote={
            courseToDelete && courseToDelete.enrolledCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> This course has {courseToDelete.enrolledCount} enrolled trainee{courseToDelete.enrolledCount !== 1 ? 's' : ''}. Deleting it may affect existing learner records and certification history.
                </span>
              </div>
            ) : undefined
          }
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Course'}
          cancelLabel="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />

        {/* 8. Success Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1300] bg-govTeal-950 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-govTeal-700 flex items-center gap-2 text-xs font-semibold animate-slideUp">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
