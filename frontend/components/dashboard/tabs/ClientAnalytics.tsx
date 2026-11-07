"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
  sumBy,
  topClients,
} from "../../../lib/data-utils";

const COLORS = ["#E31E24", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function ClientAnalytics() {
  const { filteredRevenue, filteredSpk } = useDashboard();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // All clients ranked
  const allClients = useMemo(
    () => topClients(filteredRevenue, filteredSpk, 200),
    [filteredRevenue, filteredSpk]
  );

  const top10 = allClients.slice(0, 10);

  // Client type split
  const clientTypeSplit = useMemo(() => {
    const map = groupBy(filteredSpk, "Sumber_SPK");
    return [
      { name: "Eksternal", value: sumBy(map.get("Eksternal") ?? [], "Jumlah_SPK") },
      { name: "Internal", value: sumBy(map.get("Internal") ?? [], "Jumlah_SPK") },
      { name: "Tidak Dibedakan", value: sumBy(map.get("Tidak dibedakan (2020)") ?? [], "Jumlah_SPK") },
    ].filter((d) => d.value > 0);
  }, [filteredSpk]);

  // Revenue by year for selected client
  const clientYearData = useMemo(() => {
    if (!selectedClient) return [];
    const rows = filteredRevenue.filter((r) => r.Pelanggan_Key === selectedClient);
    const byYear = groupBy(rows, "Tahun");
    return Array.from(byYear.entries())
      .map(([y, items]) => ({
        tahun: String(y),
        Revenue: sumBy(items, "Nominal_Revenue"),
      }))
      .sort((a, b) => a.tahun.localeCompare(b.tahun));
  }, [filteredRevenue, selectedClient]);

  // Detail transaksi for selected client
  const clientTrx = useMemo(() => {
    if (!selectedClient) return [];
    return filteredRevenue.filter((r) => r.Pelanggan_Key === selectedClient).slice(0, 100);
  }, [filteredRevenue, selectedClient]);

  return (
    <div className="space-y-5">
      {/* Top row: type split + top 10 bar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Client type donut */}
        <ChartCard title="Tipe Klien" subtitle="Distribusi SPK Eksternal vs Internal">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={clientTypeSplit}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {clientTypeSplit.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: unknown) => [formatNumber(v as number), "SPK"]} />
              <Legend iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 10 bar */}
        <ChartCard
          title="Top 10 Klien by Revenue"
          subtitle="Klik nama untuk lihat detail"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={top10.map((c) => ({
                name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
                key: c.name,
                Revenue: c.revenue,
              }))}
              layout="vertical"
              onClick={(data: unknown) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = data as any;
                const key: string | undefined =
                  d?.activePayload?.[0]?.payload?.key ??
                  d?.activeLabel;
                if (key) {
                  const client = allClients.find((c) => c.name === key);
                  if (client) {
                    const revRow = filteredRevenue.find(
                      (r) => r.Perusahaan === client.name
                    );
                    if (revRow) setSelectedClient(revRow.Pelanggan_Key);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v / 1e9).toFixed(0)}M`}
                tick={{ fontSize: 11 }}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
              <Tooltip
                formatter={(v: unknown) => [formatRupiah(v as number, true), "Revenue"]}
                cursor={{ fill: "rgba(227, 30, 36, 0.08)" }}
              />
              <Bar dataKey="Revenue" radius={[0, 4, 4, 0]} style={{ cursor: "pointer" }}>
                {top10.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Client ranking table */}
      <ChartCard title="Ranking Klien" subtitle={`${allClients.length} klien unik`}>
        <DataTable
          columns={[
            {
              key: "rank",
              label: "#",
              align: "center",
              width: "50px",
              render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
            },
            { key: "name", label: "Nama Perusahaan", sortable: true },
            {
              key: "revenue",
              label: "Total Revenue",
              sortable: true,
              align: "right",
              render: (r) => formatRupiah(r.revenue as number, true),
            },
            {
              key: "trxCount",
              label: "Jml Transaksi",
              sortable: true,
              align: "right",
              render: (r) => formatNumber(r.trxCount as number),
            },
            {
              key: "spkCount",
              label: "Jml SPK",
              sortable: true,
              align: "right",
              render: (r) => formatNumber(r.spkCount as number),
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <button
                  onClick={() => {
                    const revRow = filteredRevenue.find((x) => x.Perusahaan === r.name);
                    if (revRow) setSelectedClient(revRow.Pelanggan_Key);
                  }}
                  className="text-xs text-telkom-red hover:underline"
                >
                  Detail →
                </button>
              ),
            },
          ]}
          data={allClients as any}
          rowKey={(r) => String(r.name)}
          pageSize={20}
          searchFields={["name"] as any}
          searchPlaceholder="Cari nama perusahaan..."
          compact
        />
      </ChartCard>

      {/* Client drill-down */}
      {selectedClient && (
        <ChartCard
          title={`Detail: ${filteredRevenue.find((r) => r.Pelanggan_Key === selectedClient)?.Perusahaan ?? selectedClient}`}
          subtitle="Riwayat transaksi klien yang dipilih"
          actions={
            <button
              onClick={() => setSelectedClient(null)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ✕ Tutup
            </button>
          }
        >
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={clientYearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="tahun" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v: unknown) => [formatRupiah(v as number, true), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  fill="rgba(227, 30, 36, 0.15)"
                  stroke="#E31E24"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <DataTable
            columns={[
              { key: "ID_Transaksi", label: "ID Transaksi", width: "140px" },
              { key: "Tanggal", label: "Tanggal" },
              { key: "Tahun", label: "Tahun", align: "center" },
              { key: "Kategori_Utama", label: "Kategori" },
              { key: "Domain_Lab", label: "Lab" },
              {
                key: "Nominal_Revenue",
                label: "Revenue",
                align: "right",
                sortable: true,
                render: (r) => formatRupiah(r.Nominal_Revenue as number, true),
              },
            ]}
            data={clientTrx as any}
            rowKey={(r) => String(r.ID_Transaksi)}
            pageSize={20}
            compact
          />
        </ChartCard>
      )}
    </div>
  );
}
