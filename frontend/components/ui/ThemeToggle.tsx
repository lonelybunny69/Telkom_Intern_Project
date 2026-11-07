"use client";

import { useDashboard } from "../../lib/dashboard-context";

/**
 * ThemeToggle
 * -----------
 * Animated pill-style toggle button (Sun ↔ Moon) that persists the chosen
 * theme to localStorage and applies it globally via the `dark` class on
 * <html>. Uses DashboardContext so it works anywhere in the tree.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useDashboard();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className={[
        // pill shape
        "relative flex items-center gap-0 w-16 h-8 rounded-full border p-0.5",
        "transition-all duration-300 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-telkom-red focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900",
        isDark
          ? "bg-gray-800 border-gray-600 shadow-inner"
          : "bg-amber-50 border-amber-200 shadow-inner",
      ].join(" ")}
      style={
        isDark
          ? { background: "#1e2130", borderColor: "#4b5563" }
          : { background: "#fffbeb", borderColor: "#fcd34d" }
      }
    >
      {/* ── Track icons ── */}
      {/* Sun icon (left side of track) */}
      <span
        className="absolute left-1.5 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: isDark ? 0.3 : 1 }}
        aria-hidden
      >
        <SunIcon className="w-4 h-4 text-amber-400" />
      </span>

      {/* Moon icon (right side of track) */}
      <span
        className="absolute right-1.5 flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: isDark ? 1 : 0.3 }}
        aria-hidden
      >
        <MoonIcon className="w-3.5 h-3.5 text-indigo-300" />
      </span>

      {/* ── Sliding thumb ── */}
      <span
        className={[
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md",
          "transition-all duration-300 ease-in-out",
          isDark
            ? "translate-x-8 bg-gray-900"
            : "translate-x-0 bg-white",
        ].join(" ")}
        aria-hidden
      >
        {isDark ? (
          <MoonIcon className="w-3 h-3 text-indigo-400" />
        ) : (
          <SunIcon className="w-3.5 h-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}

// ── Inline SVG icons (no dependency) ──────────────────────────────────────────

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      stroke="none"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
