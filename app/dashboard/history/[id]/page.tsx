"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QuizResultView from "@/components/quiz/QuizResult";
import type { QuizResult } from "@/lib/types";

interface GenerationDetail {
  id: string;
  subject: string | null;
  grade: number | null;
  topic: string | null;
  examFormat: string | null;
  questionCount: number | null;
  questionTypes: string[];
  resultJson: unknown;
  feedback: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [generation, setGeneration] = useState<GenerationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/history/${params.id}`);
        if (!res.ok) throw new Error("Не найдено");
        const data = await res.json() as { generation: GenerationDetail };
        setGeneration(data.generation);
      } catch {
        setError("Не удалось загрузить тест.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#999", fontSize: 15 }}>
        Загружаем тест…
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div>
        <BackLink />
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
          {error ?? "Генерация не найдена."}
        </div>
      </div>
    );
  }

  const result = generation.resultJson as QuizResult;

  return (
    <div>
      <BackLink />

      {/* Meta header */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "18px 24px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap" as const,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
          {generation.subject && (
            <span style={{
              background: "#EDE9FE", color: "#7B2FBE",
              borderRadius: 20, padding: "3px 12px",
              fontSize: 13, fontWeight: 700,
            }}>
              {generation.subject}
            </span>
          )}
          {generation.grade && (
            <span style={{
              background: "#F7F7FC", color: "#555",
              borderRadius: 20, padding: "3px 12px",
              fontSize: 13, fontWeight: 700,
            }}>
              {generation.grade} класс
            </span>
          )}
          {generation.examFormat && generation.examFormat !== "none" && (
            <span style={{
              background: "#FEF0E6", color: "#F96B1B",
              borderRadius: 20, padding: "3px 12px",
              fontSize: 13, fontWeight: 700,
            }}>
              {generation.examFormat}
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, color: "#BBB" }}>
          {formatDate(generation.createdAt)}
        </span>
      </div>

      {/* Quiz result */}
      <div style={{ background: "white", borderRadius: 20, padding: "28px 32px" }}>
        <QuizResultView
          result={result}
          generationId={generation.id}
          onRegenerate={() => router.push("/dashboard/quiz")}
        />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <div style={{ marginBottom: 20 }}>
      <Link
        href="/dashboard/history"
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
        ‹ Мои генерации
      </Link>
    </div>
  );
}
