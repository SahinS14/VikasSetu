/**
 * src/lib/assessmentEngine.ts
 * Reusable Assessment Engine with Stable Question and Option IDs.
 * Single source of truth for answer validation, scoring, and question statuses.
 */

export interface AssessmentOption {
  id: string;          // e.g. "q-dairy-1-a"
  text: string;        // Localized or default display text
  textHi?: string;
  textMr?: string;
}

export interface AssessmentQuestion {
  id: string;          // Stable question ID
  question: string;
  questionHi?: string;
  questionMr?: string;
  options: AssessmentOption[];
  correctOptionId: string; // Stable option ID that is correct
  explanation?: {
    en?: string;
    hi?: string;
    mr?: string;
  };
}

export type QuestionAnswerStatus = 'correct' | 'incorrect' | 'unanswered';

export interface QuestionValidationResult {
  questionId: string;
  selectedOptionId?: string;
  correctOptionId: string;
  isCorrect: boolean;
  status: QuestionAnswerStatus;
}

export interface AssessmentResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  scorePercentage: number;
  passingScore: number;
  passed: boolean;
  questionResults: Record<string, QuestionValidationResult>;
}

const OPTION_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * Normalizes any question data (legacy index-based or new object-based)
 * to guarantee stable question ID, stable option IDs, and correctOptionId.
 */
export function normalizeQuestion(rawQ: any, lang: 'en' | 'hi' | 'mr' = 'en'): AssessmentQuestion {
  const qId = String(rawQ.id || 'q');

  let normalizedOptions: AssessmentOption[] = [];

  // If explicit optionList is provided
  if (Array.isArray(rawQ.optionList) && rawQ.optionList.length > 0) {
    normalizedOptions = rawQ.optionList.map((opt: any, idx: number) => {
      const optId = String(opt.id || `${qId}-${OPTION_LETTERS[idx] || idx}`);
      const textEn = opt.text || opt.optionText || opt.en || '';
      const textHi = opt.textHi || opt.optionTextHi;
      const textMr = opt.textMr || opt.optionTextMr;
      const displayText = (lang === 'hi' ? (textHi || textEn) : lang === 'mr' ? (textMr || textEn) : textEn) || textEn || '';
      return {
        id: optId,
        text: displayText,
        textHi,
        textMr,
      };
    });
  } else if (Array.isArray(rawQ.options)) {
    // Array of strings or objects
    normalizedOptions = rawQ.options.map((opt: any, idx: number) => {
      const optId = (typeof opt === 'object' && opt.id) ? String(opt.id) : `${qId}-${OPTION_LETTERS[idx] || idx}`;
      let text = '';
      let textHi: string | undefined;
      let textMr: string | undefined;

      if (typeof opt === 'string') {
        text = opt;
      } else if (typeof opt === 'object' && opt !== null) {
        textHi = opt.textHi || opt.optionTextHi;
        textMr = opt.textMr || opt.optionTextMr;
        const textEn = opt.text || opt.optionText || opt.en || opt[lang] || '';
        text = (
          lang === 'hi'
            ? (textHi || textEn)
            : lang === 'mr'
            ? (textMr || textEn)
            : textEn
        ) || textEn || textHi || textMr || '';
      }

      return {
        id: optId,
        text,
        textHi,
        textMr,
      };
    });
  } else if (rawQ.options && typeof rawQ.options === 'object') {
    // Legacy localized options shape: { en: string[], hi?: string[], mr?: string[] }
    const enOpts: string[] = rawQ.options.en || [];
    const hiOpts: string[] = rawQ.options.hi || [];
    const mrOpts: string[] = rawQ.options.mr || [];
    const count = Math.max(enOpts.length, hiOpts.length, mrOpts.length);

    for (let i = 0; i < count; i++) {
      const optId = `${qId}-${OPTION_LETTERS[i] || i}`;
      const text = (lang === 'hi' ? hiOpts[i] : lang === 'mr' ? mrOpts[i] : enOpts[i]) || enOpts[i] || '';
      normalizedOptions.push({
        id: optId,
        text,
        textHi: hiOpts[i],
        textMr: mrOpts[i],
      });
    }
  }

  // Derive stable correctOptionId
  let correctOptionId = rawQ.correctOptionId ? String(rawQ.correctOptionId) : undefined;
  if (!correctOptionId && Array.isArray(rawQ.options)) {
    const correctOpt = rawQ.options.find((o: any) => typeof o === 'object' && o !== null && o.isCorrect);
    if (correctOpt) {
      correctOptionId = String(correctOpt.id);
    }
  }

  if (!correctOptionId && typeof rawQ.correctOptionIndex === 'number') {
    if (normalizedOptions[rawQ.correctOptionIndex]) {
      correctOptionId = normalizedOptions[rawQ.correctOptionIndex].id;
    } else {
      correctOptionId = `${qId}-${OPTION_LETTERS[rawQ.correctOptionIndex] || rawQ.correctOptionIndex}`;
    }
  }

  // Fallback if still empty
  if (!correctOptionId && normalizedOptions.length > 0) {
    correctOptionId = normalizedOptions[0].id;
  }

  const rawTextEn = rawQ.question || rawQ.questionText || rawQ.title || '';
  const rawTextHi = rawQ.questionHi || rawQ.questionTextHi;
  const rawTextMr = rawQ.questionMr || rawQ.questionTextMr;

  const questionText = (
    lang === 'hi'
      ? (rawTextHi || rawTextEn)
      : lang === 'mr'
      ? (rawTextMr || rawTextEn)
      : rawTextEn
  ) || rawTextEn || rawTextHi || rawTextMr || '';

  return {
    id: qId,
    question: questionText,
    questionHi: rawTextHi,
    questionMr: rawTextMr,
    options: normalizedOptions,
    correctOptionId: correctOptionId || `${qId}-a`,
    explanation: rawQ.explanation || (rawQ.explanationEn ? { en: rawQ.explanationEn, hi: rawQ.explanationHi, mr: rawQ.explanationMr } : undefined),
  };
}

/**
 * Pure scoring and validation function.
 * Validates selected answer options against correctOptionIds.
 */
export function gradeAssessment(
  questions: AssessmentQuestion[],
  selectedAnswers: Record<string, string>, // questionId -> selectedOptionId
  passingScore: number = 80
): AssessmentResult {
  const totalQuestions = questions.length;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unansweredCount = 0;
  const questionResults: Record<string, QuestionValidationResult> = {};

  questions.forEach((q) => {
    const selectedOptionId = selectedAnswers[q.id];
    const isAnswered = selectedOptionId !== undefined && selectedOptionId !== null && selectedOptionId.trim() !== '';
    const isCorrect = isAnswered && selectedOptionId === q.correctOptionId;

    let status: QuestionAnswerStatus = 'unanswered';
    if (!isAnswered) {
      status = 'unanswered';
      unansweredCount += 1;
    } else if (isCorrect) {
      status = 'correct';
      correctAnswers += 1;
    } else {
      status = 'incorrect';
      incorrectAnswers += 1;
    }

    questionResults[q.id] = {
      questionId: q.id,
      selectedOptionId,
      correctOptionId: q.correctOptionId,
      isCorrect,
      status,
    };
  });

  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = scorePercentage >= passingScore;

  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredCount,
    scorePercentage,
    passingScore,
    passed,
    questionResults,
  };
}
