"use client";

import { useRef, type ChangeEvent } from "react";
import { RefreshCw, Upload } from "lucide-react";
interface UploadControlProps {
  isUploading: boolean;
  status: string | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadControl({ isUploading, status, onUpload }: UploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="flex flex-wrap items-center gap-3">
    <span aria-live="polite" className={`text-xs ${status?.toLocaleLowerCase("id-ID").includes("gagal") ? "text-red-500" : "text-emerald-600"}`}>{status}</span>
    <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="workspace-brand-button inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">
      {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}{isUploading ? "Mengunggah..." : "Upload file Excel"}
    </button>
    <input ref={inputRef} type="file" accept=".xlsx,.xlsm" multiple onChange={onUpload} disabled={isUploading} className="sr-only" aria-label="Pilih satu atau beberapa file Excel" />
  </div>;
}
