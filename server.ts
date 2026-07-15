import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: "20mb" }));

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

const PERSONA_INSTRUCTIONS: Record<string, string> = {
  general: "Siz foydali, aqlli va muloyim sun'iy intellekt yordamchisiz. Savollarga har doim aniq, batafsil va mantiqiy javob bering. Javobingizni o'zbek tilida taqdim eting, agar foydalanuvchi boshqa tilda so'ramagan bo'lsa. Matnni chiroyli formatlash uchun Markdown belgilash turlaridan (masalan, sarlavhalar, ro'yxatlar, qalin matn, jadvallar) keng foydalaning.",
  coder: "Siz tajribali, yuqori malakali dasturchisiz. Kod yozish, xatolarni tahlil qilish va dastur arxitekturasini loyihalashda mukammal yordam berasiz. Javoblaringizda doimo toza, tushunarli va izohli kod namunalarini keltiring. Mumkin qadar eng yaxshi amaliyotlarni (best practices) tushuntiring. Markdown yordamida kod bloklarini va tillarni to'g'ri ko'rsating (masalan, ```typescript, ```python, ```html, ```css).",
  writer: "Siz professional yozuvchi, shoir, kopirayter va tahrirchisiz. Hikoyalar, she'rlar, maqolalar, ijtimoiy tarmoq postlari va har qanday ijodiy matnlarni yozishda va tahrirlashda yordam berasiz. Til boyligingiz nihoyatda keng va jozibali. Matnlarni ta'sirchan, o'qishli va mukammal uslubda tayyorlab bering.",
  teacher: "Siz mehribon, sabr-toqatli va bilimdon o'qituvchisiz. Murakkab mavzularni oddiy, qiziqarli va hayotiy misollar yordamida tushuntirasiz. Savollarni bosqichma-bosqich o'rgatasiz va o'quvchini doimiy ravishda rag'batlantirib turasiz. Javoblarni tushunarli qilish uchun qisqa qismlarga bo'ling va yakunida tekshiruvchi savollar bering.",
  analyst: "Siz tajribali moliya, biznes va ma'lumotlar tahlilchisiz. Ma'lumotlarni chuqur tahlil qilish, jadvallar tuzish, tendensiyalarni aniqlash va strategik qarorlar qabul qilishda yordam berasiz. Javoblaringiz tahliliy, mantiqiy, dalillarga asoslangan bo'lib, xulosalarni aniq va tushunarli jadval yoki ro'yxat ko'rinishida taqdim eting.",
  designer: "You are an expert UI/UX designer and frontend developer. When the user describes a UI design, you MUST generate a COMPLETE, self-contained HTML page with all CSS included inline in <style> tags and any JavaScript in <script> tags. The design must be modern, responsive, visually stunning with gradients, shadows, animations, and professional typography (use Google Fonts via CDN link). Use vibrant colors and micro-animations. Return ONLY the HTML code wrapped in ```html code block. Do NOT add any explanation or description outside the code block. The HTML must be a complete document starting with <!DOCTYPE html>.",
  presentation_expert: "You are a professional presentation architect. When the user asks for a presentation on any topic, you MUST generate a JSON array of slides. Each slide must contain a 'title' (string), 'content' (array of strings, where each string is a concise bullet point summary of the slide's topic), and a 'bgGradient' (CSS class gradient like 'from-indigo-600 to-purple-600 text-white' or 'from-emerald-500 to-teal-700 text-white' or 'from-slate-900 to-slate-800 text-white'). Return ONLY the JSON data wrapped in ```json code block. Do NOT write any description or introduction before or after the code block. The JSON format must look like this: { \"title\": \"Presentation Title\", \"slides\": [ { \"title\": \"Slide Title\", \"content\": [\"Point 1\", \"Point 2\", \"Point 3\"], \"bgGradient\": \"gradient-class\" } ] }"
};

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemma-4-31b-it'
];

app.get("/api/models", (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    connected: hasApiKey,
    message: hasApiKey 
      ? "API kalit sozlangan. Modellar tayyor." 
      : "GEMINI_API_KEY topilmadi."
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, persona = "general", model = "gemini-3.5-flash", stream = false, openRouterKey = "" } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Suhbat tarixi yuborilmadi." });
    }

    const systemInstruction = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.general;

    // --- OpenRouter API ulanishi ---
    const openRouterApiKey = openRouterKey || process.env.OPENROUTER_API_KEY;
    const isOpenRouter = model.includes('/') || req.body.provider === 'openrouter';

    if (isOpenRouter) {
      if (!openRouterApiKey) {
        return res.status(400).json({ 
          error: "OpenRouter API Key topilmadi. Iltimos, Sozlamalar oynasida OpenRouter API kalitingizni kiriting." 
        });
      }

      const openRouterMessages = [
        { role: 'system', content: systemInstruction },
        ...messages.map((m: any) => {
          if (m.image && m.image.data) {
            const base64Data = m.image.data.split(",")[1] || m.image.data;
            return {
              role: m.role === 'user' ? 'user' : 'assistant',
              content: [
                { type: 'text', text: m.content },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${m.image.mimeType};base64,${base64Data}`
                  }
                }
              ]
            };
          }
          return {
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          };
        })
      ];

      if (stream) {
        const responseStream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-oshno.vercel.app',
            'X-Title': 'AI-Oshno'
          },
          body: JSON.stringify({
            model: model,
            messages: openRouterMessages,
            stream: true,
            temperature: 0.7
          })
        });

        if (!responseStream.ok) {
          const errText = await responseStream.text();
          throw new Error(`OpenRouter API xatoligi: ${errText}`);
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        res.write(`data: ${JSON.stringify({ meta: { model } })}\n\n`);

        const reader = responseStream.body;
        if (!reader) throw new Error('OpenRouter response body stream topilmadi');

        const decoder = new TextDecoder('utf-8');
        for await (const chunk of reader as any) {
          const textChunk = typeof chunk === 'string' ? chunk : decoder.decode(chunk);
          const lines = textChunk.split('\n');
          for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned.startsWith('data: ')) {
              const dataValue = cleaned.slice(6).trim();
              if (dataValue === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataValue);
                const deltaText = parsed.choices?.[0]?.delta?.content || '';
                if (deltaText) {
                  res.write(`data: ${JSON.stringify({ text: deltaText })}\n\n`);
                }
              } catch (e) {
                // parse error ignored
              }
            }
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-oshno.vercel.app',
            'X-Title': 'AI-Oshno'
          },
          body: JSON.stringify({
            model: model,
            messages: openRouterMessages,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API xatoligi: ${errText}`);
        }

        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content || "Kechirasiz, javob olishda xatolik yuz berdi.";
        return res.status(200).json({ reply: replyText, model });
      }
    }

    // --- Standart Gemini API ulanishi ---
    const ai = getGeminiClient();

    const contents = messages.map((msg: any) => {
      const parts: any[] = [];
      parts.push({ text: msg.content });
      
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

    const modelsToTry = [model, ...FALLBACK_MODELS.filter(m => m !== model)];

    if (stream) {
      let responseStream = null;
      let activeModel = model;
      let success = false;
      let lastError: any = null;

      for (const currentModel of modelsToTry) {
        try {
          responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });
          activeModel = currentModel;
          success = true;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${currentModel} stream failed, trying fallback...`, err);
        }
      }

      if (!success || !responseStream) {
        return res.status(500).json({ 
          error: `Barcha modellar band yoki xatolik yuz berdi. Oxirgi xatolik: ${lastError?.message || 'Noma\'lum'}` 
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      res.write(`data: ${JSON.stringify({ meta: { model: activeModel } })}\n\n`);

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Oddiy rejim (Fallback bilan)
    let response = null;
    let activeModel = model;
    let success = false;
    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });
        activeModel = currentModel;
        success = true;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${currentModel} failed, trying fallback...`, err);
      }
    }

    if (!success || !response) {
      return res.status(500).json({ 
        error: `Barcha modellar band yoki xatolik yuz berdi. Oxirgi xatolik: ${lastError?.message || 'Noma\'lum'}` 
      });
    }

    const replyText = response.text || "Kechirasiz, javob olishda xatolik yuz berdi.";
    res.json({ reply: replyText, model: activeModel });
  } catch (error: any) {
    console.error("Gemini/OpenRouter API error:", error);
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
