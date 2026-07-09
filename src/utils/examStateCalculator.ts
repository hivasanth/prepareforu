import type { Question, AttemptAnswer } from '../types/exam.types';

export interface QuestionState {
  questionId: string;
  index: number;
  isCurrent: boolean;
  isAnswered: boolean;
  isMarked: boolean;
  isVisited: boolean;
  isSkipped: boolean;
  isNotVisited: boolean;
  selectedAnswer: string | null;
}

export interface AnswerStatus {
  isCorrect: boolean | null;
  isSkipped: boolean;
  isNotVisited: boolean;
  status: 'correct' | 'wrong' | 'skipped' | 'not_visited';
}

export interface ExamStatistics {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  skipped: number;
  marked: number;
  visited: number;
  notVisited: number;
  score: number;
  accuracy: number;
  timeTaken: number;
}

export function computeQuestionState(
  questionId: string,
  index: number,
  currentIdx: number,
  selectedAnswers: Record<string, string | null>,
  markedForReview: Set<string>,
  visitedQuestions: Set<string>,
): QuestionState {
  const isCurrent = index === currentIdx;
  const selectedAnswer = selectedAnswers[questionId] !== undefined ? selectedAnswers[questionId] : null;
  const isAnswered = selectedAnswer !== null;
  const isMarked = markedForReview.has(questionId);
  const isVisited = visitedQuestions.has(questionId);
  const isSkipped = isVisited && !isAnswered && !isMarked;
  const isNotVisited = !isVisited;

  return { questionId, index, isCurrent, isAnswered, isMarked, isVisited, isSkipped, isNotVisited, selectedAnswer };
}

export function computeQuestionStates(
  questions: Question[],
  currentIdx: number,
  selectedAnswers: Record<string, string | null>,
  markedForReview: Set<string>,
  visitedQuestions: Set<string>,
): QuestionState[] {
  return questions.map((q, i) =>
    computeQuestionState(q.id, i, currentIdx, selectedAnswers, markedForReview, visitedQuestions)
  );
}

export function computeAnswerStatus(answer: AttemptAnswer | undefined | null): AnswerStatus {
  const isCorrect = answer?.is_correct === true;
  const isNotVisited = !answer || !answer.visited;
  const isSkipped = !isNotVisited && answer!.selected_option === null;
  const status = isNotVisited ? 'not_visited' : isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong';
  return { isCorrect: answer?.is_correct ?? null, isSkipped, isNotVisited, status };
}

export function convertAnswersRecord(
  questions: Question[],
  answers: Record<string, string | null>,
): AttemptAnswer[] {
  return questions.map(q => ({
    id: '',
    attempt_id: '',
    question_id: q.id,
    selected_option: answers[q.id] !== undefined ? answers[q.id] as "A" | "B" | "C" | "D" | null : null,
    correct_option: q.correct_option,
    is_correct: answers[q.id] !== undefined && answers[q.id] !== null ? answers[q.id] === q.correct_option : null,
    marks_awarded: 0,
    time_spent_secs: 0,
    visited: answers[q.id] !== undefined,
    marked_for_review: false,
    last_visited_at: null,
  }));
}

export function computeExamStatistics(
  questions: Question[],
  selectedAnswers: Record<string, string | null>,
  markedForReview: Set<string>,
  visitedQuestions: Set<string>,
  answerDetails?: AttemptAnswer[],
  durationSeconds?: number,
): ExamStatistics {
  const total = questions.length;
  let answered = 0;
  let marked = 0;
  let visited = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let score = 0;

  if (answerDetails) {
    const answerMap = new Map(answerDetails.map(a => [a.question_id, a]));
    for (const q of questions) {
      const answer = answerMap.get(q.id);
      if (!answer) continue;
      if (answer.visited) visited++;
      if (answer.marked_for_review) marked++;
      if (answer.selected_option === null) {
        if (answer.visited && !answer.marked_for_review) skipped++;
      } else if (answer.is_correct === true) {
        correct++;
        answered++;
      } else if (answer.is_correct === false) {
        wrong++;
        answered++;
      }
    }
    score = answerDetails.reduce((sum, a) => sum + a.marks_awarded, 0);
  } else {
    for (const q of questions) {
      const isAnswered = selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null;
      if (isAnswered) answered++;
      if (markedForReview.has(q.id)) marked++;
      if (visitedQuestions.has(q.id)) visited++;
    }
    skipped = visited - answered;
  }

  return {
    total,
    answered,
    correct,
    wrong,
    skipped,
    marked,
    visited,
    notVisited: total - visited,
    score,
    accuracy: answerDetails ? (total > 0 ? Math.round((correct / total) * 100) : 0) : 0,
    timeTaken: durationSeconds ?? 0,
  };
}
