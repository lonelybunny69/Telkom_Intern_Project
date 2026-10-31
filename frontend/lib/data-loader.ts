import Papa from "papaparse";

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

export interface SpkRow {
  ID_SPK: string;
  Tahun: number;
  Bulan: string;
  Triwulan: string;
  Tanggal_SPK: string;
  Nomor_SPK: string;
  Nomor_SPB: string;
  Jenis_Pengujian: string;
  Lab: string;
  Lab_Asli: string;
  Lab_Menurut_Nomor_SPK: string;
  Perusahaan: string;
  Pelanggan_Key: string;
  Sumber_SPK: string;
  Biaya_SPK: number;
  Jumlah_SPK: number;
  Granularitas: string;
  Status_Mapping: string;
  Catatan_Kualitas: string;
  Sumber_File: string;
  Sumber_Sheet: string;
  Sumber_Baris: number;
}

export interface RevenueRow {
  ID_Transaksi: string;
  Tahun: number;
  Bulan: string;
  Tanggal: string;
  Perusahaan: string;
  Pelanggan_Key: string;
  Jenis_Transaksi: string;
  Kategori_Utama: string;
  Pengujian_STEL: string;
  Kategori_Uji: string;
  Laboratorium: string;
  Domain_Lab: string;
  Unit_Org: string;
  Keterangan: string;
  Nominal_Revenue: number;
  PPN_Tercatat: number;
  Jumlah_Sumber: number;
  PPH23_BiayaTransfer_Sumber: number;
  Status_Mapping: string;
  Dugaan_Duplikat: string;
  Sumber_File: string;
  Sumber_Sheet: string;
  Sumber_Baris: number;
}

// ────────────────────────────────────────────────────────
// Memoized loaders (singleton promise)
// ────────────────────────────────────────────────────────

let _spkPromise: Promise<SpkRow[]> | null = null;
let _revPromise: Promise<RevenueRow[]> | null = null;

async function parseCsv<T>(url: string, numericFields: string[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete(results) {
        const rows = results.data.map((raw) => {
          const row: Record<string, unknown> = { ...raw };
          for (const field of numericFields) {
            const v = raw[field];
            row[field] = v === "" || v === undefined ? 0 : parseFloat(v.replace(/,/g, ""));
          }
          return row as T;
        });
        resolve(rows);
      },
      error(err) {
        reject(err);
      },
    });
  });
}

export function loadSpkData(): Promise<SpkRow[]> {
  if (!_spkPromise) {
    _spkPromise = parseCsv<SpkRow>("/data/spk_master_2020_2025.csv", [
      "Tahun",
      "Biaya_SPK",
      "Jumlah_SPK",
      "Sumber_Baris",
    ]);
  }
  return _spkPromise;
}

export function loadRevenueData(): Promise<RevenueRow[]> {
  if (!_revPromise) {
    _revPromise = parseCsv<RevenueRow>("/data/master_revenue_2020_2025.csv", [
      "Tahun",
      "Nominal_Revenue",
      "PPN_Tercatat",
      "Jumlah_Sumber",
      "PPH23_BiayaTransfer_Sumber",
      "Sumber_Baris",
    ]);
  }
  return _revPromise;
}

export async function loadAllData(): Promise<{ spk: SpkRow[]; revenue: RevenueRow[] }> {
  const [spk, revenue] = await Promise.all([loadSpkData(), loadRevenueData()]);
  return { spk, revenue };
}
