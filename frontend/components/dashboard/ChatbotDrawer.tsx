"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDashboard } from "../../lib/dashboard-context";
import { formatRupiah, formatNumber, groupBy, sumBy, topClients } from "../../lib/data-utils";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
  table?: { headers: string[]; rows: string[][] };
}

const SUGGESTED = [
  "Siapa 5 klien spending tertinggi?",
  "Bagaimana tren revenue 2020–2025?",
  "Lab mana yang paling produktif?",
  "Berapa total transaksi STEL?",
  "Berapa total revenue tahun 2024?",
  "Klien mana yang paling banyak SPK?",
];

function buildAnswer(
  query: string,
  revenue: ReturnType<typeof useDashboard>["filteredRevenue"],
  spk: ReturnType<typeof useDashboard>["filteredSpk"]
): Pick<Message, "text" | "table"> {
  const q = query.toLowerCase();

  // Total revenue
  if (q.includes("total revenue") || q.includes("total pendapatan")) {
    const tahunMatch = q.match(/\d{4}/);
    const rows = tahunMatch ? revenue.filter((r) => r.Tahun === Number(tahunMatch[0])) : revenue;
    const total = rows.reduce((s, r) => s + r.Nominal_Revenue, 0);
    return {
      text: `Total revenue${tahunMatch ? ` tahun ${tahunMatch[0]}` : ""} adalah **${formatRupiah(total)}** dari ${formatNumber(rows.length)} transaksi.`,
    };
  }

  // Top clients
  if (q.includes("klien") && (q.includes("tertinggi") || q.includes("terbesar") || q.includes("spending") || q.includes("top"))) {
    const nMatch = q.match(/(\d+)/);
    const n = nMatch ? parseInt(nMatch[1]) : 5;
    const clients = topClients(revenue, spk, n);
    return {
      text: `Berikut **top ${n} klien** berdasarkan total revenue:`,
      table: {
        headers: ["#", "Perusahaan", "Revenue", "Transaksi"],
        rows: clients.map((c, i) => [
          String(i + 1),
          c.name,
          formatRupiah(c.revenue, true),
          formatNumber(c.trxCount),
        ]),
      },
    };
  }

  // SPK by client
  if (q.includes("klien") && q.includes("spk")) {
    const spkMap = groupBy(spk, "Pelanggan_Key");
    const sorted = Array.from(spkMap.entries())
      .map(([key, rows]) => ({ name: rows[0]?.Perusahaan || key, spk: sumBy(rows, "Jumlah_SPK") }))
      .sort((a, b) => b.spk - a.spk)
      .slice(0, 5);
    return {
      text: "**Top 5 klien** berdasarkan jumlah SPK:",
      table: {
        headers: ["#", "Perusahaan", "Jml SPK"],
        rows: sorted.map((c, i) => [String(i + 1), c.name, formatNumber(c.spk)]),
      },
    };
  }

  // Trend revenue
  if (q.includes("tren") || q.includes("trend") || q.includes("per tahun") || q.includes("2020") || q.includes("2025")) {
    const byYear = groupBy(revenue, "Tahun");
    const rows = Array.from(byYear.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([y, items]) => {
        const total = sumBy(items, "Nominal_Revenue");
        return [String(y), formatRupiah(total, true), formatNumber(items.length)];
      });
    return {
      text: "Berikut **tren revenue per tahun**:",
      table: {
        headers: ["Tahun", "Revenue", "Transaksi"],
        rows,
      },
    };
  }

  // Lab productivity
  if (q.includes("lab") && (q.includes("produktif") || q.includes("terbaik") || q.includes("paling"))) {
    const labMap = groupBy(revenue, "Domain_Lab");
    const sorted = Array.from(labMap.entries())
      .map(([lab, items]) => ({
        lab: lab || "(Tidak Diisi)",
        rev: sumBy(items, "Nominal_Revenue"),
        trx: items.length,
      }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 6);
    return {
      text: "Ranking lab berdasarkan **total revenue**:",
      table: {
        headers: ["Lab", "Revenue", "Transaksi"],
        rows: sorted.map((l) => [l.lab, formatRupiah(l.rev, true), formatNumber(l.trx)]),
      },
    };
  }

  // STEL
  if (q.includes("stel")) {
    const stelRows = revenue.filter((r) => r.Kategori_Utama === "STEL");
    const total = sumBy(stelRows, "Nominal_Revenue");
    return {
      text: `Total transaksi STEL: **${formatNumber(stelRows.length)} transaksi** dengan revenue **${formatRupiah(total, true)}**.`,
    };
  }

  // Total SPK
  if (q.includes("total spk") || q.includes("jumlah spk")) {
    const total = sumBy(spk, "Jumlah_SPK");
    return {
      text: `Total **${formatNumber(total)} SPK** dari ${formatNumber(spk.length)} baris data.`,
    };
  }

  // Fallback
  const totalRev = sumBy(revenue, "Nominal_Revenue");
  return {
    text: `Maaf, saya belum memahami pertanyaan itu. Coba tanya hal seperti:\n• "Siapa 5 klien tertinggi?"\n• "Tren revenue 2020–2025"\n• "Lab mana paling produktif?"\n\n*Data aktif: ${formatNumber(revenue.length)} transaksi, total ${formatRupiah(totalRev, true)}.*`,
  };
}

export default function ChatbotDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { filteredRevenue, filteredSpk, filters } = useDashboard();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "bot",
      text: "Halo! Saya asisten analitik Telkom Revenue. Tanyakan apapun tentang data yang sedang ditampilkan. 👋",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filterLabel = [
    ...(filters.years.length ? [`Tahun: ${filters.years.join(", ")}`] : []),
    ...(filters.labs.length ? [`Lab: ${filters.labs.join(", ")}`] : []),
    ...(filters.testTypes.length ? [`Jenis: ${filters.testTypes.join(", ")}`] : []),
    filters.clientType !== "Semua" ? `Klien: ${filters.clientType}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = { id: msgId.current++, role: "user", text };
      const { text: botText, table } = buildAnswer(text, filteredRevenue, filteredSpk);
      const botMsg: Message = { id: msgId.current++, role: "bot", text: botText, table };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
    },
    [filteredRevenue, filteredSpk]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col bg-white dark:bg-[#161820] shadow-2xl transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-telkom-red px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">
              🤖
            </div>
            <div>
              <p className="text-sm font-bold text-white">Asisten Analitik</p>
              <p className="text-xs text-white/70">Telkom Revenue Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:bg-white/20"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Filter context badge */}
        {filterLabel && (
          <div className="bg-red-50 dark:bg-red-950/40 px-4 py-1.5 text-xs text-red-700 dark:text-red-300 border-b border-red-100 dark:border-red-900/60">
            🔍 Filter aktif: {filterLabel}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50 dark:bg-[#0F1117]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-telkom-red text-white rounded-tr-sm"
                    : "bg-gray-100 dark:bg-[#1E212B] text-gray-800 dark:text-gray-100 rounded-tl-sm border border-transparent dark:border-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.table && (
                  <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161820]">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-[#222632]">
                        <tr>
                          {msg.table.headers.map((h) => (
                            <th
                              key={h}
                              className="px-2 py-1.5 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.table.rows.map((row, ri) => (
                          <tr key={ri} className="border-t border-gray-100 dark:border-gray-800">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-2 py-1 text-gray-700 dark:text-gray-200">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex gap-1.5 flex-wrap bg-white dark:bg-[#161820]">
          {SUGGESTED.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E212B] px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-300 hover:border-telkom-red dark:hover:border-telkom-red hover:text-telkom-red dark:hover:text-telkom-red transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-white dark:bg-[#161820]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan tentang data..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151B] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-telkom-red focus:outline-none focus:ring-1 focus:ring-telkom-red"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-telkom-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-red-700 transition"
            >
              Kirim
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
