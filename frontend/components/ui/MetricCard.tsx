"use client";

import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number | null; // % change, null = no trend shown
  icon?: ReactNode;
  highlight?: boolean; // use red accent
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  highlight = false,
}: MetricCardProps) {
  const trendColor =
    trend === null || trend === undefined
      ? ""
      : trend >= 0
      ? "text-green-600"
      : "text-red-500";

  const trendSymbol =
    trend !== null && trend !== undefined
      ? trend >= 0
        ? "▲"
        : "▼"
      : "";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white dark:bg-[#161820] p-5 shadow-sm transition-shadow hover:shadow-md ${
        highlight
          ? "border-telkom-red/40 dark:border-telkom-red/50"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      {/* Accent stripe */}
      {highlight && (
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-telkom-red" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 pl-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {value}
          </p>
          {(subtitle !== undefined || trend !== null) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {trend !== null && trend !== undefined && (
                <span className={`font-semibold ${trendColor}`}>
                  {trendSymbol} {Math.abs(trend).toFixed(1)}% YoY
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
