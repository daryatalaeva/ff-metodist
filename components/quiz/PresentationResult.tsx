"use client";

import { useEffect, useState } from "react";
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

interface Props {
  score: number;
  totalQuestions: number;
  wrongQuestions: number[];
  questions: Question[];
  onRestart: () => void;
}

export default function PresentationResult({
  score,
  totalQuestions,
  wrongQuestions,
  questions,
  onRestart,
}: Props) {
  const percent = Math.round((score / totalQuestions) * 100);
  const color =
    percent >= 80 ? "#22C55E" : percent >= 50 ? "#F96B1B" : "#EF4444";
  const motivatingText =
    percent >= 80
      ? "Отличная работа! Класс блестяще усвоил тему."
      : percent >= 50
      ? "Хорошее начало! Есть что повторить — особенно вопросы, где ошиблись."
      : "Тема требует закрепления. Разберём ошибки вместе!";

  // Animate progress bar on mount
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(percent), 50);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div>
      {/* 1. Title */}
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: 32,
          fontWeight: 900,
          color: "#1A1A1A",
          letterSpacing: "-0.02em",
        }}
      >
        Тест завершён!
      </h1>

      {/* 2. Summary */}
      <p style={{ margin: "0 0 24px", fontSize: 20, color: "#555", fontWeight: 500 }}>
        Класс ответил правильно на{" "}
        <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{score}</span> из{" "}
        <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{totalQuestions}</span> вопросов
      </p>

      {/* 3. Percent */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color,
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        {percent}%
      </div>

      {/* 4. Progress bar */}
      <div
        style={{
          height: 8,
          background: "#F3F4F6",
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barWidth}%`,
            background: color,
            borderRadius: 4,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* 5. Motivating text */}
      <p style={{ margin: "0 0 32px", fontSize: 18, color: "#1A1A1A", lineHeight: 1.5 }}>
        {motivatingText}
      </p>

      {/* 6. Wrong questions */}
      {wrongQuestions.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: 20,
              fontWeight: 800,
              color: "#1A1A1A",
              letterSpacing: "-0.01em",
            }}
          >
            Вопросы с ошибками
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {wrongQuestions.map((idx) => {
              const q = questions[idx];
              if (!q) return null;
              const text = q.text;
              const answer = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#FFF8DC",
                    borderRadius: 10,
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{ fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}
                    dangerouslySetInnerHTML={{ __html: renderWithFormulas(text) }}
                  />
                  <div style={{ fontSize: 13, color: "#7A6000", fontWeight: 600 }}>
                    Правильный ответ:{" "}
                    <span dangerouslySetInnerHTML={{ __html: renderWithFormulas(answer) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={onRestart}
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
          ↺ Повторить тест
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: "13px 28px",
            borderRadius: 10,
            background: "white",
            color: "#2B7FFF",
            border: "1.5px solid #2B7FFF",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Вернуться
        </button>
      </div>
    </div>
  );
}
