export default function Header() {
  return (
    <header
      style={{
        height: 60,
        background: "white",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button
          style={{
            background: "#111",
            color: "white",
            border: "none",
            borderRadius: 20,
            padding: "7px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        >
          Меню
        </button>

        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: "0.05em",
              color: "#111",
            }}
          >
            ФОКСФОРД
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 10,
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
            background: "#A855F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          А
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
          Анна Петрова
        </span>
      </div>
    </header>
  );
}
