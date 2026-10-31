"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboard } from "../../lib/dashboard-context";

const DEFAULT_LAB_OPTIONS = [
  "Kabel",
  "Kalibrasi",
  "Transmisi",
  "Energy",
  "Device",
  "IPR",
  "FBA",
  "Lainnya",
];

const CLIENT_OPTIONS = [
  { value: "Semua", label: "Semua Klien" },
  { value: "Eksternal", label: "Eksternal" },
  { value: "Internal", label: "Internal" },
];

export default function NavbarFilters() {
  const { filters, setFilters, resetFilters, availableYears, availableLabs } =
    useDashboard();

  const [openDropdown, setOpenDropdown] = useState<"year" | "lab" | "client" | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenDropdown(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const yearsList =
    availableYears && availableYears.length > 0
      ? availableYears
      : [2020, 2021, 2022, 2023, 2024, 2025];

  const labsList =
    availableLabs && availableLabs.length > 0
      ? availableLabs
      : DEFAULT_LAB_OPTIONS;

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

  function setClient(ct: string) {
    setFilters({ ...filters, clientType: ct });
    setOpenDropdown(null);
  }

  const isYearFiltered = filters.years.length > 0;
  const isLabFiltered = filters.labs.length > 0;
  const isClientFiltered = filters.clientType !== "Semua";
  const hasAnyFilter = isYearFiltered || isLabFiltered || isClientFiltered;

  // Year label
  const yearLabel = !isYearFiltered
    ? "Semua"
    : filters.years.length === 1
    ? `${filters.years[0]}`
    : `${filters.years.length} Thn`;

  // Lab label
  const labLabel = !isLabFiltered
    ? "Semua"
    : filters.labs.length === 1
    ? filters.labs[0]
    : `${filters.labs.length} Lab`;

  // Client label
  const clientLabel = filters.clientType;

  return (
    <div ref={containerRef} className="flex items-center gap-1.5 sm:gap-2">
      {/* ── Year Filter Dropdown ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setOpenDropdown(openDropdown === "year" ? null : "year")
          }
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition shadow-2xs focus:outline-none ${
            isYearFiltered
              ? "border-red-300 bg-red-50 text-telkom-red font-semibold"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
          aria-expanded={openDropdown === "year"}
          aria-label="Filter Tahun"
        >
          {/* Calendar icon */}
          <svg
            className={`w-3.5 h-3.5 ${
              isYearFiltered ? "text-telkom-red" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-gray-400 font-normal">Tahun:</span>
          <span className="max-w-[70px] truncate">{yearLabel}</span>
          <svg
            className={`w-3 h-3 transition-transform ${
              openDropdown === "year" ? "rotate-180" : ""
            } ${isYearFiltered ? "text-telkom-red" : "text-gray-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {openDropdown === "year" && (
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5 text-xs">
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 mb-1">
              <span className="font-semibold text-gray-700">Pilih Tahun</span>
              {isYearFiltered && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, years: [] })}
                  className="text-telkom-red hover:underline font-medium text-[11px]"
                >
                  Pilih Semua
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, years: [] })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                  !isYearFiltered
                    ? "bg-red-50 text-telkom-red font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Semua Tahun</span>
                {!isYearFiltered && (
                  <svg
                    className="w-3.5 h-3.5 text-telkom-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              {yearsList.map((y) => {
                const selected = filters.years.includes(y);
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => toggleYear(y)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      selected
                        ? "bg-red-50 text-telkom-red font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{y}</span>
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      className="rounded border-gray-300 text-telkom-red focus:ring-telkom-red pointer-events-none"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Lab Filter Dropdown ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(openDropdown === "lab" ? null : "lab")}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition shadow-2xs focus:outline-none ${
            isLabFiltered
              ? "border-red-300 bg-red-50 text-telkom-red font-semibold"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
          aria-expanded={openDropdown === "lab"}
          aria-label="Filter Laboratorium"
        >
          {/* Lab/Beaker icon */}
          <svg
            className={`w-3.5 h-3.5 ${
              isLabFiltered ? "text-telkom-red" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          <span className="text-gray-400 font-normal">Lab:</span>
          <span className="max-w-[75px] truncate">{labLabel}</span>
          <svg
            className={`w-3 h-3 transition-transform ${
              openDropdown === "lab" ? "rotate-180" : ""
            } ${isLabFiltered ? "text-telkom-red" : "text-gray-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {openDropdown === "lab" && (
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5 text-xs">
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 mb-1">
              <span className="font-semibold text-gray-700">Pilih Laboratorium</span>
              {isLabFiltered && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, labs: [] })}
                  className="text-telkom-red hover:underline font-medium text-[11px]"
                >
                  Pilih Semua
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, labs: [] })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                  !isLabFiltered
                    ? "bg-red-50 text-telkom-red font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Semua Lab</span>
                {!isLabFiltered && (
                  <svg
                    className="w-3.5 h-3.5 text-telkom-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              {labsList.map((lab) => {
                const selected = filters.labs.includes(lab);
                return (
                  <button
                    key={lab}
                    type="button"
                    onClick={() => toggleLab(lab)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      selected
                        ? "bg-red-50 text-telkom-red font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">{lab}</span>
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      className="rounded border-gray-300 text-telkom-red focus:ring-telkom-red pointer-events-none"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Client Filter Dropdown ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setOpenDropdown(openDropdown === "client" ? null : "client")
          }
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition shadow-2xs focus:outline-none ${
            isClientFiltered
              ? "border-red-300 bg-red-50 text-telkom-red font-semibold"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
          aria-expanded={openDropdown === "client"}
          aria-label="Filter Tipe Klien"
        >
          {/* Building/Client icon */}
          <svg
            className={`w-3.5 h-3.5 ${
              isClientFiltered ? "text-telkom-red" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="text-gray-400 font-normal">Klien:</span>
          <span className="max-w-[70px] truncate">{clientLabel}</span>
          <svg
            className={`w-3 h-3 transition-transform ${
              openDropdown === "client" ? "rotate-180" : ""
            } ${isClientFiltered ? "text-telkom-red" : "text-gray-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {openDropdown === "client" && (
          <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5 text-xs">
            <div className="px-2 py-1 border-b border-gray-100 mb-1 font-semibold text-gray-700">
              Tipe Klien
            </div>
            <div className="space-y-0.5">
              {CLIENT_OPTIONS.map((opt) => {
                const active = filters.clientType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setClient(opt.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      active
                        ? "bg-red-50 text-telkom-red font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && (
                      <svg
                        className="w-3.5 h-3.5 text-telkom-red"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Reset button (only when active) ── */}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={resetFilters}
          title="Reset semua filter"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 transition border border-transparent hover:border-red-200"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
          <span className="hidden sm:inline">Reset</span>
        </button>
      )}
    </div>
  );
}
