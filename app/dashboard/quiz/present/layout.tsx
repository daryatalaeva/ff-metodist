"use client";

import { useEffect } from "react";

export default function PresentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lock body scroll in present mode
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function requestFullscreen() {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        fontSize: "var(--present-base-font-size, 16px)",
      }}
    >
      <style>{`
        @media (min-width: 1600px) { :root { --present-base-font-size: 17.6px; } }
        @media (min-width: 1920px) { :root { --present-base-font-size: 19.2px; } }
      `}</style>

      {/* Fullscreen button */}
      <button
        onClick={requestFullscreen}
        title="Полноэкранный режим"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 50,
          background: "rgba(0,0,0,0.06)",
          border: "none",
          borderRadius: 8,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M1 6V1H6M12 1H17V6M17 12V17H12M6 17H1V12" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "48px 64px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
