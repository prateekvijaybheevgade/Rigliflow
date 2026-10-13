import { GoogleGenAI } from '@google/genai';

export const CANDIDATE_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
];

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateWithModelFallback(ai: GoogleGenAI, payload: any) {
  let lastError: any;
  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      const res = await ai.models.generateContent({
        ...payload,
        model,
      });
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Model ${model} encountered error, trying next candidate...`);
    }
  }
  throw lastError;
}

export function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleaned);
}
