"use client";

import { useState } from "react";
import Image from "next/image";
import NavbarFilters from "../components/dashboard/NavbarFilters";
import ExecutiveSummary from "../components/dashboard/tabs/ExecutiveSummary";
import OperationalAnalytics from "../components/dashboard/tabs/OperationalAnalytics";
import ClientAnalytics from "../components/dashboard/tabs/ClientAnalytics";
import ProductAnalysis from "../components/dashboard/tabs/ProductAnalysis";
import DataExplorer from "../components/dashboard/tabs/DataExplorer";
import ChatbotDrawer from "../components/dashboard/ChatbotDrawer";

// ─────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────
const TABS = [
  { id: 0, label: "Executive Summary" },
  { id: 1, label: "Operasional" },
  { id: 2, label: "Klien" },
  { id: 3, label: "Produk & Layanan" },
  { id: 4, label: "Data Explorer" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>(0);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 min-h-[4rem] py-2 sm:py-0">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3.5 flex-shrink-0">
              <div className="flex-shrink-0">
                <Image
                  src="/data/telkomsel_logo.png"
                  alt="Telkom logo"
                  width={110}
                  height={36}
                  style={{ objectFit: "contain", height: 34, width: "auto" }}
                  priority
                />
              </div>

              <div className="flex flex-col leading-tight border-l border-gray-200 pl-3">
                <span className="text-base font-bold text-gray-900 tracking-tight">
                  Revenue Dashboard
                </span>
                <span className="text-xs text-gray-500">
                  Laboratorium Telkom · 2020–2025
                </span>
              </div>
            </div>

            {/* Right: Navbar Filters (Tahun, Lab, Klien) + AI Assistant */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
              <NavbarFilters />

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              {/* AI Assistant button */}
              <button
                onClick={() => setChatOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white shadow-xs transition hover:brightness-110 active:scale-95"
                style={{ background: "#E31E24" }}
              >
                <span>🤖</span>
                <span>AI Assistant</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Tab navigasi">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none",
                    isActive
                      ? "border-telkom-red text-telkom-red"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300",
                  ].join(" ")}
                  style={isActive ? { borderColor: "#E31E24", color: "#E31E24" } : {}}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 0 && <ExecutiveSummary />}
        {activeTab === 1 && <OperationalAnalytics />}
        {activeTab === 2 && <ClientAnalytics />}
        {activeTab === 3 && <ProductAnalysis />}
        {activeTab === 4 && <DataExplorer />}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
        Telkom Revenue Dashboard © 2025 · Data 2020–2025 · Laboratorium Telkom
      </footer>

      {/* ── Floating Chat FAB (mobile + desktop) ── */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        aria-label="Buka AI Assistant"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full text-white text-2xl shadow-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-300"
        style={{ background: "#E31E24" }}
      >
        {chatOpen ? "✕" : "🤖"}
      </button>

      {/* ── Chatbot Drawer ── */}
      <ChatbotDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
