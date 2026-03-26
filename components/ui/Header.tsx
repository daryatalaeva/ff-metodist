export default function Header() {
  return (
    <header
      style={{
        height: 58,
        background: "white",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <button
          style={{
            background: "#000",
            color: "white",
            border: "none",
            borderRadius: 20,
            padding: "6px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.01em",
          }}
        >
          Меню
        </button>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: "0.06em",
              color: "#000",
            }}
          >
            ФОКСФОРД
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 11,
              color: "#F96B1B",
              letterSpacing: "0.12em",
            }}
          >
            МЕТОДИСТ
          </span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#C084FC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          А
        </div>
        <span style={{ fontSize: 14, fontWeight: 400, color: "#333" }}>
          Анна Петрова
        </span>
      </div>
    </header>
  );
}
