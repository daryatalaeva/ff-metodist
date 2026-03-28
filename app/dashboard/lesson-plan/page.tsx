"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { extractJson } from "@/lib/llm/parseJson";
import type { LessonPlanResult } from "@/lib/types";
import LessonPlanForm, {
  INITIAL_FORM_STATE,
  type LessonPlanFormState,
} from "@/components/lesson-plan/LessonPlanForm";
import LessonPlanLoading from "@/components/lesson-plan/LessonPlanLoading";
import LessonPlanResultView from "@/components/lesson-plan/LessonPlanResult";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const TOTAL_GENERATIONS = 20;
const LS_KEY = "generation_count";

type Mode = "form" | "generating" | "result";

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function LessonPlanPage() {
  const [form, setForm] = useState<LessonPlanFormState>(INITIAL_FORM_STATE);
  const [mode, setMode] = useState<Mode>("form");
  const [result, setResult] = useState<LessonPlanResult | null>(null);
  const [rawText, setRawText] = useState("");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [usedGenerations, setUsedGenerations] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(LS_KEY) ?? "0", 10);
    setUsedGenerations(isNaN(stored) ? 0 : stored);
  }, []);

  function setField<K extends keyof LessonPlanFormState>(
    k: K,
    v: LessonPlanFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setFieldErrors((prev) => ({ ...prev, [k]: "" }));
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
    if (!form.lessonType) errors.lessonType = "Выберите тип урока";
    if (!form.lessonDuration) errors.lessonDuration = "Выберите продолжительность";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /* ─── Submit ─── */
  async function handleSubmit() {
    if (!validate()) return;

    if (usedGenerations >= TOTAL_GENERATIONS) {
      setServerError(
        `Исчерпан лимит генераций (${TOTAL_GENERATIONS}). Обратитесь к администратору.`
      );
      return;
    }

    setMode("generating");
    setResult(null);
    setServerError(null);
    setGenerationId(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/lesson-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          subject: form.subject,
          grade: parseInt(form.grade),
          topic: form.topic.trim(),
          lessonType: form.lessonType,
          lessonForm: form.lessonForm || undefined,
          lessonDuration: form.lessonDuration,
          lessonPosition: form.lessonPosition || undefined,
          examFormat:
            form.examFormat === "Без привязки" ? null : form.examFormat || null,
          textbookName: form.textbookName.trim() || null,
          textbookFileUrl: form.textbookFileUrl || null,
          extraInstructions: form.extraInstructions.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          errors?: { message: string }[];
        };
        if (res.status === 402) {
          setServerError("Исчерпан лимит генераций. Обратитесь к администратору.");
        } else {
          setServerError(
            data.message ??
              data.errors?.[0]?.message ??
              data.error ??
              "Ошибка запроса"
          );
        }
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
            const evt = JSON.parse(raw) as {
              text?: string;
              done?: boolean;
              generationId?: string;
              error?: string;
            };

            if (evt.text) {
              fullText += evt.text;
            }

            if (evt.done && evt.generationId) {
              setGenerationId(evt.generationId);
              setRawText(fullText);
              let parsed: LessonPlanResult | null = null;
              try {
                parsed = extractJson(fullText) as LessonPlanResult;
              } catch {
                // Show raw text fallback — don't block result display
              }
              setResult(parsed);
              setMode("result");
              const next = usedGenerations + 1;
              localStorage.setItem(LS_KEY, String(next));
              setUsedGenerations(next);
            }

            if (evt.error) {
              setServerError(evt.error);
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
    setServerError(null);
  }

  /* ─── Generating screen ─── */
  if (mode === "generating") {
    return (
      <div>
        <BackLink />
        <LessonPlanLoading onError={() => setMode("form")} />
      </div>
    );
  }

  /* ─── Result screen ─── */
  if (mode === "result" && generationId) {
    return (
      <div>
        <BackLink />
        <LessonPlanResultView
          data={result}
          rawText={rawText}
          generationId={generationId}
          onRegenerate={handleRegenerate}
        />
      </div>
    );
  }

  /* ─── Form screen ─── */
  return (
    <div>
      {serverError && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 18,
            fontSize: 14,
            color: "#DC2626",
          }}
        >
          {serverError}
        </div>
      )}

      <BackLink />

      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 900,
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
          }}
        >
          Конспект урока
        </h1>
      </div>

      <LessonPlanForm
        form={form}
        setField={setField}
        fieldErrors={fieldErrors}
        usedGenerations={usedGenerations}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/* ─── BackLink ───────────────────────────────────────────────────────────── */

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
