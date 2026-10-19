"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Save, X } from "lucide-react";
import { workspaceThemeClasses } from "../../lib/workspace-theme";
import type { Transaction, TransactionPayload, WorkspaceTheme } from "../../lib/workspace-types";

interface TransactionEditDialogProps {
  open: boolean;
  mode: "create" | "edit";
  transaction: Transaction | null;
  defaultYear: string;
  theme: WorkspaceTheme;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: TransactionPayload) => Promise<void>;
}

type FormValues = Omit<TransactionPayload, "tahun" | "nominal_revenue" | "ppn" | "pph23"> & {
  tahun: string;
  nominal_revenue: string;
  ppn: string;
  pph23: string;
};

const emptyForm = (year: string): FormValues => ({
    tahun: year === "all" ? "2025" : year,
    bulan: "",
    tanggal: "",
    perusahaan: "",
    jenis_transaksi: "",
    pengujian_stel: "",
    laboratorium: "",
    keterangan: "",
  nominal_revenue: "0",
  ppn: "0",
  pph23: "0",
});

const toFormValues = (transaction: Transaction): FormValues => ({
  tahun: String(transaction.tahun ?? 2025),
  bulan: transaction.bulan ?? "",
  tanggal: transaction.tanggal ?? "",
  perusahaan: transaction.perusahaan ?? "",
  jenis_transaksi: transaction.jenis_transaksi ?? "",
  pengujian_stel: transaction.pengujian_stel ?? "",
  laboratorium: transaction.laboratorium ?? "",
  keterangan: transaction.keterangan ?? "",
  nominal_revenue: String(transaction.nominal_revenue ?? 0),
  ppn: String(transaction.ppn ?? 0),
  pph23: String(transaction.pph23 ?? 0),
});

const textFields = [
  { key: "bulan", label: "Bulan", required: true },
  { key: "tanggal", label: "Tanggal", required: false },
  { key: "perusahaan", label: "Perusahaan", required: true },
  { key: "jenis_transaksi", label: "Jenis transaksi", required: true },
  { key: "pengujian_stel", label: "Pengujian / STEL", required: true },
  { key: "laboratorium", label: "Laboratorium", required: true },
  { key: "keterangan", label: "Keterangan", required: false },
] as const;
const amountFields: Array<{
  key: "nominal_revenue" | "ppn" | "pph23";
  label: string;
  min?: number;
}> = [
  { key: "nominal_revenue", label: "Nominal revenue", min: 0 },
  { key: "ppn", label: "PPN", min: 0 },
  { key: "pph23", label: "PPh 23" },
];

export default function TransactionEditDialog({
  open,
  mode,
  transaction,
  defaultYear,
  theme,
  isSaving,
  error,
  onClose,
  onSave,
}: TransactionEditDialogProps) {
  const styles = workspaceThemeClasses[theme];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<FormValues>(() => transaction ? toFormValues(transaction) : emptyForm(defaultYear));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const updateField = (key: keyof FormValues, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave({
      ...draft,
      tahun: Number(draft.tahun),
      nominal_revenue: Number(draft.nominal_revenue),
      ppn: Number(draft.ppn),
      pph23: Number(draft.pph23),
    });
  };

  const inputClasses = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 disabled:opacity-60 ${styles.input}`;
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="transaction-form-title"
      onCancel={(event) => { event.preventDefault(); if (!isSaving) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}
      className={`m-auto max-h-[min(90dvh,760px)] w-[min(94vw,720px)] overflow-y-auto rounded-2xl border p-0 shadow-2xl backdrop:bg-slate-950/70 ${styles.panel}`}
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-7">
        <div className={`mb-6 flex items-start justify-between gap-4 border-b pb-4 ${styles.border}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">Database record</p>
            <h2 id="transaction-form-title" className="mt-1 text-xl font-bold">{mode === "create" ? "Tambah transaksi" : "Edit transaksi"}</h2>
            <p className={`mt-1 text-sm ${styles.muted}`}>{mode === "create" ? "Catat transaksi baru ke database." : transaction?.perusahaan || "Perbarui data transaksi."}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Tutup formulir" className={`rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 ${styles.muted}`}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={`flex flex-col gap-1.5 text-sm font-medium ${styles.secondary}`}>
            Tahun
            <input type="number" required min={1900} max={2200} value={draft.tahun} onChange={(event) => updateField("tahun", event.currentTarget.value)} className={inputClasses} />
          </label>
          {textFields.map(({ key, label, required }) => <label key={key} className={`flex flex-col gap-1.5 text-sm font-medium ${styles.secondary}`}>
            {label}
            <input type="text" required={required} value={draft[key]} onChange={(event) => updateField(key, event.currentTarget.value)} className={inputClasses} />
          </label>)}
{amountFields.map(({ key, label, min }) => <label key={key} className={`flex flex-col gap-1.5 text-sm font-medium ${styles.secondary}`}>
            {label}
            <input type="number" min={min} step="any" required value={draft[key]} onChange={(event) => updateField(key, event.currentTarget.value)} className={inputClasses} />
          </label>)}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}
        <div className={`mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${styles.border}`}>
          <button type="button" onClick={onClose} disabled={isSaving} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red disabled:opacity-50 ${styles.subtleBorder} ${styles.secondary}`}>Batal</button>
          <button type="submit" disabled={isSaving} className="workspace-brand-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">
            <Save className="h-4 w-4" aria-hidden="true" />{isSaving ? "Menyimpan..." : mode === "create" ? "Simpan transaksi" : "Simpan perubahan"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
