export default function Header() {
  return (
    <header
      className="fox-header-padding"
      style={{
        height: 62,
        background: "white",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Menu + Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Меню — dark pill with hamburger icon, matches foxford.ru */}
        <button
          style={{
            background: "#1A1A2E",
            color: "white",
            border: "none",
            borderRadius: 24,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 7,
            letterSpacing: "-0.01em",
          }}
        >
          {/* Hamburger icon */}
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
            <rect width="14" height="2" rx="1" fill="white"/>
            <rect y="4.5" width="14" height="2" rx="1" fill="white"/>
            <rect y="9" width="14" height="2" rx="1" fill="white"/>
          </svg>
          Меню
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Fox icon */}
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 16L5 6L9 12L14 0L19 12L23 6L28 16L22 14L20 20H8L6 14L0 16Z" fill="#F96B1B"/>
            <path d="M9 12L14 0L19 12" fill="#F0A500"/>
          </svg>
          <span
            style={{
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: "0.06em",
              color: "#111",
              textTransform: "uppercase" as const,
            }}
          >
            ФОКСФОРД
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 10,
              color: "#F96B1B",
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
            }}
          >
            МЕТОДИСТ
          </span>
        </div>
      </div>

      {/* Right: User */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#7B2FBE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          А
        </div>
        <div className="fox-header-username" style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Анна Петрова</div>
          <div style={{ fontSize: 11, color: "#999", fontWeight: 400 }}>Учитель</div>
        </div>
        {/* Dropdown arrow */}
        <svg className="fox-header-username" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </header>
  );
}
