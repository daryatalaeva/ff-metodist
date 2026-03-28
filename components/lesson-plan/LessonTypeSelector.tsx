"use client";

export type LessonType =
  | "new_knowledge"
  | "reflection"
  | "methodology"
  | "developmental_control"
  | "combined";

const TYPES: { value: LessonType; label: string; desc: string }[] = [
  {
    value: "new_knowledge",
    label: "Урок открытия нового знания",
    desc: "Вводим новую тему, понятия, способы действия",
  },
  {
    value: "reflection",
    label: "Урок рефлексии",
    desc: "Закрепляем пройденное, работаем над ошибками",
  },
  {
    value: "methodology",
    label: "Общеметодологический урок",
    desc: "Систематизируем и обобщаем большой раздел",
  },
  {
    value: "developmental_control",
    label: "Урок развивающего контроля",
    desc: "Контрольная или проверочная работа с разбором",
  },
  {
    value: "combined",
    label: "Комбинированный урок",
    desc: "Несколько дидактических задач в одном уроке",
  },
];

interface LessonTypeSelectorProps {
  value: LessonType;
  onChange: (v: LessonType) => void;
  error?: string;
}

export default function LessonTypeSelector({
  value,
  onChange,
  error,
}: LessonTypeSelectorProps) {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TYPES.map((t) => {
          const active = value === t.value;
          return (
            <div
              key={t.value}
              role="radio"
              aria-checked={active}
              tabIndex={0}
              onClick={() => onChange(t.value)}
              onKeyDown={(e) => e.key === "Enter" && onChange(t.value)}
              style={{
                border: `${active ? "2px" : "1.5px"} solid ${
                  active ? "#F96B1B" : "rgba(0,0,0,0.15)"
                }`,
                borderRadius: 10,
                padding: "14px 16px",
                cursor: "pointer",
                background: active ? "#FEF0E6" : "white",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                transition: "all 0.15s ease",
                userSelect: "none",
                outline: "none",
              }}
            >
              {/* Radio dot */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `1.5px solid ${active ? "#F96B1B" : "rgba(0,0,0,0.3)"}`,
                  background: active ? "#F96B1B" : "white",
                  flexShrink: 0,
                  marginTop: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                {active && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "white",
                    }}
                  />
                )}
              </div>

              {/* Text */}
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#1A1A1A",
                    marginBottom: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {t.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    lineHeight: 1.45,
                  }}
                >
                  {t.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <span
          style={{
            display: "block",
            fontSize: 12,
            color: "#DC2626",
            marginTop: 6,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
