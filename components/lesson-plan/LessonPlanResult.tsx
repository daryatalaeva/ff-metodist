"use client";

import type { LessonPlanResult } from "@/lib/types";
import LessonPlanFeedback from "./LessonPlanFeedback";

interface Props {
  data: LessonPlanResult | null;
  rawText: string;
  generationId: string;
  onRegenerate: () => void;
}

export default function LessonPlanResultView({
  data,
  rawText,
  generationId,
  onRegenerate,
}: Props) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: "32px 36px",
      }}
    >
      {data ? (
        <Structured data={data} />
      ) : (
        <RawFallback rawText={rawText} />
      )}

      <LessonPlanFeedback
        generationId={generationId}
        data={data}
        rawText={rawText}
        onRegenerate={onRegenerate}
      />
    </div>
  );
}

/* ─── Structured view ─────────────────────────────────────────────────────── */

function Structured({ data }: { data: LessonPlanResult }) {
  return (
    <div>
      {/* 1. ШАПКА */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 26,
            fontWeight: 900,
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {data.title}
        </h1>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#6B7280" }}>
          {data.subject} · {data.grade} класс
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Badge text={data.lesson_type} />
          {data.lesson_form && <Badge text={data.lesson_form} />}
          <Badge text={`${data.duration_minutes} мин`} />
        </div>
      </div>

      {/* 2. ЦЕЛИ УРОКА */}
      <Section title="Цели урока">
        <LabelValue label="Обучающая" value={data.goals.educational} />
        <LabelValue label="Развивающая" value={data.goals.developmental} />
        <LabelValue label="Воспитательная" value={data.goals.upbringing} />
      </Section>

      {/* 3. ПЛАНИРУЕМЫЕ РЕЗУЛЬТАТЫ */}
      <Section title="Планируемые результаты">
        <LabelValue label="Предметные" value={data.planned_results.subject} />
        <LabelValue label="Метапредметные (УУД)" value={data.planned_results.meta_subject} />
        <LabelValue label="Личностные" value={data.planned_results.personal} />
      </Section>

      {/* 4. ОБОРУДОВАНИЕ */}
      {data.equipment?.length > 0 && (
        <Section title="Оборудование и материалы">
          <p style={{ margin: 0, fontSize: 14, color: "#1A1A1A", lineHeight: 1.6 }}>
            {data.equipment.join(", ")}
          </p>
        </Section>
      )}

      {/* 5. ХОД УРОКА */}
      <Section title="Ход урока">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.stages.map((stage, idx) => (
            <div
              key={stage.number}
              style={{
                borderBottom:
                  idx < data.stages.length - 1
                    ? "1px solid rgba(0,0,0,0.08)"
                    : "none",
                paddingBottom: idx < data.stages.length - 1 ? 16 : 0,
                marginBottom: idx < data.stages.length - 1 ? 16 : 0,
              }}
            >
              {/* Stage header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1A1A1A",
                  }}
                >
                  {stage.number}. {stage.name}
                </span>
                <span
                  style={{
                    background: "#F3F4F6",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#6B7280",
                    flexShrink: 0,
                  }}
                >
                  {stage.duration_minutes} мин
                </span>
              </div>

              {/* Stage rows */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <LabelValue label="Учитель" value={stage.teacher_activity} />
                <LabelValue label="Ученики" value={stage.student_activity} />
                <LabelValue label="Методы" value={stage.methods_and_forms} />
                {stage.notes && (
                  <LabelValue label="Примечание" value={stage.notes} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. ДОМАШНЕЕ ЗАДАНИЕ */}
      {data.homework && (
        <Section title="Домашнее задание">
          <p style={{ margin: 0, fontSize: 14, color: "#1A1A1A", lineHeight: 1.6 }}>
            {data.homework}
          </p>
        </Section>
      )}

      {/* 7. ВОПРОСЫ ДЛЯ САМОАНАЛИЗА */}
      {data.self_analysis_questions?.length > 0 && (
        <Section title="Вопросы для самоанализа">
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {data.self_analysis_questions.map((q, i) => (
              <li
                key={i}
                style={{
                  fontSize: 14,
                  color: "#1A1A1A",
                  lineHeight: 1.6,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: "#F96B1B", fontWeight: 700, flexShrink: 0 }}>
                  •
                </span>
                {q}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/* ─── Raw text fallback ───────────────────────────────────────────────────── */

function RawFallback({ rawText }: { rawText: string }) {
  return (
    <div>
      <div
        style={{
          background: "#FFF8DC",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 24,
          fontSize: 14,
          color: "#92400E",
          lineHeight: 1.5,
        }}
      >
        План сгенерирован, но не удалось распознать структуру — отображаем как
        текст
      </div>
      <pre
        style={{
          background: "#F9FAFB",
          borderRadius: 10,
          padding: "16px 20px",
          fontSize: 13,
          lineHeight: 1.65,
          color: "#374151",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          margin: 0,
          fontFamily: "inherit",
        }}
      >
        {rawText}
      </pre>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          margin: "0 0 14px",
          fontSize: 18,
          fontWeight: 800,
          color: "#1A1A1A",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#6B7280",
          marginRight: 6,
        }}
      >
        {label}:
      </span>
      <span style={{ fontSize: 14, fontWeight: 400, color: "#1A1A1A", lineHeight: 1.55 }}>
        {value}
      </span>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      style={{
        background: "#F3F4F6",
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 500,
        color: "#6B7280",
      }}
    >
      {text}
    </span>
  );
}
