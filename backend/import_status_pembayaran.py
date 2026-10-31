import sqlite3
import csv
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent / "revenue_workspace.db"
csv_path = Path(__file__).resolve().parent / "Status_Pembayaran_TTH_2020_2025.csv"

conn = sqlite3.connect(db_path)

conn.execute("DROP TABLE IF EXISTS status_pembayaran")
conn.execute("""
CREATE TABLE status_pembayaran (
    id_transaksi        TEXT PRIMARY KEY,
    tahun               INTEGER       NOT NULL,
    bulan               TEXT          NOT NULL,
    transfer_diterima   REAL          NOT NULL,
    tagihan_jumlah      REAL,
    ppn_tercatat        REAL,
    selisih             REAL,
    selisih_pct         REAL,
    dpp                 REAL,
    pph23_teoritis      REAL,
    status_pembayaran   TEXT          NOT NULL
        CHECK (status_pembayaran IN ('Lunas','Potongan PPh 23','Kurang bayar',
                                     'Lebih bayar','Perlu verifikasi','Tagihan tidak tersedia')),
    cakupan_tagihan     TEXT          NOT NULL CHECK (cakupan_tagihan IN ('Tersedia','Tidak tersedia')),
    flag_selisih_5pct   TEXT          CHECK (flag_selisih_5pct IN ('Ya','Tidak')),
    catatan_sumber      TEXT,
    catatan_verifikasi  TEXT
)
""")

def parse_val(val, is_float=False, is_int=False):
    if val is None or val == '' or val.strip() == '':
        return None
    val = val.strip()
    if is_float:
        return float(val)
    if is_int:
        return int(val)
    return val

rows = []
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for r in reader:
        if not r or not any(x.strip() for x in r):
            continue
        rows.append((
            parse_val(r[0]),
            parse_val(r[1], is_int=True),
            parse_val(r[2]),
            parse_val(r[3], is_float=True),
            parse_val(r[4], is_float=True),
            parse_val(r[5], is_float=True),
            parse_val(r[6], is_float=True),
            parse_val(r[7], is_float=True),
            parse_val(r[8], is_float=True),
            parse_val(r[9], is_float=True),
            parse_val(r[10]),
            parse_val(r[11]),
            parse_val(r[12]),
            parse_val(r[13]),
            parse_val(r[14])
        ))

conn.executemany("INSERT INTO status_pembayaran VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", rows)

# Create indices
conn.execute("CREATE INDEX IF NOT EXISTS idx_status_pembayaran_tahun ON status_pembayaran(tahun)")
conn.execute("CREATE INDEX IF NOT EXISTS idx_status_pembayaran_status ON status_pembayaran(status_pembayaran)")

# Create View KPI
conn.execute("DROP VIEW IF EXISTS v_kpi_selisih_pembayaran")
conn.execute("""
CREATE VIEW v_kpi_selisih_pembayaran AS
SELECT tahun,
       COUNT(*) AS total_baris,
       ROUND(100.0 * SUM(CASE WHEN cakupan_tagihan = 'Tersedia' THEN 1 ELSE 0 END) / COUNT(*), 1) AS cakupan_tagihan_pct,
       SUM(CASE WHEN status_pembayaran <> 'Perlu verifikasi' THEN tagihan_jumlah ELSE 0 END) AS tagihan_dinilai,
       SUM(CASE WHEN status_pembayaran = 'Potongan PPh 23' THEN selisih ELSE 0 END) AS potongan_pph23,
       SUM(CASE WHEN status_pembayaran = 'Kurang bayar' THEN selisih ELSE 0 END) AS kurang_bayar,
       SUM(CASE WHEN status_pembayaran = 'Lebih bayar' THEN selisih ELSE 0 END) AS lebih_bayar,
       SUM(CASE WHEN status_pembayaran = 'Perlu verifikasi' THEN 1 ELSE 0 END) AS baris_perlu_verifikasi
FROM status_pembayaran
GROUP BY tahun
ORDER BY tahun;
""")

conn.commit()

# --- RUN CHECKS ---
print("=== 1) JUMLAH BARIS ===")
row_count = conn.execute("SELECT COUNT(*) FROM status_pembayaran").fetchone()[0]
print(f"Hasil: {row_count} | Target: 4403")

print("\n=== 2) PER STATUS PEMBAYARAN ===")
status_rows = conn.execute("""
SELECT status_pembayaran, COUNT(*) AS baris, ROUND(SUM(selisih), 0) AS total_selisih
FROM status_pembayaran
GROUP BY status_pembayaran
ORDER BY status_pembayaran;
""").fetchall()
expected_status = {
    "Kurang bayar": (13, 13822194),
    "Lebih bayar": (7, -38220000),
    "Lunas": (1473, 3949),
    "Perlu verifikasi": (3, 191550000),
    "Potongan PPh 23": (688, 407052851),
    "Tagihan tidak tersedia": (2219, None)
}

print(f"{'Status':25} {'Baris':>6} {'Total Selisih':>15}  | {'Target Baris':>12} {'Target Selisih':>15}")
print("-" * 80)
for st, cnt, s_sum in status_rows:
    exp_cnt, exp_sum = expected_status.get(st, ('?', '?'))
    s_sum_display = "NULL" if s_sum is None else f"{int(s_sum):,}"
    exp_sum_display = "NULL" if exp_sum is None else f"{exp_sum:,}"
    print(f"{st:25} {cnt:6d} {s_sum_display:>15}  | {exp_cnt:12d} {exp_sum_display:>15}")

print("\n=== 3) TOTAL TRANSFER DITERIMA ===")
tot_transfer = conn.execute("SELECT ROUND(SUM(transfer_diterima), 2) FROM status_pembayaran").fetchone()[0]
print(f"Hasil: Rp {tot_transfer:,.2f} | Target: Rp 98,941,086,744.20")

print("\n=== 4) FLAG SELISIH 5% ===")
flag_cnt = conn.execute("SELECT COUNT(*) FROM status_pembayaran WHERE flag_selisih_5pct = 'Ya'").fetchone()[0]
print(f"Hasil: {flag_cnt} | Target: 8")

print("\n=== 5) KONSISTENSI DENGAN MASTER (transactions) ===")
diff_cnt = conn.execute("""
SELECT COUNT(*)
FROM status_pembayaran s
LEFT JOIN transactions m ON m.id_transaksi = s.id_transaksi
WHERE m.id_transaksi IS NULL
   OR ABS(m.nominal_revenue - s.transfer_diterima) > 0.005;
""").fetchone()[0]
print(f"Hasil selisih/inkonsistensi: {diff_cnt} | Target: 0")

print("\n=== 6) KPI VIEW PER TAHUN ===")
kpi_rows = conn.execute("SELECT * FROM v_kpi_selisih_pembayaran").fetchall()
for k in kpi_rows:
    print(k)

conn.close()
