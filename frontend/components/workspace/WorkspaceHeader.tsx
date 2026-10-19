"use client";

import { Moon, RefreshCw, Shield, Sun } from "lucide-react";
import { workspaceThemeClasses } from "../../lib/workspace-theme";
import type { WorkspaceTheme } from "../../lib/workspace-types";

interface WorkspaceHeaderProps {
  theme: WorkspaceTheme;
  selectedYear: string;
  isLoading: boolean;
  onThemeChange: (theme: WorkspaceTheme) => void;
  onYearChange: (year: string) => void;
  onRefresh: () => void;
}

const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function WorkspaceHeader({ theme, selectedYear, isLoading, onThemeChange, onYearChange, onRefresh }: WorkspaceHeaderProps) {
  const styles = workspaceThemeClasses[theme];
  return (
    <header className={`mb-7 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-center md:justify-between ${styles.border}`}>
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red">Revenue workspace</p>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl"><Shield className="h-7 w-7 shrink-0 text-brand-red" aria-hidden="true" />TELKOM FINANCIAL WORKSPACE</h1>
        <p className={`mt-2 text-sm ${styles.muted}`}>Kelola transaksi, pantau pendapatan, dan telusuri data utama.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Pilih tema workspace" className={`workspace-glass flex items-center gap-1 rounded-xl border p-1 ${styles.border}`}>
          {(["dark", "light"] as const).map((choice) => {
            const Icon = choice === "dark" ? Moon : Sun;
            return <button key={choice} type="button" onClick={() => onThemeChange(choice)} aria-pressed={theme === choice} aria-label={`Gunakan tema ${choice}`} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${theme === choice ? "workspace-brand-button" : `${styles.muted} hover:text-brand-red`}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />{choice === "dark" ? "Gelap" : "Terang"}
            </button>;
          })}
        </div>
        <label htmlFor="year-filter" className="sr-only">Filter tahun</label>
        <select id="year-filter" value={selectedYear} onChange={(event) => onYearChange(event.currentTarget.value)} className={`h-10 rounded-xl border px-3 text-sm outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 ${styles.input}`}>
          <option value="all">Semua Tahun</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <button type="button" onClick={onRefresh} disabled={isLoading} aria-label="Muat ulang data" className={`grid h-11 w-11 place-items-center rounded-xl border transition hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red disabled:opacity-50 ${styles.panel} ${styles.muted}`}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
