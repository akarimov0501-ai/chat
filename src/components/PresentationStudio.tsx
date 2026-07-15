import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Download, 
  Copy, 
  Check, 
  X,
  Sparkles,
  Presentation,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Menu,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PresentationEntry, Slide } from '../types';

interface PresentationStudioProps {
  model: string;
  onToggleSidebar?: () => void;
  presentations: PresentationEntry[];
  setPresentations: React.Dispatch<React.SetStateAction<PresentationEntry[]>>;
  activePresentationId: string;
  setActivePresentationId: (id: string) => void;
  openRouterKey?: string;
}

const PRESENTATION_SUGGESTIONS = [
  "Sun'iy intellekt va uning kelajagi haqida 5 slaydli taqdimot",
  "React va Next.js asoslari bo'yicha 6 slaydli prezentatsiya",
  "Sog'lom hayot tarzi va to'g'ri ovqatlanish haqida 4 slaydli taqdimot",
  "Muvaffaqiyatli startup qurish bosqichlari — 5 ta slayd",
];

const GRADIENTS = [
  { name: 'Deep Space', class: 'from-slate-900 to-slate-800 text-white' },
  { name: 'Indigo Dream', class: 'from-indigo-600 to-purple-650 text-white' },
  { name: 'Sunset Glow', class: 'from-rose-500 to-amber-500 text-white' },
  { name: 'Emerald Wave', class: 'from-emerald-500 to-teal-700 text-white' },
  { name: 'Ocean Calm', class: 'from-sky-500 to-blue-600 text-white' },
  { name: 'Clean White', class: 'from-slate-50 to-white text-slate-800 border border-slate-200' },
];

export default function PresentationStudio({
  model,
  onToggleSidebar,
  presentations,
  setPresentations,
  activePresentationId,
  setActivePresentationId,
  openRouterKey = ""
}: PresentationStudioProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active Presentation Details
  const activePresentation = presentations.find(p => p.id === activePresentationId);

  // Active Presentation o'zgarganda slayd indeksini 0 ga tushirish
  useEffect(() => {
    setActiveSlideIndex(0);
  }, [activePresentationId]);

  // Fullscreen rejimda klaviatura strelkalari bilan slaydlarni boshqarish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePresentation || activePresentation.slides.length === 0) return;
      
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setActiveSlideIndex(prev => Math.min(prev + 1, activePresentation.slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveSlideIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePresentation, isFullscreen]);

  // Prezentatsiya generatsiya qilish
  const generatePresentation = async (customPrompt?: string) => {
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
          persona: 'presentation_expert',
          model,
          stream: false, // JSON-ni to'liq qabul qilish osonroq
          openRouterKey
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server bilan aloqada xatolik yuz berdi.');
      }

      const data = await response.json();
      const rawText = data.reply || '';

      // JSON block-ni ajratib olish
      let jsonStr = rawText;
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        const codeMatch = rawText.match(/```\s*([\s\S]*?)```/);
        if (codeMatch) {
          jsonStr = codeMatch[1].trim();
        }
      }

      const parsedData = JSON.parse(jsonStr);
      if (!parsedData.slides || !Array.isArray(parsedData.slides)) {
        throw new Error("AI taqdimot formatini to'g'ri yarata olmadi. Iltimos qayta urinib ko'ring.");
      }

      const newPresentation: PresentationEntry = {
        id: 'pres-' + Date.now(),
        title: parsedData.title || textToSend.slice(0, 30) + '...',
        slides: parsedData.slides.map((s: any, idx: number) => ({
          id: `slide-${Date.now()}-${idx}`,
          title: s.title || `Slayd ${idx + 1}`,
          content: Array.isArray(s.content) ? s.content : [s.content || ''],
          bgGradient: s.bgGradient || 'from-indigo-600 to-purple-650 text-white'
        })),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setPresentations(prev => [newPresentation, ...prev]);
      setActivePresentationId(newPresentation.id);
      setActiveSlideIndex(0);
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Taqdimot yaratishda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  // Slayd tahrirlash logiclari
  const updateSlideTitle = (newTitle: string) => {
    if (!activePresentation) return;
    const updatedSlides = [...activePresentation.slides];
    updatedSlides[activeSlideIndex].title = newTitle;
    
    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
  };

  const updateSlideContent = (bulletIdx: number, newText: string) => {
    if (!activePresentation) return;
    const updatedSlides = [...activePresentation.slides];
    const updatedContent = [...updatedSlides[activeSlideIndex].content];
    updatedContent[bulletIdx] = newText;
    updatedSlides[activeSlideIndex].content = updatedContent;

    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
  };

  const addBulletPoint = () => {
    if (!activePresentation) return;
    const updatedSlides = [...activePresentation.slides];
    const updatedContent = [...updatedSlides[activeSlideIndex].content, 'Yangi ma\'lumot punkta'];
    updatedSlides[activeSlideIndex].content = updatedContent;

    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
  };

  const removeBulletPoint = (bulletIdx: number) => {
    if (!activePresentation) return;
    const updatedSlides = [...activePresentation.slides];
    const updatedContent = updatedSlides[activeSlideIndex].content.filter((_, idx) => idx !== bulletIdx);
    updatedSlides[activeSlideIndex].content = updatedContent;

    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
  };

  const updateSlideGradient = (gradientClass: string) => {
    if (!activePresentation) return;
    const updatedSlides = [...activePresentation.slides];
    updatedSlides[activeSlideIndex].bgGradient = gradientClass;

    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
  };

  // Slaydlarni boshqarish (Qo'shish, o'chirish, siljitish)
  const addEmptySlide = () => {
    if (!activePresentation) return;
    const newSlide: Slide = {
      id: `slide-${Date.now()}-${activePresentation.slides.length}`,
      title: 'Yangi slayd',
      content: ['Yangi ma\'lumot punktini kiriting'],
      bgGradient: 'from-indigo-655 to-purple-655 text-white'
    };
    const updatedSlides = [...activePresentation.slides, newSlide];
    
    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
    setActiveSlideIndex(updatedSlides.length - 1);
  };

  const deleteCurrentSlide = () => {
    if (!activePresentation || activePresentation.slides.length <= 1) return;
    const updatedSlides = activePresentation.slides.filter((_, idx) => idx !== activeSlideIndex);
    
    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  const moveSlideUp = () => {
    if (!activePresentation || activeSlideIndex === 0) return;
    const updatedSlides = [...activePresentation.slides];
    const temp = updatedSlides[activeSlideIndex];
    updatedSlides[activeSlideIndex] = updatedSlides[activeSlideIndex - 1];
    updatedSlides[activeSlideIndex - 1] = temp;

    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
    setActiveSlideIndex(activeSlideIndex - 1);
  };

  const moveSlideDown = () => {
    if (!activePresentation || activeSlideIndex === activePresentation.slides.length - 1) return;
    const updatedSlides = [...activePresentation.slides];
    const temp = updatedSlides[activeSlideIndex];
    updatedSlides[activeSlideIndex] = updatedSlides[activeSlideIndex + 1];
    updatedSlides[activeSlideIndex + 1] = temp;

    setPresentations(prev => prev.map(p => 
      p.id === activePresentation.id ? { ...p, slides: updatedSlides } : p
    ));
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  // Prezentatsiyani HTML slide viewer sifatida yuklab olish
  const downloadPresentationHtml = () => {
    if (!activePresentation) return;

    const slidesJson = JSON.stringify(activePresentation.slides);
    const htmlCode = `<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${activePresentation.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Outfit', sans-serif; }
        .slide-enter { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
        }
    </style>
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col justify-between overflow-hidden">

    <!-- Slide Header -->
    <header class="p-6 flex items-center justify-between z-10">
        <h2 class="text-sm font-bold opacity-60 uppercase tracking-wider">${activePresentation.title}</h2>
        <div class="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm" id="slide-counter">1 / 1</div>
    </header>

    <!-- Slide Screen Container -->
    <main class="flex-1 flex items-center justify-center p-4 md:p-12">
        <div id="slide-card" class="w-full max-w-4xl aspect-[16/9] rounded-3xl bg-gradient-to-br p-8 md:p-16 flex flex-col justify-center shadow-2xl transition-all duration-500 slide-enter">
            <h1 id="slide-title" class="text-3xl md:text-5xl font-extrabold tracking-tight mb-8"></h1>
            <ul id="slide-content" class="space-y-4 text-lg md:text-2xl font-medium opacity-90 leading-relaxed list-disc list-inside"></ul>
        </div>
    </main>

    <!-- Controls Footer -->
    <footer class="p-6 flex items-center justify-center gap-4 z-10">
        <button id="prev-btn" onclick="prevSlide()" class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button id="next-btn" onclick="nextSlide()" class="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </button>
    </footer>

    <script>
        const slides = ${slidesJson};
        let currentIdx = 0;

        function updateSlide() {
            const slide = slides[currentIdx];
            const card = document.getElementById('slide-card');
            
            // Gradient class
            card.className = "w-full max-w-4xl aspect-[16/9] rounded-3xl bg-gradient-to-br p-8 md:p-16 flex flex-col justify-center shadow-2xl transition-all duration-300 slide-enter " + slide.bgGradient;
            
            document.getElementById('slide-title').innerText = slide.title;
            
            const list = document.getElementById('slide-content');
            list.innerHTML = "";
            slide.content.forEach(pt => {
                const li = document.createElement('li');
                li.innerText = pt;
                list.appendChild(li);
            });

            document.getElementById('slide-counter').innerText = (currentIdx + 1) + " / " + slides.length;
        }

        function nextSlide() {
            if (currentIdx < slides.length - 1) {
                currentIdx++;
                updateSlide();
            }
        }

        function prevSlide() {
            if (currentIdx > 0) {
                currentIdx--;
                updateSlide();
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        });

        // Initialize
        updateSlide();
    </script>
</body>
</html>`;

    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activePresentation.title.replace(/\s+/g, '_')}_presentation.html`;
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-650 to-purple-650 text-white shadow-sm shrink-0">
            <Presentation className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs md:text-sm font-bold text-slate-800 truncate">Taqdimot Studio</h2>
            <p className="text-[9px] md:text-[10px] text-slate-400 truncate">AI prezentatsiya yaratuvchisi</p>
          </div>
        </div>

        {/* Action Buttons */}
        {activePresentation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-all cursor-pointer"
              title="Prezentatsiyani o'ynash"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Taqdim qilish</span>
            </button>

            <button
              onClick={downloadPresentationHtml}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-all cursor-pointer"
              title="HTML yuklab olish"
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
            className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 md:px-6 py-3 text-xs md:text-sm flex items-center gap-2 shrink-0 font-medium"
          >
            <X className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="truncate">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-0.5 hover:bg-rose-100 rounded cursor-pointer">
              <X className="h-4 w-4 text-rose-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {!activePresentation && !loading ? (
          /* Welcome View */
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-2xl w-full"
            >
              <div className="inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-650 text-white shadow-xl shadow-indigo-500/20 mb-6 md:mb-8">
                <Presentation className="h-8 w-8 md:h-10 md:w-10" />
              </div>

              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-800 mb-2 md:mb-3">
                Prezentatsiya Yaratish
              </h1>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto mb-8 md:mb-10 px-4">
                Slaydlar mavzusini yozing, sun'iy intellekt siz uchun gradient fonga va punktlarga ega chiroyli prezentatsiya yaratib beradi.
              </p>

              {/* Suggestions */}
              <div className="text-left max-w-xl mx-auto px-2">
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Tavsiyalar</span>
                </div>
                <div className="grid gap-2.5">
                  {PRESENTATION_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(suggestion);
                        generatePresentation(suggestion);
                      }}
                      className="flex items-center justify-between text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <span className="text-[11px] md:text-xs font-semibold text-slate-700 leading-relaxed flex-1 truncate">{suggestion}</span>
                      <ArrowRightIcon className="h-4 w-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity ml-3 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : loading && !activePresentation ? (
          /* Initial Loading Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-100/30">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center shadow-xl">
                  <Presentation className="h-8 w-8 text-white animate-pulse" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border-2 border-indigo-300 animate-ping opacity-35"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">Prezentatsiya tayyorlanmoqda...</p>
                <p className="text-xs text-slate-400 mt-0.5">AI slaydlar va ma'lumotlarni tahlil qilmoqda</p>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Presentation Workspace (Slides list + Slide Editor + Right Controls) */
          <>
            {/* Slayd Navigator (Chapda) */}
            <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-4 gap-3">
              <div className="hidden md:flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                <span>Slaydlar</span>
                <button
                  onClick={addEmptySlide}
                  className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded cursor-pointer"
                  title="Slayd qo'shish"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              </div>
              
              {activePresentation?.slides.map((slide, index) => {
                const isSelected = index === activeSlideIndex;
                return (
                  <div
                    key={slide.id}
                    onClick={() => setActiveSlideIndex(index)}
                    className={`flex-none md:flex-initial w-36 md:w-full aspect-[16/9] rounded-xl bg-gradient-to-br p-2.5 flex flex-col justify-between text-left cursor-pointer border-2 transition-all shadow-sm ${
                      isSelected 
                        ? 'border-indigo-650 ring-2 ring-indigo-500/10 scale-98' 
                        : 'border-transparent opacity-75 hover:opacity-100 hover:scale-98'
                    } ${slide.bgGradient}`}
                  >
                    <span className="text-[10px] font-extrabold truncate max-w-full leading-tight">{slide.title}</span>
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="bg-black/15 px-1.5 py-0.5 rounded backdrop-blur-sm">Slayd {index + 1}</span>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addEmptySlide}
                className="md:hidden flex-none w-16 aspect-[16/9] rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-350 cursor-pointer"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>

            {/* Slayd Preview (O'rtada) */}
            <div className="flex-1 flex flex-col bg-slate-100/50 p-4 md:p-8 overflow-y-auto">
              {activePresentation && activePresentation.slides[activeSlideIndex] && (
                <div className="max-w-4xl w-full mx-auto space-y-6">
                  {/* Aspect Ratio slide screen */}
                  <div 
                    className={`w-full aspect-[16/9] rounded-3xl bg-gradient-to-br p-8 md:p-16 flex flex-col justify-center shadow-xl transition-all duration-300 relative ${activePresentation.slides[activeSlideIndex].bgGradient}`}
                  >
                    {/* Rendered Slide Content */}
                    <div className="relative">
                      {/* Title edit on focus */}
                      <input
                        type="text"
                        value={activePresentation.slides[activeSlideIndex].title}
                        onChange={(e) => updateSlideTitle(e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/50 focus:outline-none text-2xl md:text-4xl font-extrabold tracking-tight mb-6 md:mb-10 text-white placeholder-white/40"
                        placeholder="Slayd sarlavhasi..."
                      />

                      {/* Bullet point list */}
                      <ul className="space-y-3.5 md:space-y-5 text-sm md:text-xl font-medium opacity-90 leading-relaxed">
                        {activePresentation.slides[activeSlideIndex].content.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 group">
                            <span className="mt-2 h-2 w-2 rounded-full bg-white shrink-0" />
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => updateSlideContent(bIdx, e.target.value)}
                              className="flex-1 bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/50 focus:outline-none text-white placeholder-white/40 pb-0.5"
                              placeholder="Ma'lumot kiriting..."
                            />
                            <button
                              onClick={() => removeBulletPoint(bIdx)}
                              className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white p-0.5 rounded cursor-pointer transition-opacity"
                              title="Punktni o'chirish"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>

                      {/* Add bullet point button inside slide */}
                      <button
                        onClick={addBulletPoint}
                        className="mt-6 flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer border border-white/5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Punkt qo'shish
                      </button>
                    </div>
                  </div>

                  {/* Slayd tahrirlagich paneli (Pastda) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm flex flex-col md:flex-row gap-6">
                    {/* Gradient tanlagich */}
                    <div className="flex-1 space-y-2.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fon Gradienti</label>
                      <div className="flex flex-wrap gap-2">
                        {GRADIENTS.map((grad, gIdx) => {
                          const isSelected = activePresentation.slides[activeSlideIndex].bgGradient === grad.class;
                          return (
                            <button
                              key={gIdx}
                              onClick={() => updateSlideGradient(grad.class)}
                              className={`w-12 h-12 rounded-lg bg-gradient-to-br transition-all cursor-pointer border ${
                                isSelected ? 'ring-2 ring-indigo-500 scale-95 border-indigo-500' : 'border-slate-200'
                              } ${grad.class}`}
                              title={grad.name}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Slayd buyruqlari */}
                    <div className="flex flex-wrap items-end gap-2.5">
                      <button
                        onClick={moveSlideUp}
                        disabled={activeSlideIndex === 0}
                        className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-650 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                        title="Oldinga ko'chirish"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={moveSlideDown}
                        disabled={activeSlideIndex === activePresentation.slides.length - 1}
                        className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-650 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                        title="Orqaga ko'chirish"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={deleteCurrentSlide}
                        disabled={activePresentation.slides.length <= 1}
                        className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 px-4 py-2.5 rounded-xl border border-rose-100 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                        title="Slaydni o'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                        Slaydni o'chirish
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3 bg-slate-50 rounded-2xl p-1.5 md:p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
            <div className="p-2 text-indigo-500 shrink-0">
              <Presentation className="h-5 w-5" />
            </div>
            
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  generatePresentation();
                }
              }}
              placeholder="Taqdimot mavzusini kiriting (masalan: Quyosh tizimi haqida)..."
              disabled={loading}
              className="flex-1 bg-transparent border-0 outline-none text-slate-700 text-xs md:text-sm font-semibold placeholder-slate-400 py-2"
            />

            <button
              onClick={() => generatePresentation()}
              disabled={loading || !prompt.trim()}
              className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-650/15 disabled:bg-slate-100 disabled:text-slate-350 disabled:shadow-none cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4 transform rotate-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Presentation Mode (Slideshow Overlay) */}
      <AnimatePresence>
        {isFullscreen && activePresentation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between"
          >
            {/* Fullscreen Header */}
            <header className="p-6 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/40 to-transparent">
              <h2 className="text-sm font-bold opacity-60 uppercase tracking-wider">{activePresentation.title}</h2>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {activeSlideIndex + 1} / {activePresentation.slides.length}
                </span>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer text-white"
                  title="Taqdimotni yopish"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Active Slide Screen */}
            <main className="flex-1 flex items-center justify-center p-6 md:p-16">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlideIndex}
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`w-full max-w-5xl aspect-[16/9] rounded-3xl bg-gradient-to-br p-10 md:p-20 flex flex-col justify-center shadow-2xl relative ${activePresentation.slides[activeSlideIndex].bgGradient}`}
                >
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 md:mb-14">
                    {activePresentation.slides[activeSlideIndex].title}
                  </h1>
                  
                  <ul className="space-y-4 md:space-y-6 text-xl md:text-3xl font-medium opacity-90 leading-relaxed list-disc list-inside">
                    {activePresentation.slides[activeSlideIndex].content.map((bullet, idx) => (
                      <li key={idx} className="transition-all hover:translate-x-1.5 duration-200">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Navigation controls */}
            <footer className="p-6 flex items-center justify-center gap-4 z-10 bg-gradient-to-t from-black/40 to-transparent">
              <button
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex(prev => Math.max(prev - 1, 0))}
                className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full transition-all text-white cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                disabled={activeSlideIndex === activePresentation.slides.length - 1}
                onClick={() => setActiveSlideIndex(prev => Math.min(prev + 1, activePresentation.slides.length - 1))}
                className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-full transition-all text-white cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Arrow icon for suggestion buttons
function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}
