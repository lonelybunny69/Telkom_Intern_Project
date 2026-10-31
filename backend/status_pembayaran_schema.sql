-- =====================================================================
-- Tabel status_pembayaran: status pembayaran per transaksi (2020-2025)
-- Target: PostgreSQL. Satu baris per baris Master (kunci: id_transaksi).
-- Sesuaikan nama tabel/kolom Master pada bagian yang bertanda [SESUAIKAN].
-- =====================================================================

CREATE TABLE IF NOT EXISTS status_pembayaran (
    id_transaksi        TEXT PRIMARY KEY,
    tahun               SMALLINT      NOT NULL,
    bulan               TEXT          NOT NULL,
    transfer_diterima   NUMERIC(18,2) NOT NULL,   -- kas diterima (= nominal_revenue di Master)
    tagihan_jumlah      NUMERIC(18,2),            -- NULL bila data tagihan tidak tersedia
    ppn_tercatat        NUMERIC(18,2),
    selisih             NUMERIC(18,2),            -- tagihan - transfer
    selisih_pct         NUMERIC(10,6),            -- selisih / nilai terbesar(tagihan, transfer)
    dpp                 NUMERIC(18,2),            -- tagihan - ppn
    pph23_teoritis      NUMERIC(18,2),            -- 2% x dpp
    status_pembayaran   TEXT          NOT NULL
        CHECK (status_pembayaran IN ('Lunas','Potongan PPh 23','Kurang bayar',
                                     'Lebih bayar','Perlu verifikasi','Tagihan tidak tersedia')),
    cakupan_tagihan     TEXT          NOT NULL CHECK (cakupan_tagihan IN ('Tersedia','Tidak tersedia')),
    flag_selisih_5pct   TEXT          CHECK (flag_selisih_5pct IN ('Ya','Tidak')),
    catatan_sumber      TEXT,
    catatan_verifikasi  TEXT,
    -- "Tagihan tidak tersedia" HARUS sama dengan tagihan NULL (tidak boleh dicampur dengan "Lunas")
    CONSTRAINT ck_tagihan_konsisten
        CHECK ((tagihan_jumlah IS NULL) = (status_pembayaran = 'Tagihan tidak tersedia'))
);

-- [SESUAIKAN] aktifkan setelah nama tabel Master dipastikan:
-- ALTER TABLE status_pembayaran
--   ADD CONSTRAINT fk_status_master FOREIGN KEY (id_transaksi) REFERENCES master_data (id_transaksi);

-- ---------------------------------------------------------------------
-- IMPOR (psql). Urutan kolom CSV = urutan kolom tabel; header dilewati.
-- Sel kosong di CSV otomatis menjadi NULL.
-- ---------------------------------------------------------------------
-- \copy status_pembayaran FROM 'Status_Pembayaran_TTH_2020_2025.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- ---------------------------------------------------------------------
-- CEK SETELAH IMPOR (hasil harus sama dengan komentar)
-- ---------------------------------------------------------------------
-- 1) Jumlah baris                                   -> 4403
SELECT COUNT(*) AS jumlah_baris FROM status_pembayaran;

-- 2) Per status                                     -> lihat tabel di bawah
SELECT status_pembayaran, COUNT(*) AS baris, ROUND(SUM(selisih), 0) AS total_selisih
FROM status_pembayaran GROUP BY status_pembayaran ORDER BY status_pembayaran;
--   Kurang bayar            13     13822194
--   Lebih bayar              7    -38220000
--   Lunas                 1473         3949
--   Perlu verifikasi         3    191550000
--   Potongan PPh 23        688    407052851
--   Tagihan tidak tersedia 2219         (NULL)

-- 3) Total kas diterima                             -> 98941086744.20
SELECT ROUND(SUM(transfer_diterima), 2) AS total_transfer FROM status_pembayaran;

-- 4) Baris yang bertanda Flag_Selisih_5pct = 'Ya'   -> 8
SELECT COUNT(*) FROM status_pembayaran WHERE flag_selisih_5pct = 'Ya';

-- 5) Konsistensi dengan Master                      -> 0
--    [SESUAIKAN] nama tabel dan kolom Master
-- SELECT COUNT(*)
-- FROM status_pembayaran s
-- LEFT JOIN master_data m ON m.id_transaksi = s.id_transaksi
-- WHERE m.id_transaksi IS NULL
--    OR ABS(m.nominal_revenue - s.transfer_diterima) > 0.005;

-- ---------------------------------------------------------------------
-- CONTOH KPI untuk dashboard (selisih pembayaran per tahun)
-- Penyebut: tagihan pada baris bertagihan, tanpa 'Perlu verifikasi'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_kpi_selisih_pembayaran AS
SELECT tahun,
       COUNT(*)                                                         AS total_baris,
       ROUND(100.0 * COUNT(*) FILTER (WHERE cakupan_tagihan = 'Tersedia') / COUNT(*), 1) AS cakupan_tagihan_pct,
       SUM(tagihan_jumlah) FILTER (WHERE status_pembayaran <> 'Perlu verifikasi') AS tagihan_dinilai,
       SUM(selisih) FILTER (WHERE status_pembayaran = 'Potongan PPh 23') AS potongan_pph23,
       SUM(selisih) FILTER (WHERE status_pembayaran = 'Kurang bayar')    AS kurang_bayar,
       SUM(selisih) FILTER (WHERE status_pembayaran = 'Lebih bayar')     AS lebih_bayar,
       COUNT(*)     FILTER (WHERE status_pembayaran = 'Perlu verifikasi') AS baris_perlu_verifikasi
FROM status_pembayaran
GROUP BY tahun
ORDER BY tahun;
