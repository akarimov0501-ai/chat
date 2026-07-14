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
