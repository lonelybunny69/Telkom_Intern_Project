"use client";

import { useDashboard } from "../../lib/dashboard-context";
import type { DashboardFilters } from "../../lib/data-utils";

const LAB_OPTIONS = ["Kabel", "Kalibrasi", "Transmisi", "Energy", "Device", "IPR", "FBA", "Lainnya"];
const TEST_TYPE_OPTIONS = ["QA", "TA", "VT", "KAL", "STEL"];
const CLIENT_TYPE_OPTIONS = ["Semua", "Eksternal", "Internal"];

export default function GlobalFilters() {
  const { filters, setFilters, resetFilters, availableYears } = useDashboard();

  function toggleYear(y: number) {
    const next = filters.years.includes(y)
      ? filters.years.filter((x) => x !== y)
      : [...filters.years, y];
    setFilters({ ...filters, years: next });
  }

  function toggleLab(lab: string) {
    const next = filters.labs.includes(lab)
      ? filters.labs.filter((x) => x !== lab)
      : [...filters.labs, lab];
    setFilters({ ...filters, labs: next });
  }

  function toggleTestType(tt: string) {
    const next = filters.testTypes.includes(tt)
      ? filters.testTypes.filter((x) => x !== tt)
      : [...filters.testTypes, tt];
    setFilters({ ...filters, testTypes: next });
  }

  function setClientType(ct: string) {
    setFilters({ ...filters, clientType: ct });
  }

  const hasFilters =
    filters.years.length > 0 ||
    filters.labs.length > 0 ||
    filters.testTypes.length > 0 ||
    filters.clientType !== "Semua";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      {/* Year chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tahun:</span>
        {availableYears.map((y) => (
          <button
            key={y}
            onClick={() => toggleYear(y)}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
              filters.years.includes(y)
                ? "bg-telkom-red text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Lab chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lab:</span>
        {LAB_OPTIONS.map((lab) => (
          <button
            key={lab}
            onClick={() => toggleLab(lab)}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
              filters.labs.includes(lab)
                ? "bg-telkom-red text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {lab}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Test type chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis:</span>
        {TEST_TYPE_OPTIONS.map((tt) => (
          <button
            key={tt}
            onClick={() => toggleTestType(tt)}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
              filters.testTypes.includes(tt)
                ? "bg-telkom-red text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tt}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Client type */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Klien:</span>
        {CLIENT_TYPE_OPTIONS.map((ct) => (
          <button
            key={ct}
            onClick={() => setClientType(ct)}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
              filters.clientType === ct
                ? "bg-telkom-red text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {ct}
          </button>
        ))}
      </div>

      {/* Reset */}
      {hasFilters && (
        <>
          <div className="h-5 w-px bg-gray-200" />
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
            Reset Filter
          </button>
        </>
      )}
    </div>
  );
}
