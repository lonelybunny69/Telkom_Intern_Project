"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../../ui/ChartCard";
import DataTable from "../../ui/DataTable";
import { useDashboard } from "../../../lib/dashboard-context";
import {
  formatRupiah,
  formatNumber,
  groupBy,
  sumBy,
  revenueByField,
  spkByYear,
  MONTH_ORDER,
} from "../../../lib/data-utils";

const RED = "#E31E24";
const COLORS = ["#E31E24", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

export default function OperationalAnalytics() {
  const { filteredRevenue, filteredSpk, theme } = useDashboard();

  // SPK by year
  const spkYear = useMemo(() => spkByYear(filteredSpk), [filteredSpk]);

  // Triwulan comparison
  const twData = useMemo(() => {
    const quarters = ["TW1", "TW2", "TW3", "TW4"];
    return quarters.map((tw) => {
      const rows = filteredSpk.filter((r) => r.Triwulan === tw);
      const byYear: Record<string, number> = {};
      for (const y of YEARS) {
        byYear[`${y}`] = sumBy(
          rows.filter((r) => r.Tahun === y),
          "Jumlah_SPK"
        );
      }
      return { name: tw, ...byYear };
    });
  }, [filteredSpk]);

  // Heatmap data: month × year → SPK count
  const heatmap = useMemo(() => {
    return MONTH_ORDER.map((month) => {
      const row: Record<string, unknown> = { bulan: month.slice(0, 3) };
      for (const y of YEARS) {
        row[`${y}`] = sumBy(
          filteredSpk.filter((r) => r.Bulan === month && r.Tahun === y),
          "Jumlah_SPK"
        );
      }
      return row;
    });
  }, [filteredSpk]);

  // Lab performance table
  const labPerf = useMemo(() => {
    const labMap = groupBy(filteredSpk, "Lab");
    const revLabMap = groupBy(filteredRevenue, "Domain_Lab");
    const labs = [...new Set([...labMap.keys(), ...revLabMap.keys()])].filter(Boolean);
    return labs
      .map((lab) => {
        const spkRows = labMap.get(lab) ?? [];
        const revRows = revLabMap.get(lab) ?? [];
        const totalSpk = sumBy(spkRows, "Jumlah_SPK");
        const totalRev = sumBy(revRows, "Nominal_Revenue");
        return {
          lab,
          spkCount: totalSpk,
          revenue: totalRev,
          avgSpkVal: totalSpk > 0 ? totalRev / totalSpk : 0,
          trxCount: revRows.length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSpk, filteredRevenue]);

  // Status mapping distribution
  const statusData = useMemo(
    () => revenueByField(filteredRevenue, "Status_Mapping").slice(0, 8),
    [filteredRevenue]
  );

  // Max heatmap for color
  const heatMax = useMemo(() => {
    let mx = 1;
    for (const row of heatmap) {
      for (const y of YEARS) {
        const v = Number(row[`${y}`] ?? 0);
        if (v > mx) mx = v;
      }
    }
    return mx;
  }, [heatmap]);

  function heatColor(value: number) {
    if (value === 0) return theme === "dark" ? "#1E222D" : "#F9FAFB";
    const pct = value / heatMax;
    if (pct < 0.25) return theme === "dark" ? "#4A181C" : "#FEE2E2";
    if (pct < 0.5) return theme === "dark" ? "#731B22" : "#FECACA";
    if (pct < 0.75) return theme === "dark" ? "#A51F2A" : "#F87171";
    return RED;
  }

  return (
    <div className="space-y-5">
      {/* SPK by Year bar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Volume SPK per Tahun" subtitle="Jumlah SPK (termasuk rekap bulanan)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={spkYear.map((d) => ({ tahun: String(d.tahun), SPK: d.spkCount }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="tahun" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: unknown) => [formatNumber(v as number), "Jumlah SPK"]} />
              <Bar dataKey="SPK" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Triwulan comparison */}
        <ChartCard title="SPK per Triwulan" subtitle="Perbandingan volume per kuartal per tahun">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={twData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={8} />
              {YEARS.map((y, i) => (
                <Bar key={y} dataKey={`${y}`} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Heatmap */}
      <ChartCard title="Heatmap Volume SPK" subtitle="Intensitas volume SPK per bulan × tahun">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="py-2 pr-3 text-left font-semibold text-gray-500 dark:text-gray-400 w-16">Bulan</th>
                {YEARS.map((y) => (
                  <th key={y} className="py-2 px-2 text-center font-semibold text-gray-500 dark:text-gray-400">
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row) => (
                <tr key={String(row.bulan)}>
                  <td className="py-1 pr-3 font-medium text-gray-600 dark:text-gray-300">{String(row.bulan)}</td>
                  {YEARS.map((y) => {
                    const v = Number(row[`${y}`] ?? 0);
                    return (
                      <td key={y} className="py-0.5 px-2 text-center">
                        <div
                          className="mx-auto flex h-8 w-12 items-center justify-center rounded-md font-semibold"
                          style={{
                            background: heatColor(v),
                            color: v / heatMax > 0.5 || theme === "dark" ? "white" : "#374151",
                          }}
                        >
                          {v > 0 ? v : "–"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Lab performance table */}
      <ChartCard title="Performa per Lab" subtitle="SPK count, revenue, dan rata-rata nilai SPK">
        <DataTable
          columns={[
            { key: "lab", label: "Lab", sortable: true },
            {
              key: "spkCount",
              label: "Jml SPK",
              sortable: true,
              align: "right",
              render: (r) => formatNumber(r.spkCount as number),
            },
            {
              key: "trxCount",
              label: "Jml Transaksi",
              sortable: true,
              align: "right",
              render: (r) => formatNumber(r.trxCount as number),
            },
            {
              key: "revenue",
              label: "Total Revenue",
              sortable: true,
              align: "right",
              render: (r) => formatRupiah(r.revenue as number, true),
            },
            {
              key: "avgSpkVal",
              label: "Avg Revenue/SPK",
              sortable: true,
              align: "right",
              render: (r) => formatRupiah(r.avgSpkVal as number, true),
            },
          ]}
          data={labPerf as any}
          rowKey={(r) => String(r.lab)}
          pageSize={20}
          compact
        />
      </ChartCard>

      {/* Status mapping */}
      <ChartCard
        title="Distribusi Status Mapping"
        subtitle="Breakdown kualitas data berdasarkan status mapping"
        className="lg:col-span-1"
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={statusData.map((d) => ({ ...d, value: d.value }))}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: unknown) => [formatNumber(v as number), "Transaksi"]} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {statusData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
