"use client";

import { useState, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { Question } from "@/lib/types";

function renderWithFormulas(text: string): string {
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
    try { return katex.renderToString(formula, { displayMode: true, throwOnError: false }); }
    catch { return formula; }
  });
  text = text.replace(/\$(.+?)\$/g, (_, formula) => {
    try { return katex.renderToString(formula, { displayMode: false, throwOnError: false }); }
    catch { return formula; }
  });
  return text;
}

/* ─── Props ─── */

interface Props {
  question: Question;
  isAnswerShown: boolean;
  selectedAnswer: string | string[] | null;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  onAnswerSelect: (answer: string | string[]) => void;
  onNext: () => void;
}

/* ─── Helpers ─── */

const CYRILLIC = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К"];

function isCorrectAnswer(question: Question, candidate: string): boolean {
  const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
  return answers.some(
    (a) =>
      a === candidate ||
      a.toLowerCase() === candidate.toLowerCase()
  );
}

/* ─── Option button with hover ─── */

function OptionButton({
  label,
  letter,
  keyHint,
  state,
  disabled,
  onClick,
}: {
  label: string;
  letter?: string;
  keyHint?: string;
  state: "default" | "correct" | "wrong" | "correct-not-selected" | "dimmed" | "selected-pending";
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const styleMap: Record<typeof state, React.CSSProperties> = {
    default: {
      background: hovered && !disabled ? "#FEF0E6" : "#F3F4F6",
      border: hovered && !disabled ? "1.5px solid #F96B1B" : "1.5px solid rgba(0,0,0,0.1)",
      color: "#1A1A1A",
      opacity: 1,
    },
    "selected-pending": {
      background: "#FEF0E6",
      border: "1.5px solid #F96B1B",
      color: "#1A1A1A",
      opacity: 1,
    },
    correct: {
      background: "#22C55E",
      border: "1.5px solid #22C55E",
      color: "white",
      opacity: 1,
    },
    wrong: {
      background: "#EF4444",
      border: "1.5px solid #EF4444",
      color: "white",
      opacity: 1,
    },
    "correct-not-selected": {
      background: "#22C55E",
      border: "1.5px solid #22C55E",
      color: "white",
      opacity: 1,
    },
    dimmed: {
      background: "#F3F4F6",
      border: "1.5px solid rgba(0,0,0,0.06)",
      color: "#1A1A1A",
      opacity: 0.35,
    },
  };

  const s = styleMap[state];
  const icon = state === "correct" || state === "correct-not-selected" ? "✓" : state === "wrong" ? "✗" : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        borderRadius: 12,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        width: "100%",
        transition: "background 0.15s, border 0.15s, opacity 0.15s",
        pointerEvents: state === "dimmed" ? "none" : "auto",
        ...s,
      }}
    >
      {letter && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background:
              state === "correct" || state === "correct-not-selected"
                ? "rgba(255,255,255,0.25)"
                : state === "wrong"
                ? "rgba(255,255,255,0.25)"
                : "#E5E7EB",
            color:
              state === "correct" || state === "correct-not-selected" || state === "wrong"
                ? "white"
                : "#555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {icon ?? letter}
        </span>
      )}
      <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, flex: 1 }} dangerouslySetInnerHTML={{ __html: label }} />
      {keyHint && state === "default" && (
        <span style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginLeft: "auto" }}>
          [{keyHint}]
        </span>
      )}
      {state === "correct-not-selected" && (
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, opacity: 0.9 }}>
          Правильный ответ
        </span>
      )}
    </button>
  );
}

/* ─── Main component ─── */

export default function PresentationQuestion({
  question,
  isAnswerShown,
  selectedAnswer,
  questionNumber,
  totalQuestions,
  score,
  onAnswerSelect,
  onNext,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [shortInput, setShortInput] = useState("");

  // Reset local state when question changes
  useEffect(() => {
    setImageError(false);
    setMultiSelected([]);
    setShortInput("");
  }, [questionNumber]);

  // Hide image if it takes more than 2s to load
  useEffect(() => {
    if (!question.image_hint || imageError) return;
    const timer = setTimeout(() => setImageError(true), 2000);
    return () => clearTimeout(timer);
  }, [question.image_hint, imageError]);

  const showImage = !!question.image_hint && !imageError;
  const isLast = questionNumber === totalQuestions;

  /* ── option state helper for single_choice / true_false ── */
  function optionState(opt: string): "default" | "correct" | "wrong" | "correct-not-selected" | "dimmed" {
    if (!isAnswerShown) return "default";
    const selected = selectedAnswer === opt;
    const correct = isCorrectAnswer(question, opt);
    if (selected && correct) return "correct";
    if (selected && !correct) return "wrong";
    if (!selected && correct) return "correct-not-selected";
    return "dimmed";
  }

  /* ── option state for multiple_choice ── */
  function multiOptionState(opt: string): "default" | "correct" | "wrong" | "correct-not-selected" | "dimmed" | "selected-pending" {
    if (!isAnswerShown) {
      return multiSelected.includes(opt) ? "selected-pending" : "default";
    }
    const wasSelected = Array.isArray(selectedAnswer) && selectedAnswer.includes(opt);
    const correct = isCorrectAnswer(question, opt);
    if (wasSelected && correct) return "correct";
    if (wasSelected && !correct) return "wrong";
    if (!wasSelected && correct) return "correct-not-selected";
    return "dimmed";
  }

  /* ── short answer result ── */
  const shortAnswerCorrect =
    isAnswerShown &&
    question.type === "short_answer" &&
    typeof selectedAnswer === "string" &&
    selectedAnswer.trim().toLowerCase() ===
      String(question.answer).trim().toLowerCase();

  return (
    <div>
      {/* 1. Progress bar */}
      <div style={{ height: 4, background: "#F3F4F6", borderRadius: 99, marginBottom: 20, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${(questionNumber / totalQuestions) * 100}%`,
            background: "#F96B1B",
            borderRadius: 99,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* 2. Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
          Вопрос {questionNumber} из {totalQuestions}
        </span>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
          ✓ {score} / {totalQuestions}
        </span>
      </div>

      {/* 3 + 4. Image + Question text */}
      <div
        style={{
          display: "flex",
          flexDirection: showImage ? "row" : "column",
          gap: showImage ? 28 : 0,
          alignItems: showImage ? "flex-start" : "stretch",
          marginBottom: 28,
        }}
      >
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://source.unsplash.com/640x400/?${encodeURIComponent(question.image_hint!)}`}
            width={320}
            height={200}
            alt=""
            onError={() => setImageError(true)}
            onLoad={() => clearTimeout(undefined)}
            style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          />
        )}
        <p
          style={{
            margin: showImage ? "0" : "0",
            fontSize: 26,
            fontWeight: 800,
            color: "#1A1A1A",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}
          dangerouslySetInnerHTML={{ __html: renderWithFormulas(question.text) }}
        />
      </div>

      {/* 5. Answer options */}

      {/* single_choice */}
      {question.type === "single_choice" && question.options && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {question.options.map((opt, i) => (
            <OptionButton
              key={i}
              label={renderWithFormulas(opt)}
              letter={CYRILLIC[i]}
              keyHint={i < 4 ? String(i + 1) : undefined}
              state={optionState(opt)}
              disabled={isAnswerShown}
              onClick={() => onAnswerSelect(opt)}
            />
          ))}
        </div>
      )}

      {/* true_false */}
      {question.type === "true_false" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {(["Верно", "Неверно"] as const).map((opt) => (
            <div key={opt} style={{ flex: 1 }}>
              <OptionButton
                label={opt}
                state={optionState(opt)}
                disabled={isAnswerShown}
                onClick={() => onAnswerSelect(opt)}
              />
            </div>
          ))}
        </div>
      )}

      {/* multiple_choice */}
      {question.type === "multiple_choice" && question.options && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {question.options.map((opt, i) => (
              <OptionButton
                key={i}
                label={renderWithFormulas(opt)}
                letter={CYRILLIC[i]}
                state={multiOptionState(opt)}
                disabled={isAnswerShown}
                onClick={() => {
                  if (isAnswerShown) return;
                  setMultiSelected((prev) =>
                    prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
                  );
                }}
              />
            ))}
          </div>
          {!isAnswerShown && multiSelected.length > 0 && (
            <button
              onClick={() => onAnswerSelect(multiSelected)}
              style={{
                padding: "13px 28px",
                borderRadius: 10,
                background: "#F96B1B",
                color: "white",
                border: "none",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Подтвердить выбор
            </button>
          )}
        </div>
      )}

      {/* short_answer */}
      {question.type === "short_answer" && (
        <div style={{ marginBottom: 24 }}>
          {!isAnswerShown ? (
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={shortInput}
                onChange={(e) => setShortInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && shortInput.trim()) onAnswerSelect(shortInput.trim());
                }}
                placeholder="Введите ответ класса"
                autoFocus
                style={{
                  flex: 1,
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "1.5px solid rgba(0,0,0,0.15)",
                  fontSize: 16,
                  fontFamily: "inherit",
                  outline: "none",
                  color: "#1A1A1A",
                }}
              />
              <button
                onClick={() => shortInput.trim() && onAnswerSelect(shortInput.trim())}
                disabled={!shortInput.trim()}
                style={{
                  padding: "0 24px",
                  height: 42,
                  borderRadius: 10,
                  background: "#F96B1B",
                  color: "white",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: shortInput.trim() ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                  opacity: shortInput.trim() ? 1 : 0.5,
                }}
              >
                Проверить
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                background: shortAnswerCorrect ? "#F0FDF4" : "#FEF2F2",
                border: `1.5px solid ${shortAnswerCorrect ? "#22C55E" : "#EF4444"}`,
                fontSize: 15,
                color: "#1A1A1A",
              }}
            >
              <span style={{ fontWeight: 600 }}>Ваш ответ: </span>
              {typeof selectedAnswer === "string" ? selectedAnswer : ""}
              <span style={{ marginLeft: 12, fontWeight: 700, color: shortAnswerCorrect ? "#16A34A" : "#DC2626" }}>
                {shortAnswerCorrect ? "✓" : "✗"}
              </span>
              {!shortAnswerCorrect && (
                <div style={{ marginTop: 6, fontSize: 14, color: "#555" }}>
                  Правильный ответ:{" "}
                  <span
                    style={{ fontWeight: 700, color: "#1A1A1A" }}
                    dangerouslySetInnerHTML={{
                      __html: renderWithFormulas(
                        Array.isArray(question.answer) ? question.answer.join(", ") : question.answer
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Badge */}
      {isAnswerShown && question.type !== "short_answer" && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            borderRadius: 10,
            marginBottom: 20,
            background: (() => {
              if (question.type === "multiple_choice") {
                const given = Array.isArray(selectedAnswer) ? [...selectedAnswer].sort() : [];
                const expected = Array.isArray(question.answer) ? [...question.answer].sort() : [question.answer];
                return JSON.stringify(given) === JSON.stringify(expected) ? "#22C55E" : "#EF4444";
              }
              return isCorrectAnswer(question, String(selectedAnswer)) ? "#22C55E" : "#EF4444";
            })(),
            animation: "fadeIn 0.3s ease",
          }}
        >
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
          <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
            {(() => {
              if (question.type === "multiple_choice") {
                const given = Array.isArray(selectedAnswer) ? [...selectedAnswer].sort() : [];
                const expected = Array.isArray(question.answer) ? [...question.answer].sort() : [question.answer];
                return JSON.stringify(given) === JSON.stringify(expected) ? "ВЕРНО ✓" : "НЕВЕРНО ✗";
              }
              return isCorrectAnswer(question, String(selectedAnswer)) ? "ВЕРНО ✓" : "НЕВЕРНО ✗";
            })()}
          </span>
        </div>
      )}

      {/* 7. Explanation */}
      {isAnswerShown && question.explanation && (
        <div
          style={{
            background: "#E8F4FF",
            borderRadius: 10,
            padding: "14px 20px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#185FA5",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Пояснение
          </div>
          <div
            style={{ fontSize: 14, color: "#1A1A1A", lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: renderWithFormulas(question.explanation) }}
          />
        </div>
      )}

      {/* 8. Next button */}
      {isAnswerShown && (
        <button
          onClick={onNext}
          style={{
            padding: "13px 32px",
            borderRadius: 10,
            background: "#F96B1B",
            color: "white",
            border: "none",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {isLast ? "Завершить тест" : "Следующий вопрос →"}
        </button>
      )}

      {/* 9. Hint */}
      {!isAnswerShown && question.type !== "short_answer" && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 20, marginBottom: 0 }}>
          Нажмите на вариант, который назвал класс
        </p>
      )}
    </div>
  );
}
