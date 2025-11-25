"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'Anda adalah asisten AI untuk situs OSIS.' },
  ]);
  const [sessionId, setSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'auto'|'anthropic'|'gemini'|'openai'>('auto');
  const endRef = useRef<HTMLDivElement>(null);

  // Load and save session chat to sessionStorage so it persists across navigation
  useEffect(() => {
    const saved = sessionStorage.getItem('ai_chat_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch {}
    }
    const savedProvider = sessionStorage.getItem('ai_chat_provider');
    if (savedProvider && ['auto','anthropic','gemini','openai'].includes(savedProvider)) {
      setProvider(savedProvider as any);
    }
    // Ensure a stable session id per browser session (for admin pending actions)
    let sid = sessionStorage.getItem('ai_chat_session_id');
    if (!sid) {
      sid = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('ai_chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('ai_chat_session', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('ai_chat_provider', provider);
  }, [provider]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = useCallback(async () => {
    if (!canSend) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], sessionId, provider }),
      });
      const json = await safeJson(res, { url: '/api/ai/chat', method: 'POST' }).catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal memproses permintaan AI');
      }
      const reply = (json?.reply as string) || '';
      const aiMsg: ChatMessage = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan pada AI');
    } finally {
      setLoading(false);
    }
  }, [canSend, input, messages]);

  return (
    <div className="fixed z-50 bottom-5 right-5">
      {/* Toggle button */}
      <button
        aria-label="Buka chat AI"
        onClick={() => setOpen(v => !v)}
        className="rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:scale-105 transition transform p-3"
      >
        {/* Chat icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12c0 4.418-4.03 8-9 8-1.03 0-2.017-.148-2.93-.422L4 21l1.595-3.19C4.605 16.523 4 14.827 4 13c0-4.418 4.03-8 9-8s8 3.582 8 7z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-2 w-[24rem] max-w-[92vw] h-[28rem] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Asisten AI OSIS</div>
            <button
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              onClick={() => setOpen(false)}
            >Tutup</button>
          </div>

          {/* Provider selector */}
          <div className="mb-2 flex items-center gap-2">
            <label className="text-[10px] text-neutral-500 dark:text-neutral-400">Provider:</label>
            <select
              value={provider}
              onChange={e=> setProvider(e.target.value as any)}
              className="text-xs px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Pilih penyedia AI (Auto prioritaskan Anthropic)"
            >
              <option value="auto">Auto (Anthropic)</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.filter(m => m.role !== 'system').length === 0 && (
              <div className="text-xs text-neutral-500">
                Tanyakan apapun seputar OSIS: kegiatan, anggota, sekbid, proker, pengumuman, dan konten halaman.
              </div>
            )}
            {messages.filter(m => m.role !== 'system').map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ' +
                  (m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100')
                }>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-lg px-3 py-2 text-sm">
                  Sedang mengetik…
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
            )}
            <div ref={endRef} />
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pertanyaan..."
                className="flex-1 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="text-sm rounded-md bg-blue-600 text-white px-3 py-2 disabled:opacity-50"
              >Kirim</button>
            </form>
            <div className="mt-1 text-[10px] text-neutral-400">
              Jawaban bisa mengutip data publik dari: posts, events, announcements, members, sekbid, program_kerja, gallery, page_content.
            </div>
            {error && (
              <div className="mt-1 text-[10px] text-red-600 dark:text-red-400">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
