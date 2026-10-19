"use client";

import { Edit3, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import type { Transaction, WorkspaceTheme } from "../../lib/workspace-types";
import { workspaceThemeClasses } from "../../lib/workspace-theme";

interface TransactionTableProps {
  transactions: Transaction[];
  searchQuery: string;
  theme: WorkspaceTheme;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  deletingId: number | null;
  totalRecords: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

const formatAmount = (value: number | null) => (value ?? 0).toLocaleString("id-ID");

export default function TransactionTable({
  transactions,
  searchQuery,
  theme,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
  deletingId,
  totalRecords,
  limit,
  offset,
  onPageChange,
}: TransactionTableProps) {
  const styles = workspaceThemeClasses[theme];
  const firstRecord = totalRecords === 0 ? 0 : offset + 1;
  const lastRecord = Math.min(offset + transactions.length, totalRecords);

  return (
    <section className={`overflow-hidden rounded-2xl border ${styles.panel}`} aria-labelledby="transactions-title">
      <div className={`flex flex-col gap-4 border-b ${styles.border} p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">Database workspace</p>
          <h2 id="transactions-title" className="mt-1 text-lg font-bold">Transaksi</h2>
          <p className={`mt-1 text-xs ${styles.muted}`}>
            {totalRecords.toLocaleString("id-ID")} transaksi
            {totalRecords > limit ? ` · halaman ${Math.floor(offset / limit) + 1} dari ${Math.ceil(totalRecords / limit)}` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-64">
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${styles.muted}`} aria-hidden="true" />
            <label htmlFor="transaction-search" className="sr-only">Cari perusahaan, domain, atau jenis</label>
            <input
              id="transaction-search"
              type="search"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 ${styles.input}`}
            />
          </div>
          <button type="button" onClick={onCreate} className="workspace-brand-button inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <Plus className="h-4 w-4" aria-hidden="true" /> Tambah transaksi
          </button>
        </div>
      </div>

      <div className="max-h-[min(62vh,620px)] overflow-auto">
        <table className={`w-full min-w-[760px] text-left text-sm ${styles.secondary}`}>
          <thead className={`sticky top-0 z-10 text-[11px] uppercase tracking-[0.14em] ${styles.tableHeader}`}>
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Tahun/Bulan</th>
              <th scope="col" className="px-4 py-3 font-semibold">Perusahaan</th>
              <th scope="col" className="px-4 py-3 font-semibold">Domain</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Revenue (Rp)</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status lost</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${styles.border}`}>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className={`transition-colors ${styles.rowHover}`}>
                <td className={`whitespace-nowrap px-4 py-3 ${styles.muted}`}>{transaction.tahun ?? "—"} · {transaction.bulan || "—"}</td>
                <td className="max-w-[280px] truncate px-4 py-3 font-semibold" title={transaction.perusahaan ?? "—"}>{transaction.perusahaan || "—"}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs ${styles.chip}`}>{transaction.domain_lab || "—"}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-medium text-(--workspace-revenue)">{formatAmount(transaction.nominal_revenue)}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${(transaction.nominal_lost ?? 0) > 0 ? "bg-(--workspace-loss-wash) text-(--workspace-loss)" : "bg-(--workspace-revenue-wash) text-(--workspace-revenue)"}`}>{transaction.status_lost || "No Loss Identified"}</span></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => onEdit(transaction)} aria-label={`Edit transaksi ${transaction.perusahaan ?? transaction.id}`} title="Edit transaksi" className="grid h-11 w-11 place-items-center rounded-xl text-(--workspace-muted) transition hover:bg-(--workspace-loss-wash) hover:text-(--workspace-loss) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--workspace-loss)"><Edit3 className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" onClick={() => onDelete(transaction)} disabled={deletingId === transaction.id} aria-label={`Hapus transaksi ${transaction.perusahaan ?? transaction.id}`} title="Hapus transaksi" className="grid h-11 w-11 place-items-center rounded-xl text-(--workspace-muted) transition hover:bg-red-500/10 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red disabled:cursor-wait disabled:opacity-60">
                      {deletingId === transaction.id ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={6} className={`px-4 py-16 text-center ${styles.muted}`}><Search className="mx-auto mb-3 h-6 w-6 opacity-50" aria-hidden="true" /><p className="font-semibold">Tidak ada transaksi yang cocok.</p><p className="mt-1 text-xs">Coba kata kunci lain atau tambah transaksi.</p></td></tr>}
          </tbody>
        </table>
      </div>

      <footer className={`flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between ${styles.border}`}>
        <p className={styles.muted}>Menampilkan {firstRecord.toLocaleString("id-ID")}–{lastRecord.toLocaleString("id-ID")} dari {totalRecords.toLocaleString("id-ID")}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onPageChange(Math.max(0, offset - limit))} disabled={offset === 0} className={`rounded-lg border px-3 py-2 font-medium transition hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 ${styles.subtleBorder}`}>Sebelumnya</button>
          <button type="button" onClick={() => onPageChange(offset + limit)} disabled={offset + limit >= totalRecords} className={`rounded-lg border px-3 py-2 font-medium transition hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 ${styles.subtleBorder}`}>Berikutnya</button>
        </div>
      </footer>
    </section>
  );
}
