import type { RevenueRow, SpkRow } from "./data-loader";

// ────────────────────────────────────────────────────────
// Format helpers
// ────────────────────────────────────────────────────────

export function formatRupiah(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

// ────────────────────────────────────────────────────────
// Generic aggregation
// ────────────────────────────────────────────────────────

export function groupBy<T>(arr: T[], key: keyof T): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = String(item[key]);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
}

export function topN<T>(
  arr: T[],
  key: keyof T,
  n: number,
  sortDesc = true
): T[] {
  return [...arr]
    .sort((a, b) =>
      sortDesc ? Number(b[key]) - Number(a[key]) : Number(a[key]) - Number(b[key])
    )
    .slice(0, n);
}

export function countBy<T>(arr: T[], key: keyof T): { name: string; value: number }[] {
  const map = groupBy(arr, key);
  return Array.from(map.entries())
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);
}

// ────────────────────────────────────────────────────────
// Month ordering
// ────────────────────────────────────────────────────────

export const MONTH_ORDER = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function monthIndex(bulan: string): number {
  return MONTH_ORDER.indexOf(bulan);
}

// ────────────────────────────────────────────────────────
// Revenue aggregations
// ────────────────────────────────────────────────────────

export interface YearRevenue {
  tahun: number;
  revenue: number;
  trxCount: number;
}

export function revenueByYear(rows: RevenueRow[]): YearRevenue[] {
  const map = groupBy(rows, "Tahun");
  return Array.from(map.entries())
    .map(([y, items]) => ({
      tahun: Number(y),
      revenue: sumBy(items, "Nominal_Revenue"),
      trxCount: items.length,
    }))
    .sort((a, b) => a.tahun - b.tahun);
}

export interface LabelValue {
  name: string;
  value: number;
}

export function revenueByField(rows: RevenueRow[], field: keyof RevenueRow): LabelValue[] {
  const map = groupBy(rows, field);
  return Array.from(map.entries())
    .map(([name, items]) => ({
      name: name || "(Tidak Diisi)",
      value: sumBy(items, "Nominal_Revenue"),
    }))
    .sort((a, b) => b.value - a.value);
}

export function revenueByMonth(rows: RevenueRow[], year?: number): LabelValue[] {
  const filtered = year ? rows.filter((r) => r.Tahun === year) : rows;
  const map = groupBy(filtered, "Bulan");
  return MONTH_ORDER.map((m) => ({
    name: m.slice(0, 3),
    value: sumBy(map.get(m) ?? [], "Nominal_Revenue"),
  }));
}

// ────────────────────────────────────────────────────────
// SPK aggregations
// ────────────────────────────────────────────────────────

export function spkByYear(rows: SpkRow[]): { tahun: number; spkCount: number; totalBiaya: number }[] {
  const map = groupBy(rows, "Tahun");
  return Array.from(map.entries())
    .map(([y, items]) => ({
      tahun: Number(y),
      spkCount: sumBy(items, "Jumlah_SPK"),
      totalBiaya: sumBy(items, "Biaya_SPK"),
    }))
    .sort((a, b) => a.tahun - b.tahun);
}

export function spkByMonth(rows: SpkRow[], year?: number): { name: string; spkCount: number }[] {
  const filtered = year ? rows.filter((r) => r.Tahun === year) : rows;
  const map = groupBy(filtered, "Bulan");
  return MONTH_ORDER.map((m) => ({
    name: m.slice(0, 3),
    spkCount: sumBy(map.get(m) ?? [], "Jumlah_SPK"),
  }));
}

// ────────────────────────────────────────────────────────
// Top clients
// ────────────────────────────────────────────────────────

export interface ClientSummary {
  name: string;
  revenue: number;
  trxCount: number;
  spkCount: number;
}

export function topClients(
  revenue: RevenueRow[],
  spk: SpkRow[],
  n = 10
): ClientSummary[] {
  const revMap = groupBy(revenue, "Pelanggan_Key");
  const spkMap = groupBy(spk, "Pelanggan_Key");

  const keys = new Set([...revMap.keys(), ...spkMap.keys()]);
  const clients: ClientSummary[] = [];

  for (const key of keys) {
    if (!key || key === "(Tidak Diisi)") continue;
    const revRows = revMap.get(key) ?? [];
    const spkRows = spkMap.get(key) ?? [];
    clients.push({
      name: revRows[0]?.Perusahaan || spkRows[0]?.Perusahaan || key,
      revenue: sumBy(revRows, "Nominal_Revenue"),
      trxCount: revRows.length,
      spkCount: sumBy(spkRows, "Jumlah_SPK"),
    });
  }

  return clients.sort((a, b) => b.revenue - a.revenue).slice(0, n);
}

// ────────────────────────────────────────────────────────
// Filter helpers
// ────────────────────────────────────────────────────────

export interface DashboardFilters {
  years: number[];
  labs: string[];
  testTypes: string[];
  clientType: string; // "Semua" | "Eksternal" | "Internal"
}

export function applyRevenueFilters(rows: RevenueRow[], filters: DashboardFilters): RevenueRow[] {
  return rows.filter((r) => {
    if (filters.years.length && !filters.years.includes(r.Tahun)) return false;
    if (filters.labs.length && !filters.labs.includes(r.Domain_Lab) && !filters.labs.includes(r.Laboratorium)) return false;
    if (filters.testTypes.length && !filters.testTypes.includes(r.Kategori_Uji)) return false;
    return true;
  });
}

export function applySpkFilters(rows: SpkRow[], filters: DashboardFilters): SpkRow[] {
  return rows.filter((r) => {
    if (filters.years.length && !filters.years.includes(r.Tahun)) return false;
    if (filters.labs.length && !filters.labs.includes(r.Lab)) return false;
    if (filters.testTypes.length && !filters.testTypes.includes(r.Jenis_Pengujian)) return false;
    if (filters.clientType !== "Semua" && r.Sumber_SPK !== filters.clientType) return false;
    return true;
  });
}

// ────────────────────────────────────────────────────────
// YoY growth
// ────────────────────────────────────────────────────────

export function yoyGrowth(data: YearRevenue[], year: number): number | null {
  const curr = data.find((d) => d.tahun === year);
  const prev = data.find((d) => d.tahun === year - 1);
  if (!curr || !prev || prev.revenue === 0) return null;
  return ((curr.revenue - prev.revenue) / prev.revenue) * 100;
}
