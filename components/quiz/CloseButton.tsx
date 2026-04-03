"use client";

export default function CloseButton() {
  return (
    <button
      onClick={() => window.close()}
      style={{
        borderRadius: 12,
        padding: "10px 24px",
        border: "1.5px solid rgba(0,0,0,0.15)",
        background: "white",
        color: "#333",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Закрыть
    </button>
  );
}
