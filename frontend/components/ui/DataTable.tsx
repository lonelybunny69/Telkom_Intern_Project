"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T, idx: number) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, idx: number) => string | number;
  pageSize?: number;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  emptyText?: string;
  className?: string;
  compact?: boolean;
}

type SortDir = "asc" | "desc";

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  pageSize = 50,
  searchPlaceholder = "Cari...",
  searchFields = [],
  emptyText = "Tidak ada data",
  className = "",
  compact = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchFields.some((f) => String(row[f] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, searchFields]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "id")
        : String(bv).localeCompare(String(av), "id");
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const cellPad = compact ? "px-3 py-1.5" : "px-4 py-2.5";
  const headPad = compact ? "px-3 py-2" : "px-4 py-3";

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Search */}
      {searchFields.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder}
            className="w-full max-w-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151B] px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-telkom-red focus:outline-none focus:ring-1 focus:ring-telkom-red"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {sorted.length.toLocaleString("id-ID")} baris
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161820]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[#1A1D26] border-b border-gray-200 dark:border-gray-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`${headPad} text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 ${
                    col.sortable ? "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800/80" : ""
                  } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                  style={col.width ? { width: col.width } : {}}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === String(col.key) && (
                      <span>{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr
                  key={rowKey(row, idx)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`${cellPad} text-gray-700 dark:text-gray-200 ${
                        col.align === "right"
                          ? "text-right tabular-nums"
                          : col.align === "center"
                          ? "text-center"
                          : ""
                      }`}
                    >
                      {col.render
                        ? col.render(row, page * pageSize + idx)
                        : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            Halaman {page + 1} dari {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1D26] px-2 py-1 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1D26] px-2 py-1 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              ‹
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1D26] px-2 py-1 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page === totalPages - 1}
              className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1D26] px-2 py-1 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
