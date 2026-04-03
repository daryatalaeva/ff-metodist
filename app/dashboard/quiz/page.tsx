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
                if (parsed.error === "topic_invalid") {
                  const msg = typeof parsed.message === "string"
                    ? parsed.message
                    : "По этой теме пока недостаточно данных для генерации материалов.";
                  setServerError(msg);
                  setMode("form");
                } else {
                  setResult(parsed as unknown as QuizResult);
                  setMode("result");
                  const next = usedGenerations + 1;
                  localStorage.setItem(LS_KEY, String(next));
                  setUsedGenerations(next);
                }
              } catch (parseErr) {
                console.error("[quiz] JSON parse failed. Raw fullText:", fullText);
                console.error("[quiz] parse error:", parseErr);
                setServerError("Не удалось разобрать ответ модели. Попробуйте ещё раз.");
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

  /* ─── Generating screen ─── */
  if (mode === "generating") {
    return (
      <div>
        <BackLink />
        <div className="bg-white rounded-[20px] py-10 px-8">
          <div className="text-center">
            <div className="text-[56px] mb-5 inline-block hourglass">⏳</div>
            <h2 className="m-0 mb-[10px] text-[20px] font-black tracking-[-0.02em]">
              Генерируем тест…
            </h2>
            <p className="m-0 text-sm text-[#999]">Обычно занимает 20–40 секунд</p>
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
        <div className="bg-white rounded-[20px] p-8">
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
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-[18px] py-3 mb-[18px] text-sm text-[#DC2626]">
          {serverError}
        </div>
      )}

      <BackLink />

      <div className="fox-form-grid">
        {/* ══ LEFT COLUMN ══ */}
        <div className="bg-white rounded-[20px] px-[30px] py-7">
          <h2 className="m-0 mb-6 text-[17px] font-black text-[#111] tracking-[-0.02em]">
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
                <option value="" disabled>Выберите класс</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={String(g)}>{g} класс</option>
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
                  <option key={s} value={s}>{s}</option>
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
            <div className="text-right text-[11px] text-[#bbb] mt-[3px]">
              {form.topic.length}/200
            </div>
          </Field>

          {/* Question types */}
          <Field label="Типы вопросов" required error={fieldErrors.questionTypes}>
            <div className="flex flex-col gap-[11px]">
              {QUESTION_TYPES.map((qt) => {
                const checked = form.questionTypes.includes(qt.value);
                return (
                  <label
                    key={qt.value}
                    className="flex items-center gap-[10px] cursor-pointer select-none"
                  >
                    <div
                      onClick={() => toggleQType(qt.value)}
                      className={[
                        "w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center flex-shrink-0 cursor-pointer",
                        checked
                          ? "border-fox-orange bg-fox-orange"
                          : "border-black/25 bg-white",
                      ].join(" ")}
                    >
                      {checked && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span onClick={() => toggleQType(qt.value)} className="text-sm text-[#333]">
                      {qt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </Field>

          {/* Question count — single type: pill buttons; multi-type: per-type steppers */}
          {form.questionTypes.length <= 1 ? (
            <Field label="Количество вопросов">
              <div className="flex gap-2 flex-wrap">
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
                      className={[
                        "rounded-[20px] px-[22px] py-[7px] border-[1.5px] text-sm font-semibold cursor-pointer font-[inherit] transition-colors",
                        active
                          ? "border-fox-orange bg-fox-orange-light text-fox-orange"
                          : "border-black/15 bg-white text-[#444]",
                      ].join(" ")}
                    >
                      {cnt}
                    </button>
                  );
                })}
              </div>
            </Field>
          ) : (
            <Field label="Количество вопросов по типам">
              <div className="bg-[#F7F7FC] rounded-xl overflow-hidden">
                {form.questionTypes.map((type, i) => {
                  const label = QUESTION_TYPES.find((qt) => qt.value === type)?.label ?? type;
                  const count = form.questionCountPerType[type] ?? 3;
                  const isLast = i === form.questionTypes.length - 1;
                  return (
                    <div
                      key={type}
                      className={[
                        "flex items-center justify-between px-[14px] py-[11px]",
                        isLast ? "" : "border-b border-black/[0.07]",
                      ].join(" ")}
                    >
                      <span className="text-[13px] text-[#333] leading-[1.3] flex-1">{label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => adjustTypeCount(type, -1)}
                          disabled={count <= 1}
                          className={[
                            "w-7 h-7 rounded-full border-[1.5px] text-base font-bold flex items-center justify-center font-[inherit] transition-colors",
                            count <= 1
                              ? "border-black/15 bg-[#F0F0F0] text-[#CCC] cursor-not-allowed"
                              : "border-black/15 bg-white text-[#333] cursor-pointer",
                          ].join(" ")}
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-[15px] font-bold text-[#111]">
                          {count}
                        </span>
                        <button
                          onClick={() => adjustTypeCount(type, 1)}
                          disabled={count >= 20}
                          className={[
                            "w-7 h-7 rounded-full border-[1.5px] text-base font-bold flex items-center justify-center font-[inherit] transition-colors",
                            count >= 20
                              ? "border-black/15 bg-[#F0F0F0] text-[#CCC] cursor-not-allowed"
                              : "border-black/15 bg-white text-[#333] cursor-pointer",
                          ].join(" ")}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* Total row */}
                <div className="flex justify-between items-center px-[14px] py-[10px] bg-[#EEEEF6] border-t border-black/[0.08]">
                  <span className="text-[13px] font-bold text-[#555]">Итого</span>
                  <span className="text-[15px] font-black text-fox-orange">
                    {form.questionTypes.reduce((s, t) => s + (form.questionCountPerType[t] ?? 3), 0)} вопросов
                  </span>
                </div>
              </div>
            </Field>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            className="fox-btn-primary w-full justify-center mt-2"
            style={{ borderRadius: 14 }}
          >
            Сгенерировать тест →
          </button>

          {/* Generation counter */}
          <div className="mt-[14px]">
            <div className="flex justify-between mb-[6px] text-[13px] text-[#777]">
              <span>Генераций: {usedGenerations} / {TOTAL_GENERATIONS}</span>
              <span>{TOTAL_GENERATIONS - usedGenerations} осталось</span>
            </div>
            <div className="h-1 bg-[#F3F4F6] rounded overflow-hidden">
              <div
                className="h-full bg-fox-orange rounded"
                style={{ width: `${Math.min((usedGenerations / TOTAL_GENERATIONS) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="bg-white rounded-[20px] px-[30px] py-7">
          <h2 className="m-0 mb-6 text-[17px] font-black text-[#111] tracking-[-0.02em]">
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
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
              onClick={() => document.getElementById("file-upload")?.click()}
              className={[
                "border-[1.5px] border-dashed rounded-[10px] py-[22px] px-4 text-center cursor-pointer transition-all",
                dragOver
                  ? "border-fox-orange bg-fox-orange-light"
                  : "border-black/20 bg-[#FAFAFA]",
              ].join(" ")}
            >
              <div className="text-[22px] mb-2">📎</div>
              <p className="m-0 text-[13px] text-[#888] leading-[1.55]">
                PDF или DOCX, до 10 МБ
                <br />
                тест будет строго по тексту
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
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
            <div className="text-right text-[11px] text-[#bbb] mt-[3px]">
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
    <div className="mb-[22px]">
      <Link
        href="/dashboard"
        className="text-fox-orange text-sm font-semibold no-underline inline-flex items-center gap-1"
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
    <div className="mb-5">
      <label className="block text-[13px] font-semibold mb-[7px] text-[#222]">
        {label}
        {required && (
          <span className="text-fox-orange ml-[2px]">*</span>
        )}
        {optional && (
          <span className="text-xs text-[#aaa] font-normal ml-1.5">необязательно</span>
        )}
      </label>
      {children}
      {error && (
        <span className="block text-xs text-[#DC2626] mt-[5px]">{error}</span>
      )}
    </div>
  );
}
