"use client";

import Header from "@/components/ui/Header";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_TABS = [
  { label: "Инструменты", href: "/dashboard" },
  { label: "Мои генерации", href: "/dashboard/history" },
  { label: "Настройки", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTools =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/quiz");

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7FC" }}>
      <Header />

      {/* Nav tabs bar — horizontally scrollable on mobile */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div
          className="fox-nav-scroll"
          style={{
            display: "flex",
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {NAV_TABS.map((tab) => {
            const active =
              tab.href === "/dashboard"
                ? isTools
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: "block",
                  padding: "15px 20px",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#F96B1B" : "#777",
                  textDecoration: "none",
                  borderBottom: active
                    ? "2px solid #F96B1B"
                    : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="fox-main">{children}</main>
    </div>
  );
}
