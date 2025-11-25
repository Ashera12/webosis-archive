"use client";
import React from 'react';
import { createPortal } from 'react-dom';
import { FaComments, FaTimes, FaRobot, FaTrash, FaPaperPlane, FaWindowMinimize, FaWindowMaximize, FaWindowRestore, FaGripVertical, FaPlus, FaImage, FaFileAlt } from 'react-icons/fa';
import ChatBoundary from './ChatBoundary';

export default function LiveChatWidget({ role, showFloating = true }: { role?: 'super_admin' | 'member' | 'guest', showFloating?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; content: string; image?: string }[]>([]);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [provider, setProvider] = React.useState<'auto'|'anthropic'|'gemini'|'openai'>('auto');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<{ cmd: string; desc: string; template?: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(-1);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Minimal mode toggle (default true for elegant compact design)
  const [minimal, setMinimal] = React.useState(true);
  
  // Image upload state
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string>('');
  
  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }, [input]);
  
  // Window controls (desktop only)
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [size, setSize] = React.useState({ width: 400, height: 480 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right on mount (desktop only)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 640) {
      setPosition({
        x: window.innerWidth - size.width - 24,
        y: window.innerHeight - size.height - 24,
      });
    }
  }, []);

  const mode: 'admin' | 'public' = role === 'super_admin' ? 'admin' : 'public';
  const suggestionsEnabled = process.env.NEXT_PUBLIC_CHAT_SUGGESTIONS !== '0';

  type Command = { cmd: string; desc: string; template?: string };
  const adminCommands: Command[] = React.useMemo(() => ([
    { cmd: '/help', desc: 'Daftar perintah', template: '/help' },
    { cmd: '/errors list', desc: 'Daftar error terbaru', template: '/errors list' },
    { cmd: '/analyze', desc: 'Analisa error oleh AI', template: '/analyze <error_id>' },
    { cmd: '/fix', desc: 'Terapkan perbaikan otomatis', template: '/fix <error_id>' },
    { cmd: '/generate', desc: 'Generate gambar dengan AI', template: '/generate <prompt>' },
    { cmd: '/sql', desc: 'Execute SQL query', template: '/sql SELECT * FROM posts LIMIT 5' },
    { cmd: '/query', desc: 'Query table dengan filter', template: '/query posts status=published limit=10' },
    { cmd: '/schema', desc: 'Show database schema', template: '/schema' },
    { cmd: '/stats', desc: 'Show system statistics', template: '/stats' },
    { cmd: '/confirm', desc: 'Konfirmasi aksi pending terakhir', template: '/confirm' },
    { cmd: '/cancel', desc: 'Batalkan aksi pending', template: '/cancel' },
    { cmd: '/run', desc: 'Jalankan perintah terminal', template: '/run <command>' },
    { cmd: '/config get', desc: 'Lihat konfigurasi', template: '/config get <KEY>' },
    { cmd: '/config set', desc: 'Update konfigurasi', template: '/config set <KEY>=<VALUE>' },
    { cmd: '/clear', desc: 'Hapus riwayat chat', template: '/clear' },
  ]), []);

  // Simple fuzzy scoring: returns match quality or null
  const fuzzyMatch = (pattern: string, target: string): number | null => {
    pattern = pattern.toLowerCase();
    target = target.toLowerCase();
    let ti = 0; let score = 0;
    for (let pi = 0; pi < pattern.length; pi++) {
      const pch = pattern[pi];
      let found = false;
      while (ti < target.length) {
        if (target[ti] === pch) { score += 1; ti++; found = true; break; }
        ti++;
      }
      if (!found) return null;
    }
    return score;
  };

  // Build suggestions when user types "/"
  React.useEffect(() => {
    if (!suggestionsEnabled || paletteOpen) {
      if (!paletteOpen) {
        setShowSuggestions(false);
        setFilteredSuggestions([]);
        setSelectedIndex(-1);
      }
      return;
    }
    const v = input;
    if (!v.startsWith('/')) {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
      setSelectedIndex(-1);
      return;
    }
    const base = (mode === 'admin') ? adminCommands : [];
    const lower = v.toLowerCase();
    const items = base.filter(b => b.cmd.toLowerCase().startsWith(lower)).slice(0, 8);
    // If user only typed "/", show top suggestions
    const finalItems = lower === '/' ? base.slice(0, 8) : items;
    setFilteredSuggestions(finalItems);
    setShowSuggestions(finalItems.length > 0);
    setSelectedIndex(finalItems.length ? 0 : -1);
  }, [input, mode, adminCommands, suggestionsEnabled, paletteOpen]);

  // Load persisted state from localStorage
  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('livechat_state');
    if (saved) {
      try {
        const { messages: savedMessages, sessionId: savedSessionId, open: savedOpen, provider: savedProvider } = JSON.parse(saved);
        if (savedMessages) setMessages(savedMessages);
        if (savedSessionId) setSessionId(savedSessionId);
        if (savedOpen !== undefined) setOpen(savedOpen);
        if (savedProvider) setProvider(savedProvider);
      } catch (e) {
        console.error('Failed to load chat state:', e);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes (exclude images to save space)
  React.useEffect(() => {
    try {
      // Don't save images in localStorage to prevent quota exceeded
      const messagesWithoutImages = messages.map(m => ({
        role: m.role,
        content: m.content,
        // Exclude image field
      }));
      localStorage.setItem('livechat_state', JSON.stringify({ 
        messages: messagesWithoutImages, 
        sessionId, 
        open, 
        provider 
      }));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[LiveChat] localStorage quota exceeded, clearing old state');
        localStorage.removeItem('livechat_state');
      }
    }
  }, [messages, sessionId, open, provider]);

  // Drag handlers (desktop only)
  React.useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile && isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isMobile]);

  // Resize handlers (desktop only)
  React.useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile && isResizing) {
        const newWidth = Math.max(320, e.clientX - position.x);
        const newHeight = Math.max(400, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position, isMobile]);

  // Auto scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send welcome message when chat opens for first time
  React.useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMsg = (mode === 'admin')
        ? (
          isMobile
            ? `🤖 AI Super Admin — quick tips:\n• /help • /errors list • /sql <query>`
            : `🤖 **AI Super Admin Assistant** - Full System Access\n\nSaya punya akses lengkap ke database dan sistem. Type / for command suggestions, or ask me to analyze errors and run SQL queries.`
        )
        : (
          isMobile
            ? `👋 Halo — tanya tentang OSIS, event, atau sekbid. Contoh: "Event apa"` 
            : `👋 **Halo! Selamat datang di OSIS SMK Informatika Fithrah Insani**\n\nSaya AI Assistant yang siap membantu Anda! Tanyakan tentang OSIS, event, pendaftaran, atau sekbid.`
        );

      setMessages([{ role: 'assistant', content: welcomeMsg }]);
    }
  }, [open, mode, isMobile]);

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('livechat_state');
    const welcomeMsg = mode === 'admin' 
      ? `👋 Halo Admin! Saya AI Ops Assistant.\n\nSaya bisa membantu:\n• Analisa error sistem\n• Jalankan perintah terminal\n• Kelola konfigurasi\n• Terapkan perbaikan otomatis\n\nKetik /help untuk daftar lengkap perintah.\nKetik /clear untuk hapus riwayat chat.`
      : `👋 Halo! Saya AI Assistant OSIS SMK Informatika.\n\nSaya siap membantu menjawab pertanyaan tentang:\n• Struktur organisasi OSIS\n• Kegiatan dan event\n• Pendaftaran anggota\n• Kontak dan informasi umum\n\nSilakan ajukan pertanyaan Anda!`;
    
    setTimeout(() => setMessages([{ role: 'assistant', content: welcomeMsg }]), 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    // Compress image if needed
    const compressImage = (file: File, maxSizeMB: number = 4): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            
            // Reduce dimensions if too large
            let width = img.width;
            let height = img.height;
            const maxDimension = 2048;
            
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try different quality levels to hit target size
            let quality = 0.85;
            let result = canvas.toDataURL('image/jpeg', quality);
            
            while (result.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
              quality -= 0.1;
              result = canvas.toDataURL('image/jpeg', quality);
            }
            
            resolve(result);
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const base64 = await compressImage(file);
      setUploadedImage(base64);
      setUploadedFileName(file.name);
    } catch (error) {
      console.error('Compression error:', error);
      alert('Gagal memproses gambar.');
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const send = async () => {
    if (!input.trim() && !uploadedImage) return;
    const content = input.trim();
    
    // Handle /clear command
    if (content === '/clear') {
      setInput('');
      clearChat();
      return;
    }
    
    const userMessage = uploadedImage 
      ? `${content || 'Lihat gambar ini'}`
      : content;
    
    setInput('');
    const currentImage = uploadedImage;
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      image: currentImage || undefined
    }]);
    removeUploadedImage();
    setLoading(true);
    
    try {
      // If there's an image, use vision API first
      if (currentImage) {
        const visionRes = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: currentImage,
            question: content || 'Analisis gambar ini dan kenali jika ada wajah orang yang mirip dengan anggota OSIS',
            provider,
          })
        });

        const visionData = await visionRes.json();
        
        if (visionRes.ok) {
          setMessages(prev => [...prev, { role: 'assistant', content: visionData.result }]);
          setLoading(false);
          return;
        } else {
          // Fallback to regular chat with image description
          console.error('[Vision Error]:', visionData.error);
        }
      }

      // Regular chat without image or vision fallback
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content, image: m.image })), { 
            role: 'user', 
            content: userMessage,
            image: currentImage
          }],
          sessionId,
          mode,
          provider,
        })
      });

      const text = await res.text();
      if (text.trim().startsWith('<')) {
        console.error('[LiveChat] HTML response instead of JSON:', text.substring(0, 200));
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Server error - received HTML response instead of JSON' }]);
        setLoading(false);
        return;
      }

      const json = JSON.parse(text);
      if (res.ok) {
        if (json.sessionId) setSessionId(json.sessionId);
        setMessages(prev => [...prev, { role: 'assistant', content: json.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${json.error}: ${json.details || ''}` }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Network error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const pickSuggestion = (index: number) => {
    if (index < 0 || index >= filteredSuggestions.length) return;
    const s = filteredSuggestions[index];
    const appendSpace = s.cmd.endsWith(' ') ? '' : ' ';
    setInput(`${s.cmd}${appendSpace}`);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const openPalette = () => {
    if (!suggestionsEnabled) return;
    setPaletteOpen(true);
    setShowSuggestions(false);
    setInput(prev => prev || '/');
    setSelectedIndex(0);
  };

  const closePalette = () => {
    setPaletteOpen(false);
    setSelectedIndex(-1);
  };

  const paletteCommands = React.useMemo(() => {
    if (!paletteOpen) return [] as Command[];
    const base = (mode === 'admin') ? adminCommands : [];
    const query = input.startsWith('/') ? input.slice(1).trim() : input.trim();
    if (!query) return base;
    const ranked: { c: Command; score: number }[] = [];
    for (const c of base) {
      const score = fuzzyMatch(query, c.cmd.replace('/', ''));
      if (score !== null) ranked.push({ c, score });
    }
    ranked.sort((a,b)=> b.score - a.score || a.c.cmd.localeCompare(b.c.cmd));
    return ranked.map(r=> r.c).slice(0, 20);
  }, [paletteOpen, input, mode, adminCommands]);

  const handleCommandSelect = (command: Command) => {
    const tpl = command.template || command.cmd;
    setInput(tpl + (tpl.endsWith(' ') ? '' : (tpl.includes('<') ? ' ' : '')));
    setPaletteOpen(false);
    setShowSuggestions(false);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const idx = tpl.indexOf('<');
        if (idx >= 0) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(idx, tpl.length);
        } else {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(tpl.length, tpl.length);
        }
      }
    });
  };

  // Listen to global open/close events
  React.useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener('open-live-chat', openHandler as EventListener);
    window.addEventListener('close-live-chat', closeHandler as EventListener);
    return () => {
      window.removeEventListener('open-live-chat', openHandler as EventListener);
      window.removeEventListener('close-live-chat', closeHandler as EventListener);
    };
  }, []);

  // Detect mobile viewport to render bottom-sheet style chat
  React.useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const content = (
    <>
      {showFloating && !open && (
        <button
          onClick={() => setOpen(true)}
          style={{ 
            position: 'fixed', 
            bottom: isMobile ? '1rem' : '1.25rem', 
            right: isMobile ? '1rem' : '1.25rem', 
            zIndex: 2147483647 
          }}
          className={`flex items-center justify-center ${isMobile ? 'w-12 h-12' : 'w-12 h-12'} rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-lg shadow-black/10 border border-slate-300/60 dark:border-slate-700/60 backdrop-blur-sm hover:shadow-xl hover:bg-white dark:hover:bg-slate-700 transition duration-150`}
          aria-label="Open AI Chat"
        >
          <FaComments className="text-slate-600 dark:text-slate-200" size={isMobile ? 18 : 18} />
        </button>
      )}

      {open && (
        <div 
          ref={dragRef}
          style={{ 
            position: 'fixed',
            ...(isMobile ? {
              bottom: 0,
              left: '0.5rem',
              right: '0.5rem',
              width: 'calc(100% - 1rem)',
              height: '60vh',
              borderRadius: '12px 12px 0 0',
              margin: '0 auto',
            } : isMaximized ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              borderRadius: 0,
            } : {
              top: position.y,
              left: position.x,
              width: `${size.width}px`,
              height: isMinimized ? 'auto' : `${size.height}px`,
              borderRadius: '16px',
            }),
            zIndex: 2147483647,
          }}
          className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/60 dark:border-slate-700 flex flex-col overflow-hidden ${isMobile ? 'rounded-t-xl' : isMaximized ? '' : 'rounded-2xl'} ${!isMobile && !isDragging ? 'transition-all duration-200' : ''}`}
        >
          <div 
            className={`flex items-center justify-between px-4 ${isMobile ? 'py-2 min-h-[52px]' : 'py-3 min-h-[60px]'} border-b border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex-shrink-0 ${!isMobile && !isMaximized ? 'cursor-move select-none' : ''}`}
            onMouseDown={(e) => {
              if (!isMobile && !isMaximized && e.button === 0) {
                const target = e.target as HTMLElement;
                // Only drag if clicking on header background (not buttons or selects)
                if (target === e.currentTarget || target.closest('.pointer-events-none')) {
                  setIsDragging(true);
                  setDragStart({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                  });
                }
              }
            }}
          > 
            <div className="flex items-center gap-3 pointer-events-none min-w-0 flex-shrink">
              <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5 flex-shrink-0 border border-slate-200/70 dark:border-slate-700/70">
                <FaRobot className="text-slate-600 dark:text-slate-300" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{mode === 'admin' ? 'AI Admin' : 'AI Assistant'}</div>
                {!isMobile && !isMinimized && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{minimal ? 'Minimal Mode' : (mode === 'admin' ? 'Full Access' : 'Public Info')}</div>}
              </div>
            </div>
            <div className="flex items-center gap-1 pointer-events-auto flex-shrink-0">{!isMobile && (
                <>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition p-1.5 rounded-md"
                    aria-label="Minimize"
                    title="Minimize"
                  ><FaWindowMinimize size={11} /></button>
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition p-1.5 rounded-md"
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                    title={isMaximized ? "Restore" : "Maximize"}
                  >{isMaximized ? <FaWindowRestore size={12} /> : <FaWindowMaximize size={12} />}</button>
                </>
              )}
              <button
                onClick={() => setMinimal(!minimal)}
                className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition p-1.5 rounded-md"
                aria-label="Toggle Minimal Mode"
                title="Toggle Minimal Mode"
              >{minimal ? <FaWindowRestore size={12} /> : <FaWindowMinimize size={12} />}</button>
              <button
                onClick={clearChat}
                className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition p-1.5 rounded-md"
                aria-label="Clear Chat"
                title="Clear Chat (/clear)"
              ><FaTrash size={12} /></button>
              {!isMinimized && (
                <div className="hidden md:flex items-center gap-1">
                  <select
                    value={provider}
                    onChange={e=> setProvider(e.target.value as any)}
                    className="text-[10px] px-1.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
                    title="AI Provider"
                  >
                    <option value="auto">Auto</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 transition p-1.5 rounded-md"
                aria-label="Close Chat"
              ><FaTimes size={14} /></button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className={`flex-1 ${isMobile ? 'px-3 py-3' : 'p-4'} space-y-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent`}>
            {messages.map((m, i) => (
              <div key={i} className="space-y-2">
                <div
                  className={`whitespace-pre-wrap break-words rounded-xl overflow-wrap-anywhere shadow-sm ${m.role === 'user' ? 'ml-14 md:ml-14' : 'mr-14 md:mr-14'} ${m.role === 'user' ? (minimal ? 'bg-indigo-100 dark:bg-indigo-800/40 text-slate-900 dark:text-slate-100' : 'bg-amber-100 dark:bg-amber-900/30 text-slate-900 dark:text-slate-100') : (minimal ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'bg-white/70 dark:bg-slate-700/70 text-slate-800 dark:text-slate-100')} ${isMobile ? 'text-[13px] px-3 py-2' : 'text-sm px-4 py-2'} border border-slate-200/60 dark:border-slate-700/60`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {m.image && (
                    <div className="mb-2">
                      <img 
                        src={m.image} 
                        alt="Uploaded" 
                        className="max-w-full max-h-64 rounded-lg border border-slate-300/50 dark:border-slate-600/50"
                      />
                    </div>
                  )}
                  {/* Render generated images from /generate command */}
                  {m.role === 'assistant' && m.content.includes('![Generated Image]') && (() => {
                    const imageUrlMatch = m.content.match(/!\[Generated Image\]\((https?:\/\/[^\)]+)\)/);
                    if (imageUrlMatch) {
                      const imageUrl = imageUrlMatch[1];
                      return (
                        <div className="mb-3">
                          <img 
                            src={imageUrl} 
                            alt="AI Generated" 
                            className="max-w-full rounded-lg border border-indigo-300/50 dark:border-indigo-600/50 shadow-md"
                          />
                          <div className="mt-2 flex gap-2">
                            <a 
                              href={imageUrl} 
                              download="generated-image.png"
                              className="text-xs px-3 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-900 dark:text-indigo-100 rounded-md transition"
                            >
                              📥 Download
                            </a>
                            <a 
                              href={imageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-md transition"
                            >
                              🔗 Open
                            </a>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {/* Render text content (strip markdown image syntax for cleaner display) */}
                  {m.content.replace(/!\[Generated Image\]\(https?:\/\/[^\)]+\)/g, '').trim()}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500">AI mengetik...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-3 border-t border-slate-200/70 dark:border-slate-700 flex flex-col gap-2 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex-shrink-0`}>
            {/* Image Preview */}
            {uploadedImage && (
              <div className="relative inline-block max-w-xs">
                <img 
                  src={uploadedImage} 
                  alt={uploadedFileName} 
                  className="max-h-32 rounded-lg border border-slate-300 dark:border-slate-600"
                />
                <button
                  onClick={removeUploadedImage}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-rose-600 shadow-md transition"
                  aria-label="Remove image"
                >
                  <FaTimes size={12} />
                </button>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate max-w-xs">
                  {uploadedFileName}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className={`flex items-end gap-2 ${isMobile ? 'space-x-2' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition shadow-sm flex-shrink-0"
                title="Upload gambar/dokumen"
                aria-label="Upload file"
              >
                <FaPlus size={14} />
              </button>
            <div className="relative flex-1 min-w-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e)=>{ setInput(e.target.value); if (paletteOpen && e.target.value.trim() === '') { setInput('/'); } }}
                onKeyDown={(e)=>{
                  if (e.key === 'Escape' && paletteOpen) { e.preventDefault(); closePalette(); return; }
                  if ((e.key === '/' && input === '') || (e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); openPalette(); return; }
                  if (paletteOpen) {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i=> Math.min((i<0?0:i)+1, paletteCommands.length-1)); return; }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i=> Math.max((i<=0?0:i-1), 0)); return; }
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (selectedIndex >=0 && selectedIndex < paletteCommands.length) { handleCommandSelect(paletteCommands[selectedIndex]); } else { closePalette(); } return; }
                    if (e.key === 'Tab') { e.preventDefault(); if (selectedIndex >=0 && selectedIndex < paletteCommands.length) { handleCommandSelect(paletteCommands[selectedIndex]); } return; }
                    return;
                  }
                  if (suggestionsEnabled && showSuggestions) {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i)=> Math.min((i<0?0:i)+1, filteredSuggestions.length-1)); return; }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i)=> Math.max((i<=0?0:i-1), 0)); return; }
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (selectedIndex >= 0) { pickSuggestion(selectedIndex); } else { send(); } return; }
                    if (e.key === 'Escape') { setShowSuggestions(false); setSelectedIndex(-1); return; }
                  } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                    return;
                  }
                }}
                rows={1}
                placeholder={mode === 'admin' ? 'Ketik pesan atau / untuk perintah…' : 'Tanya info OSIS...'}
                className={`flex-1 min-w-0 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white ${isMobile ? 'text-base' : 'text-sm'} focus:outline-none focus:ring-2 focus:ring-indigo-400/50 caret-indigo-500 placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none overflow-y-auto hide-scrollbar`}
                style={{ height: '40px', maxHeight: '128px' }}
              />

              {paletteOpen && suggestionsEnabled && (
                <div className="absolute bottom-full mb-2 left-0 w-full max-h-72 overflow-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-xl z-[2147483647] backdrop-blur-sm">
                  <div className="sticky top-0 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>⚡ Perintah ({paletteCommands.length})</span>
                    <button onClick={closePalette} className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs">Esc</button>
                  </div>
                  {paletteCommands.map((c, idx) => (
                    <button
                      key={c.cmd+idx}
                      type="button"
                      onClick={()=>handleCommandSelect(c)}
                      className={`w-full text-left px-3 py-2 text-sm flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 ${idx===selectedIndex? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">{c.template || c.cmd}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{c.desc}</span>
                    </button>
                  ))}
                  {paletteCommands.length === 0 && (
                    <div className="px-3 py-4 text-xs text-slate-500">Tidak ada perintah cocok.</div>
                  )}
                  <div className="px-3 py-2 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                    <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">↵</kbd> pilih</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Esc</kbd> tutup</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Ctrl+K</kbd> buka</span>
                  </div>
                </div>
              )}

              {suggestionsEnabled && showSuggestions && !paletteOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-full max-h-56 overflow-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-xl z-[2147483647]">
                  {filteredSuggestions.map((s, idx) => (
                    <button
                      key={s.cmd+idx}
                      type="button"
                      onClick={()=>pickSuggestion(idx)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-start gap-2 ${idx===selectedIndex? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                    >
                      <span className="font-mono text-slate-700 dark:text-slate-300">{s.cmd}</span>
                      <span className="text-slate-500 dark:text-slate-400">{s.desc}</span>
                    </button>
                  ))}
                  {filteredSuggestions.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500">Tidak ada perintah cocok.</div>
                  )}
                </div>
              )}
            </div>

            {mode === 'admin' && suggestionsEnabled && !isMobile && (
              <button
                onClick={openPalette}
                className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-sm transition flex items-center gap-1"
                title="Buka Command Palette (Ctrl+K)"
              >
                <span className="text-xs">⚡</span>
                <span className="hidden sm:inline">Perintah</span>
              </button>
            )}

            <button
              onClick={send}
              disabled={loading || (!input.trim() && !uploadedImage)}
              className={`${isMobile ? 'w-10 h-10 p-0.5 rounded-lg' : 'px-4 py-2 rounded-md'} bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-medium disabled:opacity-60 shadow-sm transition flex items-center justify-center flex-none`}
            >
              {isMobile ? <FaPaperPlane size={16} /> : 'Kirim'}
            </button>
            {isMobile && (
              <select
                value={provider}
                onChange={e=> setProvider(e.target.value as any)}
                className="text-[10px] px-1 py-1 rounded-md bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
                title="Provider AI"
              >
                <option value="auto">Auto</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            )}
            </div>
          </div>
            </>
          )}
          
          {/* Resize handle (desktop only, bottom-right corner) */}
          {!isMobile && !isMaximized && !isMinimized && (
            <div
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-slate-200/40 hover:bg-slate-300/60 dark:bg-slate-700/40 dark:hover:bg-slate-600/60 transition"
              style={{ borderBottomRightRadius: '16px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            >
              <FaGripVertical className="absolute bottom-1 right-1 text-slate-500/60 dark:text-slate-400/60" size={10} />
            </div>
          )}
        </div>
      )}
    </>
  );

  if (!mounted) return null;
  return createPortal(<ChatBoundary>{content}</ChatBoundary>, document.body);
}
