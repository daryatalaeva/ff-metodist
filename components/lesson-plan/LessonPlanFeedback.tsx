"use client";

import { useState } from "react";
import type { LessonPlanResult } from "@/lib/types";

interface Props {
  generationId: string;
  /** Used to build plain text for copy / download. */
  data: LessonPlanResult | null;
  /** Always-available plain-text fallback (raw LLM output). */
  rawText: string;
  onRegenerate: () => void;
}

export default function LessonPlanFeedback({
  generationId,
  data,
  rawText,
  onRegenerate,
}: Props) {
  const [feedback, setFeedback] = useState<"thumbs_up" | "thumbs_down" | null>(null);
  const [copyLabel, setCopyLabel] = useState("📋 Копировать");
  const [dlLabel, setDlLabel] = useState("⬇️ Скачать .txt");

  /* ─── Feedback (toggle) ─── */
  async function handleFeedback(type: "thumbs_up" | "thumbs_down") {
    const next = feedback === type ? null : type;
    setFeedback(next);
    if (next !== null) {
      await fetch("/api/lesson-plan/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId, feedback: next }),
      }).catch(() => {});
    }
  }

  /* ─── Regenerate ─── */
  async function handleRegenerate() {
    await fetch("/api/lesson-plan/track-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, action: "regenerated" }),
    }).catch(() => {});
    onRegenerate();
  }

  /* ─── Copy ─── */
  async function handleCopy() {
    const text = data ? buildPlainText(data) : rawText;
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopyLabel("✓ Скопировано");
    setTimeout(() => setCopyLabel("📋 Копировать"), 2500);
    await fetch("/api/lesson-plan/track-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, action: "copied" }),
    }).catch(() => {});
  }

  /* ─── Download ─── */
  async function handleDownload() {
    const text = data ? buildPlainText(data) : rawText;
    const filename = data
      ? `${data.title.replace(/[^\wа-яёА-ЯЁ ]/gi, "").trim().slice(0, 60)}.txt`
      : "lesson_plan.txt";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDlLabel("✓ Скачано");
    setTimeout(() => setDlLabel("⬇️ Скачать .txt"), 2500);
    await fetch("/api/lesson-plan/track-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, action: "downloaded" }),
    }).catch(() => {});
  }

  return (
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
      {/* 👍 Подходит */}
      <FeedbackBtn
        active={feedback === "thumbs_up"}
        activeColor="#22C55E"
        onClick={() => handleFeedback("thumbs_up")}
      >
        👍 Подходит
      </FeedbackBtn>

      {/* 👎 Не подходит */}
      <FeedbackBtn
        active={feedback === "thumbs_down"}
        activeColor="#EF4444"
        onClick={() => handleFeedback("thumbs_down")}
      >
        👎 Не подходит
      </FeedbackBtn>

      {/* 🔄 Сгенерировать ещё раз */}
      <ActionBtn onClick={handleRegenerate}>🔄 Сгенерировать ещё раз</ActionBtn>

      {/* 📋 Копировать */}
      <ActionBtn onClick={handleCopy}>{copyLabel}</ActionBtn>

      {/* ⬇️ Скачать .txt */}
      <ActionBtn onClick={handleDownload}>{dlLabel}</ActionBtn>
    </div>
  );
}

/* ─── Buttons ─────────────────────────────────────────────────────────────── */

function FeedbackBtn({
  children,
  active,
  activeColor,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 20,
        border: `1.5px solid ${activeColor}`,
        background: active ? activeColor : "white",
        color: active ? "white" : activeColor,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s ease",
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
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 20,
        border: "1.5px solid rgba(0,0,0,0.15)",
        background: "white",
        color: "#6B7280",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Plain-text export ───────────────────────────────────────────────────── */

function buildPlainText(r: LessonPlanResult): string {
  const lines: string[] = [
    r.title,
    `Предмет: ${r.subject}, ${r.grade} класс`,
    `Тип: ${r.lesson_type}`,
    r.lesson_form ? `Форма: ${r.lesson_form}` : "",
    `Продолжительность: ${r.duration_minutes} мин`,
    "",
    "═".repeat(50),
    "",
    "ЦЕЛИ УРОКА:",
    `  Обучающая: ${r.goals.educational}`,
    `  Развивающая: ${r.goals.developmental}`,
    `  Воспитательная: ${r.goals.upbringing}`,
    "",
    "ПЛАНИРУЕМЫЕ РЕЗУЛЬТАТЫ:",
    `  Предметные: ${r.planned_results.subject}`,
    `  Метапредметные (УУД): ${r.planned_results.meta_subject}`,
    `  Личностные: ${r.planned_results.personal}`,
    "",
  ];

  if (r.equipment?.length) {
    lines.push(`ОБОРУДОВАНИЕ: ${r.equipment.join(", ")}`, "");
  }

  lines.push("ХОД УРОКА:", "");
  for (const s of r.stages) {
    lines.push(
      `${s.number}. ${s.name} (${s.duration_minutes} мин)`,
      `   Учитель: ${s.teacher_activity}`,
      `   Ученики: ${s.student_activity}`,
      `   Методы: ${s.methods_and_forms}`,
    );
    if (s.notes) lines.push(`   Примечание: ${s.notes}`);
    lines.push("");
  }

  if (r.homework) {
    lines.push("ДОМАШНЕЕ ЗАДАНИЕ:", r.homework, "");
  }

  if (r.self_analysis_questions?.length) {
    lines.push("ВОПРОСЫ ДЛЯ САМОАНАЛИЗА:");
    r.self_analysis_questions.forEach((q, i) => lines.push(`  ${i + 1}. ${q}`));
  }

  return lines.filter((l) => l !== undefined).join("\n");
}
