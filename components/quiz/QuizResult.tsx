"use client";

import { useState } from "react";
import type { QuizResult, Question } from "@/lib/types";

const CYRILLIC = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К"];

const TYPE_LABELS: Record<string, string> = {
  single_choice: "Один ответ",
  multiple_choice: "Несколько ответов",
  true_false: "Верно / Неверно",
  short_answer: "Краткий ответ",
};

interface Props {
  result: QuizResult;
  generationId: string;
  onRegenerate: () => void;
}

export default function QuizResultView({ result, generationId, onRegenerate }: Props) {
  const [feedbackState, setFeedbackState] = useState<"thumbs_up" | "thumbs_down" | null>(null);
  const [copyLabel, setCopyLabel] = useState("Копировать");
  const [dlLabel, setDlLabel] = useState("Скачать .txt");

  async function handleFeedback(type: "thumbs_up" | "thumbs_down") {
    setFeedbackState(type);
    await fetch("/api/quiz/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, feedback: type }),
    }).catch(() => {});
  }

  async function handleCopy() {
    const text = buildPlainText(result);
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopyLabel("Скопировано!");
    setTimeout(() => setCopyLabel("Копировать"), 2500);
    await fetch("/api/quiz/track-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, action: "copied" }),
    }).catch(() => {});
  }

  async function handleDownload() {
    const text = buildPlainText(result);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/[^\wа-яёА-ЯЁ]/gi, "_").slice(0, 60)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDlLabel("Скачано!");
    setTimeout(() => setDlLabel("Скачать .txt"), 2500);
    await fetch("/api/quiz/track-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, action: "downloaded" }),
    }).catch(() => {});
  }

  async function handleRegenerate() {
    await fetch("/api/quiz/track-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, action: "regenerated" }),
    }).catch(() => {});
    onRegenerate();
  }

  return (
    <div>
      {/* ── Title + meta ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 900, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          {result.title}
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <MetaTag text={result.subject} />
          <MetaTag text={`${result.grade} класс`} />
          <MetaTag text={result.topic} />
          <MetaTag text={`${result.questions.length} вопр.`} />
        </div>
      </div>

      {/* ── Questions ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {result.questions.map((q) => (
          <QuestionCard key={q.number} question={q} />
        ))}
      </div>

      {/* ── Feedback row ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          paddingTop: 24,
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <FeedbackBtn
          active={feedbackState === "thumbs_up"}
          activeColor="#16A34A"
          activeBg="#F0FDF4"
          onClick={() => handleFeedback("thumbs_up")}
        >
          👍 Подходит
        </FeedbackBtn>

        <FeedbackBtn
          active={feedbackState === "thumbs_down"}
          activeColor="#DC2626"
          activeBg="#FEF2F2"
          onClick={() => handleFeedback("thumbs_down")}
        >
          👎 Не подходит
        </FeedbackBtn>

        <ActionBtn onClick={handleRegenerate}>Сгенерировать ещё раз →</ActionBtn>
        <ActionBtn onClick={handleCopy}>{copyLabel}</ActionBtn>
        <ActionBtn onClick={handleDownload}>{dlLabel} ↓</ActionBtn>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function MetaTag({ text }: { text: string }) {
  return (
    <span
      style={{
        background: "#EDE9FE",
        borderRadius: 20,
        padding: "4px 13px",
        fontSize: 13,
        fontWeight: 700,
        color: "#7B2FBE",
      }}
    >
      {text}
    </span>
  );
}

function FeedbackBtn({
  children,
  active,
  activeColor,
  activeBg,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 20,
        padding: "8px 18px",
        border: `1.5px solid ${active ? activeColor : "#D1D5DB"}`,
        background: active ? activeBg : "white",
        color: activeColor,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 20,
        padding: "8px 18px",
        border: "1.5px solid #D1D5DB",
        background: "white",
        color: "#333",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

function QuestionCard({ question }: { question: Question }) {
  const typeLabel = TYPE_LABELS[question.type] ?? question.type;

  function isOptionCorrect(option: string, idx: number): boolean {
    const answers = Array.isArray(question.answer)
      ? question.answer
      : [question.answer];
    const letter = CYRILLIC[idx];
    return answers.some(
      (a) =>
        a === option ||
        a.toLowerCase() === option.toLowerCase() ||
        a === letter ||
        a === String(idx + 1)
    );
  }

  function isTrueFalseCorrect(opt: "Верно" | "Неверно"): boolean {
    const a = String(question.answer).toLowerCase();
    if (opt === "Верно") return ["верно", "true", "да", "yes", "правда"].includes(a);
    return ["неверно", "false", "нет", "no", "ложь"].includes(a);
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: "22px 26px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#F96B1B",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {question.number}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Question text */}
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.55,
          color: "#111",
        }}
      >
        {question.text}
      </p>

      {/* Options — single/multiple choice */}
      {question.options && question.options.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {question.options.map((opt, i) => {
            const correct = isOptionCorrect(opt, i);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: correct ? "#F96B1B" : "#F3F4F6",
                    color: correct ? "white" : "#666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {CYRILLIC[i]}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    lineHeight: "26px",
                    color: correct ? "#111" : "#444",
                    fontWeight: correct ? 700 : 400,
                  }}
                >
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* True / False options */}
      {question.type === "true_false" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {(["Верно", "Неверно"] as const).map((opt) => {
            const correct = isTrueFalseCorrect(opt);
            return (
              <div
                key={opt}
                style={{
                  padding: "8px 20px",
                  borderRadius: 10,
                  background: correct ? "#FEF0E6" : "#F3F4F6",
                  border: correct
                    ? "1.5px solid #F96B1B"
                    : "1.5px solid transparent",
                  fontSize: 14,
                  fontWeight: correct ? 700 : 400,
                  color: correct ? "#F96B1B" : "#666",
                }}
              >
                {opt}
              </div>
            );
          })}
        </div>
      )}

      {/* Answer key block */}
      <div
        style={{
          background: "#F0F7FF",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#2B7FFF",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Ответ:
          </span>
          <span
            style={{ fontSize: 14, marginLeft: 8, color: "#111", fontWeight: 600 }}
          >
            {Array.isArray(question.answer)
              ? question.answer.join(", ")
              : question.answer}
          </span>
        </div>
        {question.explanation && (
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#2B7FFF",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Пояснение:
            </span>
            <span
              style={{
                fontSize: 13,
                marginLeft: 8,
                color: "#555",
                lineHeight: 1.55,
              }}
            >
              {question.explanation}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Plain-text export ─── */
function buildPlainText(result: QuizResult): string {
  const lines: string[] = [
    result.title,
    `Предмет: ${result.subject}, ${result.grade} класс`,
    `Тема: ${result.topic}`,
    "",
    "═".repeat(50),
    "",
  ];

  for (const q of result.questions) {
    lines.push(`${q.number}. [${TYPE_LABELS[q.type] ?? q.type}]`);
    lines.push(q.text);
    if (q.options) {
      q.options.forEach((opt, i) => {
        lines.push(`   ${CYRILLIC[i]}. ${opt}`);
      });
    }
    lines.push(`Ответ: ${Array.isArray(q.answer) ? q.answer.join(", ") : q.answer}`);
    if (q.explanation) lines.push(`Пояснение: ${q.explanation}`);
    lines.push("");
  }

  return lines.join("\n");
}
