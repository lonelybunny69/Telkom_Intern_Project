"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDashboard } from "../../lib/dashboard-context";
import { processChatbotQuery, type ChatMessage } from "../../lib/chatbot-engine";

const SUGGESTED_QUESTIONS = [
  "Berapa total revenue 2024?",
  "Revenue 2025 berapa & turun berapa persen?",
  "Pertumbuhan revenue 2023 ke 2024?",
  "Rincian revenue per lab 2024",
  "Top 5 klien 2022",
  "SPK per jenis pengujian 2024",
  "Bulan apa revenue tertinggi di 2024?",
  "Revenue itu maksudnya apa?",
  "Apa bedanya revenue dengan nilai SPK?",
  "Kenapa angka Transmisi 2025 sebesar itu?",
];

export default function ChatbotDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { filteredRevenue, filteredSpk, filters } = useDashboard();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "bot",
      text: "Halo! Saya Asisten Data Intelijen resmi Dashboard **SPK & Revenue 2020–2025**.\n\nSemua kalkulasi dihitung langsung dari basis data transaksi riil. Tanyakan metrik revenue, volume SPK, peringkat klien, analisis lab, atau penjelasan bisnis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

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
      if (!text.trim() || isThinking) return;
      const userText = text.trim();
      const userMsg: ChatMessage = { id: msgId.current++, role: "user", text: userText };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsThinking(true);

      // Simulate fast natural AI response
      setTimeout(() => {
        const { text: botText, table, citation } = processChatbotQuery(
          userText,
          filteredRevenue,
          filteredSpk,
          {
            tab: "Dashboard",
            tahun_terpilih: filters.years.length === 1 ? filters.years[0] : 2025,
            filter: filters,
          }
        );
        const botMsg: ChatMessage = {
          id: msgId.current++,
          role: "bot",
          text: botText,
          table,
          citation,
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsThinking(false);
      }, 280);
    },
    [filteredRevenue, filteredSpk, filters, isThinking]
  );

  const clearChat = () => {
    setMessages([
      {
        id: msgId.current++,
        role: "bot",
        text: "Riwayat percakapan telah dibersihkan. Silakan ajukan pertanyaan baru mengenai data SPK & Revenue 2020–2025.",
      },
    ]);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[430px] flex-col bg-white dark:bg-[#161820] shadow-2xl transition-all duration-200 border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between bg-telkom-red px-4 py-3 text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-xl shadow-inner">
              🤖
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">AI Data Assistant</p>
              <p className="text-xs text-white/80">SPK & Revenue Intelligence 2020–2025</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Bersihkan riwayat percakapan"
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 transition-colors text-xs flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              title="Tutup chat"
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Context Awareness Badge */}
        {filterLabel && (
          <div className="bg-red-50 dark:bg-red-950/40 px-4 py-1.5 text-xs text-red-700 dark:text-red-300 border-b border-red-100 dark:border-red-900/60 flex items-center gap-1.5">
            <span>🔍</span>
            <span className="font-semibold">Filter Aktif:</span>
            <span className="truncate">{filterLabel}</span>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 bg-gray-50/60 dark:bg-[#0F1117]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs ${
                  msg.role === "user"
                    ? "bg-telkom-red text-white rounded-tr-xs"
                    : "bg-white dark:bg-[#1E212B] text-gray-800 dark:text-gray-100 rounded-tl-xs border border-gray-200/70 dark:border-gray-800"
                }`}
              >
                {/* Text with bold formatting support */}
                <div className="whitespace-pre-wrap">
                  {msg.text.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <strong key={idx} className="font-bold text-gray-900 dark:text-white">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return part;
                  })}
                </div>

                {/* Structured Table Result */}
                {msg.table && (
                  <div className="mt-2.5 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161820] shadow-2xs">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100/80 dark:bg-[#252936]">
                        <tr>
                          {msg.table.headers.map((h) => (
                            <th
                              key={h}
                              className="px-2.5 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {msg.table.rows.map((row, ri) => (
                          <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className={`px-2.5 py-1.5 text-gray-700 dark:text-gray-200 ${
                                  ci > 0 && !isNaN(Number(cell.replace(/[^0-9.-]+/g, "")))
                                    ? "tabular-nums"
                                    : ""
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Data Notes / Citation Note */}
                {msg.citation && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-1">
                    <span className="text-telkom-red font-semibold">ℹ️ Catatan:</span>
                    <span className="italic">{msg.citation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-white dark:bg-[#1E212B] border border-gray-200/70 dark:border-gray-800 flex items-center gap-1.5 shadow-xs">
                <span className="text-xs text-gray-400">Menghitung data</span>
                <span className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-telkom-red animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-telkom-red animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-telkom-red animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Questions Carousel */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-2 bg-white dark:bg-[#161820]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Pertanyaan Cepat
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_QUESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="whitespace-nowrap rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E212B] px-3 py-1 text-xs text-gray-700 dark:text-gray-300 hover:border-telkom-red dark:hover:border-telkom-red hover:text-telkom-red dark:hover:text-telkom-red transition-colors shrink-0 shadow-2xs"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* User Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-3.5 py-3 bg-white dark:bg-[#161820]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan angka revenue, lab, SPK, klien..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#13151B] px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-telkom-red focus:bg-white dark:focus:bg-[#13151B] focus:outline-none focus:ring-1 focus:ring-telkom-red transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="flex h-10 items-center justify-center rounded-xl bg-telkom-red px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
