"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
  revenueByField,
  sumBy,
} from "../../../lib/data-utils";

const COLORS = ["#E31E24", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function ProductAnalysis() {
  const { filteredRevenue } = useDashboard();

  // Revenue by Jenis Transaksi
  const byJenis = useMemo(
    () => revenueByField(filteredRevenue, "Jenis_Transaksi").slice(0, 8),
    [filteredRevenue]
  );

  // Revenue by Kategori Utama
  const byKategori = useMemo(
    () => revenueByField(filteredRevenue, "Kategori_Utama").slice(0, 8),
    [filteredRevenue]
  );

  // Revenue by Kategori Uji
  const byKatUji = useMemo(
    () => revenueByField(filteredRevenue, "Kategori_Uji").slice(0, 10),
    [filteredRevenue]
  );

  // STEL vs Lab split by year
  const stelVsLabByYear = useMemo(() => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    return years.map((y) => {
      const rows = filteredRevenue.filter((r) => r.Tahun === y);
      const stel = sumBy(
        rows.filter((r) => r.Kategori_Utama === "STEL"),
        "Nominal_Revenue"
      );
      const lab = sumBy(
        rows.filter((r) => r.Kategori_Utama !== "STEL"),
        "Nominal_Revenue"
      );
      return { tahun: String(y), STEL: stel, Lab: lab };
    });
  }, [filteredRevenue]);

  // Product × Lab cross table
  const prodLabTable = useMemo(() => {
    const catMap = groupBy(filteredRevenue, "Kategori_Uji");
    return Array.from(catMap.entries())
      .map(([kat, rows]) => {
        const labMap = groupBy(rows, "Domain_Lab");
        return {
          kategoriUji: kat || "(Tidak Diisi)",
          totalRevenue: sumBy(rows, "Nominal_Revenue"),
          trxCount: rows.length,
          topLab:
            Array.from(labMap.entries())
              .sort((a, b) => sumBy(b[1], "Nominal_Revenue") - sumBy(a[1], "Nominal_Revenue"))[0]?.[0] ??
            "-",
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredRevenue]);

  return (
    <div className="space-y-5">
      {/* Row 1: Jenis Transaksi donut + Kategori Utama bar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Revenue by Jenis Transaksi"
          subtitle="Distribusi pendapatan per jenis transaksi"
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byJenis}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {byJenis.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: unknown) => [formatRupiah(v as number, true), "Revenue"]} />
              <Legend
                iconSize={8}
                formatter={(v) => <span className="text-xs">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revenue by Kategori Utama"
          subtitle="Total pendapatan per kategori"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byKategori} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`}
                tick={{ fontSize: 11 }}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v: unknown) => [formatRupiah(v as number, true), "Revenue"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {byKategori.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* STEL vs Lab timeline */}
      <ChartCard
        title="STEL vs Pengujian Lab (Revenue per Tahun)"
        subtitle="Perbandingan kontribusi revenue STEL vs layanan Lab"
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stelVsLabByYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="tahun" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`}
              tick={{ fontSize: 11 }}
              width={50}
            />
            <Tooltip formatter={(v: unknown) => [formatRupiah(v as number, true)]} />
            <Legend iconSize={10} />
            <Bar dataKey="STEL" fill="#E31E24" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Lab" fill="#3B82F6" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Kategori Uji bar */}
      <ChartCard
        title="Revenue by Jenis Pengujian"
        subtitle="Breakdown per kategori pengujian"
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byKatUji}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: unknown) => [formatRupiah(v as number, true), "Revenue"]} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {byKatUji.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Product × Lab table */}
      <ChartCard
        title="Ringkasan Kategori Uji × Lab"
        subtitle="Revenue dan transaksi per kategori pengujian"
      >
        <DataTable
          columns={[
            { key: "kategoriUji", label: "Kategori Pengujian", sortable: true },
            { key: "topLab", label: "Lab Utama" },
            {
              key: "trxCount",
              label: "Jml Transaksi",
              sortable: true,
              align: "right",
              render: (r) => formatNumber(r.trxCount as number),
            },
            {
              key: "totalRevenue",
              label: "Total Revenue",
              sortable: true,
              align: "right",
              render: (r) => formatRupiah(r.totalRevenue as number, true),
            },
          ]}
          data={prodLabTable as any}
          rowKey={(r) => String(r.kategoriUji)}
          compact
        />
      </ChartCard>
    </div>
  );
}
