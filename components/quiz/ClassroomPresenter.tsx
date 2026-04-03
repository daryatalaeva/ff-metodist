"use client";

import { useState, useEffect, useCallback } from "react";
import type { QuizResult, Question } from "@/lib/types";
import PresentationQuestion from "./PresentationQuestion";
import PresentationResult from "./PresentationResult";

/* ─── Answer checking ─── */

function checkAnswer(question: Question, answer: string | string[]): boolean {
  switch (question.type) {
    case "single_choice":
    case "true_false":
      return answer === question.answer;
    case "multiple_choice": {
      const given = Array.isArray(answer) ? [...answer].sort() : [answer];
      const expected = Array.isArray(question.answer)
        ? [...question.answer].sort()
        : [question.answer];
      return JSON.stringify(given) === JSON.stringify(expected);
    }
    case "short_answer": {
      const a = Array.isArray(answer) ? answer[0] : answer;
      const e = Array.isArray(question.answer) ? question.answer[0] : question.answer;
      return a.trim().toLowerCase() === e.trim().toLowerCase();
    }
    default:
      return false;
  }
}

/* ─── Main component ─── */

export default function ClassroomPresenter({ quiz }: { quiz: QuizResult }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null);
  const [score, setScore] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<number[]>([]);
  const [phase, setPhase] = useState<"question" | "results">("question");

  const question = quiz.questions[currentIndex];

  function handleAnswerSelect(answer: string | string[]) {
    if (isAnswerShown) return;
    const correct = checkAnswer(question, answer);
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setWrongQuestions((q) => [...q, currentIndex]);
    }
    setSelectedAnswer(answer);
    setIsAnswerShown(true);
  }

  const handleNext = useCallback(() => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsAnswerShown(false);
      setSelectedAnswer(null);
    } else {
      setPhase("results");
    }
  }, [currentIndex, quiz.questions.length]);

  function handleRestart() {
    setCurrentIndex(0);
    setIsAnswerShown(false);
    setSelectedAnswer(null);
    setScore(0);
    setWrongQuestions([]);
    setPhase("question");
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (isAnswerShown) handleNext();
      }
      if (!isAnswerShown && question?.type === "single_choice") {
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx !== -1 && question.options?.[idx] !== undefined) {
          handleAnswerSelect(question.options[idx]);
        }
      }
      if (e.key === "f" || e.key === "F") {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswerShown, handleNext, question]);

  if (phase === "results") {
    return (
      <PresentationResult
        score={score}
        totalQuestions={quiz.questions.length}
        wrongQuestions={wrongQuestions}
        questions={quiz.questions}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <PresentationQuestion
      question={question}
      isAnswerShown={isAnswerShown}
      selectedAnswer={selectedAnswer}
      questionNumber={currentIndex + 1}
      totalQuestions={quiz.questions.length}
      score={score}
      onAnswerSelect={handleAnswerSelect}
      onNext={handleNext}
    />
  );
}

