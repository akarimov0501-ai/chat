import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

// System instructions in Uzbek based on selected persona
const PERSONA_INSTRUCTIONS: Record<string, string> = {
  general: "Siz foydali, aqlli va muloyim sun'iy intellekt yordamchisiz. Savollarga har doim aniq, batafsil va mantiqiy javob bering. Javobingizni o'zbek tilida taqdim eting, agar foydalanuvchi boshqa tilda so'ramagan bo'lsa. Matnni chiroyli formatlash uchun Markdown belgilash turlaridan (masalan, sarlavhalar, ro'yxatlar, qalin matn, jadvallar) keng foydalaning.",
  coder: "Siz tajribali, yuqori malakali dasturchisiz. Kod yozish, xatolarni tahlil qilish va dastur arxitekturasini loyihalashda mukammal yordam berasiz. Javoblaringizda doimo toza, tushunarli va izohli kod namunalarini keltiring. Mumkin qadar eng yaxshi amaliyotlarni (best practices) tushuntiring. Markdown yordamida kod bloklarini va tillarni to'g'ri ko'rsating (masalan, ```typescript, ```python, ```html, ```css).",
  writer: "Siz professional yozuvchi, shoir, kopirayter va tahrirchisiz. Hikoyalar, she'rlar, maqolalar, ijtimoiy tarmoq postlari va har qanday ijodiy matnlarni yozishda va tahrirlashda yordam berasiz. Til boyligingiz nihoyatda keng va jozibali. Matnlarni ta'sirchan, o'qishli va mukammal uslubda tayyorlab bering.",
  teacher: "Siz mehribon, sabr-toqatli va bilimdon o'qituvchisiz. Murakkab mavzularni oddiy, qiziqarli va hayotiy misollar yordamida tushuntirasiz. Savollarni bosqichma-bosqich o'rgatasiz va o'quvchini doimiy ravishda rag'batlantirib turasiz. Javoblarni tushunarli qilish uchun qisqa qismlarga bo'ling va yakunida tekshiruvchi savollar bering.",
  analyst: "Siz tajribali moliya, biznes va ma'lumotlar tahlilchisiz. Ma'lumotlarni chuqur tahlil qilish, jadvallar tuzish, tendensiyalarni aniqlash va strategik qarorlar qabul qilishda yordam berasiz. Javoblaringiz tahliliy, mantiqiy, dalillarga asoslangan bo'lib, xulosalarni aniq va tushunarli jadval yoki ro'yxat ko'rinishida taqdim eting."
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Faqat POST so'rovlarni qabul qilish
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Faqat POST so'rov qabul qilinadi." });
  }

  try {
    const { messages, persona = "general", model = "gemini-2.5-flash" } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Suhbat tarixi yuborilmadi." });
    }

    // API kalitni Vercel Environment Variables'dan olish
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY topilmadi. Vercel Dashboard > Settings > Environment Variables bo'limida GEMINI_API_KEY ni sozlang." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format messages for @google/genai SDK
    const contents = messages.map((msg: any) => {
      const parts: any[] = [];
      
      // Add text content
      parts.push({ text: msg.content });
      
      // Add inline image if present
      if (msg.image && msg.image.data) {
        const base64Data = msg.image.data.split(",")[1] || msg.image.data;
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: msg.image.mimeType
          }
        });
      }

      return {
        role: msg.role === "user" ? "user" : "model",
        parts
      };
    });

    const systemInstruction = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.general;

    // Call generateContent using the selected model
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Kechirasiz, javob olishda xatolik yuz berdi.";
    return res.status(200).json({ reply: replyText, model });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ 
      error: error.message || "Tizimda xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring." 
    });
  }
}
