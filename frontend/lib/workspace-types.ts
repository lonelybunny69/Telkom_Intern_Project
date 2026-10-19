export interface SummaryData {
  total_revenue: number;
  total_lost: number;
  total_transactions: number;
  lost_ratio_percent: number;
}

export interface Transaction {
  id: number;
  tahun: number | null;
  bulan: string | null;
  tanggal: string | null;
  perusahaan: string | null;
  jenis_transaksi: string | null;
  pengujian_stel: string | null;
  laboratorium: string | null;
  keterangan: string | null;
  nominal_revenue: number | null;
  ppn: number | null;
  pph23: number | null;
  kategori_utama: string | null;
  unit_org: string | null;
  kategori_uji: string | null;
  domain_lab: string | null;
  status_lost: string | null;
  nominal_lost: number | null;
}

export interface TransactionPayload {
  tahun: number;
  bulan: string;
  tanggal: string;
  perusahaan: string;
  jenis_transaksi: string;
  pengujian_stel: string;
  laboratorium: string;
  keterangan: string;
  nominal_revenue: number;
  ppn: number;
  pph23: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
}

export type WorkspaceTheme = "dark" | "light";
