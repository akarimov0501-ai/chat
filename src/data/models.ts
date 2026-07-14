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
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Tez va samarali — kundalik vazifalar uchun ideal',
    badge: 'Tez',
    badgeColor: 'emerald'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Kuchli va aqlli — murakkab vazifalar uchun',
    badge: 'Pro',
    badgeColor: 'violet'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Oldingi avlod tez modeli — barqaror va ishonchli',
    badge: 'Barqaror',
    badgeColor: 'blue'
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Eng yengil model — oddiy va tez javoblar uchun',
    badge: 'Yengil',
    badgeColor: 'amber'
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    description: 'Eng yangi avlod — tezkor va yuqori sifatli',
    badge: 'Yangi',
    badgeColor: 'rose'
  },
];

/** Standart (default) model ID */
export const DEFAULT_MODEL_ID = 'gemini-2.5-flash';
