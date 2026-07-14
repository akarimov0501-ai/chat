import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// dotenv faqat mavjud .env faylini yuklaydi.
// Vercel'da environment o'zgaruvchilari avtomatik inject qilinadi,
// shuning uchun alohida sozlash talab qilinmaydi.
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Body parser with size limit for base64 image uploads
app.use(express.json({ limit: "20mb" }));

// Lazy initializer for Gemini client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY topilmadi. Iltimos, Sozlamalar > Secrets panelida GEMINI_API_KEY kalitini kiriting.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// System instructions in Uzbek based on selected persona
const PERSONA_INSTRUCTIONS: Record<string, string> = {
  general: "Siz foydali, aqlli va muloyim sun'iy intellekt yordamchisiz. Savollarga har doim aniq, batafsil va mantiqiy javob bering. Javobingizni o'zbek tilida taqdim eting, agar foydalanuvchi boshqa tilda so'ramagan bo'lsa. Matnni chiroyli formatlash uchun Markdown belgilash turlaridan (masalan, sarlavhalar, ro'yxatlar, qalin matn, jadvallar) keng foydalaning.",
  coder: "Siz tajribali, yuqori malakali dasturchisiz. Kod yozish, xatolarni tahlil qilish va dastur arxitekturasini loyihalashda mukammal yordam berasiz. Javoblaringizda doimo toza, tushunarli va izohli kod namunalarini keltiring. Mumkin qadar eng yaxshi amaliyotlarni (best practices) tushuntiring. Markdown yordamida kod bloklarini va tillarni to'g'ri ko'rsating (masalan, ```typescript, ```python, ```html, ```css).",
  writer: "Siz professional yozuvchi, shoir, kopirayter va tahrirchisiz. Hikoyalar, she'rlar, maqolalar, ijtimoiy tarmoq postlari va har qanday ijodiy matnlarni yozishda va tahrirlashda yordam berasiz. Til boyligingiz nihoyatda keng va jozibali. Matnlarni ta'sirchan, o'qishli va mukammal uslubda tayyorlab bering.",
  teacher: "Siz mehribon, sabr-toqatli va bilimdon o'qituvchisiz. Murakkab mavzularni oddiy, qiziqarli va hayotiy misollar yordamida tushuntirasiz. Savollarni bosqichma-bosqich o'rgatasiz va o'quvchini doimiy ravishda rag'batlantirib turasiz. Javoblarni tushunarli qilish uchun qisqa qismlarga bo'ling va yakunida tekshiruvchi savollar bering.",
  analyst: "Siz tajribali moliya, biznes va ma'lumotlar tahlilchisiz. Ma'lumotlarni chuqur tahlil qilish, jadvallar tuzish, tendensiyalarni aniqlash va strategik qarorlar qabul qilishda yordam berasiz. Javoblaringiz tahliliy, mantiqiy, dalillarga asoslangan bo'lib, xulosalarni aniq va tushunarli jadval yoki ro'yxat ko'rinishida taqdim eting."
};

// Modellar ro'yxatini olish uchun endpoint
app.get("/api/models", (req, res) => {
  // Modellar ro'yxati frontend'da saqlanadi (src/data/models.ts).
  // Bu endpoint faqat API kalit mavjudligini tekshiradi.
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    connected: hasApiKey,
    message: hasApiKey 
      ? "API kalit sozlangan. Modellar tayyor." 
      : "GEMINI_API_KEY topilmadi. Vercel Dashboard > Settings > Environment Variables bo'limida sozlang."
  });
});

// API routes
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, persona = "general", model = "gemini-2.5-flash" } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Suhbat tarixi yuborilmadi." });
    }

    const ai = getGeminiClient();

    // Format messages for @google/genai SDK
    const contents = messages.map((msg) => {
      const parts: any[] = [];
      
      // Add text content
      parts.push({ text: msg.content });
      
      // Add inline image if present
      if (msg.image && msg.image.data) {
        // Strip data prefix if present (e.g. "data:image/png;base64,")
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
    res.json({ reply: replyText, model });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ 
      error: error.message || "Tizimda xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring." 
    });
  }
});

app.get("/api/health", (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    status: hasApiKey ? "ok" : "no_key",
    connected: hasApiKey, 
    time: new Date(),
    environment: process.env.VERCEL ? "vercel" : "local"
  });
});

// Vite middleware and static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Vite startup error:", err);
});
