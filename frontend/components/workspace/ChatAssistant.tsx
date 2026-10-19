"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, LoaderCircle, Send, X } from "lucide-react";
import { sendChatPrompt } from "../../lib/workspace-api";
import { workspaceThemeClasses } from "../../lib/workspace-theme";
import type { ChatMessage, WorkspaceTheme } from "../../lib/workspace-types";

interface ChatAssistantProps {
  theme: WorkspaceTheme;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const greeting: ChatMessage = {
  id: "greeting",
  sender: "bot",
  text: "Halo! Saya Telkom Data AI. Ada yang bisa saya bantu analisa dari database perusahaan?",
};

export default function ChatAssistant({ theme, isOpen, onOpenChange }: ChatAssistantProps) {
  const styles = workspaceThemeClasses[theme];
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [isSending, setIsSending] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: prompt,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const reply = await sendChatPrompt(prompt);
      setMessages((current) => [...current, { id: `bot-${Date.now()}`, sender: "bot", text: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `bot-error-${Date.now()}`,
          sender: "bot",
          text: "Maaf, terjadi kesalahan koneksi ke server. Silakan coba lagi.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby="chat-title"
        className={`workspace-glass flex h-[min(75dvh,560px)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border shadow-xl ${styles.border} ${styles.panel}`}
      >
        <header className="workspace-brand-gradient flex items-center justify-between px-4 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="chat-title" className="text-sm font-bold">Telkom Data AI</h2>
              <p className="text-[11px] text-white/80">Workspace assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Tutup chat assistant"
            className="grid h-11 w-11 place-items-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div
          ref={transcriptRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          className="flex-1 space-y-3 overflow-y-auto p-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.sender === "user"
                    ? "rounded-br-md workspace-brand-button"
                    : `rounded-bl-md ${styles.botBubble}`
                }`}
              >
                {message.text}
              </p>
            </div>
          ))}
          {isSending && (
            <div className={`flex items-center gap-2 text-xs ${styles.muted}`} role="status">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Menganalisis data...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={`flex items-center gap-2 border-t p-3 ${styles.composer}`}>
          <label htmlFor="chat-prompt" className="sr-only">Tanyakan sesuatu tentang data</label>
          <input
            id="chat-prompt"
            type="text"
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="Tanyakan sesuatu tentang data..."
            autoComplete="off"
            disabled={isSending}
            className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 disabled:opacity-60 ${styles.input}`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Kirim pesan"
            className="workspace-brand-button grid h-11 w-11 shrink-0 place-items-center rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </section>
    </div>
  );
}
