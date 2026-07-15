import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Code2, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  X,
  Sparkles,
  Palette,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  AlertCircle,
  Trash2,
  ArrowRight,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DesignEntry {
  id: string;
  prompt: string;
  code: string;
  timestamp: string;
}

interface DesignStudioProps {
  model: string;
  onToggleSidebar?: () => void;
}

const DESIGN_SUGGESTIONS = [
  "Login sahifasi — gradient fon, glassmorphism karta va chiroyli tugma bilan",
  "Dashboard — statistik kartalar, foydalanuvchilar jadvali va navigatsiya",
  "Narxlar sahifasi — 3 xil tarif rejasi, mashhur tarifga yorqin fon va effekt",
  "Portfolio sahifasi — hero qism, loyihalar galereyasi va bog'lanish shakli",
];

export default function DesignStudio({ model, onToggleSidebar }: DesignStudioProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [streamText, setStreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<DesignEntry[]>([]);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  // Load design history and last code on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('design_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing design history:', e);
      }
    }

    const savedLastCode = localStorage.getItem('last_generated_design');
    if (savedLastCode) {
      setGeneratedCode(savedLastCode);
      setStreamText(savedLastCode);
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem('design_history', JSON.stringify(history));
  }, [history]);

  // Save generatedCode on change
  useEffect(() => {
    if (generatedCode) {
      localStorage.setItem('last_generated_design', generatedCode);
    } else {
      localStorage.removeItem('last_generated_design');
    }
  }, [generatedCode]);

  // Agar live rejimda kod kelayotgan bo'lsa, uni real-time ko'rsatish
  const activeCodeDisplay = generatedCode || streamText;

  // Iframe ni har gal generatedCode o'zgarganda tozalab yangilash
  useEffect(() => {
    if (viewMode === 'preview' && iframeRef.current && generatedCode) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(generatedCode);
        doc.close();
      }
    }
  }, [generatedCode, viewMode]);

  // Stream qabul qilinayotgan vaqtda vaqtincha iframe'ni yangilab turish (jonli ko'rinish)
  useEffect(() => {
    if (viewMode === 'preview' && iframeRef.current && streamText && !generatedCode) {
      // Markdown qobiqlarini kesib tashlashga urinish
      let cleanHtml = streamText;
      const htmlMatch = streamText.match(/```html\s*([\s\S]*)/);
      if (htmlMatch) {
        cleanHtml = htmlMatch[1];
      }
      
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(cleanHtml);
        doc.close();
      }
    }
  }, [streamText, generatedCode, viewMode]);

  const generateDesign = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;
    
    setLoading(true);
    setError(null);
    setGeneratedCode('');
    setStreamText('');
    setViewMode('preview');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: textToSend }],
          persona: 'designer',
          model,
          stream: true // Stream rejim
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server ulanishida xatolik yuz berdi.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('Oqimni (stream) o\'qib bo\'lmadi.');

      let accumulatedResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedResponse += parsed.text;
                setStreamText(accumulatedResponse);
              }
            } catch (e) {
              // chunk parsing error ignored
            }
          }
        }
      }

      // Stream tugadi, Markdown html kodni ajratib olamiz
      let finalHtml = accumulatedResponse;
      const htmlMatch = finalHtml.match(/```html\s*([\s\S]*?)```/);
      if (htmlMatch) {
        finalHtml = htmlMatch[1].trim();
      } else {
        const codeMatch = finalHtml.match(/```\s*([\s\S]*?)```/);
        if (codeMatch) {
          finalHtml = codeMatch[1].trim();
        }
      }

      setGeneratedCode(finalHtml);
      
      const newEntry: DesignEntry = {
        id: 'design-' + Date.now(),
        prompt: textToSend,
        code: finalHtml,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => [newEntry, ...prev]);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(activeCodeDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([activeCodeDisplay], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (entry: DesignEntry) => {
    setGeneratedCode(entry.code);
    setStreamText(entry.code);
    setViewMode('preview');
  };

  const clearHistory = () => {
    setHistory([]);
    setGeneratedCode('');
    setStreamText('');
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#F8FAFC] relative">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm shrink-0">
            <Palette className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs md:text-sm font-bold text-slate-800 truncate">Dizayn Studio</h2>
            <p className="text-[9px] md:text-[10px] text-slate-400 truncate">Real-time UI dizayner</p>
          </div>
        </div>

        {/* Viewport & View Toggle */}
        {activeCodeDisplay && (
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Viewport Switcher (Faqat planshet va desktopda ko'rinadi) */}
            <div className="hidden md:flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewport === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                title="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewport === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                title="Tablet"
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewport === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                title="Mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Preview / Code Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 md:p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md text-[11px] md:text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye className="h-3 w-3 md:h-3.5 md:w-3.5" />
                Ko'rish
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md text-[11px] md:text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'code' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Code2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                Kod
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={copyCode}
              className="flex items-center justify-center p-1.5 md:px-3 md:py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              title="Kodni nusxalash"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 md:h-3.5 md:w-3.5" />}
              <span className="hidden lg:inline ml-1">{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
            </button>
            <button
              onClick={downloadCode}
              className="flex items-center justify-center p-1.5 md:px-3 md:py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              title="HTML yuklash"
            >
              <Download className="h-4 w-4 md:h-3.5 md:w-3.5" />
              <span className="hidden lg:inline ml-1">Yuklash</span>
            </button>
          </div>
        )}
      </header>

      {/* Error notification */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 md:px-6 py-3 text-xs md:text-sm flex items-center gap-2 shrink-0 font-medium"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="truncate">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-0.5 hover:bg-rose-100 rounded cursor-pointer">
              <X className="h-4 w-4 text-rose-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!activeCodeDisplay && !loading ? (
          /* Welcome View */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8 md:py-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-2xl w-full"
            >
              <div className="inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-xl shadow-violet-500/20 mb-6 md:mb-8">
                <Palette className="h-8 w-8 md:h-10 md:w-10" />
              </div>

              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-800 mb-2 md:mb-3">
                Dizayn Studio
              </h1>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto mb-8 md:mb-10 px-4">
                Dizayn promptini kiriting va sun'iy intellekt real vaqtda jonli tarzda siz uchun responsive HTML/CSS UI dizaynni yaratib beradi.
              </p>

              {/* Suggestions */}
              <div className="text-left max-w-xl mx-auto px-2">
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  <span>Namuna promptlar</span>
                </div>
                <div className="grid gap-2.5">
                  {DESIGN_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(suggestion);
                        generateDesign(suggestion);
                      }}
                      className="flex items-center justify-between text-left p-3.5 rounded-xl border border-slate-250 bg-white hover:border-violet-400 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <span className="text-[11px] md:text-xs font-semibold text-slate-700 leading-relaxed flex-1 truncate">{suggestion}</span>
                      <ArrowRight className="h-4 w-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity ml-3 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Preview / Code Area */
          <div className="flex items-center justify-center h-full p-2 md:p-6 bg-slate-100/50">
            {loading && !activeCodeDisplay ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl">
                    <Palette className="h-7 w-7 text-white animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl border-2 border-violet-300 animate-ping opacity-35"></div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700">Dizayn yuklanmoqda...</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">AI kodingizni tayyorlamoqda</p>
                </div>
              </motion.div>
            ) : viewMode === 'preview' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex justify-center"
              >
                <div 
                  className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden transition-all duration-300 h-full relative"
                  style={{ width: viewportWidths[viewport], maxWidth: '100%' }}
                >
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0 bg-white"
                    title="Design Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                  {loading && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[9px] px-2 py-1 rounded-md flex items-center gap-1.5 shadow backdrop-blur-sm z-20">
                      <div className="h-2 w-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Yozilmoqda...
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full"
              >
                <div className="h-full bg-[#1e1e2e] rounded-xl border border-slate-750 overflow-hidden shadow-lg flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-slate-750 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/85"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/85"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/85"></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">design.html</span>
                    </div>
                    {loading && (
                      <span className="text-[10px] text-violet-400 font-bold animate-pulse">
                        AI yozmoqda...
                      </span>
                    )}
                  </div>
                  <pre className="p-4 overflow-auto flex-1 text-xs md:text-sm text-slate-300 font-mono leading-relaxed bg-[#1e1e2e]">
                    <code>{activeCodeDisplay}</code>
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* History (Mobil uchun gorizontal skrol) */}
          {history.length > 0 && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1.5 no-scrollbar">
              <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Tarix:</span>
              {history.slice(0, 4).map(entry => (
                <button
                  key={entry.id}
                  onClick={() => loadFromHistory(entry)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-all cursor-pointer truncate max-w-[120px]"
                  title={entry.prompt}
                >
                  {entry.prompt}
                </button>
              ))}
              <button
                onClick={clearHistory}
                className="shrink-0 p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Tarixni tozalash"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3 bg-slate-50 rounded-2xl p-1.5 md:p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-violet-100 transition-all shadow-sm">
            <div className="p-2 text-violet-500 shrink-0">
              <Palette className="h-5 w-5" />
            </div>
            
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  generateDesign();
                }
              }}
              rows={1}
              placeholder="UI dizayn promptini yozing..."
              className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-slate-700 py-2.5 resize-none max-h-24 font-medium leading-relaxed"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
              }}
            />

            {activeCodeDisplay && (
              <button
                onClick={() => { setGeneratedCode(''); setStreamText(''); setPrompt(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                title="Qayta tiklash"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => generateDesign()}
              disabled={!prompt.trim() || loading}
              className={`bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 h-9 w-9 md:h-10 md:w-10 cursor-pointer ${
                prompt.trim() && !loading
                  ? 'hover:from-violet-700 hover:to-fuchsia-700 shadow-violet-200 active:scale-95'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              {loading && !activeCodeDisplay ? (
                <div className="h-4.5 w-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4.5 w-4.5 md:h-5 md:w-5 transform rotate-90" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
