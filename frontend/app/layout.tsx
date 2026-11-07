import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { DashboardProvider } from "../lib/dashboard-context";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Telkom Revenue Dashboard",
  description:
    "Dashboard analitik revenue Telkom — data SPK & transaksi 2020-2025.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
         * Inline script runs before React hydration so there is ZERO flash of
         * wrong theme (FOUT).  It:
         *   1. Reads localStorage["telkom-theme"]
         *   2. Falls back to OS preference
         *   3. Applies .dark + data-theme="dark" to <html> immediately
         *   4. After a tick, adds .theme-ready which re-enables CSS transitions
         *      (see globals.css: html:not(.theme-ready) * { transition: none })
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var t = localStorage.getItem("telkom-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (t === "dark" || (!t && prefersDark)) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch(e) {}
  /* Enable transitions after first paint so there's no flash */
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      document.documentElement.classList.add("theme-ready");
    });
  });
})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--ds-page-bg)] text-[var(--ds-text)]">
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
