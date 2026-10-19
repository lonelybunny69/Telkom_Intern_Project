import { DollarSign, FileText, Percent, TrendingDown } from "lucide-react";
import type { SummaryData, WorkspaceTheme } from "../../lib/workspace-types";
import { workspaceThemeClasses } from "../../lib/workspace-theme";

interface MetricCardsProps {
  summary: SummaryData | null;
  isLoading: boolean;
  theme: WorkspaceTheme;
}

const formatIDR = (value: number) => {
  if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(2)} Miliar`;
  if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(2)} Juta`;
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export default function MetricCards({ summary, isLoading, theme }: MetricCardsProps) {
  const styles = workspaceThemeClasses[theme];
  const metrics = [
    { label: "Total Revenue", value: summary ? formatIDR(summary.total_revenue) : "—", Icon: DollarSign, color: "text-(--workspace-revenue)", wash: "bg-(--workspace-revenue-wash)" },
    { label: "Lost Revenue", value: summary ? formatIDR(summary.total_lost) : "—", Icon: TrendingDown, color: "text-(--workspace-loss)", wash: "bg-(--workspace-loss-wash)" },
    { label: "Lost Ratio", value: summary ? `${summary.lost_ratio_percent}%` : "—", Icon: Percent, color: "text-(--workspace-loss)", wash: "bg-(--workspace-loss-wash)" },
    { label: "Total Transaksi", value: summary ? `${summary.total_transactions.toLocaleString("id-ID")} Trx` : "—", Icon: FileText, color: "text-(--workspace-foreground)", wash: "bg-(--workspace-chip)" },
  ];
  return <section aria-label="Ringkasan pendapatan" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {metrics.map(({ label, value, Icon, color, wash }) => <article key={label} className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 ${styles.card}`}>
      <div className="flex items-start justify-between gap-3"><div><p className={`text-xs font-semibold uppercase tracking-[0.14em] ${styles.muted}`}>{label}</p><p className={`mt-2 text-xl font-bold tabular-nums sm:text-2xl ${color}`}>{isLoading && !summary ? "…" : value}</p></div><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${wash} ${color}`}><Icon className="h-5 w-5" aria-hidden="true" /></span></div>
    </article>)}
  </section>;
}
