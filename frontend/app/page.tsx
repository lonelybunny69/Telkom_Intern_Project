"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import ChatAssistant from "../components/workspace/ChatAssistant";
import MetricCards from "../components/workspace/MetricCards";
import RevenueChart from "../components/workspace/RevenueChart";
import TransactionEditDialog from "../components/workspace/TransactionEditDialog";
import TransactionTable from "../components/workspace/TransactionTable";
import UploadControl from "../components/workspace/UploadControl";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import { createTransaction, deleteTransaction, getSummary, getTransactions, updateTransaction, uploadFile } from "../lib/workspace-api";
import { workspaceThemeClasses } from "../lib/workspace-theme";
import type { SummaryData, Transaction, TransactionPayload, WorkspaceTheme } from "../lib/workspace-types";

const PAGE_SIZE = 50;
type EditorMode = "create" | "edit" | null;

export default function Workspace() {
  const [theme, setTheme] = useState<WorkspaceTheme>("dark");
  const [selectedYear, setSelectedYear] = useState("all");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const requestSequence = useRef(0);
  const styles = workspaceThemeClasses[theme];

  const loadData = useCallback(async () => {
    const [nextSummary, transactionResponse] = await Promise.all([
      getSummary(selectedYear, searchQuery),
      getTransactions(selectedYear, PAGE_SIZE, offset, searchQuery),
    ]);
    return { nextSummary, transactionResponse };
  }, [offset, searchQuery, selectedYear]);

  useEffect(() => {
    let active = true;
    const sequence = ++requestSequence.current;
    void loadData()
      .then(({ nextSummary, transactionResponse }) => {
        if (!active || sequence !== requestSequence.current) return;
        setSummary(nextSummary);
        setTransactions(transactionResponse.data);
        setTotalTransactions(transactionResponse.total);
        setDataError(null);
      })
      .catch((error: unknown) => {
        console.error("Gagal mengambil data database:", error);
        if (active && sequence === requestSequence.current) setDataError("Data belum dapat dimuat. Pastikan backend aktif, lalu coba lagi.");
      })
      .finally(() => {
        if (active && sequence === requestSequence.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [loadData]);

  const refreshData = async (requestedOffset = offset) => {
    const sequence = ++requestSequence.current;
    setIsRefreshing(true);
    try {
      const [nextSummary, transactionResponse] = await Promise.all([
        getSummary(selectedYear, searchQuery),
        getTransactions(selectedYear, PAGE_SIZE, requestedOffset, searchQuery),
      ]);
      if (sequence !== requestSequence.current) return;
      setSummary(nextSummary);
      setTransactions(transactionResponse.data);
      setTotalTransactions(transactionResponse.total);
      setDataError(null);
    } catch (error) {
      console.error("Gagal memuat ulang database:", error);
      if (sequence === requestSequence.current) setDataError("Data belum dapat dimuat. Pastikan backend aktif, lalu coba lagi.");
    } finally {
      if (sequence === requestSequence.current) {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;
    setIsUploading(true);
    setUploadStatus(`Mengunggah ${files.length} file...`);
    let succeeded = 0;
    let failedName: string | null = null;
    try {
      for (const file of files) {
        try {
          await uploadFile(file);
          succeeded += 1;
          setUploadStatus(`Menggabungkan file ${succeeded} dari ${files.length}...`);
        } catch (error) {
          console.warn(`Gagal upload ${file.name}:`, error);
          failedName = file.name;
          break;
        }
      }
      if (succeeded > 0) {
        setOffset(0);
        const [nextSummary, transactionResponse] = await Promise.all([
          getSummary(selectedYear, searchQuery),
          getTransactions(selectedYear, PAGE_SIZE, 0, searchQuery),
        ]);
        setSummary(nextSummary);
        setTransactions(transactionResponse.data);
        setTotalTransactions(transactionResponse.total);
      }
      setUploadStatus(failedName
        ? `${succeeded} dari ${files.length} file berhasil; gagal mengunggah ${failedName}.`
        : `Berhasil menambahkan ${succeeded} file ke database.`);
    } catch (error) {
      console.error("Gagal memuat ulang data setelah import:", error);
      setUploadStatus(`${succeeded} file terunggah, tetapi refresh database gagal.`);
    } finally {
      setIsUploading(false);
    }
  };

  const openCreate = () => {
    setEditingTransaction(null);
    setEditError(null);
    setEditorMode("create");
    setEditorKey((key) => key + 1);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditError(null);
    setEditorMode("edit");
    setEditorKey((key) => key + 1);
  };

  const handleSave = async (payload: TransactionPayload) => {
    setIsSaving(true);
    setEditError(null);
    let targetOffset = offset;
    try {
      if (editorMode === "create") {
        await createTransaction(payload);
        targetOffset = 0;
        setOffset(0);
      } else if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
      }
      setEditorMode(null);
      setEditingTransaction(null);
      await refreshData(targetOffset);
    } catch (error) {
      console.error("Gagal menyimpan transaksi:", error);
      setEditError("Transaksi tidak dapat disimpan. Periksa koneksi atau data yang dimasukkan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const transaction = confirmDelete;
    const label = transaction.perusahaan || `transaksi #${transaction.id}`;
    setDeletingId(transaction.id);
    setActionError(null);
    try {
      await deleteTransaction(transaction.id);
      setConfirmDelete(null);
      if (offset > 0 && transactions.length === 1) setOffset(Math.max(0, offset - PAGE_SIZE));
      else await refreshData();
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
      setActionError(`Transaksi ${label} tidak dapat dihapus.`);
    } finally {
      setDeletingId(null);
    }
  };

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setOffset(0);
    setIsLoading(true);
  };

  const changeYear = (year: string) => {
    setSelectedYear(year);
    setOffset(0);
    setIsLoading(true);
  };

  return (
    <main data-theme={theme} className={`workspace-shell min-h-screen transition-colors duration-300 ${styles.page}`}>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <WorkspaceHeader theme={theme} selectedYear={selectedYear} isLoading={isLoading || isRefreshing} onThemeChange={setTheme} onYearChange={changeYear} onRefresh={() => void refreshData()} />
        {dataError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600"><span>{dataError}</span><button type="button" onClick={() => void refreshData()} className="font-semibold underline">Coba lagi</button></div>}

        <MetricCards summary={summary} isLoading={isLoading} theme={theme} />
        <RevenueChart transactions={transactions} theme={theme} selectedYear={selectedYear} onOpenChat={() => setIsChatOpen(true)} />

        <section className="mb-20">
          <div className="mb-3 flex justify-end">
            <UploadControl isUploading={isUploading} status={uploadStatus} onUpload={handleUpload} />
          </div>
          {actionError && <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">{actionError}</p>}
          {isLoading && transactions.length === 0 ? (
            <div role="status" className="space-y-3 p-6"><div className="h-10 animate-pulse rounded bg-slate-500/10" /><div className="h-10 animate-pulse rounded bg-slate-500/10" /><span className="sr-only">Memuat database...</span></div>
          ) : dataError && transactions.length === 0 ? (
            <p className={`p-10 text-center text-sm ${styles.muted}`}>Database belum tersambung.</p>
          ) : (
            <TransactionTable
              transactions={transactions}
              searchQuery={searchQuery}
              theme={theme}
              onSearchChange={changeSearch}
              onCreate={openCreate}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
              deletingId={deletingId}
              totalRecords={totalTransactions}
              limit={PAGE_SIZE}
              offset={offset}
              onPageChange={(nextOffset) => { setOffset(nextOffset); setIsLoading(true); }}
            />
          )}
        </section>
      </div>

      <TransactionEditDialog key={editorKey} open={editorMode !== null} mode={editorMode ?? "create"} transaction={editingTransaction} defaultYear={selectedYear} theme={theme} isSaving={isSaving} error={editError} onClose={() => { if (!isSaving) { setEditorMode(null); setEditingTransaction(null); } }} onSave={handleSave} />
      <ChatAssistant theme={theme} isOpen={isChatOpen} onOpenChange={setIsChatOpen} />

      {confirmDelete && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingId) setConfirmDelete(null); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${styles.panel}`}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">Konfirmasi database</p><h2 id="delete-title" className="mt-2 text-lg font-bold">Hapus transaksi?</h2>
          <p id="delete-description" className={`mt-2 text-sm ${styles.muted}`}>Record <span className={`font-semibold ${styles.secondary}`}>{confirmDelete.perusahaan || `#${confirmDelete.id}`}</span> akan dihapus permanen.</p>
          {actionError && <p role="alert" className="mt-3 text-sm text-red-500">{actionError}</p>}
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmDelete(null)} disabled={Boolean(deletingId)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${styles.subtleBorder} ${styles.secondary}`}>Batal</button><button type="button" onClick={() => void handleDelete()} disabled={Boolean(deletingId)} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{deletingId ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deletingId ? "Menghapus..." : "Hapus record"}</button></div>
        </section>
      </div>}
    </main>
  );
}
