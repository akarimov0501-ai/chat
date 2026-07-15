import { ModelConfig } from '../types';

/**
 * Gemini AI Modellar Ro'yxati
 * 
 * Bu faylda mavjud modellar ro'yxati saqlanadi.
 * Siz kerakli modellarni qo'shishingiz yoki o'chirishingiz mumkin.
 * 
 * Har bir model uchun:
 * - id:          API ga yuboriladigan model identifikatori
 * - name:        Foydalanuvchiga ko'rinadigan nom
 * - description: Qisqacha tavsif
 * - badge:       Kategoriya belgisi (UI da ko'rsatiladi)
 * - badgeColor:  Badge rangi (tailwind CSS ranglari)
 */
export const MODELS: ModelConfig[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    description: 'Eng yangi avlod — nihoyatda tezkor va yuqori sifatli',
    badge: 'Flagman',
    badgeColor: 'rose'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Yangi Gemini 3 arxitekturasining tezkor versiyasi (Preview)',
    badge: 'Yangi',
    badgeColor: 'violet'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Tez va resurs tejamkor model — kundalik yumushlar uchun',
    badge: 'Lite',
    badgeColor: 'emerald'
  },
  {
    id: 'gemma-4-31b-it',
    name: 'Gemma 4 31B',
    description: 'Ochiq kodli model — mantiqiy va ijodiy topshiriqlar uchun',
    badge: 'Gemma',
    badgeColor: 'blue'
  },
];

/** Standart (default) model ID */
export const DEFAULT_MODEL_ID = 'gemini-3.5-flash';
