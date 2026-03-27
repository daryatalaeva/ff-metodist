"use client";

import Header from "@/components/ui/Header";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_TABS = [
  { label: "ИНСТРУМЕНТЫ", href: "/dashboard" },
  { label: "МОИ ГЕНЕРАЦИИ", href: "/dashboard/history" },
  { label: "НАСТРОЙКИ", href: "/dashboard/settings" },
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
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F5F7",
      }}
    >
      <Header />

      {/* Nav tabs bar */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
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
                  padding: "16px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  color: active ? "#F96B1B" : "#888",
                  textDecoration: "none",
                  borderBottom: active
                    ? "2px solid #F96B1B"
                    : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main
        style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}
      >
        {children}
      </main>
    </div>
  );
}
