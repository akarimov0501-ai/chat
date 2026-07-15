import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Code2, 
  PenTool, 
  GraduationCap, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Send, 
  Image as ImageIcon, 
  Bot, 
  User, 
  Menu, 
  RefreshCw, 
  Download, 
  AlertCircle,
  MessageSquare,
  HelpCircle,
  Compass,
  ArrowRight,
  ChevronDown,
  Cpu,
  Zap,
  CircleCheck,
  Wifi,
  WifiOff,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatSession, ChatMessage, PersonaType } from './types';
import { PERSONAS } from './data/personas';
import { MODELS, DEFAULT_MODEL_ID } from './data/models';
import MarkdownRenderer from './components/MarkdownRenderer';
import DesignStudio from './components/DesignStudio';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [input, setInput] = useState<string>('');
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'chat' | 'design'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setApiConnected(data.connected === true);
      } catch {
        setApiConnected(false);
      }
    };
    checkHealth();
    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close model dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load sessions from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        if (parsed.length > 0) {
          // Migrate old sessions that don't have model field
          const migrated = parsed.map(s => ({
            ...s,
            model: s.model || DEFAULT_MODEL_ID
          }));
          setSessions(migrated);
          setActiveSessionId(migrated[0].id);
          return;
        }
      } catch (e) {
        console.error('Error parsing stored sessions:', e);
      }
    }
    
    // Create an initial session if none exist
    const initialSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'Yangi suhbat',
      messages: [],
      persona: 'general',
      model: DEFAULT_MODEL_ID,
      createdAt: new Date().toISOString()
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, []);

  // Save sessions to LocalStorage on change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const createNewSession = (persona: PersonaType = 'general') => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: `${PERSONAS.find(p => p.id === persona)?.name || 'Yangi suhbat'}`,
      messages: [],
      persona,
      model: activeSession?.model || DEFAULT_MODEL_ID,
      createdAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    setImage(null);
    setError(null);
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedSessions = sessions.filter(s => s.id !== id);
    if (updatedSessions.length === 0) {
      const fallbackSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'Yangi suhbat',
        messages: [],
        persona: 'general',
        model: DEFAULT_MODEL_ID,
        createdAt: new Date().toISOString()
      };
      setSessions([fallbackSession]);
      setActiveSessionId(fallbackSession.id);
    } else {
      setSessions(updatedSessions);
      if (activeSessionId === id) {
        setActiveSessionId(updatedSessions[0].id);
      }
    }
  };

  const startRenameSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveRenameSession = () => {
    if (!editingTitle.trim() || !editingSessionId) return;
    setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editingTitle.trim() } : s));
    setEditingSessionId(null);
  };

  const changeSessionPersona = (persona: PersonaType) => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        // Only change title if it hasn't been custom-named yet or matches the default name
        const currentPersonaName = PERSONAS.find(p => p.id === s.persona)?.name;
        const newPersonaName = PERSONAS.find(p => p.id === persona)?.name || 'AI';
        const updatedTitle = s.title === currentPersonaName || s.title === 'Yangi suhbat' 
          ? newPersonaName 
          : s.title;
        return {
          ...s,
          persona,
          title: updatedTitle
        };
      }
      return s;
    }));
  };

  const changeSessionModel = (modelId: string) => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => 
      s.id === activeSession.id ? { ...s, model: modelId } : s
    ));
    setModelDropdownOpen(false);
  };
  const clearSessionHistory = () => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: [] } : s));
    setError(null);
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Iltimos, faqat rasm yuklang.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Rasm hajmi juda katta (maksimal 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage({
        data: reader.result as string,
        mimeType: file.type
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() && !image) return;

    if (!activeSession) return;

    const userMsgId = 'msg-' + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: image ? { ...image } : undefined
    };

    // Update session title on the first message if it was "Yangi suhbat" or persona default
    let updatedTitle = activeSession.title;
    if (activeSession.messages.length === 0) {
      const truncatedInput = textToSend.slice(0, 24) + (textToSend.length > 24 ? '...' : '');
      updatedTitle = truncatedInput;
    }

    // Add user message to active session
    const updatedMessages = [...activeSession.messages, newUserMessage];
    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: updatedMessages, title: updatedTitle } : s));
    
    // Clear inputs immediately
    setInput('');
    setImage(null);
    setLoading(true);
    setError(null);

    // AI model javobi uchun bitta bo'sh xabar oldindan yaratamiz (Stream chunklari tushadigan joy)
    const modelMsgId = 'msg-model-' + Date.now();
    const newModelMessage: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Model xabarini sessiya ichiga kiritib qo'yamiz
    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: [...updatedMessages, newModelMessage] } : s));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            image: m.image
          })),
          persona: activeSession.persona,
          model: activeSession.model || DEFAULT_MODEL_ID,
          stream: true // Stream rejimini yoqish
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server javob bermadi.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('Stream oqimini ochib bo\'lmadi.');

      let accumulatedText = '';

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
              
              // Agar model o'zgargan bo'lsa (server fallback qilgan bo'lsa)
              if (parsed.meta && parsed.meta.model) {
                const finalModel = parsed.meta.model;
                setSessions(prev => prev.map(s => 
                  s.id === activeSession.id ? { ...s, model: finalModel } : s
                ));
              }

              if (parsed.text) {
                accumulatedText += parsed.text;
                // Ekranda real-time yangilash
                setSessions(prev => prev.map(s => {
                  if (s.id === activeSession.id) {
                    const updatedMsgs = s.messages.map(m => 
                      m.id === modelMsgId ? { ...m, content: accumulatedText } : m
                    );
                    return { ...s, messages: updatedMsgs };
                  }
                  return s;
                }));
              }
            } catch (e) {
              // chunk parse error ignored
            }
          }
        }
      }

      if (apiConnected === null || apiConnected === false) {
        setApiConnected(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      // Agar stream muvaffaqiyatsiz tugasa, o'sha model xabarini tozalash
      setSessions(prev => prev.map(s => {
        if (s.id === activeSession.id) {
          const updatedMsgs = s.messages.filter(m => m.id !== modelMsgId);
          return { ...s, messages: updatedMsgs };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const exportChat = () => {
    if (!activeSession || activeSession.messages.length === 0) return;
    
    const selectedModel = MODELS.find(m => m.id === activeSession.model);
    let content = `=== AI Chatbot: ${activeSession.title} ===\n`;
    content += `Persona: ${PERSONAS.find(p => p.id === activeSession.persona)?.name}\n`;
    content += `Model: ${selectedModel?.name || activeSession.model}\n`;
    content += `Sana: ${new Date(activeSession.createdAt).toLocaleDateString()}\n\n`;

    activeSession.messages.forEach(msg => {
      const sender = msg.role === 'user' ? 'Men' : 'AI Yordamchi';
      content += `[${msg.timestamp}] ${sender}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSession.title.replace(/\s+/g, '_')}_chat.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper for rendering icons dynamically
  const getPersonaIcon = (iconName: string, className = "h-5 w-5") => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Code2': return <Code2 className={className} />;
      case 'PenTool': return <PenTool className={className} />;
      case 'GraduationCap': return <GraduationCap className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      default: return <MessageSquare className={className} />;
    }
  };

  // Badge color helper
  const getBadgeClasses = (color: string) => {
    const map: Record<string, string> = {
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      violet: 'bg-violet-50 text-violet-700 border-violet-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return map[color] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const activePersona = PERSONAS.find(p => p.id === (activeSession?.persona || 'general'))!;
  const activeModel = MODELS.find(m => m.id === (activeSession?.model || DEFAULT_MODEL_ID)) || MODELS[0];

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-800"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-indigo-600/10 backdrop-blur-md border-4 border-dashed border-indigo-600 m-4 rounded-2xl"
          >
            <ImageIcon className="h-16 w-16 text-indigo-600 animate-bounce" />
            <h3 className="mt-4 text-xl font-bold text-indigo-700">Rasm yuklash uchun shu yerga tashlang</h3>
            <p className="text-sm text-indigo-600">Maksimal hajm: 5MB</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar for Desktop & Drawer for Mobile */}
      <div 
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-600 transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-sm">
              A
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-lg">AI-Oshno</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 md:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setMode('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'chat'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Suhbat
            </button>
            <button
              onClick={() => setMode('design')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'design'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              Dizayn
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        {mode === 'chat' && (
        <div className="px-4 pb-2">
          <button
            onClick={() => createNewSession('general')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 py-2.5 px-4 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-100 active:scale-98 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Yangi suhbat</span>
          </button>
        </div>
        )}

        {/* Sessions List */}
        <div className={`flex-1 overflow-y-auto px-3 py-2 space-y-1 ${mode !== 'chat' ? 'hidden' : ''}`}>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Suhbatlar tarixi</div>
          {sessions.map((session) => {
            const isSelected = session.id === activeSessionId;
            const sPersona = PERSONAS.find(p => p.id === session.persona);
            
            return (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setError(null);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-50 text-slate-800 font-medium border border-slate-100 shadow-sm' 
                    : 'hover:bg-slate-50/50 text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {sPersona ? getPersonaIcon(sPersona.icon, "h-4 w-4") : <MessageSquare className="h-4 w-4" />}
                  </div>
                  
                  {editingSessionId === session.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={saveRenameSession}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRenameSession();
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white text-slate-800 px-2 py-0.5 text-sm rounded outline-none border border-indigo-500 shadow-sm"
                    />
                  ) : (
                    <span className="truncate text-sm font-medium">{session.title}</span>
                  )}
                </div>

                {editingSessionId !== session.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRenameSession(session, e)}
                      className="p-1 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Nomini o'zgartirish"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Main Content Area */}
      {mode === 'design' ? (
        <DesignStudio 
          model={activeSession?.model || DEFAULT_MODEL_ID} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      ) : (
      <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#F8FAFC] relative">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Title / Active Session Details */}
            {activeSession && (
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-700 max-w-[180px] sm:max-w-xs truncate">{activeSession.title}</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded uppercase font-bold tracking-tight">Active</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector Dropdown */}
            {activeSession && (
              <div className="relative" ref={modelDropdownRef}>
                <button
                  id="model-selector"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="hidden sm:inline max-w-[120px] truncate">{activeModel.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getBadgeClasses(activeModel.badgeColor)} hidden lg:inline-block`}>
                    {activeModel.badge}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {modelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-700">Model tanlang</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Suhbat uchun AI modelni tanlang</p>
                      </div>

                      <div className="p-2 max-h-[320px] overflow-y-auto">
                        {MODELS.map(model => {
                          const isActive = activeSession.model === model.id;
                          return (
                            <button
                              key={model.id}
                              onClick={() => changeSessionModel(model.id)}
                              className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer group ${
                                isActive 
                                  ? 'bg-indigo-50 border border-indigo-100' 
                                  : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                              }`}>
                                {isActive ? <CircleCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                                    {model.name}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getBadgeClasses(model.badgeColor)}`}>
                                    {model.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{model.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-[10px] text-slate-400 text-center">
                          Modellar ro'yxatini <code className="bg-slate-100 px-1 py-0.5 rounded text-[9px] font-mono">src/data/models.ts</code> faylida tahrirlang
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {/* Persona Selector Pill */}
            {activeSession && (
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 py-1 px-2.5">
                <span className="text-indigo-600">{getPersonaIcon(activePersona.icon, "h-3.5 w-3.5")}</span>
                <span className="text-[11px] font-semibold text-slate-600">{activePersona.name}</span>
              </div>
            )}
            
            {activeSession && activeSession.messages.length > 0 && (
              <>
                <button
                  onClick={exportChat}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                  title="Suhbatni yuklab olish"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Yuklash</span>
                </button>
                <button
                  onClick={clearSessionHistory}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 hover:border-rose-200 transition-all cursor-pointer"
                  title="Tarixni tozalash"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tozalash</span>
                </button>
              </>
            )}
          </div>
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

        {/* API not connected warning */}
        <AnimatePresence>
          {apiConnected === false && !error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-50 border-b border-amber-200 text-amber-800 px-6 py-3 text-sm flex items-center gap-2 shrink-0 font-medium"
            >
              <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
              <span>API kalit topilmadi. Vercel Dashboard → Settings → Environment Variables bo'limida <strong>GEMINI_API_KEY</strong> ni sozlang.</span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {!activeSession || activeSession.messages.length === 0 ? (
            /* Welcoming / Suggestion View */
            <div className="mx-auto max-w-3xl py-12 md:py-20 text-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xl shadow-indigo-600/10 mb-6"
              >
                {getPersonaIcon(activePersona.icon, "h-8 w-8")}
              </motion.div>
              
              <motion.h1 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800"
              >
                Men {activePersona.name}man
              </motion.h1>
              
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-sm text-slate-500 max-w-md mx-auto"
              >
                {activePersona.description}
              </motion.p>

              {/* Active Model Badge */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-1.5 shadow-sm"
              >
                <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600">{activeModel.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getBadgeClasses(activeModel.badgeColor)}`}>
                  {activeModel.badge}
                </span>
              </motion.div>
              {/* Persona Quick Chooser (Tabs) */}
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-wrap justify-center gap-2 max-w-xl mx-auto"
              >
                {PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => changeSessionPersona(p.id)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      activeSession?.persona === p.id 
                        ? 'bg-slate-800 text-white shadow-sm' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {getPersonaIcon(p.icon, "h-3.5 w-3.5")}
                    <span>{p.name}</span>
                  </button>
                ))}
              </motion.div>

              {/* Suggestion Prompts */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-12 text-left max-w-2xl mx-auto"
              >
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
                  <Compass className="h-4 w-4 text-slate-400" />
                  <span>Suhbatni boshlash uchun takliflar</span>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  {activePersona.suggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        setInput(suggestion);
                        handleSend(suggestion);
                      }}
                      className="flex flex-col justify-between items-start text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group duration-300 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-700 leading-relaxed">{suggestion}</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        Sinfda boshlash
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Chat Messages Timeline */
            <div className="mx-auto max-w-3xl space-y-6">
              {activeSession.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot Avatar (only on model side) */}
                    {!isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 border border-slate-200 shadow-sm">
                        {getPersonaIcon(activePersona.icon, "h-4.5 w-4.5")}
                      </div>
                    )}

                    {/* Message Bubble Container */}
                    <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                          isUser 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                        }`}
                      >
                        {/* Inline attached image preview */}
                        {msg.image && (
                          <div className="mb-3 max-w-sm overflow-hidden rounded-lg border border-indigo-200 bg-zinc-950">
                            <img 
                              src={msg.image.data} 
                              alt="Attached" 
                              className="max-h-[240px] w-auto object-contain block mx-auto"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Text content formatted */}
                        {isUser ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )}
                      </div>
                      
                      {/* Message Timestamp */}
                      <span className="mt-1 text-[10px] text-zinc-400 font-medium px-1">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* User Avatar (only on user side) */}
                    {isUser && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Bot thinking state */}
              {loading && (
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 border border-slate-200 shadow-sm">
                    {getPersonaIcon(activePersona.icon, "h-4.5 w-4.5 animate-pulse")}
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="rounded-2xl bg-white border border-slate-100 px-5 py-3.5 rounded-tl-none shadow-sm flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-400">AI o'ylamoqda</span>
                      <span className="flex items-center gap-0.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto">
            {/* Image attachment thumb */}
            {image && (
              <div className="flex items-center gap-3 border border-slate-200 border-b-0 p-3 bg-slate-50/50 rounded-t-2xl">
                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img 
                    src={image.data} 
                    alt="Attachment preview" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-white hover:bg-zinc-950 shadow cursor-pointer"
                    title="O'chirish"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-750">Rasm biriktirildi</p>
                  <p className="text-[10px] text-slate-400">Maksimal 5MB gacha</p>
                </div>
              </div>
            )}

            <div className={`flex items-center gap-4 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm ${
              image ? 'rounded-t-none' : ''
            }`}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Rasm yuklash (maksimal 5MB)"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={activePersona.placeholder}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 py-3 resize-none max-h-48 font-medium leading-relaxed"
              />

              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !image) || loading}
                className={`bg-indigo-600 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 h-10 w-10 cursor-pointer ${
                  (input.trim() || image) && !loading
                    ? 'hover:bg-indigo-700 shadow-indigo-200 active:scale-95'
                    : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5 transform rotate-90" />
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 mt-4">AI-Oshno xato qilishi mumkin. Muhim ma'lumotlarni tekshirib ko'ring.</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
