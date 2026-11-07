"use client";

import { useState } from "react";
import DataTable from "../../ui/DataTable";
import ExportButton, { exportToCsv, exportToExcel } from "../../ui/ExportButton";
import { useDashboard } from "../../../lib/dashboard-context";
import { formatRupiah, formatNumber } from "../../../lib/data-utils";
import type { SpkRow, RevenueRow } from "../../../lib/data-loader";

type DatasetKey = "revenue" | "spk";

export default function DataExplorer() {
  const { filteredRevenue, filteredSpk } = useDashboard();
  const [dataset, setDataset] = useState<DatasetKey>("revenue");

  // ── Revenue columns ────────────────────────────────────
  const revColumns = [
    { key: "ID_Transaksi", label: "ID Transaksi", width: "150px" },
    { key: "Tahun", label: "Tahun", align: "center" as const, sortable: true },
    { key: "Bulan", label: "Bulan" },
    { key: "Tanggal", label: "Tanggal" },
    { key: "Perusahaan", label: "Perusahaan", sortable: true },
    { key: "Jenis_Transaksi", label: "Jenis Transaksi" },
    { key: "Kategori_Utama", label: "Kategori Utama" },
    { key: "Domain_Lab", label: "Domain Lab" },
    { key: "Kategori_Uji", label: "Kategori Uji" },
    {
      key: "Nominal_Revenue",
      label: "Revenue",
      align: "right" as const,
      sortable: true,
      render: (r: RevenueRow) => formatRupiah(r.Nominal_Revenue, true),
    },
    { key: "Status_Mapping", label: "Status" },
    { key: "Dugaan_Duplikat", label: "Duplikat?" },
    { key: "Sumber_File", label: "Sumber File" },
  ];

  // ── SPK columns ────────────────────────────────────────
  const spkColumns = [
    { key: "ID_SPK", label: "ID SPK", width: "140px" },
    { key: "Tahun", label: "Tahun", align: "center" as const, sortable: true },
    { key: "Bulan", label: "Bulan" },
    { key: "Triwulan", label: "TW", align: "center" as const },
    { key: "Nomor_SPK", label: "No. SPK" },
    { key: "Perusahaan", label: "Perusahaan", sortable: true },
    { key: "Jenis_Pengujian", label: "Jenis Uji" },
    { key: "Lab", label: "Lab" },
    {
      key: "Jumlah_SPK",
      label: "Jml SPK",
      align: "right" as const,
      sortable: true,
      render: (r: SpkRow) => formatNumber(r.Jumlah_SPK),
    },
    {
      key: "Biaya_SPK",
      label: "Biaya SPK",
      align: "right" as const,
      sortable: true,
      render: (r: SpkRow) => (r.Biaya_SPK ? formatRupiah(r.Biaya_SPK, true) : "–"),
    },
    { key: "Sumber_SPK", label: "Sumber" },
    { key: "Status_Mapping", label: "Status" },
    { key: "Catatan_Kualitas", label: "Catatan" },
  ];

  const activeData = dataset === "revenue" ? filteredRevenue : filteredSpk;
  const activeColumns = dataset === "revenue" ? revColumns : spkColumns;

  function handleExportCsv() {
    exportToCsv(
      dataset === "revenue" ? "revenue_data.csv" : "spk_data.csv",
      activeData as unknown as Record<string, unknown>[]
    );
  }

  async function handleExportExcel() {
    await exportToExcel(
      dataset === "revenue" ? "revenue_data.xlsx" : "spk_data.xlsx",
      activeData as unknown as Record<string, unknown>[],
      dataset === "revenue" ? "Revenue" : "SPK"
    );
  }

  return (
    <div className="space-y-4">
      {/* Dataset switcher + export */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161820] overflow-hidden">
          {(["revenue", "spk"] as DatasetKey[]).map((ds) => (
            <button
              key={ds}
              onClick={() => setDataset(ds)}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${
                dataset === ds
                  ? "bg-telkom-red text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {ds === "revenue" ? "💰 Data Revenue" : "📋 Data SPK"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatNumber(activeData.length)} baris ditampilkan
          </span>
          <ExportButton
            onExportCsv={handleExportCsv}
            onExportExcel={handleExportExcel}
            label="Export Data"
          />
        </div>
      </div>

      {/* Data summary strip */}
      {dataset === "revenue" && (
        <div className="flex gap-6 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#161820] px-4 py-2 text-xs text-gray-600 dark:text-gray-300">
          <span>
            <strong>Total transaksi:</strong> {formatNumber(filteredRevenue.length)}
          </span>
          <span>
            <strong>Total Revenue:</strong>{" "}
            {formatRupiah(
              filteredRevenue.reduce((s, r) => s + r.Nominal_Revenue, 0),
              true
            )}
          </span>
          <span>
            <strong>Klien unik:</strong>{" "}
            {new Set(filteredRevenue.map((r) => r.Pelanggan_Key)).size}
          </span>
        </div>
      )}
      {dataset === "spk" && (
        <div className="flex gap-6 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#161820] px-4 py-2 text-xs text-gray-600 dark:text-gray-300">
          <span>
            <strong>Total baris SPK:</strong> {formatNumber(filteredSpk.length)}
          </span>
          <span>
            <strong>Total Jumlah SPK:</strong>{" "}
            {formatNumber(filteredSpk.reduce((s, r) => s + r.Jumlah_SPK, 0))}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161820] p-4 shadow-sm">
        <DataTable
          columns={activeColumns as any}
          data={activeData as any}
          rowKey={(r: any) => String(r.ID_Transaksi ?? r.ID_SPK ?? Math.random())}
          pageSize={100}
          searchFields={
            dataset === "revenue"
              ? (["Perusahaan", "ID_Transaksi", "Kategori_Utama", "Domain_Lab"] as any)
              : (["Perusahaan", "ID_SPK", "Nomor_SPK", "Lab"] as any)
          }
          searchPlaceholder={
            dataset === "revenue"
              ? "Cari perusahaan, ID transaksi, kategori..."
              : "Cari perusahaan, ID SPK, nomor SPK, lab..."
          }
          compact
        />
      </div>
    </div>
  );
}
