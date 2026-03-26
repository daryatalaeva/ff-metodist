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
  format: string;
  questions: Question[];
}
