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
