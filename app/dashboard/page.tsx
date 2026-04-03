"use client";

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
    id: "quiz-oge",
    title: "Тест в формате ОГЭ",
    desc: "Тест по структуре и требованиям основного государственного экзамена",
    href: "#",
    status: "coming_soon",
    illustrationGradient: ["#E1F5EE", "#9FE1CB"],
    accentColor: "#1A9B6C",
  },
  {
    id: "quiz-ege",
    title: "Тест в формате ЕГЭ",
    desc: "Тест по структуре и требованиям единого государственного экзамена",
    href: "#",
    status: "coming_soon",
    illustrationGradient: ["#EEEDFE", "#CECBF6"],
    accentColor: "#7B2FBE",
  },
  {
    id: "quiz-vpr",
    title: "Тест в формате ВПР",
    desc: "Тест по структуре всероссийской проверочной работы",
    href: "#",
    status: "coming_soon",
    illustrationGradient: ["#FFF8DC", "#FFE99A"],
    accentColor: "#B8860B",
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
  if (id === "quiz-oge")       return <QuizSvg color={color} />;
  if (id === "quiz-ege")       return <QuizSvg color={color} />;
  if (id === "quiz-vpr")       return <QuizSvg color={color} />;
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
      className={[
        "bg-white rounded-[14px] p-5 flex flex-row items-stretch gap-4 border-2 border-transparent h-full transition-[border-color,box-shadow] duration-150",
        active
          ? "cursor-pointer hover:border-fox-orange hover:shadow-[0_4px_16px_rgba(249,107,27,0.12)]"
          : "opacity-60 cursor-default",
      ].join(" ")}
    >
      {/* Left: content */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {!active && (
          <span className="inline-block bg-gray-200 text-gray-500 rounded-[20px] px-[10px] py-[2px] text-[10px] font-semibold tracking-[0.04em] uppercase self-start">
            Скоро
          </span>
        )}

        <h3 className="m-0 text-base font-extrabold text-[#1A1A1A] tracking-[-0.01em] leading-[1.25]">
          {tool.title}
        </h3>

        <p className="m-0 text-[13px] text-gray-500 leading-[1.55] flex-1">
          {tool.desc}
        </p>

        {/* Arrow circle */}
        <div className="mt-1">
          <div
            className={[
              "w-[30px] h-[30px] rounded-full flex items-center justify-center",
              active ? "bg-[#1A1A1A]" : "bg-gray-200",
            ].join(" ")}
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

      {/* Right: illustration — gradient is dynamic, stays as inline style */}
      <div
        className="w-[90px] h-20 rounded-xl flex items-center justify-center flex-shrink-0 self-start"
        style={{ background: `linear-gradient(135deg, ${g0} 0%, ${g1} 100%)` }}
      >
        <ToolSvg id={tool.id} color={active ? tool.accentColor : "#B0B0B8"} />
      </div>
    </div>
  );

  if (active) {
    return (
      <Link href={tool.href} className="no-underline block">
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
      <div className="fox-banner bg-white rounded-[20px] px-8 py-6 mb-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div>
          <p className="m-0 mb-1.5 font-black text-lg text-[#111] tracking-[-0.02em] leading-[1.3]">
            Ваш ИИ-методист — тесты и планы уроков за 2 минуты
          </p>
          <p className="m-0 text-sm text-[#777] leading-[1.5]">
            Выберите инструмент и укажите параметры — ИИ подготовит материал по ФГОС
          </p>
        </div>
        <Link href="/dashboard/quiz" className="fox-btn-primary fox-banner-cta">
          Попробовать →
        </Link>
      </div>

      {/* Tool cards grid */}
      <div className="fox-tools-grid gap-[14px]">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
