import { Bot, MessageSquareText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Transaction, WorkspaceTheme } from "../../lib/workspace-types";
import { workspaceThemeClasses } from "../../lib/workspace-theme";

interface RevenueChartProps {
  transactions: Transaction[];
  theme: WorkspaceTheme;
  selectedYear: string;
  onOpenChat: () => void;
}

const formatIDR = (value: number) => {
  if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(2)} Miliar`;
  if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(2)} Juta`;
  return `Rp ${value.toLocaleString("id-ID")}`;
};
const compactIDR = (value: number) => value >= 1e9 ? `${(value / 1e9).toFixed(1)} M` : value >= 1e6 ? `${(value / 1e6).toFixed(0)} jt` : `${(value / 1e3).toFixed(0)} rb`;

export default function RevenueChart({ transactions, theme, selectedYear, onOpenChat }: RevenueChartProps) {
  const styles = workspaceThemeClasses[theme];
  const tone = theme === "light"
    ? { axis: "#765b63", grid: "#e8cfd5", tooltip: "#ffffff", text: "#35151e", revenue: "#047857", loss: "#a14f08" }
    : { axis: "#cbb2bb", grid: "#503541", tooltip: "#25131c", text: "#fff5f6", revenue: "#34d399", loss: "#fbbf24" };

  return <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
    <article className={`workspace-glass rounded-2xl border p-5 sm:p-6 ${styles.border}`}>
      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-red">Ringkasan performa</p><h2 className="mt-1 text-lg font-bold">Revenue & lost revenue</h2><p className={`mt-1 text-xs ${styles.muted}`}>10 transaksi terbaru pada halaman aktif · {selectedYear === "all" ? "semua tahun" : selectedYear}</p></div>
      <div className="h-[260px] w-full">
        {!transactions.length ? <div className={`grid h-full place-items-center text-sm ${styles.muted}`}>Belum ada data untuk ditampilkan.</div> : <ResponsiveContainer width="100%" height="100%"><BarChart data={transactions.slice(0, 10)} margin={{ top: 4, right: 4, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={tone.grid} vertical={false} /><XAxis dataKey="perusahaan" stroke={tone.axis} tick={{ fontSize: 10, fill: tone.axis }} tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis width={74} stroke={tone.axis} tick={{ fontSize: 10, fill: tone.axis }} tickLine={false} axisLine={false} tickFormatter={(value: number) => compactIDR(Number(value))} />
          <Tooltip contentStyle={{ backgroundColor: tone.tooltip, borderColor: tone.grid, borderRadius: 12, color: tone.text, fontSize: 12 }} formatter={(value) => formatIDR(typeof value === "number" ? value : Number(value ?? 0))} /><Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="nominal_revenue" fill={tone.revenue} name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={34} /><Bar dataKey="nominal_lost" fill={tone.loss} name="Lost revenue" radius={[4, 4, 0, 0]} maxBarSize={34} />
        </BarChart></ResponsiveContainer>}
      </div>
    </article>
    <aside className={`workspace-glass flex flex-col justify-between rounded-2xl border p-5 sm:p-6 ${styles.border}`}>
      <div><span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-(--workspace-brand-wash) text-brand-red"><Bot className="h-5 w-5" aria-hidden="true" /></span><p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-red">Workspace assistant</p><h2 className="mt-2 max-w-xs text-xl font-bold leading-snug">Tanya insight dari data revenue.</h2><p className={`mt-3 text-sm leading-relaxed ${styles.muted}`}>Ajukan pertanyaan pendapatan atau piutang tanpa meninggalkan database transaksi.</p></div>
      <div className="mt-5">
        <div className={`rounded-xl px-4 py-3 ${styles.elevated}`}><p className={`text-xs ${styles.muted}`}>Coba tanyakan</p><p className={`mt-1 text-sm ${styles.secondary}`}>&ldquo;Pendapatan 2024&rdquo; · &ldquo;Daftar belum bayar&rdquo;</p></div>
        <button type="button" onClick={onOpenChat} className="workspace-brand-button mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"><MessageSquareText className="h-4 w-4" aria-hidden="true" />Buka AI assistant</button>
      </div>
    </aside>
  </section>;
}
