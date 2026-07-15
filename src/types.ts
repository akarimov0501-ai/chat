export type PersonaType = 'general' | 'coder' | 'writer' | 'teacher' | 'analyst';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  image?: {
    data: string; // Base64 string
    mimeType: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  persona: PersonaType;
  model: string;
  createdAt: string;
}

export interface PersonaConfig {
  id: PersonaType;
  name: string;
  icon: string;
  description: string;
  systemInstruction: string;
  placeholder: string;
  suggestions: string[];
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
}

export interface DesignEntry {
  id: string;
  prompt: string;
  code: string;
  timestamp: string;
}

export interface Slide {
  id: string;
  title: string;
  content: string[];
  notes?: string;
  bgGradient?: string;
}

export interface PresentationEntry {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: string;
}
