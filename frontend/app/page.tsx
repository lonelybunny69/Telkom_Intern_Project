"use client";

import { useState } from "react";
import Image from "next/image";
import GlobalFilters from "../components/dashboard/GlobalFilters";
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
  { id: 0, label: "Executive Summary", icon: "📊" },
  { id: 1, label: "Operasional", icon: "🏭" },
  { id: 2, label: "Klien", icon: "🏢" },
  { id: 3, label: "Produk & Layanan", icon: "📦" },
  { id: 4, label: "Data Explorer", icon: "🔍" },
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
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/data/telkomsel_logo.png"
                alt="Telkom logo"
                width={120}
                height={40}
                style={{ objectFit: "contain", height: 36, width: "auto" }}
                priority
              />
            </div>

            {/* Title */}
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-gray-900 tracking-tight">
                Revenue Dashboard
              </span>
              <span className="text-xs text-gray-500">
                Laboratorium Telkom · 2020–2025
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* AI Assistant button (desktop) */}
            <button
              onClick={() => setChatOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95"
              style={{ background: "#E31E24" }}
            >
              <span>🤖</span>
              <span>AI Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Global Filters ── */}
      <div className="bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <GlobalFilters />
        </div>
      </div>

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
                    "flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none",
                    isActive
                      ? "border-telkom-red text-telkom-red"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300",
                  ].join(" ")}
                  style={isActive ? { borderColor: "#E31E24", color: "#E31E24" } : {}}
                >
                  <span>{tab.icon}</span>
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
