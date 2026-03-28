"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface GenerationItem {
  id: string;
  featureType: string;
  subject: string | null;
  grade: number | null;
  topic: string | null;
  examFormat: string | null;
  questionCount: number | null;
  questionTypes: string[];
  lessonType: string | null;
  lessonForm: string | null;
  lessonDuration: number | null;
  feedback: string | null;
  createdAt: string;
}

type FeatureFilter = "all" | "quiz" | "lesson_plan";

/* ─── Mappings ───────────────────────────────────────────────────────────── */

const LESSON_TYPE_LABEL: Record<string, string> = {
  new_knowledge:         "Открытие нового знания",
  reflection:            "Рефлексия",
  methodology:           "Общеметодологический",
  developmental_control: "Развивающий контроль",
  combined:              "Комбинированный",
};

const LESSON_FORM_LABEL: Record<string, string> = {
  practical:   "Практикум",
  seminar:     "Семинар",
  game:        "Ролевая игра",
  project:     "Защита проектов",
  lecture:     "Лекция",
  excursion:   "Экскурсия",
  test_lesson: "Урок-зачёт",
};

const QUIZ_TYPE_SHORT: Record<string, string> = {
  single_choice:   "Один ответ",
  multiple_choice: "Несколько ответов",
  true_false:      "Верно/Неверно",
  short_answer:    "Краткий ответ",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function pluralGen(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "генерация";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "генерации";
  return "генераций";
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function HistoryPage() {
  const [items, setItems]       = useState<GenerationItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades]     = useState<number[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Filters
  const [filterFeatureType, setFilterFeatureType] = useState<FeatureFilter>("all");
  const [filterSubject,     setFilterSubject]     = useState("");
  const [filterGrade,       setFilterGrade]       = useState("");
  const [filterDateFrom,    setFilterDateFrom]    = useState("");
  const [filterDateTo,      setFilterDateTo]      = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterFeatureType !== "all") params.set("featureType", filterFeatureType);
      if (filterSubject)  params.set("subject",   filterSubject);
      if (filterGrade)    params.set("grade",      filterGrade);
      if (filterDateFrom) params.set("dateFrom",   filterDateFrom);
      if (filterDateTo)   params.set("dateTo",     filterDateTo);

      const res = await fetch(`/api/history?${params}`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json() as {
        generations: GenerationItem[];
        subjects: string[];
        grades: number[];
      };
      setItems(data.generations);
      setSubjects(data.subjects);
      setGrades(data.grades);
    } catch {
      setError("Не удалось загрузить историю. Попробуйте обновить страницу.");
    } finally {
      setLoading(false);
    }
  }, [filterFeatureType, filterSubject, filterGrade, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const hasActiveFilters =
    filterFeatureType !== "all" || filterSubject || filterGrade || filterDateFrom || filterDateTo;

  function clearFilters() {
    setFilterFeatureType("all");
    setFilterSubject("");
    setFilterGrade("");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  function switchFeatureType(type: FeatureFilter) {
    setFilterFeatureType(type);
    // pagination reset is implicit — fetchHistory reruns on state change
  }

  return (
    <div>
      {/* ── Feature type tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { value: "all",          label: "Все" },
            { value: "quiz",         label: "Тесты" },
            { value: "lesson_plan",  label: "Планы уроков" },
          ] as { value: FeatureFilter; label: string }[]
        ).map((tab) => {
          const active = filterFeatureType === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => switchFeatureType(tab.value)}
              type="button"
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: `1.5px solid ${active ? "#F96B1B" : "rgba(0,0,0,0.12)"}`,
                background: active ? "#FEF0E6" : "white",
                color: active ? "#F96B1B" : "#6B7280",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Filters bar ── */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap" as const,
          alignItems: "flex-end",
        }}
      >
        {/* Subject */}
        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
          <label style={filterLabel}>ПРЕДМЕТ</label>
          <div className="fox-select-wrap">
            <select
              className="fox-input"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{ height: 40, fontSize: 14 }}
            >
              <option value="">Все предметы</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grade */}
        <div style={{ flex: "0 0 140px" }}>
          <label style={filterLabel}>КЛАСС</label>
          <div className="fox-select-wrap">
            <select
              className="fox-input"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              style={{ height: 40, fontSize: 14 }}
            >
              <option value="">Все классы</option>
              {grades.map((g) => (
                <option key={g} value={String(g)}>{g} класс</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date from */}
        <div style={{ flex: "0 0 160px" }}>
          <label style={filterLabel}>С ДАТЫ</label>
          <input
            type="date"
            className="fox-input"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            style={{ height: 40, fontSize: 14 }}
          />
        </div>

        {/* Date to */}
        <div style={{ flex: "0 0 160px" }}>
          <label style={filterLabel}>ПО ДАТУ</label>
          <input
            type="date"
            className="fox-input"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            style={{ height: 40, fontSize: 14 }}
          />
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              alignSelf: "flex-end",
              background: "none",
              border: "1.5px solid rgba(0,0,0,0.12)",
              borderRadius: 20,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#888",
              cursor: "pointer",
              fontFamily: "inherit",
              height: 40,
              whiteSpace: "nowrap" as const,
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: 15 }}>
          Загружаем историю…
        </div>
      ) : error ? (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 14,
            padding: "16px 20px",
            color: "#DC2626",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState hasFilters={!!hasActiveFilters} onClear={clearFilters} />
      ) : (
        <>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#999", fontWeight: 600 }}>
            {items.length} {pluralGen(items.length)}
            {hasActiveFilters && " по фильтрам"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => (
              <GenerationCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Generation card ────────────────────────────────────────────────────── */

function GenerationCard({ item }: { item: GenerationItem }) {
  const isLesson = item.featureType === "lesson_plan";

  const feedbackColor =
    item.feedback === "thumbs_up"   ? "#16A34A" :
    item.feedback === "thumbs_down" ? "#DC2626"  : null;
  const feedbackIcon =
    item.feedback === "thumbs_up"   ? "👍" :
    item.feedback === "thumbs_down" ? "👎" : null;

  return (
    <Link
      href={`/dashboard/history/${item.id}`}
      className="fox-card"
      style={{
        display: "block",
        textDecoration: "none",
        background: "white",
        borderRadius: 16,
        padding: "18px 22px",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type label */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
            }}
          >
            {isLesson ? "📋 План урока" : "📝 Тест"}
          </div>

          {/* Subject · Grade badges row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 6 }}>
            {item.subject && (
              <span style={{
                background: "#EDE9FE", color: "#7B2FBE",
                borderRadius: 20, padding: "2px 11px",
                fontSize: 12, fontWeight: 700,
              }}>
                {item.subject}
              </span>
            )}
            {item.grade && (
              <span style={{
                background: "#F7F7FC", color: "#555",
                borderRadius: 20, padding: "2px 11px",
                fontSize: 12, fontWeight: 700,
              }}>
                {item.grade} класс
              </span>
            )}
            {!isLesson && item.examFormat && item.examFormat !== "none" && (
              <span style={{
                background: "#FEF0E6", color: "#F96B1B",
                borderRadius: 20, padding: "2px 11px",
                fontSize: 12, fontWeight: 700,
              }}>
                {item.examFormat}
              </span>
            )}
            {feedbackIcon && (
              <span style={{
                background: feedbackColor ? `${feedbackColor}18` : "transparent",
                color: feedbackColor ?? "#888",
                borderRadius: 20, padding: "2px 10px",
                fontSize: 12, fontWeight: 700,
              }}>
                {feedbackIcon}
              </span>
            )}
          </div>

          {/* Topic */}
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>
            {item.topic ?? "Без темы"}
          </p>

          {/* Lesson-plan meta tags */}
          {isLesson ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {item.lessonType && LESSON_TYPE_LABEL[item.lessonType] && (
                <LessonBadge text={LESSON_TYPE_LABEL[item.lessonType]} />
              )}
              {item.lessonForm && item.lessonForm !== "traditional" && LESSON_FORM_LABEL[item.lessonForm] && (
                <LessonBadge text={LESSON_FORM_LABEL[item.lessonForm]} />
              )}
              {item.lessonDuration && (
                <LessonBadge text={`${item.lessonDuration} мин`} />
              )}
            </div>
          ) : (
            /* Quiz meta */
            <p style={{ margin: 0, fontSize: 13, color: "#999" }}>
              {item.questionCount ? `${item.questionCount} вопр.` : ""}
              {item.questionTypes.length > 0
                ? ` · ${item.questionTypes.map((t) => QUIZ_TYPE_SHORT[t] ?? t).join(" · ")}`
                : ""}
            </p>
          )}
        </div>

        {/* Right: date + arrow */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: "#BBB", whiteSpace: "nowrap" as const }}>
            {formatDate(item.createdAt)}
          </span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 5L11 9L7 13" stroke="#CCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

function LessonBadge({ text }: { text: string }) {
  return (
    <span
      style={{
        background: "#F3F4F6",
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 500,
        color: "#6B7280",
      }}
    >
      {text}
    </span>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────── */

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 24px",
        background: "white",
        borderRadius: 20,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#111", letterSpacing: "-0.02em" }}>
        {hasFilters ? "Ничего не найдено" : "Генераций пока нет"}
      </h3>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#999", lineHeight: 1.55 }}>
        {hasFilters
          ? "Попробуйте изменить фильтры или сбросить их"
          : "Создайте тест или план урока — они появятся здесь"}
      </p>
      {hasFilters ? (
        <button
          onClick={onClear}
          style={{
            background: "#F96B1B", color: "white", border: "none",
            borderRadius: 24, padding: "11px 26px",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Сбросить фильтры
        </button>
      ) : (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/dashboard/quiz"
            style={{
              display: "inline-block",
              background: "#F96B1B", color: "white",
              borderRadius: 24, padding: "11px 26px",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            Создать тест →
          </Link>
          <Link
            href="/dashboard/lesson-plan"
            style={{
              display: "inline-block",
              background: "white", color: "#F96B1B",
              border: "1.5px solid #F96B1B",
              borderRadius: 24, padding: "11px 26px",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            Составить план →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Shared styles ──────────────────────────────────────────────────────── */

const filterLabel: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#888",
  marginBottom: 6,
  letterSpacing: "0.04em",
};
