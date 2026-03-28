"use client";

import { useRef, useState } from "react";
import LessonTypeSelector, { type LessonType } from "./LessonTypeSelector";

/* ─── Static data ─────────────────────────────────────────────────────────── */

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

type LessonFormType =
  | "traditional"
  | "practical"
  | "seminar"
  | "game"
  | "project"
  | "lecture"
  | "excursion"
  | "test_lesson";

type LessonPosition = "intro" | "main" | "final";

const LESSON_FORMS: { value: LessonFormType; label: string }[] = [
  { value: "traditional", label: "Традиционный" },
  { value: "practical", label: "Практикум" },
  { value: "seminar", label: "Семинар" },
  { value: "game", label: "Ролевая игра" },
  { value: "project", label: "Защита проектов" },
  { value: "lecture", label: "Лекция" },
  { value: "excursion", label: "Экскурсия" },
  { value: "test_lesson", label: "Урок-зачёт" },
];

const LESSON_POSITIONS: { value: LessonPosition; label: string }[] = [
  { value: "intro", label: "Вводный" },
  { value: "main", label: "Основной" },
  { value: "final", label: "Итоговый" },
];

const EXAM_FORMATS = [
  { value: "ФГОС", label: "ФГОС" },
  { value: "ОГЭ", label: "ОГЭ" },
  { value: "ЕГЭ", label: "ЕГЭ" },
  { value: "Без привязки", label: "Без привязки" },
];

const DURATIONS: { value: 40 | 45 | 90; label: string }[] = [
  { value: 40, label: "40 мин" },
  { value: 45, label: "45 мин" },
  { value: 90, label: "90 мин" },
];

const TOTAL_GENERATIONS = 20;

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface LessonPlanFormState {
  subject: string;
  grade: string;
  topic: string;
  lessonType: LessonType;
  lessonDuration: 40 | 45 | 90;
  lessonForm: LessonFormType;
  lessonPosition: LessonPosition | "";
  examFormat: string;
  textbookName: string;
  textbookFileUrl: string | null;
  textbookFilename: string | null;
  extraInstructions: string;
}

export const INITIAL_FORM_STATE: LessonPlanFormState = {
  subject: "",
  grade: "",
  topic: "",
  lessonType: "combined",
  lessonDuration: 45,
  lessonForm: "traditional",
  lessonPosition: "",
  examFormat: "ФГОС",
  textbookName: "",
  textbookFileUrl: null,
  textbookFilename: null,
  extraInstructions: "",
};

interface LessonPlanFormProps {
  form: LessonPlanFormState;
  setField: <K extends keyof LessonPlanFormState>(
    k: K,
    v: LessonPlanFormState[K]
  ) => void;
  fieldErrors: Record<string, string>;
  usedGenerations: number;
  onSubmit: () => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function LessonPlanForm({
  form,
  setField,
  fieldErrors,
  usedGenerations,
  onSubmit,
}: LessonPlanFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const availableSubjects =
    form.grade && parseInt(form.grade) <= 4
      ? PRIMARY_SUBJECTS
      : SECONDARY_SUBJECTS;

  async function uploadFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Файл превышает 10 МБ");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setUploadError("Только PDF или DOCX");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/lesson-plan/upload-material", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Ошибка загрузки");
      }
      const data = (await res.json()) as { url: string; filename: string };
      setField("textbookFileUrl", data.url);
      setField("textbookFilename", data.filename);
      setField("textbookName", "");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Ошибка загрузки файла"
      );
    } finally {
      setUploading(false);
    }
  }

  function removeFile() {
    setField("textbookFileUrl", null);
    setField("textbookFilename", null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div
      className="fox-form-grid"
      style={{ gap: 20 }}
    >
      {/* ══ LEFT COLUMN ══ */}
      <div>
        <div style={card}>
          <h2 style={cardTitle}>Основные параметры</h2>

          {/* Класс */}
          <Field label="Класс" required error={fieldErrors.grade}>
            <div className="fox-select-wrap">
              <select
                style={inputStyle}
                value={form.grade}
                onChange={(e) => {
                  const g = e.target.value;
                  setField("grade", g);
                  // Reset subject when switching school level
                  const was = parseInt(form.grade);
                  const now = parseInt(g);
                  if ((was <= 4) !== (now <= 4)) setField("subject", "");
                }}
              >
                <option value="" disabled>Выберите класс</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={String(g)}>{g} класс</option>
                ))}
              </select>
            </div>
          </Field>

          {/* Предмет */}
          <Field label="Предмет" required error={fieldErrors.subject}>
            <div className="fox-select-wrap">
              <select
                style={inputStyle}
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

          {/* Тема урока */}
          <Field label="Тема урока" required error={fieldErrors.topic}>
            <input
              style={inputStyle}
              type="text"
              placeholder="Например: Площадь трапеции"
              value={form.topic}
              onChange={(e) => setField("topic", e.target.value)}
              maxLength={200}
            />
            <div style={charCounter}>{form.topic.length}/200</div>
          </Field>

          {/* Тип урока */}
          <Field label="Тип урока" required error={fieldErrors.lessonType}>
            <LessonTypeSelector
              value={form.lessonType}
              onChange={(v) => setField("lessonType", v)}
            />
          </Field>

          {/* Продолжительность */}
          <Field label="Продолжительность" required error={fieldErrors.lessonDuration}>
            <div style={{ display: "flex", gap: 8 }}>
              {DURATIONS.map((d) => (
                <Pill
                  key={d.value}
                  label={d.label}
                  active={form.lessonDuration === d.value}
                  onClick={() => setField("lessonDuration", d.value)}
                />
              ))}
            </div>
          </Field>
        </div>

        {/* CTA */}
        <button
          onClick={onSubmit}
          style={{
            width: "100%",
            background: "#F96B1B",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "13px 0",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 12,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#E55E10")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#F96B1B")
          }
          type="button"
        >
          Составить план →
        </button>

        {/* Generation counter */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            <span>Генераций: {usedGenerations} / {TOTAL_GENERATIONS}</span>
            <span>{TOTAL_GENERATIONS - usedGenerations} осталось</span>
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
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* ══ RIGHT COLUMN ══ */}
      <div style={card}>
        <h2 style={cardTitle}>Дополнительно</h2>

        {/* Форма проведения */}
        <Field label="Форма проведения" optional>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LESSON_FORMS.map((lf) => (
              <Pill
                key={lf.value}
                label={lf.label}
                active={form.lessonForm === lf.value}
                onClick={() => setField("lessonForm", lf.value)}
              />
            ))}
          </div>
        </Field>

        {/* Место в теме */}
        <Field label="Место в теме" optional>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LESSON_POSITIONS.map((lp) => (
              <Pill
                key={lp.value}
                label={lp.label}
                active={form.lessonPosition === lp.value}
                onClick={() =>
                  setField(
                    "lessonPosition",
                    form.lessonPosition === lp.value ? "" : lp.value
                  )
                }
              />
            ))}
          </div>
        </Field>

        {/* Формат / стандарт */}
        <Field label="Стандарт" optional>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EXAM_FORMATS.map((ef) => (
              <Pill
                key={ef.value}
                label={ef.label}
                active={form.examFormat === ef.value}
                onClick={() => setField("examFormat", ef.value)}
              />
            ))}
          </div>
        </Field>

        {/* Учебник (скрыт если файл загружен) */}
        {!form.textbookFileUrl && (
          <Field label="Учебник" optional>
            <input
              style={inputStyle}
              type="text"
              placeholder="Например: Геометрия, Атанасян, 8 класс"
              value={form.textbookName}
              onChange={(e) => setField("textbookName", e.target.value)}
            />
          </Field>
        )}

        {/* Файл учебника */}
        <Field label="Файл учебника" optional>
          {form.textbookFileUrl ? (
            /* Uploaded state */
            <div
              style={{
                border: "1.5px solid rgba(0,0,0,0.1)",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#F9FFF9",
              }}
            >
              <span style={{ fontSize: 18 }}>📄</span>
              <span
                style={{
                  fontSize: 13,
                  color: "#1A1A1A",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {form.textbookFilename}
              </span>
              <button
                onClick={removeFile}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                  flexShrink: 0,
                }}
                type="button"
                aria-label="Удалить файл"
              >
                ×
              </button>
            </div>
          ) : (
            /* Upload zone */
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) uploadFile(file);
                }}
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  border: `1.5px dashed ${dragOver ? "#F96B1B" : "rgba(0,0,0,0.2)"}`,
                  borderRadius: 10,
                  padding: "20px 16px",
                  textAlign: "center",
                  cursor: uploading ? "wait" : "pointer",
                  background: dragOver ? "#FEF0E6" : "#FAFAFA",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>
                  {uploading ? "⏳" : "📎"}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                  {uploading
                    ? "Загружаем файл…"
                    : "PDF или DOCX, до 10 МБ\nплан будет строго по тексту"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />
              {uploadError && (
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "#DC2626",
                    marginTop: 5,
                  }}
                >
                  {uploadError}
                </span>
              )}
            </>
          )}
        </Field>

        {/* Дополнительные требования */}
        <Field label="Дополнительные требования" optional>
          <textarea
            style={{
              ...inputStyle,
              height: 76,
              padding: "10px 12px",
              resize: "none",
              lineHeight: 1.5,
            }}
            placeholder="Например: включи групповую работу, урок после контрольной, класс слабый"
            value={form.extraInstructions}
            onChange={(e) => setField("extraInstructions", e.target.value)}
            maxLength={500}
          />
          <div style={charCounter}>{form.extraInstructions.length}/500</div>
        </Field>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1.5px solid ${active ? "#F96B1B" : "rgba(0,0,0,0.15)"}`,
        borderRadius: 20,
        padding: "6px 13px",
        fontSize: 13,
        fontWeight: 600,
        color: active ? "#F96B1B" : "#444",
        background: active ? "#FEF0E6" : "white",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
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
          color: "#1A1A1A",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#F96B1B", marginLeft: 2 }}>*</span>
        )}
        {optional && (
          <span
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              fontWeight: 400,
              marginLeft: 6,
            }}
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

/* ─── Shared styles ───────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  padding: "28px 28px",
};

const cardTitle: React.CSSProperties = {
  margin: "0 0 22px",
  fontSize: 16,
  fontWeight: 700,
  color: "#1A1A1A",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  border: "1.5px solid rgba(0,0,0,0.15)",
  borderRadius: 10,
  padding: "0 12px",
  fontSize: 14,
  fontFamily: "inherit",
  color: "#1A1A1A",
  background: "white",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
  outline: "none",
  transition: "border-color 0.15s ease",
};

const charCounter: React.CSSProperties = {
  textAlign: "right",
  fontSize: 11,
  color: "#C0C0C0",
  marginTop: 3,
};
