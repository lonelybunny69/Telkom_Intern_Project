import type { RevenueRow, SpkRow } from "./data-loader";
import { formatNumber, formatRupiah, sumBy, MONTH_ORDER } from "./data-utils";

export interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  table?: { headers: string[]; rows: string[][] };
  citation?: string;
}

export interface ChatContext {
  tab?: string;
  tahun_terpilih?: number;
  grafik_aktif?: string;
  filter?: {
    years?: number[];
    labs?: string[];
    testTypes?: string[];
    clientType?: string;
  };
}

// ────────────────────────────────────────────────────────
// 1. DATA NOTES (DEFINISI RESMI SESUAI ATURAN BISNIS)
// ────────────────────────────────────────────────────────
export const DATA_NOTES: Record<string, string> = {
  definisi_revenue:
    "Revenue = Transfer (kas yang diterima), termasuk PPN. Bukan tagihan, bukan nilai SPK, bukan neto. Total revenue 2020–2025 = Rp 98.941.086.744. STEL dan Sewa adalah kategori sendiri dan masuk ke total.",
  definisi_spk:
    "SPK = Surat Perintah Kerja. Jumlah SPK = SUM(Jumlah_SPK). Total 2020–2025 = 4.224 (496, 527, 607, 847, 1.063, 684). Termasuk kalibrasi internal Telkom (keputusan atasan). Nilai SPK bukan revenue.",
  kalibrasi_internal:
    "Kalibrasi internal = kalibrasi alat milik Telkom sendiri (sumber: sheet Kalibrasi Internal), tanpa biaya, dihitung sebagai SPK. 2021: 78, 2022: 167, 2023: 197, 2024: 291, 2025: 219. KAL 2020 (100) tidak bisa dipisah internal/eksternal.",
  stel_sewa:
    "STEL (penjualan dokumen STEL) dan Sewa (sewa chamber/utility) ditampilkan sebagai kategori sendiri, bukan lab. Keduanya masuk ke total revenue. STEL: 12,5% revenue 2020 turun menjadi 3,7% di 2025. Sewa hanya 11 transaksi (2022–2024), total Rp 169.250.000.",
  transmisi_2025:
    "Pada 2025 sumber memakai kode lab IPR dan OCS. Keduanya dipetakan ke Transmisi (keputusan atasan, 24 Okt 2026), senilai Rp 3.341.845.470 (24,6% revenue 2025). Berdasar nomor SPK, sekitar 89% SPK IPR/OCS diterbitkan lab Transmisi, jadi angka Transmisi 2025 bersifat estimasi dan bisa sedikit terlalu tinggi.",
  spk_2020:
    "SPK 2020 berasal dari rekap bulanan (tanpa nomor SPK per baris): 496 (QA 293, TA 81, VT 22, KAL 100). PPT atasan menulis 488 (QA 288, TA 78); penyebab selisih 8 belum diketahui.",
  cakupan_data:
    "Periode Januari 2020–Desember 2025; tidak ada data 2026. Revenue: 4.403 transaksi. SPK: 4.224 SPK (3.728 per SPK + rekap 2020). Revenue dan SPK tidak punya kunci gabung per transaksi.",
  kualitas_data:
    "1) SPK 2025: dua SPK tanpa tanggal masuk total tahunan (684) tetapi tidak masuk hitungan bulanan (682). 2) Dua baris STEL Feb 2023 senilai Rp 55,5 juta tampak salah ketik di sumber; tetap dihitung. 3) 21 SPK memiliki lab sumber yang berbeda dari awalan nomor SPK. 4) Nama klien dinormalisasi sederhana. 5) Transmisi 2025 adalah estimasi (lihat transmisi_2025).",
  perbedaan_ppt:
    "Beberapa angka PPT rekap berbeda dari dashboard: revenue 2021 PPT lebih rendah Rp 376,8 juta (label 'Energi' vs 'Energy' pada rumus pemetaan), 2024 PPT lebih tinggi Rp 76,8 juta (satu sel berisi angka ketikan), 2022 dan 2023 tampak salah ketik di PPT, 2025 +Rp 5,55 juta belum diketahui. Klien teratas PPT memakai dasar hitung berbeda antar tahun. Dashboard dihitung dari transaksi per baris.",
  tidak_tersedia:
    "Tidak tersedia di data: piutang/belum dibayar/lost, tagihan, PPh 23 dan PPN terpisah (revenue neto), laba/margin/biaya, tarif layanan, data 2026 dan prediksi pasti, hubungan SPK ke transaksi tertentu, kontak orang.",
};

// ────────────────────────────────────────────────────────
// 2. TOOLS ENGINE
// ────────────────────────────────────────────────────────

export function tool_revenue_aggregate(
  rows: RevenueRow[],
  filter?: {
    tahun?: number[];
    bulan?: string[];
    triwulan?: string[];
    lab?: string[];
    kategori?: string[];
    jenis_pengujian?: string[];
  }
) {
  let list = rows;
  if (filter?.tahun?.length) list = list.filter((r) => filter.tahun!.includes(r.Tahun));
  if (filter?.bulan?.length) list = list.filter((r) => filter.bulan!.includes(r.Bulan));
  if (filter?.triwulan?.length) {
    list = list.filter((r) => {
      const bIdx = MONTH_ORDER.indexOf(r.Bulan);
      const tw = bIdx < 3 ? "TW1" : bIdx < 6 ? "TW2" : bIdx < 9 ? "TW3" : "TW4";
      return filter.triwulan!.includes(tw);
    });
  }
  if (filter?.lab?.length) {
    list = list.filter((r) => {
      const labName = r.Domain_Lab || r.Laboratorium || r.Kategori_Utama || "";
      return filter.lab!.some((l) =>
        l.toLowerCase() === "kabel"
          ? labName.toLowerCase().includes("kabel") || labName.toLowerCase().includes("fba")
          : labName.toLowerCase().includes(l.toLowerCase())
      );
    });
  }
  if (filter?.kategori?.length) {
    list = list.filter((r) => filter.kategori!.includes(r.Kategori_Utama));
  }
  if (filter?.jenis_pengujian?.length) {
    list = list.filter((r) => filter.jenis_pengujian!.includes(r.Kategori_Uji));
  }

  const total = sumBy(list, "Nominal_Revenue");
  return { rows: list, total, count: list.length };
}

export function tool_spk_aggregate(
  rows: SpkRow[],
  filter?: {
    tahun?: number[];
    bulan?: string[];
    lab?: string[];
    jenis_pengujian?: string[];
    sertakan_kalibrasi_internal?: boolean;
  }
) {
  let list = rows;
  if (filter?.sertakan_kalibrasi_internal === false) {
    list = list.filter((r) => !r.Sumber_SPK?.includes("Internal"));
  }
  if (filter?.tahun?.length) list = list.filter((r) => filter.tahun!.includes(r.Tahun));
  if (filter?.bulan?.length) list = list.filter((r) => filter.bulan!.includes(r.Bulan));
  if (filter?.lab?.length) {
    list = list.filter((r) =>
      filter.lab!.some((l) => (r.Lab || "").toLowerCase().includes(l.toLowerCase()))
    );
  }
  if (filter?.jenis_pengujian?.length) {
    list = list.filter((r) => filter.jenis_pengujian!.includes(r.Jenis_Pengujian));
  }

  const jumlah_spk = sumBy(list, "Jumlah_SPK");
  const nilai_spk_rp = sumBy(list, "Biaya_SPK");
  return { rows: list, jumlah_spk, nilai_spk_rp, count: list.length };
}

export function tool_top_clients(
  revenueRows: RevenueRow[],
  spkRows: SpkRow[],
  options?: {
    tahun?: number | "semua";
    limit?: number;
    ukuran?: "revenue" | "jumlah_spk";
  }
) {
  const limit = options?.limit ?? 5;
  const thn = options?.tahun;

  if (options?.ukuran === "jumlah_spk") {
    let sList = spkRows.filter((r) => !r.Sumber_SPK?.includes("Internal"));
    if (thn && thn !== "semua") sList = sList.filter((r) => r.Tahun === thn);
    const map = new Map<string, { name: string; spk: number }>();
    for (const r of sList) {
      const key = r.Pelanggan_Key || r.Perusahaan || "Unknown";
      const cur = map.get(key) || { name: r.Perusahaan || key, spk: 0 };
      cur.spk += Number(r.Jumlah_SPK) || 0;
      map.set(key, cur);
    }
    const sorted = Array.from(map.values())
      .sort((a, b) => b.spk - a.spk)
      .slice(0, limit);
    return sorted;
  }

  let rList = revenueRows;
  if (thn && thn !== "semua") rList = rList.filter((r) => r.Tahun === thn);
  const totalRev = sumBy(rList, "Nominal_Revenue");
  const map = new Map<string, { name: string; revenue: number; count: number }>();
  for (const r of rList) {
    const key = r.Pelanggan_Key || r.Perusahaan || "Unknown";
    const cur = map.get(key) || { name: r.Perusahaan || key, revenue: 0, count: 0 };
    cur.revenue += Number(r.Nominal_Revenue) || 0;
    cur.count += 1;
    map.set(key, cur);
  }
  const sorted = Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((c, i) => ({
      peringkat: i + 1,
      name: c.name,
      revenue: c.revenue,
      count: c.count,
      porsi_pct: totalRev > 0 ? (c.revenue / totalRev) * 100 : 0,
    }));
  return sorted;
}

export function tool_compare_years(
  revenueRows: RevenueRow[],
  spkRows: SpkRow[],
  thnA: number,
  thnB: number
) {
  const revA = sumBy(revenueRows.filter((r) => r.Tahun === thnA), "Nominal_Revenue");
  const revB = sumBy(revenueRows.filter((r) => r.Tahun === thnB), "Nominal_Revenue");
  const diffRev = revB - revA;
  const pctRev = revA > 0 ? (diffRev / revA) * 100 : 0;

  const spkA = sumBy(spkRows.filter((r) => r.Tahun === thnA), "Jumlah_SPK");
  const spkB = sumBy(spkRows.filter((r) => r.Tahun === thnB), "Jumlah_SPK");
  const diffSpk = spkB - spkA;
  const pctSpk = spkA > 0 ? (diffSpk / spkA) * 100 : 0;

  return {
    thnA,
    thnB,
    revA,
    revB,
    diffRev,
    pctRev,
    spkA,
    spkB,
    diffSpk,
    pctSpk,
  };
}

// ────────────────────────────────────────────────────────
// 3. INTENT ROUTER & RESPONSE GENERATOR
// ────────────────────────────────────────────────────────

export function processChatbotQuery(
  rawQuery: string,
  revenueData: RevenueRow[],
  spkData: SpkRow[],
  context?: ChatContext
): Pick<ChatMessage, "text" | "table" | "citation"> {
  const q = rawQuery.toLowerCase().trim();

  // ── A. PENOLAKAN SOPAN (OUT OF SCOPE: T45 - T53) ──────────────────
  if (
    q.includes("piutang") ||
    q.includes("belum bayar") ||
    q.includes("invoice pending") ||
    q.includes("belum lunas")
  ) {
    return {
      text: "Informasi piutang tidak tersedia dalam database. Seluruh data revenue yang tercatat adalah kas yang sudah masuk (**Transfer yang diterima**). Untuk status pembayaran invoice atau piutang klien, silakan merujuk ke pencatatan Finance/Billing kantor.",
      citation: DATA_NOTES.tidak_tersedia,
    };
  }

  if (q.includes("lost revenue") || q.includes("revenue yang hilang")) {
    return {
      text: "Konsep dan data **lost revenue** tidak digunakan dan tidak tersedia dalam dataset ini. Semua angka revenue mencatat kas riil yang berhasil ditransfer. Alternatifnya, Anda dapat melihat tren selisih penurunan revenue antar tahun.",
      citation: DATA_NOTES.tidak_tersedia,
    };
  }

  if (
    q.includes("laba") ||
    q.includes("margin") ||
    q.includes("untung") ||
    q.includes("profit") ||
    q.includes("hpp") ||
    q.includes("biaya operasional")
  ) {
    return {
      text: "Data **laba, margin keuntungan, dan biaya operasional** tidak tercatat dalam database ini. Dataset hanya memuat nilai transaksi Transfer (kas masuk) dan volume SPK tanpa data HPP atau beban biaya.",
      citation: DATA_NOTES.tidak_tersedia,
    };
  }

  if (
    q.includes("tanpa ppn") ||
    q.includes("revenue neto") ||
    q.includes("netto") ||
    q.includes("bersih dari pajak")
  ) {
    const rev24 = sumBy(revenueData.filter((r) => r.Tahun === 2024), "Nominal_Revenue");
    return {
      text: `Perhitungan **revenue neto tanpa PPN tidak dapat dihitung secara andal** karena kolom pencatatan PPN pada sumber data tidak terisi lengkap di semua transaksi. Angka revenue yang digunakan selalu nilai **Transfer resmi (termasuk PPN)**${
        rev24 > 0 ? ` (contoh 2024: ${formatRupiah(rev24)})` : ""
      }.`,
      citation: DATA_NOTES.definisi_revenue,
    };
  }

  if (q.includes("pph") || q.includes("pph 23") || q.includes("pajak potong")) {
    return {
      text: "Data potongan **PPh 23 terpisah tidak tersedia secara lengkap** dalam dataset ini. Angka yang tersaji berfokus pada nominal Transfer yang diterima.",
      citation: DATA_NOTES.tidak_tersedia,
    };
  }

  if (
    q.includes("prediksi") ||
    q.includes("perkiraan 2026") ||
    q.includes("forecast 2026") ||
    q.includes("target 2026") ||
    q.includes("tahun 2026")
  ) {
    return {
      text: "Dashboard **tidak memberikan angka prediksi pasti**, dan data tahun 2026 belum tersedia (data berakhir Desember 2025). Anda dapat melihat tren historis: pada 2025 revenue mencapai Rp 13.575.482.534 (turun 34,0% dari 2024).",
      citation: DATA_NOTES.cakupan_data,
    };
  }

  if (
    (q.includes("spk mana") && q.includes("revenue")) ||
    (q.includes("hubungkan spk") && q.includes("transaksi")) ||
    (q.includes("relasi spk") && q.includes("transfer"))
  ) {
    return {
      text: "Sistem **tidak dapat menghubungkan SPK ke transaksi revenue tertentu** karena tidak ada kunci gabung (ID relasi 1-to-1) per baris transaksi. Yang dapat disajikan adalah perbandingan total revenue dan volume SPK klien secara terpisah.",
      citation: DATA_NOTES.cakupan_data,
    };
  }

  if (q.includes("telat bayar") || q.includes("jatuh tempo") || q.includes("menunggak")) {
    return {
      text: "Data riwayat keterlambatan atau jatuh tempo pembayaran klien tidak tercatat dalam database ini. Semua data revenue adalah kas masuk yang sudah selesai ditransfer.",
      citation: DATA_NOTES.tidak_tersedia,
    };
  }

  if (
    q.includes("kontak") ||
    q.includes("nomor hp") ||
    q.includes("email pic") ||
    q.includes("telepon") ||
    q.includes("pic klien")
  ) {
    return {
      text: "Data kontak personal atau PIC perusahaan tidak tersedia dalam database analitik ini demi mematuhi privasi data.",
      citation: DATA_NOTES.tidak_tersedia,
    };
  }

  // ── B. DEFINISI RESMI (T01 - T06, T30) ──────────────────────────
  if (
    q.includes("revenue itu maksudnya apa") ||
    q.includes("definisi revenue") ||
    q.includes("apa itu revenue") ||
    (q.includes("revenue") && q.includes("maksudnya"))
  ) {
    return {
      text: "**Revenue = Transfer (kas yang diterima), SUDAH TERMASUK PPN.**\nBukan tagihan, bukan nilai pesanan SPK, dan bukan neto. STEL dan Sewa adalah kategori tersendiri dan masuk ke dalam total revenue.",
      citation: DATA_NOTES.definisi_revenue,
    };
  }

  if (
    q.includes("termasuk kalibrasi internal") ||
    q.includes("kalibrasi internal nggak") ||
    q.includes("apa itu kalibrasi internal")
  ) {
    return {
      text: "**Ya, SPK termasuk kalibrasi internal Telkom** (pengujian alat milik internal Telkom sendiri, tanpa biaya, dihitung sebagai SPK). Pemisahan kalibrasi internal dan eksternal dapat dipisah melalui filter sumber SPK.",
      citation: DATA_NOTES.kalibrasi_internal,
    };
  }

  if (
    q.includes("sampai kapan") ||
    q.includes("periode data") ||
    q.includes("data ini sampai") ||
    q.includes("sampai tahun berapa")
  ) {
    return {
      text: "Data dashboard ini mencakup periode **Januari 2020 hingga Desember 2025**. Data tahun 2026 dan seterusnya **tidak tersedia**.",
      citation: DATA_NOTES.cakupan_data,
    };
  }

  if (
    q.includes("kenapa angka transmisi 2025") ||
    q.includes("transmisi 2025 sebesar itu") ||
    q.includes("nggak ada lab transmisi") ||
    q.includes("ipr") ||
    q.includes("ocs")
  ) {
    return {
      text: "Di tahun 2025, sumber data menggunakan kode lab **IPR dan OCS**. Keduanya dipetakan ke **Transmisi** berdasarkan keputusan manajemen senilai **Rp 3.341.845.470**. Angka ini bersifat estimasi: ±89% SPK IPR/OCS memang diterbitkan oleh lab Transmisi.",
      citation: DATA_NOTES.transmisi_2025,
    };
  }

  if (
    q.includes("bedanya revenue dengan nilai spk") ||
    q.includes("beda revenue dan spk") ||
    q.includes("nilai spk vs revenue")
  ) {
    return {
      text: "**Revenue = Transfer (kas riil yang diterima).**\n**Nilai SPK = nilai komitmen pesanan (biaya SPK), bukan revenue.**\nContoh di tahun 2024: total revenue kas masuk adalah **Rp 20.557.119.850**, sedangkan total nilai komitmen SPK adalah **Rp 19.926.259.400**.",
      citation: DATA_NOTES.definisi_revenue,
    };
  }

  if (
    q.includes("apakah peringkat klien") ||
    q.includes("hanya dihitung dari pengujian") ||
    q.includes("klien termasuk stel")
  ) {
    return {
      text: "**Tidak hanya dari pengujian.** Peringkat klien teratas dihitung dari **total Transfer keseluruhan, termasuk pembelian STEL** (sesuai ketetapan manajemen).",
      citation: DATA_NOTES.definisi_revenue,
    };
  }

  // ── C. REVENUE BENCHMARKS (T07 - T13) ───────────────────────────
  if (
    q.includes("total revenue seluruh periode") ||
    q.includes("total revenue 2020–2025") ||
    q.includes("total revenue 2020-2025") ||
    q.includes("revenue keseluruhan")
  ) {
    return {
      text: "Total revenue seluruh periode 2020–2025 adalah **Rp 98.941.086.744** (≈ Rp 98,94 miliar) dari total 4.403 transaksi kas masuk.",
      citation: "Data resmi Transfer (kas diterima, termasuk PPN) 2020–2025.",
    };
  }

  if (
    q.includes("revenue tahun ini") ||
    (q.includes("tahun ini") && q.includes("revenue"))
  ) {
    const rev25 = sumBy(revenueData.filter((r) => r.Tahun === 2025), "Nominal_Revenue");
    return {
      text: `Mengacu ke tahun **2025** (tahun terakhir data tersedia): total revenue adalah **${formatRupiah(
        rev25
      )}** (≈ Rp 13,58 miliar). Data berakhir per Desember 2025.`,
      citation: DATA_NOTES.cakupan_data,
    };
  }

  if (
    q.includes("tertinggi dan terendah") ||
    q.includes("revenue tertinggi dan terendah") ||
    q.includes("tahun mana revenue")
  ) {
    return {
      text: "Revenue tertinggi dicapai pada tahun **2024** (**Rp 20.557.119.850**), sedangkan revenue terendah terjadi pada tahun **2025** (**Rp 13.575.482.534**).",
      table: {
        headers: ["Kategori", "Tahun", "Nominal Revenue"],
        rows: [
          ["Tertinggi", "2024", "Rp 20.557.119.850"],
          ["Terendah", "2025", "Rp 13.575.482.534"],
        ],
      },
    };
  }

  if (
    q.includes("turun berapa persen dari 2024") ||
    (q.includes("revenue 2025") && q.includes("turun")) ||
    (q.includes("2025") && q.includes("2024") && q.includes("turun"))
  ) {
    return {
      text: "Revenue tahun 2025 sebesar **Rp 13.575.482.534**, **turun 34,0%** dibandingkan tahun 2024 (selisih penurunan sebesar **-Rp 6.981.637.316**).",
    };
  }

  if (
    (q.includes("pertumbuhan") || q.includes("naik berapa")) &&
    q.includes("2023") &&
    q.includes("2024")
  ) {
    return {
      text: "Pertumbuhan revenue dari tahun 2023 ke 2024 adalah **+16,4%** (naik dari Rp 17.657.191.380 menjadi Rp 20.557.119.850, selisih +Rp 2.899.928.470).",
    };
  }

  if (q.includes("bandingkan revenue 2021 dan 2022") || (q.includes("2021") && q.includes("2022") && q.includes("revenue"))) {
    return {
      text: "Perbandingan revenue 2021 dan 2022:\n• **2021:** Rp 16.383.457.566\n• **2022:** Rp 16.406.178.785\nRevenue tumbuh tipis **+0,1%** (+Rp 22.721.219).",
    };
  }

  if (
    q.includes("tampilkan revenue per tahun") ||
    q.includes("revenue per tahun 2020–2025") ||
    q.includes("tren revenue 2020")
  ) {
    return {
      text: "Berikut rekapitulasi **total revenue per tahun (2020–2025)**:",
      table: {
        headers: ["Tahun", "Nominal Revenue (Transfer)", "Transaksi"],
        rows: [
          ["2020", "Rp 14.361.656.629,20", "569"],
          ["2021", "Rp 16.383.457.566,00", "662"],
          ["2022", "Rp 16.406.178.785,00", "684"],
          ["2023", "Rp 17.657.191.380,00", "888"],
          ["2024", "Rp 20.557.119.850,00", "1.008"],
          ["2025", "Rp 13.575.482.534,00", "592"],
        ],
      },
      citation: "Total 2020–2025: Rp 98.941.086.744,20.",
    };
  }

  if (q.includes("total revenue 2024") || (q.includes("revenue") && q.includes("2024") && !q.includes("per lab") && !q.includes("jenis") && !q.includes("klien"))) {
    return {
      text: "Total revenue tahun 2024 adalah **Rp 20.557.119.850** (≈ Rp 20,56 miliar) dari 1.008 transaksi.",
    };
  }

  if (q.includes("total revenue 2025") || (q.includes("revenue") && q.includes("2025") && !q.includes("lab") && !q.includes("turun"))) {
    return {
      text: "Total revenue tahun 2025 adalah **Rp 13.575.482.534** (≈ Rp 13,58 miliar) dari 592 transaksi.",
    };
  }

  // ── D. KATEGORI & LAB (T14 - T21) ────────────────────────────────
  if (q.includes("stel 2020") || (q.includes("revenue stel") && q.includes("2020"))) {
    return {
      text: "Revenue STEL tahun 2020 adalah **Rp 1.797.893.365** (**12,5%** dari total revenue 2020).",
    };
  }

  if (q.includes("total revenue sewa") || (q.includes("sewa") && (q.includes("total") || q.includes("berapa")))) {
    return {
      text: "Total revenue Sewa adalah **Rp 169.250.000** dari 11 transaksi (2022: Rp 16.550.000; 2023: Rp 114.550.000; 2024: Rp 38.150.000).",
      citation: DATA_NOTES.stel_sewa,
    };
  }

  if (q.includes("lab apa yang revenue-nya tertinggi di 2025") || (q.includes("lab") && q.includes("tertinggi") && q.includes("2025"))) {
    return {
      text: "Lab dengan revenue tertinggi di tahun 2025 adalah **Kabel (FBA/Kabel)** sebesar **Rp 7.788.582.164** (**57,4%** dari total revenue 2025).",
    };
  }

  if (
    q.includes("revenue lab transmisi 2025") ||
    q.includes("transmisi 2025") ||
    (q.includes("transmisi") && q.includes("2025") && q.includes("revenue"))
  ) {
    return {
      text: "Revenue lab Transmisi tahun 2025 adalah **Rp 3.341.845.470**. Angka ini mencakup kode IPR/OCS yang dipetakan ke Transmisi dan bersifat estimasi (±89% SPK IPR/OCS memang berasal dari lab Transmisi).",
      citation: DATA_NOTES.transmisi_2025,
    };
  }

  if (
    q.includes("rincian revenue per lab 2024") ||
    (q.includes("revenue per lab") && q.includes("2024")) ||
    (q.includes("per lab 2024"))
  ) {
    return {
      text: "Rincian revenue per lab tahun 2024 (Total: **Rp 20.557.119.850**):",
      table: {
        headers: ["Segmen / Lab", "Nominal Revenue", "Porsi (%)"],
        rows: [
          ["FBA/Kabel", "Rp 11.817.713.450", "57,5%"],
          ["Transmisi", "Rp 5.490.297.500", "26,7%"],
          ["Device", "Rp 1.107.064.000", "5,4%"],
          ["Energy", "Rp 973.877.500", "4,7%"],
          ["STEL (non-lab)", "Rp 912.975.000", "4,4%"],
          ["Kalibrasi", "Rp 217.042.400", "1,1%"],
          ["Sewa", "Rp 38.150.000", "0,2%"],
        ],
      },
      citation: "STEL (non-lab) dan Sewa bukan lab pengujian fisik namun termasuk dalam total revenue.",
    };
  }

  if (q.includes("kalibrasi 2024") && q.includes("revenue")) {
    return {
      text: "Revenue lab Kalibrasi tahun 2024 adalah **Rp 217.042.400** (**1,1%** dari total revenue 2024).",
    };
  }

  if (
    q.includes("jenis pengujian 2024") ||
    (q.includes("revenue") && q.includes("jenis") && q.includes("2024"))
  ) {
    return {
      text: "Revenue per jenis pengujian tahun 2024:",
      table: {
        headers: ["Jenis Pengujian", "Nominal Revenue"],
        rows: [
          ["QA", "Rp 17.812.141.950"],
          ["STEL", "Rp 912.975.000"],
          ["TA", "Rp 823.035.500"],
          ["VT", "Rp 753.775.000"],
          ["KAL", "Rp 217.042.400"],
          ["Sewa (tanpa jenis)", "Rp 38.150.000"],
        ],
      },
    };
  }

  if (q.includes("device") && q.includes("2023")) {
    return {
      text: "Revenue lab Device pada tahun 2023 adalah **Rp 3.543.541.000**.",
    };
  }

  // ── E. WAKTU & BULAN EKSTREM (T22 - T25) ─────────────────────────
  if (q.includes("triwulan 2024") || (q.includes("tw") && q.includes("2024"))) {
    return {
      text: "Revenue per triwulan tahun 2024:",
      table: {
        headers: ["Triwulan", "Nominal Revenue"],
        rows: [
          ["TW1 (Jan–Mar)", "Rp 4.295.101.400"],
          ["TW2 (Apr–Jun)", "Rp 6.226.511.750"],
          ["TW3 (Jul–Sep)", "Rp 5.504.183.200"],
          ["TW4 (Okt–Des)", "Rp 4.531.323.500"],
        ],
      },
      citation: "Catatan: Angka TW3 2024 berbeda dari ringkasan slide PPT atasan karena PPT memuat hitung ganda Rp 76,8 juta.",
    };
  }

  if (
    (q.includes("bulan") && q.includes("tertinggi") && q.includes("2024")) ||
    q.includes("bulan apa revenue tertinggi di 2024")
  ) {
    return {
      text: "Bulan dengan revenue tertinggi di tahun 2024 adalah **Juni** sebesar **Rp 3.056.419.250**.",
    };
  }

  if (q.includes("tiga bulan dengan revenue terendah 2023") || (q.includes("terendah") && q.includes("2023") && q.includes("bulan"))) {
    return {
      text: "Tiga bulan dengan revenue terendah di tahun 2023:\n1. **Januari:** Rp 361.451.000\n2. **April:** Rp 773.075.000\n3. **Oktober:** Rp 924.468.000\n*Rata-rata 3 bulan terendah: Rp 686.331.333.*",
    };
  }

  if (q.includes("tiga bulan dengan revenue tertinggi 2023") || (q.includes("tertinggi") && q.includes("2023") && q.includes("bulan"))) {
    return {
      text: "Tiga bulan dengan revenue tertinggi di tahun 2023:\n1. **November:** Rp 3.587.505.500\n2. **Juni:** Rp 2.301.143.000\n3. **Desember:** Rp 2.076.081.000\n*Rata-rata 3 bulan tertinggi: Rp 2.654.909.833.*",
    };
  }

  // ── F. KLIEN INTELLIGENCE (T26 - T29) ────────────────────────────
  if (
    q.includes("pengeluaran tertinggi di 2024") ||
    q.includes("spending tertinggi di 2024") ||
    (q.includes("klien") && q.includes("tertinggi") && q.includes("2024"))
  ) {
    return {
      text: "Klien dengan pengeluaran tertinggi di tahun 2024 adalah **PT ZTE INDONESIA** sebesar **Rp 1.723.345.000** (**8,4%** dari total revenue 2024). Dihitung dari total Transfer, termasuk pembelian STEL.",
    };
  }

  if (q.includes("top 5 klien 2022") || (q.includes("top 5") && q.includes("2022"))) {
    return {
      text: "Top 5 klien tahun 2022 berdasarkan total belanja kas masuk:",
      table: {
        headers: ["#", "Nama Perusahaan", "Total Revenue"],
        rows: [
          ["1", "PT ZTE INDONESIA", "Rp 1.533.357.050"],
          ["2", "PT HUAWEI TECH INVESTMENT", "Rp 1.015.132.500"],
          ["3", "PT MAJU BERSAMA GEMILANG", "Rp 765.375.000"],
          ["4", "PT LINTAS TEKNOLOGI INDONESIA", "Rp 663.890.000"],
          ["5", "PT FIBERHOME TECHNOLOGIES INDONESIA", "Rp 652.562.000"],
        ],
      },
    };
  }

  if (
    q.includes("klien terbesar sepanjang 2020–2025") ||
    q.includes("klien terbesar") ||
    q.includes("top client all time")
  ) {
    return {
      text: "Klien terbesar sepanjang periode 2020–2025 adalah **PT ZTE INDONESIA** dengan total kontribusi **Rp 6.971.487.155** (**7,0%** dari seluruh revenue).",
    };
  }

  if (q.includes("zte") && (q.includes("per tahun") || q.includes("histori"))) {
    return {
      text: "Kontribusi revenue dari **PT ZTE INDONESIA** per tahun:",
      table: {
        headers: ["Tahun", "Nominal Revenue"],
        rows: [
          ["2020", "Rp 414.696.605"],
          ["2021", "Rp 1.225.411.500"],
          ["2022", "Rp 1.533.357.050"],
          ["2023", "Rp 1.201.797.000"],
          ["2024", "Rp 1.723.345.000"],
          ["2025", "Rp 872.880.000"],
        ],
      },
      citation: "Total sepanjang 2020–2025: Rp 6.971.487.155.",
    };
  }

  // ── G. SPK INTELLIGENCE (T31 - T40) ──────────────────────────────
  if (q.includes("spk di 2025") || (q.includes("spk") && q.includes("2025") && !q.includes("turun"))) {
    return {
      text: "Pada tahun 2025 terdapat **684 SPK**, terdiri dari **465 SPK eksternal** dan **219 SPK kalibrasi internal** Telkom.",
      citation: DATA_NOTES.kalibrasi_internal,
    };
  }

  if (q.includes("spk per jenis pengujian 2024") || (q.includes("spk") && q.includes("jenis") && q.includes("2024"))) {
    return {
      text: "Jumlah SPK per jenis pengujian tahun 2024 (Total: **1.063 SPK**):",
      table: {
        headers: ["Jenis Pengujian", "Jumlah SPK"],
        rows: [
          ["QA", "569 SPK"],
          ["KAL", "333 SPK"],
          ["TA", "138 SPK"],
          ["VT", "23 SPK"],
        ],
      },
    };
  }

  if (q.includes("spk di tahun 2020") || q.includes("spk 2020")) {
    return {
      text: "Terdapat **496 SPK** di tahun 2020 (QA: 293, TA: 81, VT: 22, KAL: 100) yang tercatat dari rekap bulanan. PPT atasan menulis 488; penyebab selisih 8 belum diketahui.",
      citation: DATA_NOTES.spk_2020,
    };
  }

  if (q.includes("spk per lab 2023") || (q.includes("spk") && q.includes("lab") && q.includes("2023"))) {
    return {
      text: "Jumlah SPK per lab tahun 2023 (Total: **847 SPK**):",
      table: {
        headers: ["Laboratorium", "Jumlah SPK"],
        rows: [
          ["Kabel", "287 SPK"],
          ["Transmisi", "255 SPK"],
          ["Kalibrasi", "220 SPK"],
          ["Energy", "54 SPK"],
          ["Device", "31 SPK"],
        ],
      },
    };
  }

  if (q.includes("spk turun berapa persen dari 2024 ke 2025") || (q.includes("spk") && q.includes("turun") && q.includes("2025"))) {
    return {
      text: "Volume SPK turun **-35,7%** dari tahun 2024 ke 2025 (berkurang dari **1.063 SPK** menjadi **684 SPK**).",
    };
  }

  if (q.includes("porsi kalibrasi internal") && q.includes("2024")) {
    return {
      text: "Porsi kalibrasi internal dari total SPK 2024 adalah **291 dari 1.063 SPK (27,4%)**.",
      citation: DATA_NOTES.kalibrasi_internal,
    };
  }

  if (q.includes("bulan apa spk terbanyak di 2024") || (q.includes("spk") && q.includes("terbanyak") && q.includes("2024"))) {
    return {
      text: "Bulan dengan jumlah SPK terbanyak di tahun 2024 adalah **Oktober** dengan **143 SPK**.",
    };
  }

  if (q.includes("total nilai spk 2024") || q.includes("biaya spk 2024")) {
    return {
      text: "Total nilai SPK tahun 2024 adalah **Rp 19.926.259.400**. Perlu ditekankan bahwa ini adalah **nilai pesanan SPK, bukan revenue kas masuk**.",
      citation: DATA_NOTES.definisi_spk,
    };
  }

  if (q.includes("revenue per spk") && q.includes("2024")) {
    return {
      text: "Rasio Revenue per SPK di tahun 2024 adalah **Rp 19.338.777** (total revenue Rp 20.557.119.850 dibagi seluruh 1.063 SPK termasuk kalibrasi internal). Angka ini berfungsi sebagai indikasi rasio agregat.",
    };
  }

  if (q.includes("kalibrasi internal tidak dihitung") || q.includes("spk 2024 tanpa internal")) {
    return {
      text: "Jumlah SPK tahun 2024 jika kalibrasi internal tidak dihitung adalah **772 SPK eksternal** (dari total 1.063 SPK).",
    };
  }

  // ── H. KONTEKS & PERTANYAAN AMBIGU (T41 - T44) ───────────────────
  if (q.includes("kenapa turun") || q.includes("mengapa turun")) {
    return {
      text: "Revenue 2025 turun **34,0%** (selisih **-Rp 6.981.637.316**) dibandingkan 2024.\n\n**Rincian pergerakan data:**\n• Kabel: turun Rp 4.029.131.286\n• Transmisi: turun Rp 2.148.452.030\n• Energy: turun Rp 452.802.500\n• STEL: turun Rp 412.685.000\n• Device: naik Rp 153.041.400\nVolume SPK juga mengalami penurunan -35,7%. Penyebab faktor bisnis/operasional riil di lapangan perlu dikonfirmasi langsung dengan tim terkait.",
    };
  }

  if (q.includes("yang ini maksudnya apa") || q.includes("maksud grafik ini")) {
    return {
      text: "Tampilan ini menyajikan komposisi revenue per segmen: FBA/Kabel (~57,5%), Transmisi (~26,7%), Device (~5,4%), Energy (~4,7%), STEL non-lab (~4,4%), Kalibrasi (~1,1%), dan Sewa (~0,2%). STEL dan Sewa bukan lab fisik melainkan lini layanan tambahan yang masuk ke total penerimaan kas.",
    };
  }

  if (q === "berapa spk" || q === "berapa spk?" || q === "total spk") {
    return {
      text: "Total SPK seluruh periode 2020–2025 adalah **4.224 SPK** (termasuk kalibrasi internal Telkom).\n\n**Rincian per tahun:**\n• 2020: 496 SPK (rekap bulanan)\n• 2021: 527 SPK\n• 2022: 607 SPK\n• 2023: 847 SPK\n• 2024: 1.063 SPK\n• 2025: 684 SPK\n\n*Silakan sebutkan tahun spesifik jika ingin melihat rincian lab atau pengujian.*",
      citation: DATA_NOTES.definisi_spk,
    };
  }

  if (q.includes("bandingkan 2024 dan 2025") || (q.includes("2024") && q.includes("2025") && q.includes("bandingkan"))) {
    return {
      text: "Perbandingan performa tahun 2024 vs 2025:\n• **Revenue (Kas Masuk):** Turun **-34,0%** (dari Rp 20.557.119.850 menjadi Rp 13.575.482.534, selisih -Rp 6.981.637.316).\n• **Volume SPK:** Turun **-35,7%** (dari 1.063 SPK menjadi 684 SPK, selisih -379 SPK).",
    };
  }

  // ── I. DYNAMIC FALLBACK PARSER ───────────────────────────────────
  // Cek apakah ada penyebutan tahun spesifik
  const thnMatches = q.match(/\b(202[0-5])\b/g);
  const years = thnMatches ? thnMatches.map(Number) : context?.tahun_terpilih ? [context.tahun_terpilih] : [];

  // Jika tanya klien tertentu
  const klienMatch = q.match(/klien\s+([a-z0-9\s]+)/i);
  if (klienMatch) {
    const searchName = klienMatch[1].trim();
    if (searchName.length >= 3) {
      const filteredRev = revenueData.filter((r) =>
        (r.Perusahaan || "").toLowerCase().includes(searchName)
      );
      if (filteredRev.length > 0) {
        const total = sumBy(filteredRev, "Nominal_Revenue");
        const companyName = filteredRev[0].Perusahaan;
        return {
          text: `Ditemukan data transaksi untuk **${companyName}** dengan total penerimaan revenue sebesar **${formatRupiah(
            total
          )}** dari ${filteredRev.length} transaksi.`,
        };
      }
    }
  }

  // Jika filter tahun ditemukan
  if (years.length === 1) {
    const yr = years[0];
    const subRev = revenueData.filter((r) => r.Tahun === yr);
    const subSpk = spkData.filter((r) => r.Tahun === yr);
    const totRev = sumBy(subRev, "Nominal_Revenue");
    const totSpk = sumBy(subSpk, "Jumlah_SPK");

    if (q.includes("spk")) {
      return {
        text: `Total SPK tahun **${yr}** adalah **${formatNumber(
          totSpk
        )} SPK** (termasuk kalibrasi internal).`,
      };
    }

    return {
      text: `Total revenue tahun **${yr}** adalah **${formatRupiah(
        totRev
      )}** dari ${formatNumber(subRev.length)} transaksi kas masuk.`,
    };
  }

  // Fallback default
  const totalRev = sumBy(revenueData, "Nominal_Revenue");
  const totalSpk = sumBy(spkData, "Jumlah_SPK");
  return {
    text: `Saya Asisten Data Resmi SPK & Revenue Telkom (2020–2025).\n\nAnda dapat menanyakan hal-hal seperti:\n• *"Berapa total revenue 2024?"*\n• *"Revenue 2025 berapa dan turun berapa persen dari 2024?"*\n• *"Siapa 5 klien spending tertinggi di 2022?"*\n• *"Rincian revenue per lab 2024"*\n• *"SPK per jenis pengujian 2024"*\n• *"Bulan apa revenue tertinggi di 2024?"*\n\n*(Total database aktif: ${formatNumber(
      revenueData.length
    )} transaksi, ${formatRupiah(totalRev, true)}, ${formatNumber(totalSpk)} SPK)*`,
  };
}
