"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../../ui/ChartCard";
import MetricCard from "../../ui/MetricCard";
import { useDashboard } from "../../../lib/dashboard-context";
import {
  formatRupiah,
  formatNumber,
  revenueByYear,
  revenueByField,
  spkByYear,
  topClients,
  yoyGrowth,
} from "../../../lib/data-utils";

const RED = "#E31E24";
const COLORS = ["#E31E24", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];

function rupiahTick(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(0)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
  return String(value);
}

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value, true)}
        </p>
      ))}
    </div>
  );
};

export default function ExecutiveSummary() {
  const { filteredRevenue, filteredSpk, revenueData } = useDashboard();

  // KPIs
  const totalRevenue = useMemo(
    () => filteredRevenue.reduce((s, r) => s + r.Nominal_Revenue, 0),
    [filteredRevenue]
  );
  const totalSpk = useMemo(
    () => filteredSpk.reduce((s, r) => s + r.Jumlah_SPK, 0),
    [filteredSpk]
  );
  const totalTrx = filteredRevenue.length;
  const avgRevenuePerTrx = totalTrx > 0 ? totalRevenue / totalTrx : 0;

  const uniqueClients = useMemo(
    () => new Set(filteredRevenue.map((r) => r.Pelanggan_Key).filter(Boolean)).size,
    [filteredRevenue]
  );

  // YoY (based on all data, show latest complete year)
  const allYearData = useMemo(() => revenueByYear(revenueData), [revenueData]);
  const lastYear = allYearData[allYearData.length - 1]?.tahun ?? 2025;
  const yoy = yoyGrowth(allYearData, lastYear - 1); // compare 2024 vs 2023

  // Revenue trend (by year)
  const revByYear = useMemo(() => revenueByYear(filteredRevenue), [filteredRevenue]);
  const revLineData = revByYear.map((d) => ({
    tahun: String(d.tahun),
    Revenue: d.revenue,
    "Jml Transaksi": d.trxCount,
  }));

  // SPK volume vs revenue dual-axis
  const spkByYr = useMemo(() => spkByYear(filteredSpk), [filteredSpk]);
  const dualAxisData = revByYear.map((r) => {
    const s = spkByYr.find((x) => x.tahun === r.tahun);
    return {
      tahun: String(r.tahun),
      Revenue: r.revenue,
      "Jml SPK": s?.spkCount ?? 0,
    };
  });

  // Lab donut
  const labRevenue = useMemo(
    () => revenueByField(filteredRevenue, "Domain_Lab").slice(0, 7),
    [filteredRevenue]
  );

  // Top clients bar
  const clients = useMemo(
    () => topClients(filteredRevenue, filteredSpk, 5),
    [filteredRevenue, filteredSpk]
  );

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatRupiah(totalRevenue, true)}
          subtitle={`${formatNumber(totalTrx)} transaksi`}
          highlight
          icon={<span className="text-lg">💰</span>}
        />
        <MetricCard
          title="Total SPK"
          value={formatNumber(totalSpk)}
          subtitle="surat perintah kerja"
          icon={<span className="text-lg">📋</span>}
        />
        <MetricCard
          title="Rata-rata per Transaksi"
          value={formatRupiah(avgRevenuePerTrx, true)}
          icon={<span className="text-lg">📈</span>}
        />
        <MetricCard
          title="Total Klien Aktif"
          value={formatNumber(uniqueClients)}
          trend={yoy}
          subtitle="klien unik"
          icon={<span className="text-lg">🏢</span>}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue Trend — 2/3 width */}
        <ChartCard
          title="Tren Revenue per Tahun"
          subtitle="Total pendapatan kumulatif"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revLineData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tahun" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={rupiahTick}
                tick={{ fontSize: 11 }}
                width={50}
              />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Line
                type="monotone"
                dataKey="Revenue"
                stroke={RED}
                strokeWidth={2.5}
                dot={{ fill: RED, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Lab Donut — 1/3 */}
        <ChartCard title="Revenue per Domain Lab" subtitle="Distribusi per lab">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={labRevenue}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {labRevenue.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: unknown) => [formatRupiah(v as number, true), "Revenue"]}
              />
              <Legend
                iconSize={8}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* SPK vs Revenue dual axis */}
        <ChartCard
          title="Volume SPK vs Revenue"
          subtitle="Perbandingan jumlah SPK dan pendapatan per tahun"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dualAxisData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tahun" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                tickFormatter={rupiahTick}
                tick={{ fontSize: 11 }}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                width={40}
              />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Legend iconSize={10} />
              <Bar yAxisId="left" dataKey="Revenue" fill={RED} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Jml SPK" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 5 clients */}
        <ChartCard title="Top 5 Klien by Revenue" subtitle="Berdasarkan total pendapatan">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={clients.map((c) => ({
                name: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
                Revenue: c.revenue,
              }))}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tickFormatter={rupiahTick} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
              <Tooltip formatter={(v: unknown) => [formatRupiah(v as number, true), "Revenue"]} />
              <Bar dataKey="Revenue" radius={[0, 4, 4, 0]}>
                {clients.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
