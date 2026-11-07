"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  minHeight?: number;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className = "",
  minHeight = 300,
}: ChartCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161820] shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────

export function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161820] shadow-sm ${className}`}
    >
      <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-1.5 h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="flex items-end gap-2 p-4" style={{ minHeight: 300 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded bg-gray-100 dark:bg-gray-800"
            style={{ height: `${40 + Math.random() * 160}px` }}
          />
        ))}
      </div>
    </div>
  );
}
