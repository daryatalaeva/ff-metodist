import Link from "next/link";

const TOOLS = [
  {
    id: "quiz",
    title: "Генератор тестов",
    desc: "Создавайте тесты по любому предмету с вариантами ответов и ключами",
    href: "/dashboard/quiz",
    active: true,
    accentColor: "#F96B1B",
    bgColor: "#FEF0E6",
  },
  {
    id: "lesson",
    title: "План урока",
    desc: "Готовый план урока по теме с целями, этапами и заданиями для учеников",
    href: "#",
    active: false,
    accentColor: "#2B7FFF",
    bgColor: "#E8F4FF",
  },
  {
    id: "char",
    title: "Характеристика",
    desc: "Педагогическая характеристика ученика по заданным параметрам",
    href: "#",
    active: false,
    accentColor: "#9333EA",
    bgColor: "#F3E8FF",
  },
  {
    id: "ktp",
    title: "КТП",
    desc: "Календарно-тематическое планирование на учебный год",
    href: "#",
    active: false,
    accentColor: "#16A34A",
    bgColor: "#DCFCE7",
  },
];

function QuizIllustration({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="5" width="24" height="30" rx="3.5" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.6"/>
      <rect x="12" y="4" width="10" height="5" rx="2" fill={color}/>
      <line x1="14" y1="15" x2="26" y2="15" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="14" y1="20" x2="26" y2="20" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="14" y1="25" x2="20" y2="25" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="33" cy="33" r="6" fill={color}/>
      <path d="M30.5 33L32 34.5L35.5 31" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LessonIllustration({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 11C22 11 15 8.5 8 10V34C15 32.5 22 35 22 35C22 35 29 32.5 36 34V10C29 8.5 22 11 22 11Z" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <line x1="22" y1="11" x2="22" y2="35" stroke={color} strokeWidth="1.6"/>
      <line x1="13" y1="16" x2="19" y2="15" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="13" y1="20" x2="19" y2="19" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="13" y1="24" x2="19" y2="23" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="25" y1="15" x2="31" y2="16" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="25" y1="19" x2="31" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="25" y1="23" x2="31" y2="24" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function CharIllustration({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="16" r="7" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.6"/>
      <path d="M9 37C9 30.373 14.925 25 22 25C29.075 25 35 30.373 35 37" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="32" cy="12" r="5" fill={color}/>
      <path d="M30 12L31.5 13.5L34.5 10.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function KtpIllustration({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="32" height="28" rx="4" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.6"/>
      <line x1="6" y1="18" x2="38" y2="18" stroke={color} strokeWidth="1.4"/>
      <line x1="15" y1="6" x2="15" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="29" y1="6" x2="29" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="11" y="22" width="5" height="5" rx="1.5" fill={color}/>
      <rect x="19.5" y="22" width="5" height="5" rx="1.5" fill={color}/>
      <rect x="28" y="22" width="5" height="5" rx="1.5" fill={color} fillOpacity="0.5"/>
      <rect x="11" y="30" width="5" height="5" rx="1.5" fill={color} fillOpacity="0.5"/>
      <rect x="19.5" y="30" width="5" height="5" rx="1.5" fill={color}/>
    </svg>
  );
}

function ToolIllustration({ id, color }: { id: string; color: string }) {
  if (id === "quiz") return <QuizIllustration color={color} />;
  if (id === "lesson") return <LessonIllustration color={color} />;
  if (id === "char") return <CharIllustration color={color} />;
  if (id === "ktp") return <KtpIllustration color={color} />;
  return null;
}

export default function DashboardPage() {
  return (
    <div>
      {/* Info banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #E8F4FF 0%, #F0EBFF 100%)",
          borderRadius: 16,
          padding: "20px 28px",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 15,
              color: "#111",
              letterSpacing: "-0.01em",
            }}
          >
            Укажите параметры — и получите готовый тест за 2 минуты
          </p>
          <p style={{ margin: "5px 0 0", fontSize: 14, color: "#555", lineHeight: 1.5 }}>
            ИИ-методист создаст тест по ФГОС с вариантами ответов и ключами
          </p>
        </div>
        <Link
          href="/dashboard/quiz"
          style={{
            background: "#F96B1B",
            color: "white",
            borderRadius: 12,
            padding: "11px 24px",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Попробовать
        </Link>
      </div>

      {/* Tool cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {TOOLS.map((tool) => {
          const illustrationColor = tool.active ? tool.accentColor : "#C8C8CC";

          const card = (
            <div
              className={tool.active ? "fox-card" : undefined}
              style={{
                background: "white",
                borderRadius: 16,
                padding: "24px 28px",
                border: tool.active
                  ? `2px solid ${tool.accentColor}22`
                  : "2px solid transparent",
                opacity: tool.active ? 1 : 0.55,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                cursor: tool.active ? "pointer" : "default",
                minHeight: 114,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#111",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {tool.title}
                  </h3>
                  {!tool.active && (
                    <span
                      style={{
                        background: "#F0F0F4",
                        color: "#999",
                        borderRadius: 20,
                        padding: "2px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      Скоро
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#6B6B80",
                    lineHeight: 1.55,
                  }}
                >
                  {tool.desc}
                </p>
              </div>

              {/* Illustration */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 16,
                  background: tool.active ? tool.bgColor : "#F0F0F4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ToolIllustration id={tool.id} color={illustrationColor} />
              </div>
            </div>
          );

          if (tool.active) {
            return (
              <Link
                key={tool.id}
                href={tool.href}
                style={{ textDecoration: "none", display: "block" }}
              >
                {card}
              </Link>
            );
          }
          return <div key={tool.id}>{card}</div>;
        })}
      </div>
    </div>
  );
}
