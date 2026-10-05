import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  RotateCcw,
  BookOpen,
  Loader2,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  X,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { SimulatedBadge } from '../../components/common/SimulatedBadge';
import { api } from '../../lib/api';
import { Certificate } from '../../types';
import { downloadCertificatePdf } from '../../utils/certificateGenerator';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  text: string;
  optionIndex: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionIndex: number; // 0-based index from DB — always authoritative
  explanation?: { en?: string; hi?: string; mr?: string };
}

interface QuestionResult {
  questionId: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  selectedOptionId: string;
  correctOptionId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates and extracts quiz data from raw API payload.
 * Returns null if the payload is missing required fields.
 */
function extractQuiz(raw: any): {
  id: string;
  title: string;
  passThreshold: number;
  questions: QuizQuestion[];
  latestAttempt?: any;
  certificate?: any;
  allLessonsCompleted?: boolean;
  certificateEligible?: boolean;
  totalLessons?: number;
  completedLessonsCount?: number;
} | null {
  if (!raw || !raw.id) return null;

  let rawQuestions = raw.questions;
  if (typeof rawQuestions === 'string') {
    try { rawQuestions = JSON.parse(rawQuestions); } catch { return null; }
  }
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) return null;

  const questions: QuizQuestion[] = [];
  for (const q of rawQuestions) {
    if (!q || !q.id) continue;

    // Question text
    const questionText = q.question || q.questionText || '';
    if (!questionText) continue;

    // Options — must be an array of objects with id and text
    const rawOpts = Array.isArray(q.options) ? q.options : [];
    if (rawOpts.length === 0) continue;

    const options: QuizOption[] = rawOpts.map((opt: any, idx: number) => ({
      id: String(opt.id || `${q.id}-opt-${idx}`),
      text: opt.text || opt.optionText || opt.en || '',
      optionIndex: typeof opt.optionIndex === 'number' ? opt.optionIndex : idx,
    }));

    // correctOptionIndex must be a valid number
    const correctIdx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : -1;
    if (correctIdx < 0 || correctIdx >= options.length) {
      console.warn(`[QuizView] Question ${q.id} has invalid correctOptionIndex=${correctIdx}, skipping`);
      continue;
    }

    questions.push({
      id: q.id,
      question: questionText,
      options,
      correctOptionIndex: correctIdx,
      explanation: q.explanation || (q.explanationEn ? { en: q.explanationEn } : undefined),
    });
  }

  if (questions.length === 0) return null;

  return {
    id: raw.id,
    title: raw.title || 'Module Assessment',
    passThreshold: typeof raw.passThreshold === 'number' ? raw.passThreshold : 75,
    questions,
    latestAttempt: raw.latestAttempt || null,
    certificate: raw.certificate || null,
    allLessonsCompleted: raw.allLessonsCompleted,
    certificateEligible: raw.certificateEligible,
    totalLessons: raw.totalLessons,
    completedLessonsCount: raw.completedLessonsCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// State machine phases
// ─────────────────────────────────────────────────────────────────────────────
type Phase = 'answering' | 'feedback' | 'result';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const QuizView: React.FC = () => {
  const { courses, activeViewParams, navigate, submitQuiz: contextSubmitQuiz, currentLanguage, t } = useApp();

  const courseId = activeViewParams?.courseId || courses[0]?.id;
  const moduleId = activeViewParams?.moduleId;

  const course = useMemo(() => {
    return courses.find((c) => c.id === courseId) || null;
  }, [courses, courseId]);

  const currentModule = useMemo(() => {
    if (!course?.modules || course.modules.length === 0) return null;
    if (moduleId) {
      const found = course.modules.find((m: any) => m.id === moduleId);
      if (found) return found;
    }
    return course.modules[0];
  }, [course, moduleId]);

  // ── Quiz identifier (for API fetch only — localQuiz is NOT used as data source)
  const localQuiz = currentModule?.quiz;
  const quizIdentifier = useMemo(() => {
    if (activeViewParams?.quizId) return activeViewParams.quizId;
    if (localQuiz?.id) return localQuiz.id;
    if (moduleId) return moduleId;
    if (courseId) {
      if (courseId.includes('dairy')) return 'quiz-dairy-m1';
      if (courseId.includes('pacs')) return 'quiz-pacs-m1';
      if (courseId.includes('shg')) return 'quiz-shg-m1';
    }
    return 'quiz-dairy-m1';
  }, [activeViewParams?.quizId, localQuiz?.id, moduleId, courseId]);

  // ── Quiz data state — always from API, never from seed data
  const [quiz, setQuiz] = useState<ReturnType<typeof extractQuiz>>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    setLoadingQuiz(true);
    setQuizError(null);
    setQuiz(null);

    if (!quizIdentifier) {
      setLoadingQuiz(false);
      return;
    }

    api.learning
      .getQuiz(quizIdentifier)
      .then((res) => {
        if (isCancelled) return;
        const extracted = extractQuiz(res);
        if (extracted) {
          setQuiz(extracted);
        } else {
          console.warn('[QuizView] API returned invalid quiz payload for:', quizIdentifier);
          setQuizError('Assessment questions could not be loaded. Please try again.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn('[QuizView] Failed to fetch quiz from server, checking local fallback:', err);
        if (localQuiz) {
          const extracted = extractQuiz(localQuiz);
          if (extracted) {
            setQuiz(extracted);
            return;
          }
        }
        setQuizError('Unable to load assessment. Please check your connection and try again.');
      })
      .finally(() => {
        if (!isCancelled) setLoadingQuiz(false);
      });

    return () => { isCancelled = true; };
  }, [quizIdentifier, retryKey, localQuiz]);

  // ── Quiz state machine
  const [phase, setPhase] = useState<Phase>('answering');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // selectedOptionIndex: null = no selection made yet, number = user's choice (0-based)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  // Per-question results built as user progresses
  const [questionResults, setQuestionResults] = useState<Record<string, QuestionResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Certificate & Eligibility states
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [allLessonsCompleted, setAllLessonsCompleted] = useState<boolean>(true);
  const [certificateEligible, setCertificateEligible] = useState<boolean>(false);
  const [isPreparingCert, setIsPreparingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Reset or restore quiz state when quiz data changes
  useEffect(() => {
    if (quiz) {
      if (quiz.allLessonsCompleted !== undefined) {
        setAllLessonsCompleted(Boolean(quiz.allLessonsCompleted));
      }
      if (quiz.certificateEligible !== undefined) {
        setCertificateEligible(Boolean(quiz.certificateEligible));
      }
    }

    if (quiz?.latestAttempt?.passed) {
      // Restore results from prior verified passing attempt
      const restoredResults: Record<string, QuestionResult> = {};
      quiz.questions.forEach((q) => {
        const a = quiz.latestAttempt.answers?.find((ans: any) => ans.questionId === q.id);
        if (a) {
          const optIdx =
            a.selectedOptionIndex >= 0
              ? a.selectedOptionIndex
              : q.options.findIndex((o) => o.id === a.selectedOptionId);
          restoredResults[q.id] = {
            questionId: q.id,
            selectedOptionIndex: optIdx >= 0 ? optIdx : 0,
            correctOptionIndex: q.correctOptionIndex,
            isCorrect: a.isCorrect,
            selectedOptionId: a.selectedOptionId,
            correctOptionId: q.options[q.correctOptionIndex]?.id || '',
          };
        }
      });
      setQuestionResults(restoredResults);
      setPhase('result');
      if (quiz.certificateEligible && quiz.certificate) {
        setCertificate(quiz.certificate);
      } else {
        setCertificate(null);
      }
    } else {
      setPhase('answering');
      setCurrentQuestionIndex(0);
      setSelectedOptionIndex(null);
      setQuestionResults({});
    }
    setIsSubmitting(false);
    setIsPreparingCert(false);
    setCertError(null);
    setShowCertModal(false);
  }, [quiz?.id]);

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / Error guards
  // ─────────────────────────────────────────────────────────────────────────
  if (loadingQuiz) {
    return (
      <PageContainer>
        <div className="bg-white rounded-2xl p-12 text-center border border-govText-border space-y-4 shadow-sm">
          <Loader2 className="w-10 h-10 text-govTeal-600 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-govText-primary">Loading Assessment Questions...</h2>
          <p className="text-xs text-govText-secondary">Fetching official examination questions from the NCCT repository.</p>
        </div>
      </PageContainer>
    );
  }

  if (quizError) {
    return (
      <PageContainer>
        <div className="bg-white rounded-2xl p-10 text-center border border-rose-200 space-y-4 shadow-sm">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-govText-primary">Unable to Load Assessment</h2>
          <p className="text-xs text-govText-secondary">{quizError}</p>
          <button
            onClick={() => { setQuizError(null); setRetryKey(k => k + 1); }}
            className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </PageContainer>
    );
  }

  if (!quiz) {
    return (
      <PageContainer>
        <div className="bg-white rounded-2xl p-10 text-center border border-govText-border space-y-4 shadow-sm">
          <BookOpen className="w-12 h-12 text-govTeal-400 mx-auto" />
          <h2 className="text-lg font-bold text-govText-primary">No Assessment Available</h2>
          <p className="text-xs text-govText-secondary">This module does not require a graded assessment or the quiz is currently being updated.</p>
          <button onClick={() => navigate('course_player', { courseId: course?.id || courseId })} className="px-4 py-2 bg-govTeal-600 hover:bg-govTeal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
            Back to Course Lessons
          </button>
        </div>
      </PageContainer>
    );
  }

  const { questions, passThreshold } = quiz;
  const totalQuestions = questions.length;

  // ─────────────────────────────────────────────────────────────────────────
  // Per-question grading logic
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Grade a single answer. Uses correctOptionIndex from the DB (via API).
   * selectedIdx must be a valid 0-based option index.
   * Returns true only if selectedIdx === correctOptionIndex (strict equality).
   */
  function gradeAnswer(question: QuizQuestion, selectedIdx: number): boolean {
    if (selectedIdx === null || selectedIdx === undefined) return false;
    return Number(selectedIdx) === Number(question.correctOptionIndex);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Final result calculation
  // ─────────────────────────────────────────────────────────────────────────
  function calcFinalResult() {
    const results = Object.values(questionResults);
    const correctCount = results.filter(r => r.isCorrect).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = score >= passThreshold;
    return { correctCount, total, score, passed };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];
  const currentResult = questionResults[currentQuestion?.id];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  /** User clicks an option during answering phase */
  const handleSelectOption = (optIdx: number) => {
    if (phase !== 'answering') return;
    setSelectedOptionIndex(optIdx);
  };

  /** User clicks "Next" — validate and show feedback */
  const handleNext = () => {
    if (phase !== 'answering' || selectedOptionIndex === null || !currentQuestion) return;

    const isCorrect = gradeAnswer(currentQuestion, selectedOptionIndex);
    const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];
    const selectedOpt = currentQuestion.options[selectedOptionIndex];

    const result: QuestionResult = {
      questionId: currentQuestion.id,
      selectedOptionIndex,
      correctOptionIndex: currentQuestion.correctOptionIndex,
      isCorrect,
      selectedOptionId: selectedOpt?.id || '',
      correctOptionId: correctOpt?.id || '',
    };

    setQuestionResults(prev => ({ ...prev, [currentQuestion.id]: result }));
    setPhase('feedback');
  };

  /** User clicks "Continue" after seeing feedback */
  const handleContinue = async () => {
    if (phase !== 'feedback') return;

    if (isLastQuestion) {
      // All questions done — submit to backend for authoritative record
      await handleFinalSubmit();
    } else {
      // Move to next question
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOptionIndex(null);
      setPhase('answering');
    }
  };

  /** Submit to backend and show final result */
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCertError(null);

    const { correctCount, total, score, passed } = calcFinalResult();

    if (passed) {
      setIsPreparingCert(true);
    }

    // Build the answers map: questionId → selectedOptionId (for backend grading record)
    const answersForBackend: Record<string, string> = {};
    Object.values(questionResults).forEach(r => {
      answersForBackend[r.questionId] = r.selectedOptionId;
    });

    try {
      const serverRes = await api.learning.submitQuiz(quiz.id, answersForBackend);

      if (serverRes) {
        if (serverRes.allLessonsCompleted !== undefined) {
          setAllLessonsCompleted(Boolean(serverRes.allLessonsCompleted));
        }
        if (serverRes.certificateEligible !== undefined) {
          setCertificateEligible(Boolean(serverRes.certificateEligible));
        }

        if (serverRes.certificateEligible && serverRes.certificate) {
          setCertificate(serverRes.certificate);
        } else {
          setCertificate(null);
        }
      }

      if (serverRes?.passed || score > 0) {
        try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch { /* noop */ }
      }

      // Also notify context for course progress update
      const rawAnswers = questions.map(q => {
        const r = questionResults[q.id];
        return r ? r.selectedOptionIndex : -1;
      });
      await contextSubmitQuiz(course?.id || courseId, quiz.id, rawAnswers, serverRes);
    } catch (e) {
      console.warn('[QuizView] Backend submission failed, showing local result:', e);
      if (passed && allLessonsCompleted) {
        setCertError('Certificate could not be prepared. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setIsPreparingCert(false);
    }

    if (calcFinalResult().passed) {
      try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } }); } catch { /* noop */ }
    }
    setPhase('result');
  };

  /** Retry — reset everything */
  const handleRetry = () => {
    setPhase('answering');
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setQuestionResults({});
    setIsSubmitting(false);
    setIsPreparingCert(false);
    setCertError(null);
    setShowCertModal(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived display values
  // ─────────────────────────────────────────────────────────────────────────
  const courseTitle = currentLanguage === 'hi' ? course?.titleHi : currentLanguage === 'mr' ? course?.titleMr : course?.title;
  const answeredCount = Object.keys(questionResults).length + (phase === 'feedback' ? 0 : 0);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: RESULT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const { correctCount, total, score, passed } = calcFinalResult();
    return (
      <PageContainer>
        {/* Header */}
        <div className="bg-white p-5 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <button onClick={() => navigate('course_player', { courseId: course?.id || courseId })} className="inline-flex items-center gap-1.5 text-xs font-bold text-govTeal-700 hover:text-govTeal-900 mb-2 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /><span>Return to Lessons</span>
            </button>
            <h1 className="text-xl font-extrabold text-govText-primary">{quiz.title}</h1>
          </div>
        </div>

        {/* Score Banner */}
        <div className={`p-5 sm:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn ${passed ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {passed ? <Award className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold">
                {passed ? (t.quiz?.congratulations || 'Congratulations! You Passed the Assessment') : (t.quiz?.failedBadge || 'Assessment Score Below Threshold')}
              </h3>
              <p className="text-xs mt-0.5 opacity-90">
                You answered <span className="font-extrabold">{correctCount} of {total}</span> questions correctly.
                Score: <span className="font-extrabold text-base">{score}%</span> (Passing: {passThreshold}%)
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {passed ? (
              certificateEligible ? (
                <>
                  {isPreparingCert ? (
                    <button
                      disabled
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-emerald-800/70 text-white/80 font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing Certificate...</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (certificate?.id) {
                          navigate('certificates', { certId: certificate.id });
                        } else {
                          navigate('certificates');
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Certificate</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('course_detail', { courseId: course?.id || courseId })}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-white border border-emerald-300 text-emerald-900 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('course_player', { courseId: course?.id || courseId })}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-govTeal-700 hover:bg-govTeal-800 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Continue to Lessons</span>
                </button>
              )
            ) : (
              <button
                onClick={handleRetry}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.quiz?.retry || 'Retry Assessment'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Certificate Locked Banner (Passed assessment, but incomplete lessons) */}
        {passed && !certificateEligible && (
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 p-4 sm:p-5 rounded-2xl shadow-xs flex items-start gap-3.5 animate-fadeIn">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-amber-950">Certificate Locked</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">Action Required</span>
              </div>
              <p className="text-xs text-amber-900 mt-1 font-medium">
                Complete all required lessons to earn your certificate.
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                You scored {score}% on the assessment, meeting the ≥{passThreshold}% threshold. However, NCCT accreditation requires 100% lesson curriculum completion before the verified certificate can be generated.
              </p>
            </div>
          </div>
        )}

        {/* Certificate Error Banner */}
        {certError && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-fadeIn">
            <span>{certError}</span>
            <button
              onClick={() => {
                setCertError(null);
                setIsPreparingCert(true);
                api.certificates.mine().then((certs) => {
                  const matching = certs.find(
                    (c: any) => c.courseId === (course?.id || courseId)
                  );
                  if (matching) setCertificate(matching);
                }).catch(() => {
                  setCertError('Certificate could not be prepared. Please try again.');
                }).finally(() => {
                  setIsPreparingCert(false);
                });
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Per-question result review */}
        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const r = questionResults[q.id];
            if (!r) return null;
            const selectedOpt = q.options[r.selectedOptionIndex];
            const correctOpt = q.options[r.correctOptionIndex];

            return (
              <div key={q.id} className={`bg-white rounded-2xl p-4 sm:p-6 border shadow-sm space-y-4 ${r.isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-govTeal-100 text-govTeal-900 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{qIdx + 1}</span>
                    <div>
                      <span className="text-[11px] font-bold text-saffron-700 tracking-wider uppercase block mb-0.5">Question {qIdx + 1} of {totalQuestions}</span>
                      <h3 className="font-bold text-xs sm:text-sm text-govText-primary leading-snug">{q.question}</h3>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {r.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />Incorrect
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pl-0 sm:pl-10">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = optIdx === r.selectedOptionIndex;
                    const isCorrect = optIdx === r.correctOptionIndex;
                    let cls = 'border-gray-200 opacity-60 text-gray-500';
                    if (isCorrect && isSelected) cls = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                    else if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                    else if (isSelected) cls = 'border-rose-400 bg-rose-50 text-rose-950';
                    return (
                      <div key={opt.id} className={`w-full min-h-[44px] p-3 rounded-xl border text-xs text-left flex items-center justify-between gap-2 ${cls}`}>
                        <span className="leading-snug">{opt.text}</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isCorrect ? 'border-emerald-600 bg-emerald-600' : isSelected ? 'border-rose-600 bg-rose-600' : 'border-gray-300'}`}>
                          {(isSelected || isCorrect) && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: ANSWERING or FEEDBACK (one question at a time)
  // ─────────────────────────────────────────────────────────────────────────
  if (!currentQuestion) return null;

  const feedbackResult = phase === 'feedback' ? questionResults[currentQuestion.id] : null;
  const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-govText-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('course_player', { courseId: course?.id || courseId })} className="inline-flex items-center gap-1.5 text-xs font-bold text-govTeal-700 hover:text-govTeal-900 mb-2 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /><span>Return to Lessons</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-saffron-700 uppercase tracking-wider">{courseTitle || 'Course'}</span>
            <SimulatedBadge text="NCCT Module Assessment" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-govText-primary mt-1">
            {quiz.title || 'Module Competency Assessment'}
          </h1>
          <p className="text-xs text-govText-secondary mt-1">
            Minimum passing score: <span className="font-bold text-govTeal-800">{passThreshold}%</span>
          </p>
        </div>
        <div className="bg-govBg border border-govTeal-100 px-4 py-2.5 rounded-xl text-xs flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-govTeal-600" />
          <span className="font-semibold text-govText-primary">{totalQuestions} Questions</span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-govText-border shadow-sm p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-govText-secondary">
          <span>Progress</span>
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-govTeal-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + (phase === 'feedback' ? 1 : 0)) / totalQuestions) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          {questions.map((q, idx) => {
            const r = questionResults[q.id];
            const isCurrent = idx === currentQuestionIndex;
            const isDone = !!r;
            return (
              <div
                key={q.id}
                title={`Question ${idx + 1}${r ? (r.isCorrect ? ' ✓' : ' ✗') : ''}`}
                className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all border flex items-center justify-center ${
                  isCurrent
                    ? 'bg-govTeal-600 text-white border-govTeal-600 scale-110'
                    : isDone && r!.isCorrect
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isDone
                    ? 'bg-rose-400 text-white border-rose-400'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className={`bg-white rounded-2xl p-5 sm:p-8 border shadow-sm space-y-6 transition-all ${phase === 'feedback' ? (feedbackResult?.isCorrect ? 'border-emerald-300' : 'border-rose-300') : 'border-govText-border'}`}>
        {/* Question header */}
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-lg bg-govTeal-100 text-govTeal-900 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
            {currentQuestionIndex + 1}
          </span>
          <div>
            <span className="text-[11px] font-bold text-saffron-700 tracking-wider uppercase block mb-1">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <h3 className="font-bold text-sm sm:text-base text-govText-primary leading-snug">
              {currentQuestion.question}
            </h3>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2.5 pl-0 sm:pl-11">
          {currentQuestion.options.map((opt, optIdx) => {
            const isSelected = selectedOptionIndex === optIdx;
            const isCorrectOpt = optIdx === currentQuestion.correctOptionIndex;

            let optClass = 'border-gray-200 hover:bg-gray-50 text-govText-primary';
            let dotClass = 'border-gray-300';

            if (phase === 'feedback') {
              // Read-only in feedback phase
              if (isCorrectOpt && isSelected) {
                optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                dotClass = 'border-emerald-600 bg-emerald-600';
              } else if (isCorrectOpt) {
                optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                dotClass = 'border-emerald-600 bg-emerald-600';
              } else if (isSelected) {
                optClass = 'border-rose-400 bg-rose-50 text-rose-950';
                dotClass = 'border-rose-600 bg-rose-600';
              } else {
                optClass = 'border-gray-200 opacity-50 text-gray-500';
              }
            } else {
              // Answering phase
              if (isSelected) {
                optClass = 'border-govTeal-600 bg-govTeal-50 text-govTeal-950 font-bold shadow-xs';
                dotClass = 'border-govTeal-600 bg-govTeal-600';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={phase === 'feedback'}
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full min-h-[48px] p-3 sm:p-3.5 rounded-xl border text-xs text-left flex items-center justify-between gap-2 transition-all ${phase === 'feedback' ? 'cursor-default' : 'cursor-pointer'} ${optClass}`}
              >
                <span className="leading-snug">{opt.text}</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${dotClass}`}>
                  {(isSelected || (phase === 'feedback' && isCorrectOpt)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback message */}
        {phase === 'feedback' && feedbackResult && (
          <div className={`rounded-xl p-4 border ${feedbackResult.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            <div className="flex items-center gap-2 mb-1">
              {feedbackResult.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-bold text-xs">
                {feedbackResult.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
              </span>
            </div>
            {!feedbackResult.isCorrect && correctOpt && (
              <p className="text-xs mt-0.5 ml-6">
                The correct answer is: <span className="font-bold">{correctOpt.text}</span>
              </p>
            )}
            {currentQuestion.explanation?.en && (
              <p className="text-xs mt-1.5 ml-6 opacity-80">{currentQuestion.explanation.en}</p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs text-govText-secondary">
            {phase === 'answering' && selectedOptionIndex === null && (
              <span className="text-amber-600 font-medium">Select an option to continue</span>
            )}
            {phase === 'answering' && selectedOptionIndex !== null && (
              <span className="text-govTeal-700 font-medium">Option selected — click Next to confirm</span>
            )}
          </div>

          {phase === 'answering' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={selectedOptionIndex === null}
              className={`inline-flex items-center gap-1.5 px-6 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-all shadow ${
                selectedOptionIndex !== null
                  ? 'bg-govTeal-600 hover:bg-govTeal-700 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-6 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-all shadow ${
                isSubmitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isLastQuestion
                  ? 'bg-govTeal-700 hover:bg-govTeal-800 text-white cursor-pointer'
                  : 'bg-govTeal-600 hover:bg-govTeal-700 text-white cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
              ) : isLastQuestion ? (
                <><Award className="w-4 h-4" />View Results</>
              ) : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
