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
    emoji: "📝",
  },
  {
    id: "lesson",
    title: "План урока",
    desc: "Готовый план урока по теме с целями, этапами и заданиями для учеников",
    href: "#",
    active: false,
    accentColor: "#2B7FFF",
    bgColor: "#E8F4FF",
    emoji: "📚",
  },
  {
    id: "char",
    title: "Характеристика",
    desc: "Педагогическая характеристика ученика по заданным параметрам",
    href: "#",
    active: false,
    accentColor: "#9333EA",
    bgColor: "#F3E8FF",
    emoji: "👤",
  },
  {
    id: "ktp",
    title: "КТП",
    desc: "Календарно-тематическое планирование на учебный год",
    href: "#",
    active: false,
    accentColor: "#16A34A",
    bgColor: "#DCFCE7",
    emoji: "📅",
  },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Info banner */}
      <div
        style={{
          background: "#E8F4FF",
          borderRadius: 12,
          padding: "18px 24px",
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
            }}
          >
            Укажите параметры — и получите готовый тест за 2 минуты
          </p>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "#555" }}>
            ИИ-методист создаст тест по ФГОС с вариантами ответов и ключами
          </p>
        </div>
        <Link
          href="/dashboard/quiz"
          style={{
            background: "#2B7FFF",
            color: "white",
            borderRadius: 10,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
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
          const card = (
            <div
              style={{
                background: "white",
                borderRadius: 14,
                padding: "24px 28px",
                border: tool.active
                  ? "2px solid #F96B1B"
                  : "2px solid transparent",
                opacity: tool.active ? 1 : 0.6,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                cursor: tool.active ? "pointer" : "default",
                minHeight: 110,
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
                    style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}
                  >
                    {tool.title}
                  </h3>
                  {!tool.active && (
                    <span
                      style={{
                        background: "#F3F4F6",
                        color: "#888",
                        borderRadius: 20,
                        padding: "2px 10px",
                        fontSize: 11,
                        fontWeight: 600,
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
                    color: "#666",
                    lineHeight: 1.55,
                  }}
                >
                  {tool.desc}
                </p>
              </div>

              {/* Illustration */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  background: tool.active ? tool.bgColor : "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  flexShrink: 0,
                }}
              >
                {tool.emoji}
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
