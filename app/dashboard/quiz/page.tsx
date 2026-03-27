"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { QuizResult } from "@/lib/types";
import { extractJson } from "@/lib/llm/parseJson";
import QuizResultView from "@/components/quiz/QuizResult";
import LimitModal from "@/components/quiz/LimitModal";

/* ─── Static data ─── */

const PRIMARY_SUBJECTS = [
  "Русский язык",
  "Литературное чтение",
  "Математика",
  "Окружающий мир",
  "Иностранный язык (английский)",
  "ИЗО",
  "Музыка",
  "Технология",
  "Физкультура",
  "ОРКСЭ",
];

const SECONDARY_SUBJECTS = [
  "Алгебра",
  "Геометрия",
  "Алгебра и начала анализа",
  "Русский язык",
  "Литература",
  "История",
  "Обществознание",
  "География",
  "Биология",
  "Химия",
  "Физика",
  "Информатика",
  "Английский язык",
  "Немецкий язык",
  "Французский язык",
  "Испанский язык",
  "ОБЖ",
  "Физкультура",
  "Музыка",
  "ИЗО",
  "Технология",
  "Астрономия",
  "Экономика",
  "Право",
  "Математика",
];

const EXAM_FORMATS = [
  { value: "ФГОС", label: "ФГОС" },
  { value: "ОГЭ", label: "ОГЭ" },
  { value: "ЕГЭ", label: "ЕГЭ" },
  { value: "ВПР", label: "ВПР" },
  { value: "none", label: "Без привязки" },
];

const QUESTION_TYPES = [
  { value: "single_choice", label: "С выбором одного ответа" },
  { value: "multiple_choice", label: "С выбором нескольких ответов" },
  { value: "true_false", label: "Верно / Неверно" },
  { value: "short_answer", label: "Краткий ответ" },
];

const QUESTION_COUNTS = [5, 10, 15, 20];
const TOTAL_GENERATIONS = 20;
const LS_KEY = "generation_count";

/* ─── Types ─── */

interface FormState {
  subject: string;
  grade: string;
  topic: string;
  examFormat: string;
  questionTypes: string[];
  /** Single-type mode: total count. Multi-type mode: ignored (use questionCountPerType). */
  questionCount: number;
  /** Per-type counts, always kept in sync with questionTypes. */
  questionCountPerType: Record<string, number>;
  textbookName: string;
  extraInstructions: string;
}

type Mode = "form" | "generating" | "result";

/* ─── Page ─── */

export default function QuizPage() {
  const [form, setForm] = useState<FormState>({
    subject: "",
    grade: "",
    topic: "",
    examFormat: "ФГОС",
    questionTypes: ["single_choice"],
    questionCount: 10,
    questionCountPerType: { single_choice: 10 },
    textbookName: "",
    extraInstructions: "",
  });

  const [usedGenerations, setUsedGenerations] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [mode, setMode] = useState<Mode>("form");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load generation count from localStorage on mount
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(LS_KEY) ?? "0", 10);
    setUsedGenerations(isNaN(stored) ? 0 : stored);
  }, []);

  const availableSubjects =
    form.grade && parseInt(form.grade) <= 4
      ? PRIMARY_SUBJECTS
      : SECONDARY_SUBJECTS;

  /* ─── Field helpers ─── */
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "grade") {
        const gradeNum = parseInt(value as string);
        const wasSecondary = parseInt(prev.grade) > 4;
        const nowSecondary = gradeNum > 4;
        if (wasSecondary !== nowSecondary) next.subject = "";
      }
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function toggleQType(type: string) {
    setForm((prev) => {
      const has = prev.questionTypes.includes(type);
      const nextTypes = has
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type];

      const nextPerType = { ...prev.questionCountPerType };
      if (!has) {
        // Adding: default to 3, or reuse existing value
        nextPerType[type] = nextPerType[type] ?? 3;
      } else {
        delete nextPerType[type];
      }

      return { ...prev, questionTypes: nextTypes, questionCountPerType: nextPerType };
    });
    setFieldErrors((prev) => ({ ...prev, questionTypes: "" }));
  }

  function adjustTypeCount(type: string, delta: number) {
    setForm((prev) => {
      const cur = prev.questionCountPerType[type] ?? 3;
      const next = Math.max(1, Math.min(20, cur + delta));
      return { ...prev, questionCountPerType: { ...prev.questionCountPerType, [type]: next } };
    });
  }

  /* ─── Validation ─── */
  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.grade) errors.grade = "Выберите класс";
    if (!form.subject) errors.subject = "Выберите предмет";
    const topic = form.topic.trim();
    if (!topic) errors.topic = "Введите тему";
    else if (topic.length < 3) errors.topic = "Минимум 3 символа";
    else if (topic.length > 200) errors.topic = "Максимум 200 символов";
    if (form.questionTypes.length === 0)
      errors.questionTypes = "Выберите хотя бы один тип вопросов";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /* ─── Submit ─── */
  async function handleSubmit() {
    if (!validate()) return;

    // Check generation limit before calling the API
    if (usedGenerations >= TOTAL_GENERATIONS) {
      setShowLimitModal(true);
      return;
    }

    setMode("generating");
    setResult(null);
    setServerError(null);
    setGenerationId(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          subject: form.subject,
          grade: parseInt(form.grade),
          topic: form.topic.trim(),
          examFormat: form.examFormat === "none" ? null : form.examFormat,
          questionTypes: form.questionTypes,
          questionCount: form.questionTypes.length === 1
            ? form.questionCount
            : form.questionTypes.reduce((s, t) => s + (form.questionCountPerType[t] ?? 3), 0),
          ...(form.questionTypes.length > 1 && { questionCountPerType: form.questionCountPerType }),
          textbookName: form.textbookName.trim() || null,
          extraInstructions: form.extraInstructions.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as {
          message?: string;
          errors?: { message: string }[];
        };
        setServerError(
          data.message ??
          data.errors?.[0]?.message ??
          "Ошибка запроса"
        );
        setMode("form");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const data = JSON.parse(raw) as {
              text?: string;
              done?: boolean;
              generationId?: string;
              error?: string;
            };

            if (data.text) {
              fullText += data.text;
            }
            if (data.done && data.generationId) {
              setGenerationId(data.generationId);
              try {
                const parsed = extractJson(fullText) as Record<string, unknown>;
                // Model signalled that the topic is outside the school curriculum
                if (parsed.error === "topic_invalid") {
                  const msg = typeof parsed.message === "string"
                    ? parsed.message
                    : "По этой теме пока недостаточно данных для генерации материалов.";
                  setServerError(msg);
                  setMode("form");
                } else {
                  setResult(parsed as unknown as QuizResult);
                  setMode("result");
                  // Increment localStorage counter on successful generation
                  const next = usedGenerations + 1;
                  localStorage.setItem(LS_KEY, String(next));
                  setUsedGenerations(next);
                }
              } catch (parseErr) {
                console.error("[quiz] JSON parse failed. Raw fullText:", fullText);
                console.error("[quiz] parse error:", parseErr);
                setServerError(
                  "Не удалось разобрать ответ модели. Попробуйте ещё раз."
                );
                setMode("form");
              }
            }
            if (data.error) {
              setServerError(data.error);
              setMode("form");
            }
          } catch {
            /* ignore malformed SSE line */
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setServerError("Ошибка соединения. Проверьте интернет и попробуйте снова.");
      setMode("form");
    }
  }

  function handleRegenerate() {
    setMode("form");
    setResult(null);
    setGenerationId(null);
  }

  const vprWarning =
    form.examFormat === "ВПР" && !!form.grade && parseInt(form.grade) >= 9;

  /* ─── Generating screen ─── */
  if (mode === "generating") {
    return (
      <div>
        <BackLink />
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "40px 32px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 20, display: "inline-block", animation: "hourglass 2s ease-in-out infinite" }}>
              ⏳
            </div>
            <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Генерируем тест…
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#999" }}>
              Обычно занимает 20–40 секунд
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Result screen ─── */
  if (mode === "result" && result && generationId) {
    return (
      <div>
        <BackLink />
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "32px",
          }}
        >
          <QuizResultView
            result={result}
            generationId={generationId}
            onRegenerate={handleRegenerate}
          />
        </div>
      </div>
    );
  }

  /* ─── Form screen ─── */
  return (
    <div>
      {showLimitModal && (
        <LimitModal onClose={() => setShowLimitModal(false)} />
      )}
      {serverError && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: "12px 18px",
            marginBottom: 18,
            fontSize: 14,
            color: "#DC2626",
          }}
        >
          {serverError}
        </div>
      )}

      <BackLink />

      <div className="fox-form-grid">
        {/* ══ LEFT COLUMN ══ */}
        <div
          style={{ background: "white", borderRadius: 20, padding: "28px 30px" }}
        >
          <h2
            style={{
              margin: "0 0 24px",
              fontSize: 17,
              fontWeight: 900,
              color: "#111",
              letterSpacing: "-0.02em",
            }}
          >
            Параметры теста
          </h2>

          {/* Grade */}
          <Field label="Класс" required error={fieldErrors.grade}>
            <div className="fox-select-wrap">
              <select
                className="fox-input"
                value={form.grade}
                onChange={(e) => setField("grade", e.target.value)}
              >
                <option value="" disabled>
                  Выберите класс
                </option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={String(g)}>
                    {g} класс
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {/* Subject */}
          <Field label="Предмет" required error={fieldErrors.subject}>
            <div className="fox-select-wrap">
              <select
                className="fox-input"
                value={form.subject}
                disabled={!form.grade}
                onChange={(e) => setField("subject", e.target.value)}
              >
                <option value="" disabled>
                  {form.grade ? "Выберите предмет" : "Сначала выберите класс"}
                </option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {/* Topic */}
          <Field label="Тема" required error={fieldErrors.topic}>
            <input
              className="fox-input"
              type="text"
              placeholder="Например: Квадратные уравнения"
              value={form.topic}
              onChange={(e) => setField("topic", e.target.value)}
              maxLength={200}
            />
            <div
              style={{
                textAlign: "right",
                fontSize: 11,
                color: "#bbb",
                marginTop: 3,
              }}
            >
              {form.topic.length}/200
            </div>
          </Field>

          {/* Format */}
          <Field label="Формат" error={undefined}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EXAM_FORMATS.map((fmt) => {
                const active = form.examFormat === fmt.value;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setField("examFormat", fmt.value)}
                    style={{
                      borderRadius: 20,
                      padding: "7px 16px",
                      border: `1.5px solid ${active ? "#F96B1B" : "rgba(0,0,0,0.15)"}`,
                      background: active ? "#FEF0E6" : "white",
                      color: active ? "#F96B1B" : "#444",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
            {vprWarning && (
              <div
                style={{
                  background: "#FFF8DC",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginTop: 10,
                  fontSize: 13,
                  color: "#92400E",
                  lineHeight: 1.45,
                }}
              >
                ⚠️ ВПР обычно проводятся для 4–8 классов. Уточните
                необходимость для выбранного класса.
              </div>
            )}
          </Field>

          {/* Question types */}
          <Field
            label="Типы вопросов"
            required
            error={fieldErrors.questionTypes}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {QUESTION_TYPES.map((qt) => {
                const checked = form.questionTypes.includes(qt.value);
                return (
                  <label
                    key={qt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div
                      onClick={() => toggleQType(qt.value)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: `1.5px solid ${checked ? "#F96B1B" : "rgba(0,0,0,0.25)"}`,
                        background: checked ? "#F96B1B" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      {checked && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span onClick={() => toggleQType(qt.value)} style={{ fontSize: 14, color: "#333" }}>
                      {qt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </Field>

          {/* Question count — single type: pill buttons; multi-type: per-type steppers */}
          {form.questionTypes.length <= 1 ? (
            <Field label="Количество вопросов" error={undefined}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {QUESTION_COUNTS.map((cnt) => {
                  const active = form.questionCount === cnt;
                  return (
                    <button
                      key={cnt}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          questionCount: cnt,
                          questionCountPerType: p.questionTypes[0]
                            ? { [p.questionTypes[0]]: cnt }
                            : p.questionCountPerType,
                        }))
                      }
                      style={{
                        borderRadius: 20,
                        padding: "7px 22px",
                        border: `1.5px solid ${active ? "#F96B1B" : "rgba(0,0,0,0.15)"}`,
                        background: active ? "#FEF0E6" : "white",
                        color: active ? "#F96B1B" : "#444",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {cnt}
                    </button>
                  );
                })}
              </div>
            </Field>
          ) : (
            <Field label="Количество вопросов по типам" error={undefined}>
              <div
                style={{
                  background: "#F7F7FC",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {form.questionTypes.map((type, i) => {
                  const label = QUESTION_TYPES.find((qt) => qt.value === type)?.label ?? type;
                  const count = form.questionCountPerType[type] ?? 3;
                  const isLast = i === form.questionTypes.length - 1;
                  return (
                    <div
                      key={type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "11px 14px",
                        borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.07)",
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#333", lineHeight: 1.3, flex: 1 }}>
                        {label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => adjustTypeCount(type, -1)}
                          disabled={count <= 1}
                          style={{
                            width: 28, height: 28, borderRadius: "50%",
                            border: "1.5px solid rgba(0,0,0,0.15)",
                            background: count <= 1 ? "#F0F0F0" : "white",
                            color: count <= 1 ? "#CCC" : "#333",
                            fontSize: 16, lineHeight: 1,
                            cursor: count <= 1 ? "not-allowed" : "pointer",
                            fontFamily: "inherit", fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 24, textAlign: "center", fontSize: 15, fontWeight: 700, color: "#111" }}>
                          {count}
                        </span>
                        <button
                          onClick={() => adjustTypeCount(type, 1)}
                          disabled={count >= 20}
                          style={{
                            width: 28, height: 28, borderRadius: "50%",
                            border: "1.5px solid rgba(0,0,0,0.15)",
                            background: count >= 20 ? "#F0F0F0" : "white",
                            color: count >= 20 ? "#CCC" : "#333",
                            fontSize: 16, lineHeight: 1,
                            cursor: count >= 20 ? "not-allowed" : "pointer",
                            fontFamily: "inherit", fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* Total row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#EEEEF6",
                    borderTop: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>Итого</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#F96B1B" }}>
                    {form.questionTypes.reduce((s, t) => s + (form.questionCountPerType[t] ?? 3), 0)} вопросов
                  </span>
                </div>
              </div>
            </Field>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            className="fox-btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 8, borderRadius: 14 }}
          >
            Сгенерировать тест →
          </button>

          {/* Generation counter */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: 13,
                color: "#777",
              }}
            >
              <span>
                Генераций: {usedGenerations} / {TOTAL_GENERATIONS}
              </span>
              <span>
                {TOTAL_GENERATIONS - usedGenerations} осталось
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: "#F3F4F6",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((usedGenerations / TOTAL_GENERATIONS) * 100, 100)}%`,
                  background: "#F96B1B",
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div
          style={{ background: "white", borderRadius: 20, padding: "28px 30px" }}
        >
          <h2
            style={{
              margin: "0 0 24px",
              fontSize: 17,
              fontWeight: 900,
              color: "#111",
              letterSpacing: "-0.02em",
            }}
          >
            Дополнительно
          </h2>

          {/* Textbook name */}
          <Field label="Учебник" optional>
            <input
              className="fox-input"
              type="text"
              placeholder="Например: Алгебра, Макарычев, 8 класс"
              value={form.textbookName}
              onChange={(e) => setField("textbookName", e.target.value)}
            />
          </Field>

          {/* File upload */}
          <Field label="Файл учебника" optional>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onClick={() => document.getElementById("file-upload")?.click()}
              style={{
                border: `1.5px dashed ${dragOver ? "#F96B1B" : "rgba(0,0,0,0.2)"}`,
                borderRadius: 10,
                padding: "22px 16px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "#FEF0E6" : "#FAFAFA",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>📎</div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#888",
                  lineHeight: 1.55,
                }}
              >
                PDF или DOCX, до 10 МБ
                <br />
                тест будет строго по тексту
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
            />
          </Field>

          {/* Extra instructions */}
          <Field label="Инструкции для ИИ" optional>
            <textarea
              className="fox-textarea"
              placeholder="Например: включи задачи на применение, избегай слишком лёгких вопросов"
              value={form.extraInstructions}
              onChange={(e) => setField("extraInstructions", e.target.value)}
              maxLength={500}
              rows={6}
            />
            <div
              style={{
                textAlign: "right",
                fontSize: 11,
                color: "#bbb",
                marginTop: 3,
              }}
            >
              {form.extraInstructions.length}/500
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ─── Small reusable bits ─── */

function BackLink() {
  return (
    <div style={{ marginBottom: 22 }}>
      <Link
        href="/dashboard"
        style={{
          color: "#F96B1B",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        ‹ Вернуться назад
      </Link>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 7,
          color: "#222",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#F96B1B", marginLeft: 2 }}>*</span>
        )}
        {optional && (
          <span
            style={{ fontSize: 12, color: "#aaa", fontWeight: 400, marginLeft: 6 }}
          >
            необязательно
          </span>
        )}
      </label>
      {children}
      {error && (
        <span
          style={{
            display: "block",
            fontSize: 12,
            color: "#DC2626",
            marginTop: 5,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
