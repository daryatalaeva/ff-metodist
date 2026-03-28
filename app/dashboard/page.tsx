import Link from "next/link";

/* ─── Tool definitions ───────────────────────────────────────────────────── */

type ToolStatus = "active" | "coming_soon";

interface Tool {
  id: string;
  title: string;
  desc: string;
  href: string;
  status: ToolStatus;
  ctaLabel?: string;
  /** Gradient stops for the illustration box */
  illustrationGradient: [string, string];
  accentColor: string;
}

const TOOLS: Tool[] = [
  {
    id: "quiz",
    title: "Генератор тестов",
    desc: "Создавайте тесты по любому предмету с вариантами ответов и ключами",
    href: "/dashboard/quiz",
    status: "active",
    ctaLabel: "Создать тест",
    illustrationGradient: ["#FEF0E6", "#FCCFAB"],
    accentColor: "#F96B1B",
  },
  {
    id: "lesson-plan",
    title: "План урока",
    desc: "Поурочный план с целями, этапами и методами",
    href: "/dashboard/lesson-plan",
    status: "active",
    ctaLabel: "Составить план",
    illustrationGradient: ["#E6F1FB", "#B5D4F4"],
    accentColor: "#2B7FFF",
  },
  {
    id: "characteristic",
    title: "Характеристика",
    desc: "Характеристика на ученика для ПМПК и портфолио",
    href: "#",
    status: "coming_soon",
    illustrationGradient: ["#EEEDFE", "#CECBF6"],
    accentColor: "#7B2FBE",
  },
];

/* ─── Illustrations ───────────────────────────────────────────────────────── */

function QuizSvg({ color }: { color: string }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
      <rect x="9" y="6" width="24" height="30" rx="3.5" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.6"/>
      <rect x="13" y="5" width="10" height="5" rx="2" fill={color}/>
      <line x1="15" y1="16" x2="27" y2="16" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="15" y1="21" x2="27" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="15" y1="26" x2="21" y2="26" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="34" cy="34" r="7" fill={color}/>
      <path d="M31.5 34L33 35.5L36.5 32" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LessonPlanSvg({ color }: { color: string }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
      <rect x="7" y="8" width="32" height="30" rx="4" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.6"/>
      <line x1="7" y1="16" x2="39" y2="16" stroke={color} strokeWidth="1.4"/>
      <line x1="23" y1="8" x2="23" y2="38" stroke={color} strokeWidth="1.4" strokeDasharray="2 2"/>
      <line x1="12" y1="21" x2="20" y2="21" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="12" y1="25" x2="19" y2="25" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="12" y1="29" x2="20" y2="29" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="26" y1="21" x2="34" y2="21" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="26" y1="25" x2="32" y2="25" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="26" y1="29" x2="34" y2="29" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function CharSvg({ color }: { color: string }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
      <circle cx="23" cy="17" r="8" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.6"/>
      <path d="M9 39C9 31.82 15.268 26 23 26C30.732 26 37 31.82 37 39" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="33" cy="12" r="6" fill={color}/>
      <path d="M30.5 12L32 13.5L35.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ToolSvg({ id, color }: { id: string; color: string }) {
  if (id === "quiz")           return <QuizSvg color={color} />;
  if (id === "lesson-plan")    return <LessonPlanSvg color={color} />;
  if (id === "characteristic") return <CharSvg color={color} />;
  return null;
}

/* ─── Card ────────────────────────────────────────────────────────────────── */

function ToolCard({ tool }: { tool: Tool }) {
  const active = tool.status === "active";
  const [g0, g1] = tool.illustrationGradient;

  const inner = (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "20px",
        opacity: active ? 1 : 0.6,
        cursor: active ? "pointer" : "default",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: 16,
        border: "2px solid transparent",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        height: "100%",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        if (!active) return;
        (e.currentTarget as HTMLDivElement).style.borderColor = "#F96B1B";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(249,107,27,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Left: content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {/* Coming soon badge */}
        {!active && (
          <span
            style={{
              display: "inline-block",
              background: "#E5E7EB",
              color: "#6B7280",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              alignSelf: "flex-start",
            }}
          >
            Скоро
          </span>
        )}

        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 800,
            color: "#1A1A1A",
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
          }}
        >
          {tool.title}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 1.55,
            flex: 1,
          }}
        >
          {tool.desc}
        </p>

        {/* Arrow circle */}
        <div style={{ marginTop: 4 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: active ? "#1A1A1A" : "#E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke={active ? "white" : "#6B7280"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Right: illustration */}
      <div
        style={{
          width: 90,
          height: 80,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${g0} 0%, ${g1} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          alignSelf: "flex-start",
        }}
      >
        <ToolSvg id={tool.id} color={active ? tool.accentColor : "#B0B0B8"} />
      </div>
    </div>
  );

  if (active) {
    return (
      <Link
        href={tool.href}
        style={{ textDecoration: "none", display: "block" }}
      >
        {inner}
      </Link>
    );
  }

  return <div>{inner}</div>;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <div>
      {/* Info banner */}
      <div
        className="fox-banner"
        style={{
          background: "white",
          borderRadius: 20,
          padding: "24px 32px",
          marginBottom: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontWeight: 900,
              fontSize: 18,
              color: "#111",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}
          >
            Ваш ИИ-методист — тесты и планы уроков за 2 минуты
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "#777", lineHeight: 1.5 }}>
            Выберите инструмент и укажите параметры — ИИ подготовит материал по ФГОС
          </p>
        </div>
        <Link href="/dashboard/quiz" className="fox-btn-primary fox-banner-cta">
          Попробовать →
        </Link>
      </div>

      {/* Tool cards grid */}
      <div
        className="fox-tools-grid"
        style={{ gap: 14 }}
      >
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
