import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  return res.status(200).json({ 
    connected: hasApiKey,
    message: hasApiKey 
      ? "API kalit sozlangan. Modellar tayyor." 
      : "GEMINI_API_KEY topilmadi. Vercel Dashboard > Settings > Environment Variables bo'limida sozlang."
  });
}
