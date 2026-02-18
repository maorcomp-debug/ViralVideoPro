/**
 * Server-side Gemini analysis – keeps API key secure (never exposed to client).
 * Client sends: systemInstruction, parts (text + optional base64 video/pdf).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

interface AnalyzeRequest {
  systemInstruction: string;
  parts: Array<
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
  >;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured. Set GEMINI_API_KEY in Vercel environment variables.',
    });
  }

  try {
    const { systemInstruction, parts } = req.body as AnalyzeRequest;
    if (!systemInstruction || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({ error: 'Missing systemInstruction or parts' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const jsonText = text.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(jsonText));
  } catch (err: any) {
    const code = err?.error?.code ?? err?.status ?? err?.code;
    const message = err?.message || err?.error?.message || 'Analysis failed';
    console.error('analyze API error:', code, message);
    return res.status(code === 403 ? 403 : 500).json({
      error: message,
      code: code || 500,
    });
  }
}
