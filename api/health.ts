import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  return res.status(200).json({ 
    status: hasApiKey ? "ok" : "no_key",
    connected: hasApiKey, 
    time: new Date(),
    environment: "vercel"
  });
}
