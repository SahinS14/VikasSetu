import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Filter,
  BookOpen,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { CourseCard } from '../../components/common/CourseCard';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { api } from '../../lib/api';
import { Course, Enrollment } from '../../types';

export const CourseCatalog: React.FC = () => {
  const {
    courses: contextCourses,
    enrollments: contextEnrollments,
    currentUser,
    currentLanguage,
    navigate,
    setEnrollments: setContextEnrollments,
    t
  } = useApp();

  const [dbCourses, setDbCourses] = useState<Course[]>(contextCourses);
  const [userEnrollments, setUserEnrollments] = useState<Enrollment[]>(contextEnrollments);
  const [userCerts, setUserCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  // Load real courses and trainee enrollments directly from PostgreSQL backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollmentsRes, certsRes] = await Promise.allSettled([
        api.courses.list(),
        api.enrollments.mine(),
        api.certificates.mine(),
      ]);

      if (coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value) && coursesRes.value.length > 0) {
        const mapped = coursesRes.value.map((c: any) => ({
          ...c,
          modules: c.modules || c.modulesJson || [],
        }));
        setDbCourses(mapped);
      }

      if (enrollmentsRes.status === 'fulfilled' && Array.isArray(enrollmentsRes.value)) {
        setUserEnrollments(enrollmentsRes.value);
        if (setContextEnrollments) {
          setContextEnrollments(enrollmentsRes.value);
        }
      }

      if (certsRes.status === 'fulfilled' && Array.isArray(certsRes.value)) {
        setUserCerts(certsRes.value);
      }
    } catch (err) {
      console.warn('[CourseCatalog] Failed loading backend data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  // Handle direct registration for authenticated trainee
  const handleRegister = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId);
      await api.enrollments.enroll(courseId);
      // Immediately refresh real enrollments and certs from database
      const [freshEnrollments, freshCerts] = await Promise.all([
        api.enrollments.mine(),
        api.certificates.mine(),
      ]);
      if (Array.isArray(freshEnrollments)) {
        setUserEnrollments(freshEnrollments);
        if (setContextEnrollments) {
          setContextEnrollments(freshEnrollments);
        }
      }
      if (Array.isArray(freshCerts)) {
        setUserCerts(freshCerts);
      }
    } catch (err: any) {
      console.error('[CourseCatalog] Registration failed:', err);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const categories = [
    { id: 'all', label: t.catalog?.allCategories || 'All Categories' },
    { id: 'pacs', label: 'PACS Digitalization' },
    { id: 'dairy', label: 'Dairy & AMCS' },
    { id: 'banking', label: 'Cooperative Banking' },
    { id: 'governance', label: 'Audit & Governance' },
  ];

  const levels = [
    { id: 'all', label: 'All Levels' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const displayCourses = dbCourses.length > 0 ? dbCourses : contextCourses;

  const filteredCourses = displayCourses.filter(course => {
    const courseTitle = currentLanguage === 'hi' ? course.titleHi : currentLanguage === 'mr' ? course.titleMr : course.title;
    const courseDesc = currentLanguage === 'hi' ? course.descriptionHi : currentLanguage === 'mr' ? course.descriptionMr : course.description;

    const matchesSearch =
      courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courseDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      course.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      course.title.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesLevel =
      selectedLevel === 'all' ||
      course.level.toLowerCase() === selectedLevel.toLowerCase();

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govTeal-700 uppercase tracking-wider">
              National Curriculum
            </span>
            <SimulatedBadge text="NCCT & VAMNICOM Standardized" />
          </div>
          <h1 className="text-2xl font-extrabold text-govText-primary mt-1">
            {t.catalog?.title || 'National Course Catalog'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1 max-w-2xl">
            {t.catalog?.subtitle || 'Explore accredited cooperative training courses, register seamlessly, and earn recognized certifications.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('my_courses')}
            className="px-4 py-2.5 bg-govTeal-50 hover:bg-govTeal-100 text-govTeal-800 border border-govTeal-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-govTeal-700" />
            <span>{t.myCourses?.title || 'My Enrolled Courses'} ({userEnrollments.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-govText-border shadow-sm flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1 min-w-0 sm:min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.catalog?.searchPlaceholder || 'Search courses by name, topic, or code...'}
            className="w-full px-3.5 py-2.5 pl-9 rounded-lg border border-govText-border text-xs focus:outline-none focus:ring-2 focus:ring-govTeal-600 bg-govBg"
          />
          <Search className="w-4 h-4 text-govText-muted absolute left-3 top-3" />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-govText-muted flex-shrink-0" />
          <div className="flex gap-1.5 flex-nowrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer min-h-[36px] flex items-center ${
                  selectedCategory === cat.id
                    ? 'bg-govTeal-700 text-white shadow-xs'
                    : 'bg-govBg text-govText-secondary hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Level Dropdown */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full sm:w-auto text-xs px-3 py-2 rounded-lg border border-govText-border bg-govBg font-medium text-govText-primary focus:outline-none focus:ring-2 focus:ring-govTeal-600 min-h-[38px]"
        >
          {levels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Course Grid */}
      {loading && displayCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-govText-border space-y-4 shadow-sm">
          <Loader2 className="w-8 h-8 text-govTeal-600 animate-spin mx-auto" />
          <p className="text-xs text-govText-secondary">Loading official courses from repository...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-govText-border space-y-4">
          <GraduationCap className="w-12 h-12 text-govTeal-400 mx-auto" />
          <h3 className="text-base font-bold text-govText-primary">No courses match your criteria</h3>
          <p className="text-xs text-govText-secondary max-w-sm mx-auto">
            Try adjusting your search query or reset the filters to see all available national courses.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedLevel('all');
            }}
            className="px-4 py-2 bg-govTeal-600 text-white text-xs font-bold rounded-xl hover:bg-govTeal-700 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const enrollment = userEnrollments.find(e => e.courseId === course.id);
            const cert = userCerts.find((c: any) => c.courseId === course.id);

            return (
              <CourseCard
                key={course.id}
                course={course}
                enrollment={enrollment}
                certificate={cert}
                currentLanguage={currentLanguage}
                onSelect={(id) => {
                  if (enrollment) {
                    navigate('course_player', { courseId: id });
                  } else {
                    navigate('course_detail', { courseId: id });
                  }
                }}
                onEnroll={handleRegister}
                isEnrolling={enrollingCourseId === course.id}
                continueLabel="Continue Course"
                startLabel="Register / Enroll"
              />
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
