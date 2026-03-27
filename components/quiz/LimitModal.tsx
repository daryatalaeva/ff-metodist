"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
}

export default function LimitModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg("Введите email");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Ошибка");
      }
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Что-то пошло не так");
      setStatus("error");
    }
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 24,
          padding: "36px 32px",
          maxWidth: 440,
          width: "100%",
          fontFamily: "inherit",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 18,
            background: "none",
            border: "none",
            fontSize: 20,
            color: "#aaa",
            cursor: "pointer",
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{ fontSize: 40, marginBottom: 16, textAlign: "center" }}>
          🔒
        </div>

        {/* Title */}
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 20,
            fontWeight: 900,
            textAlign: "center",
            color: "#111",
          }}
        >
          Вы использовали все 20 генераций
        </h2>

        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: "#555",
            textAlign: "center",
            lineHeight: 1.55,
          }}
        >
          Оформите подписку, чтобы продолжить
        </p>

        {/* Price block */}
        <div
          style={{
            background: "#FEF0E6",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <span
            style={{ fontSize: 22, fontWeight: 900, color: "#F96B1B" }}
          >
            299 ₽/мес
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#888",
              marginLeft: 10,
              fontWeight: 400,
            }}
          >
            или 2 490 ₽/год
          </span>
        </div>

        {status === "sent" ? (
          <div
            style={{
              background: "#F0FDF4",
              border: "1.5px solid #86EFAC",
              borderRadius: 10,
              padding: "14px 18px",
              textAlign: "center",
              fontSize: 14,
              color: "#15803D",
              fontWeight: 600,
            }}
          >
            ✓ Заявка отправлена! Мы свяжемся с вами.
          </div>
        ) : (
          <>
            {/* Email input */}
            <input
              type="email"
              placeholder="Ваш email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="fox-input"
              style={{ marginBottom: errorMsg ? 4 : 12 }}
            />
            {errorMsg && (
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#DC2626",
                  marginBottom: 10,
                }}
              >
                {errorMsg}
              </span>
            )}

            {/* CTA */}
            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              style={{
                width: "100%",
                background: "#F96B1B",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: 13,
                fontSize: 15,
                fontWeight: 700,
                cursor: status === "loading" ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: status === "loading" ? 0.7 : 1,
                marginBottom: 10,
              }}
            >
              {status === "loading" ? "Отправляем…" : "Оставить заявку"}
            </button>

            {/* Secondary */}
            <button
              onClick={onClose}
              style={{
                width: "100%",
                background: "none",
                border: "1.5px solid rgba(0,0,0,0.12)",
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                color: "#555",
              }}
            >
              Напомнить в следующем месяце
            </button>
          </>
        )}
      </div>
    </div>
  );
}
