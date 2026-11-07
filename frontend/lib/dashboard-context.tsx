"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadAllData } from "./data-loader";
import type { RevenueRow, SpkRow } from "./data-loader";
import {
  applyRevenueFilters,
  applySpkFilters,
  type DashboardFilters,
} from "./data-utils";

interface DashboardContextValue {
  // raw data
  spkData: SpkRow[];
  revenueData: RevenueRow[];
  // filtered data
  filteredSpk: SpkRow[];
  filteredRevenue: RevenueRow[];
  // loading state
  isLoading: boolean;
  loadError: string | null;
  // filters
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  resetFilters: () => void;
  // available filter options (derived from raw data)
  availableYears: number[];
  availableLabs: string[];
  availableTestTypes: string[];
  // theme
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

const DEFAULT_FILTERS: DashboardFilters = {
  years: [],
  labs: [],
  testTypes: [],
  clientType: "Semua",
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [spkData, setSpkData] = useState<SpkRow[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("telkom-theme") as "light" | "dark" | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.setAttribute("data-theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.setAttribute("data-theme", "light");
        }
      } else if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback((nextTheme: "light" | "dark") => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem("telkom-theme", nextTheme);
    } catch {
      // ignore
    }
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("telkom-theme", next);
      } catch {
        // ignore
      }
      if (next === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }
      return next;
    });
  }, []);

  useEffect(() => {
    loadAllData()
      .then(({ spk, revenue }) => {
        setSpkData(spk);
        setRevenueData(revenue);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Gagal memuat data");
        setIsLoading(false);
      });
  }, []);

  const availableYears = useMemo(
    () => [...new Set(revenueData.map((r) => r.Tahun))].sort(),
    [revenueData]
  );

  const availableLabs = useMemo(
    () =>
      [...new Set(spkData.map((r) => r.Lab).filter(Boolean))].sort(),
    [spkData]
  );

  const availableTestTypes = useMemo(
    () =>
      [
        ...new Set([
          ...spkData.map((r) => r.Jenis_Pengujian),
          ...revenueData.map((r) => r.Kategori_Uji),
        ].filter(Boolean)),
      ].sort(),
    [spkData, revenueData]
  );

  const filteredRevenue = useMemo(
    () => applyRevenueFilters(revenueData, filters),
    [revenueData, filters]
  );

  const filteredSpk = useMemo(
    () => applySpkFilters(spkData, filters),
    [spkData, filters]
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const value: DashboardContextValue = {
    spkData,
    revenueData,
    filteredSpk,
    filteredRevenue,
    isLoading,
    loadError,
    filters,
    setFilters,
    resetFilters,
    availableYears,
    availableLabs,
    availableTestTypes,
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
