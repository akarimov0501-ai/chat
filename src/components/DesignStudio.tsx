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
import { DesignEntry } from '../types';

interface DesignStudioProps {
  model: string;
  onToggleSidebar?: () => void;
  designs: DesignEntry[];
  setDesigns: React.Dispatch<React.SetStateAction<DesignEntry[]>>;
  activeDesignId: string;
  setActiveDesignId: (id: string) => void;
  openRouterKey?: string;
}

export const PALETTES = [
  { id: 'indigo', name: 'Indigo Dream', primary: '#4f46e5', secondary: '#8b5cf6', accent: '#d946ef', bg: '#f8fafc', text: 'To\'q binafsha/indigo ranglar kombinatsiyasi' },
  { id: 'emerald', name: 'Emerald Forest', primary: '#059669', secondary: '#10b981', accent: '#f59e0b', bg: '#f0fdf4', text: 'Zumrad va toza yashil ranglar kombinatsiyasi, tillarang urg\'u bilan' },
  { id: 'rose', name: 'Rose Sunset', primary: '#e11d48', secondary: '#f43f5e', accent: '#fda4af', bg: '#fff1f2', text: 'Yorqin atirgul va to\'q qizil ranglar uyg\'unligi' },
  { id: 'midnight', name: 'Midnight Dark', primary: '#6366f1', secondary: '#a855f7', accent: '#f43f5e', bg: '#0f172a', text: 'To\'q ko\'k va neon binafsha rangli qorong\'u rejim (Dark Mode)' },
  { id: 'ocean', name: 'Ocean Breeze', primary: '#0284c7', secondary: '#0ea5e9', accent: '#06b6d4', bg: '#f0f9ff', text: 'Moviy okean va tiniq ko\'k suv ranglari uyg\'unligi' }
];

export const FONTS = ['Inter', 'Outfit', 'Roboto', 'Playfair Display', 'Merriweather', 'Georgia', 'Courier New'];
export const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px'];

export default function DesignStudio({ 
  model, 
  onToggleSidebar,
  designs,
  setDesigns,
  activeDesignId,
  setActiveDesignId,
  openRouterKey = ""
}: DesignStudioProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [streamText, setStreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Custom Design & Override States
  const [selectedPalette, setSelectedPalette] = useState<string>('indigo');
  const [overrideTarget, setOverrideTarget] = useState<'all' | 'headings' | 'body' | 'buttons'>('headings');
  const [overrideFont, setOverrideFont] = useState<string>('Outfit');
  const [overrideSize, setOverrideSize] = useState<string>('24px');
  const [showEditorPanel, setShowEditorPanel] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  // Faol tanlangan dizayn o'zgarganida uning kodini yuklash
  useEffect(() => {
    if (activeDesignId) {
      const activeDesign = designs.find(d => d.id === activeDesignId);
      if (activeDesign) {
        setGeneratedCode(activeDesign.code);
        setStreamText(activeDesign.code);
      }
    }
  }, [activeDesignId, designs]);

  // Save generatedCode on change (oxirgi ko'rilgan dizayn)
  useEffect(() => {
    if (generatedCode) {
      localStorage.setItem('last_generated_design', generatedCode);
    } else {
      localStorage.removeItem('last_generated_design');
    }
  }, [generatedCode]);

  // Load last generated design code on mount if there's no active design selected
  useEffect(() => {
    if (!activeDesignId) {
      const savedLastCode = localStorage.getItem('last_generated_design');
      if (savedLastCode) {
        setGeneratedCode(savedLastCode);
        setStreamText(savedLastCode);
      }
    }
  }, []);

const DESIGN_SUGGESTIONS = [
  "Login sahifasi — gradient fon, glassmorphism karta va chiroyli tugma bilan",
  "Dashboard — statistik kartalar, foydalanuvchilar jadvali va navigatsiya",
  "Narxlar sahifasi — 3 xil tarif rejasi, mashhur tarifga yorqin fon va effekt",
  "Portfolio sahifasi — hero qism, loyihalar galereyasi va bog'lanish shakli",
];

  // Agar live rejimda kod kelayotgan bo'lsa, uni real-time ko'rsatish
  const activeCodeDisplay = generatedCode || streamText;

  const applyOverrides = () => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // 1. Google fonts link inject qilish (agar ulanmagan bo'lsa)
    const fontId = 'ai-oshno-font-override-link';
    let fontLink = doc.getElementById(fontId) as HTMLLinkElement;
    if (!fontLink) {
      fontLink = doc.createElement('link');
      fontLink.id = fontId;
      fontLink.rel = 'stylesheet';
      doc.head.appendChild(fontLink);
    }
    const formattedFont = overrideFont.replace(/ /g, '+');
    fontLink.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@300;400;500;600;700&display=swap`;

    // 2. Custom CSS inject
    const styleId = 'ai-oshno-style-override-el';
    let styleElement = doc.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
      styleElement = doc.createElement('style');
      styleElement.id = styleId;
      doc.head.appendChild(styleElement);
    }

    let selector = '';
    if (overrideTarget === 'all') selector = '*';
    else if (overrideTarget === 'headings') selector = 'h1, h2, h3, h4, h5, h6';
    else if (overrideTarget === 'body') selector = 'body, p, span, li, a';
    else if (overrideTarget === 'buttons') selector = 'button, .btn, input[type="button"], input[type="submit"]';

    styleElement.innerHTML = `
      ${selector} {
        font-family: '${overrideFont}', sans-serif !important;
        ${overrideSize ? `font-size: ${overrideSize} !important;` : ''}
      }
    `;
  };

  // Iframe yuklanganda va sozlamalar o'zgarganda overrides ni qo'llash
  useEffect(() => {
    const timer = setTimeout(applyOverrides, 300);
    return () => clearTimeout(timer);
  }, [generatedCode, streamText, overrideTarget, overrideFont, overrideSize, viewMode]);

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

    // Rang palitrasi ma'lumotlarini promptga qo'shish
    const palette = PALETTES.find(p => p.id === selectedPalette);
    const paletteInstruction = palette ? `\n\n[Dizayn Uslubi Sozlamalari (Buni albatta inobatga oling)]: Ranglar palitrasi bo'yicha: asosiy rang (primary) "${palette.primary}", ikkinchi darajali rang (secondary) "${palette.secondary}", urg'u beruvchi rang (accent) "${palette.accent}" va fon (background) "${palette.bg}" bo'lsin. UI elementlarida, tugmalarda, kartalarda va fonlarda ushbu ranglardan uyg'un tarzda foydalaning.` : '';
    const finalPrompt = textToSend + paletteInstruction;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: finalPrompt }],
          persona: 'designer',
          model,
          stream: true, // Stream rejim
          openRouterKey
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
      setDesigns(prev => [newEntry, ...prev]);
      setActiveDesignId(newEntry.id);
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
            <button
              onClick={() => setShowEditorPanel(!showEditorPanel)}
              className={`flex items-center justify-center p-1.5 md:px-3 md:py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showEditorPanel 
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Uslub va shriftlarni tahrirlash"
            >
              <Palette className="h-4 w-4 md:h-3.5 md:w-3.5" />
              <span className="hidden sm:inline ml-1">Uslub</span>
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
          <div className="flex-1 flex h-full overflow-hidden bg-slate-100/50">
            {/* Visualizer Frame */}
            <div className="flex-1 flex items-center justify-center p-2 md:p-6 h-full overflow-hidden">
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

            {/* Style Editor Panel Side */}
            {showEditorPanel && activeCodeDisplay && (
              <div className="w-72 md:w-80 shrink-0 border-l border-slate-200 bg-white h-full overflow-y-auto flex flex-col animate-in slide-in-from-right duration-250 z-10">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-violet-500" />
                    <span className="text-xs font-bold text-slate-700">Uslub va Shriftlar</span>
                  </div>
                  <button 
                    onClick={() => setShowEditorPanel(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4 space-y-5">
                  {/* Palettes */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Ranglar Palitrasi</label>
                    <p className="text-[9px] text-slate-400 leading-normal">Dizayn ranglarini tanlang (yaratishdan oldin tanlash tavsiya etiladi)</p>
                    <div className="grid gap-2 pt-1">
                      {PALETTES.map(palette => {
                        const isSelected = selectedPalette === palette.id;
                        return (
                          <button
                            key={palette.id}
                            onClick={() => setSelectedPalette(palette.id)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-violet-500 bg-violet-50/10 shadow-sm shadow-violet-500/5' 
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex -space-x-1.5 shrink-0">
                              <div className="w-4 h-4 rounded-full border border-white z-20" style={{ backgroundColor: palette.primary }} />
                              <div className="w-4 h-4 rounded-full border border-white z-10" style={{ backgroundColor: palette.secondary }} />
                              <div className="w-4 h-4 rounded-full border border-white z-0" style={{ backgroundColor: palette.accent }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 truncate">{palette.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{palette.text}</p>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Overrides */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Dinamik Shriftlar & O'lchamlar</label>
                    <p className="text-[9px] text-slate-400 leading-normal mb-1">Dizayn yuklangach elementlarni dinamik tarzda o'zgartiring</p>
                    
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Target Element:</label>
                      <select
                        value={overrideTarget}
                        onChange={(e) => setOverrideTarget(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-2 rounded-xl outline-none focus:border-violet-500 shadow-sm font-semibold"
                      >
                        <option value="headings">Sarlavhalar (h1 - h6)</option>
                        <option value="body">Asosiy matn (p, span, a)</option>
                        <option value="buttons">Tugmalar (button, .btn)</option>
                        <option value="all">Barcha elementlar (*)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Shrift (Font Family):</label>
                      <select
                        value={overrideFont}
                        onChange={(e) => setOverrideFont(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-2 rounded-xl outline-none focus:border-violet-500 shadow-sm font-semibold"
                      >
                        {FONTS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Hajmi (Font Size):</label>
                      <select
                        value={overrideSize}
                        onChange={(e) => setOverrideSize(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-2 rounded-xl outline-none focus:border-violet-500 shadow-sm font-semibold"
                      >
                        <option value="">Standart</option>
                        {FONT_SIZES.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-4xl mx-auto">

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
