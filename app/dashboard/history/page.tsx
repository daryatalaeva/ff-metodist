"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface GenerationItem {
  id: string;
  subject: string | null;
  grade: number | null;
  topic: string | null;
  examFormat: string | null;
  questionCount: number | null;
  questionTypes: string[];
  feedback: string | null;
  createdAt: string;
}

const TYPE_SHORT: Record<string, string> = {
  single_choice: "Один ответ",
  multiple_choice: "Несколько ответов",
  true_false: "Верно/Неверно",
  short_answer: "Краткий ответ",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterSubject) params.set("subject", filterSubject);
      if (filterGrade) params.set("grade", filterGrade);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

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
  }, [filterSubject, filterGrade, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const hasActiveFilters = filterSubject || filterGrade || filterDateFrom || filterDateTo;

  function clearFilters() {
    setFilterSubject("");
    setFilterGrade("");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  return (
    <div>
      {/* Filters bar */}
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
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: "0.04em" }}>
            ПРЕДМЕТ
          </label>
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
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: "0.04em" }}>
            КЛАСС
          </label>
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
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: "0.04em" }}>
            С ДАТЫ
          </label>
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
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: "0.04em" }}>
            ПО ДАТУ
          </label>
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

      {/* Content */}
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
          {/* Count */}
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

function GenerationCard({ item }: { item: GenerationItem }) {
  const typeLabels = item.questionTypes
    .map((t) => TYPE_SHORT[t] ?? t)
    .join(" · ");

  const feedbackColor =
    item.feedback === "thumbs_up"
      ? "#16A34A"
      : item.feedback === "thumbs_down"
      ? "#DC2626"
      : null;

  const feedbackIcon =
    item.feedback === "thumbs_up" ? "👍" : item.feedback === "thumbs_down" ? "👎" : null;

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
          {/* Badges row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 8 }}>
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
            {item.examFormat && item.examFormat !== "none" && (
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

          {/* Meta */}
          <p style={{ margin: 0, fontSize: 13, color: "#999" }}>
            {item.questionCount} вопр.
            {typeLabels ? ` · ${typeLabels}` : ""}
          </p>
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
          : "Создайте первый тест — он появится здесь"}
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
      )}
    </div>
  );
}

function pluralGen(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "генерация";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "генерации";
  return "генераций";
}
