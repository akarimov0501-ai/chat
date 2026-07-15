import React, { useState, useRef } from 'react';
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
  MonitorSmartphone,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  AlertCircle,
  Trash2,
  ArrowRight
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
}

const DESIGN_SUGGESTIONS = [
  "Login sahifasi — gradient fon, glassmorphism karta, parol ko'rsatish tugmasi bilan",
  "Dashboard — chap panelli navigatsiya, statistik kartalar, jadval va diagrammalar",
  "Narxlar sahifasi — 3 ta tarif rejasi, eng mashhuriga badge, animatsiyali hover effekt",
  "Portfolio sahifasi — hero section, loyihalar gallereyasi, aloqa formasi",
];

export default function DesignStudio({ model }: DesignStudioProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
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

  const generateDesign = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: textToSend }],
          persona: 'designer',
          model
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server javob bermadi.');
      }

      let htmlCode = data.reply;
      
      // Extract HTML from markdown code blocks
      const htmlMatch = htmlCode.match(/```html\s*([\s\S]*?)```/);
      if (htmlMatch) {
        htmlCode = htmlMatch[1].trim();
      } else {
        const codeMatch = htmlCode.match(/```\s*([\s\S]*?)```/);
        if (codeMatch) {
          htmlCode = codeMatch[1].trim();
        }
      }

      setGeneratedCode(htmlCode);
      setViewMode('preview');
      
      const newEntry: DesignEntry = {
        id: 'design-' + Date.now(),
        prompt: textToSend,
        code: htmlCode,
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
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (entry: DesignEntry) => {
    setGeneratedCode(entry.code);
    setViewMode('preview');
  };

  const clearHistory = () => {
    setHistory([]);
    setGeneratedCode('');
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#F8FAFC] relative">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Dizayn Studio</h2>
            <p className="text-[10px] text-slate-400">Prompt orqali UI dizayn yarating</p>
          </div>
        </div>

        {/* Viewport & View Toggle */}
        {generatedCode && (
          <div className="flex items-center gap-2">
            {/* Viewport Switcher */}
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
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Ko'rish
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'code' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Kod
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              title="Kodni nusxalash"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
            </button>
            <button
              onClick={downloadCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              title="HTML faylni yuklash"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Yuklash</span>
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
            className="bg-rose-50 border-b border-rose-200 text-rose-800 px-6 py-3 text-sm flex items-center gap-2 shrink-0 font-medium"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-0.5 hover:bg-rose-100 rounded cursor-pointer">
              <X className="h-4 w-4 text-rose-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!generatedCode && !loading ? (
          /* Welcome View */
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-2xl"
            >
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-2xl shadow-violet-500/20 mb-8">
                <Palette className="h-10 w-10" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 mb-3">
                Dizayn Studio
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-10">
                Prompt yozing — AI siz uchun to'liq UI dizayn yaratib beradi. HTML va CSS kodni ko'ring, nusxalang yoki yuklab oling.
              </p>

              {/* Suggestions */}
              <div className="text-left max-w-xl mx-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
                  <Sparkles className="h-4 w-4" />
                  <span>Namuna promptlar</span>
                </div>
                <div className="grid gap-3">
                  {DESIGN_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(suggestion);
                        generateDesign(suggestion);
                      }}
                      className="flex items-center justify-between text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/5 transition-all group duration-300 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-700 leading-relaxed flex-1">{suggestion}</span>
                      <ArrowRight className="h-4 w-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity ml-3 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Preview / Code Area */
          <div className="flex items-center justify-center h-full p-4 md:p-6 bg-slate-100/50">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/20">
                    <Palette className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl border-2 border-violet-300 animate-ping opacity-30"></div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Dizayn yaratilmoqda...</p>
                  <p className="text-[11px] text-slate-400 mt-1">AI sizning loyihangizni tayyorlamoqda</p>
                </div>
              </motion.div>
            ) : viewMode === 'preview' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex justify-center"
              >
                <div 
                  className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-300 h-full"
                  style={{ width: viewportWidths[viewport], maxWidth: '100%' }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={generatedCode}
                    className="w-full h-full border-0"
                    title="Design Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <div className="h-full bg-[#1e1e2e] rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#181825] border-b border-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono ml-2">design.html</span>
                  </div>
                  <pre className="p-4 overflow-auto h-[calc(100%-40px)] text-sm text-slate-300 font-mono leading-relaxed">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          {/* History pills */}
          {history.length > 0 && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Tarix:</span>
              {history.slice(0, 5).map(entry => (
                <button
                  key={entry.id}
                  onClick={() => loadFromHistory(entry)}
                  className="shrink-0 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-all cursor-pointer truncate max-w-[200px]"
                  title={entry.prompt}
                >
                  {entry.prompt.slice(0, 30)}{entry.prompt.length > 30 ? '...' : ''}
                </button>
              ))}
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="shrink-0 p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Tarixni tozalash"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-violet-100 transition-all shadow-sm">
            <div className="p-2 text-violet-500">
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
              placeholder="UI dizayn uchun prompt yozing... (masalan: 'Zamonaviy login sahifasi')"
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 py-3 resize-none max-h-32 font-medium leading-relaxed"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />

            {generatedCode && (
              <button
                onClick={() => { setGeneratedCode(''); setPrompt(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Yangi dizayn"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => generateDesign()}
              disabled={!prompt.trim() || loading}
              className={`bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 h-10 w-10 cursor-pointer ${
                prompt.trim() && !loading
                  ? 'hover:from-violet-700 hover:to-fuchsia-700 shadow-violet-200 active:scale-95'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5 transform rotate-90" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
