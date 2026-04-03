/* ─── Lesson Plan ─────────────────────────────────────────────────────────── */

export interface LessonStage {
  number: number
  name: string
  duration_minutes: number
  teacher_activity: string
  student_activity: string
  methods_and_forms: string
  notes?: string
}

export interface LessonPlanResult {
  title: string
  subject: string
  grade: number
  lesson_type: string
  lesson_form: string
  duration_minutes: number
  goals: {
    educational: string
    developmental: string
    upbringing: string
  }
  planned_results: {
    subject: string
    meta_subject: string
    personal: string
  }
  equipment: string[]
  stages: LessonStage[]
  homework?: string
  self_analysis_questions: string[]
}

/* ─── Quiz ────────────────────────────────────────────────────────────────── */

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer";

export interface Question {
  number: number;
  type: QuestionType;
  text: string;
  options?: string[];
  answer: string | string[];
  explanation: string;
}

export interface QuizResult {
  title: string;
  subject: string;
  grade: number;
  topic: string;
  questions: Question[];
}
