"use client";

import { useEffect, useState } from "react";

const TIMEOUT_MS = 60_000;

export interface LessonPlanLoadingProps {
  /** Called when the user clicks "Попробовать снова" — returns them to the form. */
  onError?: () => void;
}

export default function LessonPlanLoading({ onError }: LessonPlanLoadingProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return <ErrorState onRetry={onError} />;
  }

  return <LoadingState />;
}

/* ─── Loading state ─────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={card}>
      <div style={{ textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
        {/* Hourglass */}
        <div
          style={{
            fontSize: 52,
            marginBottom: 24,
            display: "inline-block",
            animation: "hourglass 2s ease-in-out infinite",
            lineHeight: 1,
          }}
        >
          ⏳
        </div>

        {/* Title */}
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 18,
            fontWeight: 700,
            color: "#1A1A1A",
            letterSpacing: "-0.01em",
          }}
        >
          Составляем план урока…
        </h2>

        {/* Subtitle */}
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6B7280" }}>
          Обычно это занимает 15–30 секунд
        </p>

        {/* Animated dots */}
        <Dots />
      </div>
    </div>
  );
}

/* ─── Error state ────────────────────────────────────────────────────────── */

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={card}>
      <div style={{ textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
        {/* Error icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <ErrorIcon />
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 18,
            fontWeight: 700,
            color: "#1A1A1A",
            letterSpacing: "-0.01em",
          }}
        >
          Не удалось составить план
        </h2>

        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6B7280" }}>
          Попробуй ещё раз
        </p>

        <button className="fox-btn-primary" onClick={onRetry} type="button">
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

/* ─── Animated dots indicator ────────────────────────────────────────────── */

function Dots() {
  return (
    <>
      <style>{`
        @keyframes lp-dot-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
        aria-label="Загрузка"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#F96B1B",
              display: "inline-block",
              animation: `lp-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ─── Error icon SVG ─────────────────────────────────────────────────────── */

function ErrorIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 9v4M12 17h.01"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Shared card style ───────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  padding: "48px 32px",
};
